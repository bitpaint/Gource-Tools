/**
 * Avatar Service
 * Manages fetching and caching contributor avatars, primarily from GitHub.
 */

const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const axios = require('axios');
const sharp = require('sharp');
const Logger = require('../utils/Logger');

// Add rate limiter
const rateLimiter = {
  lastRequest: 0,
  minDelay: 1000, // 1 second between requests
  async wait() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < this.minDelay) {
      await new Promise(resolve => setTimeout(resolve, this.minDelay - timeSinceLastRequest));
    }
    this.lastRequest = Date.now();
  }
};

// Create a component logger
const logger = Logger.createComponentLogger('AvatarService');

// Define the avatars directory path
const avatarsDir = path.join(__dirname, '../../avatars');
const badgeAssetsDir = path.join(__dirname, '../assets/badge');
const badgeMaskPath = path.join(badgeAssetsDir, 'badge_mask.png');
const badgeShadingPath = path.join(badgeAssetsDir, 'badge_shading.png');
const badgeOverlayPath = path.join(badgeAssetsDir, 'badge_overlay.png');

class AvatarService {
  constructor() {
    this.activeAvatarDownloads = new Set(); // Track active downloads per username
    this.activeBadgeTransformations = 0; // Track active badge transformations
    this.maxConcurrentBadgeTransformations = 3; // Limit concurrent transformations
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
   * Applies the badge effect to a downloaded avatar image using Sharp.
   * Overwrites the original image file.
   * @param {string} imagePath Path to the avatar image.
   */
  async applyBadgeTransformation(imagePath) {
    // Wait if too many transformations are already in progress
    while (this.activeBadgeTransformations >= this.maxConcurrentBadgeTransformations) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait before trying again
    }
    
    // Increment the counter for active transformations
    this.activeBadgeTransformations++;
    
    const badgeSize = 90; // Target size for the badge
    // Create sanitized temp filename to avoid Windows path issues with special chars
    const dirName = path.dirname(imagePath);
    const baseName = path.basename(imagePath);
    // Create a hash of the original filename to avoid special chars in temp paths
    const safeBaseName = Buffer.from(baseName).toString('base64').replace(/[/+=]/g, '_');
    const tempDir = path.join(dirName, 'temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      try {
        fs.mkdirSync(tempDir, { recursive: true });
      } catch (mkdirErr) {
        logger.warn(`[Avatars] Failed to create temp directory: ${mkdirErr.message}`);
        this.activeBadgeTransformations--;
        return;
      }
    }
    
    // Use sanitized temporary filenames in the temp directory
    const tempOutputPath = path.join(tempDir, `${safeBaseName}.png`);
    const tempMaskedPath = path.join(tempDir, `${safeBaseName}_masked.png`);
    const tempShadedPath = path.join(tempDir, `${safeBaseName}_shaded.png`);

