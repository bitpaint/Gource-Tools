import React, { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

// Import NEW tab components (will be created)
import GourceGeneralVideoTab from './tabs/GourceGeneralVideoTab';
import GourceTimelineSpeedTab from './tabs/GourceTimelineSpeedTab';
import GourceVisualStyleTab from './tabs/GourceVisualStyleTab';
import GourceCameraNavTab from './tabs/GourceCameraNavTab';
import GourceUsersFilesTab from './tabs/GourceUsersFilesTab';
import GourceCaptionsOverlaysTab from './tabs/GourceCaptionsOverlaysTab';
import GourceAdvancedOutputTab from './tabs/GourceAdvancedOutputTab';
import GourceTabPanel from './GourceTabPanel';
import { defaultSettings } from '../../shared/gourceConfig'; // NEW PATH within src/

// Define Presets
const presets = {
  default: {
    name: 'Default Settings',
    settings: { ...defaultSettings } // Start with default Gource settings
  },
  quick_overview: {
    name: 'Quick Overview (Fast)',
    settings: {
      secondsPerDay: 0.5,
      autoSkipSeconds: 0.05,
      timeScale: 1.5,
      framerate: 30,
      hide: ['date'], // Example, adjust as needed
      bloomMultiplier: 1.1
    }
  },
  detailed_presentation: {
    name: 'Detailed Presentation (Slower)',
    settings: {
      secondsPerDay: 2,
      autoSkipSeconds: 0.5,
      timeScale: 1.0,
      framerate: 60,
      fontScale: 1.2,
      multiSampling: true,
      bloom: true,
      bloomIntensity: 0.5
    }
  },
  minimalist: {
    name: 'Minimalist',
    settings: {
      key: false,
      showDates: false,
      showLines: false,
      fontScale: 0.8,
      userScale: 0.8,
      background: '#111111'
    }
  }
};

// Helper function to reconstruct relative date string (ensure consistency)
const buildRelativeString = (number, unit) => {
  const num = number || 1;
  const u = unit || 'day';
  return `relative-${num}-${u}${num > 1 ? 's' : ''}`; // Basic pluralization, adjust if needed
};

/**
 * Dialog component for creating and editing Gource configuration files
 */
const GourceConfigEditorDialog = ({
  open,
  onClose,
  onSave,
  currentProfile,
  setCurrentProfile,
  isEditing,
  savingProfile,
  settingsDescriptions
}) => {
  // Track the active tab
  const [tabValue, setTabValue] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState(''); // State for preset selector

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Apply Preset Handler
  const handleApplyPreset = (presetKey) => {
    if (!presetKey || !presets[presetKey]) {
      setSelectedPreset('');
      return;
    }
    const preset = presets[presetKey];
    setSelectedPreset(presetKey);
    setCurrentProfile(prev => ({
      ...prev,
      // Merge preset settings with existing ones, preset values override
      settings: {
        ...prev.settings,
        ...preset.settings
      }
    }));
    // Optionally, show a toast notification
  };

  // Renamed internal settings change handler
  const handleInternalSettingsChange = (key, value) => {
    if (!currentProfile) return;

    let processedValue = value;
    if (typeof value === 'object' && value !== null && value.target) {
      processedValue = value.target.type === 'checkbox' ? value.target.checked : value.target.value;
    }

    // Create a mutable copy of the settings
    const settingsToUpdate = { ...currentProfile.settings };

    // Store the directly changed value first
    settingsToUpdate[key] = processedValue;

    // --- Centralized Date Logic --- 

    if (key === 'useRelativeStartDate') {
      const isChecked = processedValue; // The new state of the checkbox
      if (isChecked) {
        // Switching TO relative: reconstruct start date from relative parts
        const num = settingsToUpdate.relativeStartDateNumber || 1;
        const unit = settingsToUpdate.relativeStartDateUnit || 'day';
        settingsToUpdate.startDate = buildRelativeString(num, unit);
      } else {
        // Switching FROM relative: use the fixed date value
        settingsToUpdate.startDate = settingsToUpdate.startDateFixed || '';
      }
    } else if (key === 'relativeStartDateNumber' || key === 'relativeStartDateUnit') {
      // If relative number or unit changes, reconstruct the main startDate IF relative mode is active
      if (settingsToUpdate.useRelativeStartDate) {
        const num = key === 'relativeStartDateNumber' ? processedValue : (settingsToUpdate.relativeStartDateNumber || 1);
        const unit = key === 'relativeStartDateUnit' ? processedValue : (settingsToUpdate.relativeStartDateUnit || 'day');
        settingsToUpdate.startDate = buildRelativeString(num, unit);
      }
    } else if (key === 'startDateFixed') {
      // If the fixed date input is changed, ensure we are NOT in relative mode
      settingsToUpdate.startDate = processedValue; // Update main start date
      settingsToUpdate.useRelativeStartDate = false; // Uncheck the box
      // Optional: Reset relative values for cleanliness
      // settingsToUpdate.relativeStartDateNumber = 1;
      // settingsToUpdate.relativeStartDateUnit = 'day';
    } else if (key === 'startDate') {
       // If startDate is somehow changed directly (e.g., loading a profile),
       // try to sync the individual fields IF it's a relative date
       const { isRelative, number, unit } = parseRelativeDate(processedValue); 
       if (isRelative) {
           settingsToUpdate.useRelativeStartDate = true;
           settingsToUpdate.relativeStartDateNumber = number;
           settingsToUpdate.relativeStartDateUnit = unit;
           // Ensure fixed date isn't out of sync (though it's hidden)
           // settingsToUpdate.startDateFixed = ''; // Or keep last known value? Decide based on UX.
       } else {
           // If it's a fixed date string being set
           settingsToUpdate.useRelativeStartDate = false;
           settingsToUpdate.startDateFixed = processedValue; 
       }
    }
    // --- End Centralized Date Logic ---

    setCurrentProfile({
      ...currentProfile,
      settings: settingsToUpdate,
    });
  };

  // Make sure parseRelativeDate is available here if not imported globally
  // Add this inside the component or import it:
  const parseRelativeDate = (relativeDateString) => {
    if (typeof relativeDateString !== 'string' || !relativeDateString.startsWith('relative-')) {
      return { isRelative: false, number: 1, unit: 'day' };
    }
    const parts = relativeDateString.match(/^relative-(\d+)-([a-zA-Z]+)s?$/);
    if (!parts || parts.length < 3) {
      return { isRelative: false, number: 1, unit: 'day' }; // Invalid format
    }
    const number = parseInt(parts[1], 10);
    let unit = parts[2].toLowerCase();
    // Normalize unit (remove trailing 's') - check if valid
    const validUnits = ['day', 'week', 'month', 'year'];
    if (unit.endsWith('s')) { 
        unit = unit.slice(0, -1);
    }
    if (!validUnits.includes(unit)) {
       unit = 'day'; // Default to day if unit is invalid
    }
    
    return { isRelative: true, number: isNaN(number) ? 1 : number, unit };
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>{isEditing ? 'Edit Gource Config File' : 'Create Gource Config File'}</DialogTitle>
      {currentProfile.isSystemProfile && (
        <DialogContentText sx={{ px: 3, color: 'warning.main' }}>
          Note: System profiles cannot be fully edited or deleted. Changes might be limited.
        </DialogContentText>
      )}
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Config Name"
            type="text"
            fullWidth
            variant="outlined"
            value={currentProfile.name || ''}
            onChange={(e) => setCurrentProfile({...currentProfile, name: e.target.value})}
            required
            disabled={currentProfile.isSystemProfile} // Disable editing name for system profiles
            sx={{ mb: 2, mt: 1 }}
          />
          
          <TextField
            margin="dense"
            id="description"
            label="Description (optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={currentProfile.description || ''}
            onChange={(e) => setCurrentProfile({...currentProfile, description: e.target.value})}
            disabled={currentProfile.isSystemProfile} // Disable editing description for system profiles
            multiline
            rows={2}
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Preset Selector */}
        {!currentProfile.isSystemProfile && ( // Don't show presets for system profiles
          <Box sx={{ mb: 3 }}>
             <FormControl fullWidth variant="outlined">
               <InputLabel id="preset-select-label">Apply Preset (Optional)</InputLabel>
               <Select
                 labelId="preset-select-label"
                 id="preset-select"
                 value={selectedPreset}
                 onChange={(e) => handleApplyPreset(e.target.value)}
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
           </Box>
        )}
        
        <Typography variant="h6" gutterBottom>Config Settings</Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="gource config settings tabs" 
            variant="scrollable" 
            scrollButtons="auto"
          >
            <Tab label="General & Video" />
            <Tab label="Timeline & Speed" />
            <Tab label="Visual Style" />
            <Tab label="Camera & Navigation" />
            <Tab label="Users & Files" />
            <Tab label="Captions & Overlays" />
            <Tab label="Advanced & Output" />
          </Tabs>
        </Box>
        
        {/* Tab Panels - Pass the renamed handler */} 
        <GourceTabPanel value={tabValue} index={0}>
          <GourceGeneralVideoTab 
            settings={currentProfile.settings || {}} 
            onSettingsChange={handleInternalSettingsChange} // Use renamed handler
            settingsDescriptions={settingsDescriptions}
          />
        </GourceTabPanel>
        
        <GourceTabPanel value={tabValue} index={1}>
          <GourceTimelineSpeedTab 
             settings={currentProfile.settings || {}} 
             onSettingsChange={handleInternalSettingsChange} // Use renamed handler
             settingsDescriptions={settingsDescriptions}
          />
        </GourceTabPanel>
        
        <GourceTabPanel value={tabValue} index={2}>
          <GourceVisualStyleTab 
             settings={currentProfile.settings || {}} 
             onSettingsChange={handleInternalSettingsChange} // Use renamed handler
             settingsDescriptions={settingsDescriptions}
           />
        </GourceTabPanel>
        
        <GourceTabPanel value={tabValue} index={3}>
          <GourceCameraNavTab 
             settings={currentProfile.settings || {}} 
             onSettingsChange={handleInternalSettingsChange} // Use renamed handler
             settingsDescriptions={settingsDescriptions}
           />
        </GourceTabPanel>

        <GourceTabPanel value={tabValue} index={4}>
           <GourceUsersFilesTab 
             settings={currentProfile.settings || {}} 
             onSettingsChange={handleInternalSettingsChange} // Use renamed handler
             settingsDescriptions={settingsDescriptions}
           />
        </GourceTabPanel>

        <GourceTabPanel value={tabValue} index={5}>
           <GourceCaptionsOverlaysTab 
             settings={currentProfile.settings || {}} 
             onSettingsChange={handleInternalSettingsChange} // Use renamed handler
             settingsDescriptions={settingsDescriptions}
           />
        </GourceTabPanel>

        <GourceTabPanel value={tabValue} index={6}>
          <GourceAdvancedOutputTab 
             settings={currentProfile.settings || {}} 
             onSettingsChange={handleInternalSettingsChange} // Use renamed handler
             settingsDescriptions={settingsDescriptions}
           />
        </GourceTabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={savingProfile}>Cancel</Button>
        <Button 
          onClick={onSave} 
          variant="contained" 
          disabled={!currentProfile.name || savingProfile || currentProfile.isSystemProfile} // Disable save for system profiles directly
          startIcon={savingProfile ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {savingProfile ? 'Saving...' : (currentProfile.isSystemProfile ? 'Cannot Save System Profile' : 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GourceConfigEditorDialog; 