import React from 'react';
import {
  Grid,
  Typography
} from '@mui/material';

// Import custom components
import TooltipField from '../../TooltipField';
import TooltipSlider from '../../TooltipSlider';
import TooltipCheckbox from '../../TooltipCheckbox';

/**
 * Users & Files settings tab for Gource configuration
 */
const GourceUsersFilesTab = ({ settings, onSettingsChange, settingsDescriptions }) => {
  // Helper function for handling numeric inputs
  const handleNumericChange = (field, value, defaultValue, isFloat = false) => {
    // If value is empty string and empty is allowed, use empty string
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
        Control the appearance, behavior, and filtering of users, files, and directories.
      </Typography>

      {/* User Appearance Section */}
      <Typography variant="h6" gutterBottom>User Appearance</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipSlider
            label="User Scale"
            value={settings.userScale || 1.0}
            onChange={(value) => onSettingsChange('userScale', value)}
            tooltip={settingsDescriptions.userScale || 'Relative size of user avatars.'}
            step={0.1}
            marks={[{ value: 0.5, label: '0.5x' }, { value: 1, label: '1x' }, { value: 1.5, label: '1.5x' }]}
            min={0.1}
            max={2.0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipCheckbox
            label="Use Avatar Image Directory"
            checked={Boolean(settings.useUserImageDir)}
            onChange={(checked) => onSettingsChange('useUserImageDir', checked)}
            tooltip={settingsDescriptions.useUserImageDir || 'Load avatars from ./avatars directory.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Default User Image Path"
            value={settings.defaultUserImage || ''}
            onChange={(e) => onSettingsChange('defaultUserImage', e.target.value)}
            tooltip={settingsDescriptions.defaultUserImage || 'Image to use if user avatar is missing.'}
            placeholder="e.g., ./images/default_avatar.png"
            disabled={!settings.useUserImageDir}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipCheckbox
            label="Fixed User Size"
            checked={Boolean(settings.fixedUserSize)}
            onChange={(checked) => onSettingsChange('fixedUserSize', checked)}
            tooltip={settingsDescriptions.fixedUserSize || 'Keep user avatars at a fixed size.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipCheckbox
            label="Colorize User Images"
            checked={Boolean(settings.colourImages)}
            onChange={(checked) => onSettingsChange('colourImages', checked)}
            tooltip={settingsDescriptions.colourImages || 'Apply user colors to their avatar images.'}
            disabled={!settings.useUserImageDir}
          />
        </Grid>
      </Grid>

      {/* User Behavior Section */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>User Behavior</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipSlider
            label="User Friction"
            value={settings.userFriction || 0.67}
            onChange={(value) => onSettingsChange('userFriction', value)}
            tooltip={settingsDescriptions.userFriction || 'How quickly users slow down (0.0-1.0).'}
            step={0.05}
            marks
            min={0.0}
            max={1.0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Max User Speed"
            type="number"
            value={settings.maxUserSpeed !== undefined ? settings.maxUserSpeed : 500}
            onChange={(e) => handleNumericChange('maxUserSpeed', e.target.value, 500)}
            tooltip={settingsDescriptions.maxUserSpeed || 'Maximum speed users can travel.'}
            inputProps={{ min: 1 }}
          />
        </Grid>
         <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Max User Count"
            type="number"
            value={settings.maxUserCount !== undefined ? settings.maxUserCount : ''}
            onChange={(e) => handleNumericChange('maxUserCount', e.target.value, 0)}
            tooltip={settingsDescriptions.maxUserCount || 'Limit the number of users shown (0 = no limit).'}
            inputProps={{ min: 0 }}
            helperText="0 for unlimited"
          />
        </Grid>
      </Grid>

      {/* User Filtering & Highlighting Section */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>User Filtering & Highlighting</Typography>
      <Grid container spacing={3}>
         <Grid item xs={12} sm={6} md={3}>
          <TooltipCheckbox
            label="Highlight Active Users"
            checked={Boolean(settings.highlightUsers)}
            onChange={(checked) => onSettingsChange('highlightUsers', checked)}
            tooltip={settingsDescriptions.highlightUsers || 'Highlight users during their activity.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TooltipField
            label="Highlight Specific User"
            value={settings.highlightUser || ''}
            onChange={(e) => onSettingsChange('highlightUser', e.target.value)}
            tooltip={settingsDescriptions.highlightUser || 'Highlight this specific username.'}
            placeholder="Enter username"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TooltipField
            label="Hide Specific Users"
            value={settings.hideUsers || ''}
            onChange={(e) => onSettingsChange('hideUsers', e.target.value)}
            tooltip={settingsDescriptions.hideUsers || 'Comma-separated list of usernames to hide.'}
            placeholder="user1,user2,user3"
          />
        </Grid>
         <Grid item xs={12} sm={6} md={3}>
          <TooltipField
            label="Filter Users (Regex)"
            value={settings.userShowFilter || ''}
            onChange={(e) => onSettingsChange('userShowFilter', e.target.value)}
            tooltip={settingsDescriptions.userShowFilter || 'Show only users matching this regex.'}
            placeholder="e.g., ^dev-"
          />
        </Grid>
      </Grid>

      {/* File & Directory Section */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Files & Directories</Typography>
      <Grid container spacing={3}>
         <Grid item xs={12} sm={6} md={3}>
          <TooltipCheckbox
            label="Hide Root Directory"
            checked={Boolean(settings.hideRoot)}
            onChange={(checked) => onSettingsChange('hideRoot', checked)}
            tooltip={settingsDescriptions.hideRoot || 'Hide the root node of the directory tree.'}
          />
        </Grid>
         <Grid item xs={12} sm={6} md={3}>
          {/* Empty space or potential future fileScale control */}
         </Grid>
         <Grid item xs={12} sm={6} md={3}>
          <TooltipField
            label="Max File Lag (Seconds)"
            type="number"
            value={settings.maxFilelag !== undefined ? settings.maxFilelag : ''}
            onChange={(e) => handleNumericChange('maxFilelag', e.target.value, 0.5, true)}
            tooltip={settingsDescriptions.maxFilelag || 'Max delay before files appear after commit.'}
            inputProps={{ min: 0, step: 0.1 }}
          />
        </Grid>
         <Grid item xs={12} sm={6} md={3}>
          <TooltipField
            label="Max Files"
            type="number"
            value={settings.maxFiles !== undefined ? settings.maxFiles : ''}
            onChange={(e) => handleNumericChange('maxFiles', e.target.value, 0)}
            tooltip={settingsDescriptions.maxFiles || 'Max number of files displayed (0 = unlimited).'}
            inputProps={{ min: 0 }}
            helperText="0 for unlimited"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TooltipField
            label="File Idle Time (Seconds)"
            type="number"
            value={settings.fileIdleTime !== undefined ? settings.fileIdleTime : ''}
            onChange={(e) => handleNumericChange('fileIdleTime', e.target.value, 0)}
            tooltip={settingsDescriptions.fileIdleTime || 'Time files stay after inactivity (0 = remove immediately).'}
            inputProps={{ min: 0 }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TooltipField
            label="File Idle Time At End (Seconds)"
            type="number"
            value={settings.fileIdleTimeAtEnd !== undefined ? settings.fileIdleTimeAtEnd : ''}
            onChange={(e) => handleNumericChange('fileIdleTimeAtEnd', e.target.value, 0)}
            tooltip={settingsDescriptions.fileIdleTimeAtEnd || 'Time files stay at the very end (0 = remove immediately).'}
            inputProps={{ min: 0 }}
          />
        </Grid>
         <Grid item xs={12} sm={6} md={3}>
          <TooltipCheckbox
            label="Show File Extensions Only"
            checked={Boolean(settings.fileExtensions)}
            onChange={(checked) => onSettingsChange('fileExtensions', checked)}
            tooltip={settingsDescriptions.fileExtensions || 'Display only file extensions.'}
          />
        </Grid>
         <Grid item xs={12} sm={6} md={3}>
          <TooltipCheckbox
            label="Filename Fallback (for Ext)"
            checked={Boolean(settings.fileExtensionFallback)}
            onChange={(checked) => onSettingsChange('fileExtensionFallback', checked)}
            tooltip={settingsDescriptions.fileExtensionFallback || 'Show full filename if extension is missing.'}
            disabled={!settings.fileExtensions}
          />
        </Grid>
         <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Hide Files (Regex)"
            value={settings.hideFilesRegex || ''} 
            onChange={(e) => onSettingsChange('hideFilesRegex', e.target.value)}
            tooltip={settingsDescriptions.hideFilesRegex || 'Hide files matching this regex pattern.'}
            placeholder="e.g., \\.log$"
          />
        </Grid>
         <Grid item xs={12} sm={6} md={4}>
           <TooltipField
             label="Filter Files (Regex)"
             value={settings.fileShowFilter || ''}
             onChange={(e) => onSettingsChange('fileShowFilter', e.target.value)}
             tooltip={settingsDescriptions.fileShowFilter || 'Show only files matching this regex.'}
             placeholder="e.g., src\\/.*\\.js$"
           />
         </Grid>
         <Grid item xs={12} sm={6} md={4}>
          <TooltipCheckbox
            label="Highlight Directories"
            checked={Boolean(settings.highlightDirs)}
            onChange={(checked) => onSettingsChange('highlightDirs', checked)}
            tooltip={settingsDescriptions.highlightDirs || 'Highlight the names of all directories.'}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default GourceUsersFilesTab; 