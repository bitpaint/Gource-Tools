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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  HelpOutline
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { renderProfilesApi, dateUtils } from '../api/api';
import { defaultSettings, settingsDescriptions } from '../shared/defaultGourceConfig';
import { 
  convertToCamelCase, 
  convertToKebabCase,
  getCommonResolutions,
  getCameraModes
} from '../utils/gourceUtils';
import { validateGourceConfig, fixGourceConfig } from '../utils/configValidator';

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
      setCurrentProfile({
        id: profile.id,
        name: profile.name,
        description: profile.description || '',
        settings: convertToCamelCase({ ...defaultSettings, ...profile.settings })
      });
    } else {
      setIsEditing(false);
      setCurrentProfile({
        id: null,
        name: '',
        description: '',
        settings: convertToCamelCase({ ...defaultSettings })
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

    // Valider et corriger les paramètres
    const fixedSettings = fixGourceConfig(currentProfile.settings);
    const validation = validateGourceConfig(fixedSettings);
    
    if (!validation.isValid) {
      console.warn('Problèmes de configuration détectés, tentative de correction automatique:', validation.errors);
      // Nous continuons avec les paramètres corrigés, mais nous affichons un avertissement
      toast.warning('Certains paramètres ont été ajustés pour être compatibles avec Gource');
    }

    try {
      setSavingProfile(true);
      
      // Utiliser les paramètres corrigés
      const profileToSave = {
        ...currentProfile,
        settings: convertToKebabCase(fixedSettings)
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
    setCurrentProfile({
      ...currentProfile,
      settings: {
        ...currentProfile.settings,
        [key]: value
      }
    });
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return dateUtils.formatRelativeTime(dateString);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Fonction utilitaire pour afficher les propriétés du profil avec tirets
  const getProfileSetting = (profile, key) => {
    // Pour les propriétés avec tirets, utiliser la notation entre crochets
    if (key.includes('-')) {
      return profile.settings[key];
    }
    return profile.settings[key];
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Config Files
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Create and manage Gource configuration files
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenProfileDialog()}
        >
          Create Config File
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {profiles.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No config files found. Create one to get started.
              </Typography>
            </Paper>
          </Grid>
        ) : (
          profiles.map((profile) => (
            <Grid item xs={12} md={6} key={profile.id}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    {profile.name}
                    {profile.isDefault && (
                      <Chip 
                        label="Default" 
                        color="primary" 
                        size="small" 
                        sx={{ ml: 1, fontSize: '0.7rem' }} 
                      />
                    )}
                  </Typography>
                  
                  {profile.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {profile.description}
                    </Typography>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="profile-settings-content"
                      id="profile-settings-header"
                    >
                      <Typography>Config Settings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Resolution:</strong> {profile.settings.resolution}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Framerate:</strong> {profile.settings.framerate} fps
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Seconds per day:</strong> {getProfileSetting(profile, 'seconds-per-day')}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Camera mode:</strong> {getProfileSetting(profile, 'camera-mode')}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Background:</strong> {profile.settings.background}
                      </Typography>
                      {getProfileSetting(profile, 'title-text') && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Custom Title:</strong> {getProfileSetting(profile, 'title-text')}
                        </Typography>
                      )}
                      {profile.settings.elasticity !== undefined && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Elasticity:</strong> {profile.settings.elasticity}
                        </Typography>
                      )}
                      {getProfileSetting(profile, 'extra-args') && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Extra args:</strong> {getProfileSetting(profile, 'extra-args')}
                        </Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Last modified: {' '}
                    <Tooltip title={dateUtils.formatLocaleDate(profile.lastModified)}>
                      <span>{formatDate(profile.lastModified)}</span>
                    </Tooltip>
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenProfileDialog(profile)}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    startIcon={<DeleteIcon />}
                    onClick={() => handleOpenDeleteDialog(profile)}
                    disabled={profile.isDefault}
                    title={profile.isDefault ? "Default config file cannot be deleted" : "Delete config file"}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

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
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="config settings tabs">
              <Tab label="Video" />
              <Tab label="Visualization" />
              <Tab label="Appearance" />
              <Tab label="Time" />
              <Tab label="Filtering" />
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
            </Grid>
          </TabPanel>
          
          {/* Time Settings Tab */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TooltipSlider
                  label="Seconds Per Day"
                  value={currentProfile.settings.secondsPerDay}
                  onChange={(value) => handleSettingsChange('secondsPerDay', value)}
                  tooltip={descriptionsInCamelCase.secondsPerDay}
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
                  tooltip={descriptionsInCamelCase.autoSkipSeconds}
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
                  tooltip={descriptionsInCamelCase.timeScale}
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
                  tooltip={descriptionsInCamelCase.dateFormat}
                  placeholder="%Y-%m-%d %H:%M:%S"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Start Date (YYYY-MM-DD)"
                  value={currentProfile.settings.startDate}
                  onChange={(value) => handleSettingsChange('startDate', value)}
                  tooltip={descriptionsInCamelCase.startDate}
                  placeholder="Leave empty to start from beginning"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Stop Date (YYYY-MM-DD)"
                  value={currentProfile.settings.stopDate}
                  onChange={(value) => handleSettingsChange('stopDate', value)}
                  tooltip={descriptionsInCamelCase.stopDate}
                  placeholder="Leave empty to go until end"
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Filtering Tab */}
          <TabPanel value={tabValue} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TooltipField
                  label="Hide Users (comma separated)"
                  value={currentProfile.settings.hideUsers}
                  onChange={(value) => handleSettingsChange('hideUsers', value)}
                  tooltip={descriptionsInCamelCase.hideUsers}
                  placeholder="user1,user2,user3"
                />
              </Grid>
              <Grid item xs={12}>
                <TooltipField
                  label="Hide Files Regex"
                  value={currentProfile.settings.hideFilesRegex}
                  onChange={(value) => handleSettingsChange('hideFilesRegex', value)}
                  tooltip={descriptionsInCamelCase.hideFilesRegex}
                  placeholder="\\.(json|md)$"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipField
                  label="Max User Count"
                  type="number"
                  value={currentProfile.settings.maxUserCount}
                  onChange={(value) => handleSettingsChange('maxUserCount', parseInt(value) || 0)}
                  tooltip={descriptionsInCamelCase.maxUserCount}
                  helperText="0 for unlimited"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Hide Root Directory"
                  checked={currentProfile.settings.hideRoot}
                  onChange={(checked) => handleSettingsChange('hideRoot', checked)}
                  tooltip={descriptionsInCamelCase.hideRoot}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TooltipCheckbox
                  label="Highlight Users"
                  checked={currentProfile.settings.highlightUsers}
                  onChange={(checked) => handleSettingsChange('highlightUsers', checked)}
                  tooltip={descriptionsInCamelCase.highlightUsers}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Advanced Tab */}
          <TabPanel value={tabValue} index={5}>
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