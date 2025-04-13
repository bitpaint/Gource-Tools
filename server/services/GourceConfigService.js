/**
 * GourceConfigService
 * 
 * Service for managing Gource configuration profiles
 * - Creation and modification of configuration profiles
 * - Profile parameters management
 * - Default profile management
 */

const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { defaultGourceConfig } = require('../config/defaultGourceConfig');

class GourceConfigService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../db/db.json');
    this.init();
  }

  /**
   * Initialize the database
   */
  init() {
    const db = this.getDatabase();
    
    // Check if the renderProfiles collection exists
    if (!db.has('renderProfiles').value()) {
      db.set('renderProfiles', [defaultGourceConfig]).write();
    } else {
      // Make sure there's at least one default profile
      const hasDefault = db.get('renderProfiles')
        .find({ isDefault: true })
        .value();
      
      if (!hasDefault) {
        db.get('renderProfiles')
          .push(defaultGourceConfig)
          .write();
      }
    }
  }

  /**
   * Get a fresh instance of the database
   * @returns {Object} Database instance
   */
  getDatabase() {
    const adapter = new FileSync(this.dbPath);
    return low(adapter);
  }

  /**
   * Get all render profiles
   * @returns {Array} List of render profiles
   */
  getAllProfiles() {
    const db = this.getDatabase();
    return db.get('renderProfiles').value() || [];
  }

  /**
   * Get a render profile by its ID
   * @param {string} id - ID of the profile to retrieve
   * @returns {Object|null} Profile or null if not found
   */
  getProfileById(id) {
    if (!id) return null;
    
    const db = this.getDatabase();
    return db.get('renderProfiles')
      .find({ id: id.toString() })
      .value() || null;
  }

  /**
   * Get the default render profile
   * @returns {Object} Default profile
   */
  getDefaultProfile() {
    const db = this.getDatabase();
    return db.get('renderProfiles')
      .find({ isDefault: true })
      .value() || defaultGourceConfig;
  }

  /**
   * Create a new render profile
   * @param {Object} profileData - Profile data to create
   * @returns {Object} Created profile
   */
  createProfile(profileData) {
    const db = this.getDatabase();
    
    // Validate required data
    if (!profileData.name) {
      throw new Error('Profile name is required');
    }
    
    // Check if a profile with the same name already exists
    const existingProfile = db.get('renderProfiles')
      .find({ name: profileData.name })
      .value();
    
    if (existingProfile) {
      throw new Error(`A profile with the name "${profileData.name}" already exists`);
    }
    
    // Generate a unique ID
    const id = Date.now().toString();
    
    // Create the profile
    const newProfile = {
      id,
      name: profileData.name,
      description: profileData.description || '',
      isDefault: profileData.isDefault === true ? true : false,
      dateCreated: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      settings: profileData.settings || defaultGourceConfig.settings
    };
    
    // If new profile is default, update other profiles to non-default
    if (newProfile.isDefault) {
      db.get('renderProfiles')
        .forEach(profile => {
          if (profile.id !== id) {
            profile.isDefault = false;
          }
        })
        .write();
    }
    
    // Add the profile to the database
    db.get('renderProfiles')
      .push(newProfile)
      .write();
    
    return newProfile;
  }

  /**
   * Update an existing render profile
   * @param {string} id - ID of the profile to update
   * @param {Object} profileData - New profile data
   * @returns {Object|null} Updated profile or null if not found
   */
  updateProfile(id, profileData) {
    if (!id) return null;
    
    const db = this.getDatabase();
    const profile = db.get('renderProfiles')
      .find({ id: id.toString() })
      .value();
    
    if (!profile) return null;
    
    // Check if another profile with the same name already exists
    if (profileData.name && profileData.name !== profile.name) {
      const existingProfile = db.get('renderProfiles')
        .find({ name: profileData.name })
        .value();
      
      if (existingProfile && existingProfile.id !== id) {
        throw new Error(`A profile with the name "${profileData.name}" already exists`);
      }
    }
    
    // Update settings by merging with existing ones
    const updatedSettings = profileData.settings 
      ? { ...profile.settings, ...profileData.settings }
      : profile.settings;
    
    // Prepare data to update
    const updatedProfile = {
      ...profile,
      name: profileData.name || profile.name,
      description: profileData.description !== undefined ? profileData.description : profile.description,
      isDefault: profileData.isDefault === true ? true : profile.isDefault,
      lastModified: new Date().toISOString(),
      settings: updatedSettings
    };
    
    // If updated profile is default, update other profiles to non-default
    if (profileData.isDefault === true) {
      db.get('renderProfiles')
        .forEach(p => {
          if (p.id !== id) {
            p.isDefault = false;
          }
        })
        .write();
    }
    
    // Update the profile in the database
    db.get('renderProfiles')
      .find({ id: id.toString() })
      .assign(updatedProfile)
      .write();
    
    return updatedProfile;
  }

  /**
   * Delete a render profile
   * @param {string} id - ID of the profile to delete
   * @returns {boolean} true if deleted, false otherwise
   */
  deleteProfile(id) {
    if (!id) return false;
    
    const db = this.getDatabase();
    const profile = db.get('renderProfiles')
      .find({ id: id.toString() })
      .value();
    
    if (!profile) return false;
    
    // Cannot delete default profile
    if (profile.isDefault) {
      throw new Error('Cannot delete the default profile');
    }
    
    // Delete the profile from the database
    db.get('renderProfiles')
      .remove({ id: id.toString() })
      .write();
    
    return true;
  }

  /**
   * Set a profile as the default
   * @param {string} id - ID of the profile to make default
   * @returns {Object|null} Updated profile or null if not found
   */
  setDefaultProfile(id) {
    if (!id) return null;
    
    const db = this.getDatabase();
    const profile = db.get('renderProfiles')
      .find({ id: id.toString() })
      .value();
    
    if (!profile) return null;
    
    // Update all profiles: set current one as default, others as non-default
    db.get('renderProfiles')
      .forEach(p => {
        p.isDefault = (p.id === id.toString());
      })
      .write();
    
    return db.get('renderProfiles')
      .find({ id: id.toString() })
      .value();
  }
}

module.exports = new GourceConfigService(); 