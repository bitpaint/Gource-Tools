/**
 * Script d'initialisation des profils de rendu personnalisés
 * Ce script vérifie si les profils définis dans customRenderProfiles.js
 * existent déjà dans la base de données et les ajoute si nécessaire
 */
const path = require('path');
const fs = require('fs');
// Remove direct lowdb dependencies
// const low = require('lowdb');
// const FileSync = require('lowdb/adapters/FileSync');
const customRenderProfiles = require('./customRenderProfiles'); // Import the array directly
const Database = require('../utils/Database'); // Import the shared DB instance
const Logger = require('../utils/Logger');

const logger = Logger.createComponentLogger('InitProfiles');

// Initialiser les profils de rendu personnalisés dans la base de données
function initCustomRenderProfiles() {
  try {
    const db = Database.getDatabase();
    
    // Check if the renderProfiles collection exists
    if (!db || !db.has('renderProfiles').value()) {
      logger.error('Render profiles collection not found. Cannot initialize system profiles.');
      return;
    }
    
    // Initialize/Update system render profiles in the database
    let addedCount = 0;
    let updatedCount = 0;
    for (const profile of customRenderProfiles) {
      // Ensure the profile definition has an ID
      if (!profile.id) {
        logger.warn('Skipping a profile in customRenderProfiles.js because it lacks an ID.', profile);
        continue;
      }
      
      const existingProfileChain = db.get('renderProfiles').find({ id: profile.id });
      const existingProfile = existingProfileChain.value();
      
      if (!existingProfile) {
        // Add the new system profile
        db.get('renderProfiles').push(profile).write();
        addedCount++;
        logger.info(`Added system profile: ${profile.name} (ID: ${profile.id})`);
      } else {
        // Update existing system profile to ensure consistency
        // We only update system profiles defined in the config file
        // Check if the definition marks it as a system profile
        if (profile.isSystemProfile) {
          // Use assign to update the found profile
          existingProfileChain.assign(profile).write(); 
          updatedCount++;
          // logger.info(`Updated system profile: ${profile.name} (ID: ${profile.id})`); // Potentially too verbose
        } else {
          // If a profile with the same ID exists but is NOT marked as system in the definition,
          // we don't touch it (it might be a user profile that happens to share an old ID)
          logger.warn(`Profile with ID ${profile.id} exists but is not marked as system in definition. Skipping update.`);
        }
      }
    }
    
    if (addedCount > 0) {
      logger.success(`Added ${addedCount} new system render profiles.`);
    }
    if (updatedCount > 0) {
      logger.info(`Checked/Updated ${updatedCount} existing system render profiles for consistency.`);
    } else {
      // logger.info('All system render profiles already exist and are up-to-date.');
    }
    
  } catch (error) {
    logger.error('Error initializing/updating system render profiles:', error);
  }
}

module.exports = initCustomRenderProfiles; 