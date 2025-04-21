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
const Logger = require('../utils/Logger');
const Database = require('../utils/Database'); // Import Database utility
const logService = require('./logService'); // Import LogService

// Create a component logger
const logger = Logger.createComponentLogger('RepositoryService');

// Log le chemin complet du fichier pour vérifier quel service est chargé
logger.start(`Loading unified repository service: ${__filename}`);
logger.info(`This service has been cleaned up - only one file exists now`);

// Define paths
const dbPath = path.join(__dirname, '../../db/db.json');
const baseRepoDir = path.join(__dirname, '../../repos');
const logsDir = path.join(__dirname, '../../logs');

/**
 * Initialize the database and create repository folder if needed
 */
const init = () => {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  const db = Database.getDatabase(); // Utiliser l'instance partagée
  
  // Check if repositories collection exists
  if (!db.has('repositories').value()) {
    db.set('repositories', []).write();
  }
  
  // Check that the repository folder exists
  if (!fs.existsSync(baseRepoDir)) {
    fs.mkdirSync(baseRepoDir, { recursive: true });
  }
};

/**
 * Get a fresh instance of the database
 * @returns {Object} Database instance
 */
// const getDatabase = () => {
//   const adapter = new FileSync(dbPath);
//   return low(adapter);
// };
// Fonction supprimée et remplacée par l'utilisation directe de Database.getDatabase()

/**
 * Get all repositories
 * @returns {Array} List of repositories
 */
const getAllRepositories = () => {
  const db = Database.getDatabase(); // Utiliser l'instance partagée
  return db.get('repositories').value() || [];
};

/**
 * Get a repository by its ID
 * @param {string} id - ID of the repository to retrieve
 * @returns {Object|null} Repository or null if not found
 */
const getRepositoryById = (id) => {
  if (!id) return null;
  
  const db = Database.getDatabase(); // Utiliser l'instance partagée
  return db.get('repositories')
    .find({ id: id.toString() })
    .value() || null;
};

/**
 * Check if a path contains a valid Git repository
 * @param {string} repoPath - Path of the repository to check
 * @returns {boolean} true if valid, false otherwise
 */
const isValidGitRepository = (repoPath) => {
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
      shell: 'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8'
    });
    
    return true;
  } catch (error) {
    console.error(`Error checking Git repository: ${repoPath}`, error.message);
    return false;
  }
};

/**
 * Create a new repository in the database
 * @param {Object} repoData - Repository data to create
 * @returns {Object} Created repository
 */
const createRepository = async (repoData) => {
  const db = Database.getDatabase(); // Utiliser l'instance partagée
  
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
  if (!isValidGitRepository(normalizedPath)) {
    throw new Error(`Path ${normalizedPath} does not contain a valid Git repository`);
  }
  
  // Check if a repository with the same name already exists
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
  
  // Generate Gource log after successful creation
  try {
    logger.info(`Queueing log generation for new repository: ${newRepository.name}`);
    await logService.generateRepoLog(newRepository.id);
    logger.success(`Initial log generation completed for: ${newRepository.name}`);
  } catch (logError) {
    // Log the error but don't fail the repository creation
    logger.error(`Initial log generation failed for ${newRepository.name}: ${logError.message}`);
    // Optionally mark the repo as having an invalid log immediately
    const currentDb = Database.getDatabase(); // Re-get DB instance if needed
    currentDb.get('repositories')
      .find({ id: newRepository.id })
      .assign({ hasValidLog: false, logError: `Initial log generation failed: ${logError.message}` })
      .write();
  }
  
  return newRepository;
};

/**
 * Update an existing repository
 * @param {string} id - ID of the repository to update
 * @param {Object} repoData - New repository data
 * @returns {Object|null} Updated repository or null if not found
 */
const updateRepository = (id, repoData) => {
  if (!id) return null;
  
  const db = Database.getDatabase();
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
    if (!isValidGitRepository(updatedPath)) {
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
    description: repoData.description !== undefined 
      ? repoData.description 
      : repository.description,
    path: updatedPath,
    lastUpdated: new Date().toISOString()
  };
  
  // Update the repository in the database
  db.get('repositories')
    .find({ id: id.toString() })
    .assign(updatedRepository)
    .write();
  
  return updatedRepository;
};

/**
 * Delete a repository
 * @param {string} id - ID of the repository to delete
 * @returns {boolean} true if deleted, false otherwise
 */
const deleteRepository = (id) => {
  if (!id) return false;
  
  const db = Database.getDatabase();
  
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
};

/**
 * Generate a Git log for a repository in the format required by Gource
 * @param {Object} repository - Repository object
 * @param {string} outputPath - Path to save the git log
 * @param {Object} options - Options for log generation
 * @returns {Promise<Object>} Result of the log generation
 */
