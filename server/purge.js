/**
 * Purge script for Gource-Tools
 * 
 * This script:
 * 1. Cleans the database (repos, projects, renders)
 * 2. Deletes repository folders
 * 3. Removes logs and exports
 * 4. Preserves API keys and settings
 */

const fs = require('fs');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { defaultGourceConfig } = require('./config/defaultGourceConfig');

console.log('🧹 Starting Gource-Tools purge...');

// Paths to folders that need cleaning
const basePath = path.resolve(__dirname, '../');
const reposDir = path.join(basePath, 'repos');
const logsDir = path.join(basePath, 'logs');
const exportsDir = path.join(basePath, 'exports');
const tempDir = path.join(basePath, 'temp');
const dbPath = path.join(basePath, 'db/db.json');

// Function to delete a folder and all its contents recursively
function cleanDirectory(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`📂 Directory ${directory} doesn't exist, creating...`);
    fs.mkdirSync(directory, { recursive: true });
    return;
  }

  try {
    // Read directory contents
    const files = fs.readdirSync(directory);
    
    // Loop through and delete each file/folder
    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Delete the folder and its contents recursively
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`🗑️ Directory deleted: ${fullPath}`);
      } else {
        // Delete the file
        fs.unlinkSync(fullPath);
        console.log(`🗑️ File deleted: ${fullPath}`);
      }
    }
    
    console.log(`✅ Directory cleaned: ${directory}`);
  } catch (error) {
    console.error(`❌ Error cleaning directory ${directory}:`, error);
  }
}

// Clean the database while preserving settings
function cleanDatabase() {
  if (!fs.existsSync(dbPath)) {
    console.log(`📄 Database file doesn't exist: ${dbPath}`);
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Create an empty DB file with basic structure
    const emptyDb = {
      repositories: [],
      projects: [],
      renderProfiles: [defaultGourceConfig],
      renders: [],
      settings: {}
    };
    
    fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2));
    console.log(`✅ New database created with default configuration`);
    return;
  }

  try {
    // Load the database
    const adapter = new FileSync(dbPath);
    const db = low(adapter);
    
    // Save settings and API keys
    const settings = db.get('settings').value() || {};
    
    // Get default profile if it exists
    const defaultProfile = db.get('renderProfiles')
      .find({ isDefault: true })
      .value();
    
    // Reset the database
    db.set('repositories', [])
      .set('projects', [])
      .set('renders', [])
      .set('renderProfiles', defaultProfile ? [defaultProfile] : [defaultGourceConfig])
      .write();
    
    // Restore settings
    db.set('settings', settings).write();
    
    console.log(`✅ Database cleaned, ${Object.keys(settings).length} settings preserved`);
    
    // Display preserved API keys
    if (settings.githubToken) {
      console.log(`🔑 GitHub token preserved: ${settings.githubToken.substring(0, 4)}...${settings.githubToken.substring(settings.githubToken.length - 4)}`);
    }
  } catch (error) {
    console.error(`❌ Error cleaning database:`, error);
  }
}

// Execute cleanup
console.log('🔄 Cleaning directories...');
cleanDirectory(reposDir);
cleanDirectory(logsDir);
cleanDirectory(exportsDir);
cleanDirectory(tempDir);

console.log('🔄 Cleaning database...');
cleanDatabase();

console.log('✅ Purge complete! The application has been reset while preserving API keys and settings.');
console.log('🚀 You can restart the server to apply the changes.'); 