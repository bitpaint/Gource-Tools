/**
 * Gource Rendering Service
 * Responsible for executing and managing the rendering process
 * Optimized exclusively for Windows 11 Pro
 */

const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const crypto = require('crypto');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { v4: uuidv4 } = require('uuid');
const { killProcessTree } = require('../utils/processUtils');
const os = require('os');
const axios = require('axios');
const { convertToGourceArgs } = require('../../client/src/shared/gourceConfig');
const GourceConfigService = require('./gourceConfigService');
const config = require('../config/config');
const Logger = require('../utils/Logger');
const Database = require('../utils/Database'); // Import Database utility

// Create a component logger
const logger = Logger.createComponentLogger('RenderService');

// Define paths
const dbPath = path.join(__dirname, '../../db/db.json');
const exportsDir = path.join(__dirname, '../../exports');
const tempDir = path.join(__dirname, '../../temp');
const logsDir = path.join(__dirname, '../../logs');
let pid = null;

// Import ProjectService module
const ProjectService = require('./projectService');

// Import RepositoryService after this service's declaration to avoid circular dependency
let RepositoryService = null;

// Helper function to parse date strings (YYYY-MM-DD or relative)
function calculateStartDate(startDateSetting) {
  if (typeof startDateSetting === 'string' && startDateSetting.startsWith('relative-')) {
    // Try the standard format first (relative-Xu where X is number, u is unit)
    const standardMatch = startDateSetting.match(/^relative-(\d+)([dwmy])$/);
    if (standardMatch) {
      const value = parseInt(standardMatch[1], 10);
      const unit = standardMatch[2];
      const now = new Date();
      switch (unit) {
        case 'd':
          now.setDate(now.getDate() - value);
          break;
        case 'w':
          now.setDate(now.getDate() - value * 7);
          break;
        case 'm':
          now.setMonth(now.getMonth() - value);
          break;
        case 'y':
          now.setFullYear(now.getFullYear() - value);
          break;
        default:
          logger.warn(`Invalid relative date unit: ${unit}`);
          return null; // Invalid unit
      }
      // Format as YYYY-MM-DD HH:MM:SS for Gource
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 00:00:00`;
    } 
    
    // Try the UI format with dashes: relative-X-units (e.g., relative-2-years)
    const uiFormatMatch = startDateSetting.match(/^relative-(\d+)-([a-z]+)s?$/);
    if (uiFormatMatch) {
      const value = parseInt(uiFormatMatch[1], 10);
      const unitStr = uiFormatMatch[2];
      const now = new Date();
      
      // Map unit string to a single character for processing
      let unitChar;
      switch (unitStr.toLowerCase()) {
        case 'day':
        case 'days': 
          unitChar = 'd';
          break;
        case 'week':
        case 'weeks':
          unitChar = 'w';
          break;
        case 'month':
        case 'months':
          unitChar = 'm';
          break;
        case 'year':
        case 'years':
          unitChar = 'y';
          break;
        default:
          logger.warn(`Unrecognized time unit: ${unitStr} in ${startDateSetting}`);
          return null;
      }
      
      // Apply the time offset
      switch (unitChar) {
        case 'd':
          now.setDate(now.getDate() - value);
          break;
        case 'w':
          now.setDate(now.getDate() - value * 7);
          break;
        case 'm':
          now.setMonth(now.getMonth() - value);
          break;
        case 'y':
          now.setFullYear(now.getFullYear() - value);
          break;
      }
      
      // Format as YYYY-MM-DD HH:MM:SS for Gource
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 00:00:00`;
    } else {
      logger.warn(`Invalid relative date format: ${startDateSetting}`);
      return null; // Invalid format
    }
  } else if (typeof startDateSetting === 'string' && /\d{4}-\d{2}-\d{2}/.test(startDateSetting)) {
    // Assume YYYY-MM-DD if provided, add time for Gource compatibility
    return `${startDateSetting} 00:00:00`;
  }
  return startDateSetting; // Return original if not relative or valid date string
}

