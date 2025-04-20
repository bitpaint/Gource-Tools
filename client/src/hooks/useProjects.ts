import { useState, useEffect, useCallback } from 'react';
import { projectsApi } from '../api/api';
import { toast } from 'react-toastify';

const useProjects = (repositoriesHook) => {
  const [projects, setProjects] = useState([]);
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

  // Expanded projects state for UI
  const [expandedProjects, setExpandedProjects] = useState({});

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectsApi.getAll();
      
      if (Array.isArray(response.data)) {
        setProjects(response.data);
      } else {
        setError('Invalid projects data received');
        setProjects([]);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
      toast.error('Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Initialize expand state for projects when projects change
  useEffect(() => {
    if (projects.length > 0) {
      const initialExpandedState = {};
      projects.forEach(project => {
        initialExpandedState[project.id] = expandedProjects[project.id] || false;
      });
      setExpandedProjects(initialExpandedState);
    }
  }, [projects, expandedProjects]);

  // Project dialog handlers
  const handleOpenProjectDialog = (project = null) => {
    // Refresh repositories first to ensure we have the latest data
    if (repositoriesHook && typeof repositoriesHook.fetchRepositories === 'function') {
      repositoriesHook.fetchRepositories();
    }
    
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
  };

  const handleCloseProjectDialog = () => {
    setOpenProjectDialog(false);
  };

  const handleSaveProject = async () => {
    if (!currentProject.name) {
      toast.error('Project name is required');
      return;
    }
    
    if (!currentProject.repositories || currentProject.repositories.length === 0) {
      toast.error('At least one repository is required');
      return;
    }

    try {
      setSavingProject(true);
      
      console.log('Repositories selected for save:', currentProject.repositories);
      
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
    if (!repositoriesHook || !repositoriesHook.repositories) {
      toast.error('Repository data not available');
      return;
    }
    
    const repo = repositoriesHook.repositories.find(r => r.id === repoId);
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

  // Function to regenerate logs for a project's repositories
  const regenerateProjectLogs = async (projectId) => {
    try {
      setLoading(true);
      const project = projects.find(p => p.id === projectId);
      
      if (!project || !project.repositories || project.repositories.length === 0) {
        toast.error('Project has no repositories to regenerate logs for');
        setLoading(false);
        return;
      }
      
      toast.info(`Regenerating logs for project "${project.name}"...`);
      
      // Use the repositories hook to update all repositories in the project
      if (repositoriesHook && typeof repositoriesHook.updateRepositories === 'function') {
        await repositoriesHook.updateRepositories(project.repositories);
      } else {
        // Fallback if hook not provided
        const updatePromises = project.repositories.map(repoId => 
          projectsApi.update(repoId)
        );
        
        await Promise.all(updatePromises);
      }
      
      // Refresh projects to show updated timestamps
      await fetchProjects();
      
      toast.success(`Logs regenerated for project "${project.name}"`);
      return true;
    } catch (error) {
      console.error('Error regenerating logs:', error);
      toast.error('Failed to regenerate logs');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to handle updating all projects
  const updateAllProjects = async () => {
    try {
      setLoading(true);
      toast.info('Updating all projects...');
      
      // Process all project repositories to update them
      const allRepoIds = new Set();
      for (const project of projects) {
        if (project.repositories && project.repositories.length > 0) {
          project.repositories.forEach(repoId => allRepoIds.add(repoId));
        }
      }
      
      // Convert Set to Array for updating
      const uniqueRepoIds = Array.from(allRepoIds);
      
      if (uniqueRepoIds.length === 0) {
        toast.info('No repositories to update');
        setLoading(false);
        return;
      }
      
      toast.info(`Updating ${uniqueRepoIds.length} unique repositories...`);
      
      // Use the repositories hook to update all repositories
      if (repositoriesHook && typeof repositoriesHook.updateRepositories === 'function') {
        await repositoriesHook.updateRepositories(uniqueRepoIds);
      } else {
        // Fallback if hook not provided
        const updatePromises = uniqueRepoIds.map(repoId => 
          projectsApi.update(repoId)
        );
        
        await Promise.all(updatePromises);
      }
      
      // Refresh projects to show updated timestamps
      await fetchProjects();
      
      toast.success('All projects updated successfully');
    } catch (err) {
      console.error('Error updating all projects:', err);
      toast.error('Failed to update all projects');
    } finally {
      setLoading(false);
    }
  };

  // Toggle project expand state
  const toggleProjectExpanded = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  return {
    // State
    projects,
    loading,
    error,
    openProjectDialog,
    isEditing,
    currentProject,
    savingProject,
    openDeleteDialog,
    projectToDelete,
    deletingProject,
    openRemoveRepoDialog,
    repoToRemove,
    projectToModify,
    removingRepo,
    expandedProjects,
    
    // Functions
    fetchProjects,
    handleOpenProjectDialog,
    handleCloseProjectDialog,
    handleSaveProject,
    setCurrentProject,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleDeleteProject,
    handleOpenRemoveRepoDialog,
    handleCloseRemoveRepoDialog,
    handleRemoveRepositoryFromProject,
    regenerateProjectLogs,
    updateAllProjects,
    toggleProjectExpanded
  };
};

export default useProjects; 