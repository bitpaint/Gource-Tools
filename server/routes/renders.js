const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { defaultGourceConfig, defaultSettings } = require('../config/defaultGourceConfig');

const adapter = new FileSync(path.join(__dirname, '../../db/db.json'));
const db = low(adapter);

// Fonction pour recharger la base de données
function reloadDatabase() {
  // Recharger explicitement la base de données pour avoir les données les plus récentes
  const refreshedAdapter = new FileSync(path.join(__dirname, '../../db/db.json'));
  return low(refreshedAdapter);
}

// Initialize renders array if it doesn't exist
if (!db.has('renders').value()) {
  db.set('renders', []).write();
}

// Get all renders (history)
router.get('/', (req, res) => {
  const freshDb = reloadDatabase();
  const renders = freshDb.has('renders').value() 
    ? freshDb.get('renders').value() 
    : [];
  
  res.json(renders);
});

// Get a single render status
router.get('/:id', (req, res) => {
  const freshDb = reloadDatabase();
  
  if (!freshDb.has('renders').value()) {
    return res.status(404).json({ error: 'Render not found' });
  }

  const render = freshDb.get('renders')
    .find({ id: req.params.id })
    .value();

  if (!render) {
    return res.status(404).json({ error: 'Render not found' });
  }

  res.json(render);
});

