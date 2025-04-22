/**
 * Avatar Service
 * Manages fetching and caching contributor avatars, primarily from GitHub,
 * using a global queue to prevent duplicate requests and rate issues.
 * Optimized to work with GitHub usernames from log files.
 */

const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const axios = require('axios');
const sharp = require('sharp');
const Logger = require('../utils/Logger');

// Create a component logger
const logger = Logger.createComponentLogger('AvatarService');

// Define the avatars directory path
const avatarsDir = path.join(__dirname, '../../avatars');
const badgeAssetsDir = path.join(__dirname, '../assets/badge');
const badgeMaskPath = path.join(badgeAssetsDir, 'badge_mask.png');
const badgeShadingPath = path.join(badgeAssetsDir, 'badge_shading.png');
const badgeOverlayPath = path.join(badgeAssetsDir, 'badge_overlay.png');

// --- Global State for Queue Management ---
const globalAvatarQueue = []; // Stores { username, targetPath }
const globalPendingAvatars = new Set(); // Tracks usernames currently in queue or being processed
let isProcessingQueue = false;
let queueIntervalId = null;
let activeDownloads = 0; // Count of currently active download+badge operations
const DOWNLOAD_CONCURRENCY = 3; // Max simultaneous downloads
const DOWNLOAD_DELAY = 150; // Milliseconds delay between starting downloads
const QUEUE_CHECK_INTERVAL = 500; // Milliseconds interval to check the queue
// --- End Global State ---

class AvatarService {
  constructor() {
    // Shared state is now global, constructor might do less or other setup if needed
    this.maxConcurrentBadgeTransformations = 3; // Limit concurrent badge transformations
    this.activeBadgeTransformations = 0; // Track active badge transformations
    this.ensureAvatarDirectory();
  }

  /**
   * Ensure the avatars directory exists.
   */
  async ensureAvatarDirectory() {
    try {
      // Check existence synchronously first for performance
      if (!fs.existsSync(avatarsDir)) {
        await fsp.mkdir(avatarsDir, { recursive: true });
        logger.file(`Created avatars directory: ${avatarsDir}`);
      }
    } catch (error) {
      logger.error(`Failed to create avatars directory: ${error.message}`);
      // Consider if this should be a fatal error for the service
    }
  }

  /**
   * Applies the badge effect to a downloaded avatar image using Sharp.
   * Overwrites the original image file.
   * @param {string} imagePath Path to the avatar image.
   * @returns {Promise<void>} A promise that resolves when transformation is done or fails.
   */
  async applyBadgeTransformation(imagePath) {
    // Wait if too many transformations are already in progress
    while (this.activeBadgeTransformations >= this.maxConcurrentBadgeTransformations) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait before trying again
    }
    
    // Increment the counter for active transformations
    this.activeBadgeTransformations++;
    
    const badgeSize = 90; // Target size for the badge
    const dirName = path.dirname(imagePath);
    const baseName = path.basename(imagePath);
    // Use a safe temp name based on the original filename to avoid issues
    const safeBaseName = Buffer.from(baseName).toString('base64').replace(/[/+=]/g, '_');
    const tempDir = path.join(dirName, 'temp_badge'); // Dedicated temp dir for badging
    
