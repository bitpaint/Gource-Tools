/**
 * Repository Controller
 * Handles HTTP requests related to repository operations
 */

const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');
const { Octokit } = require('octokit');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const os = require('os');
const Validator = require('../validators/RequestValidator');
const RepositoryService = require('../services/repositoryService');
const Database = require('../utils/Database');
const Logger = require('../utils/Logger');
const ErrorHandler = require('../utils/ErrorHandler');
const ProjectService = require('../services/ProjectService');

// Create a component logger
const logger = Logger.createComponentLogger('RepositoryController');

// Maximum path length for Windows
const MAX_PATH_LENGTH_WINDOWS = 240; // Windows limit is ~260, but keeping margin

// Number of available processors
const NUM_CPUS = os.cpus().length;

// Default configuration for optimized bulk imports
const DEFAULT_MAX_CONCURRENT_CLONES = Math.max(4, Math.min(12, NUM_CPUS)); // Between 4 and 12, based on CPUs
const DEFAULT_CLONE_DEPTH = 1; // Shallow clone by default to save bandwidth and time
const THROUGHPUT_CHECK_INTERVAL = 1000; // Throughput check interval in ms

// Clone status configuration and limits
const cloneStatuses = new Map();
const MAX_CONCURRENT_CLONES = process.env.MAX_CONCURRENT_CLONES 
  ? parseInt(process.env.MAX_CONCURRENT_CLONES) 
  : DEFAULT_MAX_CONCURRENT_CLONES;

// Bulk import configuration with limits and safety measures
const BULK_IMPORT_DEFAULT_LIMIT = 10000; // Maximum repositories by default
const BULK_IMPORT_ABSOLUTE_LIMIT = 99999; // Absolute limit (even with confirmation)
const BULK_IMPORT_REQUIRES_CONFIRMATION = 0; // Threshold at which confirmation is required

// Status tracking for bulk imports
const bulkImportStatuses = new Map();

// Initialize Octokit (GitHub API client) if token is available
let octokit = null;
if (process.env.GITHUB_TOKEN) {
  octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  logger.info('GitHub API token configured successfully');
} else {
  logger.info('No GitHub API token found. Some operations may be rate-limited.');
}

/**
 * Get a fresh database instance
 */
function getDatabase() {
  const adapter = new FileSync(path.join(__dirname, '../../db/db.json'));
  return low(adapter);
}

/**
 * Update a status in cloneStatuses Map
 */
function updateCloneStatus(id, updates) {
  const currentStatus = cloneStatuses.get(id) || {};
  const newStatus = Object.assign({}, currentStatus, updates);
  cloneStatuses.set(id, newStatus);
  return newStatus;
}

/**
 * Update bulk import status
 */
function updateBulkImportStatus(id, updates) {
  const currentStatus = bulkImportStatuses.get(id) || {};
  const newStatus = Object.assign({}, currentStatus, updates);
  bulkImportStatuses.set(id, newStatus);
  return newStatus;
}

/**
 * Get all repositories
 */
