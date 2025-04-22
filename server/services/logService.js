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
const axios = require('axios'); // For GitHub API requests
const Database = require('../utils/Database');
const Logger = require('../utils/Logger');
const avatarService = require('./avatarService'); // Import AvatarService
const settingsService = require('./settingsService'); // For GitHub token

// Create a component logger
const logger = Logger.createComponentLogger('LogService');

// Define paths
const baseRepoDir = path.join(__dirname, '../../repos');
const logsDir = path.join(__dirname, '../../logs');
const repoLogsDir = path.join(logsDir, 'repositories');
const projectLogsDir = path.join(logsDir, 'projects');
const tempLogsDir = path.join(logsDir, 'temp');
const mappingDir = path.join(logsDir, 'mappings'); // Store GitHub username mappings

// Maximum number of concurrent log generations
const NUM_CPUS = os.cpus().length;
const MAX_CONCURRENT_LOGS = Math.max(2, Math.min(NUM_CPUS - 1, 6));

// Cache for contributor mappings: repoId -> {gitName -> githubUsername}
const contributorMappingCache = new Map();

class LogService {
  constructor() {
    this.createDirectories();
  }

  /**
   * Create necessary directories for logs
   */
  createDirectories() {
    const directories = [logsDir, repoLogsDir, projectLogsDir, tempLogsDir, mappingDir]; 
    
    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.file(`Created directory: ${dir}`);
      }
    }
  }

  /**
   * Get GitHub API token from settings
   * @returns {string|null} GitHub token or null
   */
  getGitHubToken() {
    try {
      const settings = settingsService.getSettings();
      return settings && settings.githubToken ? settings.githubToken : null;
    } catch (error) {
      logger.warn(`Error getting GitHub token: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract GitHub username and repo name from a Git remote URL
   * @param {string} remoteUrl - Git remote URL to parse
   * @returns {Object|null} Object with owner and repo names, or null if cannot parse
   */
  parseGitHubRepoUrl(remoteUrl) {
    if (!remoteUrl) return null;

    try {
      // Handle various GitHub URL formats
      let match;
      
      // HTTPS format
      match = remoteUrl.match(/https:\/\/github\.com\/([^\/]+)\/([^\/\.]+)(?:\.git)?/);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
      
      // SSH format
      match = remoteUrl.match(/git@github\.com:([^\/]+)\/([^\/\.]+)(?:\.git)?/);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
      
      // GitHub CLI format
      match = remoteUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)(?:\.git)?/);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
    } catch (error) {
      logger.warn(`Error parsing GitHub repo URL: ${error.message}`);
    }
    
    return null;
  }

  /**
   * Get remote GitHub URL for a repository
   * @param {string} repoPath - Path to the local repository
   * @returns {string|null} GitHub URL or null if not found
   */
  getRepoGitHubUrl(repoPath) {
    try {
      // Windows-compatible approach without relying on grep/awk
      // First try to get the origin URL directly
      let originCmd = `"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "cd '${repoPath}'; git remote get-url origin"`;
      try {
        const originOutput = execSync(originCmd, { encoding: 'utf8', timeout: 10000 }).trim();
        if (originOutput && originOutput.includes('github.com')) {
          logger.info(`Found GitHub URL from origin: ${originOutput}`);
          return originOutput;
        }
      } catch (originError) {
        // Ignore errors, try the next approach
        logger.debug(`Could not get origin URL: ${originError.message}`);
      }
      
      // If origin doesn't work or isn't a GitHub URL, list all remotes
      const remotesCmd = `"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "cd '${repoPath}'; git remote"`;
      const remotes = execSync(remotesCmd, { encoding: 'utf8', timeout: 10000 })
        .trim()
        .split('\n')
        .map(r => r.trim())
        .filter(r => r);
      
      logger.debug(`Found remotes: ${remotes.join(', ')}`);
      
      // Try each remote until we find a GitHub URL
      for (const remote of remotes) {
        try {
          const remoteUrlCmd = `"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "cd '${repoPath}'; git remote get-url ${remote}"`;
          const remoteUrl = execSync(remoteUrlCmd, { encoding: 'utf8', timeout: 5000 }).trim();
          
          if (remoteUrl && remoteUrl.includes('github.com')) {
            logger.info(`Found GitHub URL from remote '${remote}': ${remoteUrl}`);
            return remoteUrl;
          }
        } catch (remoteError) {
          // Continue to the next remote
          logger.debug(`Error getting URL for remote '${remote}': ${remoteError.message}`);
        }
      }
      
      // If we get here, no GitHub remotes were found
      logger.info(`No GitHub remotes found in repository at ${repoPath}`);
    } catch (error) {
      logger.warn(`Could not determine GitHub URL for ${repoPath}: ${error.message}`);
    }
    
    return null;
  }

  /**
   * Load existing contributor mapping for a repository
   * @param {string} repoId - Repository ID
   * @returns {Object} Mapping of Git author names/emails to GitHub usernames
   */
  loadContributorMapping(repoId) {
    // Check in-memory cache first
    if (contributorMappingCache.has(repoId)) {
      return contributorMappingCache.get(repoId);
    }
    
    const mappingPath = path.join(mappingDir, `${repoId}.json`);
    
    if (fs.existsSync(mappingPath)) {
      try {
        const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        contributorMappingCache.set(repoId, mapping);
        return mapping;
      } catch (error) {
        logger.warn(`Error loading contributor mapping for ${repoId}: ${error.message}`);
      }
    }
    
    return {};
  }
  
  /**
   * Save contributor mapping for a repository
   * @param {string} repoId - Repository ID
   * @param {Object} mapping - Mapping of Git author names/emails to GitHub usernames
   */
  saveContributorMapping(repoId, mapping) {
    try {
      const mappingPath = path.join(mappingDir, `${repoId}.json`);
      fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), 'utf8');
      contributorMappingCache.set(repoId, mapping);
    } catch (error) {
      logger.warn(`Error saving contributor mapping for ${repoId}: ${error.message}`);
    }
  }

  /**
   * Get committer name -> GitHub username mapping for a repository
   * @param {Object} repository - Repository object
   * @returns {Promise<Object>} Mapping of Git author names to GitHub usernames
   */
  async getGitHubUsernameMapping(repository) {
    const repoId = repository.id;
    
    // Load existing mapping
    const mapping = this.loadContributorMapping(repoId);
    
    // Check if we have GitHub remotes
    const repoPath = repository.path || repository.localPath;
    const remoteUrl = this.getRepoGitHubUrl(repoPath);
    
    if (!remoteUrl) {
      logger.info(`No GitHub remote found for ${repository.name}, using existing mapping`);
      return mapping;
    }
    
    const repoInfo = this.parseGitHubRepoUrl(remoteUrl);
    if (!repoInfo) {
      logger.info(`Could not parse GitHub repo URL for ${repository.name}: ${remoteUrl}`);
      return mapping;
    }
    
    const { owner, repo } = repoInfo;
    logger.info(`Detected GitHub repo: ${owner}/${repo} for ${repository.name}`);
    
    try {
      // Check if we have a GitHub token
      const token = this.getGitHubToken();
      const headers = token ? { Authorization: `token ${token}` } : {};
      
      // Get GitHub contributors - ONE SINGLE API CALL
      const url = `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`;
      logger.info(`Fetching GitHub contributors from: ${url}`);
      
      const response = await axios.get(url, { headers });
      const contributors = response.data;
      
      if (!Array.isArray(contributors)) {
        logger.warn(`GitHub API response is not an array: ${JSON.stringify(response.data).substring(0, 200)}...`);
        return mapping;
      }
      
      logger.info(`Found ${contributors.length} GitHub contributors for ${repository.name}`);
      
      // Get git log with author info for email mapping
      const gitLogCmd = `"C:\\Program Files\\PowerShell\\7\\pwsh.exe" -Command "cd '${repoPath}'; git log --pretty=format:'%an|%ae' | sort | Get-Unique"`;
      const gitAuthors = execSync(gitLogCmd, { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [name, email] = line.split('|');
          return { name: name.trim(), email: email.trim() };
        });
      
      logger.info(`Found ${gitAuthors.length} Git authors in the repository`);
      
      // Map GitHub login -> avatar_url for pre-downloading
      const avatarUrls = {};
      // Create a Set of GitHub logins for efficient lookup
      const gitHubLoginsSet = new Set();
      
      contributors.forEach(contributor => {
        if (contributor.login) {
          // Store login in lowercase for case-insensitive matching
          gitHubLoginsSet.add(contributor.login.toLowerCase());
          
          if (contributor.avatar_url) {
            avatarUrls[contributor.login] = contributor.avatar_url;
          }
        }
      });
      
      // Dump avatar URLs to a file for later use (optionally)
      const avatarPath = path.join(mappingDir, `${repoId}_avatars.json`);
      fs.writeFileSync(avatarPath, JSON.stringify(avatarUrls, null, 2), 'utf8');
      
      // Update mapping with GitHub usernames for commits - NO EXTRA API CALLS
      let updatedMapping = { ...mapping };
      
      // Process each Git author to find their GitHub username
      for (const author of gitAuthors) {
        let foundMatch = false;
        
        // Method 1: Extract GitHub username from noreply email
        const githubEmailMatch = author.email.match(/^(\d+\+)?([^@]+)@users\.noreply\.github\.com$/i);
        if (githubEmailMatch) {
          const extractedLogin = githubEmailMatch[2];
          // Check if this login exists in our contributors
          if (gitHubLoginsSet.has(extractedLogin.toLowerCase())) {
            // Find the actual login with correct casing
            const actualLogin = contributors.find(c => 
              c.login.toLowerCase() === extractedLogin.toLowerCase()
            )?.login || extractedLogin;
            
            updatedMapping[author.name] = actualLogin;
            updatedMapping[author.email] = actualLogin;
            logger.debug(`Mapped Git author "${author.name}" to GitHub login "${actualLogin}" (via noreply email pattern)`);
            foundMatch = true;
          }
        }
        
        // Skip other methods if we found a match
        if (foundMatch) continue;
        
        // Method 2: Try normalized name match
        // "John Doe" -> "johndoe"
        const normalizedName = author.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedName && normalizedName.length > 2) {
          // Find contributors with matching normalized name
          for (const contributor of contributors) {
            if (!contributor.login) continue;
            
            if (contributor.login.toLowerCase() === normalizedName) {
              updatedMapping[author.name] = contributor.login;
              updatedMapping[author.email] = contributor.login;
              logger.debug(`Mapped Git author "${author.name}" to GitHub login "${contributor.login}" (via normalized name)`);
              foundMatch = true;
              break;
            }
          }
        }
        
        // Skip other methods if we found a match
        if (foundMatch) continue;
        
        // Method 3: Try email username part
        const emailUsername = author.email.split('@')[0].toLowerCase();
        if (emailUsername && emailUsername.length > 2) {
          // Find contributors with matching email username
          for (const contributor of contributors) {
            if (!contributor.login) continue;
            
            if (contributor.login.toLowerCase() === emailUsername) {
              updatedMapping[author.name] = contributor.login;
              updatedMapping[author.email] = contributor.login;
              logger.debug(`Mapped Git author "${author.name}" to GitHub login "${contributor.login}" (via email username)`);
              foundMatch = true;
              break;
            }
          }
        }
      }
      
      // Save the updated mapping
      this.saveContributorMapping(repoId, updatedMapping);
      logger.success(`Updated GitHub username mapping for ${repository.name}: ${Object.keys(updatedMapping).length} mappings`);
      
      return updatedMapping;
    } catch (error) {
      logger.error(`Error fetching GitHub contributors for ${repository.name}: ${error.message}`);
      return mapping;
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
      // Get GitHub username mapping before generating the log
      logger.info(`Fetching GitHub username mapping for ${repository.name}`);
      const githubMapping = await this.getGitHubUsernameMapping(repository);
      const mappingSize = Object.keys(githubMapping).length;
      logger.info(`Using GitHub mapping with ${mappingSize} entries for ${repository.name}`);

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
          let gitUser = parts[1];
          let type = parts[2];
          let filePath = parts[3];

          // Apply GitHub username mapping if available
          let finalUser = githubMapping[gitUser] || gitUser;
          
          // Always prepend the repo name prefix.
          // Remove leading '/' from Gource path if present, then add prefix.
          let cleanedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
          let finalFilePath = `${repoNamePrefix}${cleanedFilePath}`;
          
          processedLines.push(`${timestamp}|${finalUser}|${type}|${finalFilePath}`);
        } else {
          logger.warn(`Skipping malformed line in Gource output: ${line}`);
        }
      }
      
      // Write processed lines to the final output path
      fs.writeFileSync(outputPath, processedLines.join('\n'), 'utf8');
      logger.info(`Processed Gource log with GitHub usernames saved to: ${outputPath}`);

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
            fileSize: finalStats.size,
            githubUsernameMappingCount: mappingSize
          }
        })
        .write();
      
      logger.success(`Log generation complete for ${repository.name}. Size: ${finalStats.size / 1024} KB, Entries: ${finalEntryCount}, GitHub usernames: ${mappingSize}`);
      
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
        fileSize: finalStats.size,
        githubUsernameMappingCount: mappingSize
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