// Function to read log file and calculate dynamic parameters
const calculateDynamicParams = async (logFilePath, settings, render) => {
  logger.info(`Calculating dynamic parameters for log: ${logFilePath}`);
  const processedSettings = { ...settings };

  if (!fs.existsSync(logFilePath)) {
    logger.error(`Log file not found for dynamic calculation: ${logFilePath}`);
    throw new Error(`Log file not found: ${logFilePath}`);
  }

  // Calculate effective start and end timestamps from the full log
  let firstTimestamp = null;
  let lastTimestamp = null;

  try {
    // Read the first and last lines efficiently to get the full log range
    const fileContent = fs.readFileSync(logFilePath, 'utf8');
    const lines = fileContent.trim().split('\n');
    if (lines.length > 0) {
      firstTimestamp = parseInt(lines[0].split('|')[0], 10);
      lastTimestamp = parseInt(lines[lines.length - 1].split('|')[0], 10);
    }
  } catch (error) {
    logger.error(`Error reading log file ${logFilePath}: ${error.message}`);
    throw new Error(`Failed to read log file for dynamic calculations: ${error.message}`);
  }

  if (firstTimestamp === null || lastTimestamp === null || isNaN(firstTimestamp) || isNaN(lastTimestamp)) {
    logger.warn(`Could not parse timestamps from log file: ${logFilePath}. Skipping dynamic calculations.`);
    return processedSettings; // Return original settings if timestamps invalid
  }

  const logStartDate = new Date(firstTimestamp * 1000);
  const logEndDate = new Date(lastTimestamp * 1000); // End date is always the last commit in the log
  let effectiveStartDate = logStartDate; // Default effective start is the log's start
  const effectiveEndDate = logEndDate;   // Effective end is always the log's end

  // Process relative startDate marker
  if (typeof settings.startDate === 'string' && settings.startDate.startsWith('relative-')) {
    const calculatedStartDateStr = calculateStartDate(settings.startDate); // Use helper to get YYYY-MM-DD HH:MM:SS
    if (calculatedStartDateStr) {
      const calculatedStartDate = new Date(calculatedStartDateStr.split(' ')[0]); // Parse YYYY-MM-DD part for comparison
      // Use the later of the calculated start date or the log's actual start date
      effectiveStartDate = calculatedStartDate > logStartDate ? calculatedStartDate : logStartDate;
      // Update the setting passed to Gource with the calculated, formatted date string
      processedSettings.startDate = calculatedStartDateStr; 
      logger.info(`Calculated relative start date for Gource: ${processedSettings.startDate}`);
    } else {
      logger.warn(`Could not calculate relative start date for ${settings.startDate}, using log start date.`);
      processedSettings.startDate = null; // Remove invalid marker
    }
  } else if (settings.startDate) {
      // If a fixed start date is provided, use the later of it or the log start
      const providedStartDate = new Date(settings.startDate.split(' ')[0]);
      effectiveStartDate = providedStartDate > logStartDate ? providedStartDate : logStartDate;
      // Ensure fixed date has correct format for Gource if needed
      if (!/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(processedSettings.startDate)) {
           processedSettings.startDate = `${settings.startDate.split(' ')[0]} 00:00:00`;
      }
      logger.info(`Using fixed start date for Gource: ${processedSettings.startDate}`);
  } else {
       // No start date specified, Gource will use the beginning of the log
       processedSettings.startDate = null; // Ensure it's explicitly null if not set
       logger.info('No start date specified, using log start date.');
  }

  // Stop date is generally not needed if we want to visualize up to the last commit
  // If a stopDate was provided (fixed or relative), it should be handled similarly,
  // but for now, we assume visualization runs until the end of the log (effectiveEndDate).
  processedSettings.stopDate = null; // Explicitly nullify stop date unless specifically needed

  // Calculate effective duration based on the determined start/end points for SPD calculation
  const effectiveDurationSeconds = (effectiveEndDate.getTime() - effectiveStartDate.getTime()) / 1000;
  // Ensure duration is at least 1 second to avoid division by zero or nonsensical SPD
  const effectiveDurationDays = Math.max(1 / 86400, effectiveDurationSeconds / 86400); 

  logger.info(`Effective visualization start: ${effectiveStartDate.toISOString()}, end: ${effectiveEndDate.toISOString()}`);
  logger.info(`Effective duration for SPD calc: ${effectiveDurationDays.toFixed(4)} days (${effectiveDurationSeconds.toFixed(0)} seconds)`);

  // Process auto secondsPerDay marker
  if (typeof settings.secondsPerDay === 'string' && settings.secondsPerDay.startsWith('auto-')) {
    const match = settings.secondsPerDay.match(/^auto-(\d+)s$/);
    if (match) {
      const targetVideoSeconds = parseInt(match[1], 10);
      if (effectiveDurationDays > 0 && targetVideoSeconds > 0) {
        // Formula: SPD = TargetVideoSeconds / EffectiveDays
        processedSettings.secondsPerDay = (targetVideoSeconds / effectiveDurationDays).toFixed(4);
        logger.info(`Calculated secondsPerDay for ${targetVideoSeconds}s video: ${processedSettings.secondsPerDay}`);
      } else {
        logger.warn(`Cannot calculate auto secondsPerDay: duration ${effectiveDurationDays.toFixed(4)} days, target ${targetVideoSeconds}s. Using default 1.`);
        processedSettings.secondsPerDay = '1'; // Default to 1 second per day
      }
    } else {
      logger.warn(`Invalid auto secondsPerDay format: ${settings.secondsPerDay}. Using default 1.`);
      processedSettings.secondsPerDay = '1';
    }
  }
  
  // Process dynamic title placeholders
  if (typeof processedSettings.title === 'string') {
     // Use the calculated SPD for duration estimate
     const spd = parseFloat(processedSettings.secondsPerDay || 1);
     const totalVideoSecondsApprox = effectiveDurationDays * spd;
     const durationMinutes = (totalVideoSecondsApprox / 60).toFixed(1);
     // Ensure render object exists for projectName, provide fallback
     const projectName = render ? render.projectName : 'Project'; 
     processedSettings.title = processedSettings.title.replace('{projectName}', projectName)
                                                     .replace('{duration}', durationMinutes);
     logger.info(`Processed title: ${processedSettings.title}`);
  }

  return processedSettings;
};

