import React from 'react';
import {
  Grid,
  Typography,
  TextField // Added for text area
} from '@mui/material';

// Import custom components
import TooltipField from '../../TooltipField';
import TooltipCheckbox from '../../TooltipCheckbox';

/**
 * Advanced & Output settings tab for Gource configuration
 */
const GourceAdvancedOutputTab = ({ settings, onSettingsChange, settingsDescriptions }) => {
  return (
    <>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure advanced display options, output settings, and pass extra arguments directly to Gource.
      </Typography>

      {/* Window & Display Section */}
      <Typography variant="h6" gutterBottom>Window & Display</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <TooltipCheckbox
            label="Fullscreen"
            checked={Boolean(settings.fullscreen)}
            onChange={(checked) => onSettingsChange('fullscreen', checked)}
            tooltip={settingsDescriptions.fullscreen || 'Run Gource in fullscreen mode.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TooltipField
            label="Screen Number (for Fullscreen)"
            type="number"
            value={settings.screenNum || 0}
            onChange={(value) => onSettingsChange('screenNum', parseInt(value) || 0)}
            tooltip={settingsDescriptions.screenNum || 'Screen number to use for fullscreen.'}
            inputProps={{ min: 0 }}
            disabled={!settings.fullscreen}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TooltipCheckbox
            label="Disable VSync"
            checked={Boolean(settings.noVsync)}
            onChange={(checked) => onSettingsChange('noVsync', checked)}
            tooltip={settingsDescriptions.noVsync || 'Disable vertical sync (may cause tearing).'}
          />
        </Grid>
         <Grid item xs={12} sm={6} md={3}>
           <TooltipCheckbox
             label="Frameless Window"
             checked={Boolean(settings.frameless)}
             onChange={(checked) => onSettingsChange('frameless', checked)}
             tooltip={settingsDescriptions.frameless || 'Run in a borderless window.'}
           />
         </Grid>
         <Grid item xs={12} sm={6} md={4}> 
           <TooltipField
             label="Window Position (XxY)"
             value={settings.windowPosition || ''}
             onChange={(value) => onSettingsChange('windowPosition', value)}
             tooltip={settingsDescriptions.windowPosition || 'Initial window position (e.g., 100x50).'}
             placeholder="e.g., 100x50"
           />
         </Grid>
      </Grid>

      {/* Output & Debug Section */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Output & Debug</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipCheckbox
            label="Disable Progress Bar"
            checked={Boolean(settings.disableProgress)}
            onChange={(checked) => onSettingsChange('disableProgress', checked)}
            tooltip={settingsDescriptions.disableProgress || 'Hide the progress bar during rendering.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={8}>
          <TooltipField
            label="Output Custom Log File Path"
            value={settings.outputCustomLog || ''}
            onChange={(value) => onSettingsChange('outputCustomLog', value)}
            tooltip={settingsDescriptions.outputCustomLog || 'Output a Gource custom log during processing.'}
            placeholder="e.g., ./temp/gource_debug.log"
          />
        </Grid>
      </Grid>

      {/* Miscellaneous & Advanced Section */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Miscellaneous & Advanced</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Hash Seed"
            value={settings.hashSeed || ''}
            onChange={(value) => onSettingsChange('hashSeed', value)}
            tooltip={settingsDescriptions.hashSeed || 'Seed for the layout hash function (string or number).'}
            placeholder="Leave empty for default"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Git Branch (Internal Gource Log)"
            value={settings.gitBranch || ''}
            onChange={(value) => onSettingsChange('gitBranch', value)}
            tooltip={settingsDescriptions.gitBranch || 'Specify branch if Gource generates its own log (limited use here).'}
            placeholder="e.g., main"
          />
        </Grid>
        <Grid item xs={12}>
          <TooltipField
            label="Extra Gource Arguments"
            multiline
            rows={3}
            value={settings.extraArgs || ''}
            onChange={(value) => onSettingsChange('extraArgs', value)}
            tooltip={settingsDescriptions.extraArgs || 'Pass additional raw arguments directly to Gource.'}
            placeholder="--some-flag --another-option value"
            fullWidth
          />
        </Grid>
      </Grid>
    </>
  );
};

export default GourceAdvancedOutputTab; 