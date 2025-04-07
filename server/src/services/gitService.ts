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
 * Clone un dépôt Git distant vers un répertoire local
 * Ne clone que si le dépôt n'existe pas déjà
 */
export const cloneRepository = async (url: string): Promise<string> => {
  try {
    // Générer un identifiant cohérent et un nom de répertoire basé sur l'URL
    const repoId = generateRepoId(url);
    const repoName = sanitizeRepoName(url);
    const repoPath = path.join(REPO_BASE_DIR, `${repoId}_${repoName}`);
    
    // Vérifier si le dépôt existe déjà
    if (fs.existsSync(repoPath)) {
      console.log(`Le dépôt existe déjà: ${repoPath}`);
      return repoPath;
    }
    
    console.log(`Clonage du dépôt ${url} vers ${repoPath}`);
    
    // Cloner le dépôt
    await execAsync(`git clone ${url} "${repoPath}"`);
    console.log(`Dépôt cloné avec succès: ${repoPath}`);
    
    return repoPath;
  } catch (error) {
    console.error(`Erreur lors du clonage du dépôt: ${error}`);
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