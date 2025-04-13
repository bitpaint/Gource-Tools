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
  Radio
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

const RepositoriesPage = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupedRepositories, setGroupedRepositories] = useState({});
  const [expandedOwners, setExpandedOwners] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add repository dialog
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [addingRepo, setAddingRepo] = useState(false);
  
  // Cloning progress tracking
  const [cloneProgress, setCloneProgress] = useState(0);
  const [cloneStatus, setCloneStatus] = useState('');
  const [cloneId, setCloneId] = useState(null);
  const [cloneSteps, setCloneSteps] = useState([
    { label: 'Preparation', completed: false },
    { label: 'Cloning', completed: false },
    { label: 'Log Generation', completed: false },
    { label: 'Finalization', completed: false }
  ]);
  const [activeStep, setActiveStep] = useState(0);
  
  // Bulk import
  const [bulkImportUrl, setBulkImportUrl] = useState('');
  const [bulkImportId, setBulkImportId] = useState(null);
  const [bulkImportStatus, setBulkImportStatus] = useState(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [dialogMode, setDialogMode] = useState('single'); // 'single' or 'bulk'
  
  // Delete repository dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [repoToDelete, setRepoToDelete] = useState(null);
  const [deletingRepo, setDeletingRepo] = useState(false);

  // Project creation options
  const [projectCreationMode, setProjectCreationMode] = useState('none');
  const [projectNameTemplate, setProjectNameTemplate] = useState('{owner}');
  
  // Ajouter un état pour vérifier si un token GitHub est configuré
  const [hasGithubToken, setHasGithubToken] = useState(false);
  
  // Delete user repositories dialog
  const [openDeleteUserDialog, setOpenDeleteUserDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
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
    try {
      setLoading(true);
      setError(null);
      const response = await repositoriesApi.getAll();
      setRepositories(response.data);
      
      // Group repositories by owner
      const grouped = response.data.reduce((acc, repo) => {
        const owner = repo.owner || 'unknown';
        if (!acc[owner]) {
          acc[owner] = [];
        }
        acc[owner].push(repo);
        return acc;
      }, {});
      
      setGroupedRepositories(grouped);
    } catch (err) {
      console.error('Error fetching repositories:', err);
      setError('Failed to load repositories. Please try again.');
      toast.error('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  }, []);  // Empty dependency array ensures this only changes when component mounts/unmounts

  // Load repositories on component mount
  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);  // Now we need to include fetchRepositories as a dependency
  
  // Initialize all owners as expanded on load
  useEffect(() => {
    const initialExpandedState = {};
    Object.keys(groupedRepositories).forEach(owner => {
      initialExpandedState[owner] = true;
    });
    setExpandedOwners(initialExpandedState);
  }, [groupedRepositories]);
  
  // Polling for clone status if a clone is in progress
  useEffect(() => {
    let interval;
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
            clearInterval(interval);
            
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
          clearInterval(interval);
        }
      }, 1000); // Poll every second
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cloneId, addingRepo, cloneSteps, fetchRepositories]);
  
  // Polling for bulk import status
  useEffect(() => {
    let interval;
    if (bulkImportId && isBulkImporting) {
      console.log('Démarrage du polling pour le statut d\'importation:', bulkImportId);
      
      // Attendre un peu avant de commencer le polling pour donner
      // au serveur le temps de démarrer le traitement
      setTimeout(() => {
        interval = setInterval(async () => {
          try {
            console.log('Envoi d\'une requête de statut pour:', bulkImportId);
            const response = await repositoriesApi.getBulkImportStatus(bulkImportId);
            setBulkImportStatus(response.data);
            console.log('Statut reçu:', response.data.status, 'Progress:', response.data.progress);
            
            // If bulk import is complete, stop polling
            if (response.data.status === 'completed' || response.data.status === 'failed') {
              clearInterval(interval);
              
              if (response.data.status === 'completed') {
                // Refresh repository list
                await fetchRepositories();
                
                let successMessage = `Bulk import completed. Imported ${response.data.completedRepos - response.data.failedRepos}/${response.data.totalRepos} repositories.`;
                
                // Add project creation info to success message
                if (response.data.createdProjects && response.data.createdProjects.length > 0) {
                  successMessage += ` Created ${response.data.createdProjects.length} project(s).`;
                }
                
                toast.success(successMessage);
                
                // Wait a short time to show the completed status before closing
                setTimeout(() => {
                  // First set importing to false
                  setIsBulkImporting(false);
                  // Then close the dialog
                  setOpenAddDialog(false);
                  // Reset bulk import state
                  setBulkImportId(null);
                  setBulkImportStatus(null);
                }, 2000); // 2 seconds delay before closing
              } else {
                toast.error(`Bulk import failed: ${response.data.error || 'Unknown error'}`);
                setIsBulkImporting(false);
              }
            }
          } catch (err) {
            console.error('Error fetching bulk import status:', err);
            clearInterval(interval);
          }
        }, 3000); // Poll every 3 seconds instead of 2
      }, 2000); // Attendre 2 secondes avant de commencer le polling
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
        url: newRepoUrl
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
    } catch (err) {
      console.error('Error adding repository:', err);
      const errorMessage = err.response?.data?.error 
        ? `${err.response.data.error}: ${err.response.data.details || ''}`
        : 'Failed to add repository';
      toast.error(errorMessage);
      setAddingRepo(false);
    }
  };
  
  const handleBulkImport = async () => {
    if (!bulkImportUrl) {
      toast.error('GitHub URL is required');
      return;
    }
    
    try {
      console.log('Démarrage de l\'importation en masse pour:', bulkImportUrl);
      
      setIsBulkImporting(true);
      setBulkImportStatus({
        progress: 0,
        status: 'initializing',
        message: 'Starting bulk import...'
      });
      
      // Préparer le template de nom pour les projets combinés
      let finalTemplate = projectNameTemplate;
      
      // Pour les projets combinés, utiliser 'owner1 - owner2' si le mode est 'single'
      if (projectCreationMode === 'single') {
        finalTemplate = 'owner1 - owner2';
      }
      
      console.log('Envoi de la requête d\'importation avec skipConfirmation:', true);
      
      const response = await repositoriesApi.bulkImport({
        githubUrl: bulkImportUrl,
        projectCreationMode: projectCreationMode || 'none',
        projectNameTemplate: finalTemplate || '{owner}',
        skipConfirmation: true,
        repoLimit: 99999
      });
      
      if (response.data && response.data.bulkImportId) {
        console.log('Importation démarrée avec ID:', response.data.bulkImportId);
        setBulkImportId(response.data.bulkImportId);
        toast.info(`Bulk import started for ${bulkImportUrl}`);
        
        // Mettre à jour immédiatement l'état pour refléter le démarrage
        setBulkImportStatus({
          progress: 5,
          status: 'processing',
          message: 'Importation en cours...'
        });
      } else {
        console.error('Réponse d\'importation sans ID:', response.data);
        toast.error('Failed to start bulk import: No import ID received');
        setIsBulkImporting(false);
      }
    } catch (err) {
      console.error('Error starting bulk import:', err);
      const errorMessage = err.response?.data?.error 
        ? `${err.response.data.error}: ${err.response.data.details || ''}`
        : 'Failed to start bulk import';
      toast.error(errorMessage);
      setIsBulkImporting(false);
    }
  };

  const handleUpdateRepository = async (id) => {
    try {
      const repoIndex = repositories.findIndex(repo => repo.id === id);
      if (repoIndex === -1) {
        toast.error(`Repository with ID ${id} not found in local state`);
        await fetchRepositories();
        return;
      }

      const repo = repositories[repoIndex];
      repo.updating = true;
      setRepositories([...repositories]);

      try {
        const response = await repositoriesApi.update(id);
        
        // Refresh the entire list to ensure everything is up to date
        await fetchRepositories();
        
        // Check if there were warnings or errors in the log generation
        if (response.data.logStatus === 'warning') {
          toast.warning(`Repository updated but with warnings: ${response.data.logMessage}`);
        } else if (response.data.logStatus === 'error') {
          toast.warning(`Repository updated but log generation failed: ${response.data.logMessage}`);
        } else {
          const newCommitsMessage = response.data.newCommitsCount > 0 
            ? ` (${response.data.newCommitsCount} new commits found)`
            : '';
          toast.success(`Repository updated successfully${newCommitsMessage}`);
        }
      } catch (err) {
        console.error('Error updating repository:', err);
        
        // Si l'erreur est 404, on recharge la liste complète pour synchro
        if (err.response?.status === 404) {
          toast.error(`Repository with ID ${id} not found on server. Refreshing list...`);
          await fetchRepositories();
        } else {
          // Display a more descriptive error message
          const errorMessage = err.response?.data?.error 
            ? `Failed to update repository: ${err.response.data.error}`
            : 'Failed to update repository';
          toast.error(errorMessage);
          
          // Update UI to show repo is no longer updating
          const updatedRepos = [...repositories];
          const repoIndex = updatedRepos.findIndex(repo => repo.id === id);
          if (repoIndex !== -1) {
            updatedRepos[repoIndex].updating = false;
            setRepositories(updatedRepos);
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error in handleUpdateRepository:', err);
      toast.error('An unexpected error occurred');
    }
  };

  const handleDeleteRepository = async () => {
    if (!repoToDelete) return;
    
    try {
      setDeletingRepo(true);
      await repositoriesApi.delete(repoToDelete.id);
      
      // Refresh the entire list to ensure everything is up to date
      await fetchRepositories();
      
      toast.success('Repository deleted successfully');
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting repository:', err);
      toast.error('Failed to delete repository');
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
    setProjectCreationMode('none');
    setProjectNameTemplate('{owner}');
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    if (!addingRepo && !isBulkImporting) {
      setOpenAddDialog(false);
      setCloneId(null);
      setCloneProgress(0);
      setCloneStatus('');
      setBulkImportUrl('');
      setBulkImportId(null);
      setBulkImportStatus(null);
    }
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

  // Nouvelle fonction pour supprimer tous les dépôts d'un utilisateur
  const handleDeleteUserRepositories = async () => {
    if (!userToDelete) return;
    
    try {
      setDeletingUserRepos(true);
      let successCount = 0;
      let errorCount = 0;
      
      // Liste des IDs qui ont déjà échoué pour éviter une boucle infinie
      const failedIds = new Set();
      
      // Récupérer la liste initiale des dépôts
      await fetchRepositories();
      let currentUserRepos = groupedRepositories[userToDelete] || [];
      
      // Continuer tant qu'il reste des dépôts pour cet utilisateur
      // et que nous n'avons pas déjà essayé tous les dépôts sans succès
      while (currentUserRepos.length > 0 && failedIds.size < currentUserRepos.length) {
        // Trouver le premier dépôt qui n'a pas encore échoué
        const repoToDelete = currentUserRepos.find(repo => !failedIds.has(repo.id));
        
        // Si tous les dépôts ont échoué, sortir de la boucle
        if (!repoToDelete) break;
        
        try {
          await repositoriesApi.delete(repoToDelete.id);
          successCount++;
          // Récupérer la liste mise à jour après suppression réussie
          await fetchRepositories();
          currentUserRepos = groupedRepositories[userToDelete] || [];
        } catch (err) {
          console.error(`Error deleting repository ${repoToDelete.name}:`, err);
          errorCount++;
          // Marquer cet ID comme ayant échoué
          failedIds.add(repoToDelete.id);
        }
      }
      
      // Mise à jour finale de la liste
      await fetchRepositories();
      
      const message = `${successCount} repositories deleted${errorCount > 0 ? `, ${errorCount} failures` : ''}`;
      toast.success(message);
      handleCloseDeleteUserDialog();
    } catch (err) {
      console.error('Error deleting user repositories:', err);
      toast.error('Failed to delete repositories');
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
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenAddDialog('single')}
            sx={{ mr: 1 }}
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
              
              <IconButton 
                size="small" 
                color="error"
                onClick={() => handleOpenDeleteUserDialog(owner)}
                title={`Delete all repositories from ${owner}`}
              >
                <DeleteForeverIcon />
              </IconButton>
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
                          <TableCell align="right">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleUpdateRepository(repo.id)}
                              disabled={repo.updating}
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
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseAddDialog} 
            disabled={addingRepo || isBulkImporting}
          >
            {bulkImportStatus?.status === 'completed' || bulkImportStatus?.status === 'failed' ? 'Close' : 'Cancel'}
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