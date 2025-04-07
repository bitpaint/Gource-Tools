import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import axios from 'axios';

function Render() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [renders, setRenders] = useState([]);
  const [renderProgress, setRenderProgress] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderOptions, setRenderOptions] = useState({
    resolution: '1920x1080',
    secondsPerDay: 8.57,
    title: 'Gource Visualization',
    outputFilename: 'gource-render',
    fps: 60,
    qualityPreset: 'high',
    bitrate: '8M',
    audioFile: '',
    hideItems: ['mouse', 'progress'],
    logoOverlay: '',
    bloomIntensity: 0.4,
    backgroundColor: '#000000',
    startDate: '',
    endDate: '',
    cameraModeAuto: true
  });

  useEffect(() => {
    fetchLogs();
    fetchRenders();
  }, []);

  const fetchLogs = async () => {
    try {
      // Cette API n'est pas encore implémentée dans le backend
      // À implémenter: GET /api/logs
      const response = await axios.get('/api/logs');
      setLogs(response.data);
      if (response.data.length > 0) {
        setSelectedLog(response.data[0]);
      }
    } catch (err) {
      // On gère silencieusement cette erreur puisque l'API n'existe pas encore
      setLogs([]);
    }
  };

  const fetchRenders = async () => {
    try {
      // Cette API n'est pas encore implémentée dans le backend
      // À implémenter: GET /api/renders
      const response = await axios.get('/api/renders');
      setRenders(response.data);
    } catch (err) {
      // On gère silencieusement cette erreur puisque l'API n'existe pas encore
      setRenders([]);
    }
  };

  const handleOptionChange = (name, value) => {
    setRenderOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHideItemToggle = (item) => {
    setRenderOptions(prev => {
      const newHideItems = [...prev.hideItems];
      if (newHideItems.includes(item)) {
        return {
          ...prev,
          hideItems: newHideItems.filter(i => i !== item)
        };
      } else {
        return {
          ...prev,
          hideItems: [...newHideItems, item]
        };
      }
    });
  };

  const startRender = async () => {
    setLoading(true);
    setError(null);
    setIsRendering(true);
    setRenderProgress(0);
    
    try {
      // Cette API n'est pas encore implémentée dans le backend
      // À implémenter: POST /api/renders/start
      await axios.post('/api/renders/start', {
        log: selectedLog,
        options: renderOptions
      });
      
      setSuccess("Rendu démarré avec succès");
      
      // Simuler la progression du rendu
      const interval = setInterval(() => {
        setRenderProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(interval);
            setIsRendering(false);
            fetchRenders(); // Récupérer la liste mise à jour des rendus
            return 100;
          }
          return newProgress;
        });
      }, 1000);
      
    } catch (err) {
      setError("Erreur lors du démarrage du rendu");
      console.error(err);
      setIsRendering(false);
    } finally {
      setLoading(false);
    }
  };

  const deleteRender = async (renderName) => {
    try {
      // Cette API n'est pas encore implémentée dans le backend
      // À implémenter: DELETE /api/renders/:name
      await axios.delete(`/api/renders/${renderName}`);
      setSuccess(`Rendu "${renderName}" supprimé avec succès`);
      fetchRenders();
    } catch (err) {
      setError(`Erreur lors de la suppression du rendu "${renderName}"`);
      console.error(err);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Rendu Vidéo
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Paramètres de rendu
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Log à visualiser</InputLabel>
                <Select
                  value={selectedLog}
                  onChange={(e) => setSelectedLog(e.target.value)}
                  disabled={logs.length === 0}
                >
                  {logs.map((log, index) => (
                    <MenuItem key={index} value={log}>
                      {log}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Nom du fichier de sortie"
                value={renderOptions.outputFilename}
                onChange={(e) => handleOptionChange('outputFilename', e.target.value)}
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Résolution</InputLabel>
                    <Select
                      value={renderOptions.resolution}
                      onChange={(e) => handleOptionChange('resolution', e.target.value)}
                    >
                      <MenuItem value="1280x720">HD (1280x720)</MenuItem>
                      <MenuItem value="1920x1080">Full HD (1920x1080)</MenuItem>
                      <MenuItem value="3840x2160">4K (3840x2160)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Qualité</InputLabel>
                    <Select
                      value={renderOptions.qualityPreset}
                      onChange={(e) => handleOptionChange('qualityPreset', e.target.value)}
                    >
                      <MenuItem value="low">Basse</MenuItem>
                      <MenuItem value="medium">Moyenne</MenuItem>
                      <MenuItem value="high">Haute</MenuItem>
                      <MenuItem value="ultra">Ultra</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Typography gutterBottom>
                Secondes par jour: {renderOptions.secondsPerDay}
              </Typography>
              <Slider
                value={renderOptions.secondsPerDay}
                onChange={(e, val) => handleOptionChange('secondsPerDay', val)}
                min={1}
                max={20}
                step={0.1}
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />

              <Typography gutterBottom>
                Images par seconde: {renderOptions.fps}
              </Typography>
              <Slider
                value={renderOptions.fps}
                onChange={(e, val) => handleOptionChange('fps', val)}
                min={24}
                max={60}
                step={1}
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle1" gutterBottom>
                Éléments à masquer
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {['mouse', 'progress', 'date', 'filenames', 'usernames', 'tree', 'bloom', 'root'].map((item) => (
                  <FormControlLabel
                    key={item}
                    control={
                      <Switch
                        checked={renderOptions.hideItems.includes(item)}
                        onChange={() => handleHideItemToggle(item)}
                        size="small"
                      />
                    }
                    label={item}
                  />
                ))}
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={startRender}
                disabled={loading || isRendering || !selectedLog}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : "Démarrer le rendu"}
              </Button>
              
              {isRendering && (
                <Box sx={{ mt: 2 }}>
                  <Typography>Progression du rendu: {renderProgress}%</Typography>
                  <Box sx={{ width: '100%', bgcolor: 'grey.300', borderRadius: 1, mt: 1 }}>
                    <Box
                      sx={{
                        width: `${renderProgress}%`,
                        bgcolor: 'primary.main',
                        height: 10,
                        borderRadius: 1,
                        transition: 'width 0.5s ease-in-out'
                      }}
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rendus disponibles
              </Typography>
              <Paper sx={{ maxHeight: 500, overflow: 'auto' }}>
                <List>
                  {renders.length > 0 ? (
                    renders.map((render, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={render.name}
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  {render.resolution} - {render.duration}
                                </Typography>
                                <br />
                                {new Date(render.date).toLocaleString()}
                              </>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="play" sx={{ mr: 1 }}>
                              <PlayIcon />
                            </IconButton>
                            <IconButton edge="end" aria-label="download" sx={{ mr: 1 }}>
                              <DownloadIcon />
                            </IconButton>
                            <IconButton edge="end" aria-label="delete" onClick={() => deleteRender(render.name)}>
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < renders.length - 1 && <Divider />}
                      </React.Fragment>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="Aucun rendu disponible" />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Render; 