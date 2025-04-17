const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const RenderController = require('../controllers/RenderController');

// Configure multer for file uploads
const upload = multer({ dest: path.join(__dirname, '../../temp/uploads/') });

// Get all renders (history)
router.get('/', RenderController.getAllRenders);

// Get completed renders (for FFmpeg editor)
router.get('/completed', RenderController.getCompletedRenders);

// Start a new render
router.post('/start', RenderController.startRender);

// Open exports folder
router.post('/open-exports', RenderController.openExportsFolder);

// Upload music file for FFmpeg processing
router.post('/upload-music', upload.single('music'), RenderController.uploadMusic);

// IMPORTANT: Put specific paths before parameterized ones!
// Get render progress - ADDED FOR PROGRESS BAR SUPPORT
router.get('/:id/progress', RenderController.getRenderProgress);

// Generate preview with FFmpeg filters
router.post('/:id/ffmpeg-preview', RenderController.generateFFmpegPreview);

// Apply FFmpeg filters
router.post('/:id/ffmpeg-process', RenderController.applyFFmpegFilters);

// THIS MUST BE LAST - Get a single render by ID
router.get('/:id', RenderController.getRenderById);

module.exports = router; 