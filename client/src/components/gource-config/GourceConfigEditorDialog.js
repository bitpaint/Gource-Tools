import React, { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Grid,
  Paper,
  IconButton,
  TextField,
  Box,
  AppBar,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// Import tab components
import GourceGeneralVideoTab from './tabs/GourceGeneralVideoTab';
import GourceTimelineSpeedTab from './tabs/GourceTimelineSpeedTab';
import GourceVisualStyleTab from './tabs/GourceVisualStyleTab';
import GourceCameraNavTab from './tabs/GourceCameraNavTab';
import GourceUsersFilesTab from './tabs/GourceUsersFilesTab';
import GourceCaptionsOverlaysTab from './tabs/GourceCaptionsOverlaysTab';
import GourceAdvancedOutputTab from './tabs/GourceAdvancedOutputTab';
import GourceTabPanel from './GourceTabPanel';
import { defaultSettings } from '../../shared/gourceConfig';

// Define Presets
const presets = {
  default: {
    name: 'Default Settings',
    settings: { ...defaultSettings }
  },
  quick_overview: {
    name: 'Quick Overview (Fast)',
    settings: {
      secondsPerDay: 0.5,
      autoSkipSeconds: 0.05,
      timeScale: 1.5,
      framerate: 30,
      hide: ['date'],
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

// Helper function to reconstruct relative date string
const buildRelativeString = (number, unit) => {
  const num = number || 1;
  const u = unit || 'day';
  return `relative-${num}-${u}${num > 1 ? 's' : ''}`;
};

// Styled components (using a simple styling approach)
const StyledDialogTitle = ({ children, onClose, ...other }) => (
  <DialogTitle 
    sx={{ 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: (theme) => theme.spacing(1, 2)
    }} 
    {...other}
  >
    <Typography variant="h6">{children}</Typography>
    {onClose && (
      <IconButton onClick={onClose} size="small">
        <CloseIcon />
      </IconButton>
    )}
  </DialogTitle>
);

/**
 * Dialog component for creating and editing Gource configuration files
 */
const GourceConfigEditorDialog = ({
  open,
  onClose,
  onSave,
  currentConfig,
  setCurrentConfig,
  isEditing,
  savingConfig,
  settingsDescriptions
}) => {
  // Track the active tab
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [titleValidationFailed, setTitleValidationFailed] = useState(false);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Apply Preset Handler
  const handleApplyPreset = (presetKey) => {
    if (!presetKey || !presets[presetKey]) {
      setSelectedPreset('');
      return;
    }
    const preset = presets[presetKey];
    setSelectedPreset(presetKey);
    setCurrentConfig(prev => ({
      ...prev,
      // Merge preset settings with existing ones, preset values override
      settings: {
        ...prev.settings,
        ...preset.settings
      }
    }));
  };

  // Handle input changes - update currentConfig state
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    const settingValue = type === 'checkbox' ? checked : value;
    
    // Check if the field name contains a dot (nested setting)
    if (name.includes('.')) {
        const [parentKey, childKey] = name.split('.');
        setCurrentConfig(prevConfig => ({
            ...prevConfig,
            settings: {
                ...prevConfig.settings,
                [parentKey]: {
                    ...prevConfig.settings[parentKey],
                    [childKey]: settingValue
                }
            }
        }));
    } else {
        // Handle top-level fields (name, description) and settings fields
        if (name === 'name' || name === 'description') {
            setCurrentConfig(prevConfig => ({
                ...prevConfig,
                [name]: value
            }));
        } else {
             // Assume it's a setting if not name or description
            setCurrentConfig(prevConfig => ({
                ...prevConfig,
                settings: {
                    ...prevConfig.settings,
                    [name]: settingValue
                }
            }));
        }
    }
  };

  // Handle save with validation
  const handleSave = () => {
    setAttemptedSave(true);
    
    // Check if name is provided
    const isNameValid = Boolean(currentConfig.name);
    
    // Check if title is enabled but text is empty
    const isTitleValid = !(
      currentConfig.settings.title && 
      (!currentConfig.settings.titleText || currentConfig.settings.titleText.trim() === '')
    );
    
    setTitleValidationFailed(!isTitleValid);
    
    // If validation passes, save the profile
    if (isNameValid && isTitleValid) {
      onSave();
    } else if (!isTitleValid) {
      // If title validation fails, switch to the General & Video tab
      setActiveTab(0);
    }
  };

  // Internal settings change handler
  const handleInternalSettingsChange = (key, value) => {
    if (!currentConfig) return;

    let processedValue = value;
    if (typeof value === 'object' && value !== null && value.target) {
      processedValue = value.target.type === 'checkbox' ? value.target.checked : value.target.value;
    }

    // Create a mutable copy of the settings
    const settingsToUpdate = { ...currentConfig.settings };

    // Store the directly changed value first
    settingsToUpdate[key] = processedValue;

    // Clear title validation error when title is disabled or titleText is provided
    if (key === 'title' && processedValue === false) {
      setTitleValidationFailed(false);
    } else if (key === 'titleText' && processedValue && processedValue.trim() !== '') {
      setTitleValidationFailed(false);
    }

    // --- Centralized Date Logic --- 
    if (key === 'useRelativeStartDate') {
      const isChecked = processedValue;
      if (isChecked) {
        const num = settingsToUpdate.relativeStartDateNumber || 1;
        const unit = settingsToUpdate.relativeStartDateUnit || 'day';
        settingsToUpdate.startDate = buildRelativeString(num, unit);
      } else {
        settingsToUpdate.startDate = settingsToUpdate.startDateFixed || '';
      }
    } else if (key === 'relativeStartDateNumber' || key === 'relativeStartDateUnit') {
      if (settingsToUpdate.useRelativeStartDate) {
        const num = key === 'relativeStartDateNumber' ? processedValue : (settingsToUpdate.relativeStartDateNumber || 1);
        const unit = key === 'relativeStartDateUnit' ? processedValue : (settingsToUpdate.relativeStartDateUnit || 'day');
        settingsToUpdate.startDate = buildRelativeString(num, unit);
      }
    } else if (key === 'startDateFixed') {
      settingsToUpdate.startDate = processedValue;
      settingsToUpdate.useRelativeStartDate = false;
    } else if (key === 'startDate') {
       const { isRelative, number, unit } = parseRelativeDate(processedValue); 
       if (isRelative) {
           settingsToUpdate.useRelativeStartDate = true;
           settingsToUpdate.relativeStartDateNumber = number;
           settingsToUpdate.relativeStartDateUnit = unit;
       } else {
           settingsToUpdate.useRelativeStartDate = false;
           settingsToUpdate.startDateFixed = processedValue; 
       }
    }
    // --- End Centralized Date Logic ---

    setCurrentConfig({
      ...currentConfig,
      settings: settingsToUpdate,
    });
  };

  // Parse relative date string
  const parseRelativeDate = (relativeDateString) => {
    if (typeof relativeDateString !== 'string' || !relativeDateString.startsWith('relative-')) {
      return { isRelative: false, number: 1, unit: 'day' };
    }
    const parts = relativeDateString.match(/^relative-(\d+)-([a-zA-Z]+)s?$/);
    if (!parts || parts.length < 3) {
      return { isRelative: false, number: 1, unit: 'day' };
    }
    const number = parseInt(parts[1], 10);
    let unit = parts[2].toLowerCase();
    const validUnits = ['day', 'week', 'month', 'year'];
    if (unit.endsWith('s')) { 
        unit = unit.slice(0, -1);
    }
    if (!validUnits.includes(unit)) {
       unit = 'day';
    }
    
    return { isRelative: true, number: isNaN(number) ? 1 : number, unit };
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <StyledDialogTitle onClose={onClose}>
        {isEditing ? 'Edit' : 'Create'} Gource Configuration
      </StyledDialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {/* Left sidebar for tabs */}
          <Grid item xs={12} sm={3} md={2.5}>
            <Paper elevation={1} sx={{ height: '100%' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                aria-label="gource config settings tabs"
                orientation="vertical"
                variant="scrollable"
                scrollButtons="auto"
                sx={{ 
                  borderRight: 1, 
                  borderColor: 'divider',
                  height: '100%',
                  '& .MuiTab-root': {
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    py: 1.5
                  }
                }}
              >
                <Tab label="GENERAL & VIDEO" />
                <Tab label="TIMELINE & SPEED" />
                <Tab label="VISUAL STYLE" />
                <Tab label="CAMERA & NAVIGATION" />
                <Tab label="USERS & FILES" />
                <Tab label="CAPTIONS & OVERLAYS" />
                <Tab label="ADVANCED & OUTPUT" />
              </Tabs>
            </Paper>
          </Grid>
          
          {/* Right content area for tab panels */}
          <Grid item xs={12} sm={9} md={9.5}>
            {/* Tab Panels - Pass the renamed handler */} 
            <GourceTabPanel value={activeTab} index={0}>
              {/* Pass profile info and preset to the General tab */}
              <GourceGeneralVideoTab 
                settings={currentConfig.settings || {}} 
                onSettingsChange={handleInternalSettingsChange}
                settingsDescriptions={settingsDescriptions}
                profileName={currentConfig?.name || ''}
                profileDescription={currentConfig?.description || ''}
                onProfileInfoChange={handleInputChange}
                isSystemProfile={currentConfig?.isSystemProfile}
                selectedPreset={selectedPreset}
                onPresetChange={handleApplyPreset}
                presets={presets}
                showNameError={attemptedSave && !currentConfig?.name}
                showTitleError={titleValidationFailed}
                isEditing={isEditing}
              />
            </GourceTabPanel>
            
            <GourceTabPanel value={activeTab} index={1}>
              <GourceTimelineSpeedTab 
                settings={currentConfig.settings || {}} 
                onSettingsChange={handleInternalSettingsChange}
                settingsDescriptions={settingsDescriptions}
              />
            </GourceTabPanel>
            
            <GourceTabPanel value={activeTab} index={2}>
              <GourceVisualStyleTab 
                settings={currentConfig.settings || {}} 
                onSettingsChange={handleInternalSettingsChange}
                settingsDescriptions={settingsDescriptions}
              />
            </GourceTabPanel>
            
            <GourceTabPanel value={activeTab} index={3}>
              <GourceCameraNavTab 
                settings={currentConfig.settings || {}} 
                onSettingsChange={handleInternalSettingsChange}
                settingsDescriptions={settingsDescriptions}
              />
            </GourceTabPanel>

            <GourceTabPanel value={activeTab} index={4}>
              <GourceUsersFilesTab 
                settings={currentConfig.settings || {}} 
                onSettingsChange={handleInternalSettingsChange}
                settingsDescriptions={settingsDescriptions}
              />
            </GourceTabPanel>

            <GourceTabPanel value={activeTab} index={5}>
              <GourceCaptionsOverlaysTab 
                settings={currentConfig.settings || {}} 
                onSettingsChange={handleInternalSettingsChange}
                settingsDescriptions={settingsDescriptions}
              />
            </GourceTabPanel>

            <GourceTabPanel value={activeTab} index={6}>
              <GourceAdvancedOutputTab 
                settings={currentConfig.settings || {}} 
                onSettingsChange={handleInternalSettingsChange}
                settingsDescriptions={settingsDescriptions}
              />
            </GourceTabPanel>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={savingConfig}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={savingConfig || currentConfig?.isSystemProfile}
          startIcon={savingConfig ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {savingConfig ? 'Saving...' : (currentConfig?.isSystemProfile ? 'Cannot Save System Profile' : 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GourceConfigEditorDialog; 