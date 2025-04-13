const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { defaultGourceConfig } = require('../config/defaultGourceConfig');

const adapter = new FileSync(path.join(__dirname, '../../db/db.json'));
const db = low(adapter);

// Function to reload the database
function reloadDatabase() {
  const dbPath = path.join(__dirname, '../../db/db.json');
  const adapter = new FileSync(dbPath);
  return low(adapter);
}

// Get a project with all its details (repositories and render profile)
function getProjectWithDetails(projectId) {
  if (!projectId) return null;
  
  // Reload the database to get the most recent data
  const freshDb = reloadDatabase();
  
  // Get the project
  const project = freshDb.get('projects')
    .find({ id: projectId.toString() })
    .value();
  
  if (!project) return null;
  
  // Get repository details
  const repositoryDetails = project.repositories.map(repoId => {
    return freshDb.get('repositories')
      .find({ id: repoId })
      .value();
  }).filter(repo => repo !== undefined);
  
  // Get the render profile
  let renderProfile = null;
  if (project.renderProfileId) {
    renderProfile = freshDb.get('renderProfiles')
      .find({ id: project.renderProfileId })
      .value();
  }
  
  if (!renderProfile) {
    // Use default profile if no profile is specified
    renderProfile = freshDb.get('renderProfiles')
      .find({ isDefault: true })
      .value();
  }
  
  return {
    ...project,
    repositoryDetails,
    renderProfile
  };
}

// Get all projects
router.get('/', (req, res) => {
  // Reload the database to get the most recent data
  const freshDb = reloadDatabase();
  const projects = freshDb.get('projects').value();
  res.json(projects);
});

// Get a single project with repositories
router.get('/:id', (req, res) => {
  // Reload the database to get the most recent data
  const freshDb = reloadDatabase();
  const project = freshDb.get('projects')
    .find({ id: req.params.id })
    .value();

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Get repository details for each repository in the project
  const repositories = project.repositories.map(repoId => {
    return freshDb.get('repositories')
      .find({ id: repoId })
      .value();
  }).filter(repo => repo !== undefined);

  res.json({
    ...project,
    repositoryDetails: repositories
  });
});

// Create a new project
router.post('/', (req, res) => {
  try {
    const { name, description, repositories, renderProfileId } = req.body;

    // Debug logs
    console.log('Project creation - received data:');
    console.log('name:', name);
    console.log('description:', description);
    console.log('repositories (type):', typeof repositories, Array.isArray(repositories));
    console.log('repositories (content):', repositories);
    console.log('renderProfileId:', renderProfileId);

    // Reload the database to ensure having the most recent data
    const freshDb = reloadDatabase();
    
    // Display all available repositories
    const allRepos = freshDb.get('repositories').value();
    console.log('Repositories available in DB (after reload):', allRepos.map(r => ({ id: r.id, name: r.name })));

    // Validate input
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Verify repositories are provided and valid
    if (!repositories || !Array.isArray(repositories) || repositories.length === 0) {
      return res.status(400).json({ error: 'At least one repository is required' });
    }

    // Check if project with same name already exists
    const existingProject = freshDb.get('projects')
      .find({ name })
      .value();

    if (existingProject) {
      return res.status(400).json({ error: 'A project with this name already exists' });
    }

    // Validate repositories if provided
    let validRepos = [];
    if (repositories && repositories.length > 0) {
      console.log('Verifying repositories:', repositories);
      repositories.forEach(repoId => {
        const repo = freshDb.get('repositories')
          .find({ id: repoId.toString() })
          .value();
        
        if (repo) {
          console.log('Valid repository found:', repo.name);
          validRepos.push(repoId);
        } else {
          console.log('Invalid repository with ID:', repoId);
        }
      });
    }
    console.log('Valid repositories:', validRepos);

    // Ensure at least one repository is valid
    if (validRepos.length === 0) {
      return res.status(400).json({ error: 'No valid repositories provided' });
    }

    // Validate Gource config file if provided
    let finalRenderProfileId = renderProfileId;
    if (renderProfileId) {
      const profileExists = freshDb.get('renderProfiles')
        .find({ id: renderProfileId })
        .value();
      
      if (!profileExists) {
        // If specified config file doesn't exist, try to use default config file
        const defaultProfile = freshDb.get('renderProfiles')
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
      const defaultProfile = freshDb.get('renderProfiles')
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

    freshDb.get('projects')
      .push(newProject)
      .write();

    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
});

// Update a project
router.put('/:id', (req, res) => {
  try {
    const { name, description, repositories = [], renderProfileId } = req.body;
    
    // Debug logs
    console.log('Project update - received data:');
    console.log('name:', name);
    console.log('description:', description);
    console.log('repositories (type):', typeof repositories, Array.isArray(repositories));
    console.log('repositories (content):', repositories);
    console.log('renderProfileId:', renderProfileId);
    
    // Reload the database
    const freshDb = reloadDatabase();
    
    const project = freshDb.get('projects')
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
      const existingProject = freshDb.get('projects')
        .find({ name })
        .value();

      if (existingProject && existingProject.id !== project.id) {
        return res.status(400).json({ error: 'A project with this name already exists' });
      }
    }

    // Validate repositories - make sure they exist
    const validRepos = repositories.filter(repoId => {
      const repo = freshDb.get('repositories')
        .find({ id: repoId.toString() })
        .value();
      
      if (repo) {
        console.log('Valid repository found (update):', repo.name);
        return true;
      } else {
        console.log('Invalid repository with ID (update):', repoId);
        return false;
      }
    });
    console.log('Valid repositories (update):', validRepos);

    // Ensure at least one repository is valid
    if (validRepos.length === 0) {
      return res.status(400).json({ error: 'No valid repositories provided' });
    }

    // Validate Gource config file if provided
    let finalRenderProfileId = renderProfileId;
    if (renderProfileId) {
      const profileExists = freshDb.get('renderProfiles')
        .find({ id: renderProfileId })
        .value();
      
      if (!profileExists) {
        // If specified config file doesn't exist, try to use default config file
        const defaultProfile = freshDb.get('renderProfiles')
          .find({ isDefault: true })
          .value();
        
        if (defaultProfile) {
          finalRenderProfileId = defaultProfile.id;
        } else {
          finalRenderProfileId = null;
        }
      }
    } else if (renderProfileId === null) {
      // If profile removal was explicitly requested
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

    freshDb.get('projects')
      .find({ id: req.params.id })
      .assign(updatedProject)
      .write();

    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project', details: error.message });
  }
});

// Delete a project
router.delete('/:id', (req, res) => {
  try {
    // Reload the database to get the most recent data
    const freshDb = reloadDatabase();
    
    const project = freshDb.get('projects')
      .find({ id: req.params.id })
      .value();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Remove from database
    freshDb.get('projects')
      .remove({ id: req.params.id })
      .write();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project', details: error.message });
  }
});

module.exports = router;

// Also export the getProjectWithDetails function
module.exports.getProjectWithDetails = getProjectWithDetails; 