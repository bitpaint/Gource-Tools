const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { defaultGourceConfig } = require('../config/defaultGourceConfig');
const Database = require('../utils/Database');
const ProjectService = require('../services/projectService');
const logService = require('../services/logService');
const { createComponentLogger } = require('../utils/Logger');
const logger = createComponentLogger('ProjectsRoute');

// Get a project with all its details (repositories and render profile)
function getProjectWithDetails(projectId) {
  return ProjectService.getProjectWithDetails(projectId);
}

// Get all projects
router.get('/', (req, res) => {
  const projects = ProjectService.getAllProjects();
  res.json(projects);
});

// Get a single project with repositories
router.get('/:id', (req, res) => {
  const project = ProjectService.getProjectWithDetails(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  res.json(project);
});

// Create a new project
router.post('/', (req, res) => {
  try {
    const { name, description, repositories, renderProfileId } = req.body;
    const db = Database.getDatabase();

    // Debug logs
    logger.debug('Creating project - data received');
    logger.debug(`name: ${name}`);
    logger.debug(`description: ${description}`);
    logger.debug(`repositories (type): ${typeof repositories}, ${Array.isArray(repositories)}`);
    logger.debug(`repositories (content): ${JSON.stringify(repositories)}`);
    logger.debug(`renderProfileId: ${renderProfileId}`);

    const allRepos = db.get('repositories').value();
    logger.debug(`Available repositories in DB: ${JSON.stringify(allRepos.map(r => ({ id: r.id, name: r.name })) )}`);

    // Validate input
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Verify repositories are provided and valid
    if (!repositories || !Array.isArray(repositories) || repositories.length === 0) {
      return res.status(400).json({ error: 'At least one repository is required' });
    }

    // Check if project with same name already exists
    const existingProject = db.get('projects')
      .find({ name })
      .value();

    if (existingProject) {
      return res.status(400).json({ error: 'A project with this name already exists' });
    }

    // Validate repositories if provided
    let validRepos = [];
    if (repositories && repositories.length > 0) {
      logger.debug(`Checking repositories: ${JSON.stringify(repositories)}`);
      repositories.forEach(repoId => {
        const repo = db.get('repositories')
          .find({ id: repoId.toString() })
          .value();
        
        if (repo) {
          logger.debug(`Valid repository found: ${repo.name}`);
          validRepos.push(repoId);
        } else {
          logger.debug(`Invalid repository with ID: ${repoId}`);
        }
      });
    }
    logger.debug(`Valid repositories: ${JSON.stringify(validRepos)}`);

    // Ensure at least one repository is valid
    if (validRepos.length === 0) {
      return res.status(400).json({ error: 'No valid repositories provided' });
    }

    // Validate Gource config file if provided
    let finalRenderProfileId = renderProfileId;
    if (renderProfileId) {
      const profileExists = db.get('renderProfiles')
        .find({ id: renderProfileId })
        .value();
      
      if (!profileExists) {
        // If specified config file doesn't exist, try to use default config file
        const defaultProfile = db.get('renderProfiles')
          .find({ isDefault: true })
          .value();
        
        if (defaultProfile) {
          finalRenderProfileId = defaultProfile.id;
        } else {
          finalRenderProfileId = null;
        }
      }
    } else {
      // If no config file specified, try to use default config file
      const defaultProfile = db.get('renderProfiles')
        .find({ isDefault: true })
        .value();
      
      if (defaultProfile) {
        finalRenderProfileId = defaultProfile.id;
      }
    }

    // Generate project ID
    const id = Date.now().toString();

    // Create new project
    const newProject = {
      id,
      name,
      description: description || '',
      repositories: validRepos,
      renderProfileId: finalRenderProfileId,
      dateCreated: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    db.get('projects')
      .push(newProject)
      .write();

    res.status(201).json(newProject);
  } catch (error) {
    logger.error('Error creating project', error);
    res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
});

// Update a project
router.put('/:id', (req, res) => {
  try {
    const { name, description, repositories = [], renderProfileId } = req.body;
    
    // Debug logs
    logger.debug('Updating project - data received');
    logger.debug(`name: ${name}`);
    logger.debug(`description: ${description}`);
    logger.debug(`repositories (type): ${typeof repositories}, ${Array.isArray(repositories)}`);
    logger.debug(`repositories (content): ${JSON.stringify(repositories)}`);
    logger.debug(`renderProfileId: ${renderProfileId}`);
    
    const db = Database.getDatabase();
    
    const project = db.get('projects')
      .find({ id: req.params.id })
      .value();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Validate input
    if (name === '') {
      return res.status(400).json({ error: 'Project name cannot be empty' });
    }

    // Verify repositories are provided and valid
    if (!repositories || !Array.isArray(repositories) || repositories.length === 0) {
      return res.status(400).json({ error: 'At least one repository is required' });
    }

    // Check if the name is being changed and if it already exists
    if (name && name !== project.name) {
      const existingProject = db.get('projects')
        .find({ name })
        .value();

      if (existingProject && existingProject.id !== project.id) {
        return res.status(400).json({ error: 'A project with this name already exists' });
      }
    }

    // Validate repositories - make sure they exist
    const validRepos = repositories.filter(repoId => {
      const repo = db.get('repositories')
        .find({ id: repoId.toString() })
        .value();
      
      if (repo) {
        logger.debug(`Valid repository found (update): ${repo.name}`);
        return true;
      } else {
        logger.debug(`Invalid repository with ID (update): ${repoId}`);
        return false;
      }
    });
    logger.debug(`Valid repositories (update): ${JSON.stringify(validRepos)}`);

    // Ensure at least one repository is valid
    if (validRepos.length === 0) {
      return res.status(400).json({ error: 'No valid repositories provided' });
    }

    // Validate Gource config file if provided
    let finalRenderProfileId = renderProfileId;
    if (renderProfileId) {
      const profileExists = db.get('renderProfiles')
        .find({ id: renderProfileId })
        .value();
      
      if (!profileExists) {
        // If specified config file doesn't exist, try to use default config file
        const defaultProfile = db.get('renderProfiles')
          .find({ isDefault: true })
          .value();
        
        if (defaultProfile) {
          finalRenderProfileId = defaultProfile.id;
        } else {
          finalRenderProfileId = null;
        }
      }
    } else if (renderProfileId === null) {
      // If the profile was explicitly removed
      finalRenderProfileId = null;
    } else {
      // If renderProfileId is not provided, keep the current value
      finalRenderProfileId = project.renderProfileId;
    }

    // Update project
    const updatedProject = {
      ...project,
      name: name || project.name,
      description: description !== undefined ? description : project.description,
      repositories: validRepos,
      renderProfileId: finalRenderProfileId,
      lastModified: new Date().toISOString()
    };

    db.get('projects')
      .find({ id: req.params.id })
      .assign(updatedProject)
      .write();

    // Regenerate the project log after updating repositories
    logService.generateProjectLog(req.params.id)
      .then(() => logger.info(`Project log regenerated for ${req.params.id} after PUT update`))
      .catch(err => logger.error(`Error regenerating project log for ${req.params.id}:`, err));

    res.json(updatedProject);
  } catch (error) {
    logger.error('Error updating project', error);
    res.status(500).json({ error: 'Failed to update project', details: error.message });
  }
});

// Delete a project
router.delete('/:id', (req, res) => {
  try {
    const db = Database.getDatabase();
    
    const project = db.get('projects')
      .find({ id: req.params.id })
      .value();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Remove from database
    db.get('projects')
      .remove({ id: req.params.id })
      .write();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Error deleting project', error);
    res.status(500).json({ error: 'Failed to delete project', details: error.message });
  }
});

module.exports = router;

// Also export the getProjectWithDetails function
module.exports.getProjectWithDetails = getProjectWithDetails; 