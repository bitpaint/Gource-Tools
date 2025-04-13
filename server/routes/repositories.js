const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');
const simpleGit = require('simple-git');
const { Octokit } = require('octokit');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const os = require('os');

const adapter = new FileSync(path.join(__dirname, '../../db/db.json'));
const db = low(adapter);

// Maximum length of file paths for Windows
const MAX_PATH_LENGTH_WINDOWS = 240; // Windows limite est à ~260, mais gardons une marge

// Nombre de processeurs disponibles sur la machine
const NUM_CPUS = os.cpus().length;

// Configuration par défaut pour l'importation massive optimisée
const DEFAULT_MAX_CONCURRENT_CLONES = Math.max(4, Math.min(12, NUM_CPUS)); // Entre 4 et 12, basé sur les CPUs
const DEFAULT_CLONE_DEPTH = 1; // Clone superficiel par défaut pour économiser de la bande passante et du temps
const THROUGHPUT_CHECK_INTERVAL = 1000; // Intervalle de vérification du débit en ms

// Configuration des statuts de clonage et des limites
const cloneStatuses = new Map();
const MAX_CONCURRENT_CLONES = process.env.MAX_CONCURRENT_CLONES ? parseInt(process.env.MAX_CONCURRENT_CLONES) : DEFAULT_MAX_CONCURRENT_CLONES;

// Configuration pour l'importation massive avec limites et sécurités
const BULK_IMPORT_DEFAULT_LIMIT = 10000; // Nombre maximum de dépôts par défaut
const BULK_IMPORT_ABSOLUTE_LIMIT = 99999; // Limite absolue (même avec confirmation)
const BULK_IMPORT_REQUIRES_CONFIRMATION = 0; // Seuil à partir duquel une confirmation est requise

// Fonction pour recharger la base de données
function reloadDatabase() {
  // Recharger explicitement la base de données pour avoir les données les plus récentes
  const refreshedAdapter = new FileSync(path.join(__dirname, '../../db/db.json'));
  return low(refreshedAdapter);
}

// Initialize Octokit (GitHub API client) if token is available
let octokit = null;
if (process.env.GITHUB_TOKEN) {
  octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  console.log('GitHub API token configured successfully');
} else {
  console.log('No GitHub API token found. Some operations may be rate-limited.');
}

// Get all repositories
router.get('/', async (req, res) => {
  try {
    // Recharger la base de données pour avoir les données les plus récentes
    const freshDb = reloadDatabase();
    
    // Vérifier si des dépôts existent mais ne sont pas dans la base de données
    const reposDir = path.join(__dirname, '../../repos');
    
    // S'assurer que le répertoire repos existe
    if (!fs.existsSync(reposDir)) {
      fs.mkdirSync(reposDir, { recursive: true });
    }
    
    // Obtenir les dossiers existants dans le répertoire repos
    const existingFolders = fs.readdirSync(reposDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    // Obtenir les dépôts existants dans la base de données
    const repositories = freshDb.get('repositories').value();
    const existingRepoFolderNames = repositories.map(repo => path.basename(repo.path));
    
    // Trouver les dossiers de dépôts qui ne sont pas dans la base de données
    const missingRepos = existingFolders.filter(folder => !existingRepoFolderNames.includes(folder));
    
    // Ajouter les dépôts manquants à la base de données
    for (const folderName of missingRepos) {
      const repoPath = path.join(reposDir, folderName);
      
      try {
        // Essayer d'obtenir l'URL du dépôt via git de façon synchrone
        const git = simpleGit(repoPath);
        const remotes = await git.getRemotes(true);
        
        if (!remotes || remotes.length === 0) {
          console.log(`Pas de remote trouvé pour ${folderName}, ajout impossible`);
          continue;
        }
        
        // Utiliser le premier remote comme URL
        const url = remotes[0].refs.fetch || remotes[0].refs.push;
        if (!url) {
          console.log(`Pas d'URL trouvée pour ${folderName}, ajout impossible`);
          continue;
        }
        
        // Extraire le propriétaire du dépôt depuis l'URL si possible
        let owner = 'unknown';
        try {
          const urlObj = new URL(url);
          const urlPath = urlObj.pathname;
          const pathParts = urlPath.split('/').filter(part => part.length > 0);
          if (pathParts.length >= 2) {
            owner = pathParts[pathParts.length - 2];
          }
        } catch (parseError) {
          console.warn(`Impossible d'extraire le propriétaire pour ${folderName}: ${parseError.message}`);
        }
        
        // Créer une entrée pour ce dépôt dans la base de données
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
        
        freshDb.get('repositories')
          .push(newRepo)
          .write();
          
        console.log(`Added repository from existing folder: ${folderName} (owner: ${owner})`);
      } catch (error) {
        console.error(`Error adding repository from folder ${folderName}:`, error.message);
      }
    }
    
    // Vérifier si des dépôts existants n'ont pas de propriétaire
    const reposWithoutOwner = freshDb.get('repositories')
      .filter(repo => !repo.owner)
      .value();
    
    // Ajouter le propriétaire aux dépôts existants
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
        
        freshDb.get('repositories')
          .find({ id: repo.id })
          .assign({ owner: owner })
          .write();
          
        console.log(`Updated owner for repository ${repo.name} to ${owner}`);
      } catch (error) {
        console.error(`Error updating owner for repository ${repo.name}:`, error.message);
      }
    }
    
    // Renvoyer les dépôts mis à jour
    const updatedRepositories = freshDb.get('repositories').value();
    res.json(updatedRepositories);
  } catch (error) {
    console.error('Error getting repositories:', error);
    res.status(500).json({ error: 'Failed to get repositories', details: error.message });
  }
});

// Get a single repository
router.get('/:id', (req, res) => {
  // Recharger la base de données pour avoir les données les plus récentes
  const freshDb = reloadDatabase();
  
  const repository = freshDb.get('repositories')
    .find({ id: req.params.id })
    .value();

  if (!repository) {
    return res.status(404).json({ error: 'Repository not found' });
  }

  res.json(repository);
});

