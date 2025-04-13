/**
 * Git Repository Management Service
 * Responsible for access, validation and management of repositories
 * Optimized for Windows 11 Pro
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const RenderService = require('./renderService');

class RepositoryService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../db/db.json');
    this.baseRepoDir = path.join(__dirname, '../../repos');
    this.logsDir = path.join(__dirname, '../../logs');
    this.init();
  }

  /**
   * Initialize the database and create repository folder if needed
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
    
    // Check if repositories collection exists
    if (!db.has('repositories').value()) {
      db.set('repositories', []).write();
    }
    
    // Check if repository folder exists
    if (!fs.existsSync(this.baseRepoDir)) {
      fs.mkdirSync(this.baseRepoDir, { recursive: true });
    }
  }

  /**
   * Get a fresh instance of the database
   * @returns {Object} Database instance
   */
  getDatabase() {
    const adapter = new FileSync(this.dbPath);
    return low(adapter);
  }

  /**
   * Get all repositories
   * @returns {Array} List of repositories
   */
  getAllRepositories() {
    const db = this.getDatabase();
    return db.get('repositories').value() || [];
  }

  /**
   * Get a repository by its ID
   * @param {string} id - ID of the repository to retrieve
   * @returns {Object|null} Repository or null if not found
   */
  getRepositoryById(id) {
    if (!id) return null;
    
    const db = this.getDatabase();
    return db.get('repositories')
      .find({ id: id.toString() })
      .value() || null;
  }

  /**
   * Check if a path contains a valid Git repository
   * @param {string} repoPath - Path of the repository to check
   * @returns {boolean} true if valid, false otherwise
   */
  isValidGitRepository(repoPath) {
    try {
      if (!fs.existsSync(repoPath)) {
        return false;
      }
      
      // Check if .git folder exists
      const gitDir = path.join(repoPath, '.git');
      if (!fs.existsSync(gitDir)) {
        return false;
      }

      // On Windows, use PowerShell to execute git status
      const gitStatus = execSync('git status', { 
        cwd: repoPath,
        shell: 'powershell.exe',
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf8'
      });
      
      return true;
    } catch (error) {
      console.error(`Error checking Git repository: ${repoPath}`, error.message);
      return false;
    }
  }

  /**
   * Create a new repository in the database
   * @param {Object} repoData - Repository data to create
   * @returns {Object} Created repository
   */
  createRepository(repoData) {
    const db = this.getDatabase();
    
    // Validate required data
    if (!repoData.name) {
      throw new Error('Repository name is required');
    }
    
    if (!repoData.path) {
      throw new Error('Repository path is required');
    }
    
    // Normalize path for Windows
    const normalizedPath = repoData.path.replace(/[\/\\]+/g, path.sep);
    
    // Check if repository is valid
    if (!this.isValidGitRepository(normalizedPath)) {
      throw new Error(`Path ${normalizedPath} does not contain a valid Git repository`);
    }
    
    // Check if repository with the same name already exists
    const existingRepo = db.get('repositories')
      .find({ name: repoData.name })
      .value();
    
    if (existingRepo) {
      throw new Error(`A repository with name "${repoData.name}" already exists`);
    }
    
    // Generate a unique ID
    const id = Date.now().toString();
    
    // Create the repository
    const newRepository = {
      id,
      name: repoData.name,
      description: repoData.description || '',
      path: normalizedPath,
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    // Add repository to database
    db.get('repositories')
      .push(newRepository)
      .write();
    
    return newRepository;
  }

  /**
   * Update an existing repository
   * @param {string} id - ID of the repository to update
   * @param {Object} repoData - New repository data
   * @returns {Object|null} Updated repository or null if not found
   */
  updateRepository(id, repoData) {
    if (!id) return null;
    
    const db = this.getDatabase();
    const repository = db.get('repositories')
      .find({ id: id.toString() })
      .value();
    
    if (!repository) return null;
    
    let updatedPath = repository.path;
    
    // If path is modified, validate it
    if (repoData.path && repoData.path !== repository.path) {
      // Normalize path for Windows
      updatedPath = repoData.path.replace(/[\/\\]+/g, path.sep);
      
      // Check if repository is valid
      if (!this.isValidGitRepository(updatedPath)) {
        throw new Error(`Path ${updatedPath} does not contain a valid Git repository`);
      }
    }
    
    // Check if another repository with the same name already exists
    if (repoData.name && repoData.name !== repository.name) {
      const existingRepo = db.get('repositories')
        .find({ name: repoData.name })
        .value();
      
      if (existingRepo && existingRepo.id !== id) {
        throw new Error(`A repository with name "${repoData.name}" already exists`);
      }
    }
    
    // Update the repository
    const updatedRepository = {
      ...repository,
      name: repoData.name || repository.name,
      description: repoData.description !== undefined ? repoData.description : repository.description,
      path: updatedPath,
      lastUpdated: new Date().toISOString()
    };
    
    // Update the repository in the database
    db.get('repositories')
      .find({ id: id.toString() })
      .assign(updatedRepository)
      .write();
    
    return updatedRepository;
  }

  /**
   * Delete a repository
   * @param {string} id - ID of the repository to delete
   * @returns {boolean} true if deleted, false otherwise
   */
  deleteRepository(id) {
    if (!id) return false;
    
    const db = this.getDatabase();
    
    // Check if repository exists
    const repository = db.get('repositories')
      .find({ id: id.toString() })
      .value();
    
    if (!repository) return false;
    
    // Before deleting, check if repository is used in projects
    const projects = db.get('projects').value() || [];
    const usedInProjects = projects.filter(project => 
      project.repositories && project.repositories.includes(id.toString())
    );
    
    if (usedInProjects.length > 0) {
      throw new Error(`This repository is used in ${usedInProjects.length} project(s) and cannot be deleted.`);
    }
    
    // Delete the repository from the database
    db.get('repositories')
      .remove({ id: id.toString() })
      .write();
    
    return true;
  }

  /**
   * Generate a Git log for a given repository
   * @param {Object} repository - Repository object
   * @param {string} outputPath - Output file path
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generated log information
   */
  async generateGitLog(repository, outputPath, options = {}) {
    if (!repository) {
      throw new Error('Invalid repository or not specified');
    }

    // Determine repository path (may be in path or localPath depending on structure)
    const repoPath = repository.path || repository.localPath;
    
    if (!repoPath) {
      throw new Error('Repository path not specified');
    }

    if (!fs.existsSync(repoPath)) {
      throw new Error(`Repository path does not exist: ${repoPath}`);
    }

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      // Use git to generate a log file and transform it to Gource format
      // Format: timestamp|author|action|file
      // Actions: A (addition), M (modification), D (deletion)
      const gitCommand = `cd "${repoPath}" && git log --pretty=format:"%at|%an|%s" --name-status --reverse`;
      const gitLogOutput = execSync(gitCommand, { encoding: 'utf8' });
      
      // Transform git output to Gource format
      let currentCommit = null;
      let currentAuthor = null;
      let currentTime = null;
      
      // Lines to write to Gource log file
      const gourceLines = [];
      
      // Process Git log output
      const lines = gitLogOutput.split('\n');
      for (let line of lines) {
        // Skip empty lines
        if (line === '') continue;
        
        // If line contains |, it's a commit line
        if (line.includes('|')) {
          const parts = line.split('|');
          if (parts.length >= 2) {
            currentTime = parts[0];
            currentAuthor = parts[1];
            currentCommit = parts.length > 2 ? parts[2] : '';
          }
        } 
        // Otherwise, it's a file line with its status
        else if (currentTime && currentAuthor) {
          // Format git: A/M/D     path/to/file
          const fileMatch = line.match(/^([AMD])\s+(.+)$/);
          if (fileMatch) {
            const action = fileMatch[1]; // A, M or D
            const filePath = fileMatch[2];
            
            // Add repository name prefix to filepath for multi-repo visualizations
            // const prefixedPath = options.includeRepoName ? `${repository.name}/${filePath}` : filePath;
            const prefixedPath = filePath;
            
            // Append to Gource format: timestamp|author|A/M/D|path
            gourceLines.push(`${currentTime}|${currentAuthor}|${action}|${prefixedPath}`);
          }
        }
      }
      
      // Write file to Gource format
      fs.writeFileSync(outputPath, gourceLines.join('\n'), 'utf8');
      
      // Check if file was created and is not empty
      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
        console.warn(`No log generated for repository ${repository.name}`);
        return {
          path: outputPath,
          isEmpty: true
        };
      }
      
      return {
        path: outputPath,
        isEmpty: false,
        lineCount: gourceLines.length
      };
    } catch (error) {
      console.error(`Error generating log for ${repository.name}:`, error.message);
      throw new Error(`Gource log generation failed: ${error.message}`);
    }
  }

  /**
   * Import multiple repositories found in a directory
   * @param {string} baseDirectoryPath - Path of the directory containing repositories
   * @param {boolean} skipConfirmation - If true, skip additional checks
   * @returns {Promise<Object>} Import results
   */
  bulkImport(baseDirectoryPath, skipConfirmation = false) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!baseDirectoryPath) {
          throw new Error('Repository directory path is required');
        }

        // Normalize path for Windows
        const normalizedPath = baseDirectoryPath.replace(/[\/\\]+/g, path.sep);
        
        // Check if directory exists
        if (!fs.existsSync(normalizedPath)) {
          throw new Error(`Directory ${normalizedPath} does not exist`);
        }
        
        // Check if it's a directory
        const stats = fs.statSync(normalizedPath);
        if (!stats.isDirectory()) {
          throw new Error(`${normalizedPath} is not a directory`);
        }
        
        console.time('bulkImport');
        
        // Read subdirectories (kept synchronous for simplicity of implementation)
        const dirents = fs.readdirSync(normalizedPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory());
          
        // Parallel check of valid Git repositories
        const dirs = await Promise.all(
          dirents.map(async dirent => {
            const dirPath = path.join(normalizedPath, dirent.name);
            const isGitRepo = this.isValidGitRepository(dirPath);
            return {
              name: dirent.name,
              path: dirPath,
              isGitRepo
            };
          })
        );
        
        // Filter valid Git repositories
        const validRepos = dirs.filter(dir => dir.isGitRepo);
        if (validRepos.length === 0) {
          throw new Error('No valid Git repositories found in the specified directory');
        }
        
        // Get existing repositories to avoid duplicates
        const existingRepos = this.getAllRepositories();
        
        // Create Set for O(1) search instead of O(n)
        const existingPathsSet = new Set(existingRepos.map(repo => repo.path.toLowerCase()));
        const existingNamesSet = new Set(existingRepos.map(repo => repo.name.toLowerCase()));
        
        // Filter already imported repositories with Set for O(1) performance
        const newRepos = validRepos.filter(repo => 
          !existingPathsSet.has(repo.path.toLowerCase()) && 
          !existingNamesSet.has(repo.name.toLowerCase())
        );
        
        if (newRepos.length === 0) {
          throw new Error('All valid Git repositories have already been imported');
        }
        
        // List of results
        const results = {
          totalFound: validRepos.length,
          newRepositories: newRepos.length,
          skipped: validRepos.length - newRepos.length,
          imported: 0,
          failed: 0,
          repositories: []
        };
        
        // Import repositories in parallel
        const importPromises = newRepos.map(repo => {
          return new Promise(resolve => {
            try {
              const newRepo = this.createRepository({
                name: repo.name,
                description: `Imported automatically from ${normalizedPath}`,
                path: repo.path
              });
              
              results.imported++;
              results.repositories.push({
                id: newRepo.id,
                name: newRepo.name,
                status: 'imported'
              });
              
              resolve();
            } catch (error) {
              console.error(`Error importing ${repo.name}:`, error.message);
              
              results.failed++;
              results.repositories.push({
                name: repo.name,
                status: 'failed',
                error: error.message
              });
              
              resolve();
            }
          });
        });
        
        // Wait for all imports to complete
        await Promise.all(importPromises);
        
        console.timeEnd('bulkImport');
        resolve(results);
      } catch (error) {
        console.error('Error during bulk import:', error);
        reject(error);
      }
    });
  }
}

module.exports = new RepositoryService(); 