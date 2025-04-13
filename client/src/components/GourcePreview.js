import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Alert,
  Skeleton
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import { generateGourceCommand } from '../utils/gourceUtils';
import axios from 'axios';

/**
 * Composant de prévisualisation en temps réel des configurations Gource
 * @param {Object} props - Les propriétés du composant
 * @param {Object} props.settings - Les paramètres de configuration Gource
 * @param {string} props.repositoryPath - Le chemin du dépôt à visualiser
 * @param {boolean} props.refreshTrigger - Déclencheur de rafraîchissement
 */
const GourcePreview = ({ settings, repositoryPath, refreshTrigger }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);

  // Générer un aperçu quand les paramètres changent ou le déclencheur est activé
  useEffect(() => {
    if (isLive && settings && repositoryPath) {
      generatePreview();
    }
  }, [settings, repositoryPath, refreshTrigger, isLive]);

  const generatePreview = async () => {
    if (!settings || !repositoryPath) {
      setError('No settings or repository path provided');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      // Utiliser une API côté serveur pour générer un aperçu en image
      const response = await axios.post('/api/renders/preview', {
        settings: settings,
        repositoryPath: repositoryPath
      });
      
      if (response.data && response.data.previewUrl) {
        setPreviewUrl(response.data.previewUrl);
      } else {
        setError('Failed to generate preview');
      }
    } catch (err) {
      console.error('Error generating preview:', err);
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const startLivePreview = () => {
    setIsLive(true);
    generatePreview();
  };

  const stopLivePreview = () => {
    setIsLive(false);
  };

  const handleRefresh = () => {
    if (!isLive) {
      generatePreview();
    }
  };

  return (
    <Paper 
      sx={{ 
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Gource Preview
      </Typography>
      
      <Box 
        sx={{ 
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0a0a0a',
          borderRadius: 1,
          overflow: 'hidden',
          position: 'relative',
          mb: 2
        }}
      >
        {isGenerating ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : previewUrl ? (
          <Box
            component="img"
            src={previewUrl}
            alt="Gource Preview"
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        ) : (
          <>
            <Skeleton 
              variant="rectangular" 
              width="100%" 
              height="100%" 
              animation="wave"
              sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
            />
            <Typography 
              sx={{ 
                position: 'absolute', 
                color: 'text.secondary' 
              }}
            >
              Click "Generate Preview" to see a preview
            </Typography>
          </>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {isLive ? (
          <Button
            variant="contained"
            color="error"
            startIcon={<StopIcon />}
            onClick={stopLivePreview}
          >
            Stop Live Preview
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={startLivePreview}
            disabled={!settings || !repositoryPath}
          >
            Live Preview
          </Button>
        )}
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={isLive || isGenerating || !settings || !repositoryPath}
        >
          Refresh
        </Button>
      </Box>
      
      {settings && repositoryPath && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Command: {generateGourceCommand(settings, repositoryPath)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default GourcePreview; 