// Update a status in cloneStatuses Map
function updateCloneStatus(id, updates) {
  const currentStatus = cloneStatuses.get(id) || {};
  const newStatus = Object.assign({}, currentStatus, updates);
  cloneStatuses.set(id, newStatus);
  return newStatus;
}

// Endpoint to get clone status
router.get('/clone-status/:cloneId', (req, res) => {
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
    console.error('Error fetching clone status:', error);
    res.status(500).json({ error: 'Failed to fetch clone status' });
  }
});

// Add a new repository
router.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    
    console.log('Creating repository - received data:');
    console.log('url:', url);

    // Reload database
    const freshDb = reloadDatabase();

    // Validate input
    if (!url) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    // Check if repository with same URL already exists
    const existingRepo = freshDb.get('repositories')
      .find({ url })
      .value();

    if (existingRepo) {
      return res.status(400).json({ error: 'A repository with this URL already exists', details: 'Please use a different URL' });
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
    try {
      // Status update using our new function
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
          // Utiliser "<owner>_<repoName>" comme nom de dossier pour éviter les conflits
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
            
            console.log(`Fetching details for ${owner}/${repoName} from GitHub API`);
            const repoDetails = await octokit.rest.repos.get({
              owner,
              repo: repoName
            });
            
            if (repoDetails && repoDetails.data) {
              console.log('Successfully fetched repository details from GitHub API');
              // Conserver le préfixe avec le propriétaire pour éviter les conflits
              folderName = `${owner}_${repoDetails.data.name}`;
              repoName = repoDetails.data.name;
              description = repoDetails.data.description || '';
              
              updateCloneStatus(cloneId, {
                progress: 9,
                message: `Found repository: ${owner}/${repoName} (${description})`
              });
            }
          } catch (apiError) {
            console.error('Error fetching repository details from GitHub API:', apiError.message);
            // Continue with the folder name we already extracted
          }
        }
        
        console.log(`Extracted owner: ${owner}, folder name: ${folderName}, description: ${description || 'none'}`);
        
        // Status update
        updateCloneStatus(cloneId, {
          progress: 10,
          message: `Preparing to clone ${owner}/${repoName}...`
        });
      } catch (error) {
        console.error('Error parsing URL:', error.message);
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
        console.log(`Repository directory ${repoPath} already exists, skipping clone`);
        repoAlreadyCloned = true;
        
        // Status update
        updateCloneStatus(cloneId, {
          step: 1,
          progress: 50,
          status: 'skipped_clone',
          message: `Repository already exists locally, skipping clone.`
        });
      }

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
          console.log(`Cloning repository from ${url}...`);
          
          // Check if we're cloning from GitHub and can use the API token
          const isGitHubRepo = url.includes('github.com');
          let cloneUrl = url;
          
          if (isGitHubRepo && process.env.GITHUB_TOKEN) {
            // Insert token into GitHub URL for authentication
            const urlObj = new URL(url);
            cloneUrl = url.replace('https://', `https://${process.env.GITHUB_TOKEN}@`);
            console.log('Using GitHub token for authenticated clone');
            
            // Status update
            updateCloneStatus(cloneId, {
              message: `Using GitHub API token for authentication...`
            });
          }
          
          // Configure progress tracking for Git cloning
          const git = simpleGit();
          
          // Progress listener
          git.outputHandler((command, stdout, stderr) => {
            stdout.on('data', (data) => {
              const output = data.toString();
              console.log(`Git clone output: ${output}`);
              
              // Parse output to detect progress
              if (output.includes('Receiving objects:')) {
                try {
                  const match = output.match(/Receiving objects:\s+(\d+)%/);
                  if (match && match[1]) {
                    const percentage = parseInt(match[1], 10);
                    // Map progress (20-70% of total progress)
                    const mappedProgress = 20 + (percentage / 2);
                    
                    updateCloneStatus(cloneId, {
                      progress: mappedProgress,
                      message: `Cloning repository: receiving objects (${percentage}%)`
                    });
                  }
                } catch (err) {
                  console.error('Error parsing git progress:', err);
                }
              } else if (output.includes('Resolving deltas:')) {
                try {
                  const match = output.match(/Resolving deltas:\s+(\d+)%/);
                  if (match && match[1]) {
                    const percentage = parseInt(match[1], 10);
                    // Map progress (70-80% of total progress)
                    const mappedProgress = 70 + (percentage / 10);
                    
                    updateCloneStatus(cloneId, {
                      progress: mappedProgress,
                      message: `Cloning repository: resolving deltas (${percentage}%)`
                    });
                  }
                } catch (err) {
                  console.error('Error parsing git progress:', err);
                }
              }
            });
            
            stderr.on('data', (data) => {
              const errorOutput = data.toString();
              console.log(`Git clone error: ${errorOutput}`);
              
              // Note: For git, stderr is often used for progress information too
              if (errorOutput.includes('Receiving objects:') || errorOutput.includes('Resolving deltas:')) {
                try {
                  // Extract percentage
                  let match;
                  if (errorOutput.includes('Receiving objects:')) {
                    match = errorOutput.match(/Receiving objects:\s+(\d+)%/);
                    if (match && match[1]) {
                      const percentage = parseInt(match[1], 10);
                      // Map progress (20-70% of total progress)
                      const mappedProgress = 20 + (percentage / 2);
                      
                      updateCloneStatus(cloneId, {
                        progress: mappedProgress,
                        message: `Cloning repository: receiving objects (${percentage}%)`
                      });
                    }
                  } else if (errorOutput.includes('Resolving deltas:')) {
                    match = errorOutput.match(/Resolving deltas:\s+(\d+)%/);
                    if (match && match[1]) {
                      const percentage = parseInt(match[1], 10);
                      // Map progress (70-80% of total progress)
                      const mappedProgress = 70 + (percentage / 10);
                      
                      updateCloneStatus(cloneId, {
                        progress: mappedProgress,
                        message: `Cloning repository: resolving deltas (${percentage}%)`
                      });
                    }
                  }
                } catch (err) {
                  console.error('Error parsing git stderr progress:', err);
                }
              }
            });
            
            return { error: null, output: null };
          });
          
          // Clone with progress option enabled
          await git.clone(cloneUrl, repoPath, ['--progress']);
          console.log('Repository cloned successfully');
          
          // Status update
          updateCloneStatus(cloneId, {
            progress: 80,
            message: 'Repository cloned successfully'
          });
        } catch (error) {
          console.error('Error cloning repository:', error.message);
          updateCloneStatus(cloneId, {
            status: 'failed',
            error: `Failed to clone repository: ${error.message}`
          });
          return;
        }
      }

      // Step 2: Log generation
      updateCloneStatus(cloneId, {
        step: 2,
        progress: 85,
        status: 'generating_logs',
        message: 'Generating Gource visualization logs...'
      });
      
      // Get repo info
      const git = simpleGit(repoPath);
      const remotes = await git.getRemotes(true);
      
      // Generate a more stable ID
      const id = Date.now().toString();
      console.log('Generated ID for new repository:', id);
      
      // Generate Gource log file
      const logFilePath = path.join(logsDir, `${id}.log`);
      try {
        console.log(`Generating Gource log for repository: ${folderName}`);
        
        let gourceLog = '';
        try {
          updateCloneStatus(cloneId, {
            progress: 87,
            message: 'Generating Gource log: processing commit history...'
          });
          
          gourceLog = execSync(
            `gource --output-custom-log - "${repoPath}"`,
            { 
              encoding: 'utf-8',
              maxBuffer: 200 * 1024 * 1024 // 200MB buffer (increased for large repos)
            }
          );
          
          updateCloneStatus(cloneId, {
            progress: 90,
            message: 'Gource log generated successfully'
          });
        } catch (execError) {
          console.error(`Error using execSync for repository ${folderName}, trying alternate method:`, execError.message);
          
          updateCloneStatus(cloneId, {
            progress: 87,
            message: 'Using alternative method for log generation...'
          });
          
          // Alternative method: first generate a temporary log file
          const tempLogFile = path.join(logsDir, `${id}_temp.log`);
          execSync(
            `gource --output-custom-log "${tempLogFile}" "${repoPath}"`,
            { 
              stdio: 'ignore', // Don't capture output
              maxBuffer: 200 * 1024 * 1024 // 200MB buffer (increased)
            }
          );
          
          // Read the generated log file
          if (fs.existsSync(tempLogFile)) {
            gourceLog = fs.readFileSync(tempLogFile, 'utf-8');
            // Delete temporary file after use
            fs.unlinkSync(tempLogFile);
            
            updateCloneStatus(cloneId, {
              progress: 90,
              message: 'Gource log generated successfully with alternative method'
            });
          } else {
            throw new Error(`Failed to generate log file for repository ${folderName}`);
          }
        }
        
        // Write log to a file
        fs.writeFileSync(logFilePath, gourceLog);
        
        // Verify that the generated file contains valid data
        const logContent = fs.readFileSync(logFilePath, 'utf-8');
        const lines = logContent.split('\n');
        let validLines = 0;
        
        for (const line of lines) {
          if (line.trim()) {
            const parts = line.split('|');
            // Verify that we have at least 4 parts (timestamp|username|type|file)
            if (parts.length >= 4 && (parts[2] === 'A' || parts[2] === 'M' || parts[2] === 'D')) {
              validLines++;
            }
          }
        }
        
        if (validLines > 0) {
          console.log(`Gource log generated and saved to ${logFilePath} (${validLines} valid lines)`);
          
          updateCloneStatus(cloneId, {
            progress: 95,
            message: `Gource log verified (${validLines} valid entries)`
          });
        } else {
          console.error(`Warning: Generated log file for ${folderName} contains no valid entries. This might cause rendering issues.`);
          
          updateCloneStatus(cloneId, {
            progress: 95,
            message: 'Warning: Generated log file contains no valid entries'
          });
        }
      } catch (logError) {
        console.error(`Warning: Could not generate Gource log for repository ${folderName}:`, logError.message);
        // Continue without generating log - we'll try again later if needed
        
        updateCloneStatus(cloneId, {
          progress: 95,
          message: `Warning: Could not generate Gource log (${logError.message})`
        });
      }
      
      // Step 3: Finalization
      updateCloneStatus(cloneId, {
        step: 3,
        progress: 97,
        status: 'finalizing',
        message: 'Finalizing repository setup...'
      });
      
      // Store repo in database
      const newRepo = {
        id,
        url,
        name: folderName,
        owner: owner || 'unknown',
        description: description || '',
        path: repoPath,
        logPath: logFilePath,
        dateAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      console.log('Adding repository to database:', newRepo);
      
      freshDb.get('repositories')
        .push(newRepo)
        .write();

      // Display all repositories for debugging
      console.log('Repositories after addition:', freshDb.get('repositories').value().map(r => ({ id: r.id, name: r.name })));

      // Done!
      updateCloneStatus(cloneId, {
        progress: 100,
        status: 'completed',
        message: 'Repository added successfully'
      });
      
      // Remove status after 5 minutes to avoid memory leaks
      setTimeout(() => {
        cloneStatuses.delete(cloneId);
        console.log(`Cleaned up clone status for ${cloneId}`);
      }, 5 * 60 * 1000);
      
    } catch (processError) {
      console.error('Error in background cloning process:', processError);
      updateCloneStatus(cloneId, {
        status: 'failed',
        error: `Failed to process repository: ${processError.message}`
      });
    }
    
  } catch (error) {
    console.error('Error adding repository:', error);
    res.status(500).json({ error: 'Failed to add repository', details: error.message });
  }
});

