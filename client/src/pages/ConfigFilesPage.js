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
  Search as SearchIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { renderProfilesApi, dateUtils } from '../api/api';
import { defaultSettings, settingsDescriptions } from '../shared/defaultGourceConfig';
import { 
  convertToCamelCase,
  getCommonResolutions,
  getCameraModes,
  convertFormToApiParams,
  convertApiToFormParams
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

// Convertir les descriptions des paramètres en camelCase
const descriptionsInCamelCase = convertToCamelCase(settingsDescriptions);

const ConfigFilesPage = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Profile dialog state
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProfile, setCurrentProfile] = useState({
    id: null,
    name: '',
    description: '',
    settings: convertToCamelCase({ ...defaultSettings })
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Delete dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [deletingProfile, setDeletingProfile] = useState(false);

  // Load profiles on component mount
  useEffect(() => {
    fetchProfiles();
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
        settings: convertApiToFormParams({ ...defaultSettings })
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
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No config files found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>{profile.name}</TableCell>
                    <TableCell>{profile.description || 'No description'}</TableCell>
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
                    <TableCell>{getProfileSetting(profile, 'seconds-per-day') || '1'}</TableCell>
                    <TableCell>{formatDate(profile.updatedAt)}</TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => handleOpenProfileDialog(profile)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleOpenDeleteDialog(profile)}>
                        <DeleteIcon />
                      </IconButton>
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{isEditing ? 'Edit Config File' : 'Create Config File'}</DialogTitle>
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
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
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
                        <Tooltip title={descriptionsInCamelCase.resolution}>
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
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Framerate"
                  type="number"
                  value={currentProfile.settings.framerate}
                  onChange={(value) => handleSettingsChange('framerate', parseInt(value) || 30)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">fps</InputAdornment>,
                  }}
                  inputProps={{ min: 24, max: 120 }}
                  tooltip={descriptionsInCamelCase.framerate}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Show Title"
                  checked={currentProfile.settings.title}
                  onChange={(checked) => handleSettingsChange('title', checked)}
                  tooltip={descriptionsInCamelCase.title}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Show Key"
                  checked={currentProfile.settings.key}
                  onChange={(checked) => handleSettingsChange('key', checked)}
                  tooltip={descriptionsInCamelCase.key}
                />
              </Grid>
              <Grid item xs={12}>
                <TooltipField
                  label="Custom Title Text"
                  value={currentProfile.settings.titleText}
                  onChange={(value) => handleSettingsChange('titleText', value)}
                  tooltip={descriptionsInCamelCase.titleText}
                  placeholder="Leave empty to use project name"
                />
              </Grid>
              <Grid item xs={12}>
                <ColorPickerField
                  label="Background Color"
                  value={currentProfile.settings.background}
                  onChange={(value) => handleSettingsChange('background', value)}
                  tooltip={descriptionsInCamelCase.background}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Fullscreen"
                  checked={currentProfile.settings.fullscreen}
                  onChange={(checked) => handleSettingsChange('fullscreen', checked)}
                  tooltip={settingsDescriptions.fullscreen}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Screen Number (for Fullscreen)"
                  type="number"
                  value={currentProfile.settings.screenNum}
                  onChange={(value) => handleSettingsChange('screenNum', parseInt(value) || 0)}
                  tooltip={settingsDescriptions.screenNum}
                  inputProps={{ min: 0 }}
                  disabled={!currentProfile.settings.fullscreen}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Disable VSync"
                  checked={currentProfile.settings.noVsync}
                  onChange={(checked) => handleSettingsChange('noVsync', checked)}
                  tooltip={settingsDescriptions.noVsync}
                />
              </Grid>
               <Grid item xs={12} md={6}>
                <TooltipField
                  label="Window Position (XxY)"
                  value={currentProfile.settings.windowPosition}
                  onChange={(value) => handleSettingsChange('windowPosition', value)}
                  tooltip={settingsDescriptions.windowPosition}
                  placeholder="e.g., 100x50"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Frameless Window"
                  checked={currentProfile.settings.frameless}
                  onChange={(checked) => handleSettingsChange('frameless', checked)}
                  tooltip={settingsDescriptions.frameless}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Multi-Sampling (Anti-Aliasing)"
                  checked={currentProfile.settings.multiSampling}
                  onChange={(checked) => handleSettingsChange('multiSampling', checked)}
                  tooltip={settingsDescriptions.multiSampling}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Visualization Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
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
                        <Tooltip title={descriptionsInCamelCase.cameraMode}>
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
              <Grid item xs={12} md={6}>
                <TooltipSlider
                  label="Elasticity"
                  value={currentProfile.settings.elasticity}
                  onChange={(value) => handleSettingsChange('elasticity', value)}
                  tooltip={descriptionsInCamelCase.elasticity}
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
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Show Lines"
                  checked={currentProfile.settings.showLines}
                  onChange={(checked) => handleSettingsChange('showLines', checked)}
                  tooltip={descriptionsInCamelCase.showLines}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Disable Auto Rotate"
                  checked={currentProfile.settings.disableAutoRotate}
                  onChange={(checked) => handleSettingsChange('disableAutoRotate', checked)}
                  tooltip={descriptionsInCamelCase.disableAutoRotate}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Swap Title and Date"
                  checked={currentProfile.settings.swapTitleDate}
                  onChange={(checked) => handleSettingsChange('swapTitleDate', checked)}
                  tooltip={descriptionsInCamelCase.swapTitleDate}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Show User Images"
                  checked={currentProfile.settings.userImageDir}
                  onChange={(checked) => handleSettingsChange('userImageDir', checked)}
                  tooltip={descriptionsInCamelCase.userImageDir}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="crop-axis-label">Crop Axis</InputLabel>
                  <Select
                    labelId="crop-axis-label"
                    value={currentProfile.settings.cropAxis}
                    onChange={(e) => handleSettingsChange('cropAxis', e.target.value)}
                    label="Crop Axis"
                    endAdornment={
                      <InputAdornment position="end">
                        <Tooltip title={settingsDescriptions.cropAxis}>
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
              <Grid item xs={12} md={6}>
                <TooltipSlider
                  label="Camera Padding"
                  value={currentProfile.settings.padding}
                  onChange={(value) => handleSettingsChange('padding', value)}
                  tooltip={settingsDescriptions.padding}
                  step={0.1}
                  marks={[{ value: 1, label: '1.0' }, { value: 1.5, label: '1.5' }, { value: 2, label: '2.0' }]}
                  min={1.0}
                  max={2.0}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Highlight Directories"
                  checked={currentProfile.settings.highlightDirs}
                  onChange={(checked) => handleSettingsChange('highlightDirs', checked)}
                  tooltip={settingsDescriptions.highlightDirs}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Appearance Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>Scaling</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TooltipSlider
                  label="Font Scale"
                  value={currentProfile.settings.fontScale}
                  onChange={(value) => handleSettingsChange('fontScale', value)}
                  tooltip={descriptionsInCamelCase.fontScale}
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
              <Grid item xs={12} md={6}>
                <TooltipSlider
                  label="User Scale"
                  value={currentProfile.settings.userScale}
                  onChange={(value) => handleSettingsChange('userScale', value)}
                  tooltip={descriptionsInCamelCase.userScale}
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
              <Grid item xs={12} md={6}>
                <TooltipSlider
                  label="File Scale"
                  value={currentProfile.settings.fileScale}
                  onChange={(value) => handleSettingsChange('fileScale', value)}
                  tooltip={descriptionsInCamelCase.fileScale}
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
              <Grid item xs={12} md={6}>
                <TooltipSlider
                  label="Directory Size"
                  value={currentProfile.settings.dirSize}
                  onChange={(value) => handleSettingsChange('dirSize', value)}
                  tooltip={descriptionsInCamelCase.dirSize}
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
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Default Font Size"
                  type="number"
                  value={currentProfile.settings.fontSize}
                  onChange={(value) => handleSettingsChange('fontSize', parseInt(value) || 16)}
                  tooltip={descriptionsInCamelCase.fontSize}
                  inputProps={{ min: 8, max: 32 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Filename Font Size"
                  type="number"
                  value={currentProfile.settings.filenameFontSize}
                  onChange={(value) => handleSettingsChange('filenameFontSize', parseInt(value) || 14)}
                  tooltip={descriptionsInCamelCase.filenameFontSize}
                  inputProps={{ min: 8, max: 32 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Directory Name Font Size"
                  type="number"
                  value={currentProfile.settings.dirnameFontSize}
                  onChange={(value) => handleSettingsChange('dirnameFontSize', parseInt(value) || 14)}
                  tooltip={descriptionsInCamelCase.dirnameFontSize}
                  inputProps={{ min: 8, max: 32 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="User Font Size"
                  type="number"
                  value={currentProfile.settings.userFontSize}
                  onChange={(value) => handleSettingsChange('userFontSize', parseInt(value) || 14)}
                  tooltip={descriptionsInCamelCase.userFontSize}
                  inputProps={{ min: 8, max: 32 }}
                />
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Colors</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <ColorPickerField
                  label="Font Color"
                  value={currentProfile.settings.fontColor}
                  onChange={(value) => handleSettingsChange('fontColor', value)}
                  tooltip={descriptionsInCamelCase.fontColor}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ColorPickerField
                  label="Title Color"
                  value={currentProfile.settings.titleColor}
                  onChange={(value) => handleSettingsChange('titleColor', value)}
                  tooltip={descriptionsInCamelCase.titleColor}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ColorPickerField
                  label="Directory Color"
                  value={currentProfile.settings.dirColor}
                  onChange={(value) => handleSettingsChange('dirColor', value)}
                  tooltip={descriptionsInCamelCase.dirColor}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ColorPickerField
                  label="Highlight Color"
                  value={currentProfile.settings.highlightColor}
                  onChange={(value) => handleSettingsChange('highlightColor', value)}
                  tooltip={descriptionsInCamelCase.highlightColor}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ColorPickerField
                  label="Selection Color"
                  value={currentProfile.settings.selectionColor}
                  onChange={(value) => handleSettingsChange('selectionColor', value)}
                  tooltip={descriptionsInCamelCase.selectionColor}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ColorPickerField
                  label="Filename Color"
                  value={currentProfile.settings.filenameColor}
                  onChange={(value) => handleSettingsChange('filenameColor', value)}
                  tooltip={settingsDescriptions.filenameColor}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Other Appearance</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Transparent Background"
                  checked={currentProfile.settings.transparent}
                  onChange={(checked) => handleSettingsChange('transparent', checked)}
                  tooltip={settingsDescriptions.transparent}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Directory Name Depth"
                  type="number"
                  value={currentProfile.settings.dirNameDepth}
                  onChange={(value) => handleSettingsChange('dirNameDepth', parseInt(value) || 0)}
                  tooltip={settingsDescriptions.dirNameDepth}
                  helperText="0 for default behavior"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                 <TooltipSlider
                  label="Directory Name Position"
                  value={currentProfile.settings.dirNamePosition}
                  onChange={(value) => handleSettingsChange('dirNamePosition', value)}
                  tooltip={settingsDescriptions.dirNamePosition}
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
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Filename Time (Seconds)"
                  type="number"
                  value={currentProfile.settings.filenameTime}
                  onChange={(value) => handleSettingsChange('filenameTime', parseFloat(value) || 4.0)}
                  tooltip={settingsDescriptions.filenameTime}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
            </Grid>

            {/* Background Image & Logo Section */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Background & Logo</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Background Image Path"
                  value={currentProfile.settings.backgroundImage}
                  onChange={(value) => handleSettingsChange('backgroundImage', value)}
                  tooltip={settingsDescriptions.backgroundImage}
                  placeholder="e.g., ./images/background.png"
                />
              </Grid>
               <Grid item xs={12} md={6}>
                <TooltipField
                  label="Logo Image Path"
                  value={currentProfile.settings.logo}
                  onChange={(value) => handleSettingsChange('logo', value)}
                  tooltip={settingsDescriptions.logo}
                  placeholder="e.g., ./images/logo.png"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Logo Offset (XxY)"
                  value={currentProfile.settings.logoOffset}
                  onChange={(value) => handleSettingsChange('logoOffset', value)}
                  tooltip={settingsDescriptions.logoOffset}
                  placeholder="e.g., 10x10, -20x50"
                  disabled={!currentProfile.settings.logo} // Disable if no logo
                />
              </Grid>
            </Grid>

            {/* Font Sizes Section */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Fonts</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Font File Path"
                  value={currentProfile.settings.fontFile}
                  onChange={(value) => handleSettingsChange('fontFile', value)}
                  tooltip={settingsDescriptions.fontFile}
                  placeholder="e.g., C:/Windows/Fonts/arial.ttf"
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Users & Avatars Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>Camera & Behavior</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Use User Avatars (from ./avatars)"
                  checked={currentProfile.settings.useUserImageDir}
                  onChange={(checked) => handleSettingsChange('useUserImageDir', checked)}
                  tooltip={settingsDescriptions.useUserImageDir + ". Ensure avatars (e.g., username.png) exist in the /avatars folder."}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Default User Image Path"
                  value={currentProfile.settings.defaultUserImage}
                  onChange={(value) => handleSettingsChange('defaultUserImage', value)}
                  tooltip={settingsDescriptions.defaultUserImage}
                  placeholder="e.g., ./images/default_avatar.png"
                  disabled={!currentProfile.settings.useUserImageDir} // Disable if not using avatars
                />
              </Grid>
               <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Fixed User Avatar Size"
                  checked={currentProfile.settings.fixedUserSize}
                  onChange={(checked) => handleSettingsChange('fixedUserSize', checked)}
                  tooltip={settingsDescriptions.fixedUserSize}
                  disabled={!currentProfile.settings.useUserImageDir}
                />
              </Grid>
               <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Colour User Avatars"
                  checked={currentProfile.settings.colourImages}
                  onChange={(checked) => handleSettingsChange('colourImages', checked)}
                  tooltip={settingsDescriptions.colourImages}
                  disabled={!currentProfile.settings.useUserImageDir}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Follow Specific User"
                  value={currentProfile.settings.followUser}
                  onChange={(value) => handleSettingsChange('followUser', value)}
                  tooltip={settingsDescriptions.followUser}
                  placeholder="Enter exact username"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipSlider
                  label="User Friction"
                  value={currentProfile.settings.userFriction}
                  onChange={(value) => handleSettingsChange('userFriction', value)}
                  tooltip={settingsDescriptions.userFriction}
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
                 <Grid item xs={12} md={6}>
                  <TooltipField
                    label="Max User Speed"
                    type="number"
                    value={currentProfile.settings.maxUserSpeed}
                    onChange={(value) => handleSettingsChange('maxUserSpeed', parseInt(value) || 500)}
                    tooltip={settingsDescriptions.maxUserSpeed}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
            </Grid>
          </TabPanel>
          
          {/* Time Settings Tab */}
          <TabPanel value={tabValue} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TooltipSlider
                  label="Seconds Per Day"
                  value={currentProfile.settings.secondsPerDay}
                  onChange={(value) => handleSettingsChange('secondsPerDay', value)}
                  tooltip={settingsDescriptions.secondsPerDay}
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
              <Grid item xs={12} md={6}>
                <TooltipSlider
                  label="Auto Skip Seconds"
                  value={currentProfile.settings.autoSkipSeconds}
                  onChange={(value) => handleSettingsChange('autoSkipSeconds', value)}
                  tooltip={settingsDescriptions.autoSkipSeconds}
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
              <Grid item xs={12} md={6}>
                <TooltipSlider
                  label="Time Scale"
                  value={currentProfile.settings.timeScale}
                  onChange={(value) => handleSettingsChange('timeScale', value)}
                  tooltip={settingsDescriptions.timeScale}
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
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Date Format"
                  value={currentProfile.settings.dateFormat}
                  onChange={(value) => handleSettingsChange('dateFormat', value)}
                  tooltip={settingsDescriptions.dateFormat}
                  placeholder="%Y-%m-%d %H:%M:%S"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Start Date (YYYY-MM-DD)"
                  value={currentProfile.settings.startDate}
                  onChange={(value) => handleSettingsChange('startDate', value)}
                  tooltip={settingsDescriptions.startDate}
                  placeholder="Leave empty for beginning"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Stop Date (YYYY-MM-DD)"
                  value={currentProfile.settings.stopDate}
                  onChange={(value) => handleSettingsChange('stopDate', value)}
                  tooltip={settingsDescriptions.stopDate}
                  placeholder="Leave empty for end"
                />
              </Grid>
              {/* New Time/Position Fields */}
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Start Position"
                  value={currentProfile.settings.startPosition}
                  onChange={(value) => handleSettingsChange('startPosition', value)}
                  tooltip={settingsDescriptions.startPosition}
                  placeholder="e.g., 0.0, 0.5, random"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Stop Position"
                  value={currentProfile.settings.stopPosition}
                  onChange={(value) => handleSettingsChange('stopPosition', value)}
                  tooltip={settingsDescriptions.stopPosition}
                  placeholder="e.g., 0.8, 1.0"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Stop After Time (Seconds)"
                  type="number"
                  value={currentProfile.settings.stopAtTime}
                  onChange={(value) => handleSettingsChange('stopAtTime', parseInt(value) || 0)}
                  tooltip={settingsDescriptions.stopAtTime}
                  helperText="0 to disable"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                 <TooltipCheckbox
                  label="Loop Visualization"
                  checked={currentProfile.settings.loop}
                  onChange={(checked) => handleSettingsChange('loop', checked)}
                  tooltip={settingsDescriptions.loop}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Loop Delay (Seconds)"
                  type="number"
                  value={currentProfile.settings.loopDelaySeconds}
                  onChange={(value) => handleSettingsChange('loopDelaySeconds', parseInt(value) || 3)}
                  inputProps={{ min: 0 }}
                  disabled={!currentProfile.settings.loop} // Disable if loop is off
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Disable Auto Skip"
                  checked={currentProfile.settings.disableAutoSkip}
                  onChange={(checked) => handleSettingsChange('disableAutoSkip', checked)}
                  tooltip={settingsDescriptions.disableAutoSkip}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Stop at End of Log"
                  checked={currentProfile.settings.stopAtEnd}
                  onChange={(checked) => handleSettingsChange('stopAtEnd', checked)}
                  tooltip={settingsDescriptions.stopAtEnd}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                 <TooltipCheckbox
                  label="Don't Stop at End (Keep Rotating)"
                  checked={currentProfile.settings.dontStop}
                  onChange={(checked) => handleSettingsChange('dontStop', checked)}
                  tooltip={settingsDescriptions.dontStop}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                 <TooltipCheckbox
                  label="Realtime Playback"
                  checked={currentProfile.settings.realtime}
                  onChange={(checked) => handleSettingsChange('realtime', checked)}
                  tooltip={settingsDescriptions.realtime}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                 <TooltipCheckbox
                  label="No Time Travel"
                  checked={currentProfile.settings.noTimeTravel}
                  onChange={(checked) => handleSettingsChange('noTimeTravel', checked)}
                  tooltip={settingsDescriptions.noTimeTravel}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Filtering Tab */}
          <TabPanel value={tabValue} index={5}>
            <Typography variant="h6" gutterBottom>User Filtering</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Hide Users (Filter Regex)"
                  value={currentProfile.settings.hideUsers}
                  onChange={(value) => handleSettingsChange('hideUsers', value)}
                  tooltip={settingsDescriptions.hideUsers + " (Uses --user-filter)"}
                  placeholder="user1|user2|Specific.*User"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Show Only Users (Filter Regex)"
                  value={currentProfile.settings.userShowFilter}
                  onChange={(value) => handleSettingsChange('userShowFilter', value)}
                  tooltip={settingsDescriptions.userShowFilter}
                  placeholder="Leave empty to show all (except hidden)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Highlight Specific User"
                  value={currentProfile.settings.highlightUser}
                  onChange={(value) => handleSettingsChange('highlightUser', value)}
                  tooltip={settingsDescriptions.highlightUser}
                  placeholder="Enter exact username"
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>File Filtering & Display</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Hide Files Regex"
                  value={currentProfile.settings.hideFilesRegex}
                  onChange={(value) => handleSettingsChange('hideFilesRegex', value)}
                  tooltip={settingsDescriptions.hideFilesRegex + " (Uses --file-filter)"}
                  placeholder="\\.(json|md)$"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Show Only Files (Filter Regex)"
                  value={currentProfile.settings.fileShowFilter}
                  onChange={(value) => handleSettingsChange('fileShowFilter', value)}
                  tooltip={settingsDescriptions.fileShowFilter}
                  placeholder="Leave empty to show all (except hidden)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Max Files Displayed"
                  type="number"
                  value={currentProfile.settings.maxFiles}
                  onChange={(value) => handleSettingsChange('maxFiles', parseInt(value) || 0)}
                  tooltip={settingsDescriptions.maxFiles}
                  helperText="0 for unlimited"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="File Idle Time (Seconds)"
                  type="number"
                  value={currentProfile.settings.fileIdleTime}
                  onChange={(value) => handleSettingsChange('fileIdleTime', parseFloat(value) || 0)}
                  tooltip={settingsDescriptions.fileIdleTime}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="File Idle Time at End (Seconds)"
                  type="number"
                  value={currentProfile.settings.fileIdleTimeAtEnd}
                  onChange={(value) => handleSettingsChange('fileIdleTimeAtEnd', parseFloat(value) || 0)}
                  tooltip={settingsDescriptions.fileIdleTimeAtEnd}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Show File Extensions Only"
                  checked={currentProfile.settings.fileExtensions}
                  onChange={(checked) => handleSettingsChange('fileExtensions', checked)}
                  tooltip={settingsDescriptions.fileExtensions}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                 <TooltipCheckbox
                  label="Fallback to Filename if No Extension"
                  checked={currentProfile.settings.fileExtensionFallback}
                  onChange={(checked) => handleSettingsChange('fileExtensionFallback', checked)}
                  tooltip={settingsDescriptions.fileExtensionFallback}
                  disabled={!currentProfile.settings.fileExtensions} // Disable if fileExtensions is off
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Other Filtering</Typography>
             <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Hide Root Directory"
                  checked={currentProfile.settings.hideRoot}
                  onChange={(checked) => handleSettingsChange('hideRoot', checked)}
                  tooltip={settingsDescriptions.hideRoot + " (Uses --hide root)"}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Highlight Users"
                  checked={currentProfile.settings.highlightUsers}
                  onChange={(checked) => handleSettingsChange('highlightUsers', checked)}
                  tooltip={settingsDescriptions.highlightUsers + " (Uses --highlight-users flag)"}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Captions Tab */}
          <TabPanel value={tabValue} index={6}>
            <Typography variant="body2" color="text.secondary" paragraph>
                Display timed captions from a file during the visualization.
            </Typography>
             <Grid container spacing={3}>
                <Grid item xs={12}>
                    <TooltipField
                        label="Caption File Path"
                        value={currentProfile.settings.captionFile}
                        onChange={(value) => handleSettingsChange('captionFile', value)}
                        tooltip={settingsDescriptions.captionFile}
                        placeholder="e.g., ./data/captions.txt"
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TooltipField
                        label="Caption Font Size"
                        type="number"
                        value={currentProfile.settings.captionSize}
                        onChange={(value) => handleSettingsChange('captionSize', parseInt(value) || 12)}
                        tooltip={settingsDescriptions.captionSize}
                        inputProps={{ min: 6 }}
                         disabled={!currentProfile.settings.captionFile}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                     <ColorPickerField
                        label="Caption Color"
                        value={currentProfile.settings.captionColour}
                        onChange={(value) => handleSettingsChange('captionColour', value)}
                        tooltip={settingsDescriptions.captionColour}
                        disabled={!currentProfile.settings.captionFile}
                    />
                </Grid>
                 <Grid item xs={12} md={6}>
                    <TooltipField
                        label="Caption Duration (Seconds)"
                        type="number"
                        value={currentProfile.settings.captionDuration}
                        onChange={(value) => handleSettingsChange('captionDuration', parseFloat(value) || 10.0)}
                        tooltip={settingsDescriptions.captionDuration}
                        inputProps={{ min: 0.1, step: 0.1 }}
                         disabled={!currentProfile.settings.captionFile}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TooltipField
                        label="Caption Horizontal Offset"
                        type="number"
                        value={currentProfile.settings.captionOffset}
                        onChange={(value) => handleSettingsChange('captionOffset', parseInt(value) || 0)}
                        tooltip={settingsDescriptions.captionOffset}
                        disabled={!currentProfile.settings.captionFile}
                    />
                </Grid>
             </Grid>
          </TabPanel>
          
          {/* Advanced Tab */}
          <TabPanel value={tabValue} index={7}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Disable Input (Keyboard/Mouse)"
                  checked={currentProfile.settings.disableInput}
                  onChange={(checked) => handleSettingsChange('disableInput', checked)}
                  tooltip={settingsDescriptions.disableInput}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Hash Seed"
                  value={currentProfile.settings.hashSeed}
                  onChange={(value) => handleSettingsChange('hashSeed', value)}
                  tooltip={settingsDescriptions.hashSeed}
                  placeholder="Leave empty for default"
                />
              </Grid>
              <Grid item xs={12}>
                <TooltipField
                  label="Extra Arguments"
                  value={currentProfile.settings.extraArgs}
                  onChange={(value) => handleSettingsChange('extraArgs', value)}
                  tooltip={descriptionsInCamelCase.extraArgs}
                  multiline
                  rows={3}
                  placeholder="Additional Gource arguments"
                  helperText="Example: --transparent --bloom-intensity 0.5"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Output Custom Log Path"
                  value={currentProfile.settings.outputCustomLog}
                  onChange={(value) => handleSettingsChange('outputCustomLog', value)}
                  tooltip={settingsDescriptions.outputCustomLog}
                  placeholder="e.g., ./temp/gource_debug.log"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Git Branch (for Gource Log Gen)"
                  value={currentProfile.settings.gitBranch}
                  onChange={(value) => handleSettingsChange('gitBranch', value)}
                  tooltip={settingsDescriptions.gitBranch}
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
            disabled={!currentProfile.name || savingProfile}
            startIcon={savingProfile && <CircularProgress size={16} color="inherit" />}
          >
            {savingProfile ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Config File Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Config File</DialogTitle>
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
            disabled={deletingProfile}
            startIcon={deletingProfile && <CircularProgress size={16} color="inherit" />}
          >
            {deletingProfile ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ConfigFilesPage; 