    // Ensure temp directory exists
    try {
      // Make sure parent directory exists 
      await fsp.mkdir(dirName, { recursive: true }).catch(err => {
        /* ignore if exists */ 
      });
      
      // Then ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        await fsp.mkdir(tempDir, { recursive: true });
      }
    } catch (mkdirErr) {
      logger.warn(`[Avatars] Failed to create temp badge directory: ${mkdirErr.message}`);
      this.activeBadgeTransformations--;
      // Re-throw or return specific error? For now, just return to avoid blocking queue.
      return Promise.reject(new Error(`Failed to create temp badge directory: ${mkdirErr.message}`));
    }
    
    // Use sanitized temporary filenames in the temp directory
    const tempOutputPath = path.join(tempDir, `${safeBaseName}_output.png`);
    const tempMaskedPath = path.join(tempDir, `${safeBaseName}_masked.png`);
    const tempShadedPath = path.join(tempDir, `${safeBaseName}_shaded.png`);
    // Final temp path before replacing original
    const finalTempPath = path.join(tempDir, `${safeBaseName}_final.png`);

    try {
      // Check if all required badge assets exist before proceeding
      const assetsExist = fs.existsSync(badgeMaskPath) && fs.existsSync(badgeShadingPath) && fs.existsSync(badgeOverlayPath);
      if (!assetsExist) {
          logger.warn(`[Avatars] Badge assets not found in ${badgeAssetsDir}. Skipping badge transformation for ${baseName}.`);
          this.activeBadgeTransformations--;
          return Promise.resolve(); // Resolve silently, no badge applied
      }

      // Check if the input file exists and is readable
      if (!fs.existsSync(imagePath)) {
          logger.warn(`[Avatars] Input file ${baseName} does not exist before badge transformation. Skipping.`);
          this.activeBadgeTransformations--;
          return Promise.resolve(); // Resolve silently
      }

      // Step 1: Resize, ensure alpha, save to temp output
      await sharp(imagePath, { failOnError: false })
          .resize(badgeSize, badgeSize, { fit: sharp.fit.cover, position: sharp.strategy.entropy })
      .ensureAlpha()
      .png({ alpha: true })
      .toFile(tempOutputPath);

      // Step 2: Create circular mask SVG
      const maskSvg = Buffer.from(
          `<svg width="${badgeSize}" height="${badgeSize}" viewBox="0 0 ${badgeSize} ${badgeSize}" xmlns="http://www.w3.org/2000/svg"><circle cx="${badgeSize/2}" cy="${badgeSize/2}" r="${badgeSize/2}" fill="black"/></svg>`
      );

      // Step 3: Apply mask
      await sharp(tempOutputPath, { failOnError: false })
          .composite([{ input: maskSvg, blend: 'dest-in' }])
      .png({ alpha: true })
      .toFile(tempMaskedPath);

      // Step 4: Apply shading
      await sharp(tempMaskedPath, { failOnError: false })
          .composite([{ input: badgeShadingPath, blend: 'over' }])
      .png({ alpha: true })
      .toFile(tempShadedPath);

      // Step 5: Apply overlay, save to final temp path
      await sharp(tempShadedPath, { failOnError: false })
          .composite([{ input: badgeOverlayPath, blend: 'over' }])
          .png({ alpha: true, compressionLevel: 9, adaptiveFiltering: true, force: true })
          .toFile(finalTempPath);

      // Replace the original file with the final transformed one
      await fsp.rename(finalTempPath, imagePath);
      logger.info(`[Avatars] Applied badge transformation to ${baseName}`);
      
    } catch (error) {
      logger.error(`[Avatars] Failed to apply badge transformation to ${baseName}: ${error.message}`);
      // Don't reject here, just log the error, keep original file if possible
      // Ensure the original file wasn't lost if the rename failed mid-way or similar
      if (!fs.existsSync(imagePath)) {
        logger.warn(`[Avatars] Original file ${baseName} seems to be missing after failed badge transformation.`);
        // Attempt to restore from temp if possible? Maybe too complex.
      }
    } finally {
      // Always decrement the counter
      this.activeBadgeTransformations--;

      // Clean up all temporary files related to this transformation
      const filesToCleanup = [tempOutputPath, tempMaskedPath, tempShadedPath, finalTempPath];
      for (const file of filesToCleanup) {
        try {
          if (fs.existsSync(file)) {
            await fsp.unlink(file);
          }
        } catch (cleanupError) {
          logger.warn(`[Avatars] Failed to clean up temp badge file ${path.basename(file)}: ${cleanupError.message}`);
        }
      }
      // Attempt to remove the temp directory if empty, ignore errors
      try {
        if (fs.existsSync(tempDir)) {
          const files = await fsp.readdir(tempDir);
          if (files.length === 0) {
            await fsp.rmdir(tempDir);
          }
        }
      } catch (rmdirError) {
        // Ignore error during temp dir cleanup
      }
    }
    // Return a resolved promise as the operation (attempt) is complete from caller's perspective
    return Promise.resolve();
  }

  /**
   * Entry point: Reads a log file, extracts usernames, and queues them for download if needed.
   * Optimized to work with GitHub usernames.
   * @param {string} logFilePath Path to the Gource log file.
   */
  triggerAvatarDownloads(logFilePath) {
    logger.info(`[Avatars] Triggering avatar download check for log: ${path.basename(logFilePath)}`);
    // Run queuing in background
    this.queueAvatarsForDownload(logFilePath)
      .then(queuedCount => {
          if (queuedCount > 0) {
              logger.info(`[Avatars] Queued ${queuedCount} new GitHub avatars for download from log: ${path.basename(logFilePath)}`);
          } else {
              logger.info(`[Avatars] No new avatars needed or queued from log: ${path.basename(logFilePath)}`);
          }
      })
      .catch(err => {
        logger.error(`[Avatars] Failed to queue avatars for log: ${path.basename(logFilePath)}: ${err.message}`);
        logger.error(`[Avatars] Stack trace: ${err.stack || 'No stack trace available'}`);
      });
  }

  /**
   * Reads log, extracts usernames, checks existence/pending status, and queues.
   * This method assumes usernames in logs are GitHub usernames.
   * @param {string} logFilePath
   * @returns {Promise<number>} Promise resolving with the count of newly queued avatars.
   */
  async queueAvatarsForDownload(logFilePath) {
    let usernames = new Set();
    let newlyQueuedCount = 0;
    let invalidUsernames = 0;

    try {
      await this.ensureAvatarDirectory(); // Ensure directory exists

      const logContent = await fsp.readFile(logFilePath, 'utf8');
      const lines = logContent.split('\n');

      lines.forEach(line => {
        if (line.trim() !== '') {
          const parts = line.split('|');
          if (parts.length > 1 && parts[1] && parts[1].trim()) {
            // In new format, this should be a GitHub username directly
            const githubUsername = parts[1].trim();
            
            // Basic validation - only queue usernames that look like GitHub usernames
            // Use GitHub's username requirements (alphanumeric and hyphens)
            if (githubUsername && githubUsername.length >= 1 && 
                githubUsername.length <= 39 && 
                /^[a-zA-Z0-9-]+$/.test(githubUsername)) {
              // Add any valid GitHub username to the set (we'll validate with a request)
              usernames.add(githubUsername);
            } else {
              invalidUsernames++;
              logger.debug(`[Avatars] Skipping invalid GitHub username format: "${githubUsername}"`);
            }
          }
        }
      });

      if (usernames.size === 0) {
        logger.info(`[Avatars] No valid GitHub usernames found to process in log file: ${logFilePath} (invalid: ${invalidUsernames})`);
        return 0;
      }

      logger.info(`[Avatars] Found ${usernames.size} unique GitHub usernames in ${path.basename(logFilePath)}. Skipped ${invalidUsernames} invalid username formats. Checking queue status...`);

      for (const githubUsername of usernames) {
        const targetPathPng = path.join(avatarsDir, `${githubUsername}.png`);

        // 1. Check if file already exists locally
        if (fs.existsSync(targetPathPng)) {
          // logger.debug(`[Avatars] Avatar for GitHub user "${githubUsername}" already exists locally. Skipping queue.`);
          continue;
        }

        // 2. Check if already pending/in queue
        if (globalPendingAvatars.has(githubUsername)) {
          // logger.debug(`[Avatars] Avatar for GitHub user "${githubUsername}" is already pending or being processed. Skipping queue.`);
          continue;
        }

        // 3. Add to pending set and queue
        globalPendingAvatars.add(githubUsername);
        globalAvatarQueue.push({ 
          username: githubUsername,
          targetPath: targetPathPng 
        });
        newlyQueuedCount++;
        // logger.debug(`[Avatars] Queued GitHub avatar download for: "${githubUsername}"`);
      }

      // Ensure the processor is running if we added items or if it wasn't running
      if (newlyQueuedCount > 0 || !isProcessingQueue) {
          this.ensureQueueProcessorRunning();
      }
      return newlyQueuedCount;

    } catch (error) {
      logger.error(`[Avatars] Critical error processing log file ${logFilePath} for queuing GitHub avatars: ${error.message}`);
      // Re-throw or handle? Re-throwing for now.
      throw error;
    }
  }

  /**
   * Starts the queue processor interval if it's not already running.
   */
  ensureQueueProcessorRunning() {
    if (isProcessingQueue) {
      return; // Already running
    }
    isProcessingQueue = true;
    activeDownloads = 0; // Reset active downloads count when starting processor
    logger.info('[Avatars] Starting GitHub avatar download queue processor.');
    queueIntervalId = setInterval(this.processAvatarQueue.bind(this), QUEUE_CHECK_INTERVAL);
  }

  /**
   * Processes the global avatar queue, respecting concurrency limits and delays.
   */
  async processAvatarQueue() {
    // logger.debug(`[Avatars] Processing queue. Active: ${activeDownloads}, Queue Size: ${globalAvatarQueue.length}`);

    // Check if we should stop the processor
    if (globalAvatarQueue.length === 0 && activeDownloads === 0) {
      if (isProcessingQueue && queueIntervalId) {
        logger.info('[Avatars] GitHub avatar download queue is empty and all downloads finished. Stopping processor.');
        clearInterval(queueIntervalId);
        queueIntervalId = null;
        isProcessingQueue = false;
        // Log final stats maybe?
      }
      return;
    }

    // Process items while concurrency limit allows and queue has items
    while (activeDownloads < DOWNLOAD_CONCURRENCY && globalAvatarQueue.length > 0) {
      const item = globalAvatarQueue.shift();
      if (!item) continue; // Should not happen, but safety check

      activeDownloads++;
      
      // Log the username being processed
      const logMsg = `[Avatars] Starting download for GitHub user "${item.username}" (${activeDownloads}/${DOWNLOAD_CONCURRENCY} active, ${globalAvatarQueue.length} left)`;
      
      logger.info(logMsg);

      // Introduce delay before starting the actual download+badge process
      await new Promise(resolve => setTimeout(resolve, DOWNLOAD_DELAY));

      // Start the download and badge process (don't await the entire chain here)
      this.downloadAndBadgeAvatar(item.username, item.targetPath)
        .then(() => {
          // logger.debug(`[Avatars] Successfully processed GitHub avatar for "${item.username}"`);
          // Success is handled in finally
        })
        .catch(error => {
          // Log specific errors from download/badge failure
          logger.warn(`[Avatars] Failed to process avatar for GitHub user "${item.username}": ${error.message}`);
        })
        .finally(() => {
          activeDownloads--;
          // Remove from pending *after* completion or failure
          globalPendingAvatars.delete(item.username);
          
          // logger.debug(`[Avatars] Finished processing GitHub avatar for "${item.username}". Active downloads: ${activeDownloads}`);
          // No need to immediately trigger next check, interval will handle it.
        });
    }
  }

  /**
   * Downloads a single avatar image from GitHub and applies the badge effect.
   * This is called by the queue processor.
   * @param {string} githubUsername The GitHub username.
   * @param {string} targetPath The full path where the final PNG should be saved.
   * @returns {Promise<void>} A promise that resolves on success, rejects on failure.
   */
  async downloadAndBadgeAvatar(githubUsername, targetPath) {
    // For GitHub usernames, we can directly construct the avatar URL
    const tempDownloadPath = targetPath + '.tmp'; // Temporary download location
    
    // Direct GitHub avatar URL is the most reliable format
    const avatarUrl = `https://github.com/${githubUsername}.png`;
    
    try {
      logger.debug(`[Avatars] Fetching GitHub avatar from: ${avatarUrl}`);

      const response = await axios({
        method: 'get',
        url: avatarUrl,
        responseType: 'stream',
        timeout: 20000, // 20 second timeout
        validateStatus: status => status === 200 // Only accept 200 OK
      });

      // We got a successful response, create directory and save file
      await fsp.mkdir(path.dirname(tempDownloadPath), { recursive: true }).catch(err => { 
        /* ignore if exists */ 
      });

      const writer = fs.createWriteStream(tempDownloadPath);
      response.data.pipe(writer);

      // Wrap writer events in a promise
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', (writeError) => {
          logger.error(`[Avatars] File write error for GitHub user "${githubUsername}": ${writeError.message}`);
          reject(new Error(`File write error: ${writeError.message}`));
        });
        response.data.on('error', (streamError) => {
          logger.error(`[Avatars] Stream error downloading for GitHub user "${githubUsername}": ${streamError.message}`);
          writer.close(() => {
            fsp.unlink(tempDownloadPath).catch(unlinkErr => logger.warn(`Failed to delete incomplete temp file ${tempDownloadPath}: ${unlinkErr.message}`));
          });
          reject(new Error(`Download stream error: ${streamError.message}`));
        });
      });

      // Download successful, now apply badge transformation to the temp file
      await this.applyBadgeTransformation(tempDownloadPath);

      // Badge transformation complete, move temp file to final location
      await fsp.rename(tempDownloadPath, targetPath);
      logger.success(`[Avatars] Successfully downloaded and badged avatar for GitHub user "${githubUsername}" (URL: ${avatarUrl})`);
      
      return Promise.resolve();
    } catch (error) {
      // Log specific errors
      if (error.response && error.response.status === 404) {
        logger.warn(`[Avatars] Avatar not found at ${avatarUrl} for GitHub user "${githubUsername}" (404)`);
      } else {
        logger.error(`[Avatars] Error downloading avatar for GitHub user "${githubUsername}": ${error.message}`);
      }
      
      // Clean up temp file if it exists
      try {
        if (fs.existsSync(tempDownloadPath)) {
          await fsp.unlink(tempDownloadPath);
        }
      } catch (cleanupError) {
        logger.warn(`[Avatars] Failed to clean up temp download file ${path.basename(tempDownloadPath)}: ${cleanupError.message}`);
      }
      
      // No longer attempt "The" prefix - direct GitHub URLs are more reliable
      return Promise.reject(error);
    }
  }
}

// Create and export a singleton instance
module.exports = new AvatarService(); 