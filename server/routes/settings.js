const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');

// Get application settings
router.get('/', SettingsController.getSettings);

// Update application settings
router.put('/', SettingsController.updateSettings);

// Validate GitHub token
router.post('/validate-token', SettingsController.validateGithubToken);

// Get default project render profile ID
router.get('/default-profile', SettingsController.getDefaultProfile);

// Set default project render profile ID
router.put('/default-profile', SettingsController.setDefaultProfile);

module.exports = router; 