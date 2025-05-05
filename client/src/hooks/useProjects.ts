import { useState, useEffect, useCallback } from 'react';
import { projectsApi, repositoriesApi } from '../api/api';
import { toast } from 'react-toastify';

// Define interfaces for type safety
interface Repository {
  id: string;
  name: string;
  // Add other relevant repository fields if needed
}

interface Project {
  id: string;
  name: string;
  description?: string;
  repositories: string[];
  renderProfileId?: string | null;
  // Add other relevant project fields like dateCreated, lastModified if needed
}

interface RepositoriesHook {
  repositories: Repository[];
  fetchRepositories: () => void;
  updateRepositories: (repoIds: string[]) => Promise<boolean>;
}

// Define the type for the current project being edited/created
interface CurrentProjectState {
  id: string | null;
  name: string;
  repositories: string[];
  renderProfileId: string | null | '';
}

// Define the type for the expanded projects state
interface ExpandedProjectsState {
  [key: string]: boolean;
}

const useProjects = (repositoriesHook: RepositoriesHook | null) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Progress state for bulk updates
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [totalReposToUpdate, setTotalReposToUpdate] = useState(0);
  const [updateMessage, setUpdateMessage] = useState('');

  // Project form state
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<CurrentProjectState>({
    id: null,
    name: '',
    repositories: [],
    renderProfileId: ''
  });
  const [savingProject, setSavingProject] = useState(false);

  // Delete dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);

  // Remove repository from project dialog state
  const [openRemoveRepoDialog, setOpenRemoveRepoDialog] = useState(false);
  const [repoToRemove, setRepoToRemove] = useState<Repository | null>(null);
  const [projectToModify, setProjectToModify] = useState<Project | null>(null);
  const [removingRepo, setRemovingRepo] = useState(false);

  // Expanded projects state for UI
  const [expandedProjects, setExpandedProjects] = useState<ExpandedProjectsState>({});

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectsApi.getAll();
      
      // Type check the response data
      if (Array.isArray(response.data)) {
        // Explicitly cast or validate the data structure if necessary
        setProjects(response.data as Project[]); 
      } else {
        setError('Invalid projects data received');
        setProjects([]);
      }
    } catch (err: any) { // Catch as any to access err.response
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
      // Create new state based *only* on the current projects list
      const currentExpandedState = expandedProjects; // Keep track of current state
      const newExpandedState: ExpandedProjectsState = {};
      projects.forEach(project => {
        // Preserve existing expansion state if project still exists, default to false
        newExpandedState[project.id] = currentExpandedState[project.id] || false; 
      });
      // Only update if the structure has actually changed to avoid unnecessary triggers
      // (Simple comparison, could be more sophisticated if needed)
      if (JSON.stringify(newExpandedState) !== JSON.stringify(currentExpandedState)) {
           setExpandedProjects(newExpandedState);
      }
    }
    // Only depend on projects, not expandedProjects itself
  }, [projects]); // Removed expandedProjects dependency

  // Project dialog handlers
  const handleOpenProjectDialog = (project: Project | null = null) => {
    // Refresh repositories first to ensure we have the latest data
    if (repositoriesHook && typeof repositoriesHook.fetchRepositories === 'function') {
      repositoriesHook.fetchRepositories();
    }
    
    if (project) {
      setIsEditing(true);
      setCurrentProject({
        id: project.id,
        name: project.name,
        repositories: project.repositories || [], // Ensure repositories is always an array
        renderProfileId: project.renderProfileId || '' // Ensure renderProfileId is not undefined
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
      
      if (isEditing && currentProject.id) {
        // Update existing project
        const response = await projectsApi.update(currentProject.id, currentProject);
        
        // Update projects array
        const updatedProjects = projects.map(project => 
          project.id === currentProject.id ? response.data : project
        );
        setProjects(updatedProjects);
        
        toast.success('Project updated successfully');
      } else if (!isEditing) {
        // Create new project
        const response = await projectsApi.create(currentProject);
        setProjects([...projects, response.data]);
        toast.success('Project created successfully');
      } else {
        // Handle the unlikely case where isEditing is true but id is null
        throw new Error("Cannot update project without a valid ID.");
      }
      
      handleCloseProjectDialog();
    } catch (err) {
      const error = err as any; // Simple way to access properties
      console.error('Error saving project:', error);
      toast.error(error?.response?.data?.error || error?.message || 'Failed to save project');
    } finally {
      setSavingProject(false);
    }
  };

  // Delete project handlers
  const handleOpenDeleteDialog = (project: Project) => {
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
      const error = err as any;
      console.error('Error deleting project:', error);
      toast.error(error?.message || 'Failed to delete project');
    } finally {
      setDeletingProject(false);
    }
  };

  // Remove repository from project handlers
  const handleOpenRemoveRepoDialog = (project: Project, repoId: string) => {
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
        repositories: projectToModify.repositories.filter(repo_id => repo_id !== repoToRemove!.id)
      };
      
      // Update project in backend
      const { name, description, repositories, renderProfileId } = updatedProject;
      const payload = { name, description, repositories, renderProfileId }; 
      const response = await projectsApi.update(projectToModify.id, payload);
      
      // Update projects array in state
      setProjects(projects.map(p => // Use different variable name (p) to avoid shadowing
        p.id === projectToModify!.id ? response.data : p // Add non-null assertion
      ));
      
      toast.success(`Repository "${repoToRemove.name}" removed from project "${projectToModify.name}"`);
      handleCloseRemoveRepoDialog();
    } catch (err) {
      const error = err as any;
      console.error('Error removing repository from project:', error);
      toast.error(error?.response?.data?.error || 'Failed to remove repository from project');
    } finally {
      setRemovingRepo(false);
    }
  };

  // Function to regenerate logs for a project's repositories
  const regenerateProjectLogs = async (projectId: string) => {
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
        // Fallback if hook not provided (API needs adjustment if this path is used)
        // Assuming projectsApi.update is for updating a *project*, not a repo
        // This fallback seems incorrect based on API naming. Consider removing or fixing.
        /*
        const updatePromises = project.repositories.map(repoId => 
          projectsApi.update(repoId) // This looks like it calls project update with a repo ID?
        );
        await Promise.all(updatePromises);
        */
       console.warn('repositoriesHook.updateRepositories not available, cannot update individual repos in fallback.');
       throw new Error('Repository update function not available.');
      }
      
      // Refresh projects to show updated timestamps
      await fetchProjects();
      
      toast.success(`Logs regenerated for project "${project.name}"`);
      return true;
    } catch (error: any) {
      console.error('Error regenerating logs:', error);
      toast.error(error?.message || 'Failed to regenerate logs');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to handle updating all projects using the bulk endpoint
  const updateAllProjects = async () => {
    setIsUpdatingAll(true);
    setUpdateProgress(0);
    setTotalReposToUpdate(0);
    setUpdateMessage('Starting update...');
    toast.info('Updating all projects...');
    
    try {
      // Collect unique repo IDs
      const allRepoIds = new Set<string>();
      for (const project of projects) {
        if (project.repositories && project.repositories.length > 0) {
          project.repositories.forEach(repoId => allRepoIds.add(repoId));
        }
      }
      const uniqueRepoIds = Array.from(allRepoIds);
      
      if (uniqueRepoIds.length === 0) {
        toast.info('No repositories to update');
        setIsUpdatingAll(false);
        setUpdateMessage('No repositories found in projects.');
        return;
      }
      
      setTotalReposToUpdate(uniqueRepoIds.length);
      setUpdateMessage(`Updating ${uniqueRepoIds.length} unique repositories...`);

      // --- Call the new bulk update endpoint --- 
      // NOTE: Assumes repositoriesApi has a bulkUpdate method mapped to the new endpoint
      // This might require adding `bulkUpdate: (data: { repoIds: string[] }) => Promise<any>;` to the API definition
      const response = await repositoriesApi.bulkUpdate({ repoIds: uniqueRepoIds });
      // -----------------------------------------

      // Process response (basic example, could use polling/SSE for real-time progress)
      if (response.data.success) {
        toast.success(response.data.message || 'All projects updated successfully');
        setUpdateMessage('Update completed successfully.');
      } else {
        const errorMsg = response.data.message || 'Failed to update all projects';
        toast.error(errorMsg);
        setError(errorMsg); // Set hook error state
        setUpdateMessage(`Update failed: ${errorMsg}`);
        // Optionally show details about which repos failed from response.data.errors
        if(response.data.errors && response.data.errors.length > 0) {
            console.error("Failed Repositories:", response.data.errors);
            toast.warn(`Details: ${response.data.errors.length} repositories failed. Check console.`);
        }
      }
      
      // Refresh projects list regardless of success/failure to get latest timestamps
      setUpdateMessage('Refreshing project list...');
      await fetchProjects();
      
    } catch (err) {
      const error = err as any;
      const errorMsg = error?.response?.data?.message || error?.message || 'An unexpected error occurred during bulk update';
      console.error('Error updating all projects:', error);
      toast.error(errorMsg);
      setError(errorMsg); // Set hook error state
      setUpdateMessage(`Update error: ${errorMsg}`);
    } finally {
      setIsUpdatingAll(false);
      setUpdateProgress(100); // Mark as complete even on error for UI clarity
      // Clear message after a delay?
      // setTimeout(() => setUpdateMessage(''), 5000);
    }
  };

  // Toggle project expand state
  const toggleProjectExpanded = (projectId: string) => {
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
    isUpdatingAll,
    updateProgress,
    totalReposToUpdate,
    updateMessage,
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