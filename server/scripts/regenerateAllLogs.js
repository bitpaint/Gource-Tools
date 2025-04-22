/**
 * Script to regenerate all Gource logs with GitHub usernames
 * Run with: node scripts/regenerateAllLogs.js
 */

const Database = require('../utils/Database');
const logService = require('../services/logService');
const Logger = require('../utils/Logger');

// Create a logger for this script
const logger = Logger.createComponentLogger('RegenerateLogsScript');

async function regenerateAllLogs() {
  logger.info('Starting regeneration of all repository logs with GitHub usernames');
  
  try {
    // Get all repositories from the database
    const db = Database.getDatabase();
    const repos = db.get('repositories').value() || [];
    
    if (repos.length === 0) {
      logger.warn('No repositories found in the database');
      return;
    }
    
    logger.info(`Found ${repos.length} repositories. Starting log regeneration.`);
    
    // Process repositories sequentially to avoid overwhelming GitHub API
    for (let i = 0; i < repos.length; i++) {
      const repo = repos[i];
      logger.info(`[${i+1}/${repos.length}] Regenerating log for repository: ${repo.name} (${repo.id})`);
      
      try {
        // Generate new log with GitHub usernames
        const result = await logService.generateRepoLog(repo);
        
        if (result.isEmpty) {
          logger.warn(`Generated empty log for ${repo.name}`);
        } else {
          logger.success(`Successfully regenerated log for ${repo.name} with GitHub usernames. Entries: ${result.entryCount}, GitHub mappings: ${result.githubUsernameMappingCount || 0}`);
        }
        
        // Wait a bit between repositories to avoid rate limiting
        if (i < repos.length - 1) {
          logger.info('Waiting 2 seconds before processing next repository...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (repoError) {
        logger.error(`Failed to regenerate log for ${repo.name}: ${repoError.message}`);
        // Continue with next repository
      }
    }
    
    logger.success('Finished regenerating all repository logs');
    
  } catch (error) {
    logger.error(`Error during log regeneration: ${error.message}`);
  }
}

// Run the script
regenerateAllLogs()
  .then(() => {
    logger.info('Script execution completed');
    // Allow time for any background processes to complete
    setTimeout(() => process.exit(0), 5000);
  })
  .catch(err => {
    logger.error(`Unhandled error in script: ${err.message}`);
    process.exit(1);
  }); 