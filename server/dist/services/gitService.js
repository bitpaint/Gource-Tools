"use strict";
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
exports.getBranches = exports.getGourceLogs = exports.checkoutBranch = exports.updateRepository = exports.downloadRepository = exports.normalizeGitUrl = exports.sanitizeRepoName = exports.generateRepoId = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
const crypto_1 = __importDefault(require("crypto"));
const execAsync = util_1.default.promisify(child_process_1.exec);
// Répertoire où les dépôts seront clonés
const REPO_BASE_DIR = path_1.default.join(__dirname, '../../../data/repositories');
// S'assurer que le répertoire existe
if (!fs_1.default.existsSync(REPO_BASE_DIR)) {
    fs_1.default.mkdirSync(REPO_BASE_DIR, { recursive: true });
}
/**
 * Génère un identifiant pour un dépôt à partir de son URL
 */
const generateRepoId = (url) => {
    // Créer un hash MD5 de l'URL pour un ID unique mais cohérent
    return crypto_1.default.createHash('md5').update(url).digest('hex');
};
exports.generateRepoId = generateRepoId;
/**
 * Génère un nom de répertoire sanitisé à partir de l'URL du dépôt
 */
const sanitizeRepoName = (url) => {
    var _a;
    // Extraire le nom du dépôt de l'URL
    const repoName = ((_a = url.split('/').pop()) === null || _a === void 0 ? void 0 : _a.replace(/\.git$/, '')) || 'repo';
    // Sanitiser le nom pour éviter les problèmes de système de fichiers
    return repoName.replace(/[^a-zA-Z0-9-_]/g, '_');
};
exports.sanitizeRepoName = sanitizeRepoName;
/**
 * Normalise une URL de dépôt Git
 * Transforme différents formats d'URL en URL de clonage standard
 */
const normalizeGitUrl = (url) => {
    try {
        // Vérifier si c'est une URL complète
        let urlObj;
        try {
            urlObj = new URL(url);
        }
        catch (_a) {
            // Si ce n'est pas une URL valide, essayer de la convertir
            if (url.includes('/') && !url.includes('://')) {
                // Format utilisateur/repo -> URL GitHub
                return `https://github.com/${url}.git`;
            }
            return url; // Impossible de normaliser
        }
        // Normaliser les URL de GitHub et GitLab
        if (urlObj.hostname === 'github.com' || urlObj.hostname === 'gitlab.com') {
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            // Si c'est une URL de page web (et non une URL de clonage .git)
            if (pathParts.length >= 2 && !url.endsWith('.git')) {
                return `https://${urlObj.hostname}/${pathParts[0]}/${pathParts[1]}.git`;
            }
        }
        return url;
    }
    catch (e) {
        console.warn(`Impossible de normaliser l'URL: ${url}`, e);
        return url;
    }
};
exports.normalizeGitUrl = normalizeGitUrl;
/**
 * Downloads a remote Git repository to a local directory
 * Only downloads if the repository doesn't already exist
 */
const downloadRepository = (url) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Normalize the URL
        const normalizedUrl = (0, exports.normalizeGitUrl)(url);
        // Generate a consistent ID and directory name based on the URL
        const repoId = (0, exports.generateRepoId)(normalizedUrl);
        const repoName = (0, exports.sanitizeRepoName)(normalizedUrl);
        const repoPath = path_1.default.join(REPO_BASE_DIR, `${repoId}_${repoName}`);
        // Check if repository already exists
        if (fs_1.default.existsSync(repoPath)) {
            console.log(`Repository already exists: ${repoPath}`);
            // Verify that it's a valid Git repository
            try {
                yield execAsync('git status', { cwd: repoPath });
                return repoPath;
            }
            catch (e) {
                console.warn(`Directory exists but is not a valid Git repository. Removing and re-cloning...`);
                fs_1.default.rmSync(repoPath, { recursive: true, force: true });
            }
        }
        // Ensure parent directory exists
        if (!fs_1.default.existsSync(REPO_BASE_DIR)) {
            fs_1.default.mkdirSync(REPO_BASE_DIR, { recursive: true });
        }
        console.log(`Cloning repository ${normalizedUrl} to ${repoPath}`);
        try {
            // Clone the repository with a 3-minute timeout
            yield execAsync(`git clone --depth 1 ${normalizedUrl} "${repoPath}"`, {
                timeout: 3 * 60 * 1000 // 3 minutes
            });
            console.log(`Repository successfully cloned: ${repoPath}`);
            return repoPath;
        }
        catch (error) {
            console.error(`Error during cloning: ${error.message}`);
            // If repository was partially created, remove it
            if (fs_1.default.existsSync(repoPath)) {
                try {
                    fs_1.default.rmSync(repoPath, { recursive: true, force: true });
                    console.log(`Removed partially cloned repository: ${repoPath}`);
                }
                catch (e) {
                    console.error(`Unable to remove partially cloned repository: ${e.message}`);
                }
            }
            // Check if error is about invalid URL
            if (error.message.includes('not found') ||
                error.message.includes('does not exist') ||
                error.message.includes('couldn\'t find remote repository')) {
                throw new Error(`Repository does not exist or is private: ${normalizedUrl}`);
            }
            // Check if error is about authentication issues
            if (error.message.includes('Authentication failed') ||
                error.message.includes('could not read Username')) {
                throw new Error(`Authentication required to clone this repository: ${normalizedUrl}`);
            }
            // Forward the error
            throw error;
        }
    }
    catch (error) {
        console.error(`Error downloading repository: ${error.message}`);
        throw error;
    }
});
exports.downloadRepository = downloadRepository;
/**
 * Met à jour un dépôt Git local (git pull)
 */
