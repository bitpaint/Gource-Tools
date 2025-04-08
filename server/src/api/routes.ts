import express from 'express';
import * as projectController from '../controllers/projectController';
import * as repositoryController from '../controllers/repositoryController';
import * as gourceController from '../controllers/gourceController';
import * as settingsController from '../controllers/settingsController';

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
router.get('/repositories/:id/topics', repositoryController.getRepositoryTopics);
router.post('/repositories/force-update-tags', repositoryController.forceUpdateAllTags);

// Route spécifique pour la liaison entre projets et dépôts
router.post('/project-repositories', repositoryController.linkRepositoryToProject);

// Routes pour Gource
router.get('/gource/configs', gourceController.getAllConfigs);
router.get('/gource/configs/:id', gourceController.getConfigById);
router.post('/gource/configs', gourceController.createConfig);
router.put('/gource/configs/:id', gourceController.updateConfig);
router.post('/gource/renders', gourceController.createRender);
router.get('/gource/renders/:id/status', gourceController.getRenderStatus);

// Routes pour les réglages
router.get('/settings/github/token', settingsController.checkGithubToken);
router.post('/settings/github/token', settingsController.saveGithubToken);
router.get('/settings/github/token/test', settingsController.testGithubToken);
router.delete('/settings/github/token', settingsController.removeGithubToken);

// Placeholder pour les routes futures
router.get('/renders', (req, res) => {
  res.status(200).json({ message: 'Renders API - Coming soon' });
});

router.get('/avatars', (req, res) => {
  res.status(200).json({ message: 'Avatars API - Coming soon' });
});

export { router as apiRouter }; 