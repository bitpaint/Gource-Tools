/**
 * Database Utility
 * Provides common methods for database access and operations
 */

const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, '../../db/db.json');
  }

  /**
   * Get a fresh database instance
   * @returns {Object} Database instance
   */
  getDatabase() {
    const adapter = new FileSync(this.dbPath);
    return low(adapter);
  }

  /**
   * Ensure all required collections exist in the database
   * @returns {Object} Database instance
   */
  initializeDatabase() {
    const db = this.getDatabase();
    
    // Ensure all required collections exist
    const collections = [
      'repositories', 
      'projects', 
      'renderProfiles',
      'renders',
      'settings'
    ];
    
    collections.forEach(collection => {
      if (!db.has(collection).value()) {
        db.set(collection, []).write();
        console.log(`Initialized collection: ${collection}`);
      }
    });
    
    return db;
  }

  /**
   * Get a collection from the database
   * @param {string} collectionName - Name of the collection
   * @returns {Array} Collection data
   */
  getCollection(collectionName) {
    const db = this.getDatabase();
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
    
    const db = this.getDatabase();
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
    const db = this.getDatabase();
    
    db.get(collectionName)
      .push(item)
      .write();
    
    return item;
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
    
    const db = this.getDatabase();
    const item = db.get(collectionName)
      .find({ id: id.toString() })
      .value();
    
    if (!item) return null;
    
    // Apply updates
    db.get(collectionName)
      .find({ id: id.toString() })
      .assign(updates)
      .write();
    
    // Get the updated item
    return db.get(collectionName)
      .find({ id: id.toString() })
      .value();
  }

  /**
   * Remove an item from a collection
   * @param {string} collectionName - Name of the collection
   * @param {string} id - ID of the item to remove
   * @returns {boolean} true if removed, false if not found
   */
  removeItem(collectionName, id) {
    if (!id) return false;
    
    const db = this.getDatabase();
    const item = db.get(collectionName)
      .find({ id: id.toString() })
      .value();
    
    if (!item) return false;
    
    db.get(collectionName)
      .remove({ id: id.toString() })
      .write();
    
    return true;
  }
}

module.exports = new Database(); 