const updateRepository = (repoPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Vérifier si le répertoire existe
        if (!fs_1.default.existsSync(repoPath)) {
            throw new Error(`Le dépôt au chemin '${repoPath}' n'existe pas`);
        }
        console.log(`Mise à jour du dépôt: ${repoPath}`);
        // Mettre à jour le dépôt
        const { stdout } = yield execAsync('git pull', { cwd: repoPath });
        console.log(`Dépôt mis à jour: ${repoPath}`);
        return stdout;
    }
    catch (error) {
        console.error(`Erreur lors de la mise à jour du dépôt: ${error}`);
        throw error;
    }
});
exports.updateRepository = updateRepository;
/**
 * Change la branche d'un dépôt Git local
 */
const checkoutBranch = (repoPath, branch) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Vérifier si le répertoire existe
        if (!fs_1.default.existsSync(repoPath)) {
            throw new Error(`Le dépôt au chemin '${repoPath}' n'existe pas`);
        }
        console.log(`Changement de branche vers ${branch}: ${repoPath}`);
        // Changer de branche
        const { stdout } = yield execAsync(`git checkout ${branch}`, { cwd: repoPath });
        console.log(`Branche changée: ${repoPath} -> ${branch}`);
        return stdout;
    }
    catch (error) {
        console.error(`Erreur lors du changement de branche: ${error}`);
        throw error;
    }
});
exports.checkoutBranch = checkoutBranch;
/**
 * Récupère les logs Git dans un format approprié pour Gource
 */
const getGourceLogs = (repoPath, outputPath, branch) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Vérifier si le répertoire existe
        if (!fs_1.default.existsSync(repoPath)) {
            throw new Error(`Le dépôt au chemin '${repoPath}' n'existe pas`);
        }
        // Créer le répertoire de sortie si nécessaire
        const outputDir = path_1.default.dirname(outputPath);
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        console.log(`Extraction des logs pour Gource: ${repoPath} -> ${outputPath}`);
        // Changer de branche si spécifiée
        if (branch) {
            yield (0, exports.checkoutBranch)(repoPath, branch);
        }
        // Extraire les logs pour Gource
        yield execAsync(`git log --pretty=format:"%at|%an|%ae|%s" --reverse --raw --encoding=UTF-8 --no-renames > "${outputPath}"`, { cwd: repoPath });
        console.log(`Logs extraits: ${outputPath}`);
        return outputPath;
    }
    catch (error) {
        console.error(`Erreur lors de l'extraction des logs Git: ${error}`);
        throw error;
    }
});
exports.getGourceLogs = getGourceLogs;
/**
 * Récupère la liste des branches d'un dépôt
 */
const getBranches = (repoPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Vérifier si le répertoire existe
        if (!fs_1.default.existsSync(repoPath)) {
            throw new Error(`Le dépôt au chemin '${repoPath}' n'existe pas`);
        }
        console.log(`Récupération des branches: ${repoPath}`);
        // Récupérer les branches
        const { stdout } = yield execAsync('git branch -a', { cwd: repoPath });
        // Formater et retourner la liste des branches
        const branches = stdout
            .split('\n')
            .map(branch => branch.trim().replace(/^\*\s+/, '')) // Supprimer l'astérisque et les espaces
            .filter(branch => branch && !branch.includes('HEAD')); // Filtrer les lignes vides et HEAD
        console.log(`Branches récupérées: ${branches.length} branches`);
        return branches;
    }
    catch (error) {
        console.error(`Erreur lors de la récupération des branches: ${error}`);
        throw error;
    }
});
exports.getBranches = getBranches;
