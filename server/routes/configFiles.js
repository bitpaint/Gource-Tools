const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Database = require('../utils/Database');
const Logger = require('../utils/Logger');
const gourceConfigService = require('../services/gourceConfigService');
const { validateGourceConfigData } = require('../validators/gourceConfigValidator');

// Create loggers
const logger = Logger.createComponentLogger('ConfigFilesRouter');

// Get all render profiles
router.get('/', (req, res) => {
  try {
    const db = Database.getDatabase();
    logger.info('Retrieving all render profiles');
    const renderProfiles = db.get('renderProfiles').value();
    logger.success(`Retrieved ${renderProfiles.length} render profiles`);
    res.json(renderProfiles);
  } catch (error) {
    logger.error('Failed to fetch render profiles', error);
    res.status(500).json({ error: 'Failed to fetch render profiles' });
  }
});

// Get a single render profile
router.get('/:id', (req, res) => {
  try {
    logger.info(`Retrieving render profile with ID: ${req.params.id}`);
    const renderProfile = Database.getDatabase().get('renderProfiles')
      .find({ id: req.params.id })
      .value();
    
    if (!renderProfile) {
      logger.warn(`Render profile not found: ${req.params.id}`);
      return res.status(404).json({ error: 'Render profile not found' });
    }
    
    logger.success(`Retrieved render profile: ${renderProfile.name}`);
    res.json(renderProfile);
  } catch (error) {
    logger.error('Failed to fetch render profile by ID', error);
    res.status(500).json({ error: 'Failed to fetch render profile' });
  }
});

// Create a new render profile
router.post('/', (req, res) => {
  try {
    const { name, description, settings } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    logger.info(`Creating new render profile: ${name}`);
    
    // Generate unique ID
    const id = uuidv4();
    
    // Create profile object
    const renderProfile = {
      id,
      name,
      description: description || '',
      settings: settings || {},
      isDefault: false,
      createdAt: new Date().toISOString()
    };
    
    // Store in database
    Database.getDatabase().get('renderProfiles')
      .push(renderProfile)
      .write();
      
    logger.success(`Created new render profile: ${name} (${id})`);
    res.status(201).json(renderProfile);
  } catch (error) {
    logger.error('Failed to create render profile', error);
    res.status(500).json({ error: 'Failed to create render profile' });
  }
});

// Update a render profile
router.put('/:id', (req, res) => {
  try {
    const { name, description, settings } = req.body;
    
    logger.info(`Updating render profile with ID: ${req.params.id}`);
    
    // Check if render profile exists
    const renderProfile = Database.getDatabase().get('renderProfiles')
      .find({ id: req.params.id })
      .value();
      
    if (!renderProfile) {
      logger.warn(`Render profile not found: ${req.params.id}`);
      return res.status(404).json({ error: 'Render profile not found' });
    }
    
    // Protect default Gource config
    if (renderProfile.isDefault) {
      logger.error(`Attempted to modify default render profile: ${req.params.id}`);
      return res.status(403).json({ error: 'The default Gource config file cannot be modified' });
    }
    
    // Update profile
    const updatedProfile = {
      ...renderProfile,
      name: name || renderProfile.name,
      description: description !== undefined ? description : renderProfile.description,
      settings: settings || renderProfile.settings,
      updatedAt: new Date().toISOString()
    };
    
    // Update in database
    Database.getDatabase().get('renderProfiles')
      .find({ id: req.params.id })
      .assign(updatedProfile)
      .write();
      
    logger.success(`Updated render profile: ${updatedProfile.name} (${req.params.id})`);
    res.json(updatedProfile);
  } catch (error) {
    logger.error('Failed to update render profile', error);
    res.status(500).json({ error: 'Failed to update render profile' });
  }
});

// Delete a render profile
router.delete('/:id', (req, res) => {
  try {
    logger.info(`Attempting to delete render profile with ID: ${req.params.id}`);
    
    // Check if render profile exists
    const renderProfile = Database.getDatabase().get('renderProfiles')
      .find({ id: req.params.id })
      .value();
      
    if (!renderProfile) {
      logger.warn(`Render profile not found: ${req.params.id}`);
      return res.status(404).json({ error: 'Render profile not found' });
    }
    
    // Protect default Gource config
    if (renderProfile.isDefault) {
      logger.error(`Attempted to delete default render profile: ${req.params.id}`);
      return res.status(403).json({ error: 'The default Gource config file cannot be deleted' });
    }
    
    // Remove from database
    Database.getDatabase().get('renderProfiles')
      .remove({ id: req.params.id })
      .write();
      
    logger.success(`Deleted render profile: ${renderProfile.name} (${req.params.id})`);
    res.json({ message: 'Render profile deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete render profile', error);
    res.status(500).json({ error: 'Failed to delete render profile' });
  }
});

// GET all Gource configs
router.get('/gource-configs', (req, res, next) => {
  try {
    const configs = gourceConfigService.getAllGourceConfigs();
    res.json(configs);
  } catch (error) {
    logger.error('Error fetching Gource configs:', error);
    next(error);
  }
});

// GET a single Gource config by ID
router.get('/gource-configs/:id', (req, res, next) => {
  try {
    const config = gourceConfigService.getGourceConfigById(req.params.id);
    if (!config) {
      return res.status(404).json({ error: 'Gource config not found' });
    }
    res.json(config);
  } catch (error) {
    logger.error(`Error fetching Gource config ${req.params.id}:`, error);
    next(error);
  }
});

// POST create a new Gource config
router.post('/gource-configs', (req, res, next) => {
  try {
    const newConfig = gourceConfigService.createGourceConfig(req.body);
    res.status(201).json(newConfig);
  } catch (error) {
    logger.error('Error creating Gource config:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
});

// PUT update an existing Gource config
router.put('/gource-configs/:id', (req, res, next) => {
  try {
    const configId = req.params.id;
    const existingConfig = gourceConfigService.getGourceConfigById(configId);
    if (existingConfig && existingConfig.isSystemConfig) {
      return res.status(403).json({ error: 'System Gource configurations cannot be modified.' });
    }
    
    const updatedConfig = { ...req.body, id: configId };
    if (!updatedConfig) {
      return res.status(404).json({ error: 'Gource config not found' });
    }
    
    res.json(updatedConfig);
  } catch (error) {
    logger.error(`Error updating Gource config ${req.params.id}:`, error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
});

// DELETE a Gource config
router.delete('/gource-configs/:id', (req, res, next) => {
  try {
    const configId = req.params.id;
    const existingConfig = gourceConfigService.getGourceConfigById(configId);
    if (existingConfig && existingConfig.isSystemConfig) {
      return res.status(403).json({ error: 'System Gource configurations cannot be deleted.' });
    }
    
    const deleted = existingConfig ? true : false;
    
    if (!deleted) {
      return res.status(404).json({ error: 'Gource config not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting Gource config ${req.params.id}:`, error);
    next(error);
  }
});

module.exports = router; 