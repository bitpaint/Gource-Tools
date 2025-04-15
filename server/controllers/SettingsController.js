/**
 * Settings Controller
 * Handles HTTP requests related to application settings
 */

const SettingsService = require('../services/SettingsService');
const ErrorHandler = require('../utils/ErrorHandler');
const Logger = require('../utils/Logger');

// Create a component logger
const logger = Logger.createComponentLogger('SettingsController');

/**
 * Get application settings
 */
const getSettings = (req, res) => {
  try {
    const settings = SettingsService.getSettings();
    res.json(settings);
  } catch (error) {
    logger.error('Error fetching settings', error);
    ErrorHandler.handleError(error, res);
  }
};

/**
 * Update application settings
 */
const updateSettings = async (req, res) => {
  try {
    const { githubToken } = req.body;
    
    // Validate input
    if (githubToken === undefined) {
      return res.status(400).json({ error: 'GitHub token must be provided (can be empty string to remove)' });
    }
    
    // Update settings
    const result = await SettingsService.saveSettings({ githubToken });
    
    res.json(result);
  } catch (error) {
    logger.error('Error updating settings', error);
    ErrorHandler.handleError(error, res);
  }
};

/**
 * Validate GitHub token
 */
const validateGithubToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    // Validate input
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    // Validate token
    const result = await SettingsService.validateGithubToken(token);
    
    res.json(result);
  } catch (error) {
    logger.error('Error validating GitHub token', error);
    ErrorHandler.handleError(error, res);
  }
};

/**
 * Get the default project render profile ID
 */
const getDefaultProfile = (req, res) => {
  try {
    const profileId = SettingsService.getDefaultProjectProfileId();
    res.json({ defaultProjectProfileId: profileId });
  } catch (error) {
    logger.error('Error fetching default profile ID', error);
    ErrorHandler.handleError(error, res);
  }
};

/**
 * Set the default project render profile ID
 */
const setDefaultProfile = async (req, res) => {
  try {
    const { profileId } = req.body;
    // Basic validation: profileId should be a string or null
    if (typeof profileId !== 'string' && profileId !== null) {
       return res.status(400).json({ error: 'Invalid profileId provided. Must be a string or null.' });
    }

    const result = await SettingsService.setDefaultProjectProfileId(profileId);
    res.json(result);
  } catch (error) {
    logger.error('Error setting default profile ID', error);
    ErrorHandler.handleError(error, res);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  validateGithubToken,
  getDefaultProfile,
  setDefaultProfile
}; 