/**
 * Initialize the database
 */
const init = () => {
  const db = Database.getDatabase(); // Utiliser l'instance partagée
  
  // Check if the renders collection exists
  if (!db.has('renders').value()) {
    db.set('renders', []).write();
  }
};

/**
 * Create necessary directories
 */
const createDirectories = () => {
  const dirs = [exportsDir, tempDir, logsDir];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
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
 * Get all renders
 * @returns {Array} List of renders
 */
const getAllRenders = () => {
  const db = Database.getDatabase(); // Utiliser l'instance partagée
  return db.get('renders').value() || [];
};

/**
 * Get a render by its ID
 * @param {string} id - ID of the render to retrieve
 * @returns {Object|null} Render or null if not found
 */
const getRenderById = (id) => {
  if (!id) return null;
  
  const db = Database.getDatabase(); // Utiliser l'instance partagée
  return db.get('renders')
    .find({ id: id.toString() })
    .value() || null;
};

/**
 * Update a render's status
 * @param {string} renderId - Render ID
 * @param {string} status - New status
 * @param {string} message - Optional message
 * @param {number} progress - Progress percentage
 * @returns {Object|null} Updated render or null if not found
 */
const updateRenderStatus = (renderId, status, message = null, progress = null) => {
  if (!renderId) return null;
  
  const db = Database.getDatabase(); // Utiliser l'instance partagée
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
};

/**
 * Start a new render process
 * @param {string} projectId - ID of the project to render
 * @param {string} customName - Custom name for the render (optional)
 * @param {Object} options - Additional options like render profile ID
 * @returns {Object} Information about the created render
 */
const startRender = async (projectId, customName = null, options = {}) => {
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
  
  const videoFilePath = path.join(exportsDir, fileName);
  const logFilePath = path.join(tempDir, `${id}.log`);
  
  // Handle time period filtering
  if (options.timePeriod && options.timePeriod !== 'all') {
    const { calculateDatesFromPeriod } = require('../../client/src/shared/gourceConfig');
    const dates = calculateDatesFromPeriod(options.timePeriod);
    options.startDate = dates.startDate;
    options.stopDate = dates.stopDate;
  }
  
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
    error: null,
    // Store time filters in the render object
    startDate: options.startDate || null,
    stopDate: options.stopDate || null,
    timePeriod: options.timePeriod || 'all',
    // Store render profile ID if provided
    renderProfileId: options.renderProfileId || null
  };
  
  // Add render to database
  const db = Database.getDatabase();
  db.get('renders')
    .push(render)
    .write();
  
  try {
    // Start the render process asynchronously
    await processRender(project, render, options);
    
    return render;
  } catch (error) {
    // In case of error, update status
    updateRenderStatus(id, 'failed', `Error starting render: ${error.message}`, 0);
    throw error;
  }
};

/**
 * Process a render
 * @param {Object} project - The project associated with the render
 * @param {Object} render - The render object to process
 * @param {Object} options - Additional options for rendering
 * @returns {Object} - The updated render object
 */
