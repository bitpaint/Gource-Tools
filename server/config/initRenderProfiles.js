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
      console.error('Render profiles collection not found. Cannot initialize custom profiles.');
      return;
    }
    
    // Initialize custom render profiles in the database
    let addedCount = 0;
    for (const profile of customRenderProfiles) {
      const existingProfile = db.get('renderProfiles')
        .find({ id: profile.id })
        .value();
      
      // Only add if it doesn't exist by ID
      if (!existingProfile) {
        db.get('renderProfiles').push(profile).write();
        addedCount++;
      }
    }
    
    if (addedCount > 0) {
      console.log(`Added ${addedCount} custom render profiles to the database.`);
    } else {
      // console.log('All custom render profiles already exist in the database.');
    }
    
  } catch (error) {
    console.error('Error initializing custom render profiles:', error);
  }
}

module.exports = initCustomRenderProfiles; 