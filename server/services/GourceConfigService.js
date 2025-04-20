/**
 * Gource Configuration Service
 * Provides functionality for managing Gource render profiles and configurations
 */

const Database = require('../utils/Database');
// const { defaultGourceConfig, convertToGourceArgs } = require('../../client/src/shared/gourceConfig'); // REMOVED UNUSED IMPORT
const Logger = require('../utils/Logger');

// Create a component logger
const logger = Logger.createComponentLogger('GourceConfigService');

/**
 * Get a render profile by ID
 * @param {string} id - ID of the render profile to retrieve
 * @returns {Object|null} Render profile or null if not found
 */
const getRenderProfileById = (id) => {
  if (!id) return null;
  
  // Use the shared DB instance
  const db = Database.getDatabase();
  
  return db.get('renderProfiles')
    .find({ id: id.toString() })
    .value() || null;
};

/**
 * Get the default render profile
 * @returns {Object|null} Default render profile or null if not found
 */
const getDefaultRenderProfile = () => {
  // Use the shared DB instance
  const db = Database.getDatabase();
  
  return db.get('renderProfiles')
    .find({ isDefault: true })
    .value() || null;
};

/**
 * Get all render profiles
 * @returns {Array} List of all render profiles
 */
const getAllRenderProfiles = () => {
  // Use the shared DB instance
  const db = Database.getDatabase();
  
  return db.get('renderProfiles').value() || [];
};

/**
 * Create a new render profile
 * @param {Object} profileData - Render profile data
 * @returns {Object} Created render profile
 */
const createRenderProfile = (profileData) => {
  if (!profileData.name) {
    throw new Error('Profile name is required');
  }
  
  // Use the shared DB instance
  const db = Database.getDatabase();
  
  // Check if profile with the same name exists
  const existingProfile = db.get('renderProfiles')
    .find({ name: profileData.name })
    .value();
  
  if (existingProfile) {
    throw new Error(`Render profile with name "${profileData.name}" already exists`);
  }
  
  // Create render profile
  const newProfile = {
    id: Date.now().toString(),
    name: profileData.name,
    description: profileData.description || '',
    settings: profileData.settings || {},
    isDefault: !!profileData.isDefault,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Add to database
  db.get('renderProfiles')
    .push(newProfile)
    .write();
  
  return newProfile;
};

// Export functions
module.exports = {
  getRenderProfileById,
  getDefaultRenderProfile,
  getAllRenderProfiles,
  createRenderProfile
}; 