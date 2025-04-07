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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkRepositoryToProject = exports.importRepositories = exports.getRepositoryBranches = exports.syncRepository = exports.deleteRepository = exports.updateRepository = exports.createRepository = exports.getRepositoryById = exports.getAllRepositories = void 0;
const database_1 = __importDefault(require("../models/database"));
const uuid_1 = require("uuid");
const gitService = __importStar(require("../services/gitService"));
// Récupérer tous les dépôts
const getAllRepositories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.query.project_id;
        if (projectId) {
            // Si project_id est fourni, récupérer les dépôts liés à ce projet
            database_1.default.all(`
        SELECT r.*, pr.branch_override, pr.display_name, pr.id as link_id 
        FROM repositories r
        JOIN project_repositories pr ON r.id = pr.repository_id
        WHERE pr.project_id = ?
        ORDER BY r.last_updated DESC
      `, [projectId], (err, rows) => {
                if (err) {
                    console.error('Erreur lors de la récupération des dépôts du projet:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la récupération des dépôts' });
                }
                return res.status(200).json(rows);
            });
        }
        else {
            // Sinon, récupérer tous les dépôts
            database_1.default.all('SELECT * FROM repositories ORDER BY last_updated DESC', [], (err, rows) => {
                if (err) {
                    console.error('Erreur lors de la récupération des dépôts:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la récupération des dépôts' });
                }
                return res.status(200).json(rows);
            });
        }
    }
    catch (error) {
        console.error('Erreur inattendue lors de la récupération des dépôts:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération des dépôts' });
    }
});
exports.getAllRepositories = getAllRepositories;
// Récupérer un dépôt par son ID
const getRepositoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const projectId = req.query.project_id;
        if (projectId) {
            // Si project_id est fourni, récupérer le dépôt dans le contexte du projet
            database_1.default.get(`
        SELECT r.*, pr.branch_override, pr.display_name, pr.id as link_id 
        FROM repositories r
        JOIN project_repositories pr ON r.id = pr.repository_id
        WHERE r.id = ? AND pr.project_id = ?
      `, [id, projectId], (err, row) => {
                if (err) {
                    console.error('Erreur lors de la récupération du dépôt:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la récupération du dépôt' });
                }
                if (!row) {
                    return res.status(404).json({ error: 'Dépôt non trouvé dans ce projet' });
                }
                return res.status(200).json(row);
            });
        }
        else {
            // Sinon, récupérer le dépôt général
            database_1.default.get('SELECT * FROM repositories WHERE id = ?', [id], (err, row) => {
                if (err) {
                    console.error('Erreur lors de la récupération du dépôt:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la récupération du dépôt' });
                }
                if (!row) {
                    return res.status(404).json({ error: 'Dépôt non trouvé' });
                }
                return res.status(200).json(row);
            });
        }
    }
    catch (error) {
        console.error('Erreur inattendue lors de la récupération du dépôt:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération du dépôt' });
    }
});
exports.getRepositoryById = getRepositoryById;
// Créer un nouveau dépôt dans le système et optionnellement l'associer à un projet
const createRepository = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { project_id, name, url, branch_default, download_avatars = true, username, topics } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Le nom du dépôt est requis' });
        }
        // Si un project_id est fourni, vérifier si le projet existe
        if (project_id) {
            database_1.default.get('SELECT * FROM projects WHERE id = ?', [project_id], (err, row) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    console.error('Erreur lors de la vérification du projet:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la création du dépôt' });
                }
                if (!row) {
                    return res.status(404).json({ error: 'Projet non trouvé' });
                }
                // Continuer avec la création du dépôt
                yield createRepositoryAndLink();
            }));
        }
        else {
            // Créer le dépôt sans lien avec un projet
            yield createRepositoryAndLink();
        }
        function createRepositoryAndLink() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    // Si une URL est fournie, chercher d'abord si ce dépôt existe déjà
                    let repoId;
                    let local_path = null;
                    let avatarsResult = null;
                    if (url) {
                        // Normaliser l'URL du dépôt avant de vérifier s'il existe
                        const normalizedUrl = gitService.normalizeGitUrl(url);
                        repoId = gitService.generateRepoId(normalizedUrl);
                        // Vérifier si le dépôt existe déjà
                        const existingRepo = yield new Promise((resolve) => {
                            database_1.default.get('SELECT * FROM repositories WHERE id = ?', [repoId], (err, row) => {
                                if (err || !row) {
                                    resolve(null);
                                }
                                else {
                                    resolve(row);
                                }
                            });
                        });
                        if (existingRepo) {
                            // Le dépôt existe déjà, on peut juste l'associer au projet si nécessaire
                            if (project_id) {
                                yield linkRepositoryToProject(existingRepo.id, project_id, name, branch_default);
                            }
                            return res.status(200).json(Object.assign(Object.assign({}, existingRepo), { message: 'Repository already exists and was retrieved successfully', existing: true }));
                        }
                        // Le dépôt n'existe pas encore, le télécharger
                        try {
                            local_path = yield gitService.downloadRepository(normalizedUrl);
                            // Télécharger les avatars si l'option est activée
                            if (download_avatars && local_path) {
                                const avatarService = require('../services/avatarService');
                                avatarsResult = yield avatarService.downloadAvatarsForRepo(local_path);
                                console.log(`Téléchargement des avatars: ${avatarsResult.success} sur ${avatarsResult.total} utilisateurs`);
                            }
                        }
                        catch (error) {
                            // Préparer un message d'erreur convivial
                            let errorMessage = 'Error downloading repository';
                            if (error.message.includes("does not exist or is private")) {
                                errorMessage = `Repository ${normalizedUrl} doesn't exist or is private. Check the URL and make sure the repository is public.`;
                            }
                            else if (error.message.includes("Authentication required")) {
                                errorMessage = `Repository ${normalizedUrl} requires authentication. Only public repositories are supported at the moment.`;
                            }
                            else if (error.message.includes("timeout")) {
                                errorMessage = `Downloading repository ${normalizedUrl} took too long. The repository might be too large or temporarily unavailable.`;
                            }
                            console.error('Detailed error while downloading repository:', error);
                            return res.status(400).json({ error: errorMessage });
                        }
                    }
                    else {
                        // Pas d'URL, c'est un dépôt local
                        repoId = (0, uuid_1.v4)();
                    }
                    // Extraire le nom d'utilisateur à partir de l'URL si non fourni et que l'URL est de GitHub
                    let extractedUsername = username;
                    if (!extractedUsername && url && url.includes('github.com')) {
                        const parts = url.split('/');
                        if (parts.length >= 2) {
                            // Pour une URL comme https://github.com/username/repo, prendre username
                            extractedUsername = parts[parts.length - 2];
                        }
                    }
                    // Convertir les topics en format texte pour le stockage
                    const topicsText = topics ? (Array.isArray(topics) ? topics.join(',') : topics) : null;
                    // Créer l'entrée du dépôt
                    const now = new Date().toISOString();
                    yield new Promise((resolve, reject) => {
                        database_1.default.run('INSERT INTO repositories (id, name, url, local_path, branch_default, last_updated, username, topics) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [repoId, name, url || null, local_path || null, branch_default || 'main', now, extractedUsername || null, topicsText], (err) => {
                            if (err) {
                                console.error('Erreur lors de la création du dépôt:', err.message);
                                reject(err);
                            }
                            else {
                                console.log(`Dépôt créé avec succès: ${name}`);
                                resolve();
                            }
                        });
                    });
                    // Si c'est dans le contexte d'un projet, créer l'association
                    let projectLinkId = null;
                    if (project_id) {
                        projectLinkId = yield linkRepositoryToProject(repoId, project_id, name, branch_default);
                    }
                    // Récupérer le dépôt créé pour le renvoyer dans la réponse
                    const repository = yield new Promise((resolve, reject) => {
                        database_1.default.get('SELECT * FROM repositories WHERE id = ?', [repoId], (err, row) => {
                            if (err) {
                                console.error('Erreur lors de la récupération du dépôt créé:', err.message);
                                reject(err);
                            }
                            else if (!row) {
                                reject(new Error('Dépôt non trouvé après création'));
                            }
                            else {
                                resolve(row);
                            }
                        });
                    });
                    return res.status(201).json({
                        repository,
                        project_link_id: projectLinkId,
                        message: 'Dépôt créé avec succès',
                        avatars_downloaded: avatarsResult
                    });
                }
                catch (error) {
                    console.error('Error creating repository:', error);
                    return res.status(500).json({ error: 'Error creating repository' });
                }
            });
        }
        function linkRepositoryToProject(repoId, projectId, displayName, branchOverride) {
            return __awaiter(this, void 0, void 0, function* () {
                // Vérifier si le lien existe déjà
                const existingLink = yield new Promise((resolve) => {
                    database_1.default.get('SELECT * FROM project_repositories WHERE project_id = ? AND repository_id = ?', [projectId, repoId], (err, row) => {
                        if (err || !row) {
                            resolve(false);
                        }
                        else {
                            resolve(true);
                        }
                    });
                });
                if (existingLink) {
                    return; // Le lien existe déjà, ne rien faire
                }
                // Créer le lien
                const linkId = (0, uuid_1.v4)();
                yield new Promise((resolve, reject) => {
                    database_1.default.run('INSERT INTO project_repositories (id, project_id, repository_id, branch_override, display_name) VALUES (?, ?, ?, ?, ?)', [linkId, projectId, repoId, branchOverride || null, displayName || null], function (err) {
                        if (err) {
                            console.error('Erreur lors de la liaison du dépôt au projet:', err.message);
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                });
            });
        }
    }
    catch (error) {
        console.error('Erreur inattendue lors de la création du dépôt:', error);
        return res.status(500).json({ error: 'Erreur lors de la création du dépôt' });
    }
});
exports.createRepository = createRepository;
// Mettre à jour un dépôt
const updateRepository = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, url, branch_default, branch_override, display_name } = req.body;
        const project_id = req.query.project_id;
        if (!name) {
            return res.status(400).json({ error: 'Le nom du dépôt est requis' });
        }
        // Si project_id est fourni, mettre à jour le lien
        if (project_id) {
            // Vérifier si le lien existe
            database_1.default.get('SELECT pr.*, r.* FROM project_repositories pr JOIN repositories r ON pr.repository_id = r.id WHERE r.id = ? AND pr.project_id = ?', [id, project_id], (err, row) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    console.error('Erreur lors de la recherche du lien:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la mise à jour du dépôt' });
                }
                if (!row) {
                    return res.status(404).json({ error: 'Lien projet-dépôt non trouvé' });
                }
                const typedRow = row;
                // Mettre à jour le lien
                database_1.default.run('UPDATE project_repositories SET branch_override = ?, display_name = ? WHERE project_id = ? AND repository_id = ?', [branch_override || undefined, display_name || name, project_id, id], function (err) {
                    if (err) {
                        console.error('Erreur lors de la mise à jour du lien:', err.message);
                        return res.status(500).json({ error: 'Erreur lors de la mise à jour du dépôt' });
                    }
                    // Mettre à jour le dépôt
                    database_1.default.run('UPDATE repositories SET name = ?, branch_default = ? WHERE id = ?', [name, branch_default || typedRow.branch_default, id], function (err) {
                        if (err) {
                            console.error('Erreur lors de la mise à jour du dépôt:', err.message);
                            return res.status(500).json({ error: 'Erreur lors de la mise à jour du dépôt' });
                        }
                        return res.status(200).json(Object.assign(Object.assign({}, typedRow), { name, branch_default: branch_default || typedRow.branch_default, branch_override: branch_override || undefined, display_name: display_name || name }));
                    });
                });
            }));
        }
        else {
            // Mettre à jour uniquement le dépôt
            database_1.default.get('SELECT * FROM repositories WHERE id = ?', [id], (err, row) => {
                if (err) {
                    console.error('Erreur lors de la recherche du dépôt:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la mise à jour du dépôt' });
                }
                if (!row) {
                    return res.status(404).json({ error: 'Dépôt non trouvé' });
                }
                const repository = row;
                // Mettre à jour le dépôt
                database_1.default.run('UPDATE repositories SET name = ?, branch_default = ? WHERE id = ?', [name, branch_default || repository.branch_default, id], function (err) {
                    if (err) {
                        console.error('Erreur lors de la mise à jour du dépôt:', err.message);
                        return res.status(500).json({ error: 'Erreur lors de la mise à jour du dépôt' });
                    }
                    return res.status(200).json(Object.assign(Object.assign({}, repository), { name, branch_default: branch_default || repository.branch_default }));
                });
            });
        }
    }
    catch (error) {
        console.error('Erreur inattendue lors de la mise à jour du dépôt:', error);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du dépôt' });
    }
});
exports.updateRepository = updateRepository;
// Supprimer un dépôt (ou son lien avec un projet)
const deleteRepository = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const project_id = req.query.project_id;
        if (project_id) {
            // Si project_id est fourni, supprimer uniquement le lien
            database_1.default.run('DELETE FROM project_repositories WHERE project_id = ? AND repository_id = ?', [project_id, id], function (err) {
                if (err) {
                    console.error('Erreur lors de la suppression du lien:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la suppression du lien' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Lien projet-dépôt non trouvé' });
                }
                return res.status(200).json({ message: 'Dépôt retiré du projet avec succès' });
            });
        }
        else {
            // Sinon, supprimer complètement le dépôt
            database_1.default.get('SELECT * FROM repositories WHERE id = ?', [id], (err, row) => {
                if (err) {
                    console.error('Erreur lors de la recherche du dépôt:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la suppression du dépôt' });
                }
                if (!row) {
                    return res.status(404).json({ error: 'Dépôt non trouvé' });
                }
                // D'abord supprimer tous les liens
                database_1.default.run('DELETE FROM project_repositories WHERE repository_id = ?', [id], function (err) {
                    if (err) {
                        console.error('Erreur lors de la suppression des liens:', err.message);
                        return res.status(500).json({ error: 'Erreur lors de la suppression du dépôt' });
                    }
                    // Puis supprimer le dépôt
                    database_1.default.run('DELETE FROM repositories WHERE id = ?', [id], function (err) {
                        if (err) {
                            console.error('Erreur lors de la suppression du dépôt:', err.message);
                            return res.status(500).json({ error: 'Erreur lors de la suppression du dépôt' });
                        }
                        return res.status(200).json({ message: 'Dépôt supprimé avec succès' });
                    });
                });
            });
        }
    }
    catch (error) {
        console.error('Erreur inattendue lors de la suppression du dépôt:', error);
        return res.status(500).json({ error: 'Erreur lors de la suppression du dépôt' });
    }
});
exports.deleteRepository = deleteRepository;
// Synchroniser un dépôt (git pull)
const syncRepository = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Vérifier si le dépôt existe
        database_1.default.get('SELECT * FROM repositories WHERE id = ?', [id], (err, row) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.error('Erreur lors de la recherche du dépôt:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la synchronisation du dépôt' });
            }
            if (!row) {
                return res.status(404).json({ error: 'Dépôt non trouvé' });
            }
            const repository = row;
            // Vérifier si le dépôt a un chemin local
            if (!repository.local_path) {
                return res.status(400).json({ error: 'Ce dépôt n\'a pas de chemin local à synchroniser' });
            }
            try {
                // Synchroniser le dépôt
                const result = yield gitService.updateRepository(repository.local_path);
                // Mettre à jour la date de dernière modification
                const now = new Date().toISOString();
                database_1.default.run('UPDATE repositories SET last_updated = ? WHERE id = ?', [now, id], function (err) {
                    if (err) {
                        console.error('Erreur lors de la mise à jour de la date:', err.message);
                        return res.status(500).json({ error: 'Erreur lors de la mise à jour de la date' });
                    }
                    return res.status(200).json({
                        message: 'Dépôt synchronisé avec succès',
                        result,
                        last_updated: now
                    });
                });
            }
            catch (error) {
                console.error('Erreur lors de la synchronisation du dépôt:', error);
                return res.status(500).json({
                    error: `Erreur lors de la synchronisation du dépôt: ${error.message || 'Erreur inconnue'}`
                });
            }
        }));
    }
    catch (error) {
        console.error('Erreur inattendue lors de la synchronisation du dépôt:', error);
        return res.status(500).json({ error: 'Erreur lors de la synchronisation du dépôt' });
    }
});
exports.syncRepository = syncRepository;
// Récupérer les branches d'un dépôt
const getRepositoryBranches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Vérifier si le dépôt existe
        database_1.default.get('SELECT * FROM repositories WHERE id = ?', [id], (err, row) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.error('Erreur lors de la recherche du dépôt:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la récupération des branches' });
            }
            if (!row) {
                return res.status(404).json({ error: 'Dépôt non trouvé' });
            }
            const repository = row;
            // Vérifier si le dépôt a un chemin local
            if (!repository.local_path) {
                return res.status(400).json({ error: 'Ce dépôt n\'a pas de chemin local pour récupérer les branches' });
            }
            try {
                // Récupérer les branches
                const branches = yield gitService.getBranches(repository.local_path);
                return res.status(200).json({ branches });
            }
            catch (error) {
                console.error('Erreur lors de la récupération des branches:', error);
                return res.status(500).json({
                    error: `Erreur lors de la récupération des branches: ${error.message || 'Erreur inconnue'}`
                });
            }
        }));
    }
    catch (error) {
        console.error('Erreur inattendue lors de la récupération des branches:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération des branches' });
    }
});
exports.getRepositoryBranches = getRepositoryBranches;
// Importer les dépôts d'un utilisateur ou d'une organisation
const importRepositories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, platform, project_id } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        if (platform !== 'github' && platform !== 'gitlab') {
            return res.status(400).json({ error: 'Platform must be either "github" or "gitlab"' });
        }
        // Check if project exists (if project_id is provided)
        if (project_id) {
            const projectExists = yield new Promise((resolve) => {
                database_1.default.get('SELECT * FROM projects WHERE id = ?', [project_id], (err, row) => {
                    if (err || !row) {
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            });
            if (!projectExists) {
                return res.status(404).json({ error: 'Project not found' });
            }
        }
        // Fetch repositories from the platform's API
        let repositories = [];
        try {
            if (platform === 'github') {
                // Fetch GitHub repositories
                const githubApiUrl = `https://api.github.com/users/${username}/repos`;
                const response = yield fetch(githubApiUrl);
                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.statusText}`);
                }
                const data = yield response.json();
                repositories = data.map((repo) => ({
                    name: repo.name,
                    url: repo.clone_url
                }));
            }
            else if (platform === 'gitlab') {
                // Fetch GitLab repositories
                const gitlabApiUrl = `https://gitlab.com/api/v4/users/${username}/projects`;
                const response = yield fetch(gitlabApiUrl);
                if (!response.ok) {
                    throw new Error(`GitLab API error: ${response.statusText}`);
                }
                const data = yield response.json();
                repositories = data.map((repo) => ({
                    name: repo.name,
                    url: repo.http_url_to_repo
                }));
            }
        }
        catch (error) {
            console.error(`Error fetching repositories from ${platform}:`, error);
            return res.status(500).json({
                error: `Error fetching repositories from ${platform}: ${error.message}`
            });
        }
        if (repositories.length === 0) {
            return res.status(404).json({
                error: `No public repositories found for ${username} on ${platform}`
            });
        }
        // Create/retrieve repositories and link them to the project
        const results = [];
        for (const repo of repositories) {
            try {
                const repoId = gitService.generateRepoId(repo.url);
                // Check if repository already exists
                const existingRepo = yield new Promise((resolve) => {
                    database_1.default.get('SELECT * FROM repositories WHERE id = ?', [repoId], (err, row) => {
                        if (err || !row) {
                            resolve(null);
                        }
                        else {
                            resolve(row);
                        }
                    });
                });
                let repoToUse;
                if (!existingRepo) {
                    // Download the repository
                    const local_path = yield gitService.downloadRepository(repo.url);
                    const now = new Date().toISOString();
                    // Create repository entry
                    yield new Promise((resolve, reject) => {
                        database_1.default.run('INSERT INTO repositories (id, name, url, local_path, branch_default, last_updated) VALUES (?, ?, ?, ?, ?, ?)', [repoId, repo.name, repo.url, local_path, 'main', now], function (err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve();
                        });
                    });
                    repoToUse = {
                        id: repoId,
                        name: repo.name,
                        url: repo.url,
                        local_path,
                        branch_default: 'main',
                        last_updated: now
                    };
                }
                else {
                    repoToUse = existingRepo;
                }
                // If a project_id is provided, create the link
                if (project_id) {
                    // Check if link already exists
                    const linkExists = yield new Promise((resolve) => {
                        database_1.default.get('SELECT * FROM project_repositories WHERE project_id = ? AND repository_id = ?', [project_id, repoToUse.id], (err, row) => {
                            if (err || !row) {
                                resolve(false);
                            }
                            else {
                                resolve(true);
                            }
                        });
                    });
                    if (!linkExists) {
                        const linkId = (0, uuid_1.v4)();
                        yield new Promise((resolve, reject) => {
                            database_1.default.run('INSERT INTO project_repositories (id, project_id, repository_id, display_name) VALUES (?, ?, ?, ?)', [linkId, project_id, repoToUse.id, repo.name], function (err) {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                resolve();
                            });
                        });
                    }
                }
                results.push({
                    id: repoToUse.id,
                    name: repoToUse.name,
                    url: repoToUse.url,
                    success: true
                });
            }
            catch (error) {
                console.error(`Error importing repository ${repo.name}:`, error);
                results.push({
                    name: repo.name,
                    url: repo.url,
                    success: false,
                    error: error.message
                });
            }
        }
        return res.status(200).json({
            message: `${results.filter(r => r.success).length} repositories successfully imported out of ${repositories.length} found`,
            results
        });
    }
    catch (error) {
        console.error('Unexpected error during repository import:', error);
        return res.status(500).json({ error: 'Error importing repositories' });
    }
});
exports.importRepositories = importRepositories;
// Fonction pour lier un dépôt existant à un projet
const linkRepositoryToProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { repository_id, project_id, branch_override, display_name } = req.body;
        if (!repository_id || !project_id) {
            return res.status(400).json({ error: 'Le repository_id et le project_id sont requis' });
        }
        // Vérifier si le dépôt existe
        const repo = yield new Promise((resolve) => {
            database_1.default.get('SELECT * FROM repositories WHERE id = ?', [repository_id], (err, row) => {
                if (err || !row) {
                    resolve(null);
                }
                else {
                    resolve(row);
                }
            });
        });
        if (!repo) {
            return res.status(404).json({ error: 'Dépôt non trouvé' });
        }
        // Vérifier si le projet existe
        const project = yield new Promise((resolve) => {
            database_1.default.get('SELECT * FROM projects WHERE id = ?', [project_id], (err, row) => {
                if (err || !row) {
                    resolve(null);
                }
                else {
                    resolve(row);
                }
            });
        });
        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé' });
        }
        // Vérifier si le lien existe déjà
        const existingLink = yield new Promise((resolve) => {
            database_1.default.get('SELECT * FROM project_repositories WHERE project_id = ? AND repository_id = ?', [project_id, repository_id], (err, row) => {
                if (err || !row) {
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
        });
        if (existingLink) {
            return res.status(200).json({
                message: 'Le dépôt est déjà associé à ce projet',
                existing: true
            });
        }
        // Créer le lien
        const linkId = (0, uuid_1.v4)();
        yield new Promise((resolve, reject) => {
            database_1.default.run('INSERT INTO project_repositories (id, project_id, repository_id, branch_override, display_name) VALUES (?, ?, ?, ?, ?)', [linkId, project_id, repository_id, branch_override || null, display_name || repo.name], function (err) {
                if (err) {
                    console.error('Erreur lors de la liaison du dépôt au projet:', err.message);
                    reject(err);
                    return;
                }
                resolve();
            });
        });
        return res.status(201).json({
            message: 'Dépôt lié au projet avec succès',
            id: linkId,
            project_id,
            repository_id,
            branch_override: branch_override || null,
            display_name: display_name || repo.name
        });
    }
    catch (error) {
        console.error('Erreur lors de la liaison du dépôt au projet:', error);
        return res.status(500).json({
            error: `Erreur lors de la liaison du dépôt au projet: ${error.message || 'Erreur inconnue'}`
        });
    }
});
exports.linkRepositoryToProject = linkRepositoryToProject;
