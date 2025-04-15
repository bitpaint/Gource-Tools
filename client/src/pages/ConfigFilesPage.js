import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  HelpOutline,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { renderProfilesApi, dateUtils, settingsApi } from '../api/api';
import { defaultSettings, settingsDescriptions } from '../shared/defaultGourceConfig';
import { 
  getCommonResolutions,
  getCameraModes,
  convertFormToApiParams,
  convertApiToFormParams,
} from '../utils/gourceUtils';

// Import custom components
import ColorPickerField from '../components/ColorPickerField';
import TooltipField from '../components/TooltipField';
import TooltipSlider from '../components/TooltipSlider';
import TooltipCheckbox from '../components/TooltipCheckbox';

// Config file tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Utiliser les fonctions importées plutôt que de définir des constantes redondantes
const cameraModes = getCameraModes();
const commonResolutions = getCommonResolutions();

const ConfigFilesPage = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for default profile ID
  const [defaultProfileId, setDefaultProfileId] = useState(null);

  // Profile dialog state
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProfile, setCurrentProfile] = useState({
    id: null,
    name: '',
    description: '',
    settings: {
      ...convertApiToFormParams({ ...defaultSettings }),
      useRelativeStartDate: false,
      relativeStartDateValue: ''
    }
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Delete dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [deletingProfile, setDeletingProfile] = useState(false);

  // Load profiles and default setting on component mount
  useEffect(() => {
    fetchProfiles();
    fetchDefaultProfileId();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await renderProfilesApi.getAll();
      setProfiles(response.data);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError('Failed to load config files. Please try again.');
      toast.error('Failed to load config files');
    } finally {
      setLoading(false);
    }
  };

  // Fetch the current default profile ID
  const fetchDefaultProfileId = async () => {
    try {
      const response = await settingsApi.getDefaultProfileId();
      setDefaultProfileId(response.data.defaultProjectProfileId);
    } catch (err) {
      console.error('Error fetching default profile ID:', err);
      toast.error('Failed to load default profile setting');
    }
  };

  // Profile handlers
  const handleOpenProfileDialog = (profile = null) => {
    if (profile) {
      setIsEditing(true);
      // Convertir les paramètres API au format du formulaire
      const formParams = convertApiToFormParams({ ...profile.settings });
      setCurrentProfile({
        id: profile.id,
        name: profile.name,
        description: profile.description || '',
        settings: formParams
      });
    } else {
      setIsEditing(false);
      setCurrentProfile({
        id: null,
        name: '',
        description: '',
        settings: {
          ...convertApiToFormParams({ ...defaultSettings }),
          useRelativeStartDate: false,
          relativeStartDateValue: ''
        }
      });
    }
    setTabValue(0);
    setOpenProfileDialog(true);
  };

  const handleCloseProfileDialog = () => {
    setOpenProfileDialog(false);
  };

  const handleSaveProfile = async () => {
    if (!currentProfile.name) {
      toast.error('Profile name is required');
      return;
    }

    try {
      setSavingProfile(true);
      
      // Convertir les paramètres de formulaire au format API
      const apiParams = convertFormToApiParams(currentProfile.settings);
      
      // Vérification de débogage
      console.log('Paramètres originaux:', currentProfile.settings);
      console.log('Paramètres convertis pour API:', apiParams);
      
      // Utiliser les paramètres convertis
      const profileToSave = {
        ...currentProfile,
        settings: apiParams
      };
      
      if (isEditing) {
        // Update existing profile
        const response = await renderProfilesApi.update(profileToSave.id, profileToSave);
        
        // Update profiles array
        const updatedProfiles = profiles.map(profile => 
          profile.id === profileToSave.id ? response.data : profile
        );
        setProfiles(updatedProfiles);
        
        toast.success('Config file updated successfully');
      } else {
        // Create new profile
        const response = await renderProfilesApi.create(profileToSave);
        setProfiles([...profiles, response.data]);
        toast.success('Config file created successfully');
      }
      
      handleCloseProfileDialog();
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error(err.response?.data?.error || 'Failed to save config file');
    } finally {
      setSavingProfile(false);
    }
  };

  // Delete profile handlers
  const handleOpenDeleteDialog = (profile) => {
    setProfileToDelete(profile);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setProfileToDelete(null);
  };

  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;
    
    try {
      setDeletingProfile(true);
      await renderProfilesApi.delete(profileToDelete.id);
      
      setProfiles(profiles.filter(profile => profile.id !== profileToDelete.id));
      toast.success('Config file deleted successfully');
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting profile:', err);
      
      // Specific error message for default profile
      if (err.response?.data?.error === 'The default Gource config file cannot be deleted') {
        toast.error('The default Gource config file cannot be deleted');
      } else {
        toast.error('Failed to delete config file');
      }
    } finally {
      setDeletingProfile(false);
    }
  };

  // Handler for duplicating a profile
  const handleDuplicateProfile = async (profileToDuplicate) => {
    const newProfileName = `${profileToDuplicate.name} (Copy)`;
    // Ensure the new profile isn't marked as a system profile
    const newProfileSettings = { ...profileToDuplicate.settings };

    const newProfile = {
      name: newProfileName,
      description: profileToDuplicate.description || '',
      settings: newProfileSettings, // Use the existing settings
      isSystemProfile: false // Duplicated profiles are always user profiles
    };

    try {
      setLoading(true); // Reuse loading state for visual feedback
      const response = await renderProfilesApi.create(newProfile);
      setProfiles([...profiles, response.data]);
      toast.success(`Profile "${profileToDuplicate.name}" duplicated successfully as "${newProfileName}"`);
    } catch (err) {
      console.error('Error duplicating profile:', err);
      toast.error(err.response?.data?.error || 'Failed to duplicate config file');
    } finally {
      setLoading(false);
    }
  };

  // Handler for setting a profile as the default
  const handleSetDefaultProfile = async (profileId) => {
    // Optimistic update
    const previousDefaultId = defaultProfileId;
    setDefaultProfileId(profileId);

    try {
      await settingsApi.setDefaultProfileId(profileId);
      toast.success('Default project profile updated successfully');
    } catch (err) {
      // Revert on error
      setDefaultProfileId(previousDefaultId);
      console.error('Error setting default profile:', err);
      toast.error('Failed to set default profile');
    }
  };

  // Profile settings handlers
  const handleSettingsChange = (key, value) => {
    // Traitement spécial pour certains paramètres
    let processedValue = value;
    
    // Pour les couleurs, s'assurer qu'elles ont toujours un # au début
    if ((key.includes('Color') || key === 'background') && typeof value === 'string' && !value.startsWith('#')) {
      processedValue = '#' + value;
    }
    
    // Pour les paramètres booléens, s'assurer qu'ils sont bien des booléens
    if (['title', 'key', 'showLines', 'disableAutoRotate', 'swapTitleDate', 'highlightUsers', 'hideRoot'].includes(key)) {
      if (value === 'true' || value === '1') {
        processedValue = true;
      } else if (value === 'false' || value === '0') {
        processedValue = false;
      } else {
        processedValue = Boolean(value);
      }
    }
    
    // Handle relative date checkbox toggle
    if (key === 'useRelativeStartDate') {
      const isChecked = Boolean(value);
      setCurrentProfile(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          useRelativeStartDate: isChecked,
          startDate: isChecked ? (prev.settings.relativeStartDateValue || '') : prev.settings.startDateFixed || null,
          relativeStartDateValue: isChecked ? prev.settings.relativeStartDateValue : ''
        }
      }));
      return;
    }

    // Handle relative date dropdown change
    if (key === 'relativeStartDateValue') {
      setCurrentProfile(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          relativeStartDateValue: value,
          startDate: value,
          startDateFixed: prev.settings.startDateFixed
        }
      }));
      return;
    }

    // If changing the fixed start date, store it separately and clear relative markers
    if (key === 'startDate') {
      setCurrentProfile(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          startDate: value,
          startDateFixed: value,
          useRelativeStartDate: false,
          relativeStartDateValue: ''
        }
      }));
      return;
    }
    
    // Mettre à jour l'état
    setCurrentProfile({
      ...currentProfile,
      settings: {
        ...currentProfile.settings,
        [key]: processedValue
      }
    });
    
    // Afficher des informations de débogage en développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`Setting ${key} = ${processedValue} (original: ${value})`);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Filtered profiles based on search query
  const filteredProfiles = profiles.filter(profile => 
    profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (profile.description && profile.description.toLowerCase().includes(searchQuery.toLowerCase()))
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

  // Utility function to display profile properties with dashes
  const getProfileSetting = (profile, key) => {
    // For properties with dashes, use bracket notation
    if (key.includes('-')) {
      return profile.settings[key];
    }
    return profile.settings[key];
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom>
        Config Files
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
      
      {/* Config File Dialog */}
      <Dialog 
        open={openProfileDialog} 
        onClose={handleCloseProfileDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>{isEditing ? 'Edit Config File' : 'Create Config File'}</DialogTitle>
        {currentProfile.isSystemProfile && (
          <DialogContentText sx={{ px: 3, color: 'warning.main' }}>
            Note: System profiles cannot be fully edited or deleted. Changes might be limited.
          </DialogContentText>
        )}
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Config Name"
              type="text"
              fullWidth
              variant="outlined"
              value={currentProfile.name}
              onChange={(e) => setCurrentProfile({...currentProfile, name: e.target.value})}
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
              value={currentProfile.description}
              onChange={(e) => setCurrentProfile({...currentProfile, description: e.target.value})}
              multiline
              rows={2}
            />
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>Config Settings</Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="config settings tabs" variant="scrollable" scrollButtons="auto">
              <Tab label="Video" />
              <Tab label="Visualization" />
              <Tab label="Appearance" />
              <Tab label="Users & Avatars" />
              <Tab label="Time" />
              <Tab label="Filtering" />
              <Tab label="Captions" />
              <Tab label="Advanced" />
            </Tabs>
          </Box>
          
          {/* Video Settings Tab */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure video output settings like resolution, framerate, colors, and window behavior.
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="resolution-label">Resolution</InputLabel>
                  <Select
                    labelId="resolution-label"
                    id="resolution"
                    value={currentProfile.settings.resolution}
                    onChange={(e) => handleSettingsChange('resolution', e.target.value)}
                    label="Resolution"
                    endAdornment={
                      <InputAdornment position="end">
                        <Tooltip title={settingsDescriptions.viewport || 'Set viewport size (e.g., 1280x720)'}>
                          <IconButton size="small" sx={{ mr: 2 }}>
                            <HelpOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    }
                  >
                    {commonResolutions.map((res) => (
                      <MenuItem key={res} value={res}>{res}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Framerate"
                  type="number"
                  value={currentProfile.settings.framerate}
                  onChange={(value) => handleSettingsChange('framerate', parseInt(value) || 30)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">fps</InputAdornment>,
                  }}
                  inputProps={{ min: 24, max: 120 }}
                  tooltip={settingsDescriptions['output-framerate'] || 'Framerate of output (e.g., 30, 60)'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <ColorPickerField
                  label="Background Color"
                  value={currentProfile.settings.background}
                  onChange={(value) => handleSettingsChange('background', value)}
                  tooltip={settingsDescriptions['background-colour'] || 'Background colour in hex (e.g., FFFFFF).'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Show Title"
                  checked={currentProfile.settings.title}
                  onChange={(checked) => handleSettingsChange('title', checked)}
                  tooltip={settingsDescriptions.title || 'Display the title string.'}
                />
              </Grid>
              <Grid item xs={12}>
                <TooltipField
                  label="Custom Title Text"
                  value={currentProfile.settings.titleText}
                  onChange={(value) => handleSettingsChange('titleText', value)}
                  tooltip={settingsDescriptions.title || 'Set a custom title text. If empty, the project name is used.'}
                  placeholder="Leave empty to use project name"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Fullscreen"
                  checked={currentProfile.settings.fullscreen}
                  onChange={(checked) => handleSettingsChange('fullscreen', checked)}
                  tooltip={settingsDescriptions.fullscreen || 'Display in fullscreen mode.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Screen Number (for Fullscreen)"
                  type="number"
                  value={currentProfile.settings.screenNum}
                  onChange={(value) => handleSettingsChange('screenNum', parseInt(value) || 0)}
                  tooltip={settingsDescriptions.screen || 'Screen number to use when in fullscreen mode.'}
                  inputProps={{ min: 0 }}
                  disabled={!currentProfile.settings.fullscreen}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Disable VSync"
                  checked={currentProfile.settings.noVsync}
                  onChange={(checked) => handleSettingsChange('noVsync', checked)}
                  tooltip={settingsDescriptions['no-vsync'] || 'Disable vertical synchronization.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Window Position (XxY)"
                  value={currentProfile.settings.windowPosition}
                  onChange={(value) => handleSettingsChange('windowPosition', value)}
                  tooltip={settingsDescriptions['window-position'] || 'Initial window position (e.g., 100x50).'}
                  placeholder="e.g., 100x50"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Frameless Window"
                  checked={currentProfile.settings.frameless}
                  onChange={(checked) => handleSettingsChange('frameless', checked)}
                  tooltip={settingsDescriptions.frameless || 'Display window without borders or title bar.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Multi-Sampling (Anti-Aliasing)"
                  checked={currentProfile.settings.multiSampling}
                  onChange={(checked) => handleSettingsChange('multiSampling', checked)}
                  tooltip={settingsDescriptions['multi-sampling'] || 'Enable multi-sampling for smoother edges.'}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Visualization Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Control the core visualization elements like camera behavior, node physics, and general display options.
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="camera-mode-label">Camera Mode</InputLabel>
                  <Select
                    labelId="camera-mode-label"
                    id="cameraMode"
                    value={currentProfile.settings.cameraMode}
                    onChange={(e) => handleSettingsChange('cameraMode', e.target.value)}
                    label="Camera Mode"
                    endAdornment={
                      <InputAdornment position="end">
                        <Tooltip title={settingsDescriptions['camera-mode'] || 'Camera mode (overview, track).'}>
                          <IconButton size="small" sx={{ mr: 2 }}>
                            <HelpOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    }
                  >
                    {cameraModes.map((mode) => (
                      <MenuItem key={mode.value} value={mode.value}>{mode.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipSlider
                  label="Elasticity"
                  value={currentProfile.settings.elasticity}
                  onChange={(value) => handleSettingsChange('elasticity', value)}
                  tooltip={settingsDescriptions.elasticity || 'Elasticity of nodes (0.0 to 1.0).'}
                  step={0.1}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 0.5, label: '0.5' },
                    { value: 1, label: '1' }
                  ]}
                  min={0}
                  max={1}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="crop-axis-label">Crop Axis</InputLabel>
                  <Select
                    labelId="crop-axis-label"
                    value={currentProfile.settings.cropAxis}
                    onChange={(e) => handleSettingsChange('cropAxis', e.target.value)}
                    label="Crop Axis"
                    endAdornment={
                      <InputAdornment position="end">
                        <Tooltip title={settingsDescriptions.crop || 'Crop view on an axis (vertical, horizontal).'}>
                          <IconButton size="small" sx={{ mr: 2 }}><HelpOutline fontSize="small" /></IconButton>
                        </Tooltip>
                      </InputAdornment>
                    }
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    <MenuItem value="vertical">Vertical</MenuItem>
                    <MenuItem value="horizontal">Horizontal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Show Lines"
                  checked={currentProfile.settings.showLines}
                  onChange={(checked) => handleSettingsChange('showLines', checked)}
                  tooltip={'Show lines connecting users to files (corresponds to hiding the "tree" element).'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Disable Auto Rotate"
                  checked={currentProfile.settings.disableAutoRotate}
                  onChange={(checked) => handleSettingsChange('disableAutoRotate', checked)}
                  tooltip={settingsDescriptions['disable-auto-rotate'] || 'Disable automatic camera rotation.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Swap Title and Date"
                  checked={currentProfile.settings.swapTitleDate}
                  onChange={(checked) => handleSettingsChange('swapTitleDate', checked)}
                  tooltip={settingsDescriptions['swap-title-date'] || 'Swap the position of the title and date display.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Show User Images"
                  checked={currentProfile.settings.userImageDir}
                  onChange={(checked) => handleSettingsChange('userImageDir', checked)}
                  tooltip={settingsDescriptions['user-image-dir'] || 'Use images from the specified directory as user avatars.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipSlider
                  label="Camera Padding"
                  value={currentProfile.settings.padding}
                  onChange={(value) => handleSettingsChange('padding', value)}
                  tooltip={settingsDescriptions.padding || 'Camera view padding (default: 1.1).'}
                  step={0.1}
                  marks={[{ value: 1, label: '1.0' }, { value: 1.5, label: '1.5' }, { value: 2, label: '2.0' }]}
                  min={1.0}
                  max={2.0}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Appearance Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Adjust the visual appearance, including scaling, font sizes, colors, and image overlays.
            </Typography>
            <Typography variant="h6" gutterBottom>Scaling</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipSlider
                  label="Font Scale"
                  value={currentProfile.settings.fontScale}
                  onChange={(value) => handleSettingsChange('fontScale', value)}
                  tooltip={settingsDescriptions['font-scale'] || 'Scale the size of all fonts.'}
                  step={0.1}
                  marks={[
                    { value: 0.5, label: '0.5x' },
                    { value: 1, label: '1x' },
                    { value: 2, label: '2x' }
                  ]}
                  min={0.5}
                  max={2}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipSlider
                  label="User Scale"
                  value={currentProfile.settings.userScale}
                  onChange={(value) => handleSettingsChange('userScale', value)}
                  tooltip={settingsDescriptions['user-scale'] || 'Change scale of users (default: 1.0).'}
                  step={0.1}
                  marks={[
                    { value: 0.5, label: '0.5x' },
                    { value: 1, label: '1x' },
                    { value: 2, label: '2x' }
                  ]}
                  min={0.5}
                  max={2}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipSlider
                  label="File Scale"
                  value={currentProfile.settings.fileScale}
                  onChange={(value) => handleSettingsChange('fileScale', value)}
                  tooltip={settingsDescriptions['file-scale'] || 'Change scale of files (default: 1.0).'}
                  step={0.1}
                  marks={[
                    { value: 0.5, label: '0.5x' },
                    { value: 1, label: '1x' },
                    { value: 2, label: '2x' }
                  ]}
                  min={0.5}
                  max={2}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipSlider
                  label="Directory Size"
                  value={currentProfile.settings.dirSize}
                  onChange={(value) => handleSettingsChange('dirSize', value)}
                  tooltip={settingsDescriptions['dir-scale'] || 'Change scale of directories (default: 1.0).'}
                  step={0.1}
                  marks={[
                    { value: 0.5, label: '0.5x' },
                    { value: 1, label: '1x' },
                    { value: 2, label: '2x' }
                  ]}
                  min={0.5}
                  max={2}
                />
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Font Sizes</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Default Font Size"
                  type="number"
                  value={currentProfile.settings.fontSize}
                  onChange={(value) => handleSettingsChange('fontSize', parseInt(value) || 16)}
                  tooltip={settingsDescriptions['font-size'] || 'Font size used by date and title.'}
                  inputProps={{ min: 8, max: 32 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Filename Font Size"
                  type="number"
                  value={currentProfile.settings.filenameFontSize}
                  onChange={(value) => handleSettingsChange('filenameFontSize', parseInt(value) || 14)}
                  tooltip={settingsDescriptions['file-font-size'] || 'Font size for filenames.'}
                  inputProps={{ min: 8, max: 32 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Directory Name Font Size"
                  type="number"
                  value={currentProfile.settings.dirnameFontSize}
                  onChange={(value) => handleSettingsChange('dirnameFontSize', parseInt(value) || 14)}
                  tooltip={settingsDescriptions['dir-font-size'] || 'Font size for directory names.'}
                  inputProps={{ min: 8, max: 32 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="User Font Size"
                  type="number"
                  value={currentProfile.settings.userFontSize}
                  onChange={(value) => handleSettingsChange('userFontSize', parseInt(value) || 14)}
                  tooltip={settingsDescriptions.userFontSize || 'Font size for user names.'}
                  inputProps={{ min: 8, max: 32 }}
                />
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Colors</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <ColorPickerField
                  label="Font Color"
                  value={currentProfile.settings.fontColor}
                  onChange={(value) => handleSettingsChange('fontColor', value)}
                  tooltip={settingsDescriptions['font-colour'] || 'Font colour used by date and title in hex.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <ColorPickerField
                  label="Title Color"
                  value={currentProfile.settings.titleColor}
                  onChange={(value) => handleSettingsChange('titleColor', value)}
                  tooltip={settingsDescriptions['title-colour'] || 'Font colour for the title text in hex.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <ColorPickerField
                  label="Directory Color"
                  value={currentProfile.settings.dirColor}
                  onChange={(value) => handleSettingsChange('dirColor', value)}
                  tooltip={settingsDescriptions['dir-colour'] || 'Font colour for directories in hex.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <ColorPickerField
                  label="Highlight Color"
                  value={currentProfile.settings.highlightColor}
                  onChange={(value) => handleSettingsChange('highlightColor', value)}
                  tooltip={settingsDescriptions['highlight-colour'] || 'Font colour for highlighted users in hex.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <ColorPickerField
                  label="Selection Color"
                  value={currentProfile.settings.selectionColor}
                  onChange={(value) => handleSettingsChange('selectionColor', value)}
                  tooltip={settingsDescriptions['selection-colour'] || 'Font colour for selected users and files in hex.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <ColorPickerField
                  label="Filename Color"
                  value={currentProfile.settings.filenameColor}
                  onChange={(value) => handleSettingsChange('filenameColor', value)}
                  tooltip={settingsDescriptions['filename-colour'] || 'Font colour for filenames in hex.'}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Other Appearance</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Transparent Background"
                  checked={currentProfile.settings.transparent}
                  onChange={(checked) => handleSettingsChange('transparent', checked)}
                  tooltip={settingsDescriptions.transparent || 'Make the background transparent.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Directory Name Depth"
                  type="number"
                  value={currentProfile.settings.dirNameDepth}
                  onChange={(value) => handleSettingsChange('dirNameDepth', parseInt(value) || 0)}
                  tooltip={settingsDescriptions['dir-name-depth'] || 'Draw names of directories down to a specific depth.'}
                  helperText="0 for default behavior"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipSlider
                  label="Directory Name Position"
                  value={currentProfile.settings.dirNamePosition}
                  onChange={(value) => handleSettingsChange('dirNamePosition', value)}
                  tooltip={settingsDescriptions['dir-name-position'] || 'Position along edge of the directory name (0.0 to 1.0).'}
                  step={0.1}
                  marks={[
                    { value: 0, label: '0.0' },
                    { value: 0.5, label: '0.5' },
                    { value: 1, label: '1.0' }
                  ]}
                  min={0}
                  max={1}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Filename Time (Seconds)"
                  type="number"
                  value={currentProfile.settings.filenameTime}
                  onChange={(value) => handleSettingsChange('filenameTime', parseFloat(value) || 4.0)}
                  tooltip={settingsDescriptions['filename-time'] || 'Duration to keep filenames on screen (seconds).'}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
            </Grid>

            {/* Background Image & Logo Section */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Background & Logo</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Background Image Path"
                  value={currentProfile.settings.backgroundImage}
                  onChange={(value) => handleSettingsChange('backgroundImage', value)}
                  tooltip={settingsDescriptions['background-image'] || 'Set a background image file path.'}
                  placeholder="e.g., ./images/background.png"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Logo Image Path"
                  value={currentProfile.settings.logo}
                  onChange={(value) => handleSettingsChange('logo', value)}
                  tooltip={settingsDescriptions.logo || 'Logo image to display in the foreground.'}
                  placeholder="e.g., ./images/logo.png"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Logo Offset (XxY)"
                  value={currentProfile.settings.logoOffset}
                  onChange={(value) => handleSettingsChange('logoOffset', value)}
                  tooltip={settingsDescriptions['logo-offset'] || 'Offset position of the logo (e.g., 10x10).'}
                  placeholder="e.g., 10x10, -20x50"
                  disabled={!currentProfile.settings.logo}
                />
              </Grid>
            </Grid>

            {/* Font Sizes Section */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Fonts</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Font File Path"
                  value={currentProfile.settings.fontFile}
                  onChange={(value) => handleSettingsChange('fontFile', value)}
                  tooltip={settingsDescriptions['font-file'] || 'Specify the font file path.'}
                  placeholder="e.g., C:/Windows/Fonts/arial.ttf"
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Users & Avatars Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Manage user avatar display, behavior, and camera focus options.
            </Typography>
            <Typography variant="h6" gutterBottom>Camera & Behavior</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Use User Avatars (from ./avatars)"
                  checked={currentProfile.settings.useUserImageDir}
                  onChange={(checked) => handleSettingsChange('useUserImageDir', checked)}
                  tooltip={settingsDescriptions['user-image-dir'] + ". When checked, uses images (e.g., username.png) from the /avatars folder. Requires specifying the folder path."}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Default User Image Path"
                  value={currentProfile.settings.defaultUserImage}
                  onChange={(value) => handleSettingsChange('defaultUserImage', value)}
                  tooltip={settingsDescriptions['default-user-image'] || 'Path to the default image used if a specific user avatar is not found.'}
                  placeholder="e.g., ./images/default_avatar.png"
                  disabled={!currentProfile.settings.useUserImageDir}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Fixed User Avatar Size"
                  checked={currentProfile.settings.fixedUserSize}
                  onChange={(checked) => handleSettingsChange('fixedUserSize', checked)}
                  tooltip={settingsDescriptions['fixed-user-size'] || 'Keep user avatar size constant regardless of activity.'}
                  disabled={!currentProfile.settings.useUserImageDir}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Colour User Avatars"
                  checked={currentProfile.settings.colourImages}
                  onChange={(checked) => handleSettingsChange('colourImages', checked)}
                  tooltip={settingsDescriptions['colour-images'] || 'Apply user-specific colors to their avatar images.'}
                  disabled={!currentProfile.settings.useUserImageDir}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Follow Specific User"
                  value={currentProfile.settings.followUser}
                  onChange={(value) => handleSettingsChange('followUser', value)}
                  tooltip={settingsDescriptions['follow-user'] || 'Camera will automatically follow this user (enter exact username).'}
                  placeholder="Enter exact username"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipSlider
                  label="User Friction"
                  value={currentProfile.settings.userFriction}
                  onChange={(value) => handleSettingsChange('userFriction', value)}
                  tooltip={settingsDescriptions['user-friction'] || 'Change the rate users slow down (0.0 to 1.0).'}
                  step={0.01}
                  marks={[
                    { value: 0, label: '0.0' },
                    { value: 0.5, label: '0.5' },
                    { value: 1, label: '1.0' }
                  ]}
                  min={0}
                  max={1}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Max User Speed"
                  type="number"
                  value={currentProfile.settings.maxUserSpeed}
                  onChange={(value) => handleSettingsChange('maxUserSpeed', parseInt(value) || 500)}
                  tooltip={settingsDescriptions['max-user-speed'] || 'Maximum speed users can travel per second.'}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Time Settings Tab */}
          <TabPanel value={tabValue} index={4}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Control playback speed, time range, looping, and other time-related parameters.
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipSlider
                  label="Seconds Per Day"
                  value={currentProfile.settings.secondsPerDay}
                  onChange={(value) => handleSettingsChange('secondsPerDay', value)}
                  tooltip={settingsDescriptions.secondsPerDay || 'Simulation speed in seconds per day.'}
                  step={0.1}
                  marks={[
                    { value: 0.1, label: '0.1' },
                    { value: 1, label: '1' },
                    { value: 5, label: '5' },
                    { value: 10, label: '10' }
                  ]}
                  min={0.1}
                  max={10}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipSlider
                  label="Auto Skip Seconds"
                  value={currentProfile.settings.autoSkipSeconds}
                  onChange={(value) => handleSettingsChange('autoSkipSeconds', value)}
                  tooltip={settingsDescriptions.autoSkipSeconds || 'Auto skip to next entry if nothing happens for this many seconds.'}
                  step={0.05}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 0.5, label: '0.5' },
                    { value: 1, label: '1' }
                  ]}
                  min={0}
                  max={1}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipSlider
                  label="Time Scale"
                  value={currentProfile.settings.timeScale}
                  onChange={(value) => handleSettingsChange('timeScale', value)}
                  tooltip={settingsDescriptions.timeScale || 'Change simulation time scale (e.g., 0.5 for half speed, 2.0 for double).'}
                  step={0.1}
                  marks={[
                    { value: 0.5, label: '0.5x' },
                    { value: 1, label: '1x' },
                    { value: 2, label: '2x' }
                  ]}
                  min={0.5}
                  max={2}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Use Relative Start Date"
                  checked={currentProfile.settings.useRelativeStartDate || false}
                  onChange={(checked) => handleSettingsChange('useRelativeStartDate', checked)}
                  tooltip="Calculate Start Date relative to today instead of using a fixed date."
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Date Format"
                  value={currentProfile.settings.dateFormat}
                  onChange={(value) => handleSettingsChange('dateFormat', value)}
                  tooltip={settingsDescriptions.dateFormat || 'Specify display date string (strftime format).'}
                  placeholder="%Y-%m-%d %H:%M:%S"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Start Date (YYYY-MM-DD)"
                  value={currentProfile.settings.startDate}
                  onChange={(value) => handleSettingsChange('startDate', value)}
                  tooltip={settingsDescriptions.startDate || "Start visualization at a specific date and optional time (e.g., '2023-01-01 10:00:00')."}
                  placeholder="Leave empty for beginning"
                  disabled={currentProfile.settings.useRelativeStartDate || false}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Stop Date (YYYY-MM-DD)"
                  value={currentProfile.settings.stopDate}
                  onChange={(value) => handleSettingsChange('stopDate', value)}
                  tooltip={settingsDescriptions.stopDate || "Stop visualization at a specific date and optional time (e.g., '2024-01-01')."}
                  placeholder="Leave empty for end"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Start Position"
                  value={currentProfile.settings.startPosition}
                  onChange={(value) => handleSettingsChange('startPosition', value)}
                  tooltip={settingsDescriptions.startPosition || "Start at some position (0.0-1.0 or 'random')."}
                  placeholder="e.g., 0.0, 0.5, random"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Stop Position"
                  value={currentProfile.settings.stopPosition}
                  onChange={(value) => handleSettingsChange('stopPosition', value)}
                  tooltip={settingsDescriptions.stopPosition || 'Stop at some position (0.0-1.0).'}
                  placeholder="e.g., 0.8, 1.0"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Stop After Time (Seconds)"
                  type="number"
                  value={currentProfile.settings.stopAtTime}
                  onChange={(value) => handleSettingsChange('stopAtTime', parseInt(value) || 0)}
                  tooltip={settingsDescriptions.stopAtTime || 'Stop after a specified number of seconds of simulation time.'}
                  helperText="0 to disable"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Loop Visualization"
                  checked={currentProfile.settings.loop}
                  onChange={(checked) => handleSettingsChange('loop', checked)}
                  tooltip={settingsDescriptions.loop || 'Loop the visualization at the end of the log.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Loop Delay (Seconds)"
                  type="number"
                  value={currentProfile.settings.loopDelaySeconds}
                  onChange={(value) => handleSettingsChange('loopDelaySeconds', parseInt(value) || 3)}
                  tooltip={settingsDescriptions.loopDelaySeconds || 'Seconds to delay before looping (default: 3).'}
                  inputProps={{ min: 0 }}
                  disabled={!currentProfile.settings.loop}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Disable Auto Skip"
                  checked={currentProfile.settings.disableAutoSkip}
                  onChange={(checked) => handleSettingsChange('disableAutoSkip', checked)}
                  tooltip={settingsDescriptions.disableAutoSkip || 'Disable automatic skipping of inactive periods.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Stop at End of Log"
                  checked={currentProfile.settings.stopAtEnd}
                  onChange={(checked) => handleSettingsChange('stopAtEnd', checked)}
                  tooltip={settingsDescriptions.stopAtEnd || 'Stop the simulation precisely at the end of the log data.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Don't Stop at End (Keep Rotating)"
                  checked={currentProfile.settings.dontStop}
                  onChange={(checked) => handleSettingsChange('dontStop', checked)}
                  tooltip={settingsDescriptions.dontStop || 'Keep the visualization running (rotating) after the log ends.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Realtime Playback"
                  checked={currentProfile.settings.realtime}
                  onChange={(checked) => handleSettingsChange('realtime', checked)}
                  tooltip={settingsDescriptions.realtime || 'Attempt to play back the simulation at realtime speed.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="No Time Travel"
                  checked={currentProfile.settings.noTimeTravel}
                  onChange={(checked) => handleSettingsChange('noTimeTravel', checked)}
                  tooltip={settingsDescriptions.noTimeTravel || 'Use the time of the last commit if a commit time is in the past.'}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Filtering Tab */}
          <TabPanel value={tabValue} index={5}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Filter which users or files are displayed, and control highlighting and file display options.
            </Typography>
            <Typography variant="h6" gutterBottom>User Filtering</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Hide Users (Filter Regex)"
                  value={currentProfile.settings.hideUsers}
                  onChange={(value) => handleSettingsChange('hideUsers', value)}
                  tooltip={settingsDescriptions.hideUsers || 'Ignore usernames matching this regex (uses --user-filter).'}
                  placeholder="user1|user2|Specific.*User"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Show Only Users (Filter Regex)"
                  value={currentProfile.settings.userShowFilter}
                  onChange={(value) => handleSettingsChange('userShowFilter', value)}
                  tooltip={settingsDescriptions.userShowFilter || 'Show only usernames matching this regex.'}
                  placeholder="Leave empty to show all (except hidden)"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Highlight Specific User"
                  value={currentProfile.settings.highlightUser}
                  onChange={(value) => handleSettingsChange('highlightUser', value)}
                  tooltip={settingsDescriptions.highlightUser || 'Highlight the names of a particular user (enter exact username).'}
                  placeholder="Enter exact username"
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>File Filtering & Display</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Hide Files Regex"
                  value={currentProfile.settings.hideFilesRegex}
                  onChange={(value) => handleSettingsChange('hideFilesRegex', value)}
                  tooltip={settingsDescriptions.hideFilesRegex || 'Ignore file paths matching this regex (uses --file-filter).'}
                  placeholder="\\.(json|md)$"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Show Only Files (Filter Regex)"
                  value={currentProfile.settings.fileShowFilter}
                  onChange={(value) => handleSettingsChange('fileShowFilter', value)}
                  tooltip={settingsDescriptions.fileShowFilter || 'Show only file paths matching this regex.'}
                  placeholder="Leave empty to show all (except hidden)"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Max Files Displayed"
                  type="number"
                  value={currentProfile.settings.maxFiles}
                  onChange={(value) => handleSettingsChange('maxFiles', parseInt(value) || 0)}
                  tooltip={settingsDescriptions.maxFiles || 'Max number of files displayed (0 for unlimited).'}
                  helperText="0 for unlimited"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="File Idle Time (Seconds)"
                  type="number"
                  value={currentProfile.settings.fileIdleTime}
                  onChange={(value) => handleSettingsChange('fileIdleTime', parseFloat(value) || 0)}
                  tooltip={settingsDescriptions.fileIdleTime || 'Time files remain visible after their last activity (seconds).'}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="File Idle Time at End (Seconds)"
                  type="number"
                  value={currentProfile.settings.fileIdleTimeAtEnd}
                  onChange={(value) => handleSettingsChange('fileIdleTimeAtEnd', parseFloat(value) || 0)}
                  tooltip={settingsDescriptions.fileIdleTimeAtEnd || 'Time files remain visible at the very end of the simulation (seconds).'}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Show File Extensions Only"
                  checked={currentProfile.settings.fileExtensions}
                  onChange={(checked) => handleSettingsChange('fileExtensions', checked)}
                  tooltip={settingsDescriptions.fileExtensions || 'Display only the file extensions instead of full filenames.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Fallback to Filename if No Extension"
                  checked={currentProfile.settings.fileExtensionFallback}
                  onChange={(checked) => handleSettingsChange('fileExtensionFallback', checked)}
                  tooltip={settingsDescriptions.fileExtensionFallback || 'If showing extensions only, use the full filename if no extension exists.'}
                  disabled={!currentProfile.settings.fileExtensions}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Other Filtering</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Hide Root Directory"
                  checked={currentProfile.settings.hideRoot}
                  onChange={(checked) => handleSettingsChange('hideRoot', checked)}
                  tooltip={settingsDescriptions.hideRoot || " (Specifically hides the 'root' element)."}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Highlight Users"
                  checked={currentProfile.settings.highlightUsers}
                  onChange={(checked) => handleSettingsChange('highlightUsers', checked)}
                  tooltip={settingsDescriptions.highlightUsers || " (Highlights the names of all active users)."}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Captions Tab */}
          <TabPanel value={tabValue} index={6}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Display timed captions from a file during the visualization. Captions require a path to a caption file.
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TooltipField
                  label="Caption File Path"
                  value={currentProfile.settings.captionFile}
                  onChange={(value) => handleSettingsChange('captionFile', value)}
                  tooltip={settingsDescriptions.captionFile || 'Path to the caption file (.srt or .txt).'}
                  placeholder="e.g., ./data/captions.txt"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Caption Font Size"
                  type="number"
                  value={currentProfile.settings.captionSize}
                  onChange={(value) => handleSettingsChange('captionSize', parseInt(value) || 12)}
                  tooltip={settingsDescriptions.captionSize || 'Font size for captions.'}
                  inputProps={{ min: 6 }}
                  disabled={!currentProfile.settings.captionFile}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <ColorPickerField
                  label="Caption Color"
                  value={currentProfile.settings.captionColour}
                  onChange={(value) => handleSettingsChange('captionColour', value)}
                  tooltip={settingsDescriptions.captionColour || 'Caption colour in hex.'}
                  disabled={!currentProfile.settings.captionFile}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Caption Duration (Seconds)"
                  type="number"
                  value={currentProfile.settings.captionDuration}
                  onChange={(value) => handleSettingsChange('captionDuration', parseFloat(value) || 10.0)}
                  tooltip={settingsDescriptions.captionDuration || 'Default duration to display captions (seconds).'}
                  inputProps={{ min: 0.1, step: 0.1 }}
                  disabled={!currentProfile.settings.captionFile}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Caption Horizontal Offset"
                  type="number"
                  value={currentProfile.settings.captionOffset}
                  onChange={(value) => handleSettingsChange('captionOffset', parseInt(value) || 0)}
                  tooltip={settingsDescriptions.captionOffset || 'Horizontal offset for the caption text position.'}
                  disabled={!currentProfile.settings.captionFile}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Advanced Tab */}
          <TabPanel value={tabValue} index={7}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Less common settings, including input control, hashing, custom logging, and Git branch specification for log generation.
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipCheckbox
                  label="Disable Input (Keyboard/Mouse)"
                  checked={currentProfile.settings.disableInput}
                  onChange={(checked) => handleSettingsChange('disableInput', checked)}
                  tooltip={settingsDescriptions.disableInput || 'Disable keyboard and mouse input during visualization.'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Hash Seed"
                  value={currentProfile.settings.hashSeed}
                  onChange={(value) => handleSettingsChange('hashSeed', value)}
                  tooltip={settingsDescriptions.hashSeed || 'Change the seed of the hash function used for coloring.'}
                  placeholder="Leave empty for default"
                />
              </Grid>
              <Grid item xs={12}>
                <TooltipField
                  label="Extra Arguments"
                  value={currentProfile.settings.extraArgs}
                  onChange={(value) => handleSettingsChange('extraArgs', value)}
                  tooltip={'Specify any additional Gource command line arguments not covered by other fields.'}
                  multiline
                  rows={3}
                  placeholder="Additional Gource arguments"
                  helperText="Example: --transparent --bloom-intensity 0.5"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Output Custom Log Path"
                  value={currentProfile.settings.outputCustomLog}
                  onChange={(value) => handleSettingsChange('outputCustomLog', value)}
                  tooltip={settingsDescriptions.outputCustomLog || 'Output a custom format log file (useful for debugging).'}
                  placeholder="e.g., ./temp/gource_debug.log"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TooltipField
                  label="Git Branch (for Gource Log Gen)"
                  value={currentProfile.settings.gitBranch}
                  onChange={(value) => handleSettingsChange('gitBranch', value)}
                  tooltip={settingsDescriptions.gitBranch || 'Specify the Git branch to generate the log from (used during log generation, not Gource execution).'}
                  placeholder="e.g., main, develop"
                  helperText="Limited use when providing custom logs"
                />
              </Grid>
            </Grid>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProfileDialog} disabled={savingProfile}>Cancel</Button>
          <Button 
            onClick={handleSaveProfile} 
            variant="contained" 
            disabled={!currentProfile.name || savingProfile || (isEditing && currentProfile.isSystemProfile)}
            startIcon={savingProfile && <CircularProgress size={16} color="inherit" />}
          >
            {savingProfile ? 'Saving...' : (isEditing && currentProfile.isSystemProfile ? 'Cannot Save System Profile' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Config File Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Config File</DialogTitle>
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