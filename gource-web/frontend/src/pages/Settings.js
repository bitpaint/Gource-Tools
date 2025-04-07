import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';

const Settings = () => {
  const [config, setConfig] = useState({
    github_api_key: '',
    default_render_settings: {
      resolution: '1920x1080',
      seconds_per_day: 8.57,
      hide: ['progress', 'mouse', 'filenames', 'root']
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get('/api/config');
        setConfig(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration', error);
        setSnackbar({
          open: true,
          message: 'Erreur lors du chargement de la configuration',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await axios.put('/api/config', config);
      setSnackbar({
        open: true,
        message: 'Configuration sauvegardée avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la sauvegarde de la configuration',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangeConfig = (e) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: value
    });
  };

  const handleChangeRenderSettings = (e) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      default_render_settings: {
        ...config.default_render_settings,
        [name]: value
      }
    });
  };

  const handleToggleHideOption = (option) => {
    const currentHideOptions = [...config.default_render_settings.hide];
    const index = currentHideOptions.indexOf(option);
    
    if (index === -1) {
      // Add option
      currentHideOptions.push(option);
    } else {
      // Remove option
      currentHideOptions.splice(index, 1);
    }
    
    setConfig({
      ...config,
      default_render_settings: {
        ...config.default_render_settings,
        hide: currentHideOptions
      }
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Paramètres
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          API et Intégrations
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Clé API GitHub"
              name="github_api_key"
              value={config.github_api_key}
              onChange={handleChangeConfig}
              variant="outlined"
              placeholder="Entrez votre clé API GitHub (optionnel)"
              helperText="Utilisée pour les requêtes à l'API GitHub avec une limite plus élevée"
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Paramètres de rendu Gource
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="resolution-label">Résolution</InputLabel>
              <Select
                labelId="resolution-label"
                name="resolution"
                value={config.default_render_settings.resolution}
                onChange={handleChangeRenderSettings}
                label="Résolution"
              >
                <MenuItem value="1280x720">1280x720 (720p)</MenuItem>
                <MenuItem value="1920x1080">1920x1080 (1080p)</MenuItem>
                <MenuItem value="2560x1440">2560x1440 (1440p)</MenuItem>
                <MenuItem value="3840x2160">3840x2160 (4K)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Secondes par jour"
              name="seconds_per_day"
              value={config.default_render_settings.seconds_per_day}
              onChange={handleChangeRenderSettings}
              variant="outlined"
              inputProps={{ step: 0.1, min: 0.1 }}
              helperText="Contrôle la vitesse de l'animation (valeurs typiques: 1.0 - 10.0)"
            />
          </Grid>
        </Grid>

        <Box mt={3}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Options d'affichage</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.default_render_settings.hide.includes('progress')}
                        onChange={() => handleToggleHideOption('progress')}
                      />
                    }
                    label="Masquer la progression"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.default_render_settings.hide.includes('mouse')}
                        onChange={() => handleToggleHideOption('mouse')}
                      />
                    }
                    label="Masquer la souris"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.default_render_settings.hide.includes('filenames')}
                        onChange={() => handleToggleHideOption('filenames')}
                      />
                    }
                    label="Masquer les noms de fichiers"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.default_render_settings.hide.includes('root')}
                        onChange={() => handleToggleHideOption('root')}
                      />
                    }
                    label="Masquer la racine"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Paper>

      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSaveConfig}
          disabled={saving}
        >
          {saving ? 'Sauvegarde en cours...' : 'Sauvegarder les paramètres'}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings; 