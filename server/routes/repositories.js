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
 * @desc Supprimer un dépôt
 * @access Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await RepositoryController.deleteRepository(req.params.id);
    if (deleted) {
      res.json({ success: true, message: 'Dépôt supprimé avec succès' });
    } else {
      res.status(404).json({ success: false, message: 'Dépôt non trouvé' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Additional repository routes can be added here as needed

module.exports = router; 