const processRender = async (project, render, options = {}) => {
  logger.render(`Starting render process for ID: ${render.id}`);
  
  // Update render status
  render.status = 'processing';
  await updateRenderStatus(render.id, 'processing', 'Processing render...', 0);
  
  try {
    // Verify if the project has repositories assigned
    if (!project.repositoryDetails || project.repositoryDetails.length === 0) {
      logger.error(`Project ${project.name} has no repositories assigned`);
      throw new Error('No repositories assigned to project');
    }
    
    // Create output directories for render and logs
    const outputDir = path.join(exportsDir, render.id.toString());
    const renderLogsDir = path.join(logsDir, render.id.toString());
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      logger.file(`Created output directory: ${outputDir}`);
    }
    
    if (!fs.existsSync(renderLogsDir)) {
      fs.mkdirSync(renderLogsDir, { recursive: true });
      logger.file(`Created logs directory: ${renderLogsDir}`);
    }
    
    logger.render(`Generating combined logs for render ${render.id}`);
    await updateRenderStatus(render.id, 'generating_logs', 'Generating Gource logs...', 10);
    
    // Generate combined logs (always full history)
    const combinedLogPath = await generateCombinedLogs(project.repositoryDetails);
    render.logPath = combinedLogPath;
    await updateRenderStatus(render.id, 'generating_logs', 'Gource logs generated', 20);
    
    // Execute Gource render
    logger.render(`Executing Gource render for ${render.id}`);
    await updateRenderStatus(render.id, 'rendering', 'Generating video...', 30);
    
    const outputPath = path.join(outputDir, 'output.mp4'); // Consistent output path
    
    // --- Corrected Render Profile Selection Logic ---
    const db = Database.getDatabase();
    let selectedProfileId = null;
    let renderProfile = null;

    // 1. Use the profile specified for this specific render if available
    if (render.renderProfileId) {
      selectedProfileId = render.renderProfileId;
      renderProfile = db.get('renderProfiles').find({ id: selectedProfileId }).value();
      if (renderProfile) {
        logger.config(`Using explicitly specified render profile: ${renderProfile.name} (ID: ${selectedProfileId})`);
      } else {
        logger.warn(`Specified render profile ID ${selectedProfileId} not found.`);
        selectedProfileId = null; // Reset if not found
      }
    }

    // 2. If no specific profile used or found, use the project's default profile
    if (!renderProfile && project.renderProfileId) {
      selectedProfileId = project.renderProfileId;
      renderProfile = db.get('renderProfiles').find({ id: selectedProfileId }).value();
      if (renderProfile) {
        logger.config(`Using project's default render profile: ${renderProfile.name} (ID: ${selectedProfileId})`);
      } else {
        logger.warn(`Project's default render profile ID ${selectedProfileId} not found.`);
        selectedProfileId = null; // Reset if not found
      }
    }
    
    // 3. If still no profile, find the application's default profile
    if (!renderProfile) {
      logger.info("No specific or project profile found, looking for application default profile.");
      renderProfile = db.get('renderProfiles').find({ isDefault: true }).value();
      if (renderProfile) {
        selectedProfileId = renderProfile.id;
        logger.config(`Using application default render profile: ${renderProfile.name} (ID: ${selectedProfileId})`);
      } else {
        logger.error(`No default render profile found for render: ${render.id}. Cannot proceed.`);
        throw new Error(`No render profile could be determined for render ${render.id}`);
      }
    }
    // --- End Corrected Logic ---

    // Use the selected render profile's settings
    let initialSettings = { ...(renderProfile.settings || {}) };
    
    // Ensure default dateFormat if missing from loaded profile
    if (!initialSettings.dateFormat) {
      initialSettings.dateFormat = '%Y-%m-%d';
      logger.info(`Profile missing dateFormat, applying default: ${initialSettings.dateFormat}`);
    }
    
    // Merge render-specific dates (if any) into the initial settings *before* dynamic calculation
    if (render.startDate) initialSettings.startDate = render.startDate;
    if (render.stopDate) initialSettings.stopDate = render.stopDate;

    // Calculate dynamic parameters ONCE using the combined settings
    let processedSettings = {};
    try {
        processedSettings = await calculateDynamicParams(render.logPath, initialSettings, render);
        logger.info('Successfully calculated dynamic parameters for Gource execution.');
    } catch (error) {
        logger.error(`Error calculating dynamic parameters: ${error.message}. Render might use incorrect dates/speed.`);
        // Fallback to initial settings if calculation fails
        processedSettings = { ...initialSettings }; 
        // Remove markers if calculation failed
        if (typeof processedSettings.startDate === 'string' && processedSettings.startDate.startsWith('relative-')) {
             processedSettings.startDate = null; 
        }
        if (typeof processedSettings.secondsPerDay === 'string' && processedSettings.secondsPerDay.startsWith('auto-')) {
             processedSettings.secondsPerDay = '1'; // Default SPD
        }
    }

    // Ensure title is set if dynamic processing failed to set it
    if (!processedSettings.title && render.projectName) {
        processedSettings.title = render.projectName;
    }
    
    // Use the render's definitive file path
    const finalOutputFilePath = render.filePath;
    logger.config(`Final output path: ${finalOutputFilePath}`);
    
    await executeGourceRender(render.logPath, render, finalOutputFilePath, processedSettings);
    
    // Update render status to completed
    render.status = 'completed';
    render.progress = 100; // Ensure progress is 100%
    await updateRenderStatus(render.id, 'completed', 'Render completed successfully', 100);
    
    logger.success(`Render ${render.id} completed successfully`);
    return render; // Return the final render object state
  } catch (error) {
    logger.error(`Error during render ${render.id}: ${error.message}`, error);
    // Ensure status is updated even on error
    await updateRenderStatus(render.id, 'failed', error.message || 'An unknown error occurred', 0);
    // Re-throw the error so the controller can catch it
    throw error; 
  }
};

/**
 * Start the Gource render process
 * @param {Object} render - Render object
 * @param {string} logFilePath - Path to the combined log file
 * @param {string} outputDir - Directory for output files (OBSOLETE? Use render.filePath)
 * @returns {Promise<boolean>} - Promise resolving when render completes
 * @deprecated This function seems redundant with processRender and executeGourceRender. Consider removing.
 */
