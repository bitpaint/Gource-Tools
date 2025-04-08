"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = __importDefault(require("express"));
const projectController = __importStar(require("../controllers/projectController"));
const repositoryController = __importStar(require("../controllers/repositoryController"));
const gourceController = __importStar(require("../controllers/gourceController"));
const settingsController = __importStar(require("../controllers/settingsController"));
const router = express_1.default.Router();
exports.apiRouter = router;
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
