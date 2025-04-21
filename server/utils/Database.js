/**
 * Database Utility
 * Provides common methods for database access and operations
 */

const path = require('path');
const fs = require('fs'); // Import fs module
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const Logger = require('./Logger'); // Import Logger

const logger = Logger.createComponentLogger('Database');

// Define paths at the top for clarity
const rootDir = path.join(__dirname, '../../');
const dbPath = path.join(rootDir, 'db/db.json');
// const avatarsPath = path.join(rootDir, 'avatars'); // Moved to server/index.js
const dbDir = path.dirname(dbPath);

class Database {
  constructor() {
    this.dbPath = dbPath; // Use defined path

    // Ensure ONLY the database directory exists (other dirs handled in index.js)
    // const directoriesToEnsure = [dbDir, avatarsPath]; // OLD
    const directoriesToEnsure = [dbDir]; // Keep only dbDir
    directoriesToEnsure.forEach(dir => {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          logger.info(`Created required directory: ${dir}`);
        }
      } catch (error) {
        logger.error(`FATAL: Failed to create required directory: ${dir}`, error);
        process.exit(1);
      }
    });

    // Initialize the single database instance here
    try {
      this.adapter = new FileSync(this.dbPath);
      this.db = low(this.adapter);
      logger.success('Database instance initialized successfully.');
      this.initializeDatabase(); // Ensure collections exist on startup
    } catch (error) {
      logger.error('FATAL: Failed to initialize database!', error);
      // Consider exiting the process if DB init fails
      process.exit(1);
    }
  }

  /**
   * Get the shared database instance
   * @returns {Object} Shared Database instance
   */
  getDatabase() {
    // Return the single instance initialized in the constructor
    return this.db;
  }

  /**
   * Ensure all required collections exist in the database
   * Uses the shared db instance.
   */
  initializeDatabase() {
    const db = this.getDatabase(); // Use the shared instance
    
    // Ensure all required collections exist
    const collections = [
      'repositories', 
      'projects', 
      'renderProfiles',
      'renders',
      'settings'
    ];
    
    let changed = false;
    collections.forEach(collection => {
      if (!db.has(collection).value()) {
        db.set(collection, []).write(); // Write is needed here for initialization
        logger.info(`Initialized missing collection: ${collection}`);
        changed = true;
      }
    });
    if (changed) {
        logger.success('Database collections initialized/verified.');
    }
  }

  /**
   * Get a collection from the database
   * @param {string} collectionName - Name of the collection
   * @returns {Array} Collection data
   */
  getCollection(collectionName) {
    const db = this.getDatabase(); // Use the shared instance
    return db.get(collectionName).value() || [];
  }

  /**
   * Get an item from a collection by ID
   * @param {string} collectionName - Name of the collection
   * @param {string} id - ID of the item to retrieve
   * @returns {Object|null} Item or null if not found
   */
  getItemById(collectionName, id) {
    if (!id) return null;
    
    const db = this.getDatabase(); // Use the shared instance
    return db.get(collectionName)
      .find({ id: id.toString() })
      .value() || null;
  }

  /**
   * Add an item to a collection
   * @param {string} collectionName - Name of the collection
   * @param {Object} item - Item to add
   * @returns {Object} Added item
   */
  addItem(collectionName, item) {
    const db = this.getDatabase(); // Use the shared instance
    
    // Perform the operation and then write
    const result = db.get(collectionName)
      .push(item)
      .value(); // Get the result of the operation
    db.write(); // Write the changes to the file system
    
    // Return the added item (last item in the result array)
    return result && result.length > 0 ? result[result.length - 1] : null;
  }

  /**
   * Update an item in a collection
   * @param {string} collectionName - Name of the collection
   * @param {string} id - ID of the item to update
   * @param {Object} updates - Update fields
   * @returns {Object|null} Updated item or null if not found
   */
  updateItem(collectionName, id, updates) {
    if (!id) return null;
    
    const db = this.getDatabase(); // Use the shared instance
    const itemChain = db.get(collectionName).find({ id: id.toString() });
    
    if (!itemChain.value()) return null;
    
    // Perform the update and then write
    const updatedItem = itemChain.assign(updates).value();
    db.write(); // Write the changes to the file system
    
    return updatedItem;
  }

  /**
   * Remove an item from a collection
   * @param {string} collectionName - Name of the collection
   * @param {string} id - ID of the item to remove
   * @returns {boolean} true if removed, false if not found
   */
  removeItem(collectionName, id) {
    if (!id) return false;
    
    const db = this.getDatabase(); // Use the shared instance
    const itemChain = db.get(collectionName).find({ id: id.toString() });

    if (!itemChain.value()) return false;

    // Perform the remove operation and then write
    db.get(collectionName)
      .remove({ id: id.toString() })
      .value(); // Execute the remove operation
    db.write(); // Write the changes to the file system

    return true;
  }
}

// Export a single instance of the Database class
module.exports = new Database(); 