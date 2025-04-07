import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import util from 'util';
import crypto from 'crypto';

const execAsync = util.promisify(exec);

// Répertoire où les dépôts seront clonés
const REPO_BASE_DIR = path.join(__dirname, '../../../data/repositories');

// S'assurer que le répertoire existe
if (!fs.existsSync(REPO_BASE_DIR)) {
  fs.mkdirSync(REPO_BASE_DIR, { recursive: true });
}

/**
 * Génère un identifiant pour un dépôt à partir de son URL
 */
export const generateRepoId = (url: string): string => {
  // Créer un hash MD5 de l'URL pour un ID unique mais cohérent
  return crypto.createHash('md5').update(url).digest('hex');
};

/**
 * Génère un nom de répertoire sanitisé à partir de l'URL du dépôt
 */
export const sanitizeRepoName = (url: string): string => {
  // Extraire le nom du dépôt de l'URL
  const repoName = url.split('/').pop()?.replace(/\.git$/, '') || 'repo';
  // Sanitiser le nom pour éviter les problèmes de système de fichiers
  return repoName.replace(/[^a-zA-Z0-9-_]/g, '_');
};

/**
 * Normalise une URL de dépôt Git
 * Transforme différents formats d'URL en URL de clonage standard
 */
export const normalizeGitUrl = (url: string): string => {
  try {
    // Vérifier si c'est une URL complète
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch {
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
  } catch (e) {
    console.warn(`Impossible de normaliser l'URL: ${url}`, e);
    return url;
  }
};

/**
 * Downloads a remote Git repository to a local directory
 * Only downloads if the repository doesn't already exist
 */
export const downloadRepository = async (url: string): Promise<string> => {
  try {
    // Normalize the URL
    const normalizedUrl = normalizeGitUrl(url);
    
    // Generate a consistent ID and directory name based on the URL
    const repoId = generateRepoId(normalizedUrl);
    const repoName = sanitizeRepoName(normalizedUrl);
    const repoPath = path.join(REPO_BASE_DIR, `${repoId}_${repoName}`);
    
    // Check if repository already exists
    if (fs.existsSync(repoPath)) {
      console.log(`Repository already exists: ${repoPath}`);
      
      // Verify that it's a valid Git repository
      try {
        await execAsync('git status', { cwd: repoPath });
        return repoPath;
      } catch (e: any) {
        console.warn(`Directory exists but is not a valid Git repository. Removing and re-cloning...`);
        fs.rmSync(repoPath, { recursive: true, force: true });
      }
    }
    
    // Ensure parent directory exists
    if (!fs.existsSync(REPO_BASE_DIR)) {
      fs.mkdirSync(REPO_BASE_DIR, { recursive: true });
    }
    
    console.log(`Cloning repository ${normalizedUrl} to ${repoPath}`);
    
    try {
      // Clone the repository with a 3-minute timeout
      await execAsync(`git clone --depth 1 ${normalizedUrl} "${repoPath}"`, {
        timeout: 3 * 60 * 1000 // 3 minutes
      });
      console.log(`Repository successfully cloned: ${repoPath}`);
      
      return repoPath;
    } catch (error: any) {
      console.error(`Error during cloning: ${error.message}`);
      
      // If repository was partially created, remove it
      if (fs.existsSync(repoPath)) {
        try {
          fs.rmSync(repoPath, { recursive: true, force: true });
          console.log(`Removed partially cloned repository: ${repoPath}`);
        } catch (e: any) {
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
  } catch (error: any) {
    console.error(`Error downloading repository: ${error.message}`);
    throw error;
  }
};

/**
 * Met à jour un dépôt Git local (git pull)
 */
export const updateRepository = async (repoPath: string): Promise<string> => {
  try {
    // Vérifier si le répertoire existe
    if (!fs.existsSync(repoPath)) {
      throw new Error(`Le dépôt au chemin '${repoPath}' n'existe pas`);
    }
    
    console.log(`Mise à jour du dépôt: ${repoPath}`);
    
    // Mettre à jour le dépôt
    const { stdout } = await execAsync('git pull', { cwd: repoPath });
    console.log(`Dépôt mis à jour: ${repoPath}`);
    
    return stdout;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du dépôt: ${error}`);
    throw error;
  }
};

/**
 * Change la branche d'un dépôt Git local
 */
export const checkoutBranch = async (repoPath: string, branch: string): Promise<string> => {
  try {
    // Vérifier si le répertoire existe
    if (!fs.existsSync(repoPath)) {
      throw new Error(`Le dépôt au chemin '${repoPath}' n'existe pas`);
    }
    
    console.log(`Changement de branche vers ${branch}: ${repoPath}`);
    
    // Changer de branche
    const { stdout } = await execAsync(`git checkout ${branch}`, { cwd: repoPath });
    console.log(`Branche changée: ${repoPath} -> ${branch}`);
    
    return stdout;
  } catch (error) {
    console.error(`Erreur lors du changement de branche: ${error}`);
    throw error;
  }
};

/**
 * Récupère les logs Git dans un format approprié pour Gource
 */
export const getGourceLogs = async (repoPath: string, outputPath: string, branch?: string): Promise<string> => {
  try {
    // Vérifier si le répertoire existe
    if (!fs.existsSync(repoPath)) {
      throw new Error(`Le dépôt au chemin '${repoPath}' n'existe pas`);
    }
    
    // Créer le répertoire de sortie si nécessaire
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(`Extraction des logs pour Gource: ${repoPath} -> ${outputPath}`);
    
    // Changer de branche si spécifiée
    if (branch) {
      await checkoutBranch(repoPath, branch);
    }
    
    // Extraire les logs pour Gource
    await execAsync(
      `git log --pretty=format:"%at|%an|%ae|%s" --reverse --raw --encoding=UTF-8 --no-renames > "${outputPath}"`, 
      { cwd: repoPath }
    );
    
    console.log(`Logs extraits: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error(`Erreur lors de l'extraction des logs Git: ${error}`);
    throw error;
  }
};

/**
 * Récupère la liste des branches d'un dépôt
 */
export const getBranches = async (repoPath: string): Promise<string[]> => {
  try {
    // Vérifier si le répertoire existe
    if (!fs.existsSync(repoPath)) {
      throw new Error(`Le dépôt au chemin '${repoPath}' n'existe pas`);
    }
    
    console.log(`Récupération des branches: ${repoPath}`);
    
    // Récupérer les branches
    const { stdout } = await execAsync('git branch -a', { cwd: repoPath });
    
    // Formater et retourner la liste des branches
    const branches = stdout
      .split('\n')
      .map(branch => branch.trim().replace(/^\*\s+/, '')) // Supprimer l'astérisque et les espaces
      .filter(branch => branch && !branch.includes('HEAD')); // Filtrer les lignes vides et HEAD
    
    console.log(`Branches récupérées: ${branches.length} branches`);
    
    return branches;
  } catch (error) {
    console.error(`Erreur lors de la récupération des branches: ${error}`);
    throw error;
  }
}; 