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
   * Process a render job
   * @param {Object} project - Project to render
   * @param {Object} render - Render entry
   * @param {Object} options - Options
   * @returns {Promise<Object>} - Render entry
   */
  async processRender(project, render, options = {}) {
    try {
      // Check if the project has assigned repositories
      if (!project.repositories || project.repositories.length === 0) {
        throw new Error('No repositories assigned to project');
      }

      // Get repositories for the project
      const repositories = project.repositories.map(repoId => {
        const repo = this.getDatabase().get('repositories').find({ id: repoId }).value();
        return repo;
      }).filter(Boolean);

      console.log(`Generating combined logs for render ${render.id}`);
      await this.updateRenderStatus(render.id, 'generating_logs', 'Generating Gource logs...', 10);

      // Generate combined logs
      const logFilePath = await this.generateCombinedLogs(repositories);

      // Update status
      await this.updateRenderStatus(render.id, 'generating_logs', 'Gource logs generated', 20);

      // Prepare render
      const outputDir = path.join(this.exportsDir, render.id);
      await this.updateRenderStatus(render.id, 'rendering', 'Video generation in progress...', 30);

      // Start the render process
      await this.startGourceRender(render, logFilePath, outputDir);

      // Update status when complete
      await this.updateRenderStatus(
        render.id, 
        'completed', 
        `Render completed: ${render.fileName}`, 
        100, 
        { filePath: render.filePath }
      );

      return render;
    } catch (error) {
      console.error(`Error during render ${render.id}:`, error);
      
      // Update status when failed
      await this.updateRenderStatus(render.id, 'failed', `Render failed: ${error.message}`, 0);
      
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
      
      if (renderProfile && renderProfile.dynamicTimeCalculation === true) {
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
      } else if (settings['seconds-per-day'] === 'auto') {
        // If seconds-per-day is set to 'auto', do dynamic calculation
        const calculatedSecondsPerDay = this.calculateSecondsPerDay(logFilePath);
        settings['seconds-per-day'] = calculatedSecondsPerDay;
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
      
      // Generating PowerShell script for video rendering
      const powerShellScriptPath = path.join(this.tempDir, `render_script_${render.id}.ps1`);
      
      // Prepare paths with double backslashes for PowerShell
      const psLogFilePath = logFilePath.replace(/\\/g, '\\\\');
      const psOutputFilePath = outputFilePath.replace(/\\/g, '\\\\');
      const psTempPPM = path.join(this.tempDir, `temp_${render.id}.ppm`).replace(/\\/g, '\\\\');
      
      // Generate script content line by line
      const scriptLines = [
        '# Simplified Gource rendering script',
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
      
      // Join lines with line breaks
      const scriptContent = scriptLines.join('\r\n');
      
      // Write PowerShell script
      fs.writeFileSync(powerShellScriptPath, scriptContent, 'utf8');
      
      // Update status
      this.updateRenderStatus(render.id, 'rendering', 'Running render process...', 40);
      
      // Create logging stream
      const renderLogPath = path.join(this.logsDir, `render_${render.id}.log`);
      const logOutputStream = fs.createWriteStream(renderLogPath);
      
      // Launch PowerShell with script
      const powershellPath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
      const psProcess = spawn(powershellPath, ['-ExecutionPolicy', 'Bypass', '-File', powerShellScriptPath], {
        stdio: 'pipe'
      });
      
      // Redirect output streams
      psProcess.stdout.pipe(logOutputStream);
      psProcess.stderr.pipe(logOutputStream);
      
      // Log output for debugging
      psProcess.stdout.on('data', (data) => {
        console.log(`[Gource] ${data.toString().trim()}`);
      });
      
      psProcess.stderr.on('data', (data) => {
        console.error(`[Gource Error] ${data.toString().trim()}`);
      });

      // Periodically update render status
      const statusUpdater = setInterval(() => {
        if (fs.existsSync(outputFilePath)) {
          try {
            const stats = fs.statSync(outputFilePath);
            if (stats.size > 0) {
              // Calculate progress based on elapsed time (estimate)
              const currentTime = new Date();
              const startTime = new Date(render.startTime || render.dateCreated);
              const elapsedSeconds = (currentTime - startTime) / 1000;
              
              // Estimate progress (maximum 95% until rendering is complete)
              const estimatedProgress = Math.min(40 + (elapsedSeconds / 3), 95);
              
              this.updateRenderStatus(render.id, 'rendering', 'Rendering in progress...', estimatedProgress);
            }
          } catch (error) {
            console.error('Error checking output file:', error);
          }
        }
      }, 5000); // Update every 5 seconds
      
      // Wait for process to finish
      return new Promise((resolve, reject) => {
        psProcess.on('exit', (code) => {
          clearInterval(statusUpdater);
          
          if (code === 0) {
            // Render successful
            this.updateRenderStatus(render.id, 'completed', 'Render completed successfully', 100);
            console.log(`Render ${render.id} completed successfully, file: ${outputFilePath}`);
            resolve();
          } else {
            // Render error
            const errorMsg = `Render error (code ${code})`;
            this.updateRenderStatus(render.id, 'failed', errorMsg, 0);
            console.error(`Error during render ${render.id}, code: ${code}`);
            reject(new Error(errorMsg));
          }
          
          // Clean up temporary files
          try {
            if (fs.existsSync(powerShellScriptPath)) {
              fs.unlinkSync(powerShellScriptPath);
            }
            if (fs.existsSync(tempConfigPath)) {
              fs.unlinkSync(tempConfigPath);
            }
          } catch (error) {
            console.error('Error cleaning up temporary files:', error);
          }
        });
        
        psProcess.on('error', (error) => {
          clearInterval(statusUpdater);
          const errorMsg = `Error starting process: ${error.message}`;
          this.updateRenderStatus(render.id, 'failed', errorMsg, 0);
          console.error(`Error starting process for render ${render.id}:`, error);
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