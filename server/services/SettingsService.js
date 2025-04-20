/**
 * Settings Service
 * Manages application settings
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { Octokit } = require('@octokit/rest');
const Logger = require('../utils/Logger');
const Database = require('../utils/Database'); // Import Database utility

// Import custom profiles to find the default
const customRenderProfiles = require('../config/customRenderProfiles');

// Create a component logger
const logger = Logger.createComponentLogger('SettingsService');

class SettingsService {
  constructor() {
    this.envPath = path.resolve(__dirname, '../../.env');
    this._initializeDbSettings(); // Ensure DB settings are initialized
  }

  /**
   * Ensure the settings collection exists in the database and has defaults.
   */
  _initializeDbSettings() {
    try {
      const db = Database.getDatabase();
      if (!db.has('settings').value()) {
        logger.info('Initializing settings collection in database...');
        // Logic to find the default ID (copied below)
        let defaultProfile = customRenderProfiles.find(p => p.isDefault === true);
        let defaultId = defaultProfile ? defaultProfile.id : null;
        if (!defaultId) {
          const fallbackProfile = customRenderProfiles.find(p => p.name === 'Everything in 1min');
          defaultId = fallbackProfile ? fallbackProfile.id : null;
          if (defaultId) {
            logger.warn('No profile marked as isDefault=true. Falling back to \'Everything in 1min\' by name.');
          } else {
            logger.error('CRITICAL: Cannot find default profile (\'Everything in 1min\') by flag or name. Default Project Profile ID will be null.');
          }
        }
        db.defaults({ settings: { defaultProjectProfileId: defaultId } }).write();
        logger.info(`Initialized settings with defaultProjectProfileId: ${defaultId}`);
      } else {
         // Ensure the defaultProjectProfileId key exists even if settings collection was already there
         const currentSettings = db.get('settings').value();
         if (typeof currentSettings.defaultProjectProfileId === 'undefined') {
             logger.warn('defaultProjectProfileId missing in existing settings collection. Initializing...');
             // Find the default ID using the same logic as above
             let defaultProfile = customRenderProfiles.find(p => p.isDefault === true);
             let defaultId = defaultProfile ? defaultProfile.id : null;
             if (!defaultId) {
               const fallbackProfile = customRenderProfiles.find(p => p.name === 'Everything in 1min');
               defaultId = fallbackProfile ? fallbackProfile.id : null;
               if (defaultId) {
                 logger.warn('No profile marked as isDefault=true. Falling back to \'Everything in 1min\' by name.');
               } else {
                 logger.error('CRITICAL: Cannot find default profile (\'Everything in 1min\') by flag or name. Default Project Profile ID will remain missing or null.');
                 // Don't write null if we couldn't find it, leave it as is or let subsequent code handle it.
                 defaultId = null; // Explicitly set to null if truly not found
               }
             }
             // Assign the found default ID (or null if absolutely not found)
             db.get('settings').assign({ defaultProjectProfileId: defaultId }).write();
             logger.info(`Initialized missing defaultProjectProfileId to: ${defaultId}`);
         }
      }
    } catch (error) {
      logger.error('Error initializing database settings:', error);
      // Handle error appropriately, maybe throw or log significantly
    }
  }

  /**
   * Load settings from .env file AND database
   * @returns {Promise<Object>} Settings (merged) with validated token status
   */
  async getSettings() {
    try {
      let token = '';
      let tokenStatus = 'missing'; // Default to missing

      // Check if .env file exists and read it
      if (fs.existsSync(this.envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(this.envPath));
        token = envConfig.GITHUB_TOKEN || '';
      } else {
        logger.warn('No .env file found, GitHub token cannot be loaded.');
      }

      // Validate the token if it exists
      if (token) {
        logger.info('Found existing GitHub token, attempting validation...');
        try {
          const octokit = new Octokit({ auth: token });
          const { data } = await octokit.users.getAuthenticated(); // Validate by fetching user info
          if (data && data.login) {
            tokenStatus = 'valid';
            logger.info(`Token validated successfully for user: ${data.login}`);
          } else {
            // This case might not happen if the request fails, but good to have
            tokenStatus = 'invalid'; 
            logger.warn('Token validation succeeded but no login info returned.');
          }
        } catch (apiError) {
          tokenStatus = 'invalid';
          logger.warn(`Token validation failed: ${apiError.message || 'Error connecting to GitHub API'}`);
          // Log the error status code if available
          if (apiError.status) {
             logger.warn(`GitHub API returned status: ${apiError.status}`);
          }
        }
      } else {
        tokenStatus = 'missing'; // Explicitly set status if token is empty string after reading .env
        logger.info('No GitHub token found in .env file.');
      }

      // Get settings from Database (like default profile ID)
      const db = Database.getDatabase();
      // Ensure settings object exists before accessing properties
      const dbSettings = db.has('settings').value() 
                         ? db.get('settings').value() 
                         : { defaultProjectProfileId: null };

      return {
        githubToken: token, // Return the actual token
        tokenStatus, // Return the validated status
        defaultProjectProfileId: dbSettings.defaultProjectProfileId || null // Ensure fallback
      };
    } catch (error) {
      logger.error('Error loading settings:', error);
      // Don't re-throw generic error, return a state indicating failure
      return {
        githubToken: '',
        tokenStatus: 'unknown', // Indicate an error occurred during fetch/validation
        defaultProjectProfileId: null,
        error: 'Failed to load settings due to an internal error.'
      };
    }
  }

  /**
   * Save settings to .env file
   * @param {Object} settings - Settings to save
   * @returns {Promise<Object>} Result
   */
  async saveSettings(settings) {
    try {
      const { githubToken } = settings;
      
      // Load existing env config if it exists
      let envConfig = {};
      if (fs.existsSync(this.envPath)) {
        envConfig = dotenv.parse(fs.readFileSync(this.envPath));
      }
      
      // Validate GitHub token
      let tokenStatus = 'invalid';
      let message = '';
      
      if (githubToken && githubToken.length > 30) {
        try {
          const octokit = new Octokit({ auth: githubToken });
          const { data } = await octokit.users.getAuthenticated();
          
          if (data && data.login) {
            tokenStatus = 'valid';
            message = `Token validated for GitHub user: ${data.login}`;
            logger.info(message);
          }
        } catch (apiError) {
          tokenStatus = 'invalid';
          message = `Invalid GitHub token: ${apiError.message || 'Error connecting to GitHub API'}`;
          logger.error(message);
        }
      } else if (githubToken === '') {
        tokenStatus = 'removed';
        message = 'GitHub token removed';
        logger.info(message);
      } else {
        message = 'Invalid token format, please provide a valid GitHub token';
        logger.warn(message);
      }
      
      // Update GitHub token
      envConfig.GITHUB_TOKEN = githubToken;
      
      // Convert to .env format
      const newEnv = Object.entries(envConfig)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      // Write to file
      fs.writeFileSync(this.envPath, newEnv);
      
      // Update environment variables in current process
      process.env.GITHUB_TOKEN = githubToken;
      
      // Force reload environment variables to ensure they're available across the application
      try {
        // Reload dotenv from the file we just wrote
        dotenv.config({ path: this.envPath, override: true });
        logger.info('Environment variables reloaded successfully');
      } catch (reloadError) {
        logger.warn('Error reloading environment variables:', reloadError);
        // Even if reload fails, we've manually set process.env.GITHUB_TOKEN above
      }
      
      return { 
        success: true, 
        tokenStatus, 
        message 
      };
    } catch (error) {
      logger.error('Error saving settings', error);
      throw new Error('Failed to save settings');
    }
  }

  /**
   * Get the ID of the default render profile for new projects.
   * @returns {string | null} The ID of the default profile or null.
   */
  getDefaultProjectProfileId() {
      try {
          const db = Database.getDatabase();
          const settings = db.get('settings').value();
          return settings ? settings.defaultProjectProfileId : null;
      } catch (error) {
          logger.error('Error getting default project profile ID:', error);
          return null; // Return null on error
      }
  }

  /**
   * Set the ID of the default render profile for new projects.
   * @param {string | null} profileId - The ID of the profile to set as default.
   * @returns {Promise<Object>} Result
   */
  async setDefaultProjectProfileId(profileId) {
      try {
          // Optional: Validate if the profileId actually exists in renderProfiles?
          const db = Database.getDatabase();
          const profileExists = db.get('renderProfiles').find({ id: profileId }).value();
          if (!profileId) { // Allowing setting back to null/none
             logger.info('Setting default project profile ID to null.');
          } else if (!profileExists) {
              logger.warn(`Attempted to set non-existent profile ID (${profileId}) as default. Setting to null instead.`);
              profileId = null; // Or throw an error?
          }

          db.get('settings').assign({ defaultProjectProfileId: profileId }).write();
          logger.success(`Default project profile ID set to: ${profileId}`);
          return { success: true, defaultProjectProfileId: profileId };
      } catch (error) {
          logger.error('Error setting default project profile ID:', error);
          throw new Error('Failed to set default project profile ID');
      }
  }
}

module.exports = new SettingsService(); 