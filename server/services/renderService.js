/**
 * Gource Rendering Service
 * Responsible for executing and managing the rendering process
 * Optimized exclusively for Windows 11 Pro
 */

const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { convertToGourceArgs } = require('../../shared/gourceConfig');
const GourceConfigService = require('./GourceConfigService');
const config = require('../config/config');
// Import RepositoryService after this service's declaration to avoid circular dependency
let RepositoryService;
const ProjectService = require('./ProjectService');

class RenderService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../db/db.json');
    this.exportsDir = path.join(__dirname, '../../exports');
    this.tempDir = path.join(__dirname, '../../temp');
    this.logsDir = path.join(__dirname, '../../logs');
    
    // Create necessary directories if they don't exist
    this.createDirectories();
    this.init();
  }

  /**
   * Initialize the database
   */
  init() {
    const db = this.getDatabase();
    
    // Check if the renders collection exists
    if (!db.has('renders').value()) {
      db.set('renders', []).write();
    }
  }

  /**
   * Create necessary directories
   */
  createDirectories() {
    const dirs = [this.exportsDir, this.tempDir, this.logsDir];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
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
   * Get all renders
   * @returns {Array} List of renders
   */
  getAllRenders() {
    const db = this.getDatabase();
    return db.get('renders').value() || [];
  }

  /**
   * Get a render by its ID
   * @param {string} id - ID of the render to retrieve
   * @returns {Object|null} Render or null if not found
   */
  getRenderById(id) {
    if (!id) return null;
    
    const db = this.getDatabase();
    return db.get('renders')
      .find({ id: id.toString() })
      .value() || null;
  }

  /**
   * Update a render's status
   * @param {string} renderId - Render ID
   * @param {string} status - New status
   * @param {string} message - Optional message
   * @param {number} progress - Progress percentage
   * @returns {Object|null} Updated render or null if not found
   */
  updateRenderStatus(renderId, status, message = null, progress = null) {
    if (!renderId) return null;
    
    const db = this.getDatabase();
    const render = db.get('renders')
      .find({ id: renderId.toString() })
      .value();
    
    if (!render) return null;
    
    const updates = { status };
    
    if (message !== null) {
      updates.message = message;
    }
    
    if (progress !== null && !isNaN(progress)) {
      updates.progress = Math.min(Math.max(progress, 0), 100);
    }
    
    // If status is 'completed' or 'failed', add end time
    if (status === 'completed' || status === 'failed') {
      updates.endTime = new Date().toISOString();
    }
    
    // Update render in database
    db.get('renders')
      .find({ id: renderId.toString() })
      .assign(updates)
      .write();
    
    return db.get('renders')
      .find({ id: renderId.toString() })
      .value();
  }

  /**
   * Start a new render process
   * @param {string} projectId - ID of the project to render
   * @param {string} customName - Custom name for the render (optional)
   * @returns {Object} Information about the created render
   */
  async startRender(projectId, customName = null) {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    
    // Get project details
    const project = ProjectService.getProjectWithDetails(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    
    if (!project.repositories || project.repositories.length === 0 || !project.repositoryDetails || project.repositoryDetails.length === 0) {
      throw new Error('Project does not contain any valid repositories');
    }
    
    // Generate a unique ID for the render
    const id = Date.now().toString();
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace('T', '_').slice(0, 19);
    const projectName = project.name.replace(/[\\/:*?"<>|]/g, '_');
    const fileName = customName
      ? `${customName.replace(/[\\/:*?"<>|]/g, '_')}_${timestamp}.mp4`
      : `${projectName}_${timestamp}.mp4`;
    
    const videoFilePath = path.join(this.exportsDir, fileName);
    const logFilePath = path.join(this.tempDir, `${id}.log`);
    
    // Create initial render record
    const render = {
      id,
      projectId,
      projectName: project.name,
      fileName,
      filePath: videoFilePath,
      status: 'preparing',
      progress: 0,
      message: 'Preparing render...',
      startTime: new Date().toISOString(),
      endTime: null,
      error: null
    };
    
    // Add render to database
    const db = this.getDatabase();
    db.get('renders')
      .push(render)
      .write();
    
    try {
      // Start the render process asynchronously
      this.processRender(project, render);
      
      return render;
    } catch (error) {
      // In case of error, update status
      this.updateRenderStatus(id, 'failed', `Error starting render: ${error.message}`, 0);
      throw error;
    }
  }

  /**
   * Traite un rendu
   * @param {Object} project - Le projet associé au rendu
   * @param {Object} render - L'objet de rendu à traiter
   * @param {Object} options - Options supplémentaires pour le rendu
   * @returns {Object} - L'objet de rendu mis à jour
   */
  async processRender(project, render, options = {}) {
    console.log(`Début du traitement du rendu ${render.id}`);
    
    // Mettre à jour le statut du rendu
    render.status = 'processing';
    await this.updateRenderStatus(render.id, 'processing', 'Traitement du rendu en cours...', 0);
    
    try {
      // Vérifier si le projet a des dépôts assignés
      if (!project.repositoryDetails || project.repositoryDetails.length === 0) {
        throw new Error('Aucun dépôt assigné au projet');
      }
      
      // Créer les répertoires de sortie pour le rendu et les logs
      const outputDir = path.join(this.exportsDir, render.id.toString());
      const logsDir = path.join(this.logsDir, render.id.toString());
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      console.log(`Génération des logs combinés pour le rendu ${render.id}`);
      await this.updateRenderStatus(render.id, 'generating_logs', 'Génération des logs Gource...', 10);
      
      // Générer les logs combinés
      const logOptions = {
        startDate: render.startDate,
        endDate: render.endDate,
        ...options
      };
      
      const combinedLogPath = await this.generateCombinedLogs(project.repositoryDetails, logOptions);
      render.logPath = combinedLogPath;
      await this.updateRenderStatus(render.id, 'generating_logs', 'Logs Gource générés', 20);
      
      // Exécuter le rendu Gource
      console.log(`Exécution du rendu Gource pour ${render.id}`);
      await this.updateRenderStatus(render.id, 'rendering', 'Génération de la vidéo en cours...', 30);
      
      const outputPath = path.join(outputDir, 'output.mp4');
      
      // Obtenir le profil de rendu associé au projet
      const db = this.getDatabase();
      const renderProfileId = project.renderProfileId;
      const renderProfile = renderProfileId 
        ? db.get('renderProfiles').find({ id: renderProfileId }).value() 
        : null;
      
      // Utiliser les paramètres du profil de rendu ou des paramètres par défaut
      const renderSettings = renderProfile?.settings || {};
      
      await this.executeGourceRender(combinedLogPath, render, outputPath, renderSettings);
      
      // Mettre à jour le rendu avec le chemin de sortie
      render.outputPath = outputPath;
      render.status = 'completed';
      render.completedAt = new Date();
      await this.updateRenderStatus(render.id, 'completed', 'Render completed successfully', 100);
      
      console.log(`Rendu ${render.id} terminé avec succès`);
      return render;
    } catch (error) {
      console.error(`Erreur lors du rendu ${render.id}:`, error);
      render.status = 'failed';
      render.error = error.message;
      await this.updateRenderStatus(render.id, 'failed', error.message, 0);
      throw error;
    }
  }

  /**
   * Start the Gource render process
   * @param {Object} render - Render object
   * @param {string} logFilePath - Path to the combined log file
   * @param {string} outputDir - Directory for output files
   * @returns {Promise<void>} - Promise resolving when render completes
   */
  async startGourceRender(render, logFilePath, outputDir) {
    try {
      // Get project and render profile
      const db = this.getDatabase();
      const project = db.get('projects')
        .find({ id: render.projectId })
        .value();
      
      if (!project) {
        throw new Error(`Project not found for render: ${render.id}`);
      }
      
      // Get render profile settings
      const renderProfileId = project.renderProfileId;
      const renderProfile = renderProfileId 
        ? db.get('renderProfiles').find({ id: renderProfileId }).value() 
        : null;
        
      if (!renderProfile) {
        throw new Error(`Render profile not found for project: ${project.id}`);
      }
      
      // Execute Gource render
      await this.executeGourceRender(logFilePath, render, render.filePath, renderProfile.settings);
      
      return true;
    } catch (error) {
      console.error(`Error in startGourceRender: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generates a combined log file from multiple repositories
   * @param {Array} repositories - List of repositories
   * @param {Object} options - Options for log generation
   * @returns {string} - Path to the combined log file
   */
  async generateCombinedLogs(repositories, options = {}) {
    console.log(`Generating combined logs for ${repositories.length} repositories`);
    
    if (!repositories || repositories.length === 0) {
      throw new Error('No repositories provided for log generation');
    }

    // Load RepositoryService if necessary to avoid circular dependency
    if (!RepositoryService) {
      RepositoryService = require('./repositoryService');
    }

    // Create a temporary directory for individual logs
    const tempLogsDir = path.join(this.logsDir, 'temp', Date.now().toString());
    if (!fs.existsSync(tempLogsDir)) {
      fs.mkdirSync(tempLogsDir, { recursive: true });
    }

    // Create output path for the combined log
    const outputPath = path.join(tempLogsDir, 'combined.log');

    // Generate individual logs for each repository
    const logFiles = [];
    const failedRepos = [];

    for (const repo of repositories) {
      try {
        const logFilePath = path.join(tempLogsDir, `${repo.id || repo.name}.log`);

        console.log(`Generating Gource log for ${repo.name || repo.id}`);
        
        // Check if the repository has a local path
        if (!repo.localPath && !repo.path) {
          console.warn(`Repository ${repo.name || repo.id} has no local path defined`);
          failedRepos.push(repo.name || repo.id);
          continue;
        }
        
        // Use generateGitLog from RepositoryService directly with repo object
        const result = await RepositoryService.generateGitLog(repo, logFilePath, options);
        
        if (result && !result.isEmpty) {
          logFiles.push(result);
        } else {
          console.warn(`Log file for ${repo.name || repo.id} is empty`);
          failedRepos.push(repo.name || repo.id);
        }
      } catch (error) {
        console.error(`Error generating Gource log for ${repo.name || repo.id}:`, error.message);
        failedRepos.push(repo.name || repo.id);
      }
    }

    if (logFiles.length === 0) {
      // Clean up the temporary directory
      if (fs.existsSync(tempLogsDir)) {
        fs.rmSync(tempLogsDir, { recursive: true, force: true });
      }
      throw new Error('No valid log entries generated for repositories');
    }

    // Merge individual logs into a single file
    await this.mergeLogs(logFiles, outputPath);

    console.log(`Combined logs successfully generated: ${outputPath}`);
    return outputPath;
  }

  /**
   * Merges log files to generate a combined log file
   * @param {Array} logFiles - Array of objects containing log file paths
   * @param {string} outputPath - Path to the output file
   * @returns {Promise<string>} - Path to the combined log file
   */
  async mergeLogs(logFiles, outputPath) {
    if (!logFiles || logFiles.length === 0) {
      throw new Error('No log files to merge');
    }

    // Filter empty files
    const validLogFiles = logFiles.filter(log => !log.isEmpty);
    
    if (validLogFiles.length === 0) {
      throw new Error('All log files are empty');
    }

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      // Alternative: use fs directly to merge files
      let allLines = [];
      
      // Read all log files
      for (const logFile of validLogFiles) {
        if (!fs.existsSync(logFile.path)) {
          console.warn(`File ${logFile.path} does not exist, ignored`);
          continue;
        }
        
        try {
          const content = fs.readFileSync(logFile.path, 'utf8');
          const lines = content.split('\n').filter(line => line.trim() !== '');
          allLines = allLines.concat(lines);
        } catch (err) {
          console.warn(`Error reading file ${logFile.path}: ${err.message}`);
        }
      }
      
      // Sort all lines numerically by timestamp (first field)
      allLines.sort((a, b) => {
        const timestampA = parseInt(a.split('|')[0], 10);
        const timestampB = parseInt(b.split('|')[0], 10);
        return timestampA - timestampB;
      });
      
      // Remove duplicate lines
      const uniqueLines = [];
      for (let i = 0; i < allLines.length; i++) {
        if (i === 0 || allLines[i] !== allLines[i-1]) {
          uniqueLines.push(allLines[i]);
        }
      }
      
      // Write output file
      fs.writeFileSync(outputPath, uniqueLines.join('\n'), 'utf8');

      // Check if file was created and is not empty
      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
        throw new Error('Failed to merge logs: no result generated');
      }

      return outputPath;
    } catch (error) {
      console.error(`Error merging logs: ${error.message}`);
      throw new Error(`Failed to merge logs: ${error.message}`);
    }
  }

  /**
   * Calculate the number of seconds per day for a one-minute render
   * @param {string} logFilePath - Path to log file
   * @returns {number} Number of seconds per day
   */
  calculateSecondsPerDay(logFilePath) {
    try {
      // Read log file
      const logContent = fs.readFileSync(logFilePath, 'utf8').split('\n')
        .filter(line => line.trim() !== '');
      
      if (logContent.length === 0) {
        console.warn('Empty log file, using default value of 1 second per day');
        return 1;
      }
      
      // Extract timestamps (first field of each line, separated by |)
      const timestamps = logContent.map(line => {
        const parts = line.split('|');
        return parts.length > 0 ? parseInt(parts[0], 10) : 0;
      }).filter(ts => !isNaN(ts) && ts > 0);
      
      if (timestamps.length === 0) {
        console.warn('No valid timestamps found, using default value of 1 second per day');
        return 1;
      }
      
      // Find first and last timestamp
      const firstTimestamp = Math.min(...timestamps);
      const lastTimestamp = Math.max(...timestamps);
      
      // Calculate total duration in seconds
      const totalDurationSeconds = (lastTimestamp - firstTimestamp);
      
      // Convert to days (86400 seconds = 1 day)
      const totalDays = totalDurationSeconds / 86400;
      
      if (totalDays <= 0) {
        console.warn('Project duration too short, using default value of 1 second per day');
        return 1;
      }
      
      // For a one-minute visualization (60 seconds), calculate secondsPerDay
      // 60 seconds / total days = seconds per day
      const secondsPerDay = 60 / totalDays;
      
      console.log(`Dynamic time calculation: ${totalDays} days total, ${secondsPerDay.toFixed(3)} seconds per day for a one-minute render`);
      
      return secondsPerDay;
    } catch (error) {
      console.error('Error calculating seconds per day:', error);
      return 1; // Default value in case of error
    }
  }

  /**
   * Update relative dates in profile settings based on the profile ID
   * @param {Object} settings - Settings object to update
   * @param {string} profileId - ID of the render profile to check
   * @param {Object} profile - The complete profile object
   * @returns {Object} Updated settings with current relative dates if needed
   */
  updateRelativeDatesInSettings(settings, profileId, profile) {
    if (!settings || !profileId) return settings;
    
    // Create a new settings object to avoid modifying the original
    const updatedSettings = { ...settings };
    
    // Vérifier si c'est un profil temporel (par l'indicateur explicite ou par l'ID)
    const isTemporalProfile = 
      (profile && profile.isTemporalProfile === true) ||
      (profileId && (
        profileId.includes('last_week') || 
        profileId.includes('last_month') || 
        profileId.includes('last_year')
      ));
    
    if (!isTemporalProfile) return settings;
    
    // Calculate relative dates based on profile type
    const now = new Date(); // Date actuelle réelle
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Déterminer le nombre de jours à inclure
    let daysToInclude = 0;
    
    if (profile && profile.daysToInclude) {
      // Utiliser la valeur explicite du profil si disponible
      daysToInclude = profile.daysToInclude;
    } else if (updatedSettings['range-days'] && !isNaN(updatedSettings['range-days'])) {
      // Sinon utiliser range-days s'il existe et est un nombre
      daysToInclude = parseInt(updatedSettings['range-days'], 10);
    } else if (profileId.includes('last_week')) {
      daysToInclude = 7;
    } else if (profileId.includes('last_month')) {
      daysToInclude = 30;
    } else if (profileId.includes('last_year')) {
      daysToInclude = 365;
    }
    
    // Calculer la date de début
    if (daysToInclude > 0) {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysToInclude);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      // Mettre à jour les paramètres
      updatedSettings['start-date'] = startDateStr;
      updatedSettings['stop-date'] = today;
      
      // Log the updated dates for debugging
      console.log(`Updated relative dates for profile ${profileId}: ${startDateStr} to ${today} (${daysToInclude} days)`);
      
      // Ensure we explicitly set these parameters as we want Gource to use them
      if (updatedSettings['range-days']) {
        delete updatedSettings['range-days']; // Remove range-days to avoid conflicts
        console.log(`Removed range-days parameter to use start-date and stop-date instead`);
      }
    }
    
    return updatedSettings;
  }

  /**
   * Execute Gource render to video file
   * Optimized exclusively for Windows 11 Pro
   * @param {string} logFilePath - Path to log file
   * @param {string} outputFilePath - Path to output video file
   * @param {Object} settings - Gource configuration parameters
   * @param {Object} render - Information about the render
   */
  async executeGourceRender(logFilePath, render, outputFilePath, settings) {
    try {
      // Ensure settings is defined with default values
      settings = settings || {};
      const defaultSettings = {
        'seconds-per-day': 10,
        'resolution': '1920x1080',
        'framerate': 60
      };
      
      // Apply default settings if not defined
      settings = { ...defaultSettings, ...settings };
      
      // Update status
      this.updateRenderStatus(render.id, 'rendering', 'Starting Gource render...', 35);
      
      // Check if profile requires dynamic time calculation
      const db = this.getDatabase();
      const project = db.get('projects')
        .find({ id: render.projectId })
        .value();
      
      // Get complete render profile
      const renderProfileId = project?.renderProfileId;
      const renderProfile = renderProfileId 
        ? db.get('renderProfiles').find({ id: renderProfileId }).value() 
        : null;
      
      if (renderProfile) {
        // Update relative dates if this is a temporal profile
        settings = this.updateRelativeDatesInSettings(settings, renderProfile.id, renderProfile);
        
        // Dynamic time calculation if specified
        if (renderProfile.dynamicTimeCalculation === true) {
          // Dynamically calculate seconds per day
          const calculatedSecondsPerDay = this.calculateSecondsPerDay(logFilePath);
          
          // Update parameter in settings
          settings['seconds-per-day'] = calculatedSecondsPerDay;
          
          // Update status to indicate calculation
          this.updateRenderStatus(
            render.id, 
            'rendering', 
            `Calculating time: ${calculatedSecondsPerDay.toFixed(3)} seconds per day for a one-minute render`, 
            36
          );
        }
      }
      
      // If seconds-per-day is set to 'auto', do dynamic calculation regardless of profile setting
      if (settings['seconds-per-day'] === 'auto') {
        const calculatedSecondsPerDay = this.calculateSecondsPerDay(logFilePath);
        settings['seconds-per-day'] = calculatedSecondsPerDay;
      }
      
      // Débogage: afficher les paramètres de date finaux
      if (settings['start-date'] || settings['stop-date']) {
        console.log(`Dates finales pour le rendu: du ${settings['start-date'] || 'début'} au ${settings['stop-date'] || 'fin'}`);
      }
      
      // Create temporary Gource config file
      const tempConfigPath = path.join(this.tempDir, `gource_config_${render.id}.txt`);
      
      // Convert parameters to command line arguments
      const gourceArgs = convertToGourceArgs(settings);
      
      // Create temporary file
      fs.writeFileSync(tempConfigPath, gourceArgs, 'utf8');
      
      // Determine resolution and framerate
      const resolution = settings.resolution;
      const framerate = settings.framerate;
      
      // Create temporary directory for pipe
      const pipePath = path.join(this.tempDir, `gource_pipe_${render.id}`);
      if (fs.existsSync(pipePath)) {
        try {
          fs.unlinkSync(pipePath);
        } catch (err) {
          console.warn(`Unable to delete existing pipe file: ${err.message}`);
        }
      }
      
      // Génération du script PowerShell pour le rendu vidéo
      const powerShellScriptPath = path.join(this.tempDir, `render_script_${render.id}.ps1`);
      
      // Préparer les chemins avec double backslashes pour PowerShell
      const psLogFilePath = logFilePath.replace(/\\/g, '\\\\');
      const psOutputFilePath = outputFilePath.replace(/\\/g, '\\\\');
      const psTempPPM = path.join(this.tempDir, `temp_${render.id}.ppm`).replace(/\\/g, '\\\\');
      
      // Générer le contenu du script ligne par ligne
      const scriptLines = [
        '# Script simplifié de rendu Gource',
        '$ErrorActionPreference = "Stop"',
        '',
        '# File paths',
        `$logFile = "${psLogFilePath}"`,
        `$outputFile = "${psOutputFilePath}"`,
        `$tempPPM = "${psTempPPM}"`,
        '',
        '# Check log file existence',
        'if (-not (Test-Path $logFile)) {',
        '    Write-Error "Log file not found: $logFile"',
        '    exit 1',
        '}',
        '',
        '# Execute Gource with minimal params',
        'Write-Host "Starting Gource render..."',
        'gource --log-format custom "$logFile" --viewport 1920x1080 --output-framerate 60 --seconds-per-day 10 --output-ppm-stream "$tempPPM"',
        '',
        '# Check if PPM was created',
        'if (-not (Test-Path $tempPPM)) {',
        '    Write-Error "Gource failed to create PPM output"',
        '    exit 1',
        '}',
        '',
        '# Execute FFmpeg conversion',
        'Write-Host "Starting FFmpeg conversion..."',
        'ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i "$tempPPM" -vcodec libx264 -preset fast -pix_fmt yuv420p -crf 22 -threads 0 -bf 0 "$outputFile"',
        '',
        '# Clean up temporary files',
        'Remove-Item -Path $tempPPM -Force -ErrorAction SilentlyContinue',
        '',
        'Write-Host "Render completed successfully!"',
        'exit 0'
      ];
      
      // Joindre les lignes avec des sauts de ligne
      const scriptContent = scriptLines.join('\r\n');
      
      // Écrire le script PowerShell
      fs.writeFileSync(powerShellScriptPath, scriptContent, 'utf8');
      
      // Mettre à jour le statut
      this.updateRenderStatus(render.id, 'rendering', 'Exécution du processus de rendu...', 40);
      
      // Créer un flux de journalisation
      const renderLogPath = path.join(this.logsDir, `render_${render.id}.log`);
      const logOutputStream = fs.createWriteStream(renderLogPath);
      
      // Lancer PowerShell avec le script
      const powershellPath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
      const psProcess = spawn(powershellPath, ['-ExecutionPolicy', 'Bypass', '-File', powerShellScriptPath], {
        stdio: 'pipe'
      });
      
      // Rediriger les flux de sortie
      psProcess.stdout.pipe(logOutputStream);
      psProcess.stderr.pipe(logOutputStream);
      
      // Journaliser la sortie pour le débogage
      psProcess.stdout.on('data', (data) => {
        console.log(`[Gource] ${data.toString().trim()}`);
      });
      
      psProcess.stderr.on('data', (data) => {
        console.error(`[Gource Error] ${data.toString().trim()}`);
      });

      // Mettre à jour périodiquement le statut du rendu
      const statusUpdater = setInterval(() => {
        if (fs.existsSync(outputFilePath)) {
          try {
            const stats = fs.statSync(outputFilePath);
            if (stats.size > 0) {
              // Calculer la progression en fonction du temps écoulé (estimation)
              const currentTime = new Date();
              const startTime = new Date(render.startTime || render.dateCreated);
              const elapsedSeconds = (currentTime - startTime) / 1000;
              
              // Estimer la progression (maximum 95% jusqu'à ce que le rendu soit terminé)
              const estimatedProgress = Math.min(40 + (elapsedSeconds / 3), 95);
              
              this.updateRenderStatus(render.id, 'rendering', 'Rendu en cours...', estimatedProgress);
            }
          } catch (error) {
            console.error('Erreur lors de la vérification du fichier de sortie:', error);
          }
        }
      }, 5000); // Mise à jour toutes les 5 secondes
      
      // Attendre la fin du processus
      return new Promise((resolve, reject) => {
        psProcess.on('exit', (code) => {
          clearInterval(statusUpdater);
          
          if (code === 0) {
            // Rendu réussi
            this.updateRenderStatus(render.id, 'completed', 'Rendu terminé avec succès', 100);
            console.log(`Rendu ${render.id} terminé avec succès, fichier: ${outputFilePath}`);
            resolve();
          } else {
            // Erreur de rendu
            const errorMsg = `Erreur de rendu (code ${code})`;
            this.updateRenderStatus(render.id, 'failed', errorMsg, 0);
            console.error(`Erreur lors du rendu ${render.id}, code: ${code}`);
            reject(new Error(errorMsg));
          }
          
          // Nettoyer les fichiers temporaires
          try {
            if (fs.existsSync(powerShellScriptPath)) {
              fs.unlinkSync(powerShellScriptPath);
            }
            if (fs.existsSync(tempConfigPath)) {
              fs.unlinkSync(tempConfigPath);
            }
          } catch (error) {
            console.error('Erreur lors du nettoyage des fichiers temporaires:', error);
          }
        });
        
        psProcess.on('error', (error) => {
          clearInterval(statusUpdater);
          const errorMsg = `Erreur lors du démarrage du processus: ${error.message}`;
          this.updateRenderStatus(render.id, 'failed', errorMsg, 0);
          console.error(`Erreur lors du démarrage du processus pour le rendu ${render.id}:`, error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error executing Gource render:', error);
      this.updateRenderStatus(render.id, 'failed', `Error: ${error.message}`, 0);
      throw error;
    }
  }

  /**
   * Delete a render
   * @param {String} id - ID of the render to delete
   * @returns {Boolean} - True if successful
   */
  deleteRender(id) {
    // Get render details
    const db = this.getDatabase();
    const render = db.get('renders').find({ id: id.toString() }).value();
    
    if (!render) {
      return false;
    }
    
    // Delete output file if it exists
    if (render.filePath && fs.existsSync(render.filePath)) {
      try {
        fs.unlinkSync(render.filePath);
      } catch (error) {
        console.error(`Error deleting file ${render.filePath}:`, error);
        // Continue even if file cannot be deleted
      }
    }
    
    // Delete associated log files
    const logFile = path.join(this.logsDir, `render_${id}.log`);
    if (fs.existsSync(logFile)) {
      try {
        fs.unlinkSync(logFile);
      } catch (error) {
        console.error(`Error deleting log ${logFile}:`, error);
      }
    }
    
    // Delete database record
    db.get('renders')
      .remove({ id: id.toString() })
      .write();
    
    return true;
  }
}

module.exports = new RenderService();