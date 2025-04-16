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
const { defaultGourceConfig, defaultSettings } = require('../../client/src/shared/gourceConfig'); // Only import necessary parts
const systemGourceConfigs = require('../config/systemGourceConfigs'); 

// Import custom profiles to find the default
const customRenderProfiles = require('../config/customRenderProfiles');

// Create a component logger
const logger = Logger.createComponentLogger('SettingsService');
const db = Database.getDatabase();

// Ensure settings collection exists on startup
if (!db.has('settings').value()) {
  logger.info('Initializing settings collection...');
  db.set('settings', {}).write();
}

// Function to initialize system Gource configurations if they don't exist
const initializeSystemGourceConfigs = () => {
  const renderProfilesCollection = db.get('renderProfiles');
  let changesMade = false;

  systemGourceConfigs.forEach(systemConfig => {
    const existingConfig = renderProfilesCollection.find({ id: systemConfig.id }).value();
    if (!existingConfig) {
      logger.info(`Initializing system Gource config: ${systemConfig.name} (ID: ${systemConfig.id})`);
      // Add missing system config
      // Ensure settings are properly merged if needed (already done in the config file)
      const newConfig = {
        id: systemConfig.id,
        name: systemConfig.name,
        description: systemConfig.description || '',
        settings: systemConfig.settings || {},
        isSystemConfig: true, // Use the new property name
        isDefault: systemConfig.isDefault || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      renderProfilesCollection.push(newConfig).value(); // Get the result of the push
      changesMade = true;
    } else {
      // Optionally update existing system configs if needed (e.g., update description or settings)
      // Be cautious with updates to avoid overwriting user changes if system profiles were ever user-editable
      // For now, we only add missing ones.
      // Example update check (uncomment and adapt if needed):
      // if (existingConfig.description !== systemConfig.description || !isDeepEqual(existingConfig.settings, systemConfig.settings)) {
      //   logger.info(`Updating existing system Gource config: ${systemConfig.name}`);
      //   renderProfilesCollection.find({ id: systemConfig.id }).assign({ 
      //     description: systemConfig.description,
      //     settings: systemConfig.settings,
      //     isSystemConfig: true, // Ensure flag remains true
      //     updatedAt: new Date().toISOString()
      //   }).value();
      //   changesMade = true;
      // }
    }
  });

  if (changesMade) {
    db.write(); // Write all changes at once after the loop
    logger.success('System Gource configurations initialization/update complete.');
  } else {
    logger.info('System Gource configurations are up-to-date.');
  }
};

// Call initialization on service load
initializeSystemGourceConfigs();

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
        // Find the profile explicitly marked as default (should be 'Everything in 1min')
        let defaultProfile = customRenderProfiles.find(p => p.isDefault === true);
        let defaultId = defaultProfile ? defaultProfile.id : null;
        if (!defaultId) {
          // Fallback: Try to find 'Everything in 1min' by name if isDefault flag is missing
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
             logger.warn('defaultProjectProfileId missing in existing settings collection. Initializing to null.');
             db.get('settings').assign({ defaultProjectProfileId: null }).write();
         }
      }
    } catch (error) {
      logger.error('Error initializing database settings:', error);
      // Handle error appropriately, maybe throw or log significantly
    }
  }

  /**
   * Load settings from .env file AND database
   * @returns {Object} Settings (merged)
   */
  getSettings() {
    try {
      // Check if .env file exists
      if (!fs.existsSync(this.envPath)) {
        logger.warn('No .env file found');
        return {
          githubToken: '',
          tokenStatus: 'missing'
        };
      }
      
      // Read .env file
      const envConfig = dotenv.parse(fs.readFileSync(this.envPath));
      const token = envConfig.GITHUB_TOKEN || '';
      
      // Check token validity
      let tokenStatus = 'unknown';
      if (!token) {
        tokenStatus = 'missing';
      } else if (token.length < 30) {
        tokenStatus = 'invalid_format';
      } else {
        tokenStatus = 'present';
      }
      
      // Get settings from Database
      const db = Database.getDatabase();
      const dbSettings = db.get('settings').value() || { defaultProjectProfileId: null };
      
      return {
        githubToken: token,
        tokenStatus,
        defaultProjectProfileId: dbSettings.defaultProjectProfileId
      };
    } catch (error) {
      logger.error('Error loading settings', error);
      throw new Error('Failed to load settings');
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

// Get a specific setting value
const getSetting = (key) => {
  // Check environment variables first
  const envVar = process.env[key.toUpperCase().replace(/\./g, '_')];
  if (envVar !== undefined) {
    logger.debug(`Using environment variable for setting: ${key}`);
    return envVar;
  }
  // Then check database settings
  return db.get('settings').get(key).value();
};

// Set a specific setting value
const setSetting = (key, value) => {
  db.get('settings').set(key, value).write();
  logger.info(`Setting updated: ${key} = ${value}`);
};

// Get all settings (excluding potentially sensitive ones)
const getAllSettings = () => {
  const settings = db.get('settings').value() || {};
  // Add logic here to filter sensitive keys if needed
  return settings;
};

// Get the default Gource configuration ID for new projects
const getDefaultGourceConfigId = () => {
  let configId = getSetting('defaultProjectGourceConfigId');
  
  if (!configId) {
    // If not set in DB, find the one marked as default in system configs
    const defaultConfigFromSystem = systemGourceConfigs.find(c => c.isDefault === true);
    if (defaultConfigFromSystem) {
      configId = defaultConfigFromSystem.id;
      logger.info(`No explicit default Gource config ID set, using system default: ${defaultConfigFromSystem.name} (ID: ${configId})`);
      // Optionally save this derived default to the DB settings?
      // setSetting('defaultProjectGourceConfigId', configId);
    } else {
      // Fallback if no system default is marked (shouldn't happen with current setup)
      logger.warn('No default Gource config ID set in settings and no system default found!');
      configId = null; 
    }
  }
  
  // Optional: Validate if the ID still exists in the database? 
  // This could be slow if called frequently.
  // const configExists = db.get('renderProfiles').find({ id: configId }).value();
  // if (configId && !configExists) {
  //   logger.warn(`Default Gource config ID ${configId} set, but config no longer exists! Falling back.`);
  //   // Optionally reset the setting or find another default
  //   return null; // Or find another default
  // }

  return configId;
};

// Set the default Gource configuration ID for new projects
const setDefaultGourceConfigId = (configId) => {
  // Optional: Validate if the configId actually exists in renderProfiles?
  if (configId !== null) { // Allow setting to null explicitly
      const configExists = db.get('renderProfiles').find({ id: configId }).value();
      if (!configExists) {
          logger.error(`Cannot set default Gource config ID: Config with ID "${configId}" not found.`);
          throw new Error(`Gource config with ID "${configId}" not found.`);
      }
  }
  setSetting('defaultProjectGourceConfigId', configId);
  logger.success(`Default project Gource config ID set to: ${configId}`);
};

// Get GitHub API Key
const getGitHubApiKey = () => {
  return getSetting('githubApiKey');
};

// Set GitHub API Key
const setGitHubApiKey = (apiKey) => {
  // Add validation if needed
  setSetting('githubApiKey', apiKey);
};

module.exports = {
  getSetting,
  setSetting,
  getAllSettings,
  getDefaultGourceConfigId,
  setDefaultGourceConfigId,
  getGitHubApiKey,
  setGitHubApiKey,
  // Add other specific getters/setters as needed
}; 