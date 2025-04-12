import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  PlayArrow as PlayIcon, 
  Info as InfoIcon,
  Check as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { projectsApi, renderProfilesApi, rendersApi } from '../api/api';

const RenderPage = () => {
  const [projects, setProjects] = useState([]);
  const [renderProfiles, setRenderProfiles] = useState([]);
  const [renders, setRenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [customName, setCustomName] = useState('');
  const [renderStarting, setRenderStarting] = useState(false);
  
  // Polling for render updates
  useEffect(() => {
    fetchData();
    
    // Set up polling for render updates
    const interval = setInterval(() => {
      fetchRenders();
    }, 3000); // Poll every 3 seconds
    
    // Clean up interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectsRes, profilesRes, rendersRes] = await Promise.all([
        projectsApi.getAll(),
        renderProfilesApi.getAll(),
        rendersApi.getAll()
      ]);
      
      setProjects(projectsRes.data);
      setRenderProfiles(profilesRes.data);
      setRenders(rendersRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRenders = async () => {
    try {
      const response = await rendersApi.getAll();
      setRenders(response.data);
    } catch (err) {
      console.error('Error fetching renders:', err);
    }
  };

  const handleStartRender = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project to render');
      return;
    }

    try {
      setRenderStarting(true);
      const response = await rendersApi.startRender({
        projectId: selectedProjectId,
        customName: customName.trim() || undefined
      });
      
      // Add the new render to the list
      setRenders([response.data, ...renders]);
      
      toast.success('Render started successfully');
      setCustomName('');
    } catch (err) {
      console.error('Error starting render:', err);
      toast.error(err.response?.data?.error || 'Failed to start render');
    } finally {
      setRenderStarting(false);
    }
  };

  const handleOpenExportsFolder = async () => {
    try {
      await rendersApi.openExportsFolder();
    } catch (err) {
      console.error('Error opening exports folder:', err);
      toast.error('Failed to open exports folder');
    }
  };

  // Helper functions
  // eslint-disable-next-line no-unused-vars
  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getProfileName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    
    // Si le projet n'a pas de profil assigné
    if (!project || !project.renderProfileId) {
      // Recherche du profil par défaut
      const defaultProfile = renderProfiles.find(p => p.isDefault === true);
      return defaultProfile ? defaultProfile.name : 'Default settings';
    }
    
    // Si le projet a un profil assigné
    const profile = renderProfiles.find(p => p.id === project.renderProfileId);
    return profile ? profile.name : 'Default settings';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'preparing':
        return <Chip label="Preparing" color="warning" size="small" icon={<InfoIcon />} />;
      case 'ready':
        return <Chip label="Ready" color="info" size="small" icon={<InfoIcon />} />;
      case 'rendering':
        return <Chip label="Rendering" color="primary" size="small" icon={<InfoIcon />} />;
      case 'completed':
        return <Chip label="Completed" color="success" size="small" icon={<CheckIcon />} />;
      case 'failed':
        return <Chip label="Failed" color="error" size="small" icon={<ErrorIcon />} />;
      default:
        return <Chip label={status} size="small" />;
    }
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
          Render
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Generate Gource visualizations from your projects
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Start New Render
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="project-label">Select Project</InputLabel>
                <Select
                  labelId="project-label"
                  id="project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  label="Select Project"
                  disabled={projects.length === 0 || renderStarting}
                >
                  {projects.length === 0 ? (
                    <MenuItem value="" disabled>
                      No projects available
                    </MenuItem>
                  ) : (
                    projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              
              {selectedProjectId && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Using render profile: <strong>{getProfileName(selectedProjectId)}</strong>
                  </Typography>
                </Box>
              )}
              
              <TextField
                label="Custom Output Name (optional)"
                fullWidth
                variant="outlined"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                disabled={renderStarting}
                sx={{ mb: 2 }}
                helperText="A timestamp will be added to the filename"
              />
              
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={renderStarting ? <CircularProgress size={16} color="inherit" /> : <PlayIcon />}
                onClick={handleStartRender}
                disabled={!selectedProjectId || renderStarting}
              >
                {renderStarting ? 'Starting Render...' : 'Start Render'}
              </Button>
              
              <Divider sx={{ my: 2 }} />
              
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={handleOpenExportsFolder}
              >
                Open Exports Folder
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Render History
            </Typography>
            
            {renders.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No render history available.
              </Typography>
            ) : (
              <List>
                {renders.map((render) => (
                  <React.Fragment key={render.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" component="span">
                              {render.fileName}
                            </Typography>
                            {getStatusChip(render.status)}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Box sx={{ mb: 0.5 }}>
                              <Typography component="span" variant="body2" color="text.secondary">
                                Project: {render.projectName}
                              </Typography>
                            </Box>
                            <Box sx={{ mb: 0.5 }}>
                              <Typography component="span" variant="body2" color="text.secondary">
                                Started: {formatDate(render.startTime)}
                              </Typography>
                            </Box>
                            {render.endTime && (
                              <Box sx={{ mb: 0.5 }}>
                                <Typography component="span" variant="body2" color="text.secondary">
                                  Finished: {formatDate(render.endTime)}
                                </Typography>
                              </Box>
                            )}
                            {render.error && (
                              <Box sx={{ mt: 1 }}>
                                <Typography component="span" variant="body2" color="error">
                                  Error: {render.error}
                                </Typography>
                              </Box>
                            )}
                            {render.status === 'rendering' || render.status === 'preparing' ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Box sx={{ width: '100%', mr: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={render.progress || 0} 
                                  />
                                </Box>
                                <Box sx={{ minWidth: 35 }}>
                                  <Typography component="span" variant="body2" color="text.secondary">
                                    {`${Math.round(render.progress || 0)}%`}
                                  </Typography>
                                </Box>
                              </Box>
                            ) : null}
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RenderPage; 