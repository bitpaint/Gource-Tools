import React from 'react';
import {
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  IconButton
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

// Import custom components
import TooltipField from '../../TooltipField';
import TooltipSlider from '../../TooltipSlider';
import TooltipCheckbox from '../../TooltipCheckbox';

// Import utility functions
import { getCameraModes } from '../../../utils/gourceUtils'; // Assuming this utility exists

/**
 * Camera & Navigation settings tab for Gource configuration
 */
const GourceCameraNavTab = ({ settings, onSettingsChange, settingsDescriptions }) => {
  const cameraModes = getCameraModes();

  return (
    <>
      <Typography variant="body2" color="text.secondary" paragraph>
        Control how the camera moves and behaves during the visualization.
      </Typography>
      <Grid container spacing={3}>
        {/* Camera Mode Dropdown */}
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel id="camera-mode-label">Camera Mode</InputLabel>
            <Select
              labelId="camera-mode-label"
              id="cameraMode"
              value={settings.cameraMode || 'overview'} // Default to overview
              onChange={(e) => onSettingsChange('cameraMode', e.target.value)}
              label="Camera Mode"
              endAdornment={
                <InputAdornment position="end">
                  <Tooltip title={settingsDescriptions.cameraMode || 'Camera behavior (overview, track, follow)'}>
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

        {/* Disable Auto Rotate Checkbox */}
        <Grid item xs={12} sm={6} md={4}>
          <TooltipCheckbox
            label="Disable Auto Rotate"
            checked={Boolean(settings.disableAutoRotate)}
            onChange={(checked) => onSettingsChange('disableAutoRotate', checked)}
            tooltip={settingsDescriptions.disableAutoRotate || 'Stop the camera from automatically rotating.'}
          />
        </Grid>

        {/* Camera Padding Slider */}
        <Grid item xs={12} sm={6} md={4}>
          <TooltipSlider
            label="Camera Padding"
            value={settings.padding || 1.1}
            onChange={(value) => onSettingsChange('padding', value)}
            tooltip={settingsDescriptions.padding || 'Padding around the visualization edges (default: 1.1).'}
            step={0.1}
            marks={[{ value: 1, label: '1.0' }, { value: 1.5, label: '1.5' }, { value: 2, label: '2.0' }]}
            min={1.0}
            max={2.0}
          />
        </Grid>

         {/* Follow Specific User Field */}
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Follow Specific User"
            value={settings.followUser || ''}
            onChange={(value) => onSettingsChange('followUser', value)}
            tooltip={settingsDescriptions.followUser || 'Make the camera follow this specific username.'}
            placeholder="Enter username"
            disabled={settings.cameraMode !== 'follow' && !settings.followUsers } // Only relevant if cameraMode is 'follow' or followUsers is true?
          />
        </Grid>

        {/* Follow Active Users Checkbox */}
        <Grid item xs={12} sm={6} md={4}>
          <TooltipCheckbox
            label="Follow Active Users"
            checked={Boolean(settings.followUsers)} // Gource uses --follow-user flag without value usually
            onChange={(checked) => onSettingsChange('followUsers', checked)}
            tooltip={settingsDescriptions.followUsers || 'Camera automatically follows active users.'}
            // Consider disabling if a specific user is entered in followUser?
          />
        </Grid>

        {/* Disable Input Checkbox */}
        <Grid item xs={12} sm={6} md={4}>
          <TooltipCheckbox
            label="Disable Input Controls"
            checked={Boolean(settings.disableInput)}
            onChange={(checked) => onSettingsChange('disableInput', checked)}
            tooltip={settingsDescriptions.disableInput || 'Disable mouse and keyboard controls during playback.'}
          />
        </Grid>

         {/* Elasticity Slider (Moved from Visualization for now) */}
         {/* Consider if this fits better here or under a potential 'Physics' tab */}
         <Grid item xs={12} sm={6} md={4}>
           <TooltipSlider
             label="Elasticity"
             value={settings.elasticity || 0.3}
             onChange={(value) => onSettingsChange('elasticity', value)}
             tooltip={settingsDescriptions.elasticity || 'Elasticity of connections (0.0 to 1.0).'}
             step={0.05}
             marks
             min={0.0}
             max={1.0}
           />
         </Grid>

      </Grid>
    </>
  );
};

export default GourceCameraNavTab; 