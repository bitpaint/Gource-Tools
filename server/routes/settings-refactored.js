const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');

// Get application settings
router.get('/', SettingsController.getSettings);

// Update application settings
router.post('/', SettingsController.updateSettings);

// Validate GitHub token
router.post('/validate-token', SettingsController.validateGithubToken);

module.exports = router; 