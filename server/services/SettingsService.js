/**
 * Settings Service
 * Manages application settings
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { Octokit } = require('@octokit/rest');
const Logger = require('../utils/Logger');

// Create a component logger
const logger = Logger.createComponentLogger('SettingsService');

class SettingsService {
  constructor() {
    this.envPath = path.resolve(__dirname, '../../.env');
  }

  /**
   * Load settings from .env file
   * @returns {Object} Settings
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
      
      return {
        githubToken: token,
        tokenStatus
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
   * Validate GitHub token
   * @param {string} token - GitHub token to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateGithubToken(token) {
    try {
      if (!token) {
        return { valid: false, message: 'No token provided' };
      }
      
      if (token.length < 30) {
        return { valid: false, message: 'Invalid token format' };
      }
      
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.users.getAuthenticated();
      
      if (data && data.login) {
        return { 
          valid: true, 
          username: data.login,
          message: `Token valid for user: ${data.login}` 
        };
      }
      
      return { valid: false, message: 'Invalid token' };
    } catch (error) {
      logger.error('Error validating GitHub token', error);
      return { 
        valid: false, 
        message: `Token validation failed: ${error.message}` 
      };
    }
  }
}

module.exports = new SettingsService(); 