// Routeur Express pour /api/renders
const express = require('express');
const router = express.Router();
const RenderController = require('../controllers/RenderController');

// GET /api/renders - liste tous les rendus
router.get('/', RenderController.getAllRenders);

// GET /api/renders/:id - détail d'un rendu
router.get('/:id', RenderController.getRenderById);

// POST /api/renders - lancer un nouveau rendu
router.post('/', RenderController.startRender);

// POST /api/renders/start - compatibilité legacy
router.post('/start', RenderController.startRender);

// GET /api/renders/:id/progress - progression d'un rendu
router.get('/:id/progress', RenderController.getRenderProgress);

// Ouvre le dossier exports (optionnel)
router.get('/open/exports', RenderController.openExportsFolder);
// Compatibilité : POST /api/renders/open-exports
router.post('/open-exports', RenderController.openExportsFolder);

module.exports = router;
