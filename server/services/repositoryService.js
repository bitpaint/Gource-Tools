/**
 * Service de gestion des dépôts Git
 * Responsable de l'accès, validation et gestion des référentiels
 * Optimisé pour Windows 11 Pro
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

class RepositoryService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../db/db.json');
    this.baseRepoDir = path.join(__dirname, '../../repos');
    this.logsDir = path.join(__dirname, '../../logs');
    this.init();
  }

  /**
   * Initialise la base de données et crée le dossier des dépôts si nécessaire
   */
  init() {
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    
    const db = this.getDatabase();
    
    // Vérifier si la collection repositories existe
    if (!db.has('repositories').value()) {
      db.set('repositories', []).write();
    }
    
    // Vérifier que le dossier des dépôts existe
    if (!fs.existsSync(this.baseRepoDir)) {
      fs.mkdirSync(this.baseRepoDir, { recursive: true });
    }
  }

  /**
   * Récupère une instance fraîche de la base de données
   * @returns {Object} Instance de la base de données
   */
  getDatabase() {
    const adapter = new FileSync(this.dbPath);
    return low(adapter);
  }

  /**
   * Récupère tous les dépôts
   * @returns {Array} Liste des dépôts
   */
  getAllRepositories() {
    const db = this.getDatabase();
    return db.get('repositories').value() || [];
  }

  /**
   * Récupère un dépôt par son ID
   * @param {string} id - ID du dépôt à récupérer
   * @returns {Object|null} Dépôt ou null si non trouvé
   */
  getRepositoryById(id) {
    if (!id) return null;
    
    const db = this.getDatabase();
    return db.get('repositories')
      .find({ id: id.toString() })
      .value() || null;
  }

  /**
   * Vérifie si un chemin contient un dépôt Git valide
   * @param {string} repoPath - Chemin du dépôt à vérifier
   * @returns {boolean} true si valide, false sinon
   */
  isValidGitRepository(repoPath) {
    try {
      if (!fs.existsSync(repoPath)) {
        return false;
      }
      
      // Vérifier si le dossier .git existe
      const gitDir = path.join(repoPath, '.git');
      if (!fs.existsSync(gitDir)) {
        return false;
      }

      // Sur Windows, utiliser PowerShell pour exécuter git status
      const gitStatus = execSync('git status', { 
        cwd: repoPath,
        shell: 'powershell.exe',
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf8'
      });
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la vérification du dépôt Git: ${repoPath}`, error.message);
      return false;
    }
  }

  /**
   * Crée un nouveau dépôt dans la base de données
   * @param {Object} repoData - Données du dépôt à créer
   * @returns {Object} Dépôt créé
   */
  createRepository(repoData) {
    const db = this.getDatabase();
    
    // Valider les données requises
    if (!repoData.name) {
      throw new Error('Le nom du dépôt est requis');
    }
    
    if (!repoData.path) {
      throw new Error('Le chemin du dépôt est requis');
    }
    
    // Normaliser le chemin pour Windows
    const normalizedPath = repoData.path.replace(/[\/\\]+/g, path.sep);
    
    // Vérifier que le dépôt est valide
    if (!this.isValidGitRepository(normalizedPath)) {
      throw new Error(`Le chemin ${normalizedPath} ne contient pas un dépôt Git valide`);
    }
    
    // Vérifier si un dépôt avec le même nom existe déjà
    const existingRepo = db.get('repositories')
      .find({ name: repoData.name })
      .value();
    
    if (existingRepo) {
      throw new Error(`Un dépôt avec le nom "${repoData.name}" existe déjà`);
    }
    
    // Générer un ID unique
    const id = Date.now().toString();
    
    // Créer le dépôt
    const newRepository = {
      id,
      name: repoData.name,
      description: repoData.description || '',
      path: normalizedPath,
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    // Ajouter le dépôt à la base de données
    db.get('repositories')
      .push(newRepository)
      .write();
    
    return newRepository;
  }

  /**
   * Met à jour un dépôt existant
   * @param {string} id - ID du dépôt à mettre à jour
   * @param {Object} repoData - Nouvelles données du dépôt
   * @returns {Object|null} Dépôt mis à jour ou null si non trouvé
   */
  updateRepository(id, repoData) {
    if (!id) return null;
    
    const db = this.getDatabase();
    const repository = db.get('repositories')
      .find({ id: id.toString() })
      .value();
    
    if (!repository) return null;
    
    let updatedPath = repository.path;
    
    // Si le chemin est modifié, le valider
    if (repoData.path && repoData.path !== repository.path) {
      // Normaliser le chemin pour Windows
      updatedPath = repoData.path.replace(/[\/\\]+/g, path.sep);
      
      // Vérifier que le dépôt est valide
      if (!this.isValidGitRepository(updatedPath)) {
        throw new Error(`Le chemin ${updatedPath} ne contient pas un dépôt Git valide`);
      }
    }
    
    // Vérifier si un autre dépôt avec le même nom existe déjà
    if (repoData.name && repoData.name !== repository.name) {
      const existingRepo = db.get('repositories')
        .find({ name: repoData.name })
        .value();
      
      if (existingRepo && existingRepo.id !== id) {
        throw new Error(`Un dépôt avec le nom "${repoData.name}" existe déjà`);
      }
    }
    
    // Mettre à jour le dépôt
    const updatedRepository = {
      ...repository,
      name: repoData.name || repository.name,
      description: repoData.description !== undefined 
        ? repoData.description 
        : repository.description,
      path: updatedPath,
      lastUpdated: new Date().toISOString()
    };
    
    // Mettre à jour le dépôt dans la base de données
    db.get('repositories')
      .find({ id: id.toString() })
      .assign(updatedRepository)
      .write();
    
    return updatedRepository;
  }

  /**
   * Supprime un dépôt
   * @param {string} id - ID du dépôt à supprimer
   * @returns {boolean} true si supprimé, false sinon
   */
  deleteRepository(id) {
    if (!id) return false;
    
    const db = this.getDatabase();
    
    // Vérifier si le dépôt existe
    const repository = db.get('repositories')
      .find({ id: id.toString() })
      .value();
    
    if (!repository) return false;
    
    // Avant de supprimer, vérifier si le dépôt est utilisé dans des projets
    const projects = db.get('projects').value() || [];
    const usedInProjects = projects.filter(project => 
      project.repositories && project.repositories.includes(id.toString())
    );
    
    if (usedInProjects.length > 0) {
      throw new Error(`Ce dépôt est utilisé dans ${usedInProjects.length} projet(s) et ne peut pas être supprimé.`);
    }
    
    // Supprimer le dépôt de la base de données
    db.get('repositories')
      .remove({ id: id.toString() })
      .write();
    
    return true;
  }

  /**
   * Génère un fichier de log git pour un dépôt au format Gource
   * @param {Object} repository - Objet dépôt
   * @param {string} outputPath - Chemin du fichier de sortie
   * @param {Object} options - Options de génération
   * @returns {Promise<Object>} - Informations sur le log généré
   */
  async generateGitLog(repository, outputPath, options = {}) {
    if (!repository) {
      throw new Error('Dépôt invalide ou non spécifié');
    }

    // Déterminer le chemin du dépôt (peut être dans path ou localPath selon la structure)
    const repoPath = repository.path || repository.localPath;
    
    if (!repoPath) {
      throw new Error('Chemin du dépôt non spécifié');
    }

    if (!fs.existsSync(repoPath)) {
      throw new Error(`Le chemin du dépôt n'existe pas: ${repoPath}`);
    }

    // Créer le répertoire de sortie s'il n'existe pas
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      // Utiliser git pour générer un fichier de log et le transformer au format Gource
      // Format: timestamp|auteur|action|fichier
      // Actions: A (ajout), M (modification), D (suppression)
      const gitCommand = `cd "${repoPath}" && git log --pretty=format:"%at|%an|%s" --name-status --reverse`;
      const gitLogOutput = execSync(gitCommand, { encoding: 'utf8' });
      
      // Transformer la sortie git en format Gource
      let currentCommit = null;
      let currentTime = null;
      let currentAuthor = null;
      
      const gourceLines = [];
      
      const lines = gitLogOutput.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line === '') continue;
        
        // Si la ligne contient des |, c'est une ligne de commit
        if (line.includes('|')) {
          const parts = line.split('|');
          if (parts.length >= 2) {
            currentTime = parts[0];
            currentAuthor = parts[1];
          }
        } 
        // Sinon, c'est une ligne de fichier avec son statut
        else if (currentTime && currentAuthor) {
          // Format git: A/M/D     chemin/du/fichier
          const fileMatch = line.match(/^([AMD])\s+(.+)$/);
          if (fileMatch) {
            const action = fileMatch[1]; // A, M ou D
            const filePath = fileMatch[2];
            
            // Format Gource: timestamp|username|action|filepath
            gourceLines.push(`${currentTime}|${currentAuthor}|${action}|/${repository.name}/${filePath}`);
          }
        }
      }
      
      // Écrire le fichier au format Gource
      fs.writeFileSync(outputPath, gourceLines.join('\n'), 'utf8');
      
      // Vérifier si le fichier a été créé et n'est pas vide
      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
        console.warn(`Aucun log généré pour le dépôt ${repository.name}`);
        return {
          path: outputPath,
          name: repository.name,
          id: repository.id,
          isEmpty: true
        };
      }

      return {
        path: outputPath,
        name: repository.name,
        id: repository.id,
        isEmpty: false
      };
    } catch (error) {
      console.error(`Erreur lors de la génération du log pour ${repository.name}:`, error.message);
      throw new Error(`Échec de la génération du log Gource: ${error.message}`);
    }
  }

  /**
   * Importe en masse des dépôts trouvés dans un répertoire
   * @param {string} baseDirectoryPath - Chemin du répertoire contenant les dépôts
   * @param {boolean} skipConfirmation - Si vrai, ignore les vérifications supplémentaires
   * @returns {Promise<Object>} Résultats de l'importation
   */
  bulkImport(baseDirectoryPath, skipConfirmation = false) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!baseDirectoryPath) {
          throw new Error('Le chemin du répertoire est requis');
        }

        // Normaliser le chemin pour Windows
        const normalizedPath = baseDirectoryPath.replace(/[\/\\]+/g, path.sep);
        
        // Vérifier que le répertoire existe
        if (!fs.existsSync(normalizedPath)) {
          throw new Error(`Le répertoire ${normalizedPath} n'existe pas`);
        }
        
        // Vérifier que c'est un répertoire
        const stats = fs.statSync(normalizedPath);
        if (!stats.isDirectory()) {
          throw new Error(`${normalizedPath} n'est pas un répertoire`);
        }
        
        console.time('bulkImport');
        
        // Lecture des sous-répertoires (gardée synchrone pour simplicité d'implémentation)
        const dirents = fs.readdirSync(normalizedPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory());
          
        // Vérification parallèle des dépôts Git valides
        const dirs = await Promise.all(
          dirents.map(async dirent => {
            const dirPath = path.join(normalizedPath, dirent.name);
            return {
              name: dirent.name,
              path: dirPath,
              isGitRepo: this.isValidGitRepository(dirPath)
            };
          })
        );
        
        // Filtrage des dépôts Git valides
        const validRepos = dirs.filter(dir => dir.isGitRepo);
        if (validRepos.length === 0) {
          throw new Error('Aucun dépôt Git valide trouvé dans le répertoire spécifié');
        }
        
        // Récupérer les dépôts existants pour éviter les doublons
        const existingRepos = this.getAllRepositories();
        
        // Création de Set pour recherche O(1) au lieu de O(n)
        const existingPathsSet = new Set(existingRepos.map(repo => repo.path.toLowerCase()));
        const existingNamesSet = new Set(existingRepos.map(repo => repo.name.toLowerCase()));
        
        // Filtrer les dépôts déjà importés avec Set pour performance O(1)
        const newRepos = validRepos.filter(repo => 
          !existingPathsSet.has(repo.path.toLowerCase()) && 
          !existingNamesSet.has(repo.name.toLowerCase())
        );
        
        if (newRepos.length === 0) {
          throw new Error('Tous les dépôts Git valides ont déjà été importés');
        }
        
        // Liste des résultats
        const results = {
          totalFound: validRepos.length,
          totalImported: 0,
          skipped: validRepos.length - newRepos.length,
          imported: [],
          errors: []
        };
        
        // Importer en parallèle chaque nouveau dépôt
        const importPromises = newRepos.map(repo => {
          return new Promise(resolve => {
            try {
              const newRepo = this.createRepository({
                name: repo.name,
                description: `Importé automatiquement depuis ${normalizedPath}`,
                path: repo.path
              });
              
              results.imported.push({
                id: newRepo.id,
                name: newRepo.name,
                path: newRepo.path
              });
              
              results.totalImported++;
              resolve();
            } catch (error) {
              results.errors.push({
                name: repo.name,
                path: repo.path,
                error: error.message
              });
              resolve();
            }
          });
        });
        
        // Attendre que tous les imports soient terminés
        await Promise.all(importPromises);
        
        console.timeEnd('bulkImport');
        resolve(results);
      } catch (error) {
        console.error('Erreur lors de l\'importation en masse:', error);
        reject(error);
      }
    });
  }
}

module.exports = new RepositoryService(); 