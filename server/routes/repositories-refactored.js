const express = require('express');
const router = express.Router();
const RepositoryController = require('../controllers/RepositoryController');

// Get all repositories
router.get('/', RepositoryController.getAllRepositories);

// Get a single repository
router.get('/:id', RepositoryController.getRepositoryById);

// Get clone status
router.get('/clone-status/:cloneId', RepositoryController.getCloneStatus);

// Add a new repository
router.post('/', RepositoryController.addRepository);

// Additional repository routes can be added here as needed

module.exports = router; 