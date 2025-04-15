import React from 'react';
import {
  Grid,
  Typography
} from '@mui/material';

// Import custom components
import ColorPickerField from '../../ColorPickerField';
import TooltipField from '../../TooltipField';

/**
 * Captions & Overlays settings tab for Gource configuration
 * (Currently focuses on Captions)
 */
const GourceCaptionsOverlaysTab = ({ settings, onSettingsChange, settingsDescriptions }) => {
  const captionsEnabled = settings.captionFile && settings.captionFile.trim() !== '';

  // Helper function for handling numeric inputs
  const handleNumericChange = (field, value, defaultValue, isFloat = false) => {
    // Get value from event if needed
    if (value && value.target) {
      value = value.target.value;
    }

    // If value is empty and empty is allowed, use empty string
    if (value === '') {
      onSettingsChange(field, '');
      return;
    }
    
    // Parse the value as number (int or float)
    const parsedValue = isFloat ? parseFloat(value) : parseInt(value, 10);
    
    // Use defaultValue if parsing fails
    const finalValue = isNaN(parsedValue) ? defaultValue : parsedValue;
    onSettingsChange(field, finalValue);
  };

  return (
    <>
      <Typography variant="body2" color="text.secondary" paragraph>
        Display timed captions from a file during the visualization. Other overlay options (Logo, Background Image) are under the Visual Style tab.
      </Typography>

      <Typography variant="h6" gutterBottom>Captions</Typography>
      <Grid container spacing={3}>
        {/* Caption File Path */}
        <Grid item xs={12}>
          <TooltipField
            label="Caption File Path"
            value={settings.captionFile || ''}
            onChange={(e) => onSettingsChange('captionFile', e.target.value)}
            tooltip={settingsDescriptions.captionFile || 'Path to the caption file (.srt or Gource format).'}
            placeholder="e.g., ./data/captions.txt"
          />
        </Grid>

        {/* Caption Size */}
        <Grid item xs={12} sm={6} md={3}>
          <TooltipField
            label="Caption Font Size"
            type="number"
            value={settings.captionSize !== undefined ? settings.captionSize : 12}
            onChange={(e) => handleNumericChange('captionSize', e, 12)}
            tooltip={settingsDescriptions.captionSize || 'Font size for captions.'}
            inputProps={{ min: 6 }}
            disabled={!captionsEnabled}
          />
        </Grid>

        {/* Caption Color */}
        <Grid item xs={12} sm={6} md={3}>
          <ColorPickerField
            label="Caption Color"
            value={settings.captionColour || '#FFFFFF'}
            onChange={(value) => onSettingsChange('captionColour', value)}
            tooltip={settingsDescriptions.captionColour || 'Caption text color in hex.'}
            disabled={!captionsEnabled}
          />
        </Grid>

        {/* Caption Duration */}
        <Grid item xs={12} sm={6} md={3}>
          <TooltipField
            label="Caption Duration (Seconds)"
            type="number"
            value={settings.captionDuration !== undefined ? settings.captionDuration : 10.0}
            onChange={(e) => handleNumericChange('captionDuration', e, 10.0, true)}
            tooltip={settingsDescriptions.captionDuration || 'Default time captions stay on screen.'}
            inputProps={{ min: 0.1, step: 0.1 }}
            disabled={!captionsEnabled}
          />
        </Grid>

        {/* Caption Offset */}
        <Grid item xs={12} sm={6} md={3}>
          <TooltipField
            label="Caption Horizontal Offset"
            type="number"
            value={settings.captionOffset !== undefined ? settings.captionOffset : 0}
            onChange={(e) => handleNumericChange('captionOffset', e, 0)}
            tooltip={settingsDescriptions.captionOffset || 'Horizontal position offset for captions.'}
            disabled={!captionsEnabled}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default GourceCaptionsOverlaysTab; 