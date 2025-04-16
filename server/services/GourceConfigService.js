/**
 * Gource Configuration Service
 * Provides functionality for managing Gource render profiles and configurations
 */

const Database = require('../utils/Database');
const { defaultGourceConfig, convertToGourceArgs } = require('../../client/src/shared/gourceConfig');
const Logger = require('../utils/Logger');

// Create a component logger
const logger = Logger.createComponentLogger('GourceConfigService');

/**
 * Get a Gource config by ID
 * @param {string} id - ID of the Gource config to retrieve
 * @returns {Object|null} Gource config or null if not found
 */
const getGourceConfigById = (id) => {
  if (!id) return null;
  
  // Use the shared DB instance
  const db = Database.getDatabase();
  
  // Access the 'renderProfiles' collection (keeping the name for now)
  return db.get('renderProfiles')
    .find({ id: id.toString() })
    .value() || null;
};

/**
 * Get the default Gource config
 * @returns {Object|null} Default Gource config or null if not found
 */
const getDefaultGourceConfig = () => {
  // Use the shared DB instance
  const db = Database.getDatabase();
  
  // Access the 'renderProfiles' collection
  return db.get('renderProfiles')
    .find({ isDefault: true })
    .value() || null;
};

/**
 * Get all Gource configs
 * @returns {Array} List of all Gource configs
 */
const getAllGourceConfigs = () => {
  // Use the shared DB instance
  const db = Database.getDatabase();
  
  // Access the 'renderProfiles' collection
  return db.get('renderProfiles').value() || [];
};

/**
 * Create a new Gource config
 * @param {Object} configData - Gource config data
 * @returns {Object} Created Gource config
 */
const createGourceConfig = (configData) => {
  if (!configData.name) {
    throw new Error('Gource config name is required');
  }
  
  // Use the shared DB instance
  const db = Database.getDatabase();
  
  // Check if config with the same name exists
  // Access the 'renderProfiles' collection
  const existingConfig = db.get('renderProfiles')
    .find({ name: configData.name })
    .value();
  
  if (existingConfig) {
    throw new Error(`Gource config with name "${configData.name}" already exists`);
  }
  
  // Create Gource config
  const newConfig = {
    id: Date.now().toString(),
    name: configData.name,
    description: configData.description || '',
    settings: configData.settings || {},
    isDefault: !!configData.isDefault,
    // isSystemConfig should likely be false for user-created configs
    isSystemConfig: configData.isSystemConfig === true ? true : false, 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Add to database ('renderProfiles' collection)
  db.get('renderProfiles')
    .push(newConfig)
    .write();
  
  return newConfig;
};

// Export functions with new names
module.exports = {
  getGourceConfigById,
  getDefaultGourceConfig,
  getAllGourceConfigs,
  createGourceConfig
}; 