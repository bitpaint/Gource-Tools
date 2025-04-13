const express = require('express');
const router = express.Router();
const ConfigController = require('../controllers/ConfigController');

// Get all render profiles
router.get('/', ConfigController.getAllRenderProfiles);

// Get a single render profile
router.get('/:id', ConfigController.getRenderProfileById);

// Create a new render profile
router.post('/', ConfigController.createRenderProfile);

// Update a render profile
router.put('/:id', ConfigController.updateRenderProfile);

// Delete a render profile
router.delete('/:id', ConfigController.deleteRenderProfile);

module.exports = router; 