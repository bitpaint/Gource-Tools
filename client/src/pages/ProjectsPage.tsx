import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon, 
  Search as SearchIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { InputAdornment } from '@mui/material';

// Import components and hooks
import ProjectList from '../components/projects/ProjectList';
import ProjectForm from '../components/projects/ProjectForm';
import useProjects from '../hooks/useProjects';
import useRepositories from '../hooks/useRepositories';
import { renderProfilesApi, settingsApi } from '../api/api';

// --- Define needed types locally --- 
interface Repository {
  id: string;
  name: string;
  // Add other fields used by repoHook.groupedRepositories if needed
  // e.g., owner?: string;
}

interface RenderProfile {
    id: string;
    name: string;
    isDefault?: boolean;
    settings?: Record<string, any>; // Define more specifically if possible
}
// --- End Local Types --- 

// Define types specific to this page
interface GroupedRepositories {
  [owner: string]: Repository[];
}

interface ExpandedOwnersState {
  [owner: string]: boolean;
}

const ProjectsPage = () => {
  // Use our custom hooks
  const repoHook = useRepositories();
  const projectHook = useProjects(repoHook);
  
  // State for render profiles
  const [renderProfiles, setRenderProfiles] = useState<RenderProfile[]>([]);
  
  // State for the application's default profile ID
  const [defaultProfileId, setDefaultProfileId] = useState<string | null>(null);
  
  // State for search and UI
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [repoSearchQuery, setRepoSearchQuery] = useState('');
  const [expandedOwners, setExpandedOwners] = useState<ExpandedOwnersState>({});
  
  // Destructure progress state from projectHook
  const {
    isUpdatingAll,
    // updateProgress, // Currently not updated in real-time
    totalReposToUpdate,
    updateMessage
  } = projectHook;
  
  // Load render profiles
  useEffect(() => {
    const fetchRenderProfiles = async () => {
      try {
        const response = await renderProfilesApi.getAll();
        if (Array.isArray(response.data)) {
          setRenderProfiles(response.data as RenderProfile[]);
        } else {
          console.error('Invalid render profiles data received');
          setRenderProfiles([]);
        }
      } catch (err) {
        console.error('Error fetching render profiles:', err);
        toast.error('Failed to load render profiles');
      }
    };
    
    fetchRenderProfiles();
  }, []);
  
  // Fetch default profile ID
  useEffect(() => {
    settingsApi.getDefaultProfileId()
      .then(response => {
        setDefaultProfileId(response.data.defaultProjectProfileId as string | null);
        console.log('Default profile ID fetched:', response.data.defaultProjectProfileId);
      })
      .catch(err => {
        console.error('Error fetching default profile ID:', err);
      });
  }, []);
  
  // Initialize expand state for repository groups in dialog
  useEffect(() => {
    const initialExpandedState: ExpandedOwnersState = {};
    const grouped = repoHook.groupedRepositories as GroupedRepositories;
    Object.keys(grouped).forEach((owner: string) => {
      initialExpandedState[owner] = true;
    });
    setExpandedOwners(initialExpandedState);
  }, [repoHook.groupedRepositories]);
  
  // Owner expansion toggle handler for repository selection
  const toggleOwnerExpanded = (owner: string) => {
    setExpandedOwners(prev => ({
      ...prev,
      [owner]: !prev[owner]
    }));
  };
  
  // Helper functions for repository selection in project form
  const areAllOwnerReposSelected = (owner: string): boolean => {
    const grouped = repoHook.groupedRepositories as GroupedRepositories;
    const ownerRepos = grouped[owner] || [];
    return ownerRepos.every((repo: Repository) => 
      (projectHook.currentProject.repositories || []).includes(String(repo.id))
    );
  };
  
  const areSomeOwnerReposSelected = (owner: string): boolean => {
    const grouped = repoHook.groupedRepositories as GroupedRepositories;
    const ownerRepos = grouped[owner] || [];
    return ownerRepos.some((repo: Repository) => 
      (projectHook.currentProject.repositories || []).includes(String(repo.id))
    ) && !areAllOwnerReposSelected(owner);
  };
  
  const handleToggleAllOwnerRepos = (owner: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent propagation to avoid closing/opening the group
    
    const grouped = repoHook.groupedRepositories as GroupedRepositories;
    const ownerRepos = grouped[owner] || [];
    const currentRepos = [...(projectHook.currentProject.repositories || [])];
    
    // Check current state to determine action
    const allSelected = areAllOwnerReposSelected(owner);
    
    if (allSelected) {
      // Remove all repositories from this owner from selection
      const updatedRepos = currentRepos.filter(repoId => 
        !ownerRepos.some((repo: Repository) => String(repo.id) === repoId)
      );
      projectHook.setCurrentProject({...projectHook.currentProject, repositories: updatedRepos});
    } else {
      // Add all repositories from this owner to selection
      const repoIdsToAdd = ownerRepos
        .filter((repo: Repository) => !currentRepos.includes(String(repo.id)))
        .map((repo: Repository) => String(repo.id));
      
      projectHook.setCurrentProject({
        ...projectHook.currentProject, 
        repositories: [...currentRepos, ...repoIdsToAdd]
      });
    }
  };
  
  // Function to open dialog for a new project
  const handleOpenCreateDialog = () => {
    // Use the fetched defaultProfileId as the default for new projects
    projectHook.setCurrentProject({
      id: null,
      name: '',
      repositories: [],
      renderProfileId: defaultProfileId || ''
    });
    projectHook.handleOpenProjectDialog();
  };
  
  // Function to handle rendering a project
  const handleRenderProject = (projectId: string) => {
    try {
      const project = projectHook.projects.find(p => p.id === projectId);
      
      if (!project || !project.repositories || project.repositories.length === 0) {
        toast.error('Project has no repositories to render');
        return;
      }
      
      toast.info(`Starting render for project "${project.name}"...`);
      
      // Navigate to render page with the project
      window.location.href = `/render?projectId=${projectId}`;
      
    } catch (error) {
      console.error('Error navigating to render page:', error);
      toast.error('Failed to start render');
    }
  };

  if (projectHook.loading || repoHook.loading) {
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
            onClick={projectHook.updateAllProjects}
            sx={{ mr: 1 }}
            disabled={isUpdatingAll}
          >
            {isUpdatingAll ? 'Updating...' : 'Update All Projects'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Create Project
          </Button>
        </Box>
      </Box>

      {/* Progress Indicator for Bulk Update */}
      {isUpdatingAll && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <Typography variant="caption" display="block" gutterBottom>
            {updateMessage || `Updating ${totalReposToUpdate} repositories...`}
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {projectHook.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {projectHook.error}
        </Alert>
      )}

      {/* Project List Component */}
      <ProjectList 
        projects={projectHook.projects}
        repositories={repoHook.repositories}
        renderProfiles={renderProfiles}
        expandedProjects={projectHook.expandedProjects}
        projectSearchQuery={projectSearchQuery}
        onToggleExpand={projectHook.toggleProjectExpanded}
        onEditProject={(id: string) => {
          const project = projectHook.projects.find(p => p.id === id);
          if (project) projectHook.handleOpenProjectDialog(project);
        }}
        onRegenerateGourceLogs={projectHook.regenerateProjectLogs}
        onRenderProject={handleRenderProject}
        onOpenDeleteDialog={projectHook.handleOpenDeleteDialog}
        onOpenRemoveRepoDialog={projectHook.handleOpenRemoveRepoDialog}
      />

      {/* Project Form Dialog */}
      <ProjectForm
        open={projectHook.openProjectDialog}
        onClose={projectHook.handleCloseProjectDialog}
        isEditing={projectHook.isEditing}
        currentProject={projectHook.currentProject}
        setCurrentProject={projectHook.setCurrentProject}
        renderProfiles={renderProfiles}
        savingProject={projectHook.savingProject}
        onSave={projectHook.handleSaveProject}
        groupedRepositories={repoHook.groupedRepositories as GroupedRepositories}
        expandedOwners={expandedOwners}
        onToggleOwnerExpanded={toggleOwnerExpanded}
        repoSearchQuery={repoSearchQuery}
        setRepoSearchQuery={setRepoSearchQuery}
        areAllOwnerReposSelected={areAllOwnerReposSelected}
        areSomeOwnerReposSelected={areSomeOwnerReposSelected}
        onToggleAllOwnerRepos={handleToggleAllOwnerRepos}
      />

      {/* Delete Project Dialog */}
      <Dialog open={projectHook.openDeleteDialog} onClose={projectHook.handleCloseDeleteDialog}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the project "{projectHook.projectToDelete?.name}"?
            This will not delete the associated repositories.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={projectHook.handleCloseDeleteDialog} disabled={projectHook.deletingProject}>Cancel</Button>
          <Button 
            onClick={projectHook.handleDeleteProject} 
            color="error" 
            variant="contained" 
            disabled={projectHook.deletingProject}
            startIcon={projectHook.deletingProject && <CircularProgress size={16} color="inherit" />}
          >
            {projectHook.deletingProject ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Repository from Project Dialog */}
      <Dialog open={projectHook.openRemoveRepoDialog} onClose={projectHook.handleCloseRemoveRepoDialog}>
        <DialogTitle>Remove Repository from Project</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove the repository "{projectHook.repoToRemove?.name}" from project "{projectHook.projectToModify?.name}"?
            This will not delete the repository itself.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={projectHook.handleCloseRemoveRepoDialog} disabled={projectHook.removingRepo}>Cancel</Button>
          <Button 
            onClick={projectHook.handleRemoveRepositoryFromProject} 
            color="error" 
            variant="contained" 
            disabled={projectHook.removingRepo}
            startIcon={projectHook.removingRepo && <CircularProgress size={16} color="inherit" />}
          >
            {projectHook.removingRepo ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectsPage; 