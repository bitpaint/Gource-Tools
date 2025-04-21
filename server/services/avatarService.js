/**
 * Avatar Service
 * Manages fetching and caching contributor avatars, primarily from GitHub.
 */

const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const axios = require('axios');
const Logger = require('../utils/Logger');

// Create a component logger
const logger = Logger.createComponentLogger('AvatarService');

// Define the avatars directory path
const avatarsDir = path.join(__dirname, '../../avatars');

class AvatarService {
  constructor() {
    this.activeAvatarDownloads = new Set(); // Track active downloads per username
    this.ensureAvatarDirectory();
  }

  /**
   * Ensure the avatars directory exists.
   */
  async ensureAvatarDirectory() {
    try {
      if (!fs.existsSync(avatarsDir)) {
        await fsp.mkdir(avatarsDir, { recursive: true });
        logger.file(`Created avatars directory: ${avatarsDir}`);
      }
    } catch (error) {
      logger.error(`Failed to create avatars directory: ${error.message}`);
      // Depending on requirements, we might want to throw here
    }
  }

  /**
   * Helper function to initiate avatar downloads based on a Gource log file,
   * without blocking the main thread calling it.
   * @param {string} logFilePath Path to the Gource log file.
   */
  triggerAvatarDownloads(logFilePath) {
    logger.info(`[Avatars] Triggering avatar download check for log: ${path.basename(logFilePath)}`);
    // Run in background, don't await this promise
    this.downloadContributorAvatars(logFilePath)
      .then(() => logger.info(`[Avatars] Background avatar download process completed for log: ${path.basename(logFilePath)}`))
      .catch(err => logger.error(`[Avatars] Background avatar download process failed for log: ${path.basename(logFilePath)}: ${err.message}`));
  }