// Update a repository (pull latest changes)
router.put('/:id/update', async (req, res) => {
  try {
    console.log(`Updating repository with ID: ${req.params.id}`);
    
    // Vérifier à la fois dans la base de données normale et fraîche
    let repo = db.get('repositories')
      .find({ id: req.params.id })
      .value();
      
    if (!repo) {
      console.log(`Repository not found in main DB, checking freshDb for ID: ${req.params.id}`);
      const freshDb = reloadDatabase();
      repo = freshDb.get('repositories')
        .find({ id: req.params.id })
        .value();
        
      if (repo) {
        console.log(`Repository found in freshDb, adding to main DB: ${repo.name}`);
        // Synchroniser les bases de données
        db.get('repositories')
          .push(repo)
          .write();
      }
    }

    if (!repo) {
      console.error(`Repository not found in any database with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Repository not found' });
    }

    // Vérifier que le répertoire existe
    if (!fs.existsSync(repo.path)) {
      console.error(`Repository directory does not exist: ${repo.path}`);
      
      // Mettre à jour la base de données pour marquer que le dépôt a été vérifié
      db.get('repositories')
        .find({ id: req.params.id })
        .assign({ 
          lastUpdated: new Date().toISOString(),
          status: 'error',
          statusMessage: 'Repository directory does not exist on disk'
        })
        .write();
        
      return res.status(400).json({ 
        error: 'Repository directory does not exist on disk', 
        repository: repo 
      });
    }

    // Déclarer les variables en dehors du bloc try/catch
    let oldHead = '';
    let newHead = '';
    let newCommitsCount = 0;

    // Pull latest changes
    try {
      const git = simpleGit(repo.path);
      
      // Get current commit hash before pull
      oldHead = await git.revparse(['HEAD']);
      
      // Pull latest changes
      await git.pull();
      
      // Get new commit hash after pull
      newHead = await git.revparse(['HEAD']);
      
      // Get number of commits between old and new head
      if (oldHead !== newHead) {
        const logResult = await git.log({ from: oldHead, to: newHead });
        newCommitsCount = logResult.total;
      }
    } catch (gitError) {
      console.error(`Error pulling latest changes for repository ${repo.name}:`, gitError.message);
      
      // Mettre à jour la base de données pour marquer que le dépôt a été vérifié
      db.get('repositories')
        .find({ id: req.params.id })
        .assign({ 
          lastUpdated: new Date().toISOString(),
          status: 'error',
          statusMessage: `Git error: ${gitError.message}`
        })
        .write();
        
      return res.status(500).json({ 
        error: 'Failed to pull latest changes', 
        details: gitError.message,
        repository: repo 
      });
    }

    // Regénérer le log Gource
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFilePath = path.join(logsDir, `${repo.id}.log`);
    let logGenerationStatus = 'success';
    let logGenerationMessage = '';

    try {
      console.log(`Regenerating Gource log for updated repository: ${repo.name}`);
      
      let gourceLog = '';
      try {
        gourceLog = execSync(
          `gource --output-custom-log - "${repo.path}"`,
          { 
            encoding: 'utf-8',
            maxBuffer: 100 * 1024 * 1024 // 100MB buffer
          }
        );
      } catch (execError) {
        console.error(`Error using execSync for repository ${repo.name}, trying alternate method:`, execError.message);
        
        // Méthode alternative: générer d'abord un fichier log temporaire
        const tempLogFile = path.join(logsDir, `${repo.id}_temp.log`);
        execSync(
          `gource --output-custom-log "${tempLogFile}" "${repo.path}"`,
          { 
            stdio: 'ignore', // Ne pas capturer la sortie
            maxBuffer: 100 * 1024 * 1024 // 100MB buffer 
          }
        );
        
        // Lire le fichier log généré
        if (fs.existsSync(tempLogFile)) {
          gourceLog = fs.readFileSync(tempLogFile, 'utf-8');
          // Supprimer le fichier temporaire après utilisation
          fs.unlinkSync(tempLogFile);
        } else {
          throw new Error(`Failed to generate log file for repository ${repo.name}`);
        }
      }
      
      // Écrire le log dans un fichier
      fs.writeFileSync(logFilePath, gourceLog);
      
      // Vérifier que le fichier généré contient des données valides
      const logContent = fs.readFileSync(logFilePath, 'utf-8');
      const lines = logContent.split('\n');
      let validLines = 0;
      
      for (const line of lines) {
        if (line.trim()) {
          const parts = line.split('|');
          // Vérifier que nous avons au moins 4 parties (timestamp|username|type|file)
          if (parts.length >= 4 && (parts[2] === 'A' || parts[2] === 'M' || parts[2] === 'D')) {
            validLines++;
          }
        }
      }
      
      if (validLines > 0) {
        console.log(`Gource log regenerated and saved to ${logFilePath} (${validLines} valid lines)`);
        logGenerationStatus = 'success';
        logGenerationMessage = `Generated ${validLines} valid lines`;
      } else {
        console.error(`Warning: Generated log file for ${repo.name} contains no valid entries. This might cause rendering issues.`);
        logGenerationStatus = 'warning';
        logGenerationMessage = 'Log file contains no valid entries';
      }
    } catch (logError) {
      console.error(`Warning: Could not regenerate Gource log for repository ${repo.name}:`, logError.message);
      logGenerationStatus = 'error';
      logGenerationMessage = logError.message;
      // Continue without generating log
    }

    // Update lastUpdated timestamp and logPath
    db.get('repositories')
      .find({ id: req.params.id })
      .assign({ 
        lastUpdated: new Date().toISOString(),
        logPath: logFilePath,
        status: logGenerationStatus,
        statusMessage: logGenerationMessage,
        lastCommitHash: newHead || repo.lastCommitHash || '',
        newCommitsCount: newCommitsCount
      })
      .write();

    // Récupérer le dépôt mis à jour
    const updatedRepo = db.get('repositories')
      .find({ id: req.params.id })
      .value();

    res.json({ 
      message: 'Repository updated successfully', 
      repository: updatedRepo,
      logStatus: logGenerationStatus,
      logMessage: logGenerationMessage,
      newCommitsCount: newCommitsCount
    });
  } catch (error) {
    console.error('Error updating repository:', error);
    res.status(500).json({ error: 'Failed to update repository', details: error.message });
  }
});

// Delete a repository
router.delete('/:id', (req, res) => {
  try {
    // Recharger la base de données pour avoir les données les plus récentes
    const freshDb = reloadDatabase();
    
    const repo = freshDb.get('repositories')
      .find({ id: req.params.id })
      .value();

    if (!repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    // Remove repository from filesystem
    if (fs.existsSync(repo.path)) {
      fs.rmSync(repo.path, { recursive: true, force: true });
    }

    // Remove from database
    freshDb.get('repositories')
      .remove({ id: req.params.id })
      .write();

    // Also remove from any projects
    freshDb.get('projects')
      .forEach(project => {
        if (project.repositories.includes(req.params.id)) {
          project.repositories = project.repositories.filter(repoId => repoId !== req.params.id);
        }
      })
      .write();

    res.json({ message: 'Repository deleted successfully' });
  } catch (error) {
    console.error('Error deleting repository:', error);
    res.status(500).json({ error: 'Failed to delete repository', details: error.message });
  }
});

// Bulk import repositories from GitHub organization or user
router.post('/bulk-import', async (req, res) => {
  try {
    const { 
      githubUrl, 
      projectCreationMode, 
      projectNameTemplate, 
      maxConcurrentClones,
      repoLimit,
      skipConfirmation,
      confirmationToken
    } = req.body;
    
    // Validate input
    if (!githubUrl) {
      return res.status(400).json({ error: 'GitHub URL or username is required' });
    }
    
    // Validate project creation mode
    const validModes = ['none', 'single', 'per_owner'];
    const mode = projectCreationMode || 'none';
    if (!validModes.includes(mode)) {
      return res.status(400).json({ 
        error: 'Invalid project creation mode', 
        details: 'Valid modes are: none, single, per_owner' 
      });
    }

    console.log(`[BULK IMPORT DEBUG] Démarrage de l'importation pour: ${githubUrl}`);
    
    // Reload database
    const freshDb = reloadDatabase();
    
    // Process the input to extract owner names
    const ownersInput = githubUrl.trim();
    let ownerNames = [];
    let specificRepos = [];
    
    // Check if input contains commas or spaces (multiple owners)
    if (ownersInput.includes(',') || /\s/.test(ownersInput)) {
      // Split by commas and/or spaces
      const parts = ownersInput.split(/[\s,]+/).filter(name => name.length > 0);
      
      // Traiter chaque partie comme potentiellement un utilisateur ou une URL spécifique
      for (const part of parts) {
        if (part.includes('/') && !part.endsWith('/')) {
          // Semble être une URL de dépôt spécifique
          try {
            const urlObj = new URL(part.startsWith('http') ? part : `https://github.com/${part}`);
            const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
            
            if (pathParts.length >= 2) {
              specificRepos.push({
                owner: pathParts[0],
                repo: pathParts[1].replace('.git', '')
              });
            }
          } catch (error) {
            console.log(`Impossible de parser l'URL ${part}, traité comme nom d'utilisateur`);
            ownerNames.push(part);
          }
        } else {
          // Simple nom d'utilisateur ou org
          ownerNames.push(part.replace('@', '').replace('https://github.com/', '').replace('/', ''));
        }
      }
    } else {
      // Single input (URL or username)
      try {
        // Check if it's a URL
        if (ownersInput.includes('github.com') || ownersInput.includes('http')) {
          // Support both formats: 'https://github.com/username/' or '@https://github.com/username/'
          const cleanUrl = ownersInput.startsWith('@') ? ownersInput.substring(1) : ownersInput;
          const urlObj = new URL(cleanUrl);
          
          if (!urlObj.hostname.includes('github.com')) {
            return res.status(400).json({ error: 'Only GitHub URLs are supported for bulk import' });
          }
          
          const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
          if (pathParts.length === 0) {
            return res.status(400).json({ error: 'Invalid GitHub URL: no username or organization found' });
          }
          
          // Vérifier s'il s'agit d'une URL spécifique de dépôt
          if (pathParts.length >= 2 && !urlObj.pathname.endsWith('/')) {
            // C'est une URL spécifique de dépôt (ex: github.com/user/repo)
            specificRepos.push({
              owner: pathParts[0],
              repo: pathParts[1].replace('.git', '')
            });
          } else {
            // C'est un utilisateur ou une organisation
            ownerNames.push(pathParts[0]);
          }
        } else {
          // It's a simple username
          ownerNames.push(ownersInput.replace('@', ''));
        }
      } catch (error) {
        // If URL parsing fails, treat as a username
        ownerNames.push(ownersInput.replace('@', ''));
      }
    }
    
    // Validate that we have at least one owner or specific repo
    if (ownerNames.length === 0 && specificRepos.length === 0) {
      return res.status(400).json({ 
        error: 'No valid GitHub usernames, organizations or repositories found',
        details: 'Please provide a valid GitHub username, organization or repository URL'
      });
    }
    
    console.log(`[BULK IMPORT DEBUG] Processing ${ownerNames.length} GitHub users/orgs and ${specificRepos.length} specific repositories`);
    
    // Generate a unique bulk import ID
    const bulkImportId = 'bulk_' + Date.now().toString();
    
    // Create a status object for this bulk import
    const initialStatus = {
      progress: 0,
      status: 'initializing',
      step: 0,
      error: null,
      timeStarted: new Date().toISOString(),
      owners: ownerNames,
      specificRepos: specificRepos,
      repositories: [],
      completedRepos: 0,
      totalRepos: 0,
      failedRepos: 0,
      projectCreationMode: mode,
      projectNameTemplate: projectNameTemplate || `GitHub Import ${new Date().toLocaleDateString()}`,
      createdProjects: [],
      requiresConfirmation: false,
      directImport: true // Nouvelle option pour forcer l'importation directe
    };
    
    cloneStatuses.set(bulkImportId, initialStatus);
    
    // Check if GitHub API token is available
    if (!process.env.GITHUB_TOKEN || !octokit) {
      console.error('[BULK IMPORT DEBUG] No GitHub API token available. Import failed.');
      updateCloneStatus(bulkImportId, {
        status: 'failed',
        error: 'GitHub API token is required for bulk import. Please add it in the settings.'
      });
      return res.status(400).json({ 
        error: 'GitHub API token is required for bulk import',
        details: 'Please add a GitHub token in the settings page'
      });
    }
    
    // Répondre immédiatement au client avec l'ID d'import en masse
    res.status(202).json({ 
      bulkImportId, 
      message: `Starting bulk import for ${ownerNames.length > 0 ? `${ownerNames.length} GitHub users/orgs` : ''} ${specificRepos.length > 0 ? `and ${specificRepos.length} specific repositories` : ''}`
    });
    
    // Démarrer immédiatement le processus de récupération des dépôts
    try {
      console.log(`[BULK IMPORT DEBUG] Démarrage immédiat de la récupération des dépôts`);
      
      // Liste complète des dépôts à importer
      let allRepositories = [];
      
      // Récupérer d'abord les dépôts spécifiques
      for (const specificRepo of specificRepos) {
        try {
          const response = await octokit.rest.repos.get({
            owner: specificRepo.owner,
            repo: specificRepo.repo
          });
          
          if (response.data) {
            // Ajouter des informations sur le propriétaire
            allRepositories.push({
              ...response.data,
              ownerName: specificRepo.owner
            });
          }
        } catch (error) {
          console.error(`[BULK IMPORT DEBUG] Error fetching specific repo ${specificRepo.owner}/${specificRepo.repo}:`, error.message);
        }
      }
      
      // Récupérer ensuite les dépôts pour chaque utilisateur/organisation
      for (const ownerName of ownerNames) {
        try {
          // Vérifier si c'est une organisation ou un utilisateur
          let isOrg = false;
          try {
            await octokit.rest.orgs.get({ org: ownerName });
            isOrg = true;
            console.log(`[BULK IMPORT DEBUG] ${ownerName} est une organisation`);
          } catch (error) {
            // Vérifier que l'utilisateur existe
            try {
              await octokit.rest.users.getByUsername({ username: ownerName });
              console.log(`[BULK IMPORT DEBUG] ${ownerName} est un utilisateur`);
            } catch (userError) {
              console.error(`[BULK IMPORT DEBUG] User/org ${ownerName} does not exist:`, userError.message);
              continue; // Passer au propriétaire suivant
            }
          }
          
          // Récupérer la liste des dépôts
          let response;
          if (isOrg) {
            response = await octokit.rest.repos.listForOrg({
              org: ownerName,
              per_page: 100,
              page: 1
            });
          } else {
            response = await octokit.rest.repos.listForUser({
              username: ownerName,
              per_page: 100,
              page: 1
            });
          }
          
          // Ajouter les dépôts avec info de propriétaire
          if (response.data && response.data.length > 0) {
            console.log(`[BULK IMPORT DEBUG] ${response.data.length} dépôts trouvés pour ${ownerName}`);
            const ownerRepos = response.data.map(repo => ({
              ...repo,
              ownerName: ownerName
            }));
            allRepositories = [...allRepositories, ...ownerRepos];
          }
        } catch (error) {
          console.error(`[BULK IMPORT DEBUG] Error fetching repositories for ${ownerName}:`, error.message);
        }
      }
      
      // Préparer les dépôts pour l'importation
      const repositoriesForImport = allRepositories.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        url: repo.clone_url,
        description: repo.description || '',
        owner: repo.ownerName
      }));
      
      console.log(`[BULK IMPORT DEBUG] ${repositoriesForImport.length} dépôts à importer au total`);
      
      // Mise à jour du statut avec les dépôts à importer
      updateCloneStatus(bulkImportId, {
        status: 'processing', // Toujours mettre directement en processing
        message: `Préparation des ${repositoriesForImport.length} dépôts pour importation`,
        progress: 10,
        repositories: repositoriesForImport,
        requiresConfirmation: false,
        totalRepos: repositoriesForImport.length
      });
      
      // Démarrer directement le processus d'importation
      processBulkImport(bulkImportId).catch(error => {
        console.error(`[BULK IMPORT DEBUG] Error processing bulk import ${bulkImportId}:`, error);
        updateCloneStatus(bulkImportId, {
          status: 'failed',
          error: `Failed to process bulk import: ${error.message}`
        });
      });
      
    } catch (processError) {
      console.error('[BULK IMPORT DEBUG] Error in background process:', processError);
      updateCloneStatus(bulkImportId, {
        status: 'failed',
        error: `Failed to process repositories: ${processError.message}`
      });
    }
  } catch (error) {
    console.error('[BULK IMPORT DEBUG] Error starting bulk import:', error);
    res.status(500).json({ error: 'Failed to start bulk import', details: error.message });
  }
});