// Start a new render
router.post('/start', async (req, res) => {
  try {
    const { projectId, customName } = req.body;

    // Validate input
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Recharger la base de données pour avoir les données les plus récentes
    const freshDb = reloadDatabase();

    // Get project from database
    const project = freshDb.get('projects')
      .find({ id: projectId })
      .value();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if project has repositories
    if (!project.repositories || project.repositories.length === 0) {
      return res.status(400).json({ error: 'Project has no repositories' });
    }

    // Get repositories from database
    const repositories = project.repositories.map(repoId => {
      return freshDb.get('repositories')
        .find({ id: repoId })
        .value();
    }).filter(repo => repo !== undefined);

    if (repositories.length === 0) {
      return res.status(400).json({ error: 'All repositories in project are invalid' });
    }

    // Get Gource config file
    let renderProfile = null;
    if (project.renderProfileId) {
      renderProfile = freshDb.get('renderProfiles')
        .find({ id: project.renderProfileId })
        .value();
    }

    // If no Gource config file, use the default one
    if (!renderProfile) {
      renderProfile = freshDb.get('renderProfiles')
        .find({ isDefault: true })
        .value();
      
      // If no default config file exists, use the default settings from our central config
      if (!renderProfile) {
        renderProfile = {
          settings: defaultSettings
        };
      }
    }

    // Generate render ID and filename
    const id = Date.now().toString();
    const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace('T', '_').slice(0, 19);
    const projectName = project.name.replace(/[\\/:*?"<>|]/g, '_');
    const fileName = customName
      ? `${customName.replace(/[\\/:*?"<>|]/g, '_')}_${timestamp}.mp4`
      : `${projectName}_${timestamp}.mp4`;

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Create temp directory for logs
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create combined log file
    const logFilePath = path.join(tempDir, `${id}.log`);
    const videoFilePath = path.join(exportsDir, fileName);

    // Initialize render record
    const render = {
      id,
      projectId,
      projectName: project.name,
      fileName,
      filePath: videoFilePath,
      status: 'preparing',
      progress: 0,
      startTime: new Date().toISOString(),
      endTime: null,
      error: null
    };

    // Add render to database
    freshDb.get('renders')
      .push(render)
      .write();

    // Send initial response
    res.status(202).json(render);

    try {
      // Process repositories and generate logs (async background task)
      await processRepositoriesAndGenerateLogs(repositories, logFilePath, render);

      // Start the render process
      await startRenderProcess(logFilePath, videoFilePath, renderProfile.settings, render);
    } catch (err) {
      console.error('Error in render process:', err);
      updateRenderStatus(render.id, 'failed', `Error in render process: ${err.message}`, 0);
    }
  } catch (error) {
    console.error('Error starting render:', error);
    res.status(500).json({ error: 'Failed to start render', details: error.message });
  }
});

// Helper function to process repositories and generate logs
async function processRepositoriesAndGenerateLogs(repositories, logFilePath, render) {
  try {
    // Update status to preparing
    updateRenderStatus(render.id, 'preparing', 'Preparing repository logs', 10);

    // Collecter d'abord toutes les données de log dans un tableau
    let combinedLogLines = [];
    let atLeastOneRepoSucceeded = false;
    let totalRepos = repositories.length;
    let processedRepos = 0;

    for (const repo of repositories) {
      try {
        // Vérifier si le chemin du dépôt existe
        if (!repo || !repo.path) {
          console.error(`Repository path is invalid: ${repo?.path || 'undefined'}`);
          processedRepos++;
          continue;
        }
        
        // Normaliser le chemin pour le système d'exploitation actuel
        const normalizedPath = repo.path.replace(/[\/\\]+/g, path.sep);
        
        if (!fs.existsSync(normalizedPath)) {
          console.error(`Repository path does not exist: ${normalizedPath}`);
          processedRepos++;
          continue;
        }

        // Mise à jour du statut avec progression plus précise
        const progress = 10 + Math.floor((processedRepos / totalRepos) * 20);
        updateRenderStatus(render.id, 'preparing', `Processing repository: ${repo.name} (${processedRepos + 1}/${totalRepos})`, progress);
        
        console.log(`Processing log for repository: ${repo.name}`);

        let gourceLogContent = '';
        
        // Si un log existe déjà pour ce dépôt, utiliser celui-là
        if (repo.logPath && fs.existsSync(repo.logPath)) {
          try {
            const stats = fs.statSync(repo.logPath);
            const logAge = Date.now() - stats.mtimeMs;
            const maxLogAge = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
            
            if (logAge < maxLogAge) {
              console.log(`Using existing log file for ${repo.name}, age: ${Math.round(logAge / (60 * 1000))} minutes`);
              gourceLogContent = fs.readFileSync(repo.logPath, 'utf-8');
            } else {
              console.log(`Log file for ${repo.name} is older than 24 hours, generating a new one`);
              throw new Error('Log file too old');
            }
          } catch (err) {
            // En cas d'erreur de lecture ou si le log est trop ancien, on génère un nouveau log
            console.log(`Generating new log for repository ${repo.name}...`);
          
            // Vérifier si c'est un dépôt git valide
            try {
              execSync('git rev-parse --is-inside-work-tree', { 
                cwd: normalizedPath, 
                stdio: 'ignore' 
              });
            } catch (gitError) {
              console.error(`Not a valid git repository: ${normalizedPath}`);
              processedRepos++;
              continue;
            }
          
            // Pour les gros dépôts, utiliser une approche par lots pour éviter les blocages
            try {
              // Mise à jour du statut avant de commencer la génération du log
              updateRenderStatus(
                render.id, 
                'preparing', 
                `Generating log for ${repo.name} - this may take a while for large repositories`, 
                progress
              );
              
              // Première tentative avec execSync et un buffer maximal
              gourceLogContent = execSync(
                `gource --output-custom-log - "${normalizedPath}"`,
                { 
                  encoding: 'utf-8',
                  maxBuffer: 200 * 1024 * 1024, // 200MB buffer (augmenté pour les gros repos)
                  windowsHide: true,
                  env: {
                    SDL_VIDEODRIVER: 'dummy',
                    DISPLAY: ''
                  },
                  timeout: 300000 // 5 minutes timeout pour les gros repos
                }
              );
              console.log(`Generated log for ${repo.name} using direct output, size: ${gourceLogContent.length} bytes`);
            } catch (execError) {
              console.error(`Error using execSync for repository ${repo.name}, trying alternate method:`, execError.message);
              
              // Méthode alternative avec mise à jour du statut
              updateRenderStatus(
                render.id, 
                'preparing', 
                `Using alternative method for ${repo.name} - large repository detected`, 
                progress
              );
              
              // Méthode alternative: générer d'abord un fichier log temporaire
              const tempLogFile = path.join(path.dirname(logFilePath), `${repo.name}_temp.log`);
              try {
                execSync(
                  `gource --output-custom-log "${tempLogFile}" "${normalizedPath}"`,
                  { 
                    stdio: 'ignore', // Ne pas capturer la sortie
                    maxBuffer: 200 * 1024 * 1024, // 200MB buffer
                    windowsHide: true,
                    env: {
                      SDL_VIDEODRIVER: 'dummy',
                      DISPLAY: ''
                    },
                    timeout: 600000 // 10 minutes timeout pour les très gros repos
                  }
                );
                
                // Lire le fichier log généré
                if (fs.existsSync(tempLogFile)) {
                  gourceLogContent = fs.readFileSync(tempLogFile, 'utf-8');
                  console.log(`Generated log for ${repo.name} using temp file, size: ${gourceLogContent.length} bytes`);
                  
                  // Mettre à jour le log dans le dépôt pour une utilisation future
                  if (repo.logPath) {
                    fs.writeFileSync(repo.logPath, gourceLogContent);
                    console.log(`Updated repository log file at ${repo.logPath}`);
                  }
                  
                  // Supprimer le fichier temporaire après utilisation
                  fs.unlinkSync(tempLogFile);
                } else {
                  throw new Error(`Failed to generate log file for repository ${repo.name}`);
                }
              } catch (tempLogError) {
                console.error(`Alternative method failed for ${repo.name}:`, tempLogError);
                processedRepos++;
                continue;
              }
            }
          }
        } else {
          // Pas de log existant, générer un nouveau
          console.log(`No existing log file for repository ${repo.name}, generating new one`);
          
          // Vérifier si c'est un dépôt git valide
          try {
            execSync('git rev-parse --is-inside-work-tree', { 
              cwd: normalizedPath, 
              stdio: 'ignore' 
            });
          } catch (gitError) {
            console.error(`Not a valid git repository: ${normalizedPath}`);
            processedRepos++;
            continue;
          }
          
          // Pour les gros dépôts, utiliser une approche par lots pour éviter les blocages
          try {
            // Mise à jour du statut avant de commencer la génération du log
            updateRenderStatus(
              render.id, 
              'preparing', 
              `Generating log for ${repo.name} - this may take a while for large repositories`, 
              progress
            );
            
            // Première tentative avec execSync et un buffer maximal
            gourceLogContent = execSync(
              `gource --output-custom-log - "${normalizedPath}"`,
              { 
                encoding: 'utf-8',
                maxBuffer: 200 * 1024 * 1024, // 200MB buffer (augmenté pour les gros repos)
                windowsHide: true,
                env: {
                  SDL_VIDEODRIVER: 'dummy',
                  DISPLAY: ''
                },
                timeout: 300000 // 5 minutes timeout pour les gros repos
              }
            );
            console.log(`Generated log for ${repo.name} using direct output, size: ${gourceLogContent.length} bytes`);
          } catch (execError) {
            console.error(`Error using execSync for repository ${repo.name}, trying alternate method:`, execError.message);
            
            // Méthode alternative avec mise à jour du statut
            updateRenderStatus(
              render.id, 
              'preparing', 
              `Using alternative method for ${repo.name} - large repository detected`, 
              progress
            );
            
            // Méthode alternative: générer d'abord un fichier log temporaire
            const tempLogFile = path.join(path.dirname(logFilePath), `${repo.name}_temp.log`);
            try {
              execSync(
                `gource --output-custom-log "${tempLogFile}" "${normalizedPath}"`,
                { 
                  stdio: 'ignore', // Ne pas capturer la sortie
                  maxBuffer: 200 * 1024 * 1024, // 200MB buffer
                  windowsHide: true,
                  env: {
                    SDL_VIDEODRIVER: 'dummy',
                    DISPLAY: ''
                  },
                  timeout: 600000 // 10 minutes timeout pour les très gros repos
                }
              );
              
              // Lire le fichier log généré
              if (fs.existsSync(tempLogFile)) {
                gourceLogContent = fs.readFileSync(tempLogFile, 'utf-8');
                console.log(`Generated log for ${repo.name} using temp file, size: ${gourceLogContent.length} bytes`);
                
                // Mettre à jour le log dans le dépôt pour une utilisation future
                if (repo.logPath) {
                  fs.writeFileSync(repo.logPath, gourceLogContent);
                  console.log(`Updated repository log file at ${repo.logPath}`);
                }
                
                // Supprimer le fichier temporaire après utilisation
                fs.unlinkSync(tempLogFile);
              } else {
                throw new Error(`Failed to generate log file for repository ${repo.name}`);
              }
            } catch (tempLogError) {
              console.error(`Alternative method failed for ${repo.name}:`, tempLogError);
              processedRepos++;
              continue;
            }
          }
        }
          
        // Vérifier si des logs ont été générés
        if (!gourceLogContent || gourceLogContent.trim() === '') {
          console.error(`No log content generated for repository ${repo.name}`);
          processedRepos++;
          continue;
        }
          
        // Maintenant que nous avons un contenu de log, l'ajouter au tableau de lignes
        if (gourceLogContent && gourceLogContent.trim() !== '') {
          // Add a prefix to file paths to distinguish between repositories
          const lines = gourceLogContent.split('\n');
          let validLines = 0;
          
          for (const line of lines) {
            if (line.trim()) {
              const parts = line.split('|');
              // Vérifier que nous avons au moins 4 parties (timestamp|username|type|file)
              if (parts.length >= 4) {
                const [timestamp, username, type, filePath] = parts;
                // Vérifier si le type est valide (A, M, D) et que le timestamp est un nombre
                if ((type === 'A' || type === 'M' || type === 'D') && !isNaN(timestamp) && timestamp.trim() !== '') {
                  // S'assurer que le nom d'utilisateur n'est pas vide
                  const validUsername = username.trim() ? username : 'anonymous';
                  parts[1] = validUsername;
                  // Ajouter le préfixe du repository
                  parts[3] = `${repo.name}/${parts[3]}`;
                  combinedLogLines.push(parts.join('|'));
                  validLines++;
                } else {
                  console.log(`Ignoring invalid type or timestamp in line: ${line}`);
                }
              } else {
                console.log(`Ignoring malformed line: ${line}`);
              }
            }
          }
          
          console.log(`Repository ${repo.name}: Added ${validLines} valid lines to combined log array`);
          if (validLines > 0) {
            atLeastOneRepoSucceeded = true;
            console.log(`At least one repository succeeded: true (${repo.name})`);
          } else {
            console.error(`No valid lines found in log content for repository ${repo.name}`);
          }
        } else {
          console.error(`No valid log content available for repository ${repo.name}`);
        }
        
        processedRepos++;
      } catch (error) {
        console.error(`Error processing repository ${repo?.name || 'unknown'}:`, error);
        processedRepos++;
        // Continue with other repositories
      }
    }

    // Maintenant, écrire directement toutes les lignes collectées dans le fichier
    console.log(`Writing ${combinedLogLines.length} lines to log file: ${logFilePath}`);
    
    if (combinedLogLines.length > 0) {
      // S'assurer que le répertoire parent existe
      const logDir = path.dirname(logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      // Trier les lignes par timestamp pour une meilleure animation
      combinedLogLines.sort((a, b) => {
        const timestampA = parseFloat(a.split('|')[0]);
        const timestampB = parseFloat(b.split('|')[0]);
        return timestampA - timestampB;
      });
      
      // Écrire le fichier synchrone pour s'assurer qu'il est bien écrit avant de continuer
      fs.writeFileSync(logFilePath, combinedLogLines.join('\n') + '\n');
      
      console.log(`Log file written successfully`);
    } else {
      console.error(`No valid log lines to write!`);
      throw new Error('No valid repository logs could be generated');
    }
    
    // Vérifier si le fichier de log a été créé et s'il contient des données
    const logFileExists = fs.existsSync(logFilePath);
    const logFileSize = logFileExists ? fs.statSync(logFilePath).size : 0;
    console.log(`Log file status: exists=${logFileExists}, size=${logFileSize}, combinedLines=${combinedLogLines.length}`);
    
    if (!logFileExists || logFileSize === 0) {
      throw new Error('No valid repository logs could be generated');
    }
    
    // Afficher les 10 premières lignes du log pour le debugging
    if (logFileExists && logFileSize > 0) {
      const logSample = fs.readFileSync(logFilePath, 'utf-8').split('\n').slice(0, 10).join('\n');
      console.log(`Log file sample (first 10 lines):\n${logSample}`);
    }
    
    updateRenderStatus(render.id, 'ready', 'Logs generated, ready to render', 20);
  } catch (error) {
    console.error('Error generating logs:', error);
    updateRenderStatus(render.id, 'failed', `Error generating logs: ${error.message}`, 0);
    throw error; // Re-throw pour propager l'erreur
  }
}

// Helper function to update render status
function updateRenderStatus(renderId, status, message = null, progress = null) {
  try {
    const freshDb = reloadDatabase();
    const render = freshDb.get('renders').find({ id: renderId }).value();
    
    if (!render) {
      console.error(`Render with ID ${renderId} not found`);
      return;
    }

    const updates = { status };
    
    if (message) {
      updates.message = message;
    }
    
    if (progress !== null) {
      updates.progress = progress;
    }

    if (status === 'completed' || status === 'failed') {
      updates.endTime = new Date().toISOString();
    }

    if (status === 'failed' && message) {
      updates.error = message;
    }

    freshDb.get('renders')
      .find({ id: renderId })
      .assign(updates)
      .write();
  } catch (error) {
    console.error('Error updating render status:', error);
  }
}

// Helper function to run a command and handle errors
async function executeCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Executing command: ${command}`);
    
    // Remplacer les chemins Windows avec des barres obliques inverses par des barres obliques avant
    // pour éviter les problèmes d'échappement
    command = command.replace(/\\/g, '/');
    
    // Afficher les chemins pour le débogage
    if (command.includes('gource')) {
      // Extraire les chemins importants pour le débogage
      const logFileMatch = command.match(/gource "([^"]+)"/);
      const configFileMatch = command.match(/--load-config "?([^"\s]+)"?/);
      const outputFileMatch = command.match(/-o "?([^"\s]+)"?/);
      
      console.log('=== EXÉCUTION DE LA COMMANDE GOURCE ===');
      if (logFileMatch) console.log(`Log file path: ${logFileMatch[1]}`);
      if (configFileMatch) console.log(`Config file path: ${configFileMatch[1]}`);
      if (outputFileMatch) console.log(`Output file path: ${outputFileMatch[1]}`);
      console.log(`Gource command: ${command}`);
      console.log('=======================================');
    }
    
    if (command.includes('ffmpeg')) {
      console.log('=== EXÉCUTION DE LA COMMANDE FFMPEG ===');
      const inputMatch = command.match(/-i "([^"]+)"/);
      const outputMatch = command.match(/ "([^"]+\.mp4)"/);
      if (inputMatch) console.log(`Input file: ${inputMatch[1]}, size: ${fs.existsSync(inputMatch[1]) ? fs.statSync(inputMatch[1]).size + ' bytes' : 'N/A'}`);
      if (outputMatch) console.log(`Output file: ${outputMatch[1]}`);
      console.log(`FFmpeg command: ${command}`);
      console.log('=======================================');
    }
    
    // Par défaut, timeout après 30 minutes
    const timeout = options.timeout || 30 * 60 * 1000;
    
    // Préparer les options d'environnement pour garantir le mode non-interactif
    const env = {
      ...process.env,
      // Variables pour garantir le mode non-interactif
      DISPLAY: '',
      SDL_VIDEODRIVER: 'dummy', // Forcer SDL à utiliser un pilote vidéo factice
      GOURCE_DISABLE_VSYNC: '1',
      GOURCE_REALTIME: '0',
      ...options.env
    };
    
    // Exécuter directement la commande sans passer par PowerShell
    const childProcess = require('child_process').spawn(
      command, 
      [],
      {
        shell: true, // Utiliser le shell pour les opérations de redirection
        maxBuffer: 100 * 1024 * 1024, // 100MB buffer
        windowsHide: true, // Cacher les fenêtres sur Windows
        env,
        ...options
      }
    );
    
    let stdout = '';
    let stderr = '';
    
    // Timer pour le timeout
    const timeoutId = setTimeout(() => {
      childProcess.kill();
      reject(new Error(`Command timed out after ${timeout/1000} seconds`));
    }, timeout);
    
    if (childProcess.stdout) {
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        if (options.logOutput) {
          console.log(`[Command Output] ${data.toString().trim()}`);
        }
      });
    }
    
    if (childProcess.stderr) {
      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(`[Command Error] ${data.toString().trim()}`);
      });
    }
    
    childProcess.on('close', (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        console.error(`Command failed with code ${code}. Full stderr output:`);
        console.error(stderr);
        
        // Log des informations de diagnostic détaillées
        console.error('Command execution diagnostic info:');
        console.error(`Exit code: ${code}`);
        console.error(`Command: ${command}`);
        console.error(`Full stdout (first 1000 chars): ${stdout.substring(0, 1000)}...`);
        console.error(`Full stderr (first 1000 chars): ${stderr.substring(0, 1000)}...`);
        
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
    
    childProcess.on('error', (err) => {
      clearTimeout(timeoutId);
      console.error('Command execution error:', err);
      reject(new Error(`Failed to start command: ${err.message}`));
    });
  });
}

// Helper function to start the render process
async function startRenderProcess(logFilePath, videoFilePath, settings, render) {
  return new Promise((resolve, reject) => {
    try {
      // S'assurer que le fichier de log est bien écrit avant de continuer
      if (!fs.existsSync(logFilePath) || fs.statSync(logFilePath).size === 0) {
        const errorMsg = 'Log file is empty or does not exist';
        updateRenderStatus(render.id, 'failed', errorMsg, 0);
        reject(new Error(errorMsg));
        return;
      }

      // Vérifier à nouveau le contenu du fichier log
      let logContent;
      try {
        logContent = fs.readFileSync(logFilePath, 'utf-8');
      } catch (err) {
        const errorMsg = `Error reading log file: ${err.message}`;
        updateRenderStatus(render.id, 'failed', errorMsg, 0);
        reject(new Error(errorMsg));
        return;
      }
      
      const validLogLines = logContent.split('\n').filter(line => {
        if (!line.trim()) return false;
        const parts = line.split('|');
        return parts.length >= 4 && ['A', 'M', 'D'].includes(parts[2]) && !isNaN(parts[0]);
      }).length;

      if (validLogLines === 0) {
        const errorMsg = 'Log file contains no valid entries';
        updateRenderStatus(render.id, 'failed', errorMsg, 0);
        reject(new Error(errorMsg));
        return;
      }

      console.log(`Log file validated: ${validLogLines} valid lines found`);
      updateRenderStatus(render.id, 'rendering', 'Starting Gource visualization', 25);
  
      // Parse settings
      const {
        resolution,
        framerate,
        secondsPerDay,
        autoSkipSeconds,
        elasticity,
        title,
        key,
        background,
        fontScale,
        cameraMode,
        userScale,
        timeScale,
        highlightUsers,
        hideUsers,
        hideFilesRegex,
        hideRoot,
        maxUserCount,
        extraArgs
      } = settings;
  
      // Parse resolution
      const [width, height] = resolution.split('x').map(Number);
  
      // Vérifier l'existence des répertoires de sortie
      const videoDir = path.dirname(videoFilePath);
      if (!fs.existsSync(videoDir)) {
        fs.mkdirSync(videoDir, { recursive: true });
      }
  
      // Utiliser les API natives de Node.js pour éviter les références à process.platform
      const isWindows = require('os').platform() === 'win32';
      const tempDir = path.dirname(logFilePath);
            
      // APPROCHE SIMPLIFIÉE POUR WINDOWS
      // Génération directe via ffmpeg uniquement, sans utiliser l'interface de Gource
      if (isWindows) {
        // Sur Windows, utiliser le pipeline direct Gource -> ffmpeg comme dans le script render-4k.sh
        updateRenderStatus(render.id, 'rendering', 'Starting Gource rendering with direct pipeline to ffmpeg', 30);
        
        // Créer un fichier de configuration valide pour Gource
        const configFile = path.join(tempDir, 'gource-tools.conf');
        
        // Format correct du fichier de configuration avec sections [display] et [gource]
        const configContent = `[display]
viewport=${width}x${height}
output-framerate=${framerate}

[gource]
auto-skip-seconds=${autoSkipSeconds}
seconds-per-day=${secondsPerDay}
elasticity=${elasticity}
background-colour=${background.replace('#', '')}
camera-mode=${cameraMode}
user-scale=${userScale}
time-scale=${timeScale}
font-scale=${fontScale}
hide=mouse
${hideRoot ? 'hide=root' : ''}
${hideFilesRegex ? `file-filter=${hideFilesRegex}` : ''}
${hideUsers ? `user-filter=${hideUsers}` : ''}
${maxUserCount > 0 ? `max-user-count=${maxUserCount}` : ''}
${highlightUsers ? 'highlight-users=1' : ''}
`;
        
        fs.writeFileSync(configFile, configContent);
        
        // Normalisation des chemins pour Windows
        const normLogFilePath = logFilePath.replace(/\\/g, '/');
        const normConfigFilePath = configFile.replace(/\\/g, '/');
        const normVideoFilePath = videoFilePath.replace(/\\/g, '/');
        
        try {
          // Créer un fichier batch pour exécuter le pipeline complet
          const batchFilePath = path.join(tempDir, `${render.id}_pipeline.bat`);
          const batchContent = `@echo off
echo Starting Gource with direct pipeline to ffmpeg...
gource "${normLogFilePath}" --load-config "${normConfigFilePath}" --log-format custom --stop-at-end --disable-progress --output-framerate ${framerate} --viewport ${width}x${height} ${title ? '--title' : ''} ${key ? '--key' : ''} -o - | ffmpeg -y -r ${framerate} -f image2pipe -vcodec ppm -i - -vcodec libx264 -preset ultrafast -pix_fmt yuv420p -crf 25 -threads 0 "${normVideoFilePath}"
if %ERRORLEVEL% NEQ 0 exit /b 1
echo Rendering completed successfully!
exit /b 0
`;

          fs.writeFileSync(batchFilePath, batchContent);
          
          // Exécuter le fichier batch
          console.log(`Executing pipeline batch file: ${batchFilePath}`);
          execSync(`"${batchFilePath}"`, { 
            stdio: 'inherit',
            windowsHide: false, // Permettre l'affichage de la fenêtre
            maxBuffer: 200 * 1024 * 1024,
            timeout: 3600000 // 1 heure maximum
          });
          
          // Vérifier si le fichier MP4 a été créé
          if (!fs.existsSync(videoFilePath)) {
            throw new Error('Pipeline did not generate the MP4 file');
          }
          
          // Vérifier la taille du fichier MP4
          const mp4Size = fs.statSync(videoFilePath).size;
          if (mp4Size === 0) {
            throw new Error('Pipeline generated an empty MP4 file');
          }
          
          console.log(`MP4 file generated successfully: ${videoFilePath}, size: ${mp4Size} bytes`);
          
          // Nettoyer les fichiers temporaires
          try {
            fs.unlinkSync(batchFilePath);
          } catch (e) {
            console.warn(`Couldn't delete batch file: ${e.message}`);
          }
          
          updateRenderStatus(render.id, 'completed', 'Render completed successfully', 100);
          resolve({ success: true, message: 'Render completed successfully' });
        } catch (error) {
          console.error('Pipeline execution error:', error.message);
          
          // Méthode alternative: essayer d'exécuter une commande directe inspirée du script render-4k.sh
          updateRenderStatus(render.id, 'rendering', 'Trying alternative method with PowerShell...', 40);
          
          try {
            // Créer un script PowerShell pour exécuter la commande
            const psScriptPath = path.join(tempDir, `${render.id}_render.ps1`);
            const psScriptContent = `
# Exécuter Gource avec pipeline direct vers ffmpeg
$gourceCommand = "gource \\"${normLogFilePath}\\" --load-config \\"${normConfigFilePath}\\" --log-format custom --stop-at-end --output-framerate ${framerate} --viewport ${width}x${height} ${title ? '--title' : ''} ${key ? '--key' : ''} -o -"
$ffmpegCommand = "ffmpeg -y -r ${framerate} -f image2pipe -vcodec ppm -i - -vcodec libx264 -preset ultrafast -pix_fmt yuv420p -crf 25 -threads 0 \\"${normVideoFilePath}\\""

# Exécuter la commande complète
$process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c $gourceCommand | $ffmpegCommand" -NoNewWindow -PassThru -Wait
if ($process.ExitCode -ne 0) {
    Write-Error "Le processus a échoué avec le code de sortie $($process.ExitCode)"
    exit 1
}
`;

            fs.writeFileSync(psScriptPath, psScriptContent);
            
            console.log(`Executing PowerShell script: ${psScriptPath}`);
            execSync(`powershell -ExecutionPolicy Bypass -File "${psScriptPath}"`, {
              stdio: 'inherit',
              windowsHide: false,
              maxBuffer: 200 * 1024 * 1024,
              timeout: 3600000
            });
            
            // Vérifier si le fichier MP4 a été créé
            if (!fs.existsSync(videoFilePath)) {
              throw new Error('PowerShell method did not generate the MP4 file');
            }
            
            // Vérifier la taille du fichier MP4
            const mp4Size = fs.statSync(videoFilePath).size;
            if (mp4Size === 0) {
              throw new Error('PowerShell method generated an empty MP4 file');
            }
            
            console.log(`MP4 file generated successfully with PowerShell method: ${videoFilePath}, size: ${mp4Size} bytes`);
            
            // Nettoyer les fichiers temporaires
            try {
              fs.unlinkSync(psScriptPath);
            } catch (e) {
              console.warn(`Couldn't delete PowerShell script: ${e.message}`);
            }
            
            updateRenderStatus(render.id, 'completed', 'Render completed successfully with PowerShell method', 100);
            resolve({ success: true, message: 'Render completed successfully with PowerShell method' });
          } catch (psError) {
            console.error('PowerShell method failed:', psError.message);
            
            // Dernière tentative: exécuter la commande comme indiquée par l'utilisateur
            updateRenderStatus(render.id, 'rendering', 'Trying manual method from user example...', 50);
            
            try {
              // Créer un script batch final avec la syntaxe exacte de l'exemple utilisateur
              const finalBatchPath = path.join(tempDir, `${render.id}_final.bat`);
              const finalBatchContent = `@echo off
echo Running Gource with user-specified method...
gource "${normLogFilePath}" -${width}x${height} --stop-at-end --disable-progress --output-framerate ${framerate} --camera-mode ${cameraMode} ${title ? '--title' : ''} ${key ? '--key' : ''} --hide mouse --seconds-per-day ${secondsPerDay} -o - | ffmpeg -y -r ${framerate} -f image2pipe -vcodec ppm -i - -vcodec libx264 -preset ultrafast -pix_fmt yuv420p -crf 25 -threads 0 "${normVideoFilePath}"
`;
              
              fs.writeFileSync(finalBatchPath, finalBatchContent);
              
              console.log(`Executing final batch file with direct pipeline: ${finalBatchPath}`);
              execSync(`"${finalBatchPath}"`, {
                stdio: 'inherit',
                windowsHide: false,
                maxBuffer: 200 * 1024 * 1024,
                timeout: 3600000
              });
              
              // Vérifier si le fichier MP4 a été créé
              if (!fs.existsSync(videoFilePath)) {
                throw new Error('Final method did not generate the MP4 file');
              }
              
              const mp4Size = fs.statSync(videoFilePath).size;
              console.log(`MP4 file generated successfully with final method: ${videoFilePath}, size: ${mp4Size} bytes`);
              
              // Nettoyer le fichier temporaire
              try {
                fs.unlinkSync(finalBatchPath);
              } catch (e) {
                console.warn(`Couldn't delete final batch file: ${e.message}`);
              }
              
              updateRenderStatus(render.id, 'completed', 'Render completed successfully with user method', 100);
              resolve({ success: true, message: 'Render completed successfully with user method' });
            } catch (finalError) {
              console.error('All methods failed:', finalError.message);
              updateRenderStatus(render.id, 'failed', `Render failed after multiple attempts: ${finalError.message}`, 0);
              reject(finalError);
            }
          }
        }
      } else {
        // Sur Linux/Mac, utiliser une commande avec pipe
        
        // Créer un fichier de configuration valide pour Gource
        const configFile = path.join(tempDir, 'gource-tools.conf');
        
        // Format correct du fichier de configuration avec sections [display] et [gource]
        const configContent = `[display]
viewport=${width}x${height}
output-framerate=${framerate}

[gource]
auto-skip-seconds=${autoSkipSeconds}
seconds-per-day=${secondsPerDay}
elasticity=${elasticity}
background-colour=${background.replace('#', '')}
camera-mode=${cameraMode}
user-scale=${userScale}
time-scale=${timeScale}
font-scale=${fontScale}
hide=mouse
${hideRoot ? 'hide=root' : ''}
${hideFilesRegex ? `file-filter=${hideFilesRegex}` : ''}
${hideUsers ? `user-filter=${hideUsers}` : ''}
${maxUserCount > 0 ? `max-user-count=${maxUserCount}` : ''}
${highlightUsers ? 'highlight-users=1' : ''}
`;
        
        fs.writeFileSync(configFile, configContent);
        
        // Normalisation des chemins
        const normLogFilePath = logFilePath.replace(/\\/g, '/');
        const normConfigFilePath = configFile.replace(/\\/g, '/');
        const normVideoFilePath = videoFilePath.replace(/\\/g, '/');
        
        // Commande simplifiée pour le pipeline Gource | ffmpeg
        const gourcePart = 
          `gource "${normLogFilePath}" --load-config ${normConfigFilePath} --log-format custom --stop-at-end --disable-progress --disable-input --output-framerate ${framerate} --hide mouse --no-vsync ${title ? '--title' : ''} ${key ? '--key' : ''} -${width}x${height} -o -`;
        
        const ffmpegPart = 
          `ffmpeg -y -r ${framerate} -f image2pipe -vcodec ppm -i - -vcodec libx264 -preset medium -pix_fmt yuv420p -crf 18 -threads 0 "${normVideoFilePath}"`;
        
        const command = `${gourcePart} | ${ffmpegPart}`;
        
        // Exécuter la commande combinée
        updateRenderStatus(render.id, 'rendering', 'Generating and encoding video', 50);
        
        executeCommand(command, { 
          shell: true, 
          windowsHide: true, 
          timeout: 3600000,
          env: {
            SDL_VIDEODRIVER: 'dummy',
            DISPLAY: '',
            GOURCE_DISABLE_VSYNC: '1',
            GOURCE_REALTIME: '0'
          }
        })
          .then(() => {
            if (!fs.existsSync(videoFilePath) || fs.statSync(videoFilePath).size === 0) {
              throw new Error('Failed to generate video file');
            }
            
            updateRenderStatus(render.id, 'completed', 'Render completed successfully', 100);
            resolve({ success: true, message: 'Render completed successfully' });
          })
          .catch(err => {
            console.error('Render error:', err);
            updateRenderStatus(render.id, 'failed', `Error during render: ${err.message}`, 0);
            reject(err);
          });
      }
    } catch (error) {
      console.error('Error in render process:', error);
      updateRenderStatus(render.id, 'failed', `Error starting render: ${error.message}`, 0);
      reject(error);
    }
  });
}