  /**
   * Extracts unique usernames from a Gource log file and downloads their GitHub avatars.
   * @param {string} logFilePath Path to the Gource log file.
   * @returns {Promise<void>}
   */
  async downloadContributorAvatars(logFilePath) {
    logger.info(`[Avatars] Starting avatar download process for: ${logFilePath}`);
    let usernames = new Set();

    try {
      // Ensure avatars directory exists (redundant check, but safe)
      await this.ensureAvatarDirectory();

      // Read the log file content
      const logContent = await fsp.readFile(logFilePath, 'utf8');
      const lines = logContent.split('\n');
      
      // Extract unique usernames (second field in timestamp|user|type|file)
      lines.forEach(line => {
        if (line.trim() !== '') {
          const parts = line.split('|');
          // Ensure the username part exists and is not empty
          if (parts.length > 1 && parts[1] && parts[1].trim()) { 
            usernames.add(parts[1].trim());
          }
        }
      });

      if (usernames.size === 0) {
        logger.info(`[Avatars] No valid usernames found in log file: ${logFilePath}`);
        return;
      }

      logger.info(`[Avatars] Found ${usernames.size} unique usernames in ${path.basename(logFilePath)}. Starting downloads...`);

      const downloadPromises = [];
      const maxConcurrentDownloads = 10; // Limit concurrent downloads
      let currentDownloads = 0;
      let totalChecked = 0;
      let alreadyExists = 0;
      let newlyDownloaded = 0; 
      let failedDownloads = 0;

      const usernameArray = Array.from(usernames);
      
      for (const username of usernameArray) {
        totalChecked++;
        // Basic validation: Skip potentially invalid usernames (e.g., empty, containing slashes)
        if (!username || username.includes('/') || username.includes('\\')) {
            logger.warn(`[Avatars] Skipping potentially invalid username: "${username}"`);
            failedDownloads++;
            continue;
        }
          
        // Skip if this username's avatar is already being downloaded by this service instance
        if (this.activeAvatarDownloads.has(username)) {
          logger.debug(`[Avatars] Download for ${username} is already active by this instance. Skipping.`);
          continue; 
        }

        // Clean up username for GitHub URL
        // 1. Try the original username first
        const originalUsername = username;
        // 2. Try a cleaned version (no spaces, special chars) as fallback
        const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_-]/gi, '');
        
        // Define potential target paths (png is default)
        // Still save file with original username to match what's in the log
        const targetPathPng = path.join(avatarsDir, `${originalUsername}.png`);
        const targetPathJpg = path.join(avatarsDir, `${originalUsername}.jpg`);
        const targetPathJpeg = path.join(avatarsDir, `${originalUsername}.jpeg`);
        const targetPathGif = path.join(avatarsDir, `${originalUsername}.gif`);

        // Check if any avatar format already exists locally
        if (fs.existsSync(targetPathPng) || fs.existsSync(targetPathJpg) || fs.existsSync(targetPathJpeg) || fs.existsSync(targetPathGif)) {
          // logger.debug(`[Avatars] Avatar for ${username} already exists locally. Skipping.`);
          alreadyExists++;
          continue; 
        }
        
        // Add to active downloads for this instance
        this.activeAvatarDownloads.add(username);

        // Limit concurrency
        while (currentDownloads >= maxConcurrentDownloads) {
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait before trying again
        }
        
        currentDownloads++;
        
        // Try both original username and cleaned version (first original, then cleaned if original fails)
        const downloadWithFallback = async () => {
          try {
            // First attempt with original username
            const avatarUrl = `https://github.com/${originalUsername}.png`;
            const response = await axios({ 
              method: 'get', 
              url: avatarUrl, 
              responseType: 'stream',
              timeout: 15000, // 15 second timeout
              validateStatus: status => status === 200 // Only accept 200 OK
            });
            return { response, usedUsername: originalUsername };
          } catch (error) {
            // If original fails with 404 and we have a different cleaned username, try that
            if (error.response?.status === 404 && cleanUsername && cleanUsername !== originalUsername) {
              try {
                const avatarUrl = `https://github.com/${cleanUsername}.png`;
                const response = await axios({ 
                  method: 'get', 
                  url: avatarUrl, 
                  responseType: 'stream',
                  timeout: 15000,
                  validateStatus: status => status === 200
                });
                return { response, usedUsername: cleanUsername };
              } catch (cleanedError) {
                // Both attempts failed, rethrow the original error
                throw error;
              }
            } else {
              // Not a 404 or no fallback available, rethrow
              throw error;
            }
          }
        };
        
        // Add download promise to the list
        downloadPromises.push(
          downloadWithFallback()
          .then(({ response, usedUsername }) => {
            // Determine final path based on actual content type or redirect URL
            const contentType = response.headers['content-type'];
            const finalUrl = response.request.res.responseUrl || `https://github.com/${usedUsername}.png`;
            let finalTargetPath = targetPathPng; // Default to png

            if (contentType?.includes('jpeg') || finalUrl.toLowerCase().endsWith('.jpg') || finalUrl.toLowerCase().endsWith('.jpeg')) {
                finalTargetPath = targetPathJpg;
            } else if (contentType?.includes('gif') || finalUrl.toLowerCase().endsWith('.gif')) {
                finalTargetPath = targetPathGif;
            } else if (!contentType?.includes('png') && !finalUrl.toLowerCase().endsWith('.png')) {
                 // If not explicitly PNG, JPEG, or GIF based on header/URL, assume PNG but log a warning
                 logger.warn(`[Avatars] Unexpected content type '${contentType}' or URL '${finalUrl}' for ${originalUsername}. Assuming PNG.`);
            }

            // Re-check existence with the determined final path
            if (fs.existsSync(finalTargetPath)) {
                 logger.debug(`[Avatars] Avatar for ${originalUsername} already exists at ${path.basename(finalTargetPath)}. Skipping write.`);
                 return Promise.resolve({ skipped: true }); 
            }
            
            // Pipe stream to file
            const writer = fs.createWriteStream(finalTargetPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
              writer.on('finish', () => resolve({ 
                skipped: false, 
                usedUsername,
                originalUsername 
              }));
              writer.on('error', reject);
              // Add stream error handling
              response.data.on('error', (streamError) => {
                  logger.error(`[Avatars] Stream error downloading for ${originalUsername}: ${streamError.message}`);
                  reject(streamError);
              });
            });
          })
          .then(({ skipped, usedUsername, originalUsername }) => {
            if (!skipped) {
              newlyDownloaded++;
              if (usedUsername !== originalUsername) {
                logger.info(`Downloaded avatar for ${originalUsername} (using GitHub username: ${usedUsername})`);
              } else {
                logger.info(`Downloaded avatar for ${originalUsername}`);
              }
            } else {
              alreadyExists++; // Count it as existing if skipped during write
            }
          })
          .catch(error => {
            failedDownloads++;
            if (error.response && error.response.status === 404) {
              // Only show the username in the logs, not the full name
              logger.warn(`[Avatars] Avatar not found for ${originalUsername} (404)`);
            } else if (axios.isCancel(error)) {
              logger.warn(`[Avatars] Download timed out for ${originalUsername}`);
            } else {
              logger.error(`[Avatars] Failed to download avatar for ${originalUsername}: ${error.message}`);
            }
          })
          .finally(() => {
            currentDownloads--;
            // Remove from active downloads once completed or failed for this instance
            this.activeAvatarDownloads.delete(username);
          })
        );
      } // End loop over usernames

      // Wait for all download promises initiated in this run to settle
      await Promise.allSettled(downloadPromises);
      
      logger.success(`[Avatars] Download process finished for ${path.basename(logFilePath)}. Checked: ${totalChecked}, Already Existed: ${alreadyExists}, Newly Downloaded: ${newlyDownloaded}, Failed/Skipped: ${failedDownloads}`);

    } catch (error) {
      logger.error(`[Avatars] Critical error processing avatars for ${logFilePath}: ${error.message}`);
      // Attempt to clean up active downloads set for this instance on critical failure
      usernames.forEach(u => this.activeAvatarDownloads.delete(u));
    }
  }
}

// Create and export a singleton instance
module.exports = new AvatarService(); 