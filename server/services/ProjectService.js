/**
 * Project management service
 * Responsible for access and operations on projects
 */

const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

class ProjectService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../db/db.json');
    this.init();
  }

  /**
   * Initialize the database
   */
  init() {
    const db = this.getDatabase();
    
    // Check if projects collection exists
    if (!db.has('projects').value()) {
      db.set('projects', []).write();
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
   * Get all projects
   * @returns {Array} List of projects
   */
  getAllProjects() {
    const db = this.getDatabase();
    return db.get('projects').value() || [];
  }

  /**
   * Get a project by its ID
   * @param {string} id - ID of the project to retrieve
   * @returns {Object|null} Project or null if not found
   */
  getProjectById(id) {
    if (!id) return null;
    
    const db = this.getDatabase();
    return db.get('projects')
      .find({ id: id.toString() })
      .value() || null;
  }

  /**
   * Get a project with all its details (repositories and render profile)
   * @param {string} projectId - ID of the project to retrieve
   * @returns {Object|null} Project with details or null if not found
   */
  getProjectWithDetails(projectId) {
    if (!projectId) return null;
    
    // Retrieve the project
    const project = this.getProjectById(projectId);
    
    if (!project) return null;
    
    // Retrieve repository details
    const db = this.getDatabase();
    const repositoryDetails = project.repositories.map(repoId => {
      return db.get('repositories')
        .find({ id: repoId })
        .value();
    }).filter(repo => repo !== undefined);
    
    // Retrieve render profile
    let renderProfile = null;
    if (project.renderProfileId) {
      renderProfile = db.get('renderProfiles')
        .find({ id: project.renderProfileId })
        .value();
    }
    
    if (!renderProfile) {
      // Use default profile if no profile is specified
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
   * Create a new project
   * @param {Object} projectData - Project data to create
   * @returns {Object} Created project
   */
  createProject(projectData) {
    const db = this.getDatabase();
    
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
    
    // Generate a unique ID
    const id = Date.now().toString();
    
    // Create the project
    const newProject = {
      id,
      name: projectData.name,
      description: projectData.description || '',
      repositories: projectData.repositories || [],
      renderProfileId: projectData.renderProfileId || null,
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
   * Update an existing project
   * @param {string} id - ID of the project to update
   * @param {Object} projectData - New project data
   * @returns {Object|null} Updated project or null if not found
   */
  updateProject(id, projectData) {
    if (!id) return null;
    
    const db = this.getDatabase();
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
    
    // Prepare data to update
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
   * Delete a project
   * @param {string} id - ID of the project to delete
   * @returns {boolean} true if deleted, false otherwise
   */
  deleteProject(id) {
    if (!id) return false;
    
    const db = this.getDatabase();
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