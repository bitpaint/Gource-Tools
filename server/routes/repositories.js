const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const simpleGit = require('simple-git');
const { Octokit } = require('octokit');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync(path.join(__dirname, '../../db/db.json'));
const db = low(adapter);

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

// Stockage des statuts de clonage en cours
const cloneStatuses = new Map();

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
          folderName = repoName;
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
              folderName = repoDetails.data.name;
              description = repoDetails.data.description || '';
              
              updateCloneStatus(cloneId, {
                progress: 9,
                message: `Found repository: ${folderName} (${description})`
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
          message: `Preparing to clone ${folderName}...`
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
    const repo = db.get('repositories')
      .find({ id: req.params.id })
      .value();

    if (!repo) {
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

    // Pull latest changes
    try {
      const git = simpleGit(repo.path);
      await git.pull();
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
        statusMessage: logGenerationMessage
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
      logMessage: logGenerationMessage
    });
  } catch (error) {
    console.error('Error updating repository:', error);
    res.status(500).json({ error: 'Failed to update repository', details: error.message });
  }
});

// Delete a repository
router.delete('/:id', (req, res) => {
  try {
    const repo = db.get('repositories')
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
    db.get('repositories')
      .remove({ id: req.params.id })
      .write();

    // Also remove from any projects
    db.get('projects')
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
    const { githubUrl } = req.body;
    
    // Validate input
    if (!githubUrl) {
      return res.status(400).json({ error: 'GitHub URL is required' });
    }
    
    // Reload database
    const freshDb = reloadDatabase();
    
    // Parse the GitHub URL
    let ownerName = '';
    try {
      // Support both formats: 'https://github.com/bitcoin/' or '@https://github.com/bitcoin/'
      const cleanUrl = githubUrl.startsWith('@') ? githubUrl.substring(1) : githubUrl;
      const urlObj = new URL(cleanUrl);
      
      if (!urlObj.hostname.includes('github.com')) {
        return res.status(400).json({ error: 'Only GitHub URLs are supported for bulk import' });
      }
      
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
      if (pathParts.length === 0) {
        return res.status(400).json({ error: 'Invalid GitHub URL: no username or organization found' });
      }
      
      ownerName = pathParts[0];
    } catch (error) {
      console.error('Error parsing GitHub URL:', error);
      return res.status(400).json({ error: 'Invalid GitHub URL', details: error.message });
    }
    
    // Generate a unique bulk import ID
    const bulkImportId = 'bulk_' + Date.now().toString();
    
    // Create a status object for this bulk import
    const initialStatus = {
      progress: 0,
      status: 'initializing',
      step: 0,
      error: null,
      timeStarted: new Date().toISOString(),
      owner: ownerName,
      repositories: [],
      completedRepos: 0,
      totalRepos: 0,
      failedRepos: 0
    };
    
    cloneStatuses.set(bulkImportId, initialStatus);
    
    // Respond immediately to the client with bulk import ID
    res.status(202).json({ 
      bulkImportId, 
      message: `Starting bulk import for GitHub ${ownerName}`
    });
    
    // Continue the bulk import process in background
    (async () => {
      try {
        console.log(`[BULK IMPORT] Starting bulk import for GitHub user/org: ${ownerName}`);
        
        // Use updateCloneStatus function to update status
        updateCloneStatus(bulkImportId, {
          status: 'fetching_repos',
          message: `Fetching repositories for ${ownerName}...`,
          progress: 5
        });
        
        // Check if GitHub API token is available
        if (!process.env.GITHUB_TOKEN || !octokit) {
          console.error('[BULK IMPORT] No GitHub API token available. Import failed.');
          updateCloneStatus(bulkImportId, {
            status: 'failed',
            error: 'GitHub API token is required for bulk import. Please add it in the settings.'
          });
          return;
        }
        
        // Fetch repositories from GitHub API
        let repositories = [];
        try {
          // Check if it's an organization or a user
          let isOrg = false;
          try {
            await octokit.rest.orgs.get({ org: ownerName });
            isOrg = true;
            console.log(`[BULK IMPORT] Detected ${ownerName} as an organization`);
          } catch (error) {
            // Not an organization, must be a user
            isOrg = false;
            console.log(`[BULK IMPORT] Detected ${ownerName} as a user`);
          }
          
          // Fetch all repositories (paginated)
          let page = 1;
          let hasMorePages = true;
          
          while (hasMorePages) {
            console.log(`[BULK IMPORT] Fetching repositories page ${page}`);
            let response;
            if (isOrg) {
              response = await octokit.rest.repos.listForOrg({
                org: ownerName,
                per_page: 100,
                page: page
              });
            } else {
              response = await octokit.rest.repos.listForUser({
                username: ownerName,
                per_page: 100,
                page: page
              });
            }
            
            repositories = [...repositories, ...response.data];
            console.log(`[BULK IMPORT] Found ${response.data.length} repositories on page ${page}`);
            
            if (response.data.length < 100) {
              hasMorePages = false;
            } else {
              page++;
            }
          }
        } catch (error) {
          console.error('[BULK IMPORT] Error fetching repositories from GitHub API:', error);
          updateCloneStatus(bulkImportId, {
            status: 'failed',
            error: `Failed to fetch repositories: ${error.message}`
          });
          return;
        }
        
        if (repositories.length === 0) {
          console.log(`[BULK IMPORT] No repositories found for ${ownerName}`);
          updateCloneStatus(bulkImportId, {
            status: 'completed',
            message: `No repositories found for ${ownerName}`,
            progress: 100
          });
          return;
        }
        
        // Filter out forks if needed - uncomment to enable
        // repositories = repositories.filter(repo => !repo.fork);
        
        console.log(`[BULK IMPORT] Total repositories found: ${repositories.length}`);
        
        // Update status with found repositories
        updateCloneStatus(bulkImportId, {
          status: 'preparing',
          message: `Found ${repositories.length} repositories for ${ownerName}`,
          progress: 10,
          repositories: repositories.map(repo => ({
            name: repo.name,
            url: repo.clone_url,
            status: 'pending',
            description: repo.description || '',
            stars: repo.stargazers_count,
            forks: repo.forks_count
          })),
          totalRepos: repositories.length
        });
        
        // Create necessary directories
        const reposDir = path.join(__dirname, '../../repos');
        if (!fs.existsSync(reposDir)) {
          fs.mkdirSync(reposDir, { recursive: true });
        }

        const logsDir = path.join(__dirname, '../../logs');
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }
        
        // Process repositories in parallel with a concurrency limit
        const MAX_CONCURRENT_CLONES = 3; // Adjust based on your server capacity
        console.log(`[BULK IMPORT] Starting parallel cloning with max ${MAX_CONCURRENT_CLONES} concurrent operations`);
        
        // Helper function to process a repository
        const processRepository = async (repo, index) => {
          const repoName = repo.name;
          const repoUrl = repo.clone_url;
          const repoDescription = repo.description || '';
          
          console.log(`[BULK IMPORT] Processing repository ${index + 1}/${repositories.length}: ${repoName}`);
          
          // Skip repositories that already exist in the database
          const existingRepo = freshDb.get('repositories')
            .find({ url: repoUrl })
            .value();
            
          if (existingRepo) {
            console.log(`[BULK IMPORT] Repository ${repoName} already exists in database, skipping`);
            // Update status for this repo
            const currentStatus = cloneStatuses.get(bulkImportId);
            const updatedRepos = currentStatus.repositories.map(r => 
              r.name === repoName ? { ...r, status: 'skipped', message: 'Repository already exists' } : r
            );
            
            updateCloneStatus(bulkImportId, {
              repositories: updatedRepos,
              completedRepos: currentStatus.completedRepos + 1,
              progress: Math.min(10 + Math.floor((currentStatus.completedRepos + 1) / repositories.length * 90), 99)
            });
            
            return {
              success: false,
              skipped: true,
              message: 'Repository already exists'
            };
          }
          
          // Update status to show which repository is being processed
          const currentStatus = cloneStatuses.get(bulkImportId);
          const updatedRepos = currentStatus.repositories.map(r => 
            r.name === repoName ? { ...r, status: 'cloning', message: 'Cloning repository...' } : r
          );
          
          updateCloneStatus(bulkImportId, {
            repositories: updatedRepos,
            message: `Cloning repository ${index + 1}/${repositories.length}: ${repoName}`
          });
          
          try {
            // Clone the repository
            const repoPath = path.join(reposDir, repoName);
            
            // Skip if the folder already exists
            if (fs.existsSync(repoPath)) {
              console.log(`[BULK IMPORT] Repository folder for ${repoName} already exists, skipping clone`);
              const currentStatus = cloneStatuses.get(bulkImportId);
              const updatedRepos = currentStatus.repositories.map(r => 
                r.name === repoName ? { ...r, status: 'skipped', message: 'Repository folder already exists' } : r
              );
              
              updateCloneStatus(bulkImportId, {
                repositories: updatedRepos,
                completedRepos: currentStatus.completedRepos + 1
              });
              
              return {
                success: false,
                skipped: true,
                message: 'Repository folder already exists'
              };
            }
            
            // Prepare the clone URL with token if needed
            let cloneUrl = repoUrl;
            if (process.env.GITHUB_TOKEN) {
              cloneUrl = repoUrl.replace('https://', `https://${process.env.GITHUB_TOKEN}@`);
            }
            
            // Clone the repository
            console.log(`[BULK IMPORT] Cloning ${repoName} from ${repoUrl.replace(
              process.env.GITHUB_TOKEN || '', '[TOKEN]'
            )}`);
            
            await simpleGit().clone(cloneUrl, repoPath);
            console.log(`[BULK IMPORT] Clone of ${repoName} completed successfully`);
            
            // Generate Gource log
            const id = Date.now().toString() + Math.floor(Math.random() * 1000);
            const logFilePath = path.join(logsDir, `${id}.log`);
            
            console.log(`[BULK IMPORT] Generating Gource log for ${repoName}`);
            let gourceLog = '';
            try {
              gourceLog = execSync(
                `gource --output-custom-log - "${repoPath}"`,
                { 
                  encoding: 'utf-8',
                  maxBuffer: 200 * 1024 * 1024 // 200MB buffer (increased for large repos)
                }
              );
              console.log(`[BULK IMPORT] Successfully generated Gource log for ${repoName}`);
            } catch (execError) {
              console.error(`[BULK IMPORT] Error generating Gource log for ${repoName}, trying alternate method:`, execError.message);
              
              // Alternative method with temporary log file
              const tempLogFile = path.join(logsDir, `${id}_temp.log`);
              execSync(
                `gource --output-custom-log "${tempLogFile}" "${repoPath}"`,
                { 
                  stdio: 'ignore',
                  maxBuffer: 200 * 1024 * 1024
                }
              );
              
              if (fs.existsSync(tempLogFile)) {
                gourceLog = fs.readFileSync(tempLogFile, 'utf-8');
                fs.unlinkSync(tempLogFile);
                console.log(`[BULK IMPORT] Successfully generated Gource log with alternative method for ${repoName}`);
              } else {
                console.error(`[BULK IMPORT] Failed to generate Gource log with alternative method for ${repoName}`);
              }
            }
            
            if (gourceLog) {
              fs.writeFileSync(logFilePath, gourceLog);
              console.log(`[BULK IMPORT] Saved Gource log for ${repoName} to ${logFilePath}`);
            } else {
              console.warn(`[BULK IMPORT] No Gource log content generated for ${repoName}`);
            }
            
            // Add the repository to the database
            const newRepo = {
              id,
              url: repoUrl,
              name: repoName,
              owner: ownerName,
              description: repoDescription,
              path: repoPath,
              logPath: logFilePath,
              dateAdded: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            };
            
            freshDb.get('repositories')
              .push(newRepo)
              .write();
              
            console.log(`[BULK IMPORT] Added ${repoName} to database`);
              
            // Update status for this repository
            const updatedStatus = cloneStatuses.get(bulkImportId);
            const newUpdatedRepos = updatedStatus.repositories.map(r => 
              r.name === repoName ? { ...r, status: 'completed', message: 'Repository imported successfully' } : r
            );
            
            updateCloneStatus(bulkImportId, {
              repositories: newUpdatedRepos,
              completedRepos: updatedStatus.completedRepos + 1
            });
            
            return {
              success: true,
              id
            };
          } catch (error) {
            console.error(`[BULK IMPORT] Error cloning repository ${repoName}:`, error);
            
            // Update status to show the error
            const failedStatus = cloneStatuses.get(bulkImportId);
            const failedRepos = failedStatus.repositories.map(r => 
              r.name === repoName ? { 
                ...r, 
                status: 'failed', 
                message: `Failed to import: ${error.message}` 
              } : r
            );
            
            updateCloneStatus(bulkImportId, {
              repositories: failedRepos,
              failedRepos: failedStatus.failedRepos + 1,
              completedRepos: failedStatus.completedRepos + 1
            });
            
            return {
              success: false,
              error: error.message
            };
          }
        };
        
        // Process repositories in parallel with limited concurrency
        let completed = 0;
        const chunks = [];
        
        // Divide repositories into chunks for parallel processing
        for (let i = 0; i < repositories.length; i += MAX_CONCURRENT_CLONES) {
          chunks.push(repositories.slice(i, i + MAX_CONCURRENT_CLONES));
        }
        
        // Process each chunk in sequence, but repositories within a chunk in parallel
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          console.log(`[BULK IMPORT] Processing chunk ${i + 1}/${chunks.length} (${chunk.length} repositories)`);
          
          // Process repositories in this chunk in parallel
          const promises = chunk.map((repo, chunkIndex) => 
            processRepository(repo, (i * MAX_CONCURRENT_CLONES) + chunkIndex)
          );
          
          // Wait for all repositories in this chunk to complete
          const results = await Promise.all(promises);
          completed += results.length;
          
          console.log(`[BULK IMPORT] Completed ${completed}/${repositories.length} repositories`);
          
          // Update overall progress
          const currentStatus = cloneStatuses.get(bulkImportId);
          updateCloneStatus(bulkImportId, {
            progress: 10 + Math.floor(completed / repositories.length * 90)
          });
        }
        
        // All repositories processed
        console.log(`[BULK IMPORT] All ${repositories.length} repositories processed`);
        const finalStatus = cloneStatuses.get(bulkImportId);
        updateCloneStatus(bulkImportId, {
          status: 'completed',
          message: `Bulk import completed. Imported ${finalStatus.completedRepos - finalStatus.failedRepos}/${finalStatus.totalRepos} repositories.`,
          progress: 100
        });
        
        // Clean up status after 10 minutes
        setTimeout(() => {
          cloneStatuses.delete(bulkImportId);
          console.log(`[BULK IMPORT] Cleaned up status for bulk import ${bulkImportId}`);
        }, 10 * 60 * 1000);
        
      } catch (error) {
        console.error('[BULK IMPORT] Error in bulk import process:', error);
        
        const errorStatus = cloneStatuses.get(bulkImportId);
        updateCloneStatus(bulkImportId, {
          status: 'failed',
          error: `Bulk import failed: ${error.message}`
        });
      }
    })();
  } catch (error) {
    console.error('Error starting bulk import:', error);
    res.status(500).json({ error: 'Failed to start bulk import', details: error.message });
  }
});

// Endpoint to get bulk import status
router.get('/bulk-import-status/:bulkImportId', (req, res) => {
  try {
    const bulkImportId = req.params.bulkImportId;
    const status = cloneStatuses.get(bulkImportId) || {
      progress: 0,
      status: 'not_found',
      error: 'Bulk import not found or expired'
    };
    
    res.json(status);
  } catch (error) {
    console.error('Error fetching bulk import status:', error);
    res.status(500).json({ error: 'Failed to fetch bulk import status' });
  }
});

module.exports = router; 