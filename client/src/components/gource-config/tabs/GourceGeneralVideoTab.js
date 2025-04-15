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
import ColorPickerField from '../../ColorPickerField';
import TooltipField from '../../TooltipField';
import TooltipCheckbox from '../../TooltipCheckbox';

// Import utility functions
import { getCommonResolutions } from '../../../utils/gourceUtils';

/**
 * General & Video settings tab for Gource configuration
 */
const GourceGeneralVideoTab = ({ settings, onSettingsChange, settingsDescriptions }) => {
  const commonResolutions = getCommonResolutions();

  return (
    <>
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
              value={settings.resolution || '1920x1080'} // Provide default if undefined
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
          <TooltipField
            label="Framerate"
            type="number"
            value={settings.framerate || 60} // Provide default if undefined
            onChange={(value) => onSettingsChange('framerate', parseInt(value) || 60)}
            InputProps={{
              endAdornment: <InputAdornment position="end">fps</InputAdornment>,
            }}
            inputProps={{ min: 1, max: 120 }} // Adjust min/max as needed
            tooltip={settingsDescriptions.framerate || 'Frames per second for the output video (e.g., 30, 60)'}
          />
        </Grid>

        {/* Background Color Picker */}
        <Grid item xs={12} sm={6} md={4}>
          <ColorPickerField
            label="Background Color"
            value={settings.background || '#000000'} // Provide default if undefined
            onChange={(value) => onSettingsChange('background', value)}
            tooltip={settingsDescriptions.background || 'Background color in hex (e.g., #FFFFFF)'}
          />
        </Grid>

        {/* Show Title Checkbox */}
        <Grid item xs={12} sm={6} md={4}>
          <TooltipCheckbox
            label="Show Title"
            checked={Boolean(settings.title)} // Ensure it's a boolean
            onChange={(checked) => onSettingsChange('title', checked)}
            tooltip={settingsDescriptions.title || 'Display the project title.'}
          />
        </Grid>

        {/* Custom Title Text Field (conditionally enabled) */}
        <Grid item xs={12} sm={6} md={8}> 
          <TooltipField
            label="Custom Title Text"
            value={settings.titleText || ''} // Default to empty string
            onChange={(value) => onSettingsChange('titleText', value)}
            tooltip={settingsDescriptions.titleText || 'Set a custom title. If empty, the project name is used (if Show Title is checked).'}
            placeholder="Leave empty to use project name"
            disabled={!settings.title} // Disable if Show Title is unchecked
          />
        </Grid>

      </Grid>
    </>
  );
};

export default GourceGeneralVideoTab; 