const startGourceRender = async (render, logFilePath, outputDir) => {
  logger.warn('startGourceRender function is deprecated and might be removed.');
  try {
    // Get project
    const db = Database.getDatabase();
    const project = db.get('projects')
      .find({ id: render.projectId })
      .value();
      
    if (!project) {
      logger.error(`Project not found for render: ${render.id}`);
      throw new Error(`Project not found for render: ${render.id}`);
    }
    
    // --- This profile selection logic is now handled correctly in processRender ---
    // --- Keeping it here for reference during cleanup, but it's not actively used ---
    let renderProfileId;
    if (render.renderProfileId) {
      renderProfileId = render.renderProfileId;
    } else {
      renderProfileId = project.renderProfileId;
    }
    
    const renderProfile = renderProfileId 
      ? db.get('renderProfiles').find({ id: renderProfileId }).value() 
      : null;
      
    let finalProfile = renderProfile;
    if (!finalProfile) {
      finalProfile = db.get('renderProfiles').find({ isDefault: true }).value();
    }

    if (!finalProfile) {
      logger.error(`No render profile could be determined for render: ${render.id}`);
      throw new Error(`No render profile found for render`);
    }
    // --- End redundant logic ---

    // Use the profile settings for rendering - passed directly to executeGourceRender from processRender now
    const settings = { ...(finalProfile.settings || {}) }; 
    
    // Calculate dynamic parameters (startDate, secondsPerDay, title)
    let processedSettings = {};
    try {
        processedSettings = await calculateDynamicParams(logFilePath, settings, render);
        logger.info('Successfully calculated dynamic parameters.');
    } catch (error) {
        logger.error(`Error calculating dynamic parameters: ${error.message}. Continuing with base settings.`);
        // Use base settings if dynamic calculation fails
        processedSettings = { ...settings }; 
        // Ensure potential relative/auto markers are removed or defaulted if calculation failed
        if (typeof processedSettings.startDate === 'string' && processedSettings.startDate.startsWith('relative-')) {
             processedSettings.startDate = null; // Remove invalid relative start
        }
        if (typeof processedSettings.secondsPerDay === 'string' && processedSettings.secondsPerDay.startsWith('auto-')) {
             processedSettings.secondsPerDay = '1'; // Default SPD
        }
    }

    // Ensure title is set if dynamic processing failed to set it
    if (!processedSettings.title && render.projectName) {
        processedSettings.title = render.projectName;
    }
    
    // Execute Gource render using the definitive path from the render object
    await executeGourceRender(logFilePath, render, render.filePath, processedSettings);
    
    return true;
  } catch (error) {
    logger.error(`Error in deprecated startGourceRender: ${error.message}`);
    throw error;
  }
};

/**
 * Generates a combined log file from multiple repositories
 * @param {Array} repositories - List of repositories
 * @returns {string} - Path to the combined log file
 */
const generateCombinedLogs = async (repositories) => {
  logger.info(`Generating combined logs for repositories: ${repositories.map(r => r.name).join(', ')}`);
  
  if (!repositories || repositories.length === 0) {
    logger.error('No repositories provided for log generation');
    throw new Error('No repositories provided for log generation');
  }

  // Load RepositoryService if necessary to avoid circular dependency
  if (!RepositoryService) {
    const repoService = require('./repositoryService');
    RepositoryService = repoService;
  }

  // Create a temporary directory for individual logs
  const tempLogsDir = path.join(logsDir, 'temp', Date.now().toString());
  if (!fs.existsSync(tempLogsDir)) {
    fs.mkdirSync(tempLogsDir, { recursive: true });
    logger.file(`Created temporary logs directory: ${tempLogsDir}`);
  }

  // Create output path for the combined log
  const outputPath = path.join(tempLogsDir, 'combined.log');

  // Generate individual logs for each repository
  const logFiles = [];
  const failedRepos = [];

  for (const repo of repositories) {
    try {
      const logFilePath = path.join(tempLogsDir, `${repo.id || repo.name}.log`);

      logger.git(`Generating Gource log for ${repo.name || repo.id}`);
      
      // Check if the repository has a local path
      if (!repo.localPath && !repo.path) {
        logger.warn(`Repository ${repo.name || repo.id} has no local path defined`);
        failedRepos.push(repo.name || repo.id);
        continue;
      }
      
      // Use generateGitLog from RepositoryService directly with repo object
      const result = await RepositoryService.generateGitLog(repo, logFilePath, {});
      
      if (result && !result.isEmpty) {
        logFiles.push(result);
      } else {
        logger.warn(`Log file for ${repo.name || repo.id} is empty`);
        failedRepos.push(repo.name || repo.id);
      }
    } catch (error) {
      logger.error(`Error generating Gource log for ${repo.name || repo.id}: ${error.message}`);
      failedRepos.push(repo.name || repo.id);
    }
  }

  if (logFiles.length === 0) {
    // Clean up the temporary directory
    if (fs.existsSync(tempLogsDir)) {
      fs.rmSync(tempLogsDir, { recursive: true, force: true });
    }
    logger.error('No valid log entries generated for repositories');
    throw new Error('No valid log entries generated for repositories');
  }

  // Merge individual logs into a single file
  await mergeLogs(logFiles, outputPath);

  logger.success(`Combined logs successfully generated: ${outputPath}`);
  return outputPath;
};

/**
 * Merges log files to generate a combined log file
 * @param {Array} logFiles - Array of objects containing log file paths
 * @param {string} outputPath - Path to the output file
 * @returns {Promise<string>} - Path to the combined log file
 */