const getAllRepositories = async (req, res) => {
  try {
    // Get fresh database instance
    const db = getDatabase();
    
    // Check if repositories exist but are not in the database
    const reposDir = path.join(__dirname, '../../repos');
    
    // Ensure repos directory exists
    if (!fs.existsSync(reposDir)) {
      fs.mkdirSync(reposDir, { recursive: true });
    }
    
    // Get existing folders in repos directory
    const existingFolders = fs.readdirSync(reposDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    // Get existing repositories from the database
    const repositories = db.get('repositories').value();
    const existingRepoFolderNames = repositories.map(repo => path.basename(repo.path));
    
    // Find repository folders that are not in the database
    const missingRepos = existingFolders.filter(folder => !existingRepoFolderNames.includes(folder));
    
    // Add missing repositories to the database
    for (const folderName of missingRepos) {
      const repoPath = path.join(reposDir, folderName);
      
      try {
        // Try to get repository URL via git synchronously
        const git = simpleGit(repoPath);
        const remotes = await git.getRemotes(true);
        
        if (!remotes || remotes.length === 0) {
          logger.warn(`No remote found for ${folderName}, cannot add`);
          continue;
        }
        
        // Use first remote as URL
        const url = remotes[0].refs.fetch || remotes[0].refs.push;
        if (!url) {
          logger.warn(`No URL found for ${folderName}, cannot add`);
          continue;
        }
        
        // Extract repository owner from URL if possible
        let owner = 'unknown';
        try {
          const urlObj = new URL(url);
          const urlPath = urlObj.pathname;
          const pathParts = urlPath.split('/').filter(part => part.length > 0);
          if (pathParts.length >= 2) {
            owner = pathParts[pathParts.length - 2];
          }
        } catch (parseError) {
          logger.warn(`Could not extract owner for ${folderName}: ${parseError.message}`);
        }
        
        // Create entry for this repository in the database
        const id = Date.now().toString() + Math.floor(Math.random() * 1000);
        const newRepo = {
          id,
          url,
          name: folderName,
          owner: owner,
          description: `Automatically added from existing folder: ${folderName}`,
          path: repoPath,
          dateAdded: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        db.get('repositories')
          .push(newRepo)
          .write();
          
        logger.info(`Added repository from existing folder: ${folderName} (owner: ${owner})`);
      } catch (error) {
        logger.error(`Error adding repository from folder ${folderName}:`, error);
      }
    }
    
    // Check if existing repositories have no owner
    const reposWithoutOwner = db.get('repositories')
      .filter(repo => !repo.owner)
      .value();
    
    // Add owner to existing repositories
    for (const repo of reposWithoutOwner) {
      try {
        let owner = 'unknown';
        if (repo.url) {
          const urlObj = new URL(repo.url);
          const urlPath = urlObj.pathname;
          const pathParts = urlPath.split('/').filter(part => part.length > 0);
          if (pathParts.length >= 2) {
            owner = pathParts[pathParts.length - 2];
          }
        }
        
        db.get('repositories')
          .find({ id: repo.id })
          .assign({ owner: owner })
          .write();
          
        logger.info(`Updated owner for repository ${repo.name} to ${owner}`);
      } catch (error) {
        logger.error(`Error updating owner for repository ${repo.name}:`, error);
      }
    }
    
    // Return updated repositories
    const updatedRepositories = db.get('repositories').value();
    res.json(updatedRepositories);
  } catch (error) {
    logger.error('Error getting repositories:', error);
    res.status(500).json({ error: 'Failed to get repositories', details: error.message });
  }
};

/**
 * Get a single repository by ID
 */
const getRepositoryById = (req, res) => {
  try {
    const validation = Validator.validateId(req.params.id);
    if (!Validator.handleValidation(validation, res)) return;
    
    const db = getDatabase();
    const repository = db.get('repositories')
      .find({ id: req.params.id })
      .value();

    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    res.json(repository);
  } catch (error) {
    logger.error('Error fetching repository by ID:', error);
    res.status(500).json({ error: 'Failed to fetch repository' });
  }
};

/**
 * Get clone status by clone ID
 */
const getCloneStatus = (req, res) => {
  try {
    const cloneId = req.params.cloneId;
    const status = cloneStatuses.get(cloneId) || { 
      progress: 0, 
      status: 'initializing', 
      step: 0,
      error: null 
    };
    
    res.json(status);
  } catch (error) {
    logger.error('Error fetching clone status:', error);
    res.status(500).json({ error: 'Failed to fetch clone status' });
  }
};

/**
 * Get bulk import status by bulk import ID
 */
const getBulkImportStatus = (req, res) => {
  try {
    const bulkImportId = req.params.bulkImportId;
    const status = bulkImportStatuses.get(bulkImportId) || { 
      progress: 0, 
      status: 'initializing', 
      totalRepos: 0,
      completedRepos: 0,
      failedRepos: 0,
      message: 'Initializing bulk import...',
      error: null 
    };
    
    res.json(status);
  } catch (error) {
    logger.error('Error fetching bulk import status:', error);
    res.status(500).json({ error: 'Failed to fetch bulk import status' });
  }
};

/**
 * Add a new repository
 */
const addRepository = async (req, res) => {
  try {
    const validation = Validator.validateRequired(req.body, ['url']);
    if (!Validator.handleValidation(validation, res)) return;
    
    const { url } = req.body;
    logger.info('Creating repository - received data:', { url });

    // Get fresh database
    const db = getDatabase();

    // Check if repository with same URL already exists
    const existingRepo = db.get('repositories')
      .find({ url })
      .value();

    if (existingRepo) {
      return res.status(400).json({ 
        error: 'A repository with this URL already exists', 
        details: 'Please use a different URL' 
      });
    }

    // Generate unique clone ID
    const cloneId = Date.now().toString();
    
    // Create status object for this clone
    cloneStatuses.set(cloneId, {
      progress: 0,
      status: 'initializing',
      step: 0,
      error: null,
      timeStarted: new Date().toISOString()
    });
    
    // Respond immediately to the client with clone ID
    res.status(202).json({ cloneId, message: 'Repository cloning started' });
    
    // Continue cloning process in background
    processRepositoryClone(cloneId, url);
  } catch (error) {
    logger.error('Error adding repository:', error);
    res.status(500).json({ error: 'Failed to add repository', details: error.message });
  }
};

/**
 * Start bulk import from GitHub organization or user
 */
const bulkImport = async (req, res) => {
  try {
    // Validate input
    const validation = Validator.validateRequired(req.body, ['githubUrl']);
    if (!Validator.handleValidation(validation, res)) return;
    
    const { 
      githubUrl, 
      skipConfirmation = false, 
      projectCreationMode = 'none',
      projectNameTemplate = '{owner}',
      repoLimit = BULK_IMPORT_DEFAULT_LIMIT 
    } = req.body;
    
    logger.info('Starting bulk import', { githubUrl, projectCreationMode });
    
    // Generate unique bulk import ID
    const bulkImportId = Date.now().toString();
    
    // Create status object for this bulk import
    bulkImportStatuses.set(bulkImportId, {
      progress: 0,
      status: 'initializing',
      githubUrl,
      owner: null,
      repositories: [],
      createdProjects: [],
      totalRepos: 0,
      completedRepos: 0,
      failedRepos: 0,
      timeStarted: new Date().toISOString(),
      message: 'Initializing bulk import...',
      error: null
    });
    
    // Respond immediately to the client with bulk import ID
    res.status(202).json({ 
      bulkImportId, 
      message: 'Bulk import started', 
      status: 'initializing' 
    });
    
    // Continue bulk import process in background
    processBulkImport(
      bulkImportId, 
      githubUrl, 
      skipConfirmation, 
      projectCreationMode, 
      projectNameTemplate, 
      repoLimit
    );
  } catch (error) {
    logger.error('Error starting bulk import:', error);
    res.status(500).json({ 
      error: 'Failed to start bulk import', 
      details: error.message 
    });
  }
};

/**
 * Process repository clone in background
 * @param {string} cloneId - Clone ID for tracking
 * @param {string} url - Repository URL to clone
 */
async function processRepositoryClone(cloneId, url) {
  try {
    // Status update
    updateCloneStatus(cloneId, {
      status: 'preparing',
      message: 'Preparing to clone repository...',
      progress: 5,
      step: 0
    });
  
    // Parse URL to get folder name and owner
    let folderName = '';
    let owner = '';
    let repoName = '';
    let description = '';
    
    try {
      // Extract repo name from URL (remove .git extension and get last part of path)
      const urlObj = new URL(url);
      const urlPath = urlObj.pathname;
      const pathParts = urlPath.split('/').filter(part => part.length > 0);
      
      if (pathParts.length >= 2) {
        owner = pathParts[pathParts.length - 2];
        repoName = pathParts[pathParts.length - 1].replace('.git', '');
        // Use "<owner>_<repoName>" as folder name to avoid conflicts
        folderName = `${owner}_${repoName}`;
      } else {
        folderName = path.basename(urlPath, '.git');
        repoName = folderName;
      }
      
      if (!folderName) {
        throw new Error('Could not extract folder name from URL');
      }
      
      // Try to fetch repository details from GitHub API if token is available
      const isGitHubRepo = url.includes('github.com');
      if (isGitHubRepo && process.env.GITHUB_TOKEN && octokit && owner && repoName) {
        try {
          updateCloneStatus(cloneId, {
            progress: 7,
            message: 'Fetching repository details from GitHub...'
          });
          
          logger.info(`Fetching details for ${owner}/${repoName} from GitHub API`);
          const repoDetails = await octokit.rest.repos.get({
            owner,
            repo: repoName
          });
          
          if (repoDetails && repoDetails.data) {
            logger.info('Successfully fetched repository details from GitHub API');
            // Keep prefix with owner to avoid conflicts
            folderName = `${owner}_${repoDetails.data.name}`;
            repoName = repoDetails.data.name;
            description = repoDetails.data.description || '';
            
            updateCloneStatus(cloneId, {
              progress: 9,
              message: `Found repository: ${owner}/${repoName} (${description})`
            });
          }
        } catch (apiError) {
          logger.error('Error fetching repository details from GitHub API:', apiError);
          // Continue with the folder name we already extracted
        }
      }
      
      logger.info(`Extracted owner: ${owner}, folder name: ${folderName}, description: ${description || 'none'}`);
      
      // Status update
      updateCloneStatus(cloneId, {
        progress: 10,
        message: `Preparing to clone ${owner}/${repoName}...`
      });
    } catch (error) {
      logger.error('Error parsing URL:', error);
      updateCloneStatus(cloneId, {
        status: 'failed',
        error: `Invalid repository URL: ${error.message}`
      });
      return;
    }

    // Create repos directory if it doesn't exist
    const reposDir = path.join(__dirname, '../../repos');
    if (!fs.existsSync(reposDir)) {
      fs.mkdirSync(reposDir, { recursive: true });
    }

    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Status update
    updateCloneStatus(cloneId, {
      progress: 15,
      message: `Checking if repository already exists...`
    });
    
    // Check if folder already exists (possible duplicate)
    const repoPath = path.join(reposDir, folderName);
    let repoAlreadyCloned = false;
    
    if (fs.existsSync(repoPath)) {
      logger.info(`Repository directory ${repoPath} already exists, skipping clone`);
      repoAlreadyCloned = true;
      
      // Status update
      updateCloneStatus(cloneId, {
        step: 1,
        progress: 50,
        status: 'skipped_clone',
        message: `Repository already exists locally, skipping clone.`
      });
    }

    // If repository doesn't exist locally, clone it
    if (!repoAlreadyCloned) {
      // Step 1: Cloning
      updateCloneStatus(cloneId, {
        step: 1,
        progress: 20,
        status: 'cloning',
        message: `Cloning repository from ${url}...`
      });
      
      // Clone repository with progress tracking
      try {
        logger.info(`Cloning repository from ${url}...`);
        
        // Check if we're cloning from GitHub and can use the API token
        const isGitHubRepo = url.includes('github.com');
        let cloneUrl = url;
        
        if (isGitHubRepo && process.env.GITHUB_TOKEN) {
          // Insert token into GitHub URL for authentication
          cloneUrl = url.replace('https://', `https://${process.env.GITHUB_TOKEN}@`);
          logger.info('Using GitHub token for authenticated clone');
          
          // Status update
          updateCloneStatus(cloneId, {
            message: `Using GitHub API token for authentication...`
          });
        }
        
        // Create git instance
        const git = simpleGit();
        
        // Start clone
        await git.clone(cloneUrl, repoPath);
        
        // Update status to show completion
        updateCloneStatus(cloneId, {
          step: 2,
          progress: 90,
          status: 'finished_clone',
          message: `Repository cloned successfully.`
        });
      } catch (cloneError) {
        logger.error('Error cloning repository:', cloneError);
        updateCloneStatus(cloneId, {
          status: 'failed',
          error: `Error cloning repository: ${cloneError.message}`
        });
        return;
      }
    }

    // Add repository to database
    try {
      updateCloneStatus(cloneId, {
        step: 3,
        progress: 95,
        status: 'finalizing',
        message: 'Adding repository to database...'
      });
      
      // Get fresh database instance
      const db = getDatabase();
      
      // Create repository entry
      const id = Date.now().toString();
      const repository = {
        id,
        url,
        name: repoName,
        owner: owner,
        description: description || `Repository from ${url}`,
        path: repoPath,
        dateAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      // Add to database
      db.get('repositories')
        .push(repository)
        .write();
      
      logger.info(`Repository ${repoName} added to database with ID ${id}`);
      
      // Update final status
      updateCloneStatus(cloneId, {
        step: 4,
        progress: 100,
        status: 'completed',
        message: `Repository ${repoName} added successfully`,
        repository
      });
    } catch (dbError) {
      logger.error('Error adding repository to database:', dbError);
      updateCloneStatus(cloneId, {
        status: 'failed',
        error: `Error adding to database: ${dbError.message}`
      });
    }
  } catch (error) {
    logger.error('Unexpected error in repository clone process:', error);
    updateCloneStatus(cloneId, {
      status: 'failed',
      error: `Unexpected error: ${error.message}`
    });
  }
}

/**
 * Process bulk import in background
 * @param {string} bulkImportId - Bulk import ID for tracking
 * @param {string} githubUrl - GitHub organization or user URL
 * @param {boolean} skipConfirmation - Skip confirmation for large imports
 * @param {string} projectCreationMode - How to create projects from imported repos ('none', 'single', 'byOwner')
 * @param {string} projectNameTemplate - Template for project names
 * @param {number} repoLimit - Maximum number of repos to import
 */
async function processBulkImport(
  bulkImportId, 
  githubUrl, 
  skipConfirmation = false, 
  projectCreationMode = 'none',
  projectNameTemplate = '{owner}',
  repoLimit = BULK_IMPORT_DEFAULT_LIMIT
) {
  try {
    // Status update
    updateBulkImportStatus(bulkImportId, {
      status: 'processing',
      message: 'Processing GitHub URL...',
      progress: 5
    });
    
    // Ensure GitHub API token is available for bulk operations
    if (!process.env.GITHUB_TOKEN || !octokit) {
      updateBulkImportStatus(bulkImportId, {
        status: 'failed',
        message: 'GitHub API token is required for bulk imports',
        error: 'No GitHub API token configured',
        progress: 0
      });
      return;
    }
    
    // Parse GitHub URL to extract owner/org name
    let owner = '';
    let isOrg = false;
    
    try {
      // Handle different URL formats:
      // https://github.com/owner
      // https://github.com/owner/
      // github.com/owner
      // owner (direct input)
      
      if (githubUrl.includes('/')) {
        // This is a URL, parse it
        let urlToProcess = githubUrl;
        
        // Ensure URL has protocol
        if (!urlToProcess.startsWith('http')) {
          urlToProcess = 'https://' + urlToProcess;
        }
        
        const urlObj = new URL(urlToProcess);
        const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
        
        if (pathParts.length > 0) {
          owner = pathParts[0];
        } else {
          throw new Error('Invalid GitHub URL format');
        }
      } else {
        // Direct owner name input
        owner = githubUrl.trim();
      }
      
      if (!owner) {
        throw new Error('Could not extract owner/organization name from URL');
      }
      
      // Update status with owner
      updateBulkImportStatus(bulkImportId, {
        owner,
        message: `Identified GitHub account: ${owner}`
      });
      
      // Check if this is an organization or user
      try {
        const orgResponse = await octokit.rest.orgs.get({ org: owner });
        if (orgResponse.status === 200) {
          isOrg = true;
          updateBulkImportStatus(bulkImportId, {
            isOrg: true,
            message: `Fetching repositories from organization: ${owner}`
          });
        }
      } catch (orgError) {
        // Not an org, try as user
        try {
          const userResponse = await octokit.rest.users.getByUsername({ username: owner });
          if (userResponse.status === 200) {
            isOrg = false;
            updateBulkImportStatus(bulkImportId, {
              isOrg: false,
              message: `Fetching repositories from user: ${owner}`
            });
          }
        } catch (userError) {
          throw new Error(`Account ${owner} not found on GitHub`);
        }
      }
      
      // Get all repositories
      const repos = [];
      let page = 1;
      let hasMorePages = true;
      
      // Adjust limit to be safe
      const actualLimit = Math.min(
        skipConfirmation ? BULK_IMPORT_ABSOLUTE_LIMIT : BULK_IMPORT_DEFAULT_LIMIT,
        repoLimit
      );
      
      // Fetch repositories (paginated)
      while (hasMorePages && repos.length < actualLimit) {
        try {
          let response;
          
          if (isOrg) {
            response = await octokit.rest.repos.listForOrg({
              org: owner,
              per_page: 100,
              page
            });
          } else {
            response = await octokit.rest.repos.listForUser({
              username: owner,
              per_page: 100,
              page
            });
          }
          
          if (response.data.length === 0) {
            hasMorePages = false;
          } else {
            repos.push(...response.data);
            page++;
            
            // Update status
            updateBulkImportStatus(bulkImportId, {
              progress: Math.min(20, 5 + (repos.length / 10)),
              message: `Found ${repos.length} repositories so far...`
            });
          }
        } catch (pageError) {
          logger.error(`Error fetching page ${page} of repositories:`, pageError);
          hasMorePages = false;
        }
      }
      
      // Apply limit
      const limitedRepos = repos.slice(0, actualLimit);
      
      // Check if we need confirmation
      if (!skipConfirmation && limitedRepos.length > BULK_IMPORT_REQUIRES_CONFIRMATION) {
        updateBulkImportStatus(bulkImportId, {
          status: 'requires_confirmation',
          message: `Found ${limitedRepos.length} repositories. Confirmation required to proceed.`,
          totalRepos: limitedRepos.length,
          progress: 25
        });
        return;
      }
      
      // No repositories found
      if (limitedRepos.length === 0) {
        updateBulkImportStatus(bulkImportId, {
          status: 'completed',
          message: `No repositories found for ${owner}`,
          progress: 100,
          completedRepos: 0,
          totalRepos: 0
        });
        return;
      }
      
      // Start cloning repositories
      updateBulkImportStatus(bulkImportId, {
        status: 'importing',
        message: `Starting import of ${limitedRepos.length} repositories...`,
        totalRepos: limitedRepos.length,
        progress: 30
      });
      
      // Prepare tracking variables
      let completedRepos = 0;
      let failedRepos = 0;
      let importedRepositories = [];
      
      // Process repositories with concurrency control
      const queue = [...limitedRepos];
      const activePromises = new Map();
      
      // Process next repository in queue
      const processNext = () => {
        if (queue.length === 0) return;
        
        const repo = queue.shift();
        const cloneId = Date.now().toString() + Math.floor(Math.random() * 1000);
        
        // Create clone URL
        const cloneUrl = repo.clone_url;
        
        // Track this promise
        const promise = processRepositoryCloneForBulkImport(cloneId, cloneUrl, repo, bulkImportId)
          .then(result => {
            if (result.success) {
              completedRepos++;
              importedRepositories.push(result.repository);
            } else {
              failedRepos++;
            }
            
            // Update status
            const progress = 30 + Math.floor((completedRepos + failedRepos) / limitedRepos.length * 70);
            updateBulkImportStatus(bulkImportId, {
              progress,
              completedRepos: completedRepos + failedRepos,
              failedRepos,
              message: `Processed ${completedRepos + failedRepos}/${limitedRepos.length} repositories...`,
              repositories: importedRepositories
            });
            
            // Remove from active promises
            activePromises.delete(cloneId);
            
            // Process next item if available
            processNext();
          });
        
        activePromises.set(cloneId, promise);
      };
      
      // Start initial batch of promises
      for (let i = 0; i < MAX_CONCURRENT_CLONES; i++) {
        if (queue.length > 0) processNext();
      }
      
      // Wait for all repositories to be processed
      while (activePromises.size > 0) {
        await Promise.race(activePromises.values());
      }
      
      // Create projects if requested
      let createdProjects = [];
      if (projectCreationMode !== 'none' && importedRepositories.length > 0) {
        try {
          createdProjects = await createProjectsFromRepositories(
            importedRepositories,
            projectCreationMode,
            projectNameTemplate
          );
          
          // Update status with created projects
          updateBulkImportStatus(bulkImportId, {
            createdProjects
          });
        } catch (projectError) {
          logger.error('Error creating projects:', projectError);
        }
      }
      
      // Finalize
      updateBulkImportStatus(bulkImportId, {
        status: 'completed',
        progress: 100,
        message: `Import completed. Successfully imported ${completedRepos}/${limitedRepos.length} repositories.`,
        completedRepos: completedRepos + failedRepos,
        failedRepos,
        totalRepos: limitedRepos.length,
        repositories: importedRepositories,
        createdProjects,
        endTime: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Error in bulk import process:', error);
      updateBulkImportStatus(bulkImportId, {
        status: 'failed',
        message: `Bulk import failed: ${error.message}`,
        error: error.message,
        progress: 0,
        endTime: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Unexpected error in bulk import process:', error);
    updateBulkImportStatus(bulkImportId, {
      status: 'failed',
      message: `Unexpected error in bulk import process`,
      error: error.message,
      progress: 0,
      endTime: new Date().toISOString()
    });
  }
}

/**
 * Clone a repository for bulk import
 * @param {string} cloneId - Clone ID
 * @param {string} url - Repository URL
 * @param {Object} repoInfo - Repository information from GitHub API
 * @param {string} bulkImportId - Bulk import ID
 * @returns {Promise<Object>} Result
 */
async function processRepositoryCloneForBulkImport(cloneId, url, repoInfo, bulkImportId) {
  try {
    // Create repos directory if it doesn't exist
    const reposDir = path.join(__dirname, '../../repos');
    if (!fs.existsSync(reposDir)) {
      fs.mkdirSync(reposDir, { recursive: true });
    }
    
    // Extract owner and repo name
    const owner = repoInfo.owner.login;
    const repoName = repoInfo.name;
    const folderName = `${owner}_${repoName}`;
    const description = repoInfo.description || '';
    
    // Check if folder already exists
    const repoPath = path.join(reposDir, folderName);
    let repoAlreadyCloned = false;
    
    if (fs.existsSync(repoPath)) {
      logger.info(`Repository ${owner}/${repoName} already exists locally, skipping clone`);
      repoAlreadyCloned = true;
    }
    
    // Clone repository if needed
    if (!repoAlreadyCloned) {
      try {
        // Authenticate GitHub URL
        let cloneUrl = url;
        if (process.env.GITHUB_TOKEN) {
          cloneUrl = url.replace('https://', `https://${process.env.GITHUB_TOKEN}@`);
        }
        
        // Clone the repository
        const git = simpleGit();
        await git.clone(cloneUrl, repoPath, ['--depth', '1']);
      } catch (cloneError) {
        logger.error(`Error cloning repository ${owner}/${repoName}:`, cloneError);
        return { success: false, error: cloneError.message };
      }
    }
    
    // Add to database
    try {
      // Get fresh database instance
      const db = getDatabase();
      
      // Check if already exists
      const existingRepo = db.get('repositories')
        .find({ url })
        .value();
      
      if (existingRepo) {
        return { 
          success: true, 
          repository: existingRepo,
          alreadyExisted: true 
        };
      }
      
      // Create repository entry
      const id = Date.now().toString() + Math.floor(Math.random() * 1000);
      const repository = {
        id,
        url,
        name: repoName,
        owner: owner,
        description: description || `Repository from ${url}`,
        path: repoPath,
        stars: repoInfo.stargazers_count,
        language: repoInfo.language,
        dateAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      // Add to database
      db.get('repositories')
        .push(repository)
        .write();
      
      logger.info(`Repository ${owner}/${repoName} added to database with ID ${id}`);
      
      return { success: true, repository };
    } catch (dbError) {
      logger.error(`Error adding repository ${owner}/${repoName} to database:`, dbError);
      return { success: false, error: dbError.message };
    }
  } catch (error) {
    logger.error(`Unexpected error processing repository ${url}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Create projects from imported repositories
 * @param {Array} repositories - Imported repositories
 * @param {string} mode - Project creation mode ('single', 'byOwner')
 * @param {string} nameTemplate - Template for project names
 * @returns {Promise<Array>} Created projects
 */
async function createProjectsFromRepositories(repositories, mode, nameTemplate) {
  try {
    const createdProjects = [];
    
    if (mode === 'single') {
      // Create a single project containing all repositories
      const projectName = nameTemplate
        .replace('{owner}', 'Combined Project')
        .replace('{date}', new Date().toISOString().slice(0, 10));
      
      const projectData = {
        name: projectName,
        description: `Project created from bulk import containing ${repositories.length} repositories`,
        repositories: repositories.map(repo => repo.id),
        renderProfileId: null
      };
      
      // Add to database using ProjectService
      const project = ProjectService.createProject(projectData);
      createdProjects.push(project);
    } else if (mode === 'byOwner') {
      // Group repositories by owner
      const ownerGroups = {};
      
      repositories.forEach(repo => {
        if (!ownerGroups[repo.owner]) {
          ownerGroups[repo.owner] = [];
        }
        ownerGroups[repo.owner].push(repo);
      });
      
      // Create project for each owner
      for (const [owner, repos] of Object.entries(ownerGroups)) {
        if (repos.length === 0) continue;
        
        const projectName = nameTemplate
          .replace('{owner}', owner)
          .replace('{date}', new Date().toISOString().slice(0, 10));
        
        const projectData = {
          name: projectName,
          description: `Project created from bulk import for ${owner} containing ${repos.length} repositories`,
          repositories: repos.map(repo => repo.id),
          renderProfileId: null
        };
        
        // Add to database using ProjectService
        const project = ProjectService.createProject(projectData);
        createdProjects.push(project);
      }
    }
    
    return createdProjects;
  } catch (error) {
    logger.error('Error creating projects from repositories:', error);
    throw error;
  }
}

/**
 * Get dashboard statistics
 */
const getDashboardStats = (req, res) => {
  try {
    const db = getDatabase();
    
    // Get counts
    const repoCount = db.get('repositories').size().value();
    const projectCount = db.get('projects').size().value();
    const renderCount = db.get('renders').size().value();
    
    // Get recently added repositories
    const recentRepos = db.get('repositories')
      .orderBy(['dateAdded'], ['desc'])
      .take(5)
      .value();
    
    // Get recent renders
    const recentRenders = db.get('renders')
      .orderBy(['startTime'], ['desc'])
      .take(5)
      .value();
    
    // Get stats per owner
    const repositories = db.get('repositories').value();
    const ownerStats = {};
    
    repositories.forEach(repo => {
      if (!repo.owner) return;
      
      if (!ownerStats[repo.owner]) {
        ownerStats[repo.owner] = {
          count: 0,
          repositories: []
        };
      }
      
      ownerStats[repo.owner].count++;
      ownerStats[repo.owner].repositories.push({
        id: repo.id,
        name: repo.name
      });
    });
    
    // Convert to array and sort by count
    const sortedOwnerStats = Object.entries(ownerStats)
      .map(([owner, stats]) => ({
        owner,
        repoCount: stats.count,
        repositories: stats.repositories
      }))
      .sort((a, b) => b.repoCount - a.repoCount);
    
    // Get stats about renders
    const completedRenders = db.get('renders')
      .filter({ status: 'completed' })
      .size()
      .value();
    
    const failedRenders = db.get('renders')
      .filter({ status: 'failed' })
      .size()
      .value();
    
    // Build response
    const stats = {
      totalRepositories: repoCount,
      totalProjects: projectCount,
      totalRenders: renderCount,
      completedRenders,
      failedRenders,
      ownerStats: sortedOwnerStats.slice(0, 10), // Top 10 owners
      recentRepositories: recentRepos,
      recentRenders: recentRenders
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

/**
 * Delete a repository
 * @param {string} id - Repository ID
 * @returns {boolean} - Success or failure
 */
const deleteRepository = async (id) => {
  try {
    if (!id) return false;
    
    const db = getDatabase();
    const repository = db.get('repositories')
      .find({ id: id.toString() })
      .value();
    
    if (!repository) {
      return false;
    }
    
    // Check if repository is used in any projects
    const projects = db.get('projects').value() || [];
    const usedInProjects = projects.filter(project => 
      project.repositories && project.repositories.includes(id.toString())
    );
    
    if (usedInProjects.length > 0) {
      throw new Error(`Repository is used in ${usedInProjects.length} project(s) and cannot be deleted. Remove it from the projects first.`);
    }
    
    // Delete from database
    db.get('repositories')
      .remove({ id: id.toString() })
      .write();
    
    logger.info(`Repository deleted: ${repository.name} (ID: ${id})`);
    return true;
  } catch (error) {
    logger.error(`Error deleting repository ${id}:`, error);
    throw error;
  }
};

module.exports = {
  getAllRepositories,
  getRepositoryById,
  getCloneStatus,
  getBulkImportStatus,
  addRepository,
  bulkImport,
  getDashboardStats,
  deleteRepository
}; 