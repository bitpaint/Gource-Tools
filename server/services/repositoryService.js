/**
 * Repository management service
 * Responsible for access to repositories and clone operations
 */

const path = require('path');
const fs = require('fs-extra');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const simpleGit = require('simple-git');
const uniqid = require('uniqid');
const os = require('os');
const { execSync } = require('child_process');

class RepositoryService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../db/db.json');
    this.reposDir = path.join(__dirname, '../../repos');
    this.init();
  }

  /**
   * Initialize the service
   */
  init() {
    // Ensure repos directory exists
    if (!fs.existsSync(this.reposDir)) {
      fs.mkdirSync(this.reposDir, { recursive: true });
    }

    const db = this.getDatabase();
    
    // Check if repositories collection exists
    if (!db.has('repositories').value()) {
      db.set('repositories', []).write();
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
   * Check if a git repository is valid
   * @param {string} repoUrl - URL of the repository to check
   * @returns {Promise<boolean>} True if the repository is valid
   */
  async isValidRepository(repoUrl) {
    if (!repoUrl) return false;
    
    try {
      // We use a temporary directory to check if the repository is valid
      const tmpDir = path.join(os.tmpdir(), uniqid('gource_repo_check_'));
      fs.ensureDirSync(tmpDir);
      
      // Try to list remote refs without cloning
      await simpleGit()
        .listRemote(['--heads', repoUrl]);
      
      // Clean up the temporary directory
      fs.removeSync(tmpDir);
      
      return true;
    } catch (error) {
      console.error('Error checking repository validity:', error.message);
      return false;
    }
  }

  /**
   * Create a new repository
   * @param {Object} repoData - Repository data to create
   * @returns {Promise<Object>} Created repository
   */
  async createRepository(repoData) {
    const db = this.getDatabase();
    
    // Validate required data
    if (!repoData.name) {
      throw new Error('Repository name is required');
    }
    
    if (!repoData.url) {
      throw new Error('Repository URL is required');
    }
    
    // Check if a repository with the same name already exists
    const existingRepo = db.get('repositories')
      .find({ name: repoData.name })
      .value();
    
    if (existingRepo) {
      throw new Error(`A repository with the name "${repoData.name}" already exists`);
    }
    
    // Check if the repository URL is valid
    const isValid = await this.isValidRepository(repoData.url);
    if (!isValid) {
      throw new Error(`The repository URL "${repoData.url}" is not valid or not accessible`);
    }
    
    // Generate a unique ID and path
    const id = uniqid('repo_');
    const repoPath = path.join(this.reposDir, id);
    
    // Create the repository object
    const newRepo = {
      id,
      name: repoData.name,
      url: repoData.url,
      description: repoData.description || '',
      localPath: repoPath,
      dateAdded: new Date().toISOString(),
      lastUpdated: null,
      cloned: false
    };
    
    // Add the repository to the database
    db.get('repositories')
      .push(newRepo)
      .write();
    
    return newRepo;
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
    const repo = db.get('repositories')
      .find({ id: id.toString() })
      .value();
    
    if (!repo) return null;
    
    // Check if another repository with the same name already exists
    if (repoData.name && repoData.name !== repo.name) {
      const existingRepo = db.get('repositories')
        .find({ name: repoData.name })
        .value();
      
      if (existingRepo && existingRepo.id !== id) {
        throw new Error(`A repository with the name "${repoData.name}" already exists`);
      }
    }
    
    // Prepare data to update
    const updatedRepo = {
      ...repo,
      ...repoData,
      // If URL changes, repo needs to be cloned again
      cloned: repoData.url && repoData.url !== repo.url ? false : repo.cloned
    };
    
    // Update the repository in the database
    db.get('repositories')
      .find({ id: id.toString() })
      .assign(updatedRepo)
      .write();
    
    return updatedRepo;
  }

  /**
   * Delete a repository
   * @param {string} id - ID of the repository to delete
   * @returns {boolean} true if deleted, false otherwise
   */
  deleteRepository(id) {
    if (!id) return false;
    
    const db = this.getDatabase();
    const repo = db.get('repositories')
      .find({ id: id.toString() })
      .value();
    
    if (!repo) return false;
    
    // Remove the repository folder if it exists
    if (repo.localPath && fs.existsSync(repo.localPath)) {
      fs.removeSync(repo.localPath);
    }
    
    // Delete the repository from the database
    db.get('repositories')
      .remove({ id: id.toString() })
      .write();
    
    // Also remove repository from any projects
    db.get('projects')
      .forEach(project => {
        if (project.repositories && project.repositories.includes(id.toString())) {
          project.repositories = project.repositories.filter(repoId => repoId !== id.toString());
        }
      })
      .write();
    
    return true;
  }

  /**
   * Clone a repository
   * @param {string} id - ID of the repository to clone
   * @returns {Promise<Object>} Cloned repository info
   */
  async cloneRepository(id) {
    const repo = this.getRepositoryById(id);
    if (!repo) {
      throw new Error(`Repository with ID ${id} not found`);
    }
    
    // Create the local directory if it doesn't exist
    if (!fs.existsSync(repo.localPath)) {
      fs.mkdirSync(repo.localPath, { recursive: true });
    } else {
      // Clean the directory if it exists
      fs.emptyDirSync(repo.localPath);
    }
    
    try {
      // Clone the repository
      await simpleGit()
        .clone(repo.url, repo.localPath);
      
      // Update the repository status
      const updatedRepo = this.updateRepository(id, {
        cloned: true,
        lastUpdated: new Date().toISOString()
      });
      
      return updatedRepo;
    } catch (error) {
      console.error(`Error cloning repository ${repo.name}:`, error.message);
      
      // Clean up on failure
      if (fs.existsSync(repo.localPath)) {
        fs.removeSync(repo.localPath);
      }
      
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  /**
   * Update (pull) a repository
   * @param {string} id - ID of the repository to update
   * @returns {Promise<Object>} Updated repository info
   */
  async updateRepositoryCode(id) {
    const repo = this.getRepositoryById(id);
    if (!repo) {
      throw new Error(`Repository with ID ${id} not found`);
    }
    
    if (!repo.cloned || !fs.existsSync(repo.localPath)) {
      return await this.cloneRepository(id);
    }
    
    try {
      // Pull latest changes
      await simpleGit(repo.localPath)
        .pull();
      
      // Update the repository status
      const updatedRepo = this.updateRepository(id, {
        lastUpdated: new Date().toISOString()
      });
      
      return updatedRepo;
    } catch (error) {
      console.error(`Error updating repository ${repo.name}:`, error.message);
      throw new Error(`Failed to update repository: ${error.message}`);
    }
  }

  /**
   * Get the commit log for a repository
   * @param {string} id - ID of the repository
   * @param {Object} options - Options for the log
   * @returns {Promise<Array>} List of commits
   */
  async getRepositoryLog(id, options = {}) {
    const repo = this.getRepositoryById(id);
    if (!repo) {
      throw new Error(`Repository with ID ${id} not found`);
    }
    
    if (!repo.cloned || !fs.existsSync(repo.localPath)) {
      throw new Error(`Repository is not cloned yet`);
    }
    
    try {
      const git = simpleGit(repo.localPath);
      
      // Get log with options
      const logOptions = {
        '--max-count': options.maxCount || 100,
        '--all': options.all || true,
        '--date': 'iso',
        ...options.extraOptions
      };
      
      const log = await git.log(logOptions);
      return log.all || [];
    } catch (error) {
      console.error(`Error getting repository log for ${repo.name}:`, error.message);
      throw new Error(`Failed to get repository log: ${error.message}`);
    }
  }

  /**
   * Generate Gource custom log for repository
   * @param {string} id - ID of the repository
   * @param {string} outputPath - Path to save the log
   * @returns {Promise<string>} Path to the generated log file
   */
  async generateGourceLog(id, outputPath) {
    const repo = this.getRepositoryById(id);
    if (!repo) {
      throw new Error(`Repository with ID ${id} not found`);
    }
    
    if (!repo.cloned || !fs.existsSync(repo.localPath)) {
      throw new Error(`Repository is not cloned yet`);
    }
    
    if (!outputPath) {
      outputPath = path.join(__dirname, '../../logs', `${id}_gource.log`);
    }
    
    // Make sure the output directory exists
    fs.ensureDirSync(path.dirname(outputPath));
    
    try {
      // Create gource log
      const command = `cd "${repo.localPath}" && gource --output-custom-log "${outputPath}"`;
      execSync(command, { stdio: 'inherit' });
      
      return outputPath;
    } catch (error) {
      console.error(`Error generating Gource log for ${repo.name}:`, error.message);
      throw new Error(`Failed to generate Gource log: ${error.message}`);
    }
  }
}

module.exports = new RepositoryService(); 