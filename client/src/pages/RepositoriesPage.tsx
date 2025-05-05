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
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Alert,
  AlertTitle,
  InputAdornment,
  Collapse,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Tabs,
  Tab,
  Tooltip,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  GitHub as GitHubIcon,
  CloudDownload as CloudDownloadIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  SkipNext as SkipIcon,
  CloudSync as CloudSyncIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { repositoriesApi, dateUtils, settingsApi } from '../api/api';

// Define types for repository and bulk import status
interface Repository {
  id: string;
  name: string;
  description?: string;
  url: string;
  owner: string;
  dateAdded: string;
  lastUpdated: string;
  newCommitsCount?: number;
  updating?: boolean;
  path: string;
}

interface CloneStep {
  label: string;
  completed: boolean;
}

interface BulkImportStatus {
  progress: number;
  status: string;
  message: string;
  owner?: string;
  repositories?: any[];
  createdProjects?: any[];
  totalRepos?: number;
  completedRepos?: number;
  failedRepos?: number;
  processingAssets?: boolean;
}

const RepositoriesPage = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupedRepositories, setGroupedRepositories] = useState<Record<string, Repository[]>>({});
  const [expandedOwners, setExpandedOwners] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add repository dialog
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [addingRepo, setAddingRepo] = useState(false);
  
  // Cloning progress tracking
  const [cloneProgress, setCloneProgress] = useState(0);
  const [cloneStatus, setCloneStatus] = useState('');
  const [cloneId, setCloneId] = useState<string | null>(null);
  const [cloneSteps, setCloneSteps] = useState<CloneStep[]>([
    { label: 'Preparation', completed: false },
    { label: 'Cloning', completed: false },
    { label: 'Log Generation', completed: false },
    { label: 'Finalization', completed: false }
  ]);
  const [activeStep, setActiveStep] = useState(0);
  
  // Bulk import
  const [bulkImportUrl, setBulkImportUrl] = useState('');
  const [bulkImportId, setBulkImportId] = useState<string | null>(null);
  const [bulkImportStatus, setBulkImportStatus] = useState<BulkImportStatus | null>(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [dialogMode, setDialogMode] = useState('single'); // 'single' or 'bulk'
  
  // Delete repository dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [repoToDelete, setRepoToDelete] = useState<Repository | null>(null);
  const [deletingRepo, setDeletingRepo] = useState(false);

  // Project creation options
  const [projectCreationMode, setProjectCreationMode] = useState('none');
  const [projectNameTemplate, setProjectNameTemplate] = useState('{owner}');
  // Option to create a project when adding a single repository
  const [createProjectWithRepo, setCreateProjectWithRepo] = useState(false);
  // Option to exclude forks when doing bulk imports
  const [excludeForks, setExcludeForks] = useState(true);
  
  // Ajouter un état pour vérifier si un token GitHub est configuré
  const [hasGithubToken, setHasGithubToken] = useState(false);
  
  // Delete user repositories dialog
  const [openDeleteUserDialog, setOpenDeleteUserDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deletingUserRepos, setDeletingUserRepos] = useState(false);
  
  // Ajouter l'effet pour vérifier si un token GitHub est configuré
  useEffect(() => {
    const checkGithubToken = async () => {
      try {
        const response = await settingsApi.get();
        setHasGithubToken(response.data && response.data.githubToken && response.data.tokenStatus !== 'missing');
      } catch (err) {
        console.error('Error checking GitHub token:', err);
      }
    };
    
    checkGithubToken();
  }, []);
  
  // Memoize fetchRepositories to avoid recreation on each render
  const fetchRepositories = useCallback(async () => {
    console.log('[RepositoriesPage] Starting fetchRepositories...'); // Log Start
    setLoading(true);
    setError(null);
    try {
      const response = await repositoriesApi.getAll();
      console.log('[RepositoriesPage] API response received:', response);
      
      // Log data before setting state
      console.log('[RepositoriesPage] Data received from API:', response.data);
      
      // Check if data is actually an array before setting
      if (Array.isArray(response.data)) {
          setRepositories(response.data);
          // Group repositories by owner
          const grouped = response.data.reduce<Record<string, Repository[]>>((acc, repo) => {
            const owner = repo.owner || 'unknown';
            if (!acc[owner]) {
              acc[owner] = [];
            }
            acc[owner].push(repo);
            return acc;
          }, {});
          setGroupedRepositories(grouped);
          console.log('[RepositoriesPage] State updated successfully.');
      } else {
          console.error('[RepositoriesPage] Invalid data received from API. Expected array, got:', response.data);
          setError('Received invalid data from server.');
          setRepositories([]); // Set to empty array on invalid data
          setGroupedRepositories({});
      }
      
    } catch (err: any) {
      console.error('[RepositoriesPage] Error during fetchRepositories:', err);
      // Log specific error details if available
      if (err.response) {
        console.error('[RepositoriesPage] API Error Response:', err.response.data);
        console.error('[RepositoriesPage] API Error Status:', err.response.status);
      } else if (err.request) {
        console.error('[RepositoriesPage] API No Response:', err.request);
      } else {
        console.error('[RepositoriesPage] Error Message:', err.message);
      }
      setError('Failed to load repositories. Please try again.');
      toast.error('Failed to load repositories');
      setRepositories([]); // Ensure state is empty on error
      setGroupedRepositories({});
    } finally {
      setLoading(false);
      console.log('[RepositoriesPage] fetchRepositories finished.'); // Log End
    }
  }, []);  // Empty dependency array ensures this only changes when component mounts/unmounts

  // Load repositories on component mount
  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);  // Now we need to include fetchRepositories as a dependency
  
  // Initialize all owners as collapsed on load
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    Object.keys(groupedRepositories).forEach(owner => {
      initialExpandedState[owner] = false;
    });
    setExpandedOwners(initialExpandedState);
  }, [groupedRepositories]);
  
  // Polling for clone status if a clone is in progress
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (cloneId && addingRepo) {
      interval = setInterval(async () => {
        try {
          const response = await repositoriesApi.getCloneStatus(cloneId);
          const { progress, status, step, message } = response.data;
          
          setCloneProgress(progress);
          setCloneStatus(message || status);
          
          if (step !== undefined && step >= 0 && step < cloneSteps.length) {
            setActiveStep(step);
            
            // Update completed steps
            const updatedSteps = [...cloneSteps];
            for (let i = 0; i < step; i++) {
              updatedSteps[i].completed = true;
            }
            setCloneSteps(updatedSteps);
          }
          
          // If cloning is complete, stop polling
          if (status === 'completed' || status === 'failed') {
            if (interval) clearInterval(interval);
            
            if (status === 'completed') {
              // Mark all steps as completed
              const completedSteps = cloneSteps.map(step => ({ ...step, completed: true }));
              setCloneSteps(completedSteps);
              setActiveStep(cloneSteps.length - 1);
              
              // Refresh repository list
              await fetchRepositories();
              
              // Set addingRepo to false before closing dialog
              setAddingRepo(false);
              setCloneId(null);
              
              // Close the dialog - now this should work because addingRepo is already false
              setOpenAddDialog(false);
              toast.success('Repository added successfully');
            } else {
              toast.error(`Failed to clone repository: ${response.data.error || 'Unknown error'}`);
              setAddingRepo(false);
              setCloneId(null);
            }
          }
        } catch (err) {
          console.error('Error fetching clone status:', err);
          if (interval) clearInterval(interval);
        }
      }, 1000); // Poll every second
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cloneId, addingRepo, cloneSteps, fetchRepositories]);
  
  // Polling for bulk import status
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (bulkImportId && isBulkImporting) {
      console.log('Starting bulk import polling for:', bulkImportId);
      
      // Wait a bit before starting polling to give
      // the server time to start processing
      setTimeout(() => {
        interval = setInterval(async () => {
          try {
            console.log('Sending status request for:', bulkImportId);
            const response = await repositoriesApi.getBulkImportStatus(bulkImportId);
            setBulkImportStatus(response.data);
            console.log('Status received:', response.data.status, 'Progress:', response.data.progress);
            
            // If bulk import is complete, stop polling
            if (response.data.status === 'completed' || response.data.status === 'failed') {
              if (interval) clearInterval(interval);
              
              if (response.data.status === 'completed') {
                // Refresh repository list
                await fetchRepositories();
                
                let successMessage = `Import completed successfully. Imported ${response.data.completedRepos - response.data.failedRepos}/${response.data.totalRepos} repositories.`;
                
                // Add project creation info to success message
                if (response.data.createdProjects && response.data.createdProjects.length > 0) {
                  successMessage += ` Created ${response.data.createdProjects.length} project(s).`;
                }
                
                toast.success(successMessage);
                
                // Set importing to false but don't close the dialog
                setIsBulkImporting(false);
                // Update message to show success
                setBulkImportStatus({
                  ...response.data,
                  message: successMessage
                });
              } else {
                toast.error(`Bulk import failed: ${response.data.error || 'Unknown error'}`);
                setIsBulkImporting(false);
              }
            }
          } catch (err) {
            console.error('Error fetching bulk import status:', err);
            if (interval) clearInterval(interval);
          }
        }, 3000); // Poll every 3 seconds
      }, 2000); // Wait 2 seconds before starting polling
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [bulkImportId, isBulkImporting, fetchRepositories]);

  const handleAddRepository = async () => {
    if (!newRepoUrl) {
      toast.error('Repository URL is required');
      return;
    }

    try {
      setAddingRepo(true);
      setCloneProgress(0);
      setCloneStatus('Initializing clone operation...');
      setActiveStep(0);
      
      // Reset cloning steps
      const initialSteps = [
        { label: 'Preparation', completed: false },
        { label: 'Cloning', completed: false },
        { label: 'Log Generation', completed: false },
        { label: 'Finalization', completed: false }
      ];
      setCloneSteps(initialSteps);
      
      const response = await repositoriesApi.create({
        url: newRepoUrl,
        createProject: createProjectWithRepo
      });
      
      // If API returns a clone ID, start tracking status
      if (response.data && response.data.cloneId) {
        setCloneId(response.data.cloneId);
      } else {
        // If no clone ID is returned, consider the operation complete
        await fetchRepositories();
        setAddingRepo(false);
        setOpenAddDialog(false);
        toast.success('Repository added successfully');
      }
    } catch (err: any) {
      console.error('Error adding repository:', err);
      
      // If the repository already exists, update it instead of erroring
      if (err.response?.status === 400 && err.response?.data?.error === 'A repository with this URL already exists') {
        const existingRepo = repositories.find((r) => r.url === newRepoUrl);
        if (existingRepo) {
          toast.info(`Repository already exists, updating ${existingRepo.name}`);
          setAddingRepo(false);
          handleUpdateRepo(existingRepo);
          setOpenAddDialog(false);
          return;
        }
      }
      
      // Check if the server is suggesting to use bulk import (username detected)
      if (err.response?.status === 422 && err.response.data?.suggestBulkImport) {
        // Stop the single repo import process
        setAddingRepo(false);
        
        // Switch to bulk import mode
        setDialogMode('bulk');
        
        // Set the github URL from the response
        setBulkImportUrl(err.response.data.githubUrl || `https://github.com/${err.response.data.username}`);
        
        // Set the default project creation mode to 'per_owner'
        setProjectCreationMode('per_owner');
        
        // Show a toast to inform the user
        toast.info('Switching to bulk import mode for GitHub username');
      } else {
        // Handle normal errors
        const errorMessage = err.response?.data?.error 
          ? `${err.response.data.error}: ${err.response.data.details || ''}`
          : 'Failed to add repository';
        toast.error(errorMessage);
        setAddingRepo(false);
      }
    }
  };
  
  const handleBulkImport = async () => {
    if (!bulkImportUrl) {
      toast.error('GitHub URL is required');
      return;
    }
    
    try {
      console.log('Starting bulk import for:', bulkImportUrl);
      
      setIsBulkImporting(true);
      setBulkImportStatus({
        progress: 0,
        status: 'initializing',
        message: 'Starting bulk import...'
      } as BulkImportStatus);
      
      // Prepare name template for combined projects
      let finalTemplate = projectNameTemplate;
      
      // For combined projects, use 'owner1 - owner2' if mode is 'single'
      if (projectCreationMode === 'single') {
        finalTemplate = 'owner1 - owner2';
      }
      
      console.log('Sending import request with skipConfirmation:', true);
      
      const response = await repositoriesApi.bulkImport({
        githubUrl: bulkImportUrl,
        projectCreationMode: projectCreationMode || 'none',
        projectNameTemplate: finalTemplate || '{owner}',
        skipConfirmation: true,
        repoLimit: 99999,
        excludeForks: excludeForks
      });
      
      if (response.data && response.data.bulkImportId) {
        console.log('Import started with ID:', response.data.bulkImportId);
        setBulkImportId(response.data.bulkImportId);
        toast.info(`Bulk import started for ${bulkImportUrl}`);
        
        // Immediately update status to reflect the start
        setBulkImportStatus({
          progress: 5,
          status: 'processing',
          message: 'Import in progress...'
        } as BulkImportStatus);
      } else {
        console.error('Import response without ID:', response.data);
        toast.error('Failed to start bulk import: No import ID received');
        setIsBulkImporting(false);
      }
    } catch (err: any) {
      console.error('Error starting bulk import:', err);
      const errorMessage = err.response?.data?.error 
        ? `${err.response.data.error}: ${err.response.data.details || ''}`
        : 'Failed to start bulk import';
      toast.error(errorMessage);
      setIsBulkImporting(false);
    }
  };

  // Simplified repository update function using the correct endpoint
  const handleUpdateRepo = async (repo) => {
    try {
      // Mark repo as updating
      const updatedRepos = [...repositories];
      const repoIndex = updatedRepos.findIndex(r => r.id === repo.id);
      if (repoIndex !== -1) {
        updatedRepos[repoIndex].updating = true;
        setRepositories(updatedRepos);
      }

      console.log(`Updating repository: ${repo.name} (${repo.url}) with ID: ${repo.id}`);
      
      // Use the new gitPull endpoint
      await repositoriesApi.gitPull(repo.id);
      
      // Refresh the repository list
      await fetchRepositories();
      
      toast.success(`Repository ${repo.name} updated successfully`);
    } catch (err) {
      console.error('Error updating repository:', err);
      toast.error('Failed to update repository');
      
      // Update UI to show repo is no longer updating
      const updatedRepos = [...repositories];
      const repoIndex = updatedRepos.findIndex(r => r.id === repo.id);
      if (repoIndex !== -1) {
        updatedRepos[repoIndex].updating = false;
        setRepositories(updatedRepos);
      }
    }
  };

  // Table cell with the update button
  const renderActionButtons = (repo) => (
    <TableCell align="right">
      <IconButton 
        size="small" 
        color="primary"
        onClick={() => handleUpdateRepo(repo)}
        disabled={repo.updating}
        title="Update repository with latest changes"
      >
        {repo.updating ? <CircularProgress size={24} /> : <RefreshIcon />}
      </IconButton>
      <IconButton 
        size="small" 
        color="error"
        onClick={() => handleOpenDeleteDialog(repo)}
      >
        <DeleteIcon />
      </IconButton>
    </TableCell>
  );

  const handleDeleteRepository = async () => {
    if (!repoToDelete) return;
    
    try {
      setDeletingRepo(true);
      const response = await repositoriesApi.delete(repoToDelete.id);
      
      // Refresh the entire list to ensure everything is up to date
      await fetchRepositories();
      
      toast.success(response.data.message || 'Repository deleted successfully');
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting repository:', err);
      // Display a more precise error message if available
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to delete repository';
      toast.error(errorMessage);
    } finally {
      setDeletingRepo(false);
    }
  };

  // Dialog handlers
  const handleOpenAddDialog = (mode = 'single') => {
    setDialogMode(mode);
    setNewRepoUrl('');
    setBulkImportUrl('');
    setBulkImportId(null);
    setBulkImportStatus(null);
    // Set default mode for projects
    setProjectCreationMode(mode === 'bulk' ? 'per_owner' : 'none');
    setProjectNameTemplate('{owner}');
    setCreateProjectWithRepo(false);
    setExcludeForks(true);
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    // Prevent closing while import is still in progress
    if (addingRepo || isBulkImporting) {
      return;
    }
    
    // Also prevent closing if import is completed but we still need to process assets
    if (bulkImportStatus?.status === 'completed' && 
        bulkImportStatus?.processingAssets) {
      toast.warning('Please wait until all repository assets are processed');
      return;
    }
    
    setOpenAddDialog(false);
    setCloneId(null);
    setCloneProgress(0);
    setCloneStatus('');
    setBulkImportUrl('');
    setBulkImportId(null);
    setBulkImportStatus(null);
  };

  const handleOpenDeleteDialog = (repo) => {
    setRepoToDelete(repo);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setRepoToDelete(null);
  };
  
  const toggleOwnerExpanded = (owner) => {
    setExpandedOwners(prev => ({
      ...prev,
      [owner]: !prev[owner]
    }));
  };

  const formatDate = (dateString) => {
    return dateUtils.formatRelativeTime(dateString);
  };
  
  // Filter repositories based on search query
  const filteredRepositories = Object.entries(groupedRepositories).reduce((acc, [owner, repos]) => {
    if (!searchQuery) {
      acc[owner] = repos;
      return acc;
    }
    
    const filteredRepos = repos.filter(repo => 
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      repo.url.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (filteredRepos.length > 0) {
      acc[owner] = filteredRepos;
    }
    
    return acc;
  }, {});

  // Function to delete all repositories from a user
  const handleDeleteUserRepositories = async () => {
    if (!userToDelete) return;
    
    try {
      setDeletingUserRepos(true);
      let successCount = 0;
      let errorCount = 0;
      let errorMessages = [];
      
      // Get the initial list of repositories once at the beginning
      await fetchRepositories();
      const reposToDelete = [...(groupedRepositories[userToDelete] || [])];
      
      // Process all repositories to delete at once without refreshing the list between each
      for (const repo of reposToDelete) {
        try {
          await repositoriesApi.delete(repo.id);
          successCount++;
        } catch (err) {
          console.error(`Error deleting repository ${repo.name}:`, err);
          errorCount++;
          
          // Don't consider "repository not found" as an error to display
          if (err.response?.status !== 404) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || `Failed to delete repository ${repo.name}`;
            errorMessages.push(`${repo.name}: ${errorMessage}`);
          }
        }
      }
      
      // Refresh the list once at the end
      await fetchRepositories();
      
      // Display a toast for the results
      const message = `${successCount} repositories deleted${errorCount > 0 ? `, ${errorCount} failures` : ''}`;
      toast.success(message);
      
      // Display a toast for each important error (limited to 3)
      if (errorMessages.length > 0) {
        errorMessages.slice(0, 3).forEach(msg => toast.error(msg));
        if (errorMessages.length > 3) {
          toast.error(`And ${errorMessages.length - 3} more errors`);
        }
      }
      
      handleCloseDeleteUserDialog();
    } catch (err) {
      console.error('Error deleting user repositories:', err);
      toast.error(err.message || 'Failed to delete repositories');
    } finally {
      setDeletingUserRepos(false);
    }
  };

  const handleOpenDeleteUserDialog = (owner) => {
    setUserToDelete(owner);
    setOpenDeleteUserDialog(true);
  };

  const handleCloseDeleteUserDialog = () => {
    setOpenDeleteUserDialog(false);
    setUserToDelete(null);
  };

  // Function to update all repositories of a specific user
  const handleUpdateAllUserRepos = async (owner) => {
    try {
      // Get all repositories for this owner
      const ownerRepos = groupedRepositories[owner] || [];
      if (ownerRepos.length === 0) {
        toast.info(`No repositories found for ${owner}`);
        return;
      }

      // Mark all repos as updating
      const updatedRepos = [...repositories];
      ownerRepos.forEach(repo => {
        const repoIndex = updatedRepos.findIndex(r => r.id === repo.id);
        if (repoIndex !== -1) {
          updatedRepos[repoIndex].updating = true;
        }
      });
      setRepositories(updatedRepos);
      
      toast.info(`Updating ${ownerRepos.length} repositories from ${owner}...`);
      
      // Update repositories sequentially to avoid overloading the server
      for (const repo of ownerRepos) {
        try {
          await repositoriesApi.gitPull(repo.id);
          console.log(`Updated repository ${repo.name}`);
        } catch (err) {
          console.error(`Error updating repository ${repo.name}:`, err);
        }
      }
      
      // Refresh the list once all updates are done
      await fetchRepositories();
      
      toast.success(`Updated ${ownerRepos.length} repositories from ${owner}`);
    } catch (err) {
      console.error(`Error updating repositories for ${owner}:`, err);
      toast.error(`Failed to update repositories for ${owner}`);
      await fetchRepositories();
    }
  };
  
  // Function to update all repositories
  const handleUpdateAllRepos = async () => {
    try {
      if (repositories.length === 0) {
        toast.info('No repositories to update');
        return;
      }
      
      // Mark all repos as updating
      const updatedRepos = repositories.map(repo => ({ ...repo, updating: true }));
      setRepositories(updatedRepos);
      
      toast.info(`Updating all ${repositories.length} repositories...`);
      
      // Update repositories sequentially to avoid overloading the server
      for (const repo of repositories) {
        try {
          await repositoriesApi.gitPull(repo.id);
          console.log(`Updated repository ${repo.name}`);
        } catch (err) {
          console.error(`Error updating repository ${repo.name}:`, err);
        }
      }
      
      // Refresh the list once all updates are done
      await fetchRepositories();
      
      toast.success(`Updated ${repositories.length} repositories`);
    } catch (err) {
      console.error('Error updating all repositories:', err);
      toast.error('Failed to update all repositories');
      await fetchRepositories();
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          GitHub Repositories
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your Git repositories for Gource visualization
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search repositories..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: '500px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleUpdateAllRepos}
            color="primary"
            fullWidth
          >
            Update All Repos
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenAddDialog('single')}
            >
              Add Repository
            </Button>
            <Button
              variant="outlined"
              startIcon={<GitHubIcon />}
              onClick={() => handleOpenAddDialog('bulk')}
            >
              Bulk Import
            </Button>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : repositories.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No repositories found. Add one to get started.
          </Typography>
        </Paper>
      ) : Object.keys(filteredRepositories).length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No repositories match your search query.
          </Typography>
        </Paper>
      ) : (
        Object.entries(filteredRepositories).map(([owner, repos]) => (
          <Box key={owner} sx={{ mb: 4 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                pb: 1,
                mb: expandedOwners[owner] ? 2 : 0
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => toggleOwnerExpanded(owner)}
              >
                <IconButton size="small">
                  {expandedOwners[owner] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
                  {owner} ({repos.length})
                </Typography>
              </Box>
              
              <Box>
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={() => handleUpdateAllUserRepos(owner)}
                  title={`Update all repositories from ${owner}`}
                  sx={{ mr: 1 }}
                >
                  <RefreshIcon />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => handleOpenDeleteUserDialog(owner)}
                  title={`Delete all repositories from ${owner}`}
                >
                  <DeleteForeverIcon />
                </IconButton>
              </Box>
            </Box>
            
            <Collapse in={expandedOwners[owner]} timeout="auto">
              <Paper elevation={2}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>URL</TableCell>
                        <TableCell>Added</TableCell>
                        <TableCell>Last Updated</TableCell>
                        <TableCell>New Commits</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {repos.map((repo) => (
                        <TableRow key={repo.id}>
                          <TableCell>{repo.name}</TableCell>
                          <TableCell>{repo.description || 'No description'}</TableCell>
                          <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {repo.url}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={dateUtils.formatLocaleDate(repo.dateAdded)}>
                              <span>{formatDate(repo.dateAdded)}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={dateUtils.formatLocaleDate(repo.lastUpdated)}>
                              <span>{formatDate(repo.lastUpdated)}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {repo.newCommitsCount > 0 && (
                              <Chip 
                                label={`${repo.newCommitsCount} new`}
                                color="primary"
                                size="small"
                              />
                            )}
                          </TableCell>
                          {renderActionButtons(repo)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Collapse>
          </Box>
        ))
      )}

      {/* Add/Bulk Import Repository Dialog */}
      <Dialog 
        open={openAddDialog} 
        onClose={handleCloseAddDialog}
        maxWidth={dialogMode === 'bulk' || isBulkImporting ? "md" : "sm"}
        fullWidth={true}
      >
        <DialogTitle>
          {dialogMode === 'single' ? 'Add Repository' : 'Bulk Import Repositories'}
        </DialogTitle>
        <DialogContent>
          <Tabs 
            value={dialogMode} 
            onChange={(e, newValue) => setDialogMode(newValue)}
            sx={{ mb: 2 }}
          >
            <Tab value="single" label="Single Repository" />
            <Tab value="bulk" label="Bulk Import" />
          </Tabs>
          
          {dialogMode === 'single' && !addingRepo && (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Enter a Git repository URL to add it to Gource Tools.
                <br />
                The repository name and description will be automatically retrieved from GitHub.
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                id="url"
                label="Repository URL"
                type="text"
                fullWidth
                variant="outlined"
                value={newRepoUrl}
                onChange={(e) => setNewRepoUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !addingRepo) {
                    e.preventDefault();
                    handleAddRepository();
                  }
                }}
                placeholder="https://github.com/username/repository.git"
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <GitHubIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={createProjectWithRepo} 
                      onChange={(e) => setCreateProjectWithRepo(e.target.checked)}
                    />
                  }
                  label="Create a project with this repository"
                />
              </Box>
            </>
          )}
          
          {dialogMode === 'bulk' && !isBulkImporting && (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Enter a GitHub user or organization URL to import all repositories.
                <br />
                Example: <code>https://github.com/bitcoin/</code> or <code>@https://github.com/bitcoin/</code>
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                id="bulkUrl"
                label="GitHub URL"
                type="text"
                fullWidth
                variant="outlined"
                value={bulkImportUrl}
                onChange={(e) => setBulkImportUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isBulkImporting) {
                    e.preventDefault();
                    handleBulkImport();
                  }
                }}
                placeholder="https://github.com/organization/"
                required
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <GitHubIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              {/* Repository Filter Options */}
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={excludeForks} 
                      onChange={(e) => setExcludeForks(e.target.checked)}
                    />
                  }
                  label="Exclude fork repositories"
                />
              </Box>
              
              {/* Project Creation Options */}
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Project Creation Options
              </Typography>
              <Box sx={{ ml: 1 }}>
                <FormControl component="fieldset">
                  <RadioGroup
                    name="projectCreationMode"
                    value={projectCreationMode || 'none'}
                    onChange={(e) => setProjectCreationMode(e.target.value)}
                  >
                    <FormControlLabel 
                      value="none" 
                      control={<Radio />} 
                      label="Do not create any projects"
                    />
                    <FormControlLabel 
                      value="single" 
                      control={<Radio />} 
                      label="Create a single project with all repositories" 
                    />
                    <FormControlLabel 
                      value="per_owner" 
                      control={<Radio />} 
                      label="Create one project per username/organization" 
                    />
                  </RadioGroup>
                </FormControl>
                
                {(projectCreationMode === 'single' || projectCreationMode === 'per_owner') && (
                  <TextField
                    margin="dense"
                    id="projectNameTemplate"
                    label="Project Name Template"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={projectNameTemplate || 'GitHub Import - {owner}'}
                    onChange={(e) => setProjectNameTemplate(e.target.value)}
                    helperText="Use {owner} as placeholder for username/organization name"
                    sx={{ mt: 1, mb: 2 }}
                  />
                )}
              </Box>
              
              {/* Conditional display of GitHub token message */}
              {!hasGithubToken && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  This operation requires a GitHub API token to be set in the settings.
                  It will import all public repositories from the specified user or organization.
                </Alert>
              )}
            </>
          )}
          
          {addingRepo && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" align="center" gutterBottom>
                Cloning in progress...
              </Typography>
              
              <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                {cloneSteps.map((step, index) => (
                  <Step key={step.label} completed={step.completed}>
                    <StepLabel>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              
              <Typography variant="body1" sx={{ mb: 1 }}>
                {cloneStatus || 'Preparing to clone...'}
              </Typography>
              
              <LinearProgress 
                variant="determinate" 
                value={cloneProgress} 
                sx={{ mb: 1, height: 10, borderRadius: 5 }}
              />
              
              <Typography variant="body2" align="right">
                {Math.round(cloneProgress)}%
              </Typography>
              
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                Cloning large repositories may take several minutes.
                Please be patient...
              </Typography>
            </Box>
          )}
          
          {isBulkImporting && bulkImportStatus && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" align="center" gutterBottom>
                Bulk Import in Progress
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {bulkImportStatus.message || `Importing repositories from ${bulkImportStatus.owner || bulkImportUrl}`}
                </Typography>
                
                <LinearProgress 
                  variant="determinate" 
                  value={bulkImportStatus.progress || 0} 
                  sx={{ mb: 1, height: 10, borderRadius: 5 }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    {bulkImportStatus.completedRepos || 0}/{bulkImportStatus.totalRepos || '?'} repositories processed
                  </Typography>
                  <Typography variant="body2">
                    {Math.round(bulkImportStatus.progress || 0)}%
                  </Typography>
                </Box>
                
                {/* Add stage indicator */}
                {bulkImportStatus.processingAssets ? (
                  <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                    Stage: Processing Repository Assets (Generating logs and downloading avatars)
                  </Typography>
                ) : bulkImportStatus.status === 'completed' ? (
                  <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                    Stage: Complete
                  </Typography>
                ) : (
                  <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                    Stage: Importing Repositories
                  </Typography>
                )}
              </Box>
              
              {bulkImportStatus.repositories && bulkImportStatus.repositories.length > 0 && (
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', p: 0 }}>
                  <List dense>
                    {bulkImportStatus.repositories.map((repo, index) => (
                      <React.Fragment key={repo.name}>
                        <ListItem>
                          <ListItemIcon>
                            {repo.status === 'completed' && <CheckIcon color="success" />}
                            {repo.status === 'failed' && <ErrorIcon color="error" />}
                            {repo.status === 'skipped' && <SkipIcon color="warning" />}
                            {repo.status === 'cloning' && <CloudDownloadIcon color="primary" />}
                            {repo.status === 'pending' && <CloudSyncIcon color="disabled" />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={repo.name} 
                            secondary={repo.message || repo.status}
                          />
                          <Chip 
                            size="small" 
                            label={repo.status} 
                            color={
                              repo.status === 'completed' ? 'success' :
                              repo.status === 'failed' ? 'error' :
                              repo.status === 'skipped' ? 'warning' :
                              repo.status === 'cloning' ? 'primary' :
                              'default'
                            }
                          />
                        </ListItem>
                        {index < bulkImportStatus.repositories.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              )}
              
              {/* Display created projects */}
              {bulkImportStatus.createdProjects && bulkImportStatus.createdProjects.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Created Projects
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <List dense>
                      {bulkImportStatus.createdProjects.map((project, index) => (
                        <React.Fragment key={project.id}>
                          <ListItem>
                            <ListItemIcon>
                              <CheckIcon color="success" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={project.name} 
                              secondary={`${project.repoCount} repositories`}
                            />
                          </ListItem>
                          {index < bulkImportStatus.createdProjects.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                </Box>
              )}
              
              {/* Display processing assets message when applicable */}
              {!isBulkImporting && bulkImportStatus.status === 'completed' && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <AlertTitle>Import Completed Successfully</AlertTitle>
                    Imported {bulkImportStatus.completedRepos - bulkImportStatus.failedRepos}/{bulkImportStatus.totalRepos} repositories
                    {bulkImportStatus.createdProjects && bulkImportStatus.createdProjects.length > 0 && 
                      ` and created ${bulkImportStatus.createdProjects.length} project(s)`}
                  </Alert>
                  
                  {bulkImportStatus.processingAssets && (
                    <>
                      <Typography color="text.secondary" sx={{ mt: 2 }}>
                        Please wait while repository assets are being processed...
                      </Typography>
                      <LinearProgress sx={{ mt: 2 }} />
                    </>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseAddDialog} 
            disabled={addingRepo || isBulkImporting || (bulkImportStatus?.status === 'completed' && bulkImportStatus?.processingAssets)}
          >
            {bulkImportStatus?.status === 'completed' ? 'Close' : 'Cancel'}
          </Button>
          
          {dialogMode === 'single' && !addingRepo && (
            <Button 
              onClick={handleAddRepository} 
              variant="contained" 
              disabled={!newRepoUrl}
            >
              Add Repository
            </Button>
          )}
          
          {dialogMode === 'bulk' && !isBulkImporting && (
            <Button 
              onClick={handleBulkImport} 
              variant="contained" 
              disabled={!bulkImportUrl}
              startIcon={<CloudDownloadIcon />}
            >
              Start Bulk Import
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Repository Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Repository</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the repository "{repoToDelete?.name}"?
            This will remove it from all projects and delete local files.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deletingRepo}>Cancel</Button>
          <Button 
            onClick={handleDeleteRepository} 
            color="error" 
            variant="contained" 
            disabled={deletingRepo}
            startIcon={deletingRepo && <CircularProgress size={16} color="inherit" />}
          >
            {deletingRepo ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Repositories Dialog */}
      <Dialog open={openDeleteUserDialog} onClose={handleCloseDeleteUserDialog}>
        <DialogTitle>Delete All Repositories</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all repositories from "{userToDelete}"?
            This will remove {groupedRepositories[userToDelete]?.length || 0} repositories and their local files.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteUserDialog} disabled={deletingUserRepos}>Cancel</Button>
          <Button 
            onClick={handleDeleteUserRepositories} 
            color="error" 
            variant="contained" 
            disabled={deletingUserRepos}
            startIcon={deletingUserRepos && <CircularProgress size={16} color="inherit" />}
          >
            {deletingUserRepos ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RepositoriesPage; 