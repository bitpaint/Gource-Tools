import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Button,
  Slider,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress
} from '@mui/material';
import {
  VideoLibrary as VideoLibraryIcon,
  MusicNote as MusicNoteIcon,
  Save as SaveIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { rendersApi } from '../api/api';

const FFmpegEditorPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState(null);
  
  // Filtres FFmpeg
  const [filters, setFilters] = useState({
    fade: {
      enabled: false,
      durationIn: 3, // secondes pour le fade in
      durationOut: 3 // secondes pour le fade out
    },
    music: {
      enabled: false,
      file: '',
      volume: 0.8 // 0-1
    },
    quality: 'high' // low, medium, high
  });

  // Charger la liste des vidéos rendues
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await rendersApi.getCompletedRenders();
        setVideos(response.data);
      } catch (err) {
        console.error('Error fetching videos:', err);
        toast.error('Failed to load videos');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleVideoSelect = async (video) => {
    setSelectedVideo(video);
    setPreview(null);
    
    // Reset filters when selecting a new video
    setFilters({
      fade: {
        enabled: false,
        durationIn: 3,
        durationOut: 3
      },
      music: {
        enabled: false,
        file: '',
        volume: 0.8
      },
      quality: 'high'
    });
  };

  const handleFilterChange = (filterType, property, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: {
        ...prev[filterType],
        [property]: value
      }
    }));
  };

  const handleMusicFileChange = async (e) => {
    try {
      const formData = new FormData();
      formData.append('musicFile', e.target.files[0]);
      
      const response = await rendersApi.uploadMusicFile(formData);
      
      setFilters(prev => ({
        ...prev,
        music: {
          ...prev.music,
          file: response.data.filePath,
          enabled: true
        }
      }));
      
      toast.success('Music file uploaded');
    } catch (err) {
      console.error('Error uploading music file:', err);
      toast.error('Failed to upload music file');
    }
  };

  const generatePreview = async () => {
    if (!selectedVideo) return;
    
    try {
      setProcessing(true);
      const response = await rendersApi.generateFFmpegPreview(selectedVideo.id, filters);
      setPreview(response.data.previewUrl);
      toast.success('Preview generated');
    } catch (err) {
      console.error('Error generating preview:', err);
      toast.error('Failed to generate preview');
    } finally {
      setProcessing(false);
    }
  };

  const applyFilters = async () => {
    if (!selectedVideo) return;
    
    try {
      setProcessing(true);
      await rendersApi.applyFFmpegFilters(selectedVideo.id, filters);
      toast.success('Filters applied and video saved');
      
      // Refresh the list of videos
      const response = await rendersApi.getCompletedRenders();
      setVideos(response.data);
    } catch (err) {
      console.error('Error applying filters:', err);
      toast.error('Failed to apply filters');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Éditeur Vidéo FFmpeg
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Appliquez des filtres simples à vos vidéos Gource sans perdre de qualité
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left sidebar - Video list */}
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              <VideoLibraryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Vos Rendus
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : videos.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                Aucune vidéo disponible. Rendez une visualisation Gource d'abord.
              </Typography>
            ) : (
              <List sx={{ maxHeight: '70vh', overflow: 'auto' }}>
                {videos.map((video) => (
                  <ListItem disablePadding key={video.id}>
                    <ListItemButton 
                      selected={selectedVideo && selectedVideo.id === video.id}
                      onClick={() => handleVideoSelect(video)}
                    >
                      <ListItemText 
                        primary={
                          <Box>
                            <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'bold' }}>
                              {video.fileName || `Render ${video.id}`}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span" color="text.secondary">
                              Projet: {video.projectName || 'N/A'}
                            </Typography>
                            <br />
                            <Typography variant="caption" component="span" color="text.secondary">
                              Rendu le: {video.endTime ? new Date(video.endTime).toLocaleString() : 'Date inconnue'}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Center - Filter controls */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            {!selectedVideo ? (
              <Box sx={{ textAlign: 'center', p: 5 }}>
                <Typography variant="h6" color="text.secondary">
                  Sélectionnez une vidéo pour commencer l'édition
                </Typography>
              </Box>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  Édition: {selectedVideo.fileName || `Render ${selectedVideo.id}`}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Projet: {selectedVideo.projectName || 'Non spécifié'} | 
                  {selectedVideo.endTime ? ` Rendu le ${new Date(selectedVideo.endTime).toLocaleString()}` : ''}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {/* Fade Controls - Combined */}
                <Box sx={{ mb: 4 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.fade.enabled}
                        onChange={(e) => handleFilterChange('fade', 'enabled', e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        Fondus vidéo et audio
                      </Box>
                    }
                  />
                  
                  {filters.fade.enabled && (
                    <Box sx={{ pl: 2 }}>
                      <Typography id="fade-in-duration-slider" gutterBottom>
                        Durée du fondu d'ouverture: {filters.fade.durationIn} secondes
                      </Typography>
                      <Slider
                        value={filters.fade.durationIn}
                        onChange={(_, newValue) => handleFilterChange('fade', 'durationIn', newValue)}
                        aria-labelledby="fade-in-duration-slider"
                        valueLabelDisplay="auto"
                        step={0.5}
                        marks
                        min={0.5}
                        max={5}
                      />

                      <Typography id="fade-out-duration-slider" gutterBottom sx={{ mt: 2 }}>
                        Durée du fondu de fermeture: {filters.fade.durationOut} secondes
                      </Typography>
                      <Slider
                        value={filters.fade.durationOut}
                        onChange={(_, newValue) => handleFilterChange('fade', 'durationOut', newValue)}
                        aria-labelledby="fade-out-duration-slider"
                        valueLabelDisplay="auto"
                        step={0.5}
                        marks
                        min={0.5}
                        max={5}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Le fondu s'appliquera à la vidéo et à l'audio si présent
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Music Controls */}
                <Box sx={{ mb: 4 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.music.enabled}
                        onChange={(e) => handleFilterChange('music', 'enabled', e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MusicNoteIcon sx={{ mr: 1 }} />
                        Ajouter une musique de fond
                      </Box>
                    }
                  />
                  
                  {filters.music.enabled && (
                    <Box sx={{ pl: 2 }}>
                      <Button
                        variant="outlined"
                        component="label"
                        sx={{ mb: 2, mt: 1 }}
                      >
                        {filters.music.file ? 'Changer de musique' : 'Télécharger une musique'}
                        <input
                          type="file"
                          accept="audio/*"
                          hidden
                          onChange={handleMusicFileChange}
                        />
                      </Button>
                      
                      {filters.music.file && (
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          Sélectionné: {filters.music.file.split('/').pop()}
                        </Typography>
                      )}
                      
                      <Typography id="music-volume-slider" gutterBottom>
                        Volume: {Math.round(filters.music.volume * 100)}%
                      </Typography>
                      <Slider
                        value={filters.music.volume}
                        onChange={(_, newValue) => handleFilterChange('music', 'volume', newValue)}
                        aria-labelledby="music-volume-slider"
                        valueLabelDisplay="auto"
                        step={0.05}
                        marks
                        min={0}
                        max={1}
                      />
                    </Box>
                  )}
                </Box>

                {/* Quality Controls */}
                <Box sx={{ mb: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel id="quality-select-label">Qualité de sortie</InputLabel>
                    <Select
                      labelId="quality-select-label"
                      id="quality-select"
                      value={filters.quality}
                      label="Qualité de sortie"
                      onChange={(e) => setFilters(prev => ({ ...prev, quality: e.target.value }))}
                    >
                      <MenuItem value="low">Basse (Traitement plus rapide)</MenuItem>
                      <MenuItem value="medium">Moyenne</MenuItem>
                      <MenuItem value="high">Haute (Traitement plus lent)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    onClick={generatePreview}
                    disabled={processing}
                  >
                    Générer un aperçu
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={applyFilters}
                    disabled={processing}
                  >
                    Appliquer et enregistrer
                  </Button>
                </Box>
                
                {processing && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <CircularProgress />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>

        {/* Right - Preview */}
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Aperçu
            </Typography>
            <Box sx={{ textAlign: 'center' }}>
              {!selectedVideo ? (
                <Typography variant="body2" color="text.secondary">
                  Sélectionnez une vidéo et générez un aperçu
                </Typography>
              ) : preview ? (
                <Box>
                  <video
                    controls
                    width="100%"
                    src={preview}
                    style={{ maxHeight: '70vh' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Ceci est un aperçu en basse résolution. La sortie finale sera en qualité maximale.
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Cliquez sur "Générer un aperçu" pour voir vos modifications
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default FFmpegEditorPage; 