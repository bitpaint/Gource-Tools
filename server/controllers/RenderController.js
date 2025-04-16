/**
 * Render Controller
 * Handles HTTP requests related to render operations
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const RenderService = require('../services/renderService');
const FFmpegService = require('../services/ffmpegService');
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
 * Get all completed renders (for FFmpeg editor)
 */
const getCompletedRenders = (req, res) => {
  try {
    logger.info('Fetching completed renders');
    const renders = RenderService.getAllRenders()
      .filter(render => render.status === 'completed')
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    logger.success(`Found ${renders.length} completed renders`);
    res.json(renders);
  } catch (error) {
    logger.error('Failed to fetch completed renders', error);
    res.status(500).json({ error: 'Failed to fetch completed renders' });
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
 * Upload a music file for FFmpeg processing
 */
const uploadMusic = (req, res) => {
  try {
    if (!req.file) {
      logger.warn('Music upload failed: no file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Validate file type
    const allowedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      logger.warn(`Invalid file type: ${req.file.mimetype}`);
      return res.status(400).json({ 
        error: 'Invalid file type. Only MP3, WAV, and OGG audio files are allowed.' 
      });
    }
    
    const tempPath = req.file.path;
    const fileName = `music_${Date.now()}_${req.file.originalname}`;
    
    // Create music directory if it doesn't exist
    const musicDir = path.join(__dirname, '../../temp/music');
    if (!fs.existsSync(musicDir)) {
      fs.mkdirSync(musicDir, { recursive: true });
      logger.file(`Created music directory: ${musicDir}`);
    }
    
    const targetPath = path.join(musicDir, fileName);
    
    // Move file from temp upload location to music directory
    fs.renameSync(tempPath, targetPath);
    
    // Create music file URL
    const musicUrl = `/temp/music/${fileName}`;
    
    logger.success(`Uploaded music file: ${fileName}`);
    res.json({
      success: true,
      fileName,
      filePath: targetPath,
      url: musicUrl
    });
  } catch (error) {
    logger.error('Failed to upload music file', error);
    res.status(500).json({ error: 'Failed to upload music file' });
  }
};

/**
 * Generate FFmpeg preview with filters
 */
const generateFFmpegPreview = async (req, res) => {
  try {
    // Validate ID
    const idValidation = Validator.validateId(req.params.id);
    if (!Validator.handleValidation(idValidation, res)) return;
    
    // Validate filters
    const filtersValidation = Validator.validateRenderFilters(req.body);
    if (!Validator.handleValidation(filtersValidation, res)) return;
    
    // Get the render
    const render = RenderService.getRenderById(req.params.id);
    if (!render) {
      return res.status(404).json({ error: 'Render not found' });
    }
    
    // Validate the file exists
    const fileValidation = Validator.validateFileExists(
      render.filePath, 
      'Render file not found or has been deleted'
    );
    if (!Validator.handleValidation(fileValidation, res)) return;
    
    // Generate preview using FFmpegService
    const previewResult = await FFmpegService.generatePreview(
      req.params.id, 
      filtersValidation.sanitizedFilters
    );
    
    res.json(previewResult);
  } catch (error) {
    console.error('Error generating FFmpeg preview:', error);
    res.status(500).json({ 
      error: 'Failed to generate preview', 
      details: error.message 
    });
  }
};

/**
 * Apply FFmpeg filters to render
 */
const applyFFmpegFilters = async (req, res) => {
  try {
    // Validate ID
    const idValidation = Validator.validateId(req.params.id);
    if (!Validator.handleValidation(idValidation, res)) return;
    
    // Validate filters
    const filtersValidation = Validator.validateRenderFilters(req.body);
    if (!Validator.handleValidation(filtersValidation, res)) return;
    
    // Get the render
    const render = RenderService.getRenderById(req.params.id);
    if (!render) {
      return res.status(404).json({ error: 'Render not found' });
    }
    
    // Validate the file exists
    const fileValidation = Validator.validateFileExists(
      render.filePath, 
      'Render file not found or has been deleted'
    );
    if (!Validator.handleValidation(fileValidation, res)) return;
    
    // Apply filters using FFmpegService
    const result = await FFmpegService.applyFilters(
      req.params.id, 
      filtersValidation.sanitizedFilters
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error applying FFmpeg filters:', error);
    res.status(500).json({ 
      error: 'Failed to apply filters', 
      details: error.message 
    });
  }
};

/**
 * Open exports folder
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
    console.error('Error opening exports folder:', error);
    res.status(500).json({ error: 'Failed to open exports folder' });
  }
};

module.exports = {
  getAllRenders,
  getCompletedRenders,
  getRenderById,
  startRender,
  uploadMusic,
  generateFFmpegPreview,
  applyFFmpegFilters,
  openExportsFolder
}; 