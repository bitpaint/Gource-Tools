const express = require('express');
const router = express.Router();
const RepositoryController = require('../controllers/repositoryController');
const Database = require('../utils/Database');
const { createComponentLogger } = require('../utils/Logger');
const logger = createComponentLogger('ReposRoute');

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
 * @route POST /api/repositories/update/:id
 * @desc Update a repository and regenerate its log
 * @access Public
 */
router.post('/update/:id', async (req, res) => {
  try {
    // ID validation
    if (!req.params.id) {
      return res.status(400).json({ success: false, message: 'Repository ID required' });
    }
    
    // Get the repository from database
    const db = Database.getDatabase();
    const repository = db.get("repositories")
      .find({ id: req.params.id.toString() })
      .value();
    
    if (!repository) {
      return res.status(404).json({ success: false, message: 'Repository not found' });
    }
    
    // First pull the latest changes
    logger.info(`Updating repository: ${repository.name} (ID: ${repository.id})`);
    const pullResult = await RepositoryController.pullRepository(req.params.id);
    
    // Then generate the log file
    logger.info(`Generating log for repository: ${repository.name} (ID: ${repository.id})`);
    const LogService = require('../services/logService');
    const logResult = await LogService.generateRepoLog(repository);
    
    return res.json({ 
      success: true, 
      message: 'Repository updated and log generated successfully',
      pullResult,
      logResult
    });
  } catch (error) {
    logger.error('Error updating repository', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error updating repository and generating log',
      error: error.message
    });
  }
});

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
    logger.error('Error in delete repository route', error);
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
    
    logger.info(`Received pull request for repository ID: ${req.params.id}`);
    
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
    logger.error('Error pulling repository changes', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error updating repository',
      error: error.message
    });
  }
});

/**
 * @route POST /api/repositories/bulk-update
 * @desc Update multiple repositories and regenerate logs
 * @access Public
 */
router.post('/bulk-update', async (req, res) => {
  try {
    const { repoIds } = req.body;

    if (!Array.isArray(repoIds) || repoIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of repository IDs required' });
    }

    logger.info(`Starting bulk update for ${repoIds.length} repositories.`);
    
    const results = [];
    const errors = [];
    let successCount = 0;
    let failCount = 0;

    // Process sequentially to avoid overwhelming system/APIs
    for (let i = 0; i < repoIds.length; i++) {
      const repoId = repoIds[i];
      const progressPercent = Math.round(((i + 1) / repoIds.length) * 100);
      logger.info(`[Bulk Update ${progressPercent}%] Processing repository ID: ${repoId} (${i+1}/${repoIds.length})`);
      
      try {
        const db = Database.getDatabase();
        const repository = db.get("repositories")
          .find({ id: repoId.toString() })
          .value();

        if (!repository) {
          throw new Error('Repository not found in database');
        }

        // 1. Pull latest changes
        logger.info(`[Bulk Update ${progressPercent}%] Pulling changes for ${repository.name}`);
        const pullResult = await RepositoryController.pullRepository(repoId);
        
        // 2. Regenerate log
        logger.info(`[Bulk Update ${progressPercent}%] Regenerating log for ${repository.name}`);
        const LogService = require('../services/logService');
        const logResult = await LogService.generateRepoLog(repository);

        results.push({ repoId, name: repository.name, success: true, pullResult, logResult });
        successCount++;
      } catch (error) {
        logger.error(`[Bulk Update] Failed processing repository ${repoId}`, error);
        errors.push({ repoId, success: false, error: error.message });
        failCount++;
        // Continue to the next repository even if one fails
      }
    }

    logger.info(`Bulk update completed. Success: ${successCount}, Failed: ${failCount}`);
    
    res.json({
      success: failCount === 0, // Overall success if no errors
      message: `Bulk update finished. ${successCount} succeeded, ${failCount} failed.`,
      results,
      errors
    });
  } catch (error) {
    logger.error('Error in bulk update', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error performing bulk update',
      error: error.message
    });
  }
});

// Additional repository routes can be added here as needed

module.exports = router; 