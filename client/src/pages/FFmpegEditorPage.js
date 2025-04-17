import React, { useState, useEffect, useRef } from 'react';
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
  FormControl,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
  Alert,
  Collapse
} from '@mui/material';
import {
  VideoLibrary as VideoLibraryIcon,
  MusicNote as MusicNoteIcon,
  Save as SaveIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  VolumeUp as VolumeIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { rendersApi, getRenderProgress } from '../api/api';
import { styled } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';

// Styled components for better visuals
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  borderRadius: 12,
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
  }
}));

// Style pour mieux mettre en évidence l'élément sélectionné
const StyledListItemButton = styled(ListItemButton)(({ theme, selected }) => ({
  borderRadius: 4,
  transition: 'all 0.2s',
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.main + '22',
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    '&:hover': {
      backgroundColor: theme.palette.primary.main + '33',
    }
  }
}));

// Style pour le slider
const StyledSlider = styled(Slider)(({ theme }) => ({
  '& .MuiSlider-valueLabel': {
    backgroundColor: theme.palette.primary.main,
  },
  '& .MuiSlider-thumb': {
    '&:hover, &.Mui-focusVisible': {
      boxShadow: `0px 0px 0px 8px ${theme.palette.primary.main}20`,
    }
  }
}));

const FFmpegEditorPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [preview, setPreview] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [currentRenderId, setCurrentRenderId] = useState(null);
  
  // FFmpeg Filters
  const [filters, setFilters] = useState({
    fade: {
      enabled: false,
      duration: 1, // Default combined duration
    },
    music: {
      enabled: false,
      file: '',
      volume: 0.8 // 0-1 
    },
    quality: 'high' // low, medium, high
  });

  // Refs
  const progressIntervalRef = useRef(null);
  const currentRenderIdRef = useRef(null);

  // Update the ref whenever the state variable changes
  useEffect(() => {
    currentRenderIdRef.current = currentRenderId;
    console.log(`[Effect] currentRenderIdRef updated to: ${currentRenderIdRef.current}`);
  }, [currentRenderId]);

  // Load the list of rendered videos
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const response = await rendersApi.getCompletedRenders();
      setVideos(response.data);
    } catch (err) {
      console.error('Error fetching videos:', err);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleVideoSelect = async (video) => {
    setSelectedVideo(video);
    setPreview(null);
    
    // Reset filters when selecting a new video
    setFilters({
      fade: {
        enabled: false,
        duration: 1 // Reset to default combined duration
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
      formData.append('music', e.target.files[0]);
      
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
      // Adapt filters for backend
      const backendFilters = {
        ...filters,
        fade: {
          ...filters.fade,
          durationIn: filters.fade.duration, 
          durationOut: filters.fade.duration
        }
      };
      const response = await rendersApi.generateFFmpegPreview(selectedVideo.id, backendFilters);
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
    if (!selectedVideo || applyingFilters) return;

    console.log('[applyFilters] Initiating filter application...'); 

    // Clear previous interval *before* setting state
    if (progressIntervalRef.current) {
      console.log('[applyFilters] Clearing previous interval.'); 
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setCurrentRenderId(null); // Reset ID state
    currentRenderIdRef.current = null; // Reset ID ref

    try {
      // Set state to indicate processing has started
      setApplyingFilters(true); // Show progress bar, disable button
      setProcessing(true); // Show general "Generating..." indicator if needed elsewhere
      setProgress(0);
      setStatusMessage('Preparing filters...'); 

      const backendFilters = {
        ...filters,
        fade: {
          ...filters.fade,
          durationIn: filters.fade.duration,
          durationOut: filters.fade.duration
        },
        music: {
          ...filters.music,
          file: filters.music.enabled ? filters.music.file : ''
        }
      };

      console.log('[applyFilters] Sending request to backend with filters:', backendFilters);
      const response = await rendersApi.applyFFmpegFilters(selectedVideo.id, backendFilters);
      console.log('[applyFilters] Received response from backend:', response.data); 
      
      const newRenderId = response.data.renderId;
      console.log(`[applyFilters] Received new render ID: ${newRenderId}`); 

      if (!newRenderId) {
        throw new Error("Backend did not return a render ID for progress tracking.");
      }

      // --- FIX: Update state AND ref immediately ---
      setCurrentRenderId(newRenderId); 
      currentRenderIdRef.current = newRenderId; // Set the ref directly here!
      console.log(`[applyFilters] Set currentRenderId state and ref to: ${newRenderId}`);
      // The useEffect hook will still run, but the ref is already correct for the first poll.

      setStatusMessage('Initializing processing...'); // Update message

      // --- Polling Function ---
      const pollProgress = async (renderIdInClosure) => { 
        // Check against the ref to ensure this poll is still for the active render process
        const activeRenderId = currentRenderIdRef.current; 
        // --- This check should now pass on the first call ---
        if (renderIdInClosure !== activeRenderId) { 
             console.log(`[pollProgress] Mismatch: Polling for ${renderIdInClosure} but current active ID is ${activeRenderId}. Stopping poll.`);
             if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
             progressIntervalRef.current = null;
             return false; // Stop polling
        }

        // If IDs match, proceed with polling
        try {
          console.log(`[pollProgress] Polling progress for active render ID: ${activeRenderId}...`);
          const progressResponse = await getRenderProgress(activeRenderId);
          console.log('[pollProgress] Received progress response:', progressResponse.data); 
          
          // Double-check the ID *after* the await, in case it changed during the async call
           if (activeRenderId !== currentRenderIdRef.current) {
               console.log(`[pollProgress] Mismatch after await: Polling for ${activeRenderId} but current active ID changed to ${currentRenderIdRef.current}. Stopping poll.`);
               if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
               progressIntervalRef.current = null;
                return false; // Stop polling
          }

          const { status, progress: newProgress, message } = progressResponse.data;
          // Ensure progress is a number between 0 and 100
          const progressValue = Math.min(100, Math.max(0, parseInt(newProgress || 0, 10))); 
          
          console.log(`[pollProgress] Updating UI - Progress: ${progressValue}%, Status: ${status}, Message: ${message}`); 
          
          setProgress(progressValue);
          setStatusMessage(message || `Processing (${progressValue}%)`);

          // --- Check for Completion or Failure ---
          if (status === 'completed' || status === 'failed') {
            console.log(`[pollProgress] Process ${status} detected for ${activeRenderId}. Clearing interval.`); 
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            
            // Reset state *after* interval is cleared
            setCurrentRenderId(null); 
            // Ref automatically updated by useEffect hook for currentRenderId
            setApplyingFilters(false); // Hide progress bar, enable button
            setProcessing(false); // <<<<<< IMPORTANT: Hides "Generating..." indicator

            if (status === 'completed') {
              toast.success(message || 'Video processed successfully!');
              setProgress(100); // Ensure it hits 100
              await fetchVideos(); // Refresh video list
            } else {
              toast.error(message || 'Video processing failed.');
              setProgress(0); // Reset progress on failure
            }
            return false; // Stop polling
          }
          return true; // Continue polling
        } catch (pollError) {
          console.error(`[pollProgress] Error polling progress for ${activeRenderId}:`, pollError);
          toast.error('Error checking video processing status.');
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          // Reset state on polling error
          setCurrentRenderId(null);
          // Ref updated by hook
          setApplyingFilters(false); // Reset state
          setProcessing(false); // <<<<<< IMPORTANT: Reset state here too
          setProgress(0);
          setStatusMessage('Error checking status');
          return false; // Stop polling
        }
      };

      // --- Start Polling ---
      console.log(`[applyFilters] Starting polling loop for ${newRenderId}`);

      // Poll immediately once using the ID from the closure
      const shouldContinue = await pollProgress(newRenderId); 

      // Only set interval if the first poll didn't result in completion/failure
      if (shouldContinue && progressIntervalRef.current === null) { 
          console.log(`[applyFilters] Setting interval timer for ${newRenderId}`);
          // Subsequent interval calls will use the pollProgress function, 
          // which checks currentRenderIdRef.current internally.
          progressIntervalRef.current = setInterval(() => pollProgress(newRenderId), 1000); // Poll every 1 second
      } else if (!shouldContinue) {
           console.log(`[applyFilters] Initial poll indicated completion/failure for ${newRenderId}. Interval not set.`);
      } else {
           console.log(`[applyFilters] Interval already seems to be set or race condition? ID: ${newRenderId}`);
      }

    } catch (err) {
      console.error('[applyFilters] Error during filter application setup:', err); 
      toast.error(err.response?.data?.error || 'Failed to start filter process');
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // Reset state fully on setup error
      setCurrentRenderId(null);
      // Ref updated by hook
      setApplyingFilters(false); 
      setProcessing(false); // <<<<<< IMPORTANT: Reset processing state
      setProgress(0);
      setStatusMessage('Failed to start');
    }
  };

  // Clear interval on component unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        console.log('[Cleanup] Clearing interval on unmount.');
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures it runs only on unmount

  const VideoListSection = () => (
    <StyledPaper elevation={0}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          <VideoLibraryIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
          Your Videos
        </Typography>
        <Tooltip title="Refresh video list">
          <IconButton 
            size="small" 
            onClick={fetchVideos} 
            disabled={refreshing}
            color="primary"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={40} />
        </Box>
      ) : videos.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No videos available. Render a Gource visualization first.
        </Alert>
      ) : (
        <List sx={{ maxHeight: '70vh', overflow: 'auto' }}>
          {videos.map((video) => (
            <ListItem disablePadding key={video.id}>
              <StyledListItemButton 
                selected={selectedVideo && selectedVideo.id === video.id}
                onClick={() => handleVideoSelect(video)}
              >
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'bold' }}>
                        {video.fileName || `Render ${video.id}`}
                      </Typography>
                      {selectedVideo && selectedVideo.id === video.id && (
                        <Chip 
                          size="small" 
                          color="primary" 
                          label="Selected" 
                          icon={<CheckCircleIcon />}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" component="span" color="text.secondary">
                        Project: {video.projectName || 'N/A'}
                      </Typography>
                      <br />
                      <Typography variant="caption" component="span" color="text.secondary">
                        Rendered on: {video.endTime ? new Date(video.endTime).toLocaleString() : 'Date unknown'}
                      </Typography>
                    </Box>
                  }
                />
              </StyledListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </StyledPaper>
  );

  const EditorSection = () => (
    <StyledPaper elevation={0}>
      {!selectedVideo ? (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <VideoLibraryIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Select a video from the list to start editing
          </Typography>
        </Box>
      ) : (
        <>
          <Typography variant="h5" gutterBottom fontWeight="500">
            {selectedVideo.fileName || `Render ${selectedVideo.id}`}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Project: {selectedVideo.projectName || 'Not specified'} | 
            {selectedVideo.endTime ? ` Rendered on ${new Date(selectedVideo.endTime).toLocaleString()}` : ''}
          </Typography>
          
          <Divider sx={{ mb: 3 }} />

          {/* Fade Controls */}
          <Box 
            sx={{ 
              mb: 4, 
              p: 2, 
              borderRadius: 2, 
              bgcolor: 'background.paper', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={filters.fade.enabled}
                  onChange={(e) => handleFilterChange('fade', 'enabled', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography fontWeight="500">Add fade effects (In & Out)</Typography>
              }
            />
            
            <Collapse in={filters.fade.enabled}>
              <Box sx={{ pl: 2, pt: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography id="fade-duration-slider" sx={{ flexGrow: 1 }}>
                    Fade duration: {filters.fade.duration} seconds (each)
                  </Typography>
                </Box>
                
                <StyledSlider
                  value={filters.fade.duration}
                  onChange={(_, newValue) => handleFilterChange('fade', 'duration', newValue)}
                  aria-labelledby="fade-duration-slider"
                  valueLabelDisplay="auto"
                  step={0.5}
                  marks
                  min={0.5}
                  max={3} // Maximum duration set to 3 seconds
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <InfoIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Adds smooth transitions at the beginning and end of the video
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </Box>

          {/* Music Controls */}
          <Box 
            sx={{ 
              mb: 4, 
              p: 2, 
              borderRadius: 2, 
              bgcolor: 'background.paper', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={filters.music.enabled}
                  onChange={(e) => handleFilterChange('music', 'enabled', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MusicNoteIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography fontWeight="500">Add background music</Typography>
                </Box>
              }
            />
            
            <Collapse in={filters.music.enabled}>
              <Box sx={{ pl: 2, pt: 1.5 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<MusicNoteIcon />}
                  sx={{ mb: 2, mt: 1, width: '100%' }}
                >
                  {filters.music.file ? 'Change music file' : 'Upload music file'}
                  <input
                    type="file"
                    accept="audio/*"
                    hidden
                    onChange={handleMusicFileChange}
                  />
                </Button>
                
                {filters.music.file && (
                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: 'action.hover', 
                    borderRadius: 1,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <MusicNoteIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {filters.music.file.split('/').pop()}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <VolumeIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                  <Typography id="music-volume-slider">
                    Volume: {Math.round(filters.music.volume * 100)}%
                  </Typography>
                </Box>
                
                <StyledSlider
                  value={filters.music.volume}
                  onChange={(_, newValue) => handleFilterChange('music', 'volume', newValue)}
                  aria-labelledby="music-volume-slider"
                  valueLabelDisplay="auto"
                  step={0.05}
                  marks
                  min={0}
                  max={1}
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <InfoIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Music will be applied for the entire duration of the video
                  </Typography>
                </Box>
              </Box>
            </Collapse>
          </Box>

          {/* Filter Application Section */}
          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>Apply Changes</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <Select
                    value={filters.quality}
                    onChange={(e) => handleFilterChange('quality', 'quality', e.target.value)}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Output Quality' }}
                    disabled={applyingFilters}
                  >
                    <MenuItem value="high">High (Best quality)</MenuItem>
                    <MenuItem value="medium">Medium (Good balance)</MenuItem>
                    <MenuItem value="low">Low (Faster, smaller file)</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 1 }}>
                  <InfoIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
                  Higher quality takes longer to process but looks better.
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={applyingFilters ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={applyFilters}
                  disabled={!selectedVideo || applyingFilters}
                  sx={{ minWidth: 150 }}
                >
                  {applyingFilters ? `${Math.round(progress)}%` : 'Apply & Save'}
                </Button>
              </Grid>
            </Grid>
            <Collapse in={applyingFilters}>
              <Box sx={{ width: '100%', mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="primary" fontWeight="medium">
                    {statusMessage}
                  </Typography>
                  <Typography variant="body2" color="primary" fontWeight="bold">
                    {Math.round(progress)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      transition: 'transform 0.3s ease-in-out',
                    }
                  }}
                />
                <Box 
                  sx={{ 
                    mt: 2, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  <Box sx={{ 
                    position: 'absolute', 
                    top: -15, 
                    left: '0%', 
                    transform: 'translateX(-50%)',
                    opacity: progress >= 5 ? 1 : 0.5
                  }}>
                    <Typography variant="caption" color={progress >= 5 ? "primary" : "text.secondary"}>
                      •
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: -15, 
                    left: '25%', 
                    transform: 'translateX(-50%)',
                    opacity: progress >= 25 ? 1 : 0.5
                  }}>
                    <Typography variant="caption" color={progress >= 25 ? "primary" : "text.secondary"}>
                      •
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: -15, 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    opacity: progress >= 50 ? 1 : 0.5
                  }}>
                    <Typography variant="caption" color={progress >= 50 ? "primary" : "text.secondary"}>
                      •
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: -15, 
                    left: '75%', 
                    transform: 'translateX(-50%)',
                    opacity: progress >= 75 ? 1 : 0.5
                  }}>
                    <Typography variant="caption" color={progress >= 75 ? "primary" : "text.secondary"}>
                      •
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: -15, 
                    left: '100%', 
                    transform: 'translateX(-50%)',
                    opacity: progress >= 100 ? 1 : 0.5
                  }}>
                    <Typography variant="caption" color={progress >= 100 ? "primary" : "text.secondary"}>
                      •
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 4, display: 'block', textAlign: 'center' }}>
                  {progress === 0 && "Initializing..."}
                  {progress > 0 && progress < 25 && "Setting up processing..."}
                  {progress >= 25 && progress < 50 && "Processing video..."}
                  {progress >= 50 && progress < 75 && "Applying filters..."}
                  {progress >= 75 && progress < 97 && "Finalizing..."}
                  {progress >= 97 && progress < 100 && "Almost done..."}
                  {progress >= 100 && "Complete!"}
                </Typography>
              </Box>
            </Collapse>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PlayArrowIcon />}
              onClick={generatePreview}
              disabled={processing}
              size="large"
              fullWidth
            >
              {processing ? 'Generating...' : 'Preview'}
            </Button>
          </Box>
          
          {processing && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <CircularProgress />
            </Box>
          )}
        </>
      )}
    </StyledPaper>
  );

  const PreviewSection = () => (
    <StyledPaper elevation={0}>
      <Typography variant="h6" gutterBottom fontWeight="500">
        Preview
      </Typography>
      <Box sx={{ textAlign: 'center' }}>
        {!selectedVideo ? (
          <Box sx={{ p: 4 }}>
            <PlayArrowIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Select a video and generate a preview
            </Typography>
          </Box>
        ) : preview ? (
          <Box>
            <video
              controls
              width="100%"
              src={preview}
              style={{ maxHeight: '70vh', borderRadius: 8 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              This is a preview. Click "Apply and save" to save these changes.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 4 }}>
            <PlayArrowIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Click "Generate preview" to see your changes
            </Typography>
          </Box>
        )}
      </Box>
    </StyledPaper>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="500" gutterBottom>
          FFmpeg Video Editor
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Apply simple filters to your Gource videos without losing quality
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <VideoListSection />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <EditorSection />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <PreviewSection />
        </Grid>
      </Grid>
    </Container>
  );
};

export default FFmpegEditorPage; 