    try {
        // Check if all required badge assets exist before proceeding
        if (!fs.existsSync(badgeMaskPath) || !fs.existsSync(badgeShadingPath) || !fs.existsSync(badgeOverlayPath)) {
            logger.warn(`[Avatars] Badge assets not found in ${badgeAssetsDir}. Skipping badge transformation for ${path.basename(imagePath)}.`);
            this.activeBadgeTransformations--;
            return; // Skip if assets are missing
        }

        // Check if the input file exists and is readable
        if (!fs.existsSync(imagePath)) {
            logger.warn(`[Avatars] Input file ${path.basename(imagePath)} does not exist. Skipping badge transformation.`);
            this.activeBadgeTransformations--;
            return;
        }

        // Step 1: First resize the avatar to appropriate size and ensure alpha channel
        await sharp(imagePath, {
            failOnError: false,
            limitInputPixels: 268402689
        })
        .resize(badgeSize, badgeSize, {
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy
        })
        .ensureAlpha()
        .png({ alpha: true })
        .toFile(tempOutputPath);

        // Step 2: Create a circular mask with transparency
        const maskSvg = Buffer.from(
            `<svg width="${badgeSize}" height="${badgeSize}" viewBox="0 0 ${badgeSize} ${badgeSize}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${badgeSize/2}" cy="${badgeSize/2}" r="${badgeSize/2}" fill="black"/>
            </svg>`
        );
        
        // Step 3: Apply the mask to create a circular cutout with transparency
        await sharp(tempOutputPath, {
            failOnError: false
        })
        .composite([{
            input: maskSvg,
            blend: 'dest-in'
        }])
        .png({ alpha: true })
        .toFile(tempMaskedPath);

        // Step 4: Apply the shading while preserving transparency
        await sharp(tempMaskedPath, {
            failOnError: false
        })
        .composite([{
            input: badgeShadingPath,
            blend: 'over'
        }])
        .png({ alpha: true })
        .toFile(tempShadedPath);

        // Step 5: Apply the overlay and save as final PNG with transparency
        await sharp(tempShadedPath, {
            failOnError: false
        })
        .composite([{
            input: badgeOverlayPath,
            blend: 'over'
        }])
        .png({ 
            alpha: true,
            compressionLevel: 9,
            adaptiveFiltering: true,
            force: true
        })
        .toFile(tempOutputPath);

        // Clean up intermediate files
        try {
            if (fs.existsSync(tempMaskedPath)) {
                fs.unlinkSync(tempMaskedPath);
            }
            if (fs.existsSync(tempShadedPath)) {
                fs.unlinkSync(tempShadedPath);
            }
        } catch (cleanupError) {
            logger.warn(`[Avatars] Failed to clean up intermediate files: ${cleanupError.message}`);
            // Non-fatal, continue
        }

        // Replace the original file with the transformed one
        await fsp.rename(tempOutputPath, imagePath);
        logger.info(`[Avatars] Applied badge transformation to ${path.basename(imagePath)}`);

    } catch (error) {
        logger.error(`[Avatars] Failed to apply badge transformation to ${path.basename(imagePath)}: ${error.message}`);
        
        // Clean up all temporary files
        try {
            const filesToCleanup = [
                tempOutputPath,
                tempMaskedPath,
                tempShadedPath
            ];
            
            for (const file of filesToCleanup) {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                }
            }
        } catch (cleanupError) {
            logger.warn(`[Avatars] Failed to cleanup temp files: ${cleanupError.message}`);
        }
        