const generateGitLog = async (repository, outputPath, options = {}) => {
  logger.git(`Generating Git log for ${repository?.name || 'unknown repo'} using Gource command`);

  if (!repository) {
    logger.error('Invalid repository or not specified');
    throw new Error('Invalid repository or not specified');
  }

  const repoPath = repository.path || repository.localPath;
  if (!repoPath) {
    logger.error('Repository path not specified');
    throw new Error('Repository path not specified');
  }

  if (!fs.existsSync(repoPath)) {
    logger.error(`Repository path does not exist: ${repoPath}`);
    throw new Error(`Repository path does not exist: ${repoPath}`);
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    logger.file(`Created output directory: ${outputDir}`);
  }

  // Define temporary path
  const tempLogPath = `${outputPath}.temp.gource`;

  try {
    // --- Method 1: Use gource --output-custom-log (Preferred) ---
    logger.info(`Attempting to generate log using: gource --output-custom-log`);
    const gourceCmd = `"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "cd '${repoPath}'; gource --output-custom-log '${tempLogPath}'"`;
    logger.info(`Executing: ${gourceCmd}`);

    execSync(gourceCmd, {
      timeout: 300000, // 5 minutes timeout
      stdio: 'pipe' // Capture stderr
    });

    // Check if the temporary file was created and has content
    if (!fs.existsSync(tempLogPath) || fs.statSync(tempLogPath).size === 0) {
      logger.warn(`Gource command executed but produced an empty or missing file: ${tempLogPath}`);
      throw new Error(`Gource command produced no output for ${repository.name}`);
    }

    logger.success(`Successfully generated raw Gource log: ${tempLogPath}`);
        
    // --- Process the generated Gource log --- 
    let fileContent = fs.readFileSync(tempLogPath, 'utf8');
    let lines = fileContent.split('\n');
    let processedLines = [];
    const repoNamePrefix = `/${repository.name.replace(/[^\w-]/g, '')}/`;

    for (const line of lines) {
      if (line.trim() === '') continue;
      const parts = line.split('|');
      // Expected Gource format: timestamp|user|type|file
      if (parts.length === 4) {
        let timestamp = parts[0];
        let user = parts[1];
        let type = parts[2];
        let filePath = parts[3];

        // Always prepend the repo name prefix.
        // Remove leading '/' from Gource path if present, then add prefix.
        let cleanedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        let finalFilePath = `${repoNamePrefix}${cleanedFilePath}`;
        
        processedLines.push(`${timestamp}|${user}|${type}|${finalFilePath}`);
      } else {
        logger.warn(`Skipping malformed line in Gource output: ${line}`);
      }
    }
    
    // Write processed lines to the final output path
    fs.writeFileSync(outputPath, processedLines.join('\n'), 'utf8');
    logger.info(`Processed Gource log saved to: ${outputPath}`);

    // Clean up temporary file
    fs.unlinkSync(tempLogPath);

    // --- Final Analysis --- 
    const finalStats = fs.statSync(outputPath);
    const finalContentAfterFilter = fs.readFileSync(outputPath, 'utf8');
    const finalLinesAfterFilter = finalContentAfterFilter.split('\n').filter(line => line.trim() !== '');
    const finalEntryCount = finalLinesAfterFilter.length;

    if (finalEntryCount === 0) {
      logger.warn(`Generated log file is empty after processing/filtering for ${repository.name}`);
      return { path: outputPath, name: repository.name, id: repository.id, isEmpty: true };
    }

    const firstTimestampLine = finalLinesAfterFilter[0];
    const lastTimestampLine = finalLinesAfterFilter[finalLinesAfterFilter.length - 1];
    
    // Timestamp is at index 0
    const firstTimestamp = firstTimestampLine ? parseInt(firstTimestampLine.split('|')[0], 10) : NaN;
    const lastTimestamp = lastTimestampLine ? parseInt(lastTimestampLine.split('|')[0], 10) : NaN;
    
    const firstDate = !isNaN(firstTimestamp) ? new Date(firstTimestamp * 1000) : null;
    const lastDate = !isNaN(lastTimestamp) ? new Date(lastTimestamp * 1000) : null;

    logger.time(`First timestamp in final log: ${firstTimestamp} (${firstDate?.toISOString()})`);
    logger.time(`Last timestamp in final log: ${lastTimestamp} (${lastDate?.toISOString()})`);
    logger.success(`Log generation complete for ${repository.name}. Size: ${finalStats.size / 1024} KB, Entries: ${finalEntryCount}`);
    
    return {
      path: outputPath,
      name: repository.name,
      id: repository.id,
      isEmpty: false,
      entryCount: finalEntryCount,
      firstTimestamp: firstTimestamp,
      lastTimestamp: lastTimestamp,
      fileSize: finalStats.size
    };

  } catch (error) {
    logger.error(`Error generating log for ${repository.name} using Gource command: ${error.message}`);
    // Clean up temporary file if it exists on error
    if (fs.existsSync(tempLogPath)) {
      try { fs.unlinkSync(tempLogPath); } catch (e) { /* Ignore cleanup error */ }
    }
    // Propagate the error
    throw new Error(`Failed to generate Gource log for ${repository.name}: ${error.message}`);
  }
};

