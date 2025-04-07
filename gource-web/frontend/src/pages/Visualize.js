import React, { useState, useEffect, useRef } from 'react';
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
  Divider
} from '@mui/material';
import axios from 'axios';

function Visualize() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [options, setOptions] = useState({
    secondsPerDay: 8.57,
    resolution: '1280x720',
    title: 'Visualisation Gource',
    hideItems: ['mouse', 'progress', 'date'],
    autoSkipSeconds: 3.0,
    elasticityMultiplier: 0.5,
    maxUserSpeed: 500,
    fileIdle: 0,
    fileVanishingPoint: 0,
    bloom: 0.4,
    backgroundColor: '#000000',
    highlightDirectories: true
  });
  
  const iframeRef = useRef(null);

  useEffect(() => {
    fetchLogs();
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

  const handleOptionChange = (name, value) => {
    setOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHideItemToggle = (item) => {
    setOptions(prev => {
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

  const startPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cette API n'est pas encore implémentée dans le backend
      // À implémenter: POST /api/gource/preview
      const response = await axios.post('/api/gource/preview', {
        log: selectedLog,
        options
      });
      
      setSuccess("Prévisualisation démarrée avec succès");
      // La prévisualisation serait disponible via une URL WebSocket ou HTTP streaming
      // Pour l'instant, simulons un URL de prévisualisation
      setPreviewUrl('/preview/stream'); 
      
      // Dans une implémentation réelle, le backend pourrait retourner un token ou URL pour la prévisualisation
      // setPreviewUrl(response.data.previewUrl);
    } catch (err) {
      setError("Erreur lors du lancement de la prévisualisation");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Prévisualisation Gource
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Paramètres de visualisation
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

              <Typography gutterBottom>
                Secondes par jour: {options.secondsPerDay}
              </Typography>
              <Slider
                value={options.secondsPerDay}
                onChange={(e, val) => handleOptionChange('secondsPerDay', val)}
                min={1}
                max={20}
                step={0.1}
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Résolution</InputLabel>
                <Select
                  value={options.resolution}
                  onChange={(e) => handleOptionChange('resolution', e.target.value)}
                >
                  <MenuItem value="1280x720">HD (1280x720)</MenuItem>
                  <MenuItem value="1920x1080">Full HD (1920x1080)</MenuItem>
                  <MenuItem value="3840x2160">4K (3840x2160)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Titre"
                value={options.title}
                onChange={(e) => handleOptionChange('title', e.target.value)}
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
                        checked={options.hideItems.includes(item)}
                        onChange={() => handleHideItemToggle(item)}
                        size="small"
                      />
                    }
                    label={item}
                  />
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography gutterBottom>
                Bloom Intensity: {options.bloom}
              </Typography>
              <Slider
                value={options.bloom}
                onChange={(e, val) => handleOptionChange('bloom', val)}
                min={0}
                max={1}
                step={0.1}
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={startPreview}
                disabled={loading || !selectedLog}
              >
                {loading ? <CircularProgress size={24} /> : "Lancer la prévisualisation"}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Prévisualisation
              </Typography>
              <Paper 
                elevation={3} 
                sx={{ 
                  height: 480, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'background.default',
                  position: 'relative'
                }}
              >
                {previewUrl ? (
                  <iframe
                    ref={iframeRef}
                    src={previewUrl}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      border: 'none' 
                    }}
                    title="Gource Preview"
                  />
                ) : (
                  <Typography color="text.secondary">
                    Configurez les options et lancez la prévisualisation pour voir le résultat
                  </Typography>
                )}
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

export default Visualize; 