const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { defaultGourceConfig } = require('../config/defaultGourceConfig');
const { customRenderProfiles } = require('../config/customRenderProfiles');

const adapter = new FileSync(path.join(__dirname, '../../db/db.json'));
const db = low(adapter);

// Fonction pour recharger la base de données
function reloadDatabase() {
  // Recharger explicitement la base de données pour avoir les données les plus récentes
  const refreshedAdapter = new FileSync(path.join(__dirname, '../../db/db.json'));
  return low(refreshedAdapter);
}

// Validate and fix numeric values in Gource config
function validateAndFixSettings(settings) {
  if (!settings) return settings;
  
  const fixedSettings = { ...settings };
  
  // Liste des paramètres numériques
  const numericParams = [
    'seconds-per-day', 'auto-skip-seconds', 'elasticity', 
    'font-scale', 'user-scale', 'time-scale', 'file-scale', 'dir-size',
    'max-file-lag', 'bloom-intensity', 'bloom-multiplier', 'framerate',
    'max-user-count', 'font-size', 'filename-font-size', 'dirname-font-size', 'user-font-size'
  ];
  
  // Liste des paramètres booléens qui s'écrivent en 0/1
  const booleanParams = [
    'highlight-users', 'bloom', 'multi-sampling'
  ];
  
  // Liste des paramètres booléens qui sont des flags
  const flagParams = [
    'title', 'key', 'show-dates', 'disable-progress', 'disable-auto-rotate',
    'show-files', 'follow-users', 'hide-root', 'swap-title-date'
  ];
  
  // Validation et correction des valeurs numériques
  for (const [key, value] of Object.entries(fixedSettings)) {
    // Ignorer les valeurs vides ou undefined
    if (value === '' || value === null || value === undefined) continue;
    
    // Convertir et valider les valeurs numériques
    if (numericParams.includes(key)) {
      if (typeof value === 'string') {
        fixedSettings[key] = parseFloat(value.toString().replace(',', '.'));
      }
      
      // Vérifier que c'est bien un nombre
      if (isNaN(fixedSettings[key])) {
        // Valeurs par défaut pour les paramètres numériques
        switch (key) {
          case 'seconds-per-day': fixedSettings[key] = 1; break;
          case 'auto-skip-seconds': fixedSettings[key] = 0.1; break;
          case 'elasticity': fixedSettings[key] = 0.3; break;
          case 'font-scale': fixedSettings[key] = 1.0; break;
          case 'user-scale': fixedSettings[key] = 1.0; break;
          case 'time-scale': fixedSettings[key] = 1.0; break;
          case 'file-scale': fixedSettings[key] = 1.0; break;
          case 'dir-size': fixedSettings[key] = 1.0; break;
          case 'max-file-lag': fixedSettings[key] = 0.5; break;
          case 'bloom-intensity': fixedSettings[key] = 0.4; break;
          case 'bloom-multiplier': fixedSettings[key] = 0.7; break;
          case 'framerate': fixedSettings[key] = 60; break;
          case 'max-user-count': fixedSettings[key] = 0; break;
          case 'font-size': fixedSettings[key] = 16; break;
          case 'filename-font-size': fixedSettings[key] = 14; break;
          case 'dirname-font-size': fixedSettings[key] = 14; break;
          case 'user-font-size': fixedSettings[key] = 14; break;
          default: fixedSettings[key] = 0; break;
        }
      }
      
      // Vérifications spécifiques pour certains paramètres
      if (key === 'seconds-per-day' && fixedSettings[key] <= 0) {
        fixedSettings[key] = 1;
      }
      if (key === 'elasticity' && (fixedSettings[key] < 0 || fixedSettings[key] > 1)) {
        fixedSettings[key] = 0.3;
      }
      if ((key === 'bloom-intensity' || key === 'bloom-multiplier') && 
          (fixedSettings[key] < 0 || fixedSettings[key] > 1)) {
        fixedSettings[key] = key === 'bloom-intensity' ? 0.4 : 0.7;
      }
    }
    
    // Convertir et valider les valeurs booléennes
    else if (booleanParams.includes(key)) {
      if (typeof value === 'boolean') {
        fixedSettings[key] = value ? 1 : 0;
      } else if (value === 'true' || value === '1' || value === 1) {
        fixedSettings[key] = 1;
      } else if (value === 'false' || value === '0' || value === 0) {
        fixedSettings[key] = 0;
      }
    }
    
    // Gérer les paramètres de flag booléens
    else if (flagParams.includes(key)) {
      if (typeof value === 'string') {
        fixedSettings[key] = value === 'true' || value === '1';
      }
    }
    
    // Traitement des couleurs (suppression du # pour Gource)
    else if (typeof value === 'string' && 
             (key.endsWith('-colour') || key === 'background-colour' || key === 'background')) {
      fixedSettings[key] = value.replace(/^#/, '');
    }
  }
  
  return fixedSettings;
}

// Get all config files
router.get('/', (req, res) => {
  try {
    const freshDb = reloadDatabase();
    
    // Get all render profiles from the database
    const configFiles = freshDb.get('renderProfiles').value() || [];
    
    // Return all config files
    res.json(configFiles);
  } catch (error) {
    console.error('Error getting config files:', error);
    res.status(500).json({ error: 'Failed to get config files', details: error.message });
  }
});

// Get a single config file
router.get('/:id', (req, res) => {
  try {
    const freshDb = reloadDatabase();
    
    // Find the config file by ID
    const configFile = freshDb.get('renderProfiles')
      .find({ id: req.params.id })
      .value();

    if (!configFile) {
      return res.status(404).json({ error: 'Config file not found' });
    }

    res.json(configFile);
  } catch (error) {
    console.error('Error getting config file:', error);
    res.status(500).json({ error: 'Failed to get config file', details: error.message });
  }
});

// Create a new config file
router.post('/', (req, res) => {
  try {
    const freshDb = reloadDatabase();
    const { name, description, settings } = req.body;
    
    // Validate input
    if (!name) {
      return res.status(400).json({ error: 'Config file name is required' });
    }

    // Check for duplicate name
    const existingFile = freshDb.get('renderProfiles')
      .find({ name })
      .value();

    if (existingFile) {
      return res.status(400).json({ error: 'A config file with this name already exists' });
    }

    // Validate and fix settings
    const validatedSettings = validateAndFixSettings(settings);

    // Create new config file
    const newConfigFile = {
      id: Date.now().toString(),
      name,
      description: description || '',
      settings: validatedSettings || {},
      isDefault: false,
      dateCreated: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    // Add to database
    freshDb.get('renderProfiles')
      .push(newConfigFile)
      .write();

    res.status(201).json(newConfigFile);
  } catch (error) {
    console.error('Error creating config file:', error);
    res.status(500).json({ error: 'Failed to create config file', details: error.message });
  }
});

// Update a config file
router.put('/:id', (req, res) => {
  try {
    const freshDb = reloadDatabase();
    const { name, description, settings } = req.body;
    
    const configFile = freshDb.get('renderProfiles')
      .find({ id: req.params.id })
      .value();

    if (!configFile) {
      return res.status(404).json({ error: 'Config file not found' });
    }

    // Protect default Gource config
    if (configFile.isDefault) {
      return res.status(403).json({ error: 'The default Gource config file cannot be modified' });
    }

    // Validate input
    if (name === '') {
      return res.status(400).json({ error: 'Config file name cannot be empty' });
    }

    // Check if the name is being changed and if it already exists
    if (name && name !== configFile.name) {
      const existingFile = freshDb.get('renderProfiles')
        .find({ name })
        .value();

      if (existingFile && existingFile.id !== configFile.id) {
        return res.status(400).json({ error: 'A config file with this name already exists' });
      }
    }

    // Validate and fix settings
    const validatedSettings = validateAndFixSettings(settings);

    // Update profile
    const updatedFile = {
      ...configFile,
      name: name || configFile.name,
      description: description !== undefined ? description : configFile.description,
      settings: validatedSettings ? { ...configFile.settings, ...validatedSettings } : configFile.settings,
      lastModified: new Date().toISOString()
    };

    freshDb.get('renderProfiles')
      .find({ id: req.params.id })
      .assign(updatedFile)
      .write();

    res.json(updatedFile);
  } catch (error) {
    console.error('Error updating config file:', error);
    res.status(500).json({ error: 'Failed to update config file', details: error.message });
  }
});

// Delete a config file
router.delete('/:id', (req, res) => {
  try {
    const freshDb = reloadDatabase();
    
    const configFile = freshDb.get('renderProfiles')
      .find({ id: req.params.id })
      .value();

    if (!configFile) {
      return res.status(404).json({ error: 'Config file not found' });
    }

    // Protect default Gource config
    if (configFile.isDefault) {
      return res.status(403).json({ error: 'The default Gource config file cannot be deleted' });
    }

    // Remove from database
    freshDb.get('renderProfiles')
      .remove({ id: req.params.id })
      .write();

    res.json({ message: 'Config file deleted successfully' });
  } catch (error) {
    console.error('Error deleting config file:', error);
    res.status(500).json({ error: 'Failed to delete config file', details: error.message });
  }
});

// Initialize default config if not exist
function initializeDefaultConfig() {
  const freshDb = reloadDatabase();
  
  // Check if default config already exists
  const defaultConfig = freshDb.get('renderProfiles')
    .find({ isDefault: true })
    .value();

  if (!defaultConfig) {
    console.log('Creating default Gource config file');
    
    // Add default config
    freshDb.get('renderProfiles')
      .push(defaultGourceConfig)
      .write();
  }

  // Add custom render profiles if they don't exist
  if (customRenderProfiles && Array.isArray(customRenderProfiles)) {
    for (const profile of customRenderProfiles) {
      const existingProfile = freshDb.get('renderProfiles')
        .find({ id: profile.id })
        .value();

      if (!existingProfile) {
        console.log(`Adding custom render profile: ${profile.name}`);
        freshDb.get('renderProfiles')
          .push(profile)
          .write();
      } else {
        console.log(`Custom render profile already exists: ${profile.name}`);
      }
    }
  }
}

// Call this function when the module is loaded
initializeDefaultConfig();

module.exports = router; 