/**
 * Find and import multiple Git repositories from a base directory
 * @param {string} baseDirectoryPath - Directory to search
 * @param {boolean} skipConfirmation - Skip confirmation for import
 * @returns {Object} Results of the bulk import
 */
const bulkImport = (baseDirectoryPath, skipConfirmation = false) => {
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
          return {
            name: dirent.name,
            path: dirPath,
            isGitRepo: isValidGitRepository(dirPath)
          };
        })
      );
      
      // Filter valid Git repositories
      const validRepos = dirs.filter(dir => dir.isGitRepo);
      if (validRepos.length === 0) {
        throw new Error('No valid Git repositories found in the specified directory');
      }
      
      // Get existing repositories to avoid duplicates
      const existingRepos = getAllRepositories();
      
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
        totalImported: 0,
        skipped: validRepos.length - newRepos.length,
        imported: [],
        errors: []
      };
      
      // Import repositories in parallel
      const importPromises = newRepos.map(repo => {
        return new Promise(resolve => {
          try {
            const newRepo = createRepository({
              name: repo.name,
              description: `Imported automatically from ${normalizedPath}`,
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
      
      // Wait for all imports to complete
      await Promise.all(importPromises);
      
      console.timeEnd('bulkImport');
      resolve(results);
    } catch (error) {
      console.error('Error during bulk import:', error);
      reject(error);
    }
  });
};

/**
 * Pull latest changes for a repository using git pull
 * @param {string} id - ID of the repository to pull
 * @returns {Object} Result object with status and message
 */
const gitPull = async (id) => {
  const db = Database.getDatabase();
  const repository = db.get('repositories')
    .find({ id: id.toString() })
    .value();

  if (!repository) {
    throw new Error(`Repository not found: ${id}`);
  }

  const repoPath = repository.path;
  if (!fs.existsSync(repoPath) || !isValidGitRepository(repoPath)) {
    throw new Error(`Invalid or missing repository path: ${repoPath}`);
  }

  logger.info(`Pulling latest changes for ${repository.name} in ${repoPath}`);
  let output;
  try {
    // Using PowerShell/pwsh.exe explicitly for git operations
    output = execSync(`cd \'${repoPath}\'; git pull`, {
      shell: 'C:\\\\Program Files\\\\PowerShell\\\\7\\\\pwsh.exe', 
      encoding: 'utf8',
      timeout: 120000 // 2 minutes timeout
    });
    logger.git(`Git pull output for ${repository.name}: ${output}`);

    // Update last updated timestamp
    const currentDb = Database.getDatabase(); // Re-get DB instance
    currentDb.get('repositories')
      .find({ id: id.toString() })
      .assign({ lastUpdated: new Date().toISOString() })
      .write();

    // Regenerate Gource log after successful pull
    try {
      logger.info(`Queueing log regeneration for updated repository: ${repository.name}`);
      await logService.generateRepoLog(repository.id);
      logger.success(`Log regeneration completed for: ${repository.name}`);
    } catch (logError) {
      // Log the error but don't fail the pull operation itself
      logger.error(`Log regeneration failed after pull for ${repository.name}: ${logError.message}`);
      // Mark repo log as invalid
      const currentDbAfterLogFail = Database.getDatabase(); // Re-get DB instance
      currentDbAfterLogFail.get('repositories')
        .find({ id: repository.id })
        .assign({ hasValidLog: false, logError: `Log regeneration failed after pull: ${logError.message}` })
        .write();
    }

    return { status: 'success', message: `Successfully pulled changes for ${repository.name}. ${output}` };
  } catch (error) {
    logger.error(`Error pulling repository ${repository.name}: ${error.message}`);
    // Log stderr if available
    if (error.stderr) {
      logger.error(`Git pull stderr: ${error.stderr}`);
    }
    // Re-throw error to be caught by the route handler
    throw new Error(`Failed to pull repository ${repository.name}: ${error.message}`);
  }
};

// Initialize the service
init();

// Export the service functions
module.exports = {
  getAllRepositories,
  getRepositoryById,
  isValidGitRepository,
  createRepository,
  updateRepository,
  deleteRepository,
  generateGitLog,
  bulkImport,
  gitPull
}; 