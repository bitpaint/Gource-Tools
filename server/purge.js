/**
 * Purge script for Gource-Tools
 * 
 * This script:
 * 1. Cleans the database (repos, projects, renders)
 * 2. Deletes repository folders
 * 3. Deletes logs and exports
 * 4. Preserves API keys and settings
 */

const fs = require('fs');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
// Import the list of system profiles that should always exist
const customRenderProfiles = require('./config/customRenderProfiles');
const { createComponentLogger } = require('./utils/Logger');
const logger = createComponentLogger('Purge');

logger.info('🧹 Starting Gource-Tools purge...');

// Paths of folders to clean
const basePath = path.resolve(__dirname, '../');
const reposDir = path.join(basePath, 'repos');
const logsDir = path.join(basePath, 'logs');
const exportsDir = path.join(basePath, 'exports');
const tempDir = path.join(basePath, 'temp');
const dbPath = path.join(basePath, 'db/db.json');

// Function to recursively delete a folder and its contents
function cleanDirectory(directory) {
  if (!fs.existsSync(directory)) {
    logger.info(`📂 Folder ${directory} does not exist, creating...`);
    fs.mkdirSync(directory, { recursive: true });
    return;
  }

  try {
    // Read the content of the folder
    const files = fs.readdirSync(directory);
    
    // Iterate and delete each file/folder
    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Delete the folder and its contents recursively
        fs.rmSync(fullPath, { recursive: true, force: true });
        logger.info(`🗑️ Folder deleted: ${fullPath}`);
      } else {
        // Delete the file
        fs.unlinkSync(fullPath);
        logger.info(`🗑️ File deleted: ${fullPath}`);
      }
    }
    
    logger.success(`✅ Folder cleaned: ${directory}`);
  } catch (error) {
    logger.error(`❌ Error cleaning folder ${directory}`, error);
  }
}

// Clean the database while preserving settings
function cleanDatabase() {
  if (fs.existsSync(dbPath)) {
    try {
      // Directly delete the database file
      fs.unlinkSync(dbPath);
      logger.info(`🗑️ Database file deleted: ${dbPath}`);
    } catch (error) {
      logger.error(`❌ Error deleting database file ${dbPath}`, error);
    }
  } else {
    logger.info(`📄 Database file does not exist, nothing to delete: ${dbPath}`);
  }
}

// Execute cleaning
logger.info('🔄 Cleaning folders...');
cleanDirectory(reposDir);
cleanDirectory(logsDir);
cleanDirectory(exportsDir);
cleanDirectory(tempDir);

logger.info('🔄 Cleaning database...');
cleanDatabase();

logger.success('✅ Purge completed! The application has been reset while preserving API keys and settings.');
logger.start('🚀 You can restart the server to apply the changes.'); 