const express = require('express');
const router = express.Router();
const RepositoryController = require('../controllers/RepositoryController');
const Database = require('../utils/Database');

// Get all repositories
router.get('/', RepositoryController.getAllRepositories);

// Get repository statistics for dashboard
router.get('/stats', RepositoryController.getDashboardStats);

// Get bulk import status
router.get('/bulk-import-status/:bulkImportId', RepositoryController.getBulkImportStatus);

// Get a single repository
router.get('/:id', RepositoryController.getRepositoryById);

// Get clone status
router.get('/clone-status/:cloneId', RepositoryController.getCloneStatus);

// Add a new repository
router.post('/', RepositoryController.addRepository);

// Start bulk import
router.post('/bulk-import', RepositoryController.bulkImport);

/**
 * @route DELETE /api/repositories/:id
 * @desc Delete a repository
 * @access Public
 */
router.delete('/:id', async (req, res) => {
  try {
    // ID validation
    if (!req.params.id) {
      return res.status(400).json({ success: false, message: 'Repository ID required' });
    }
    
    const deleted = await RepositoryController.deleteRepository(req.params.id);
    
    if (deleted) {
      return res.json({ 
        success: true, 
        message: 'Repository deleted successfully' 
      });
    } else {
      return res.status(404).json({ success: false, message: 'Repository not found' });
    }
  } catch (error) {
    console.error('Error in delete repository route:', error);
    return res.status(400).json({ 
      success: false, 
      message: error.message || 'Error deleting repository',
      error: error.message
    });
  }
});

/**
 * @route POST /api/repositories/:id/pull
 * @desc Pull latest changes from a git repository
 * @access Public
 */
router.post('/:id/pull', async (req, res) => {
  try {
    // ID validation
    if (!req.params.id) {
      return res.status(400).json({ success: false, message: 'Repository ID required' });
    }
    
    console.log(`Received pull request for repository ID: ${req.params.id}`);
    
    // Get the repository directly from the database instead of using the controller
    const db = Database.getDatabase();
    const repository = db.get("repositories")
      .find({ id: req.params.id.toString() })
      .value();
    
    if (!repository) {
      return res.status(404).json({ success: false, message: 'Repository not found' });
    }
    
    // Execute git pull command on the repository
    const pullResult = await RepositoryController.pullRepository(req.params.id);
    
    return res.json({ 
      success: true, 
      message: 'Repository updated successfully',
      ...pullResult
    });
  } catch (error) {
    console.error('Error pulling repository changes:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error updating repository',
      error: error.message
    });
  }
});

// Additional repository routes can be added here as needed

module.exports = router; 