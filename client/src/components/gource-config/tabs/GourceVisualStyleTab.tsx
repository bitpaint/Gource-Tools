import React from 'react';
import {
  Grid,
  Typography
} from '@mui/material';

// Import custom components
import ColorPickerField from '../../ColorPickerField';
import TooltipField from '../../TooltipField';
import TooltipSlider from '../../TooltipSlider';
import TooltipCheckbox from '../../TooltipCheckbox';

/**
 * Visual Style settings tab for Gource configuration
 */
const GourceVisualStyleTab = ({ settings, onSettingsChange, settingsDescriptions }) => {
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
        Adjust fonts, colors, visual effects, and elements like the legend and connection lines.
      </Typography>

      {/* Fonts & Text Section */}
      <Typography variant="h6" gutterBottom>Fonts & Text</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Font File Path (.ttf, .otf)"
            value={settings.fontFile || ''}
            onChange={(e) => onSettingsChange('fontFile', e.target.value)}
            tooltip={settingsDescriptions.fontFile || 'Path to a .ttf or .otf font file.'}
            placeholder="Leave empty for default font"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipSlider
            label="Global Font Scale"
            value={settings.fontScale || 1.0}
            onChange={(value) => onSettingsChange('fontScale', value)}
            tooltip={settingsDescriptions.fontScale || 'Overall scale factor for text.'}
            step={0.1}
            marks={[{ value: 0.5, label: '0.5x' }, { value: 1, label: '1x' }, { value: 1.5, label: '1.5x' }, { value: 2, label: '2x' }]}
            min={0.5}
            max={2.5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Date Format"
            value={settings.dateFormat || ''}
            onChange={(e) => onSettingsChange('dateFormat', e.target.value)}
            tooltip={settingsDescriptions.dateFormat || 'Gource date format (strftime).'}
            placeholder="e.g., %Y-%m-%d"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Filename Time (Seconds)"
            type="number"
            value={settings.filenameTime !== undefined ? settings.filenameTime : 4.0}
            onChange={(e) => handleNumericChange('filenameTime', e, 4.0, true)}
            tooltip={settingsDescriptions.filenameTime || 'Duration filenames stay on screen.'}
            inputProps={{ min: 0, step: 0.1 }}
          />
        </Grid>
        {/* Individual Font Sizes (Can be added if needed, Gource might use fontScale more) */}
        {/* 
        <Grid item xs={12} sm={6} md={3}>
          <TooltipField label="Title/Date Font Size" ... />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TooltipField label="Filename Font Size" ... />
        </Grid> 
        <Grid item xs={12} sm={6} md={3}>
          <TooltipField label="Dirname Font Size" ... />
        </Grid> 
        <Grid item xs={12} sm={6} md={3}>
          <TooltipField label="User Font Size" ... />
        </Grid> 
        */}
      </Grid>

      {/* Colors Section */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Colors</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <ColorPickerField
            label="Default Font Color"
            value={settings.fontColor || '#FFFFFF'}
            onChange={(value) => onSettingsChange('fontColor', value)}
            tooltip={settingsDescriptions.fontColor || 'Color for date and title text.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ColorPickerField
            label="Directory Color"
            value={settings.dirColor || '#FFFFFF'}
            onChange={(value) => onSettingsChange('dirColor', value)}
            tooltip={settingsDescriptions.dirColor || 'Color for directory names.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ColorPickerField
            label="Filename Color"
            value={settings.filenameColor || '#FFFFFF'}
            onChange={(value) => onSettingsChange('filenameColor', value)}
            tooltip={settingsDescriptions.filenameColor || 'Color for filenames.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ColorPickerField
            label="Highlight Color"
            value={settings.highlightColor || '#FF0000'}
            onChange={(value) => onSettingsChange('highlightColor', value)}
            tooltip={settingsDescriptions.highlightColor || 'Color for highlighted users/dirs.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ColorPickerField
            label="Selection Color"
            value={settings.selectionColor || '#FFFF00'}
            onChange={(value) => onSettingsChange('selectionColor', value)}
            tooltip={settingsDescriptions.selectionColor || 'Color for selected items.'}
          />
        </Grid>
      </Grid>

      {/* Effects & Display Section */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Effects & Display Elements</Typography>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} sm={4} md={3}>
          <TooltipCheckbox
            label="Show Legend (Key)"
            checked={Boolean(settings.key)}
            onChange={(checked) => onSettingsChange('key', checked)}
            tooltip={settingsDescriptions.key || 'Display the file type legend.'}
          />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <TooltipCheckbox
            label="Show Connection Lines"
            checked={Boolean(settings.showLines)}
            onChange={(checked) => onSettingsChange('showLines', checked)}
            tooltip={settingsDescriptions.showLines || 'Show lines connecting users to files.'}
          />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <TooltipCheckbox
            label="Show Dates"
            checked={Boolean(settings.showDates)}
            onChange={(checked) => onSettingsChange('showDates', checked)}
            tooltip={settingsDescriptions.showDates || 'Display the current date.'}
          />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <TooltipCheckbox
            label="Swap Title & Date Position"
            checked={Boolean(settings.swapTitleDate)}
            onChange={(checked) => onSettingsChange('swapTitleDate', checked)}
            tooltip={settingsDescriptions.swapTitleDate || 'Swap the position of the title and date.'}
          />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <TooltipCheckbox
            label="Multi-Sampling (AA)"
            checked={Boolean(settings.multiSampling)}
            onChange={(checked) => onSettingsChange('multiSampling', checked)}
            tooltip={settingsDescriptions.multiSampling || 'Enable anti-aliasing for smoother edges.'}
          />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <TooltipCheckbox
            label="Enable Bloom Effect"
            checked={Boolean(settings.bloom)}
            onChange={(checked) => onSettingsChange('bloom', checked)}
            tooltip={settingsDescriptions.bloom || 'Add a bloom effect to bright elements.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TooltipSlider
            label="Bloom Intensity"
            value={settings.bloomIntensity || 0.4}
            onChange={(value) => onSettingsChange('bloomIntensity', value)}
            tooltip={settingsDescriptions.bloomIntensity || 'Intensity of the bloom effect.'}
            step={0.1}
            marks
            min={0.1}
            max={1.0}
            disabled={!settings.bloom}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TooltipSlider
            label="Bloom Multiplier"
            value={settings.bloomMultiplier || 0.7}
            onChange={(value) => onSettingsChange('bloomMultiplier', value)}
            tooltip={settingsDescriptions.bloomMultiplier || 'Multiplier for the bloom effect.'}
            step={0.1}
            marks
            min={0.1}
            max={1.5}
            disabled={!settings.bloom}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}> 
          <TooltipCheckbox
            label="Transparent Background"
            checked={Boolean(settings.transparent)}
            onChange={(checked) => onSettingsChange('transparent', checked)}
            tooltip={settingsDescriptions.transparent || 'Make the background transparent (for overlays).'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Directory Name Depth"
            type="number"
            value={settings.dirNameDepth !== undefined ? settings.dirNameDepth : ''}
            onChange={(e) => handleNumericChange('dirNameDepth', e, 0)}
            tooltip={settingsDescriptions.dirNameDepth || 'Draw dir names down to this depth (0=default).'}
            inputProps={{ min: 0 }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipSlider
            label="Directory Name Position"
            value={settings.dirNamePosition || 0.5}
            onChange={(value) => onSettingsChange('dirNamePosition', value)}
            tooltip={settingsDescriptions.dirNamePosition || 'Position of dir names along edge (0.0-1.0).'}
            step={0.1}
            marks
            min={0.0}
            max={1.0}
          />
        </Grid>
      </Grid>

      {/* Background & Logo Section */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Background & Logo</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TooltipField
            label="Background Image Path"
            value={settings.backgroundImage || ''}
            onChange={(e) => onSettingsChange('backgroundImage', e.target.value)}
            tooltip={settingsDescriptions.backgroundImage || 'Path to an image file for the background.'}
            placeholder="e.g., ./images/background.png"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TooltipField
            label="Logo Image Path"
            value={settings.logo || ''}
            onChange={(e) => onSettingsChange('logo', e.target.value)}
            tooltip={settingsDescriptions.logo || 'Path to an image file for the logo overlay.'}
            placeholder="e.g., ./images/logo.png"
          />
        </Grid>
      </Grid>
    </>
  );
};

export default GourceVisualStyleTab; 