        // If the original file still exists after failure, keep it.
        if (!fs.existsSync(imagePath)) {
            logger.warn(`[Avatars] Original file ${path.basename(imagePath)} was lost during failed badge transformation.`);
        }
    } finally {
        // Always decrement the counter when done, whether successful or not
        this.activeBadgeTransformations--;
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
      .catch(err => {
        logger.error(`[Avatars] Background avatar download process failed for log: ${path.basename(logFilePath)}: ${err.message}`);
        // Include stack trace for debugging purposes
        logger.error(`[Avatars] Stack trace: ${err.stack || 'No stack trace available'}`);
      });
  }

  /**
   * Extracts unique usernames from a Gource log file and downloads their GitHub avatars.
   * @param {string} logFilePath Path to the Gource log file.
   * @returns {Promise<void>}
   */
  async downloadContributorAvatars(logFilePath) {
    logger.info(`[Avatars] Starting avatar download process for: ${logFilePath}`);
    let usernames = new Set();
    const processedUsernames = new Set(); // Track processed usernames in memory

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
      const maxConcurrentDownloads = 3; // Reduced from 10 to 3
      let currentDownloads = 0;
      let totalChecked = 0;
      let alreadyExists = 0;
      let newlyDownloaded = 0; 
      let failedDownloads = 0;

      const usernameArray = Array.from(usernames);
      
      for (const username of usernameArray) {
        totalChecked++;
        
        // Skip if already processed in this session
        if (processedUsernames.has(username)) {
          continue;
        }
        processedUsernames.add(username);

        // Basic validation: Skip potentially invalid usernames
        if (!username || username.includes('/') || username.includes('\\')) {
            logger.warn(`[Avatars] Skipping potentially invalid username: "${username}"`);
            failedDownloads++;
            continue;
        }
          
        // Skip if this username's avatar is already being downloaded
        if (this.activeAvatarDownloads.has(username)) {
          logger.debug(`[Avatars] Download for ${username} is already active. Skipping.`);
          continue; 
        }

        // Clean up username for GitHub URL
        const originalUsername = username;
        const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_-]/gi, '');
        
        // Check for existing avatar in a single operation
        const targetPath = path.join(avatarsDir, `${originalUsername}.png`);
        if (fs.existsSync(targetPath)) {
          alreadyExists++;
          continue;
        }
        
        // Add to active downloads
        this.activeAvatarDownloads.add(username);

        // Limit concurrency
        while (currentDownloads >= maxConcurrentDownloads) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        currentDownloads++;
        
        // Add download promise to the list
        downloadPromises.push(
          (async () => {
            try {
              // Wait for rate limiter
              await rateLimiter.wait();
              
              // Try original username first
              const avatarUrl = `https://github.com/${originalUsername}.png`;
              const response = await axios({ 
                method: 'get', 
                url: avatarUrl, 
                responseType: 'stream',
                timeout: 15000,
                validateStatus: status => status === 200
              });

              // Pipe stream to file
              const writer = fs.createWriteStream(targetPath);
              response.data.pipe(writer);

              return new Promise((resolve, reject) => {
                writer.on('finish', async () => {
                  try {
                    await this.applyBadgeTransformation(targetPath);
                    resolve({ success: true, username: originalUsername });
                  } catch (badgeError) {
                    logger.error(`[Avatars] Badge transformation failed for ${originalUsername}: ${badgeError.message}`);
                    resolve({ success: false, username: originalUsername });
                  }
                });
                writer.on('error', reject);
                response.data.on('error', reject);
              });
            } catch (error) {
              if (error.response?.status === 404 && cleanUsername !== originalUsername) {
                // Try cleaned username if original fails
                try {
                  await rateLimiter.wait();
                  const cleanedUrl = `https://github.com/${cleanUsername}.png`;
                  const response = await axios({ 
                    method: 'get', 
                    url: cleanedUrl, 
                    responseType: 'stream',
                    timeout: 15000,
                    validateStatus: status => status === 200
                  });

                  const writer = fs.createWriteStream(targetPath);
                  response.data.pipe(writer);

                  return new Promise((resolve, reject) => {
                    writer.on('finish', async () => {
                      try {
                        await this.applyBadgeTransformation(targetPath);
                        resolve({ success: true, username: cleanUsername });
                      } catch (badgeError) {
                        logger.error(`[Avatars] Badge transformation failed for ${cleanUsername}: ${badgeError.message}`);
                        resolve({ success: false, username: cleanUsername });
                      }
                    });
                    writer.on('error', reject);
                    response.data.on('error', reject);
                  });
                } catch (cleanedError) {
                  throw error;
                }
              }
              throw error;
            }
          })()
          .then(({ success, username }) => {
            if (success) {
              newlyDownloaded++;
              logger.info(`[Avatars] Successfully downloaded and badged avatar for ${username}`);
            }
          })
          .catch(error => {
            failedDownloads++;
            if (error.response?.status === 404) {
              logger.warn(`[Avatars] Avatar not found for ${originalUsername} (404)`);
            } else {
              logger.error(`[Avatars] Failed to download avatar for ${originalUsername}: ${error.message}`);
            }
          })
          .finally(() => {
            currentDownloads--;
            this.activeAvatarDownloads.delete(username);
          })
        );
      }

      // Wait for all download promises
      await Promise.allSettled(downloadPromises);
      
      logger.success(`[Avatars] Download process finished for ${path.basename(logFilePath)}. Checked: ${totalChecked}, Already Existed: ${alreadyExists}, Newly Downloaded: ${newlyDownloaded}, Failed/Skipped: ${failedDownloads}`);

    } catch (error) {
      logger.error(`[Avatars] Critical error processing avatars for ${logFilePath}: ${error.message}`);
      usernames.forEach(u => this.activeAvatarDownloads.delete(u));
    }
  }
}

// Create and export a singleton instance
module.exports = new AvatarService(); 