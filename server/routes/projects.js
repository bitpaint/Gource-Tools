const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { defaultGourceConfig } = require('../config/defaultGourceConfig');
const Database = require('../utils/Database');
const ProjectService = require('../services/projectService');
const { getProjectById } = require('../services/projectService');
const { validateProjectData } = require('../validators/projectValidator');
const Logger = require('../utils/Logger');

const logger = Logger.createComponentLogger('ProjectsRoute');
const db = Database.getDatabase();

// Get a project with all its details (repositories and render profile)
function getProjectWithDetails(projectId) {
  return ProjectService.getProjectWithDetails(projectId);
}

// Get all projects
router.get('/', (req, res, next) => {
  try {
    const projects = ProjectService.getAllProjectsWithDetails();
    res.json(projects);
  } catch (error) {
    logger.error('Error fetching projects:', error);
    next(error);
  }
});

// Get a single project with repositories
router.get('/:id', (req, res, next) => {
  try {
    const project = getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    logger.error(`Error fetching project ${req.params.id}:`, error);
    next(error);
  }
});

// Create a new project
router.post('/', validateProjectData, (req, res, next) => {
  try {
    const { name, description, repositories, gourceConfigId } = req.body;
    logger.info(`Received create project request: Name=${name}, ConfigID=${gourceConfigId}`);
    
    const projectData = {
      name,
      description,
      repositories,
      gourceConfigId
    };

    const newProject = ProjectService.createProject(projectData);
    res.status(201).json(newProject);
  } catch (error) {
    logger.error('Error creating project:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
});

// Update a project
router.put('/:id', validateProjectData, (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { name, description, repositories = [], gourceConfigId } = req.body;
    logger.info(`Received update request for project ${projectId}: Name=${name}, ConfigID=${gourceConfigId}`);

    const existingProject = getProjectById(projectId);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = {
      name,
      description,
      repositories,
      gourceConfigId
    };

    const updatedProject = ProjectService.updateProject(projectId, projectData);
    if (!updatedProject) {
      return res.status(404).json({ error: 'Project not found during update' });
    }
    res.json(updatedProject);
  } catch (error) {
    logger.error(`Error updating project ${req.params.id}:`, error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
});

// Delete a project
router.delete('/:id', (req, res, next) => {
  try {
    const deleted = ProjectService.deleteProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting project ${req.params.id}:`, error);
    next(error);
  }
});

module.exports = router;

// Also export the getProjectWithDetails function
module.exports.getProjectWithDetails = getProjectWithDetails; 