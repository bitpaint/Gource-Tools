import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  IconButton,
  InputAdornment,
  Collapse
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  RotateRight as RefreshIcon, 
  Search as SearchIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { projectsApi, repositoriesApi, renderProfilesApi } from '../api/api';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [groupedRepositories, setGroupedRepositories] = useState({});
  const [expandedOwners, setExpandedOwners] = useState({});
  const [repoSearchQuery, setRepoSearchQuery] = useState('');
  const [renderProfiles, setRenderProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Project form state
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState({
    id: null,
    name: '',
    description: '',
    repositories: [],
    renderProfileId: ''
  });
  const [savingProject, setSavingProject] = useState(false);

  // Delete dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deletingProject, setDeletingProject] = useState(false);

  // Initialize expand state for repository groups
  useEffect(() => {
    const initialExpandedState = {};
    Object.keys(groupedRepositories).forEach(owner => {
      initialExpandedState[owner] = true;
    });
    setExpandedOwners(initialExpandedState);
  }, [groupedRepositories]);

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectsRes, reposRes, profilesRes] = await Promise.all([
        projectsApi.getAll(),
        repositoriesApi.getAll(),
        renderProfilesApi.getAll()
      ]);
      
      console.log('Repositories chargés:', reposRes.data);
      
      setProjects(projectsRes.data);
      setRepositories(reposRes.data);
      
      // Grouper les dépôts par propriétaire
      const grouped = reposRes.data.reduce((acc, repo) => {
        const owner = repo.owner || 'unknown';
        if (!acc[owner]) {
          acc[owner] = [];
        }
        acc[owner].push(repo);
        return acc;
      }, {});
      
      setGroupedRepositories(grouped);
      setRenderProfiles(profilesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Project handlers
  const handleOpenProjectDialog = (project = null) => {
    // Refresh repositories to get latest data
    repositoriesApi.getAll().then(response => {
      console.log('Repositories rafraîchis avant ouverture dialogue:', response.data);
      setRepositories(response.data);
      
      if (project) {
        setIsEditing(true);
        setCurrentProject({
          id: project.id,
          name: project.name,
          description: project.description || '',
          repositories: project.repositories || [],
          renderProfileId: project.renderProfileId || ''
        });
      } else {
        setIsEditing(false);
        setCurrentProject({
          id: null,
          name: '',
          description: '',
          repositories: [],
          renderProfileId: ''
        });
      }
      setOpenProjectDialog(true);
    }).catch(err => {
      console.error('Erreur lors du rafraîchissement des repositories:', err);
      toast.error('Erreur lors du chargement des repositories');
    });
  };

  const handleCloseProjectDialog = () => {
    setOpenProjectDialog(false);
  };

  const handleSaveProject = async () => {
    if (!currentProject.name) {
      toast.error('Project name is required');
      return;
    }

    try {
      setSavingProject(true);
      
      // Debug: afficher les repositories sélectionnés
      console.log('Repositories sélectionnés avant envoi:', currentProject.repositories);
      
      if (isEditing) {
        // Update existing project
        const response = await projectsApi.update(currentProject.id, currentProject);
        
        // Update projects array
        const updatedProjects = projects.map(project => 
          project.id === currentProject.id ? response.data : project
        );
        setProjects(updatedProjects);
        
        toast.success('Project updated successfully');
      } else {
        // Create new project
        const response = await projectsApi.create(currentProject);
        setProjects([...projects, response.data]);
        toast.success('Project created successfully');
      }
      
      handleCloseProjectDialog();
    } catch (err) {
      console.error('Error saving project:', err);
      toast.error(err.response?.data?.error || 'Failed to save project');
    } finally {
      setSavingProject(false);
    }
  };

  // Delete project handlers
  const handleOpenDeleteDialog = (project) => {
    setProjectToDelete(project);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setProjectToDelete(null);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      setDeletingProject(true);
      await projectsApi.delete(projectToDelete.id);
      
      setProjects(projects.filter(project => project.id !== projectToDelete.id));
      toast.success('Project deleted successfully');
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting project:', err);
      toast.error('Failed to delete project');
    } finally {
      setDeletingProject(false);
    }
  };

  // Function to handle regenerating Gource logs for a project
  const handleRegenerateGourceLogs = async (projectId) => {
    try {
      setLoading(true);
      const project = projects.find(p => p.id === projectId);
      
      if (!project || !project.repositories || project.repositories.length === 0) {
        toast.error('Project has no repositories to regenerate logs for');
        setLoading(false);
        return;
      }
      
      toast.info(`Regenerating Gource logs for project "${project.name}"...`);
      
      // Update all repositories in the project
      const updatePromises = project.repositories.map(repoId => 
        repositoriesApi.update(repoId)
      );
      
      await Promise.all(updatePromises);
      
      toast.success(`Gource logs regenerated for project "${project.name}"`);
      setLoading(false);
    } catch (error) {
      console.error('Error regenerating Gource logs:', error);
      toast.error('Failed to regenerate Gource logs');
      setLoading(false);
    }
  };

  // Function to handle editing a project
  const handleEditProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      handleOpenProjectDialog(project);
    }
  };

  // Helper functions
  const getRepositoryNames = (repoIds) => {
    if (!repoIds || repoIds.length === 0) return 'No repositories';
    
    return repoIds.map(id => {
      const repo = repositories.find(r => r.id === id);
      return repo ? repo.name : 'Unknown';
    }).join(', ');
  };

  const getProfileName = (profileId) => {
    if (!profileId) return 'None';
    const profile = renderProfiles.find(p => p.id === profileId);
    return profile ? profile.name : 'Unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const toggleOwnerExpanded = (owner) => {
    setExpandedOwners(prev => ({
      ...prev,
      [owner]: !prev[owner]
    }));
  };
  
  // Filtrer les dépôts en fonction de la recherche
  const filteredRepositories = Object.entries(groupedRepositories).reduce((acc, [owner, repos]) => {
    if (!repoSearchQuery) {
      acc[owner] = repos;
      return acc;
    }
    
    const filteredRepos = repos.filter(repo => 
      repo.name.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(repoSearchQuery.toLowerCase())) ||
      repo.url.toLowerCase().includes(repoSearchQuery.toLowerCase())
    );
    
    if (filteredRepos.length > 0) {
      acc[owner] = filteredRepos;
    }
    
    return acc;
  }, {});

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Projects
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Create and manage Gource visualization projects
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenProjectDialog()}
        >
          Create Project
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {projects.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No projects found. Create one to get started.
              </Typography>
            </Paper>
          </Grid>
        ) : (
          projects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    {project.name}
                  </Typography>
                  
                  {project.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {project.description}
                    </Typography>
                  )}
                  
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Repositories:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {getRepositoryNames(project.repositories)}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Gource Config File:
                  </Typography>
                  <Chip 
                    label={getProfileName(project.renderProfileId)} 
                    size="small" 
                    color={project.renderProfileId ? 'primary' : 'default'}
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography variant="body2" color="text.secondary">
                    Last modified: {formatDate(project.lastModified)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditProject(project.id)}
                    size="small"
                    title="Edit Project"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="secondary"
                    onClick={() => handleRegenerateGourceLogs(project.id)}
                    size="small"
                    title="Regenerate Gource Logs"
                  >
                    <RefreshIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleOpenDeleteDialog(project)}
                    size="small"
                    title="Delete Project"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Project Dialog */}
      <Dialog 
        open={openProjectDialog} 
        onClose={handleCloseProjectDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{isEditing ? 'Edit Project' : 'Create Project'}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {isEditing 
              ? 'Edit your project details below.'
              : 'Create a new project by filling out the details below.'
            }
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Project Name"
            type="text"
            fullWidth
            variant="outlined"
            value={currentProject.name}
            onChange={(e) => setCurrentProject({...currentProject, name: e.target.value})}
            required
            sx={{ mb: 2, mt: 1 }}
          />
          
          <TextField
            margin="dense"
            id="description"
            label="Description (optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={currentProject.description}
            onChange={(e) => setCurrentProject({...currentProject, description: e.target.value})}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="repositories-label">Repositories</InputLabel>
            <OutlinedInput
              label="Repositories"
              id="repositories-search"
              startAdornment={
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              }
              placeholder="Search repositories..."
              value={repoSearchQuery}
              onChange={(e) => setRepoSearchQuery(e.target.value)}
              sx={{ mb: 1 }}
            />
            
            <Paper variant="outlined" sx={{ mt: 1, p: 1, maxHeight: 300, overflow: 'auto' }}>
              {Object.keys(filteredRepositories).length === 0 ? (
                <Typography variant="body2" sx={{ p: 1, textAlign: 'center' }}>
                  No repositories match your search
                </Typography>
              ) : (
                Object.entries(filteredRepositories).map(([owner, repos]) => (
                  <Box key={owner} sx={{ mb: 2 }}>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        pb: 0.5,
                        cursor: 'pointer' 
                      }}
                      onClick={() => toggleOwnerExpanded(owner)}
                    >
                      <IconButton size="small">
                        {expandedOwners[owner] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <Typography variant="subtitle1" sx={{ ml: 1 }}>
                        {owner} ({repos.length})
                      </Typography>
                    </Box>
                    
                    <Collapse in={expandedOwners[owner] || false} timeout="auto">
                      {repos.map((repo) => (
                        <Box key={repo.id} sx={{ pl: 4, py: 0.5 }}>
                          <FormControl>
                            <Checkbox 
                              checked={(currentProject.repositories || []).indexOf(String(repo.id)) > -1}
                              onChange={(e) => {
                                const currentRepos = [...(currentProject.repositories || [])];
                                if (e.target.checked) {
                                  if (currentRepos.indexOf(String(repo.id)) === -1) {
                                    currentRepos.push(String(repo.id));
                                  }
                                } else {
                                  const index = currentRepos.indexOf(String(repo.id));
                                  if (index !== -1) {
                                    currentRepos.splice(index, 1);
                                  }
                                }
                                setCurrentProject({...currentProject, repositories: currentRepos});
                              }}
                            />
                          </FormControl>
                          <Box sx={{ display: 'inline-block' }}>
                            <Typography variant="body1">{repo.name}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {repo.description || 'No description'}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Collapse>
                  </Box>
                ))
              )}
            </Paper>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel id="render-profile-label">Gource Config File</InputLabel>
            <Select
              labelId="render-profile-label"
              id="render-profile"
              value={currentProject.renderProfileId}
              onChange={(e) => setCurrentProject({...currentProject, renderProfileId: e.target.value})}
              input={<OutlinedInput label="Gource Config File" />}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {renderProfiles.map((profile) => (
                <MenuItem key={profile.id} value={profile.id}>
                  {profile.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProjectDialog} disabled={savingProject}>Cancel</Button>
          <Button 
            onClick={handleSaveProject} 
            variant="contained" 
            disabled={!currentProject.name || savingProject}
            startIcon={savingProject && <CircularProgress size={16} color="inherit" />}
          >
            {savingProject ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the project "{projectToDelete?.name}"?
            This will not delete the associated repositories.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deletingProject}>Cancel</Button>
          <Button 
            onClick={handleDeleteProject} 
            color="error" 
            variant="contained" 
            disabled={deletingProject}
            startIcon={deletingProject && <CircularProgress size={16} color="inherit" />}
          >
            {deletingProject ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectsPage; 