const mergeLogs = async (logFiles, outputPath) => {
  if (!logFiles || logFiles.length === 0) {
    logger.error('No log files to merge');
    throw new Error('No log files to merge');
  }

  // Filter empty files
  const validLogFiles = logFiles.filter(log => !log.isEmpty);
  
  if (validLogFiles.length === 0) {
    logger.error('All log files are empty');
    throw new Error('All log files are empty');
  }

  // Create output directory if it doesn't exist
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    logger.file(`Created output directory: ${outputDir}`);
  }

  try {
    logger.info(`Merging ${validLogFiles.length} log files into ${outputPath}`);
    
    // Create a temporary file for the unsorted merged logs
    const tempCombinedPath = path.join(outputDir, 'combined_unsorted.log');
    
    // Check if we can use shell commands for better performance
    const useShellCommands = process.platform !== 'win32' || 
                            (process.platform === 'win32' && process.env.SHELL);
    
    if (useShellCommands) {
      // Use shell commands (cat + sort) for better performance with large files
      const logPathsString = validLogFiles
        .map(log => `"${log.path}"`)
        .join(' ');
      
      // Step 1: Concatenate all files and sort by timestamp (first field)
      const catSortCommand = `cat ${logPathsString} | sort -n > "${tempCombinedPath}"`;
      logger.info(`Executing: ${catSortCommand}`);
      
      try {
        execSync(catSortCommand, { shell: true });
      } catch (error) {
        throw new Error(`Error during cat and sort: ${error.message}`);
      }
      
      // Step 2: Remove duplicate entries
      const dedupCommand = `awk '!seen[$0]++' "${tempCombinedPath}" > "${outputPath}"`;
      logger.info(`Removing duplicates: ${dedupCommand}`);
      
      try {
        execSync(dedupCommand, { shell: true });
      } catch (error) {
        throw new Error(`Error during deduplication: ${error.message}`);
      }
    } else {
      // JavaScript fallback for environments without shell access
      logger.info(`Using JavaScript implementation for merging logs`);
      
      // Read and concatenate all files
      let allLines = [];
      
      for (const logFile of validLogFiles) {
        if (!fs.existsSync(logFile.path)) {
          logger.warn(`File ${logFile.path} does not exist, skipping`);
          continue;
        }
        
        const content = fs.readFileSync(logFile.path, 'utf8');
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        logger.info(`File ${logFile.name}: ${lines.length} lines`);
        allLines = allLines.concat(lines);
      }
      
      // Sort by timestamp
      logger.info(`Sorting ${allLines.length} log entries by timestamp`);
      allLines.sort((a, b) => {
        const timestampA = parseInt(a.split('|')[0], 10);
        const timestampB = parseInt(b.split('|')[0], 10);
        return timestampA - timestampB;
      });
      
      // Remove duplicates using Set
      logger.info(`Removing duplicate entries`);
      const uniqueLines = [...new Set(allLines)];
      
      // Write to output file
      fs.writeFileSync(outputPath, uniqueLines.join('\n'), 'utf8');
    }
    
    // Clean up temporary file
    if (fs.existsSync(tempCombinedPath)) {
      fs.unlinkSync(tempCombinedPath);
    }
    
    // Count lines in final file for logging
    const finalFileContent = fs.readFileSync(outputPath, 'utf8');
    const finalLines = finalFileContent.split('\n').filter(line => line.trim() !== '');
    
    logger.success(`Combined log file created with ${finalLines.length} entries`);
    
    // If final file is empty, something went wrong
    if (finalLines.length === 0) {
      logger.error('Combined log file is empty after processing');
      throw new Error('Combined log file is empty after processing');
    }
    
    return outputPath;
  } catch (error) {
    logger.error(`Error merging log files: ${error.message}`);
    throw error;
  }
};

/**
 * Calculate the number of seconds per day for a one-minute render
 * @param {string} logFilePath - Path to log file
 * @returns {number} Number of seconds per day
 */
const calculateSecondsPerDay = (logFilePath) => {
  try {
    // Read log file
    const logContent = fs.readFileSync(logFilePath, 'utf8').split('\n')
      .filter(line => line.trim() !== '');
    
    if (logContent.length === 0) {
      logger.warn('Empty log file, using default value of 1 second per day');
      return 1;
    }
    
    // Extract timestamps (first field of each line, separated by |)
    const timestamps = logContent.map(line => {
      const parts = line.split('|');
      return parts.length > 0 ? parseInt(parts[0], 10) : 0;
    }).filter(ts => !isNaN(ts) && ts > 0);
    
    if (timestamps.length === 0) {
      logger.warn('No valid timestamps found, using default value of 1 second per day');
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
      logger.warn('Project duration too short, using default value of 1 second per day');
      return 1;
    }
    
    // Calculate seconds per day for a one-minute render
    // If the project spans 100 days, we want to show it in 60 seconds
    const secondsPerDay = 60 / totalDays;
    
    // Constraints to ensure reasonable values
    if (secondsPerDay < 0.01) {
      // For very long projects, cap at 0.01 seconds per day (100 days per second)
      logger.info(`Project spans a long time (${totalDays.toFixed(2)} days), limiting to 0.01 seconds per day`);
      return 0.01;
    } else if (secondsPerDay > 10) {
      // For very short projects, cap at 10 seconds per day
      logger.info(`Project spans a short time (${totalDays.toFixed(2)} days), limiting to 10 seconds per day`);
      return 10;
    }
    
    logger.time(`Project spans ${totalDays.toFixed(2)} days, calculated ${secondsPerDay.toFixed(2)} seconds per day`);
    return secondsPerDay;
  } catch (error) {
    logger.error(`Error calculating seconds per day: ${error.message}`);
    return 1; // Default value on error
  }
};

