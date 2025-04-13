/**
 * Render Controller
 * Handles HTTP requests related to render operations
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const RenderService = require('../services/renderService');
const FFmpegService = require('../services/FFmpegService');
const Validator = require('../validators/RequestValidator');

/**
 * Get all renders (history)
 */
const getAllRenders = (req, res) => {
  try {
    const renders = RenderService.getAllRenders();
    res.json(renders);
  } catch (error) {
    console.error('Error fetching all renders:', error);
    res.status(500).json({ error: 'Failed to fetch renders' });
  }
};

/**
 * Get all completed renders (for FFmpeg editor)
 */
const getCompletedRenders = (req, res) => {
  try {
    console.log('Fetching completed renders...');
    const renders = RenderService.getAllRenders()
      .filter(render => render.status === 'completed')
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    console.log(`Found ${renders.length} completed renders`);
    res.json(renders);
  } catch (error) {
    console.error('Error fetching completed renders:', error);
    res.status(500).json({ error: 'Failed to fetch completed renders' });
  }
};

/**
 * Get a single render by ID
 */
const getRenderById = (req, res) => {
  try {
    const validation = Validator.validateId(req.params.id);
    if (!Validator.handleValidation(validation, res)) return;
    
    const render = RenderService.getRenderById(req.params.id);
    
    if (!render) {
      return res.status(404).json({ error: 'Render not found' });
    }
    
    res.json(render);
  } catch (error) {
    console.error('Error fetching render by ID:', error);
    res.status(500).json({ error: 'Failed to fetch render' });
  }
};

/**
 * Start a new render
 */
const startRender = async (req, res) => {
  try {
    const validation = Validator.validateRequired(req.body, ['projectId']);
    if (!Validator.handleValidation(validation, res)) return;
    
    const { projectId, customName } = req.body;
    
    // Start render using RenderService
    const render = await RenderService.startRender(projectId, customName);
    
    // Send response with the created render
    res.status(202).json(render);
  } catch (error) {
    console.error('Error starting render:', error);
    res.status(500).json({ 
      error: 'Failed to start render', 
      details: error.message 
    });
  }
};

/**
 * Upload a music file for FFmpeg processing
 */
const uploadMusic = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Validate file type
    const allowedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
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
    }
    
    const targetPath = path.join(musicDir, fileName);
    
    // Move file from temp upload location to music directory
    fs.renameSync(tempPath, targetPath);
    
    // Create music file URL
    const musicUrl = `/temp/music/${fileName}`;
    
    res.json({
      success: true,
      fileName,
      filePath: targetPath,
      url: musicUrl
    });
  } catch (error) {
    console.error('Error uploading music file:', error);
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
    const exportsDir = path.join(__dirname, '../../exports');
    
    // Ensure directory exists
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
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