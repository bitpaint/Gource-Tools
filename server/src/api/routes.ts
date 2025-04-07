import express from 'express';
import * as projectController from '../controllers/projectController';
import * as repositoryController from '../controllers/repositoryController';
import * as gourceController from '../controllers/gourceController';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes pour les projets
router.get('/projects', projectController.getAllProjects);
router.get('/projects/:id', projectController.getProjectById);
router.post('/projects', projectController.createProject);
router.put('/projects/:id', projectController.updateProject);
router.delete('/projects/:id', projectController.deleteProject);

// Routes pour les dépôts
router.get('/repositories', repositoryController.getAllRepositories);
router.get('/repositories/:id', repositoryController.getRepositoryById);
router.post('/repositories', repositoryController.createRepository);
router.post('/repositories/import', repositoryController.importRepositories);
router.put('/repositories/:id', repositoryController.updateRepository);
router.delete('/repositories/:id', repositoryController.deleteRepository);
router.post('/repositories/:id/sync', repositoryController.syncRepository);
router.get('/repositories/:id/branches', repositoryController.getRepositoryBranches);

// Route spécifique pour la liaison entre projets et dépôts
router.post('/project-repositories', repositoryController.linkRepositoryToProject);

// Routes pour Gource
router.get('/gource/configs', gourceController.getAllConfigs);
router.get('/gource/configs/:id', gourceController.getConfigById);
router.post('/gource/configs', gourceController.createConfig);
router.put('/gource/configs/:id', gourceController.updateConfig);
router.post('/gource/renders', gourceController.createRender);
router.get('/gource/renders/:id/status', gourceController.getRenderStatus);

// Placeholder pour les routes futures
router.get('/renders', (req, res) => {
  res.status(200).json({ message: 'Renders API - Coming soon' });
});

router.get('/avatars', (req, res) => {
  res.status(200).json({ message: 'Avatars API - Coming soon' });
});

export { router as apiRouter }; 