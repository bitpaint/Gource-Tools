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
  FormControlLabel,
  Checkbox,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Slider,
  Tabs,
  Tab,
  Chip,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { renderProfilesApi, dateUtils } from '../api/api';

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

const defaultSettings = {
  resolution: '1920x1080',
  framerate: 60,
  secondsPerDay: 1,
  autoSkipSeconds: 0.1,
  elasticity: 0.5,
  title: true,
  key: true,
  background: '#000000',
  fontScale: 1.0,
  cameraMode: 'overview',
  userScale: 1.0,
  timeScale: 1.0,
  highlightUsers: false,
  hideUsers: '',
  hideFilesRegex: '',
  hideRoot: false,
  maxUserCount: 0,
  extraArgs: ''
};

const cameraModes = [
  { value: 'overview', label: 'Overview' },
  { value: 'track', label: 'Track' },
  { value: 'follow', label: 'Follow' }
];

const commonResolutions = [
  '1280x720', 
  '1920x1080', 
  '2560x1440', 
  '3840x2160'
];

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
    settings: { ...defaultSettings }
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
        settings: { ...defaultSettings, ...profile.settings }
      });
    } else {
      setIsEditing(false);
      setCurrentProfile({
        id: null,
        name: '',
        description: '',
        settings: { ...defaultSettings }
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
      
      if (isEditing) {
        // Update existing profile
        const response = await renderProfilesApi.update(currentProfile.id, currentProfile);
        
        // Update profiles array
        const updatedProfiles = profiles.map(profile => 
          profile.id === currentProfile.id ? response.data : profile
        );
        setProfiles(updatedProfiles);
        
        toast.success('Config file updated successfully');
      } else {
        // Create new profile
        const response = await renderProfilesApi.create(currentProfile);
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
                        <strong>Seconds per day:</strong> {profile.settings.secondsPerDay}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Camera mode:</strong> {profile.settings.cameraMode}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Background:</strong> {profile.settings.background}
                      </Typography>
                      {profile.settings.extraArgs && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Extra args:</strong> {profile.settings.extraArgs}
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
                  >
                    {commonResolutions.map((res) => (
                      <MenuItem key={res} value={res}>{res}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Framerate"
                  type="number"
                  value={currentProfile.settings.framerate}
                  onChange={(e) => handleSettingsChange('framerate', parseInt(e.target.value) || 30)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">fps</InputAdornment>,
                  }}
                  inputProps={{ min: 24, max: 120 }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Seconds Per Day</Typography>
                <Slider
                  value={currentProfile.settings.secondsPerDay}
                  onChange={(e, value) => handleSettingsChange('secondsPerDay', value)}
                  valueLabelDisplay="auto"
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
                <Typography gutterBottom>Auto Skip Seconds</Typography>
                <Slider
                  value={currentProfile.settings.autoSkipSeconds}
                  onChange={(e, value) => handleSettingsChange('autoSkipSeconds', value)}
                  valueLabelDisplay="auto"
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
                  >
                    {cameraModes.map((mode) => (
                      <MenuItem key={mode.value} value={mode.value}>{mode.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Background Color"
                  type="text"
                  value={currentProfile.settings.background}
                  onChange={(e) => handleSettingsChange('background', e.target.value)}
                  fullWidth
                  placeholder="#000000"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Font Scale</Typography>
                <Slider
                  value={currentProfile.settings.fontScale}
                  onChange={(e, value) => handleSettingsChange('fontScale', value)}
                  valueLabelDisplay="auto"
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
                <Typography gutterBottom>User Scale</Typography>
                <Slider
                  value={currentProfile.settings.userScale}
                  onChange={(e, value) => handleSettingsChange('userScale', value)}
                  valueLabelDisplay="auto"
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
                <Typography gutterBottom>Time Scale</Typography>
                <Slider
                  value={currentProfile.settings.timeScale}
                  onChange={(e, value) => handleSettingsChange('timeScale', value)}
                  valueLabelDisplay="auto"
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
                <Typography gutterBottom>Elasticity</Typography>
                <Slider
                  value={currentProfile.settings.elasticity}
                  onChange={(e, value) => handleSettingsChange('elasticity', value)}
                  valueLabelDisplay="auto"
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
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={currentProfile.settings.title}
                      onChange={(e) => handleSettingsChange('title', e.target.checked)}
                    />
                  }
                  label="Show Title"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={currentProfile.settings.key}
                      onChange={(e) => handleSettingsChange('key', e.target.checked)}
                    />
                  }
                  label="Show Key"
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Filtering Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Hide Users (comma separated)"
                  type="text"
                  value={currentProfile.settings.hideUsers}
                  onChange={(e) => handleSettingsChange('hideUsers', e.target.value)}
                  fullWidth
                  placeholder="user1,user2,user3"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Hide Files Regex"
                  type="text"
                  value={currentProfile.settings.hideFilesRegex}
                  onChange={(e) => handleSettingsChange('hideFilesRegex', e.target.value)}
                  fullWidth
                  placeholder="\\.(json|md)$"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Max User Count"
                  type="number"
                  value={currentProfile.settings.maxUserCount}
                  onChange={(e) => handleSettingsChange('maxUserCount', parseInt(e.target.value) || 0)}
                  fullWidth
                  helperText="0 for unlimited"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={currentProfile.settings.hideRoot}
                      onChange={(e) => handleSettingsChange('hideRoot', e.target.checked)}
                    />
                  }
                  label="Hide Root Directory"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={currentProfile.settings.highlightUsers}
                      onChange={(e) => handleSettingsChange('highlightUsers', e.target.checked)}
                    />
                  }
                  label="Highlight Users"
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Advanced Tab */}
          <TabPanel value={tabValue} index={3}>
            <TextField
              label="Extra Arguments"
              type="text"
              value={currentProfile.settings.extraArgs}
              onChange={(e) => handleSettingsChange('extraArgs', e.target.value)}
              fullWidth
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