/**
 * Update relative dates in profile settings based on the profile ID
 * @param {Object} settings - Settings object to update
 * @param {string} profileId - ID of the render profile to check
 * @param {Object} profile - The complete profile object
 * @returns {Object} Updated settings with current relative dates if needed
 */
const updateRelativeDatesInSettings = (settings, profileId, profile) => {
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
};

/**
 * Execute Gource render with the selected profile's configuration
 * Ensures all parameters from the profile are correctly passed to Gource
 * @param {string} logFilePath - Path to the combined log file
 * @param {Object} render - Render information
 * @param {string} outputFilePath - Output video file path
 * @param {Object} settings - Gource settings from profile
 * @returns {Promise<void>} - Promise resolving when render completes
 */
const executeGourceRender = async (logFilePath, render, outputFilePath, settings) => {
  try {
    // Validate settings
    if (!settings) {
      throw new Error('No settings provided for Gource render');
    }
    
    // Make sure required settings have defaults
    const framerate = settings.framerate || 60;
    
    // Ensure resolution is explicitly set (fix for resolution not being passed)
    if (!settings.resolution) {
      settings.resolution = '1920x1080'; // Set default resolution if missing
      logger.info(`Resolution not specified, defaulting to 1920x1080`);
    }
    
    // Convert parameters to command line arguments
    const gourceArgs = convertToGourceArgs(settings);
    
    // Log the settings being used
    logger.config(`Using Gource settings: resolution=${settings.resolution}, framerate=${framerate}`);
    
    // Check if viewport argument is missing and add it directly if needed
    const hasViewport = gourceArgs.includes('--viewport');
    let finalGourceArgs = gourceArgs;
    if (!hasViewport && settings.resolution) {
      finalGourceArgs = `--viewport ${settings.resolution} ${gourceArgs}`;
      logger.info(`Added missing viewport argument: ${settings.resolution}`);
    }
    
    // Build the complete Gource command for direct execution (debugging only)
    const directGourceCommand = `gource --log-format custom ${finalGourceArgs} --output-ppm-stream - "${logFilePath}" | ffmpeg -y -i - -r ${framerate} -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "${outputFilePath}"`;
    
    // Afficher la commande complète pour le débogage
    logger.render(`=====================================================`);
    logger.render(`FULL GOURCE COMMAND (for debugging):`);
    logger.render(`${directGourceCommand}`);
    logger.render(`=====================================================`);
    
    // Create temporary file for batch script
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const scriptPath = path.join(tempDir, `gource_render_${render.id}.bat`);
    
    // Escape paths correctly for Windows batch
    const logFile = logFilePath.replace(/\\/g, '\\\\');
    const videoFile = outputFilePath.replace(/\\/g, '\\\\');
    
    // Create the version of args specifically for the batch script
    let finalGourceArgsForBatch = finalGourceArgs;
    if (settings.dateFormat) {
        const escapedDateFormatValue = settings.dateFormat.replace(/%/g, '%%');
        // Construct the arguments to find/replace carefully
        const originalArgWithValue = `--date-format ${settings.dateFormat}`; // Unquoted
        const originalArgWithQuotedValue = `--date-format "${settings.dateFormat}"`; // Quoted
        // Target replacement: escaped value, UNQUOTED for batch script robustness
        const escapedArgWithValue = `--date-format ${escapedDateFormatValue}`; 

        // Prioritize replacing the quoted version if present in the original args
        if (finalGourceArgsForBatch.includes(originalArgWithQuotedValue)) {
             finalGourceArgsForBatch = finalGourceArgsForBatch.replace(originalArgWithQuotedValue, escapedArgWithValue);
             logger.info('Replaced quoted date format with escaped unquoted version for batch.');
        } else if (finalGourceArgsForBatch.includes(originalArgWithValue)) {
             // Otherwise replace the unquoted version
             finalGourceArgsForBatch = finalGourceArgsForBatch.replace(originalArgWithValue, escapedArgWithValue);
             logger.info('Replaced unquoted date format with escaped unquoted version for batch.');
        } else {
             // Log if neither was found - indicates an issue upstream in convertToGourceArgs or mapping
             logger.warn(`Could not find date format argument ('${settings.dateFormat}' or '"${settings.dateFormat}"') in Gource args string to escape for batch file.`);
        }
    }
    
    // Escape fileFilter for batch by adding quotes around its value
    if (settings.fileFilter) {
        const originalFileFilterArg = `--file-filter ${settings.fileFilter}`;
        const escapedFileFilterArg = `--file-filter "${settings.fileFilter}"`; // Add quotes
        if (finalGourceArgsForBatch.includes(originalFileFilterArg)) {
            finalGourceArgsForBatch = finalGourceArgsForBatch.replace(originalFileFilterArg, escapedFileFilterArg);
            logger.info('Quoted fileFilter value for batch script.');
        }
        // Note: No need to handle an already quoted version typically
    }
    
    // Create batch file with appropriate commands using finalGourceArgsForBatch
    const batchScript = [
      '@echo off',
      'echo Starting Gource rendering...',
      `echo Log file: "${logFilePath}"`,
      `echo Output file: "${outputFilePath}"`, 
      '',
      'REM Execute Gource and pipe to FFmpeg',
      // Use the args with escaped date format for the batch file
      `gource --log-format custom ${finalGourceArgsForBatch} --output-ppm-stream - "${logFilePath}" | ffmpeg -y -i - -r ${framerate} -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "${outputFilePath}"`,
      '',
      'if %ERRORLEVEL% neq 0 (',
      '  echo Error: Gource or FFmpeg failed with error code %ERRORLEVEL%',
      '  exit /b %ERRORLEVEL%',
      ') else (',
      '  echo Render completed successfully!',
      '  exit /b 0',
      ')'
    ].join('\r\n');
    
    // Write script to file
    fs.writeFileSync(scriptPath, batchScript);
    
    // Execute batch script
    console.log(`Executing batch script for Gource render: ${scriptPath}`);
    updateRenderStatus(render.id, 'rendering', 'Generating Gource visualization...', 40);
    
    const startTime = Date.now();
    
    // Execute batch script with full path to cmd.exe
    const cmdPath = 'C:\\Windows\\System32\\cmd.exe';
    console.log(`Using cmd.exe at: ${cmdPath}`);
    const process = spawn(cmdPath, ['/c', scriptPath]);
    
    // Track output and error
    let output = '';
    let errorOutput = '';
    
    process.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log(`[Gource] ${chunk.trim()}`);
      
      // Update progress based on output
      if (chunk.includes('Processing:')) {
        const match = chunk.match(/Processing:\s+(\d+)%/);
        if (match && match[1]) {
          const percent = parseInt(match[1]);
          // Map Gource's progress (0-100%) to our range (40-90%)
          const mappedProgress = 40 + (percent * 0.5);
          updateRenderStatus(render.id, 'rendering', `Generating video: ${percent}%`, mappedProgress);
        }
      }
    });
    
    process.stderr.on('data', (data) => {
      const chunk = data.toString();
      errorOutput += chunk;
      console.error(`[Gource Error] ${chunk.trim()}`);
    });
    
    // Handle process completion
    return new Promise((resolve, reject) => {
      process.on('close', (code) => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        // Cleanup script file
        try {
          fs.unlinkSync(scriptPath);
        } catch (err) {
          console.warn(`Failed to delete script file: ${scriptPath}`);
        }
        
        if (code === 0) {
          console.log(`Gource render completed successfully in ${duration}s`);
          // Ensure final status update reflects completion
          updateRenderStatus(render.id, 'completed', 'Render completed successfully', 100);
          resolve();
        } else {
          // Construct a more detailed error message using the captured stderr
          const errorMsg = `Gource/FFmpeg process failed with code ${code} after ${duration}s. Error Output: ${errorOutput || 'No error output captured.'}`;
          console.error(errorMsg);
          // Update status with the detailed error message (limit length for DB/UI)
          const statusMessage = `Render failed (code ${code}): ${errorOutput.substring(0, 500)}${errorOutput.length > 500 ? '...' : ''}`;
          updateRenderStatus(render.id, 'failed', statusMessage, 0);
          reject(new Error(errorMsg)); // Reject promise with the full error
        }
      });

      process.on('error', (err) => {
        // Handle errors in spawning the process itself
        const spawnErrorMsg = `Failed to start Gource/FFmpeg process: ${err.message}`;
        console.error(spawnErrorMsg);
        updateRenderStatus(render.id, 'failed', `Failed to start process: ${err.message}`, 0);
        // Cleanup script file if spawn failed
        try {
          if (fs.existsSync(scriptPath)) {
            fs.unlinkSync(scriptPath);
          }
        } catch (unlinkErr) {
          console.warn(`Failed to delete script file after spawn error: ${scriptPath}`);
        }
        reject(new Error(spawnErrorMsg));
      });
    });
  } catch (error) {
    // Catch synchronous errors during setup
    console.error(`Error setting up Gource render execution: ${error.message}`);
    updateRenderStatus(render.id, 'failed', `Setup error: ${error.message}`, 0);
    // Ensure script file is deleted if setup fails
    const scriptPath = path.join(tempDir, `gource_render_${render.id}.bat`);
    try {
      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
      }
    } catch (unlinkErr) {
      console.warn(`Failed to delete script file after setup error: ${scriptPath}`);
    }
    throw error;
  }
};

/**
 * Delete a render
 * @param {String} id - ID of the render to delete
 * @returns {Boolean} - True if successful
 */
const deleteRender = (id) => {
  // Get render details
  const db = Database.getDatabase();
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
  const logFile = path.join(logsDir, `render_${id}.log`);
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
};

// Create required directories and initialize on module load
logger.start('Initializing Render Service');
createDirectories();
init();

// Import RepositoryService here to avoid circular dependency
RepositoryService = require('./repositoryService');

// Export the module functions
module.exports = {
  getAllRenders,
  getRenderById,
  updateRenderStatus,
  startRender,
  processRender,
  startGourceRender,
  generateCombinedLogs,
  mergeLogs,
  calculateSecondsPerDay,
  updateRelativeDatesInSettings,
  executeGourceRender,
  deleteRender
};