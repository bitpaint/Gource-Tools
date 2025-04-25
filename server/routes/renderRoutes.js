const express = require('express');
const router = express.Router();
const RenderController = require('../controllers/RenderController');

// Route to start a new render
router.post('/start', RenderController.startRender);

// Route to get the progress of a specific render
router.get('/:id/progress', RenderController.getRenderProgress);

// Route to get a specific render by ID
router.get('/:id', RenderController.getRenderById);

// Other render routes...
// ... (add any other missing routes here)

// Export the router
module.exports = router; 