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
exports.importRepository = exports.linkRepositoryToProject = exports.importRepositories = exports.getRepositoryBranches = exports.syncRepository = exports.deleteRepository = exports.updateRepository = exports.createRepository = exports.getRepositoryById = exports.getAllRepositories = void 0;
const database_1 = __importDefault(require("../models/database"));
const uuid_1 = require("uuid");
const gitService = __importStar(require("../services/gitService"));
const githubAuth_1 = require("../utils/githubAuth");
// Get GitHub token (try all available sources)
function getGitHubToken() {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, githubAuth_1.getGitHubCredentials)();
    });
}
// Function for creating GitHub API request headers
function createGitHubHeaders() {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, githubAuth_1.createGitHubHeaders)();
    });
}
// Fonction pour créer des tags fallback pour les dépôts GitHub connus
function getDefaultTagsForRepo(username, repoName) {
    const lowerRepoName = repoName.toLowerCase();
    // Détecter le langage de programmation à partir du nom
    const languageTags = [];
    if (lowerRepoName.includes('node') || lowerRepoName.includes('js') || lowerRepoName.includes('javascript')) {
        languageTags.push('javascript', 'nodejs');
    }
    else if (lowerRepoName.includes('python') || lowerRepoName.includes('py')) {
        languageTags.push('python');
    }
    else if (lowerRepoName.includes('rust') || lowerRepoName.includes('rs')) {
        languageTags.push('rust');
    }
    else if (lowerRepoName.includes('go')) {
        languageTags.push('golang');
    }
    else if (lowerRepoName.includes('java')) {
        languageTags.push('java');
    }
    else if (lowerRepoName.includes('react')) {
        languageTags.push('javascript', 'reactjs');
    }
    else if (lowerRepoName.includes('vue')) {
        languageTags.push('javascript', 'vuejs');
    }
    // Ajouter des tags basés sur le dépôt NOSTR spécifique
    if (username.toLowerCase() === 'nostr-protocol' || lowerRepoName.includes('nostr')) {
        languageTags.push('nostr', 'protocol');
        if (lowerRepoName === 'nips') {
            return [...languageTags, 'nips', 'specifications', 'documentation'];
        }
        else if (lowerRepoName === 'nostr') {
            return [...languageTags, 'core', 'reference-implementation'];
        }
        else if (lowerRepoName === 'data-vending-machines') {
            return [...languageTags, 'dvm', 'data-processing'];
        }
    }
    // Ajouter des tags génériques si aucun tag spécifique n'a été trouvé
    if (languageTags.length === 0) {
        languageTags.push('code', 'repository');
    }
    return languageTags;
}
// Récupérer tous les dépôts
const getAllRepositories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { project_id } = req.query;
        // Définir la requête SQL de base
        let sql = 'SELECT * FROM repositories';
        const params = [];
        // Ajouter un filtre par projet si nécessaire
        if (project_id) {
            sql += ' WHERE id IN (SELECT repository_id FROM project_repositories WHERE project_id = ?)';
            params.push(project_id);
        }
        // Ajouter un ordre de tri
        sql += ' ORDER BY name ASC';
        // Exécuter la requête
        database_1.default.all(sql, params, (err, rows) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.error('Erreur lors de la récupération des dépôts:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la récupération des dépôts' });
            }
            // Retourner directement les dépôts sans enrichissement des topics GitHub
            return res.json(rows);
        }));
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
        const { project_id, name, url, branch_default } = req.body;
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
                    // Créer l'entrée du dépôt
                    const now = new Date().toISOString();
                    // Extraire le username de l'URL si disponible
                    const username = url ? extractUsername(url) : null;
                    yield new Promise((resolve, reject) => {
                        database_1.default.run('INSERT INTO repositories (id, name, username, url, local_path, branch_default, tags, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [repoId, name, username, url || null, local_path || null, branch_default || 'main', null, now], function (err) {
                            if (err) {
                                console.error('Error creating repository:', err.message);
                                reject(err);
                                return;
                            }
                            resolve();
                        });
                    });
                    const newRepo = {
                        id: repoId,
                        name,
                        username,
                        url: url || null,
                        local_path: local_path || null,
                        branch_default: branch_default || 'main',
                        tags: null,
                        last_updated: now
                    };
                    // Si un project_id est fourni, créer le lien entre le projet et le dépôt
                    if (project_id) {
                        yield linkRepositoryToProject(repoId, project_id, name, branch_default);
                        return res.status(201).json(Object.assign(Object.assign({}, newRepo), { message: 'Repository created and linked to project successfully' }));
                    }
                    return res.status(201).json(Object.assign(Object.assign({}, newRepo), { message: 'Repository created successfully' }));
                }
                catch (error) {
                    console.error('Error creating repository:', error);
                    // Préparer un message d'erreur convivial
                    let errorMessage = 'Error creating repository';
                    if (error.message.includes("UNIQUE constraint failed")) {
                        errorMessage = `A repository with the same name already exists. Please choose a different name.`;
                    }
                    return res.status(500).json({ error: errorMessage });
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
        const { name, url, branch_default, branch_override, display_name, tags } = req.body;
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
                    database_1.default.run('UPDATE repositories SET name = ?, branch_default = ?, tags = ? WHERE id = ?', [name, branch_default || typedRow.branch_default, tags || typedRow.tags, id], function (err) {
                        if (err) {
                            console.error('Erreur lors de la mise à jour du dépôt:', err.message);
                            return res.status(500).json({ error: 'Erreur lors de la mise à jour du dépôt' });
                        }
                        return res.status(200).json(Object.assign(Object.assign({}, typedRow), { name, branch_default: branch_default || typedRow.branch_default, branch_override: branch_override || undefined, display_name: display_name || name, tags: tags || typedRow.tags }));
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
                database_1.default.run('UPDATE repositories SET name = ?, branch_default = ?, tags = ? WHERE id = ?', [name, branch_default || repository.branch_default, tags || repository.tags, id], function (err) {
                    if (err) {
                        console.error('Erreur lors de la mise à jour du dépôt:', err.message);
                        return res.status(500).json({ error: 'Erreur lors de la mise à jour du dépôt' });
                    }
                    return res.status(200).json(Object.assign(Object.assign({}, repository), { name, branch_default: branch_default || repository.branch_default, tags: tags || repository.tags }));
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
        const { type, username, projectId } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Nom d\'utilisateur manquant' });
        }
        // Récupérer uniquement les dépôts GitHub
        // Seule l'intégration GitHub est supportée
        const githubApiUrl = `https://api.github.com/users/${username}/repos`;
        const response = yield fetch(githubApiUrl, {
            headers: yield createGitHubHeaders()
        });
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }
        const data = yield response.json();
        const repositories = data.map((repo) => ({
            name: repo.name,
            url: repo.clone_url
        }));
        if (repositories.length === 0) {
            return res.status(404).json({
                error: `No public repositories found for ${username} on GitHub`
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
                if (projectId) {
                    // Check if link already exists
                    const linkExists = yield new Promise((resolve) => {
                        database_1.default.get('SELECT * FROM project_repositories WHERE project_id = ? AND repository_id = ?', [projectId, repoToUse.id], (err, row) => {
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
                            database_1.default.run('INSERT INTO project_repositories (id, project_id, repository_id, display_name) VALUES (?, ?, ?, ?)', [linkId, projectId, repoToUse.id, repo.name], function (err) {
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
// Fonction pour extraire le nom du dépôt à partir de l'URL Git
const extractRepoName = (url) => {
    if (!url)
        return '';
    // Retirer l'extension .git si présente
    let repoName = url.trim().replace(/\.git$/, '');
    // Extraire le nom du dépôt après le dernier '/' ou ':'
    const parts = repoName.split(/[\/:]/).filter(Boolean);
    return parts[parts.length - 1] || '';
};
// Fonction pour extraire le nom d'utilisateur à partir de l'URL Git
const extractUsername = (url) => {
    if (!url)
        return '';
    // Retirer l'extension .git si présente
    let cleanUrl = url.trim().replace(/\.git$/, '');
    // Pour les URL HTTP(S)
    if (cleanUrl.includes('github.com') || cleanUrl.includes('gitlab.com')) {
        // Format: https://github.com/username/repo
        const parts = cleanUrl.split('/').filter(Boolean);
        if (parts.length >= 2) {
            // L'index du nom d'utilisateur dépend de la structure de l'URL
            const domainIndex = parts.findIndex(part => part === 'github.com' || part === 'gitlab.com');
            if (domainIndex !== -1 && parts.length > domainIndex + 1) {
                return parts[domainIndex + 1];
            }
        }
    }
    // Pour les URL SSH
    else if (cleanUrl.includes('@github.com') || cleanUrl.includes('@gitlab.com')) {
        // Format: git@github.com:username/repo
        const match = cleanUrl.match(/@(?:github|gitlab)\.com[:|\/]([^\/]+)/);
        if (match && match[1]) {
            return match[1];
        }
    }
    return '';
};
// Function to import a GitHub repository
const importRepository = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        // Extract owner and repo name from URL
        let owner = '';
        let repoName = '';
        // HTTPS format: https://github.com/username/repo.git
        const httpsMatch = url.match(/https:\/\/github\.com\/([^\/]+)\/([^\/\.]+)(?:\.git)?/);
        // SSH format: git@github.com:username/repo.git
        const sshMatch = url.match(/git@github\.com:([^\/]+)\/([^\/\.]+)(?:\.git)?/);
        if (httpsMatch) {
            owner = httpsMatch[1];
            repoName = httpsMatch[2];
        }
        else if (sshMatch) {
            owner = sshMatch[1];
            repoName = sshMatch[2];
        }
        else {
            return res.status(400).json({ error: 'Invalid GitHub URL format' });
        }
        // Get repository info from GitHub API
        console.log(`Fetching repository data for ${owner}/${repoName}`);
        const apiUrl = `https://api.github.com/repos/${owner}/${repoName}`;
        const headers = yield createGitHubHeaders();
        const response = yield fetch(apiUrl, { headers });
        if (!response.ok) {
            console.error(`GitHub API error: ${response.status} ${response.statusText}`);
            if (response.status === 404) {
                return res.status(404).json({
                    error: 'Repository not found on GitHub. Make sure the URL is correct and the repository is public or you have access to it.'
                });
            }
            if (response.status === 403) {
                return res.status(403).json({
                    error: 'GitHub API rate limit reached. Please try again later or add a GitHub token in the settings.'
                });
            }
            return res.status(response.status).json({
                error: `GitHub API error: ${response.statusText}`
            });
        }
        const repoData = yield response.json();
        // Generate default tags based on repository name
        let topics = getDefaultTagsForRepo(owner, repoName);
        // Create repository record in the database
        database_1.default.run(`INSERT INTO repositories (name, description, url, clone_url, default_branch, stars, forks, last_commit, tags, last_tags_update)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            repoData.name,
            repoData.description || '',
            url,
            repoData.clone_url,
            repoData.default_branch,
            repoData.stargazers_count,
            repoData.forks_count,
            repoData.updated_at,
            topics.join(','),
            new Date().toISOString()
        ], function (err) {
            if (err) {
                console.error('Error saving repository:', err.message);
                return res.status(500).json({ error: 'Error saving repository' });
            }
            return res.status(201).json({
                id: this.lastID,
                name: repoData.name,
                description: repoData.description || '',
                url: url,
                clone_url: repoData.clone_url,
                default_branch: repoData.default_branch,
                stars: repoData.stargazers_count,
                forks: repoData.forks_count,
                last_commit: repoData.updated_at,
                tags: topics.join(',')
            });
        });
    }
    catch (error) {
        console.error('Error importing repository:', error);
        return res.status(500).json({
            error: 'Error importing repository',
            message: error.message || 'Unknown error'
        });
    }
});
exports.importRepository = importRepository;
