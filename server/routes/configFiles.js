const express = require('express');
const router = express.Router();
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync(path.join(__dirname, '../../db/db.json'));
const db = low(adapter);

// Fonction pour recharger la base de données
function reloadDatabase() {
  // Recharger explicitement la base de données pour avoir les données les plus récentes
  const refreshedAdapter = new FileSync(path.join(__dirname, '../../db/db.json'));
  return low(refreshedAdapter);
}

// Get all config files
router.get('/', (req, res) => {
  const freshDb = reloadDatabase();
  const configFiles = freshDb.get('renderProfiles').value();
  res.json(configFiles);
});

// Get a single config file
router.get('/:id', (req, res) => {
  const freshDb = reloadDatabase();
  const configFile = freshDb.get('renderProfiles')
    .find({ id: req.params.id })
    .value();

  if (!configFile) {
    return res.status(404).json({ error: 'Config file not found' });
  }

  res.json(configFile);
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

    if (!settings) {
      return res.status(400).json({ error: 'Render settings are required' });
    }

    // Check if profile with same name already exists
    const existingFile = freshDb.get('renderProfiles')
      .find({ name })
      .value();

    if (existingFile) {
      return res.status(400).json({ error: 'A config file with this name already exists' });
    }

    // Generate profile ID
    const id = Date.now().toString();

    // Default settings for Gource
    const defaultSettings = {
      resolution: '1920x1080',
      framerate: 60,
      secondsPerDay: 1,
      autoSkipSeconds: 0.1,
      elasticity: 0.5,
      title: true,
      key: true,
      background: '#000000',
      fontScale: 1.0,
      cameraMode: 'overview',
      userScale: 1.0,
      timeScale: 1.0,
      highlightUsers: false,
      hideUsers: '',
      hideFilesRegex: '',
      hideRoot: false,
      maxUserCount: 0,
      extraArgs: ''
    };

    const newFile = {
      id,
      name,
      description: description || '',
      settings: { ...defaultSettings, ...settings },
      dateCreated: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    freshDb.get('renderProfiles')
      .push(newFile)
      .write();

    res.status(201).json(newFile);
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

    // Update profile
    const updatedFile = {
      ...configFile,
      name: name || configFile.name,
      description: description !== undefined ? description : configFile.description,
      settings: settings ? { ...configFile.settings, ...settings } : configFile.settings,
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

    // Prevent deletion of the default config file
    if (configFile.isDefault) {
      return res.status(403).json({ error: 'The default Gource config file cannot be deleted' });
    }

    // Check if this profile is in use by any projects
    const projectsUsingProfile = freshDb.get('projects')
      .filter({ renderProfileId: req.params.id })
      .value();

    if (projectsUsingProfile.length > 0) {
      // Update projects to remove this profile
      freshDb.get('projects')
        .filter({ renderProfileId: req.params.id })
        .each(project => {
          // Assign default config file instead of null
          const defaultProfile = freshDb.get('renderProfiles')
            .find({ isDefault: true })
            .value();
          
          project.renderProfileId = defaultProfile ? defaultProfile.id : null;
        })
        .write();
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

module.exports = router; 