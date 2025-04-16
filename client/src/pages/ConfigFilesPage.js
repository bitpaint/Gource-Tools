import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Alert,
  TextField,
  CircularProgress,
  InputAdornment,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { 
  gourceConfigsApi, 
  dateUtils, 
  settingsApi 
} from '../api/api';
import { defaultSettings, settingsDescriptions } from '../shared/defaultGourceConfig';
import { convertFormToApiParams, convertApiToFormParams } from '../utils/gourceUtils';

// Import the dialog component
import GourceConfigEditorDialog from '../components/gource-config/GourceConfigEditorDialog';

const ConfigFilesPage = () => {
  const [gourceConfigs, setGourceConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for default config ID
  const [defaultConfigId, setDefaultConfigId] = useState(null);

  // Profile dialog state
  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentConfig, setCurrentConfig] = useState({
    id: null,
    name: '',
    description: '',
    settings: {
      ...convertApiToFormParams({ ...defaultSettings }),
      useRelativeStartDate: false,
      relativeStartDateValue: ''
    },
    isSystemConfig: false
  });
  const [savingConfig, setSavingConfig] = useState(false);
  
  // Delete dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);
  const [deletingConfig, setDeletingConfig] = useState(false);

  // Load configs and default setting on component mount
  useEffect(() => {
    fetchGourceConfigs();
    fetchDefaultConfigId();
  }, []);

  const fetchGourceConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await gourceConfigsApi.getAll();
      setGourceConfigs(response.data);
    } catch (err) {
      console.error('Error fetching Gource configs:', err);
      setError('Failed to load Gource config files. Please try again.');
      toast.error('Failed to load Gource config files');
    } finally {
      setLoading(false);
    }
  };

  // Fetch the current default config ID
  const fetchDefaultConfigId = async () => {
    try {
      const response = await settingsApi.getDefaultGourceConfigId();
      setDefaultConfigId(response.data.defaultProjectGourceConfigId);
    } catch (err) {
      console.error('Error fetching default Gource config ID:', err);
      toast.error('Failed to load default Gource config setting');
    }
  };

  // Profile handlers
  const handleOpenConfigDialog = (config = null) => {
    if (config) {
      setIsEditing(true);
      const formParams = convertApiToFormParams({ ...config.settings });
      setCurrentConfig({
        id: config.id,
        name: config.name,
        description: config.description || '',
        settings: formParams,
        isSystemConfig: config.isSystemConfig || false
      });
    } else {
      setIsEditing(false);
      const initialFormSettings = convertApiToFormParams({ ...defaultSettings });
      initialFormSettings.title = false; // Ensure title is false for new configs
      
      setCurrentConfig({
        id: null,
        name: '',
        description: '',
        settings: {
          ...initialFormSettings,
          useRelativeStartDate: false,
          relativeStartDateValue: ''
        },
        isSystemConfig: false
      });
    }
    setOpenConfigDialog(true);
  };

  const handleCloseConfigDialog = () => {
    setOpenConfigDialog(false);
  };

  const handleSaveConfig = async () => {
    if (!currentConfig.name) {
      toast.error('Gource config name is required');
      return;
    }

    try {
      setSavingConfig(true);
      const apiParams = convertFormToApiParams(currentConfig.settings);
      
      const configToSave = {
        ...currentConfig,
        settings: apiParams
      };
      
      let response;
      if (isEditing) {
        response = await gourceConfigsApi.update(configToSave.id, configToSave);
        const updatedConfigs = gourceConfigs.map(cfg => 
          cfg.id === configToSave.id ? response.data : cfg
        );
        setGourceConfigs(updatedConfigs);
        toast.success('Gource config file updated successfully');
      } else {
        response = await gourceConfigsApi.create(configToSave);
        setGourceConfigs([...gourceConfigs, response.data]);
        toast.success('Gource config file created successfully');
      }
      
      handleCloseConfigDialog();
    } catch (err) {
      console.error('Error saving Gource config:', err);
      toast.error(err.response?.data?.error || 'Failed to save Gource config file');
    } finally {
      setSavingConfig(false);
    }
  };

  // Delete profile handlers
  const handleOpenDeleteDialog = (config) => {
    setConfigToDelete(config);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setConfigToDelete(null);
  };

  const handleDeleteConfig = async () => {
    if (!configToDelete) return;
    
    if (configToDelete.isSystemConfig) {
        toast.error('System Gource configurations cannot be deleted.');
        handleCloseDeleteDialog();
        return;
    }

    try {
      setDeletingConfig(true);
      await gourceConfigsApi.delete(configToDelete.id);
      
      setGourceConfigs(gourceConfigs.filter(cfg => cfg.id !== configToDelete.id));
      toast.success('Gource config file deleted successfully');
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting Gource config:', err);
      if (err.response?.data?.error === 'System Gource configurations cannot be deleted.') {
         toast.error('System Gource configurations cannot be deleted.');
      } else {
         toast.error('Failed to delete Gource config file');
      }
    } finally {
      setDeletingConfig(false);
    }
  };

  // Handler for duplicating a config
  const handleDuplicateConfig = async (configToDuplicate) => {
    const newConfigName = `${configToDuplicate.name} (Copy)`;
    const newConfigSettings = { ...configToDuplicate.settings };

    const newConfig = {
      name: newConfigName,
      description: configToDuplicate.description || '',
      settings: newConfigSettings,
      isSystemConfig: false
    };

    try {
      setLoading(true);
      const response = await gourceConfigsApi.create(newConfig);
      setGourceConfigs([...gourceConfigs, response.data]);
      toast.success(`Gource config "${configToDuplicate.name}" duplicated successfully as "${newConfigName}"`);
    } catch (err) {
      console.error('Error duplicating Gource config:', err);
      toast.error(err.response?.data?.error || 'Failed to duplicate Gource config file');
    } finally {
      setLoading(false);
    }
  };

  // Handler for setting a config as the default
  const handleSetDefaultConfig = async (configId) => {
    const previousDefaultId = defaultConfigId;
    setDefaultConfigId(configId);

    try {
      await settingsApi.setDefaultGourceConfigId(configId);
      toast.success('Default project Gource config updated successfully');
    } catch (err) {
      setDefaultConfigId(previousDefaultId);
      console.error('Error setting default Gource config:', err);
      toast.error('Failed to set default Gource config');
    }
  };

  // Filtered configs based on search query
  const filteredConfigs = gourceConfigs.filter(config => 
    config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (config.description && config.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return dateUtils.formatLocaleDate(new Date(dateString));
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Utility function to display config properties with dashes
  const getConfigSetting = (config, key) => {
    if (key.includes('-')) {
      return config.settings[key];
    }
    return config.settings[key];
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom>
        Gource Config Files
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Create and manage Gource configuration files
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 3 }}>
        <TextField
          placeholder="Search config files..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: '350px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenProfileDialog()}
        >
          Create Config File
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Background Color</TableCell>
                <TableCell>Seconds per Day</TableCell>
                <TableCell>Last Modified</TableCell>
                <TableCell>Actions</TableCell>
                <TableCell>Default</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No config files found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>{profile.name}</TableCell>
                    <TableCell>
                      <Tooltip title={profile.description || ''} placement="top-start">
                        <Typography 
                          noWrap 
                          sx={{
                            maxWidth: '300px', // Adjust max-width as needed
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block' // Ensure Typography behaves like a block element for ellipsis
                          }}
                        >
                          {profile.description || 'No description'}{profile.isSystemProfile && ' (System)'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1 
                      }}>
                        <Box 
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            bgcolor: profile.settings.background || '#000000',
                            borderRadius: '4px',
                            border: '1px solid rgba(224, 224, 224, 1)'
                          }} 
                        />
                        {profile.settings.background || '#000000'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {/* Display 'auto' if speed is dynamic */} 
                      {(() => {
                        const spdSetting = getProfileSetting(profile, 'seconds-per-day');
                        const startDateSetting = profile.settings.startDate;
                        
                        // Check if SPD contains 'auto' or if start date is relative
                        if ((typeof spdSetting === 'string' && spdSetting.includes('auto')) ||
                            (typeof startDateSetting === 'string' && startDateSetting.startsWith('relative'))) {
                          return 'auto';
                        }
                        // Otherwise, return the numeric value or default to 1
                        return spdSetting || '1';
                      })()}
                    </TableCell>
                    <TableCell>{formatDate(profile.updatedAt)}</TableCell>
                    <TableCell>
                      {/* Edit Button */}
                      <Tooltip title={profile.isSystemProfile ? "System profiles cannot be edited" : "Edit profile"}>
                        <span> {/* Span needed for tooltip on disabled button */}
                          <IconButton 
                            color="primary" 
                            onClick={() => handleOpenProfileDialog(profile)}
                            disabled={profile.isSystemProfile}
                          >
                            <EditIcon />
                          </IconButton>
                        </span>
                      </Tooltip>

                      {/* Duplicate Button */}
                      <Tooltip title="Duplicate profile">
                         <IconButton color="default" onClick={() => handleDuplicateProfile(profile)}>
                           <ContentCopyIcon />
                         </IconButton>
                      </Tooltip>

                      {/* Delete Button - Show only one, disable for system profiles */}
                      <Tooltip title={profile.isSystemProfile ? "System profiles cannot be deleted" : "Delete profile"}>
                        <span> {/* Span needed for tooltip on disabled button */}
                          <IconButton 
                            color="error" 
                            onClick={() => handleOpenDeleteDialog(profile)} 
                            disabled={profile.isSystemProfile}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      {profile.id === defaultProfileId ? (
                        <Tooltip title="This is the default profile for new projects.">
                          <CheckCircleIcon color="success" />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Set as default profile for new projects">
                          <Button 
                            size="small" 
                            onClick={() => handleSetDefaultProfile(profile.id)}
                            startIcon={<CheckCircleIcon sx={{ color: 'action.disabled' }} />}
                          >
                            Set Default
                          </Button>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Config File Dialog - Using our new component */}
      <GourceConfigEditorDialog
        open={openProfileDialog} 
        onClose={handleCloseProfileDialog}
        onSave={handleSaveProfile}
        currentProfile={currentProfile}
        setCurrentProfile={setCurrentProfile}
        isEditing={isEditing}
        savingProfile={savingProfile}
        settingsDescriptions={settingsDescriptions}
      />

      {/* Delete Config File Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Gource Config File</DialogTitle>
        {profileToDelete?.isSystemProfile && (
          <DialogContentText sx={{ px: 3, color: 'error.main' }}>
            System profiles cannot be deleted.
          </DialogContentText>
        )}
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the config file "{profileToDelete?.name}"?
            Any projects using this file will revert to default settings.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deletingProfile}>Cancel</Button>
          <Button 
            onClick={handleDeleteProfile} 
            color="error" 
            variant="contained" 
            disabled={deletingProfile || profileToDelete?.isSystemProfile}
            startIcon={deletingProfile && <CircularProgress size={16} color="inherit" />}
          >
            {deletingProfile ? 'Deleting...' : (profileToDelete?.isSystemProfile ? 'Cannot Delete' : 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ConfigFilesPage; 