// Open exports folder
router.post('/open-exports', (req, res) => {
  try {
    const exportsDir = path.join(__dirname, '../../exports');
    
    // Make sure directory exists
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    // Utiliser la méthode plus fiable pour détecter le système d'exploitation
    let command;
    const isWindows = require('os').platform() === 'win32';
    const isMac = require('os').platform() === 'darwin';
    
    if (isWindows) {
      // Utiliser explorer.exe avec le chemin complet pour être sûr
      const normalizedPath = exportsDir.replace(/\\/g, '\\\\');
      command = `explorer.exe "${normalizedPath}"`;
    } else if (isMac) {
      command = `open "${exportsDir}"`;
    } else {
      command = `xdg-open "${exportsDir}"`;
    }
    
    try {
      execSync(command);
      res.json({ success: true });
    } catch (cmdError) {
      // Fallback si la commande échoue
      console.error('Command error:', cmdError);
      
      // Tentative alternative sur Windows
      if (isWindows) {
        try {
          execSync(`start "" "${exportsDir}"`);
          return res.json({ success: true });
        } catch (altError) {
          console.error('Alternative command error:', altError);
        }
      }
      
      res.json({ 
        success: false, 
        message: 'Could not open exports folder automatically. Path: ' + exportsDir 
      });
    }
  } catch (error) {
    console.error('Error opening exports folder:', error);
    res.status(500).json({ error: 'Failed to open exports folder' });
  }
});

module.exports = router; 