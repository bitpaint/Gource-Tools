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

// Get a single render status
router.get('/:id', RenderController.getRenderById);

// Start a new render
router.post('/start', RenderController.startRender);

// Upload music file for FFmpeg processing
router.post('/upload-music', upload.single('music'), RenderController.uploadMusic);

// Generate preview with FFmpeg filters
router.post('/:id/ffmpeg-preview', RenderController.generateFFmpegPreview);

// Apply FFmpeg filters
router.post('/:id/ffmpeg-process', RenderController.applyFFmpegFilters);

// Open exports folder
router.post('/open-exports', RenderController.openExportsFolder);

module.exports = router; 