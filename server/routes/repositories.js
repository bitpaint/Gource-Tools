const express = require('express');
const router = express.Router();
const RepositoryController = require('../controllers/RepositoryController');

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

// Additional repository routes can be added here as needed

module.exports = router; 