import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  RotateRight as RefreshIcon, 
  Search as SearchIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  RotateRight
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { projectsApi, repositoriesApi, renderProfilesApi } from '../api/api';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [groupedRepositories, setGroupedRepositories] = useState({});
  const [expandedOwners, setExpandedOwners] = useState({});
  const [expandedProjects, setExpandedProjects] = useState({});
  const [repoSearchQuery, setRepoSearchQuery] = useState('');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [renderProfiles, setRenderProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Project form state
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState({
    id: null,
    name: '',
    repositories: [],
    renderProfileId: ''
  });
  const [savingProject, setSavingProject] = useState(false);

  // Delete dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deletingProject, setDeletingProject] = useState(false);

  // Remove repository from project dialog state
  const [openRemoveRepoDialog, setOpenRemoveRepoDialog] = useState(false);
  const [repoToRemove, setRepoToRemove] = useState(null);
  const [projectToModify, setProjectToModify] = useState(null);
  const [removingRepo, setRemovingRepo] = useState(false);

  // Initialize expand state for repository groups in dialog
  useEffect(() => {
    const initialExpandedState = {};
    Object.keys(groupedRepositories).forEach(owner => {
      initialExpandedState[owner] = true;
    });
    setExpandedOwners(initialExpandedState);
  }, [groupedRepositories]);

  // Initialize expand state for projects
  useEffect(() => {
    const initialExpandedState = {};
    projects.forEach(project => {
      initialExpandedState[project.id] = false;
    });
    setExpandedProjects(initialExpandedState);
  }, [projects]);

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
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
  }, []);

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
          repositories: project.repositories || [],
          renderProfileId: project.renderProfileId || ''
        });
      } else {
        setIsEditing(false);
        setCurrentProject({
          id: null,
          name: '',
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

  // Remove repository from project handlers
  const handleOpenRemoveRepoDialog = (project, repoId) => {
    const repo = repositories.find(r => r.id === repoId);
    if (repo) {
      setRepoToRemove(repo);
      setProjectToModify(project);
      setOpenRemoveRepoDialog(true);
    }
  };

  const handleCloseRemoveRepoDialog = () => {
    setOpenRemoveRepoDialog(false);
    setRepoToRemove(null);
    setProjectToModify(null);
  };

  const handleRemoveRepositoryFromProject = async () => {
    if (!projectToModify || !repoToRemove) return;
    
    try {
      setRemovingRepo(true);
      
      // Create updated project with repository removed
      const updatedProject = {
        ...projectToModify,
        repositories: projectToModify.repositories.filter(id => id !== repoToRemove.id)
      };
      
      // Update project in backend
      const response = await projectsApi.update(projectToModify.id, updatedProject);
      
      // Update projects array in state
      setProjects(projects.map(project => 
        project.id === projectToModify.id ? response.data : project
      ));
      
      toast.success(`Repository "${repoToRemove.name}" removed from project "${projectToModify.name}"`);
      handleCloseRemoveRepoDialog();
    } catch (err) {
      console.error('Error removing repository from project:', err);
      toast.error('Failed to remove repository from project');
    } finally {
      setRemovingRepo(false);
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

  // Toggle project expand state
  const toggleProjectExpanded = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const getRepositoryNames = (repoIds) => {
    if (!repoIds || repoIds.length === 0) {
      return 'No repositories';
    }
    
    const repos = repositories.filter(repo => repoIds.includes(repo.id));
    const repoNames = repos.map(repo => repo.name).join(', ');
    
    return repoNames || 'No repositories found';
  };

  const getRepositoriesForProject = (repoIds) => {
    if (!repoIds || repoIds.length === 0) {
      return [];
    }
    
    return repositories.filter(repo => repoIds.includes(repo.id));
  };

  const getProfileName = (profileId) => {
    if (!profileId) {
      return 'Default';
    }
    
    const profile = renderProfiles.find(p => p.id === profileId);
    return profile ? profile.name : 'Default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Différence en millisecondes
    const diffMs = now - date;
    
    // Conversion en secondes, minutes, heures, jours
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHours = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHours / 24);
    const diffWeeks = Math.round(diffDays / 7);
    const diffMonths = Math.round(diffDays / 30);
    const diffYears = Math.round(diffDays / 365);
    
    // Formater en fonction de la différence
    if (diffSec < 60) {
      return 'Just now';
    } else if (diffMin < 60) {
      return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffWeeks < 4) {
      return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
    } else if (diffMonths < 12) {
      return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    } else {
      return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
    }
  };

  const toggleOwnerExpanded = (owner) => {
    setExpandedOwners(prev => ({
      ...prev,
      [owner]: !prev[owner]
    }));
  };

  // Fonction pour sélectionner/désélectionner tous les dépôts d'un propriétaire
  const handleToggleAllOwnerRepos = (owner, e) => {
    e.stopPropagation(); // Empêcher la propagation pour éviter de fermer/ouvrir le groupe
    
    const ownerRepos = groupedRepositories[owner] || [];
    const currentRepos = [...(currentProject.repositories || [])];
    
    // Vérifier l'état actuel pour déterminer l'action
    const allSelected = areAllOwnerReposSelected(owner);
    
    // Si tous sont déjà sélectionnés, désélectionner tous
    // Sinon, sélectionner tous ceux qui ne sont pas encore sélectionnés
    if (allSelected) {
      // Supprimer tous les repos de ce propriétaire de la sélection
      const updatedRepos = currentRepos.filter(repoId => 
        !ownerRepos.some(repo => String(repo.id) === repoId)
      );
      setCurrentProject({...currentProject, repositories: updatedRepos});
    } else {
      // Ajouter tous les repos de ce propriétaire à la sélection
      const repoIdsToAdd = ownerRepos
        .filter(repo => !currentRepos.includes(String(repo.id)))
        .map(repo => String(repo.id));
      
      setCurrentProject({
        ...currentProject, 
        repositories: [...currentRepos, ...repoIdsToAdd]
      });
    }
  };
  
  // Fonction pour vérifier si tous les dépôts d'un propriétaire sont sélectionnés
  const areAllOwnerReposSelected = (owner) => {
    const ownerRepos = groupedRepositories[owner] || [];
    return ownerRepos.every(repo => 
      (currentProject.repositories || []).includes(String(repo.id))
    );
  };
  
  // Fonction pour vérifier si certains dépôts d'un propriétaire sont sélectionnés
  const areSomeOwnerReposSelected = (owner) => {
    const ownerRepos = groupedRepositories[owner] || [];
    return ownerRepos.some(repo => 
      (currentProject.repositories || []).includes(String(repo.id))
    ) && !areAllOwnerReposSelected(owner);
  };

  // Filter repositories based on search query (for dialog)
  const filteredRepositories = Object.entries(groupedRepositories).reduce((acc, [owner, repos]) => {
    if (repoSearchQuery.trim() === '') {
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

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => 
    projectSearchQuery.trim() === '' ||
    project.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  // Function to handle updating all projects
  const handleUpdateAllProjects = async () => {
    try {
      setLoading(true);
      toast.info('Updating all projects...');
      
      // Pour chaque projet, mettre à jour tous ses dépôts
      const promises = [];
      for (const project of projects) {
        if (project.repositories && project.repositories.length > 0) {
          // Pour chaque dépôt dans le projet
          const repoPromises = project.repositories.map(repoId => 
            repositoriesApi.update(repoId)
          );
          promises.push(...repoPromises);
        }
      }
      
      await Promise.all(promises);
      
      // Actualiser les données
      await fetchData();
      
      toast.success('All projects updated successfully');
    } catch (err) {
      console.error('Error updating all projects:', err);
      toast.error('Failed to update all projects');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle rendering a project
  const handleRenderProject = async (projectId) => {
    try {
      setLoading(true);
      const project = projects.find(p => p.id === projectId);
      
      if (!project || !project.repositories || project.repositories.length === 0) {
        toast.error('Project has no repositories to render');
        setLoading(false);
        return;
      }
      
      toast.info(`Starting render for project "${project.name}"...`);
      
      // Navigate to render page with the project
      window.location.href = `/render?projectId=${projectId}`;
      
    } catch (error) {
      console.error('Error navigating to render page:', error);
      toast.error('Failed to start render');
      setLoading(false);
    }
  };

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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          placeholder="Search projects..."
          size="small"
          variant="outlined"
          value={projectSearchQuery}
          onChange={(e) => setProjectSearchQuery(e.target.value)}
          sx={{ width: '300px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => handleUpdateAllProjects()}
            sx={{ mr: 1 }}
          >
            Update All Projects
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenProjectDialog()}
          >
            Create Project
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Name</TableCell>
              <TableCell>Repos</TableCell>
              <TableCell>Gource Config</TableCell>
              <TableCell>Last Update</TableCell>
              <TableCell>Last Render</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No projects found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <React.Fragment key={project.id}>
                  <TableRow 
                    sx={{ 
                      '& > *': { borderBottom: 'unset' },
                      cursor: 'pointer' 
                    }}
                    onClick={() => toggleProjectExpanded(project.id)}
                  >
                    <TableCell>
                      <IconButton size="small">
                        {expandedProjects[project.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {project.name}
                    </TableCell>
                    <TableCell>{project.repositories?.length || 0}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getProfileName(project.renderProfileId)} 
                        size="small" 
                        color={project.renderProfileId ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={project.lastModified ? new Date(project.lastModified).toLocaleString() : 'Never updated'}>
                        <span>{formatDate(project.lastModified)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={project.lastRendered ? new Date(project.lastRendered).toLocaleString() : 'Never rendered'}>
                        <span>{formatDate(project.lastRendered)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProject(project.id);
                        }}
                        size="small"
                        title="Edit Project"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegenerateGourceLogs(project.id);
                        }}
                        size="small"
                        title="Update Project"
                      >
                        <RefreshIcon />
                      </IconButton>
                      <IconButton
                        color="info"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenderProject(project.id);
                        }}
                        size="small"
                        title="Render Project"
                      >
                        <RotateRight />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteDialog(project);
                        }}
                        size="small"
                        title="Delete Project"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                      <Collapse in={expandedProjects[project.id]} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                          {getRepositoriesForProject(project.repositories).length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No repositories in this project.
                            </Typography>
                          ) : (
                            <List>
                              {getRepositoriesForProject(project.repositories).map((repo) => (
                                <ListItem key={repo.id}>
                                  <ListItemText
                                    primary={repo.name}
                                    secondary={repo.description || 'No description'}
                                  />
                                  <ListItemSecondaryAction>
                                    <IconButton 
                                      edge="end" 
                                      color="error"
                                      onClick={() => handleOpenRemoveRepoDialog(project, repo.id)}
                                      title="Remove repository from project"
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </ListItemSecondaryAction>
                                </ListItem>
                              ))}
                            </List>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
            sx={{ mb: 3, mt: 1 }}
          />
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="repositories-label">Repositories</InputLabel>
            <OutlinedInput
              label="Repositories"
              id="repositories-search"
              startAdornment={
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              }
              endAdornment={
                repoSearchQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setRepoSearchQuery('')}
                      edge="end"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }
              placeholder="Search repositories..."
              value={repoSearchQuery}
              onChange={(e) => setRepoSearchQuery(e.target.value)}
              sx={{ mb: 1 }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {currentProject.repositories?.length || 0} repositories selected
              </Typography>
              {currentProject.repositories?.length > 0 && (
                <Button 
                  size="small" 
                  onClick={() => setCurrentProject({...currentProject, repositories: []})}
                  color="error"
                  variant="text"
                  startIcon={<DeleteIcon fontSize="small" />}
                >
                  Clear all
                </Button>
              )}
            </Box>
            
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 1.5, 
                maxHeight: 400, 
                overflow: 'auto',
                bgcolor: 'background.paper',
                borderRadius: 1
              }}
            >
              {Object.keys(filteredRepositories).length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <SearchIcon color="disabled" sx={{ fontSize: 40, mb: 1, opacity: 0.7 }} />
                  <Typography variant="body2" color="text.secondary">
                    {repoSearchQuery ? 'No repositories match your search' : 'Start typing to search repositories'}
                  </Typography>
                </Box>
              ) : (
                <>
                  {Object.entries(filteredRepositories).length > 1 && (
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        {Object.values(filteredRepositories).flat().length} repositories found
                      </Typography>
                    </Box>
                  )}
                  {Object.entries(filteredRepositories).map(([owner, repos]) => (
                    <Box key={owner} sx={{ mb: 3 }}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          pb: 0.5,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.04)'
                          }
                        }}
                      >
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOwnerExpanded(owner);
                          }}
                        >
                          {expandedOwners[owner] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                        <Tooltip title={areAllOwnerReposSelected(owner) ? "Désélectionner tous les dépôts" : "Sélectionner tous les dépôts"}>
                          <Checkbox
                            size="small"
                            onClick={(e) => handleToggleAllOwnerRepos(owner, e)}
                            checked={areAllOwnerReposSelected(owner)}
                            indeterminate={areSomeOwnerReposSelected(owner)}
                            sx={{ ml: 0.5, mr: 0.5 }}
                          />
                        </Tooltip>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ flex: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOwnerExpanded(owner);
                          }}
                        >
                          {owner} ({repos.length})
                        </Typography>
                      </Box>
                      
                      <Collapse in={expandedOwners[owner] || false} timeout="auto">
                        {repos.map((repo) => (
                          <Box 
                            key={repo.id} 
                            sx={{ 
                              pl: 4, 
                              py: 0.8, 
                              display: 'flex', 
                              alignItems: 'center',
                              '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.04)'
                              },
                              cursor: 'pointer',
                              borderRadius: 1
                            }}
                            onClick={() => {
                              const currentRepos = [...(currentProject.repositories || [])];
                              const isSelected = currentRepos.includes(String(repo.id));
                              
                              if (isSelected) {
                                // Désélectionner
                                const index = currentRepos.indexOf(String(repo.id));
                                if (index !== -1) {
                                  currentRepos.splice(index, 1);
                                }
                              } else {
                                // Sélectionner
                                if (!currentRepos.includes(String(repo.id))) {
                                  currentRepos.push(String(repo.id));
                                }
                              }
                              
                              setCurrentProject({...currentProject, repositories: currentRepos});
                            }}
                          >
                            <FormControl onClick={(e) => e.stopPropagation()}>
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
                            <Box sx={{ display: 'inline-block', ml: 1 }}>
                              <Typography variant="body1">{repo.name}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {repo.description || 'No description'}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Collapse>
                    </Box>
                  ))}
                </>
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

      {/* Remove Repository from Project Dialog */}
      <Dialog open={openRemoveRepoDialog} onClose={handleCloseRemoveRepoDialog}>
        <DialogTitle>Remove Repository from Project</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove the repository "{repoToRemove?.name}" from project "{projectToModify?.name}"?
            This will not delete the repository itself.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemoveRepoDialog} disabled={removingRepo}>Cancel</Button>
          <Button 
            onClick={handleRemoveRepositoryFromProject} 
            color="error" 
            variant="contained" 
            disabled={removingRepo}
            startIcon={removingRepo && <CircularProgress size={16} color="inherit" />}
          >
            {removingRepo ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectsPage; 