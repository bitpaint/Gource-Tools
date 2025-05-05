/**
 * Project Controller
 * Handles HTTP requests related to project operations
 */

const ProjectService = require('../services/projectService');
const Validator = require('../validators/RequestValidator');
const Logger = require('../utils/Logger');
const logger = Logger.createComponentLogger('ProjectController');

/**
 * Get all projects
 */
const getAllProjects = (req, res) => {
  try {
    const projects = ProjectService.getAllProjects();
    res.json(projects);
  } catch (error) {
    logger.error('Error fetching all projects', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

/**
 * Get a single project with repositories
 */
const getProjectById = (req, res) => {
  try {
    const validation = Validator.validateId(req.params.id);
    if (!Validator.handleValidation(validation, res)) return;
    
    const project = ProjectService.getProjectWithDetails(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    logger.error('Error fetching project by ID', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

/**
 * Create a new project
 */
const createProject = (req, res) => {
  try {
    const validation = Validator.validateRequired(req.body, ['name', 'repositories']);
    if (!Validator.handleValidation(validation, res)) return;
    
    const { name, description, repositories, renderProfileId } = req.body;
    
    // Additional validation
    if (!repositories || !Array.isArray(repositories) || repositories.length === 0) {
      return res.status(400).json({ error: 'At least one repository is required' });
    }
    
    // Create project using ProjectService
    const projectData = {
      name,
      description,
      repositories,
      renderProfileId
    };
    
    try {
      const newProject = ProjectService.createProject(projectData);
      res.status(201).json(newProject);
    } catch (serviceError) {
      // Handle service-specific errors
      return res.status(400).json({ error: serviceError.message });
    }
  } catch (error) {
    logger.error('Error creating project', error);
    res.status(500).json({ 
      error: 'Failed to create project', 
      details: error.message 
    });
  }
};

/**
 * Update a project
 */
const updateProject = (req, res) => {
  try {
    const idValidation = Validator.validateId(req.params.id);
    if (!Validator.handleValidation(idValidation, res)) return;
    
    const bodyValidation = Validator.validateRequired(req.body, ['name', 'repositories']);
    if (!Validator.handleValidation(bodyValidation, res)) return;
    
    const { name, description, repositories, renderProfileId } = req.body;
    
    // Additional validation
    if (!repositories || !Array.isArray(repositories) || repositories.length === 0) {
      return res.status(400).json({ error: 'At least one repository is required' });
    }
    
    // Check if project exists
    const project = ProjectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update project using ProjectService
    const projectData = {
      name,
      description,
      repositories,
      renderProfileId
    };
    
    try {
      const updatedProject = ProjectService.updateProject(req.params.id, projectData);
      res.json(updatedProject);
    } catch (serviceError) {
      // Handle service-specific errors
      return res.status(400).json({ error: serviceError.message });
    }
  } catch (error) {
    logger.error('Error updating project', error);
    res.status(500).json({ 
      error: 'Failed to update project', 
      details: error.message 
    });
  }
};

/**
 * Delete a project
 */
const deleteProject = (req, res) => {
  try {
    const validation = Validator.validateId(req.params.id);
    if (!Validator.handleValidation(validation, res)) return;
    
    // Check if project exists
    const project = ProjectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Delete project using ProjectService
    const result = ProjectService.deleteProject(req.params.id);
    
    if (result) {
      res.json({ message: 'Project deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete project' });
    }
  } catch (error) {
    logger.error('Error deleting project', error);
    res.status(500).json({ 
      error: 'Failed to delete project', 
      details: error.message 
    });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
}; 