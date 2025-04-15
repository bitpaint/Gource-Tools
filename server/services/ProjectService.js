/**
 * Project Management Service
 * Responsible for accessing and operating on projects
 */

const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const SettingsService = require('./SettingsService'); // Import SettingsService
const Database = require('../utils/Database'); // Import Database

class ProjectService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../db/db.json');
    this.init();
  }

  /**
   * Initializes the database
   */
  init() {
    const db = Database.getDatabase(); // Use shared instance
    
    // Check if the projects collection exists
    if (!db.has('projects').value()) {
      db.set('projects', []).write();
    }
  }

  /**
   * Gets a fresh database instance
   * @returns {Object} Database instance
   * @deprecated Use Database.getDatabase() instead
   */
  // getDatabase() {
  //   const adapter = new FileSync(this.dbPath);
  //   return low(adapter);
  // }

  /**
   * Gets all projects
   * @returns {Array} List of projects
   */
  getAllProjects() {
    const db = Database.getDatabase(); // Use shared instance
    return db.get('projects').value() || [];
  }

  /**
   * Gets a project by its ID
   * @param {string} id - ID of the project to retrieve
   * @returns {Object|null} Project or null if not found
   */
  getProjectById(id) {
    if (!id) return null;
    
    const db = Database.getDatabase(); // Use shared instance
    return db.get('projects')
      .find({ id: id.toString() })
      .value() || null;
  }

  /**
   * Gets a project with all its details (repositories and render profile)
   * @param {string} projectId - ID of the project to retrieve
   * @returns {Object|null} Project with details or null if not found
   */
  getProjectWithDetails(projectId) {
    if (!projectId) return null;
    
    // Get the project
    const project = this.getProjectById(projectId);
    
    if (!project) return null;
    
    // Get repository details
    const db = Database.getDatabase(); // Use shared instance
    const repositoryDetails = project.repositories.map(repoId => {
      return db.get('repositories')
        .find({ id: repoId })
        .value();
    }).filter(repo => repo !== undefined);
    
    // Get the render profile
    let renderProfile = null;
    if (project.renderProfileId) {
      renderProfile = db.get('renderProfiles')
        .find({ id: project.renderProfileId })
        .value();
    }
    
    if (!renderProfile) {
      // Use default profile if none is specified
      renderProfile = db.get('renderProfiles')
        .find({ isDefault: true })
        .value();
    }
    
    return {
      ...project,
      repositoryDetails,
      renderProfile
    };
  }

  /**
   * Creates a new project
   * @param {Object} projectData - Data for the project to create
   * @returns {Object} Created project
   */
  createProject(projectData) {
    const db = Database.getDatabase(); // Use shared instance
    
    // Validate required data
    if (!projectData.name) {
      throw new Error('Project name is required');
    }
    
    // Check if a project with the same name already exists
    const existingProject = db.get('projects')
      .find({ name: projectData.name })
      .value();
    
    if (existingProject) {
      throw new Error(`A project with the name "${projectData.name}" already exists`);
    }
    
    // Generate unique ID
    const id = Date.now().toString();
    
    // Get the current default render profile ID from settings
    const defaultProfileId = SettingsService.getDefaultProjectProfileId();

    // Create the project
    const newProject = {
      id,
      name: projectData.name,
      description: projectData.description || '',
      repositories: projectData.repositories || [],
      // Use provided ID, otherwise use the default from settings
      renderProfileId: projectData.renderProfileId !== undefined ? projectData.renderProfileId : defaultProfileId, 
      dateCreated: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    // Add the project to the database
    db.get('projects')
      .push(newProject)
      .write();
    
    return newProject;
  }

  /**
   * Updates an existing project
   * @param {string} id - ID of the project to update
   * @param {Object} projectData - New project data
   * @returns {Object|null} Updated project or null if not found
   */
  updateProject(id, projectData) {
    if (!id) return null;
    
    const db = Database.getDatabase(); // Use shared instance
    const project = db.get('projects')
      .find({ id: id.toString() })
      .value();
    
    if (!project) return null;
    
    // Check if another project with the same name already exists
    if (projectData.name && projectData.name !== project.name) {
      const existingProject = db.get('projects')
        .find({ name: projectData.name })
        .value();
      
      if (existingProject && existingProject.id !== id) {
        throw new Error(`A project with the name "${projectData.name}" already exists`);
      }
    }
    
    // Prepare data for update
    const updatedProject = {
      ...project,
      ...projectData,
      lastModified: new Date().toISOString()
    };
    
    // Update the project in the database
    db.get('projects')
      .find({ id: id.toString() })
      .assign(updatedProject)
      .write();
    
    return updatedProject;
  }

  /**
   * Deletes a project
   * @param {string} id - ID of the project to delete
   * @returns {boolean} true if deleted, false otherwise
   */
  deleteProject(id) {
    if (!id) return false;
    
    const db = Database.getDatabase(); // Use shared instance
    const project = db.get('projects')
      .find({ id: id.toString() })
      .value();

    if (!project) return false;

    // Delete the project from the database
    db.get('projects')
      .remove({ id: id.toString() })
      .write();

    return true;
  }
}

module.exports = new ProjectService(); 