// Endpoint to get bulk import status
router.get('/bulk-import-status/:bulkImportId', async (req, res) => {
  try {
    const bulkImportId = req.params.bulkImportId;
    const status = cloneStatuses.get(bulkImportId) || {
      progress: 0,
      status: 'not_found',
      error: 'Bulk import not found or expired'
    };
    
    console.log(`[BULK IMPORT DEBUG] Status request for ${bulkImportId}: ${status.status}, progress: ${status.progress}`);
    
    // Ne pas démarrer de processus, car il est déjà démarré dans la route bulk-import
    // Simplement renvoyer le statut actuel
    res.json(status);
    
  } catch (error) {
    console.error('[BULK IMPORT DEBUG] Error fetching bulk import status:', error);
    res.status(500).json({ error: 'Failed to fetch bulk import status' });
  }
});

// Fonction pour traiter l'importation massive en arrière-plan
async function processBulkImport(bulkImportId) {
  // Récupérer le statut actuel
  const status = cloneStatuses.get(bulkImportId);
  if (!status) {
    throw new Error('Bulk import not found');
  }
  
  try {
    console.log(`[BULK IMPORT DEBUG] Démarrage du traitement pour ${bulkImportId} avec ${status.repositories.length} dépôts`);
    
    // Créer les répertoires nécessaires
    const reposDir = path.join(__dirname, '../../repos');
    const logsDir = path.join(__dirname, '../../logs');
    
    if (!fs.existsSync(reposDir)) {
      fs.mkdirSync(reposDir, { recursive: true });
    }
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Recharger la base de données
    const freshDb = reloadDatabase();
    
    // Initialiser le suivi de progression
    updateCloneStatus(bulkImportId, {
      status: 'processing',
      message: 'Démarrage de l\'importation des dépôts...',
      progress: 15,
      totalRepos: status.repositories.length,
      completedRepos: 0,
      failedRepos: 0,
      repositories: status.repositories.map(repo => ({
        ...repo,
        status: 'pending'
      }))
    });
    
    console.log(`[BULK IMPORT DEBUG] Début du traitement des ${status.repositories.length} dépôts un par un`);
    
    // Traiter les dépôts un par un
    for (let i = 0; i < status.repositories.length; i++) {
      const repo = status.repositories[i];
      const progress = 15 + (i / status.repositories.length) * 85; // 15% à 100%
      
      try {
        console.log(`[BULK IMPORT DEBUG] Traitement du dépôt ${i+1}/${status.repositories.length}: ${repo.fullName}`);
        
        // Mise à jour du statut pour ce dépôt
        updateCloneStatus(bulkImportId, {
          progress,
          message: `Clonage du dépôt ${i+1}/${status.repositories.length}: ${repo.name}`,
          repositories: cloneStatuses.get(bulkImportId).repositories.map((r, idx) => 
            idx === i ? { ...r, status: 'cloning' } : r
          )
        });
        
        // Vérifier si dépôt déjà existant
        const existingRepo = freshDb.get('repositories')
          .find({ url: repo.url })
          .value();
          
        if (existingRepo) {
          console.log(`[BULK IMPORT DEBUG] Le dépôt existe déjà: ${repo.fullName}`);
          
          // Mettre à jour le statut
          const updatedStatus = cloneStatuses.get(bulkImportId);
          const updatedRepos = updatedStatus.repositories.map((r, idx) => 
            idx === i ? { ...r, status: 'skipped', message: 'Dépôt déjà existant' } : r
          );
          
          updateCloneStatus(bulkImportId, {
            repositories: updatedRepos,
            completedRepos: updatedStatus.completedRepos + 1
          });
          
          continue;
        }
        
        // Préparer le clone
        const folderName = `${repo.owner}_${repo.name}`;
        const repoPath = path.join(reposDir, folderName);
        
        // Générer un ID unique pour ce dépôt
        const id = Date.now().toString() + Math.floor(Math.random() * 1000);
        const logFilePath = path.join(logsDir, `${id}.log`);
        
        // Cloner le dépôt
        let cloneUrl = repo.url;
        
        // Utiliser le token GitHub si disponible
        if (process.env.GITHUB_TOKEN) {
          cloneUrl = repo.url.replace('https://', `https://${process.env.GITHUB_TOKEN}@`);
        }
        
        console.log(`[BULK IMPORT DEBUG] Clonage du dépôt: ${repo.fullName}`);
        
        // Cloner avec simple-git
        try {
          const git = simpleGit();
          await git.clone(cloneUrl, repoPath);
          console.log(`[BULK IMPORT DEBUG] Dépôt ${repo.fullName} cloné avec succès`);
        } catch (cloneError) {
          console.error(`[BULK IMPORT DEBUG] Erreur lors du clonage de ${repo.fullName}:`, cloneError.message);
          throw new Error(`Erreur de clonage: ${cloneError.message}`);
        }
        
        // Générer le log Gource
        let logGenerationSuccess = false;
        try {
          console.log(`[BULK IMPORT DEBUG] Génération du log Gource pour ${repo.fullName}`);
          execSync(
            `gource --output-custom-log "${logFilePath}" "${repoPath}"`,
            { stdio: 'ignore', maxBuffer: 100 * 1024 * 1024 }
          );
          
          logGenerationSuccess = true;
          console.log(`[BULK IMPORT DEBUG] Log Gource généré pour ${repo.fullName}`);
        } catch (logError) {
          console.error(`[BULK IMPORT DEBUG] Échec de génération du log Gource pour ${repo.fullName}:`, logError.message);
          // Continuer même si la génération du log échoue
        }
        
        // Ajouter le dépôt à la base de données
        console.log(`[BULK IMPORT DEBUG] Ajout du dépôt ${repo.fullName} à la base de données`);
        const newRepo = {
          id,
          url: repo.url,
          name: folderName,
          owner: repo.owner,
          description: repo.description || '',
          path: repoPath,
          logPath: logFilePath,
          dateAdded: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        freshDb.get('repositories')
          .push(newRepo)
          .write();
          
        // Mise à jour du statut global
        const currentStatus = cloneStatuses.get(bulkImportId);
        const updatedRepos = currentStatus.repositories.map((r, idx) => 
          idx === i ? { 
            ...r, 
            status: 'completed', 
            message: logGenerationSuccess ? 'Dépôt importé avec succès' : 'Importé mais génération du log échouée'
          } : r
        );
        
        updateCloneStatus(bulkImportId, {
          repositories: updatedRepos,
          completedRepos: currentStatus.completedRepos + 1
        });
        
        console.log(`[BULK IMPORT DEBUG] Dépôt ${repo.fullName} traité avec succès (${i+1}/${status.repositories.length})`);
        
      } catch (repoError) {
        console.error(`[BULK IMPORT DEBUG] Erreur lors du traitement du dépôt ${repo.fullName}:`, repoError.message);
        
        // Mise à jour du statut pour ce dépôt en échec
        const currentStatus = cloneStatuses.get(bulkImportId);
        const updatedRepos = currentStatus.repositories.map((r, idx) => 
          idx === i ? { ...r, status: 'failed', message: repoError.message } : r
        );
        
        updateCloneStatus(bulkImportId, {
          repositories: updatedRepos,
          completedRepos: currentStatus.completedRepos + 1,
          failedRepos: currentStatus.failedRepos + 1
        });
      }
    }
    
    // Création de projets si demandé
    const currentStatus = cloneStatuses.get(bulkImportId);
    
    if (currentStatus.projectCreationMode !== 'none') {
      console.log(`[BULK IMPORT DEBUG] Création de projets en mode: ${currentStatus.projectCreationMode}`);
      
      try {
        updateCloneStatus(bulkImportId, {
          message: 'Création des projets...',
          progress: 95
        });
        
        // Créer les projets selon le mode
        if (currentStatus.projectCreationMode === 'single') {
          // Un seul projet pour tous les dépôts
          const projectName = currentStatus.projectNameTemplate.replace('{owner}', 'GitHub Import');
          
          // Récupérer les IDs des dépôts importés avec succès
          const importedRepoIds = [];
          
          for (const repo of currentStatus.repositories.filter(r => r.status === 'completed')) {
            const dbRepo = freshDb.get('repositories')
              .find({ url: repo.url })
              .value();
              
            if (dbRepo) {
              importedRepoIds.push(dbRepo.id);
            }
          }
          
          if (importedRepoIds.length > 0) {
            // Créer le projet
            const newProject = {
              id: Date.now().toString(),
              name: projectName,
              description: `Import en masse depuis ${currentStatus.owners.join(', ')}`,
              repositories: importedRepoIds,
              dateCreated: new Date().toISOString(),
              lastModified: new Date().toISOString()
            };
            
            freshDb.get('projects')
              .push(newProject)
              .write();
              
            // Mettre à jour le statut
            const updatedStatus = cloneStatuses.get(bulkImportId);
            updatedStatus.createdProjects = [
              ...updatedStatus.createdProjects || [],
              {
                id: newProject.id,
                name: newProject.name,
                repoCount: importedRepoIds.length
              }
            ];
            cloneStatuses.set(bulkImportId, updatedStatus);
            
            console.log(`[BULK IMPORT DEBUG] Projet unique "${projectName}" créé avec ${importedRepoIds.length} dépôts`);
          }
        } else if (currentStatus.projectCreationMode === 'per_owner') {
          // Un projet par propriétaire
          const ownerProjects = {};
          
          // Grouper les dépôts par propriétaire
          for (const repo of currentStatus.repositories.filter(r => r.status === 'completed')) {
            const dbRepo = freshDb.get('repositories')
              .find({ url: repo.url })
              .value();
              
            if (dbRepo) {
              if (!ownerProjects[repo.owner]) {
                ownerProjects[repo.owner] = [];
              }
              ownerProjects[repo.owner].push(dbRepo.id);
            }
          }
          
          // Créer un projet pour chaque propriétaire
          const createdProjects = [];
          for (const owner in ownerProjects) {
            if (ownerProjects[owner].length > 0) {
              const projectName = currentStatus.projectNameTemplate.replace('{owner}', owner);
              
              const newProject = {
                id: Date.now().toString() + Math.floor(Math.random() * 1000),
                name: projectName,
                description: `Import en masse depuis ${owner}`,
                repositories: ownerProjects[owner],
                dateCreated: new Date().toISOString(),
                lastModified: new Date().toISOString()
              };
              
              freshDb.get('projects')
                .push(newProject)
                .write();
                
              createdProjects.push({
                id: newProject.id,
                name: newProject.name,
                repoCount: ownerProjects[owner].length
              });
              
              console.log(`[BULK IMPORT DEBUG] Projet "${projectName}" créé pour le propriétaire "${owner}" avec ${ownerProjects[owner].length} dépôts`);
            }
          }
          
          // Mettre à jour le statut
          const updatedStatus = cloneStatuses.get(bulkImportId);
          updatedStatus.createdProjects = [
            ...updatedStatus.createdProjects || [],
            ...createdProjects
          ];
          cloneStatuses.set(bulkImportId, updatedStatus);
        }
      } catch (projectError) {
        console.error(`[BULK IMPORT DEBUG] Erreur lors de la création des projets:`, projectError.message);
      }
    }
    
    // Mise à jour du statut final
    updateCloneStatus(bulkImportId, {
      status: 'completed',
      message: `Import en masse terminé. Importé ${currentStatus.completedRepos - currentStatus.failedRepos}/${currentStatus.totalRepos} dépôts.`,
      progress: 100
    });
    
    console.log(`[BULK IMPORT DEBUG] Import en masse ${bulkImportId} terminé avec succès`);
    
  } catch (error) {
    console.error(`[BULK IMPORT DEBUG] Erreur lors du traitement de l'import en masse ${bulkImportId}:`, error);
    updateCloneStatus(bulkImportId, {
      status: 'failed',
      error: `Échec de l'import en masse: ${error.message}`
    });
  }
}

// Endpoint to confirm bulk import after validation
router.post('/bulk-import/confirm', (req, res) => {
  try {
    const { bulkImportId, selectedRepos } = req.body;
    
    if (!bulkImportId) {
      return res.status(400).json({ error: 'Bulk import ID is required' });
    }
    
    // Get the status of the bulk import
    const status = cloneStatuses.get(bulkImportId);
    if (!status) {
      return res.status(404).json({ error: 'Bulk import not found or expired' });
    }
    
    // Verify that the bulk import requires confirmation
    if (status.status !== 'confirmation_required') {
      return res.status(400).json({ 
        error: 'This bulk import does not require confirmation or has already been confirmed',
        status: status.status
      });
    }
    
    // If selectedRepos is provided, filter repositories
    let repositories = status.repositories;
    if (selectedRepos && Array.isArray(selectedRepos) && selectedRepos.length > 0) {
      repositories = repositories.filter(repo => 
        selectedRepos.some(selected => 
          selected.name === repo.name && selected.owner === repo.owner
        )
      );
      
      console.log(`[BULK IMPORT] Filtered repositories for import: ${repositories.length} out of ${status.repositories.length}`);
    }
    
    // Check if we have repositories to import
    if (repositories.length === 0) {
      return res.status(400).json({ error: 'No repositories selected for import' });
    }
    
    // Create a new bulk import with the same ID but confirmed status
    updateCloneStatus(bulkImportId, {
      status: 'confirmed',
      message: `Confirmation received. Proceeding with import of ${repositories.length} repositories.`,
      repositories: repositories,
      requiresConfirmation: false,
      totalRepos: repositories.length
    });
    
    // Return the confirmed status
    res.status(200).json({
      bulkImportId,
      message: `Bulk import confirmed. Starting import of ${repositories.length} repositories.`,
      totalRepos: repositories.length
    });
    
    // Continue with the bulk import process in background
    // La suite du processus sera gérée par la route GET /bulk-import-status/:bulkImportId
    
  } catch (error) {
    console.error('Error confirming bulk import:', error);
    res.status(500).json({ error: 'Failed to confirm bulk import', details: error.message });
  }
});

module.exports = router; 