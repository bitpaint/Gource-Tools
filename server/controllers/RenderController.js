/**
 * Render Controller
 * Handles HTTP requests related to render operations
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const RenderService = require('../services/renderService');
const Validator = require('../validators/RequestValidator');
const Logger = require('../utils/Logger');
const Database = require('../utils/Database');
const { v4: uuidv4 } = require('uuid');

// Create a component logger
const logger = Logger.createComponentLogger('RenderController');

// Define path to exports directory
const __rootdir = path.resolve(path.dirname(__dirname), '../');
const exportsDir = path.join(__rootdir, 'exports');
// Ensure exports directory exists
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
  logger.file(`Created exports directory: ${exportsDir}`);
}

/**
 * Get all renders (history)
 */
const getAllRenders = (req, res) => {
  try {
    logger.info('Retrieving all renders');
    const renders = RenderService.getAllRenders();
    logger.success(`Retrieved ${renders.length} render records`);
    res.json(renders);
  } catch (error) {
    logger.error('Failed to fetch all renders', error);
    res.status(500).json({ error: 'Failed to fetch renders' });
  }
};

/**
 * Get a single render by ID
 */
const getRenderById = (req, res) => {
  try {
    const validation = Validator.validateId(req.params.id);
    if (!Validator.handleValidation(validation, res)) {
      logger.warn(`Invalid render ID: ${req.params.id}`);
      return;
    }
    
    logger.info(`Retrieving render with ID: ${req.params.id}`);
    const render = RenderService.getRenderById(req.params.id);
    
    if (!render) {
      logger.warn(`Render not found: ${req.params.id}`);
      return res.status(404).json({ error: 'Render not found' });
    }
    
    logger.success(`Retrieved render: ${render.id}`);
    res.json(render);
  } catch (error) {
    logger.error('Failed to fetch render by ID', error);
    res.status(500).json({ error: 'Failed to fetch render' });
  }
};

/**
 * Get the progress and status of a specific render
 */
const getRenderProgress = (req, res) => {
  try {
    const validation = Validator.validateId(req.params.id);
    if (!Validator.handleValidation(validation, res)) {
      logger.warn(`Invalid render ID for progress check: ${req.params.id}`);
      return;
    }

    logger.info(`Checking progress for render ID: ${req.params.id}`);
    const render = RenderService.getRenderById(req.params.id);

    if (!render) {
      logger.warn(`Render not found during progress check: ${req.params.id}`);
      return res.status(404).json({ error: 'Render not found' });
    }

    logger.success(`Retrieved progress for render ${render.id}: Status=${render.status}, Progress=${render.progress}`);
    res.json({
      id: render.id,
      status: render.status,
      progress: render.progress || 0, // Default to 0 if progress is not set
      message: render.message || ''
    });
  } catch (error) {
    logger.error('Failed to fetch render progress by ID', error);
    res.status(500).json({ error: 'Failed to fetch render progress' });
  }
};

/**
 * Start a new render
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const startRender = async (req, res) => {
  try {
    // Validate input
    if (!req.body.projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    const db = Database.getDatabase();
    const project = db.get('projects')
      .find({ id: req.body.projectId })
      .value();
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Verify the project has at least one repository
    if (!project.repositories || project.repositories.length === 0) {
      return res.status(400).json({ error: 'Project has no repositories' });
    }
    
    // Get repository details
    const repositories = db.get('repositories').value();
    const projectRepos = project.repositories
      .map(repoId => repositories.find(r => r.id === repoId))
      .filter(r => r !== undefined);
    
    if (projectRepos.length === 0) {
      return res.status(400).json({ error: 'Project has no valid repositories' });
    }
    
    // Attach repository details to the project for convenience
    project.repositoryDetails = projectRepos;
    
    // Get render profile if one is specified
    let renderProfileId = req.body.renderProfileId || project.renderProfileId;
    let renderProfile = null;
    
    if (renderProfileId) {
      renderProfile = db.get('renderProfiles')
        .find({ id: renderProfileId })
        .value();
    }
    
    if (!renderProfile) {
      // Find default render profile
      renderProfile = db.get('renderProfiles')
        .find({ isDefault: true })
        .value();
      
      if (renderProfile) {
        renderProfileId = renderProfile.id;
      }
    }
    
    // Generate a unique output file name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${req.body.customName || project.name}_${timestamp}.mp4`;
    const filePath = path.join(exportsDir, fileName);
    
    // Create render object
    const id = uuidv4();
    const render = {
      id,
      projectId: project.id,
      projectName: project.name,
      renderProfileId: renderProfileId,
      fileName,
      filePath,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'preparing',
      message: 'Render created',
      progress: 0,
      error: null
    };
    
    // Check if we need to apply start date and end date from the request body
    if (req.body.startDate) {
      render.startDate = req.body.startDate;
    }
    
    if (req.body.endDate || req.body.stopDate) {
      render.stopDate = req.body.endDate || req.body.stopDate;
    }
    
    // Save render to database
    db.get('renders')
      .push(render)
      .write();
    
    // Log render creation
    logger.render(`Created new render job: ${id} for project: ${project.name}`);
    
    // Ensure logs are generated BEFORE starting the render (using LogService)
    // This step is now handled by processRender
    
    // Start render process asynchronously
    setTimeout(async () => {
      try {
        await RenderService.processRender(project, render);
      } catch (error) {
        logger.error(`Error processing render ${id}: ${error.message}`);
        
        // Update render status on error
        db.get('renders')
          .find({ id })
          .assign({
            status: 'failed',
            message: error.message,
            endTime: new Date().toISOString()
          })
          .write();
      }
    }, 100);
    
    // Return the render object
    res.json(render);
  } catch (error) {
    logger.error('Error starting render:', error);
    res.status(500).json({ error: error.message || 'Error starting render' });
  }
};

/**
 * Opens the exports folder in the default file explorer.
 */
const openExportsFolder = async (req, res) => {
  try {
    // Open folder using the system's default file explorer
    const { exec } = require('child_process');
    
    if (process.platform === 'win32') {
      exec(`explorer "${exportsDir}"`);
    } else if (process.platform === 'darwin') {
      exec(`open "${exportsDir}"`);
    } else {
      exec(`xdg-open "${exportsDir}"`);
    }
    
    res.json({ success: true, path: exportsDir });
  } catch (error) {
    logger.error('Error opening exports folder', error);
    res.status(500).json({ error: 'Failed to open exports folder' });
  }
};

module.exports = {
  getAllRenders,
  getRenderById,
  startRender,
  openExportsFolder,
  getRenderProgress
}; 