import React, { useEffect, useRef } from 'react';
import {
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  IconButton,
  TextField,
  Box,
  Divider
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

// Import custom components
import ColorPickerField from '../../ColorPickerField';
import TooltipField from '../../TooltipField';
import TooltipCheckbox from '../../TooltipCheckbox';

// Import utility functions
import { getCommonResolutions } from '../../../utils/gourceUtils';

/**
 * General & Video settings tab for Gource configuration
 */
const GourceGeneralVideoTab = ({ 
  settings, 
  onSettingsChange, 
  settingsDescriptions,
  profileName,
  profileDescription,
  onProfileInfoChange,
  isSystemProfile,
  selectedPreset,
  onPresetChange,
  presets,
  showNameError,
  showTitleError,
  isEditing
}) => {
  const commonResolutions = getCommonResolutions();
  const nameInputRef = useRef(null);

  // Auto-focus the name field when creating a new profile
  useEffect(() => {
    if (!isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditing]);

  // Handle numeric values specifically
  const handleNumericChange = (field, value, defaultValue, isInteger = true) => {
    // Direct access to TextField without the UI component may call this with an event
    if (value && value.target) {
      value = value.target.value;
    }
    
    // If empty, return empty or default based on field needs
    if (value === '') {
      onSettingsChange(field, defaultValue);
      return;
    }
    
    // Parse according to number type
    const parsedValue = isInteger 
      ? parseInt(value, 10) 
      : parseFloat(value);
      
    // Use default if parsing fails
    const finalValue = isNaN(parsedValue) ? defaultValue : parsedValue;
    onSettingsChange(field, finalValue);
  };

  return (
    <>
      {/* Profile Information Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Profile Information</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              inputRef={nameInputRef}
              id="name"
              label="Profile Name"
              type="text"
              fullWidth
              variant="outlined"
              value={profileName}
              onChange={(e) => onProfileInfoChange('name', e.target.value)}
              disabled={isSystemProfile}
              required
              error={showNameError}
              helperText={showNameError ? 'Required' : ''}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              value={profileDescription}
              onChange={(e) => onProfileInfoChange('description', e.target.value)}
              disabled={isSystemProfile}
            />
          </Grid>
          
          {/* Preset Selector - only show if not a system profile */}
          {!isSystemProfile && (
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="preset-select-label">Apply Preset (Optional)</InputLabel>
                <Select
                  labelId="preset-select-label"
                  id="preset-select"
                  value={selectedPreset}
                  onChange={(e) => onPresetChange(e.target.value)}
                  label="Apply Preset (Optional)"
                >
                  <MenuItem value="">
                    <em>None - Custom Settings</em>
                  </MenuItem>
                  {Object.entries(presets).map(([key, preset]) => (
                    <MenuItem key={key} value={key}>
                      {preset.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Video Settings Section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>Video Settings</Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure core video output settings like resolution, framerate, and background color.
        </Typography>
        <Grid container spacing={3}>
          {/* Resolution Dropdown */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel id="resolution-label">Resolution</InputLabel>
              <Select
                labelId="resolution-label"
                id="resolution"
                value={settings.resolution || '1920x1080'}
                onChange={(e) => onSettingsChange('resolution', e.target.value)}
                label="Resolution"
                endAdornment={
                  <InputAdornment position="end">
                    <Tooltip title={settingsDescriptions.resolution || 'Video resolution (e.g., 1920x1080)'}>
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

          {/* Framerate Field */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Framerate"
              type="number"
              value={settings.framerate !== undefined ? settings.framerate : 60}
              onChange={(e) => handleNumericChange('framerate', e.target.value, 60)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <span style={{ marginRight: 8 }}>fps</span>
                    <Tooltip title={settingsDescriptions.framerate || 'Frames per second for the output video (e.g., 30, 60)'}>
                      <IconButton size="small">
                        <HelpOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              inputProps={{ min: 1, max: 120 }}
            />
          </Grid>

          {/* Background Color Picker */}
          <Grid item xs={12} sm={6} md={4}>
            <ColorPickerField
              label="Background Color"
              value={settings.background || '#000000'}
              onChange={(value) => onSettingsChange('background', value)}
              tooltip={settingsDescriptions.background || 'Background color in hex (e.g., #FFFFFF)'}
            />
          </Grid>

          {/* Show Title Checkbox */}
          <Grid item xs={12} sm={6} md={4}>
            <TooltipCheckbox
              label="Show Title"
              checked={Boolean(settings.title)}
              onChange={(checked) => onSettingsChange('title', checked)}
              tooltip={settingsDescriptions.title || 'Display the project title.'}
            />
          </Grid>

          {/* Custom Title Text Field (conditionally enabled) */}
          <Grid item xs={12} sm={6} md={8}> 
            <TooltipField
              label="Custom Title Text"
              value={settings.titleText || ''}
              onChange={(e) => onSettingsChange('titleText', e.target.value)}
              tooltip={settingsDescriptions.titleText || 'Set a custom title for the visualization.'}
              disabled={!settings.title}
              required={settings.title}
              error={showTitleError}
              helperText={showTitleError ? 'Required when title is enabled' : ''}
            />
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default GourceGeneralVideoTab; 