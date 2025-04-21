/**
 * Log Service
 * Manages Gource log generation and caching for repositories and projects
 */

const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises; // Use promises for async file operations
const { execSync } = require('child_process');
const os = require('os');
const { Worker } = require('worker_threads');
const Database = require('../utils/Database');
const Logger = require('../utils/Logger');
const avatarService = require('./avatarService'); // Import AvatarService

// Create a component logger
const logger = Logger.createComponentLogger('LogService');

// Define paths
const baseRepoDir = path.join(__dirname, '../../repos');
const logsDir = path.join(__dirname, '../../logs');
const repoLogsDir = path.join(logsDir, 'repositories');
const projectLogsDir = path.join(logsDir, 'projects');
const tempLogsDir = path.join(logsDir, 'temp');

// Maximum number of concurrent log generations
const NUM_CPUS = os.cpus().length;
const MAX_CONCURRENT_LOGS = Math.max(2, Math.min(NUM_CPUS - 1, 6));

class LogService {
  constructor() {
    this.createDirectories();
  }

  /**
   * Create necessary directories for logs
   */
  createDirectories() {
    const directories = [logsDir, repoLogsDir, projectLogsDir, tempLogsDir]; 
    
    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.file(`Created directory: ${dir}`);
      }
    }
  }

  /**
   * Generate log for a single repository
   * @param {Object|string} repository - Repository object or ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result object with log details
   */
  async generateRepoLog(repository, options = {}) {
    // If ID was passed, get the full repository object
    if (typeof repository === 'string') {
      const db = Database.getDatabase();
      repository = db.get('repositories')
        .find({ id: repository.toString() })
        .value();
      
      if (!repository) {
        logger.error(`Repository with ID ${repository} not found`);
        throw new Error(`Repository not found: ${repository}`);
      }
    }

    logger.git(`Generating Gource log for ${repository.name}`);

    const repoPath = repository.path || repository.localPath;
    if (!repoPath) {
      logger.error('Repository path not specified');
      throw new Error('Repository path not specified');
    }

    if (!fs.existsSync(repoPath)) {
      logger.error(`Repository path does not exist: ${repoPath}`);
      throw new Error(`Repository path does not exist: ${repoPath}`);
    }

    // Define output path
    const outputPath = path.join(repoLogsDir, `${repository.id}.log`);
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      logger.file(`Created output directory: ${outputDir}`);
    }

    // Define temporary path
    const tempLogPath = `${outputPath}.temp.gource`;

    try {
      // Generate log using gource
      logger.info(`Generating log using: gource --output-custom-log for ${repository.name}`);
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
          
      // Process the generated Gource log
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

      // Analyze and update repository with log metadata
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
      
      const firstTimestamp = firstTimestampLine ? parseInt(firstTimestampLine.split('|')[0], 10) : NaN;
      const lastTimestamp = lastTimestampLine ? parseInt(lastTimestampLine.split('|')[0], 10) : NaN;
      
      const firstDate = !isNaN(firstTimestamp) ? new Date(firstTimestamp * 1000) : null;
      const lastDate = !isNaN(lastTimestamp) ? new Date(lastTimestamp * 1000) : null;

      logger.time(`First timestamp in log: ${firstTimestamp} (${firstDate?.toISOString()})`);
      logger.time(`Last timestamp in log: ${lastTimestamp} (${lastDate?.toISOString()})`);
      
      // Update repository in database to show it has a valid log
      const db = Database.getDatabase();
      db.get('repositories')
        .find({ id: repository.id })
        .assign({
          hasValidLog: true,
          logMetadata: {
            lastGenerated: new Date().toISOString(),
            entryCount: finalEntryCount,
            firstTimestamp,
            lastTimestamp,
            fileSize: finalStats.size
          }
        })
        .write();
      
      logger.success(`Log generation complete for ${repository.name}. Size: ${finalStats.size / 1024} KB, Entries: ${finalEntryCount}`);
      
      // After successful log generation, trigger avatar download via AvatarService
      avatarService.triggerAvatarDownloads(outputPath);
      
      return {
        path: outputPath,
        name: repository.name,
        id: repository.id,
        isEmpty: false,
        entryCount: finalEntryCount,
        firstTimestamp,
        lastTimestamp,
        fileSize: finalStats.size
      };

    } catch (error) {
      logger.error(`Error generating log for ${repository.name}: ${error.message}`);
      
      // Mark the repository as having an invalid log
      const db = Database.getDatabase();
      db.get('repositories')
        .find({ id: repository.id })
        .assign({
          hasValidLog: false,
          logError: error.message
        })
        .write();
        
      // Clean up temporary file if it exists on error
      if (fs.existsSync(tempLogPath)) {
        try { fs.unlinkSync(tempLogPath); } catch (e) { /* Ignore cleanup error */ }
      }
      
      throw error;
    }
  }

  /**
   * Generate logs for multiple repositories in parallel
   * @param {Array<string|Object>} repositories - Array of repository objects or IDs
   * @param {Object} options - Options for log generation
   * @returns {Promise<Array>} Results of log generation
   */
  async generateRepoLogs(repositories, options = {}) {
    logger.info(`Generating logs for ${repositories.length} repositories`);

    // If IDs were passed, get the full repository objects
    let repoObjects = [];
    if (repositories.length > 0 && typeof repositories[0] === 'string') {
      const db = Database.getDatabase();
      const allRepos = db.get('repositories').value();
      
      // Filter repositories that exist in database
      repoObjects = repositories
        .map(id => allRepos.find(r => r.id === id.toString()))
        .filter(r => r !== undefined);
      
      if (repoObjects.length !== repositories.length) {
        logger.warn(`Some repository IDs were not found in database`);
      }
    } else {
      repoObjects = repositories;
    }
    
    if (repoObjects.length === 0) {
      logger.warn('No valid repositories to process');
      return [];
    }

    // Process repositories in batches to limit concurrency
    const batchSize = Math.min(MAX_CONCURRENT_LOGS, repoObjects.length);
    logger.info(`Processing ${repoObjects.length} repositories in batches of ${batchSize}`);

    const results = [];
    const errors = [];

    // Process in batches
    for (let i = 0; i < repoObjects.length; i += batchSize) {
      const batch = repoObjects.slice(i, i + batchSize);
      logger.info(`Processing batch ${i/batchSize + 1} with ${batch.length} repositories`);

      // Process batch in parallel
      const batchPromises = batch.map(repo => {
        return this.generateRepoLog(repo, options)
          .then(result => {
            results.push(result);
            return result;
          })
          .catch(error => {
            errors.push({ repoId: repo.id, name: repo.name, error: error.message });
            logger.error(`Error generating log for ${repo.name}: ${error.message}`);
            return null;
          });
      });

      // Wait for all in the batch to complete before starting next batch
      await Promise.all(batchPromises);
    }

    logger.info(`Completed generating logs for ${results.length} repositories. Failed: ${errors.length}`);
    return { results, errors };
  }

  /**
   * Generate combined log for a project
   * @param {Object|string} project - Project object or ID
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Path to combined log file
   */
  async generateProjectLog(project, options = {}) {
    // If ID was passed, get the full project object
    if (typeof project === 'string') {
      const db = Database.getDatabase();
      project = db.get('projects')
        .find({ id: project.toString() })
        .value();
      
      if (!project) {
        logger.error(`Project with ID ${project} not found`);
        throw new Error(`Project not found: ${project}`);
      }
    }

    logger.info(`Generating combined log for project: ${project.name}`);

    if (!project.repositories || project.repositories.length === 0) {
      logger.error(`Project ${project.name} has no repositories`);
      throw new Error(`Project has no repositories`);
    }

    // Get repository details
    const db = Database.getDatabase();
    const allRepos = db.get('repositories').value();
    
    const projectRepos = project.repositories
      .map(id => allRepos.find(r => r.id === id.toString()))
      .filter(r => r !== undefined);
      
    if (projectRepos.length === 0) {
      logger.error(`Project ${project.name} has no valid repositories`);
      throw new Error(`Project has no valid repositories`);
    }

    // Check if all repositories have valid logs, generate if needed
    const reposWithoutLogs = projectRepos.filter(repo => !repo.hasValidLog);
    
    if (reposWithoutLogs.length > 0) {
      logger.info(`${reposWithoutLogs.length} repositories need log generation`);
      await this.generateRepoLogs(reposWithoutLogs, options);
    }

    // Define output path for the combined log
    const outputPath = path.join(projectLogsDir, `${project.id}.log`);
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      logger.file(`Created output directory: ${outputDir}`);
    }

    // Get all repository logs
    const logFiles = [];
    const failedRepos = [];

    for (const repo of projectRepos) {
      const repoLogPath = path.join(repoLogsDir, `${repo.id}.log`);
      
      if (!fs.existsSync(repoLogPath)) {
        logger.warn(`Log file does not exist for repository ${repo.name}`);
        failedRepos.push(repo.name);
        continue;
      }
      
      const stats = fs.statSync(repoLogPath);
      if (stats.size === 0) {
        logger.warn(`Log file is empty for repository ${repo.name}`);
        failedRepos.push(repo.name);
        continue;
      }
      
      logFiles.push({
        path: repoLogPath,
        name: repo.name,
        id: repo.id
      });
    }

    if (logFiles.length === 0) {
      logger.error(`No valid log files found for project ${project.name}`);
      throw new Error(`No valid log files found for project`);
    }

    // Merge logs
    await this.mergeLogs(logFiles, outputPath);

    // Update project in database
    const logFileStats = fs.statSync(outputPath);
    db.get('projects')
      .find({ id: project.id })
      .assign({
        logPath: outputPath,
        logLastGenerated: new Date().toISOString(),
        logFileSize: logFileStats.size
      })
      .write();

    logger.success(`Combined log file generated for project ${project.name}: ${outputPath}`);
    
    // After successful log generation, trigger avatar download via AvatarService
    avatarService.triggerAvatarDownloads(outputPath);
    
    return outputPath;
  }

  /**
   * Merge multiple log files into a single combined log
   * @param {Array} logFiles - Array of log file objects
   * @param {string} outputPath - Path for output file
   * @returns {Promise<string>} Path to the combined log file
   */
  async mergeLogs(logFiles, outputPath) {
    if (!logFiles || logFiles.length === 0) {
      logger.error('No log files to merge');
      throw new Error('No log files to merge');
    }

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      logger.file(`Created output directory: ${outputDir}`);
    }

    try {
      logger.info(`Merging ${logFiles.length} log files into ${outputPath}`);
      
      // Create a temporary file for the unsorted merged logs
      const tempCombinedPath = path.join(outputDir, 'combined_unsorted.log');
      
      // Check if we can use shell commands for better performance
      const useShellCommands = process.platform !== 'win32' || 
                              (process.platform === 'win32' && process.env.SHELL);
      
      if (useShellCommands) {
        // Use shell commands (cat + sort) for better performance with large files
        const logPathsString = logFiles
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
        
        for (const logFile of logFiles) {
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
  }

  /**
   * Check if a project needs log regeneration
   * @param {Object|string} project - Project object or ID
   * @returns {Promise<boolean>} Whether the project needs log regeneration
   */
  async isProjectLogValid(project) {
    // If ID was passed, get the full project object
    if (typeof project === 'string') {
      const db = Database.getDatabase();
      project = db.get('projects')
        .find({ id: project.toString() })
        .value();
      
      if (!project) {
        logger.error(`Project with ID ${project} not found`);
        throw new Error(`Project not found: ${project}`);
      }
    }

    // If no log path or never generated, it's invalid
    if (!project.logPath || !project.logLastGenerated) {
      return false;
    }

    // Check if the log file exists
    if (!fs.existsSync(project.logPath)) {
      return false;
    }

    // Get repository details
    const db = Database.getDatabase();
    const allRepos = db.get('repositories').value();
    
    const projectRepos = project.repositories
      .map(id => allRepos.find(r => r.id === id.toString()))
      .filter(r => r !== undefined);
      
    // If no valid repositories, log is invalid
    if (projectRepos.length === 0) {
      return false;
    }

    // Check if any repository was updated after the log generation
    const logGeneratedDate = new Date(project.logLastGenerated);
    
    for (const repo of projectRepos) {
      // If repository has no log or log is invalid, project log is invalid
      if (!repo.hasValidLog) {
        return false;
      }
      
      // If repository was updated after log generation, project log is invalid
      if (repo.lastUpdated && new Date(repo.lastUpdated) > logGeneratedDate) {
        return false;
      }
    }

    // If no issues found, log is valid
    return true;
  }

  /**
   * Ensure a project has a valid log, generating it if needed
   * @param {Object|string} project - Project object or ID
   * @param {Object} options - Additional options
   * @returns {Promise<string>} Path to the project log file
   */
  async ensureProjectLog(project, options = {}) {
    // If ID was passed, get the full project object
    if (typeof project === 'string') {
      const db = Database.getDatabase();
      project = db.get('projects')
        .find({ id: project.toString() })
        .value();
      
      if (!project) {
        logger.error(`Project with ID ${project} not found`);
        throw new Error(`Project not found: ${project}`);
      }
    }

    // Check if log is valid
    const isValid = await this.isProjectLogValid(project);
    
    if (isValid) {
      logger.info(`Project ${project.name} already has a valid log: ${project.logPath}`);
      return project.logPath;
    }

    // Generate new log
    logger.info(`Project ${project.name} needs log regeneration`);
    return this.generateProjectLog(project, options);
  }
}

// Create and export a singleton instance
module.exports = new LogService(); 