import React, { ChangeEvent } from 'react';
import {
  Grid,
  Typography,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';

// Import custom components
import TooltipField from '../../TooltipField';
import TooltipSlider from '../../TooltipSlider';
import TooltipCheckbox from '../../TooltipCheckbox';

// Define the structure for settings in this tab
interface TimelineSpeedSettings {
  startDate?: string | null;
  stopDate?: string | null;
  secondsPerDay?: number | string;
  autoSkipSeconds?: number | string;
  disableAutoSkip?: boolean;
  timeScale?: number | string;
  realtime?: boolean;
  noTimeTravel?: boolean;
  startPosition?: string;
  stopPosition?: string;
  stopAtTime?: number | string;
  loopDelay?: number | string;
  useRelativeStartDate?: boolean;
  startDateFixed?: string | null; // UI state for fixed date input
  relativeStartDateNumber?: number;
  relativeStartDateUnit?: string;
}

// Define the props for the component
interface GourceTimelineSpeedTabProps {
  settings: TimelineSpeedSettings;
  onSettingsChange: (key: keyof TimelineSpeedSettings | string, value: any) => void;
  settingsDescriptions: Record<string, string>;
}

// Define Time Units for the new selector
const timeUnits = [
  { value: 'day', label: 'Day(s)' },
  { value: 'week', label: 'Week(s)' },
  { value: 'month', label: 'Month(s)' },
  { value: 'year', label: 'Year(s)' },
];

// Helper function to parse the relative string into number and unit
const parseRelativeDate = (relativeString: string | null | undefined): { number: number, unit: string } => {
  if (typeof relativeString !== 'string' || !relativeString.startsWith('relative-')) {
    return { number: 1, unit: 'day' }; // Default values
  }
  const match = relativeString.match(/^relative-(\d+)-?([a-z]+)s?$/i);
  if (match && match[1] && match[2]) {
    let unit = match[2].toLowerCase();
    if (unit.endsWith('s') && unit.length > 1) {
      unit = unit.slice(0, -1);
    }
    if (!timeUnits.some(tu => tu.value === unit)) {
      unit = 'day';
    }
    return { number: parseInt(match[1], 10), unit: unit };
  }
  // Fallback for older formats or if parsing fails
  return { number: 1, unit: 'day' };
};

/**
 * Timeline & Speed settings tab for Gource configuration
 */
const GourceTimelineSpeedTab: React.FC<GourceTimelineSpeedTabProps> = ({
  settings,
  onSettingsChange,
  settingsDescriptions
}) => {

  const safeSettings = settings || {};
  const { number: currentNumber, unit: currentUnit } = parseRelativeDate(
    safeSettings.useRelativeStartDate ? safeSettings.startDate : ''
  );

  // Helper function for handling numeric inputs
  const handleNumericChange = (field: keyof TimelineSpeedSettings, value: string, defaultValue: number, isFloat = false) => {
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

  // Simplified handlers - Just call onSettingsChange
  const handleFixedStartDateChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Pass the key 'startDateFixed' so the parent handler knows it's the fixed input
    onSettingsChange('startDateFixed', event.target.value);
  };

  const handleRelativeDateToggle = (event: ChangeEvent<HTMLInputElement>) => {
    onSettingsChange('useRelativeStartDate', event.target.checked);
  };

  const handleRelativeNumberChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const number = Math.max(1, parseInt(event.target.value, 10) || 1);
    onSettingsChange('relativeStartDateNumber', number);
  };

  const handleRelativeUnitChange = (event: ChangeEvent<{ name?: string | undefined; value: unknown }>) => {
    onSettingsChange('relativeStartDateUnit', event.target.value as string);
  };

  return (
    <>
      <Typography variant="body2" color="text.secondary" paragraph>
        Control the playback speed, time progression, and date range of the visualization.
      </Typography>

      <Typography variant="h6" gutterBottom>Date Range</Typography>
      <Grid container spacing={2} alignItems="flex-start">
        <Grid item xs={12} md={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(safeSettings.useRelativeStartDate)}
                onChange={handleRelativeDateToggle}
              />
            }
            label="Use Relative Start Date"
            sx={{ mt: 4 }}
          />
        </Grid>

        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            {safeSettings.useRelativeStartDate ? (
              <>
                <Grid item xs={6} sm={4}>
                  <TooltipField
                    label="Number"
                    type="number"
                    value={safeSettings.relativeStartDateNumber !== undefined ? safeSettings.relativeStartDateNumber : currentNumber}
                    onChange={handleRelativeNumberChange}
                    tooltip="Enter the number of units ago"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="relative-unit-label">Unit</InputLabel>
                    <Select
                      labelId="relative-unit-label"
                      id="relativeStartDateUnit"
                      name="relativeStartDateUnit"
                      value={safeSettings.relativeStartDateUnit !== undefined ? safeSettings.relativeStartDateUnit : currentUnit}
                      onChange={handleRelativeUnitChange as any} // Cast to any to bypass complex Select onChange type
                      label="Unit"
                    >
                      {timeUnits.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={0} sm={4}>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    from today
                  </Typography>
                </Grid>
              </>
            ) : (
              <Grid item xs={12} sm={8}>
                <TooltipField
                  label="Fixed Start Date"
                  type="date-text"
                  value={safeSettings.startDateFixed || ''}
                  onChange={handleFixedStartDateChange}
                  tooltip={settingsDescriptions.startDate || 'Set a fixed start date (YYYY-MM-DD).'}
                />
              </Grid>
            )}
          </Grid>
        </Grid>

        <Grid item xs={12} md={9} sx={{ ml: { md: '25%' } }}>
          <TooltipField
            label="Stop Date (Optional)"
            type="date-text"
            value={safeSettings.stopDate || ''}
            onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onSettingsChange('stopDate', e.target.value)}
            tooltip={settingsDescriptions.stopDate || 'Set a fixed stop date (YYYY-MM-DD). Leave empty to render until the end.'}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Speed & Flow</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Seconds Per Day"
            type="number"
            value={safeSettings.secondsPerDay !== undefined ? safeSettings.secondsPerDay : ''}
            onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleNumericChange('secondsPerDay', e.target.value, 0.1, true)}
            tooltip={settingsDescriptions.secondsPerDay || 'Number of seconds each day lasts.'}
            inputProps={{ min: 0.1, step: 0.1 }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Auto Skip Seconds"
            type="number"
            value={safeSettings.autoSkipSeconds !== undefined ? safeSettings.autoSkipSeconds : ''}
            onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleNumericChange('autoSkipSeconds', e.target.value, 0.1, true)}
            tooltip={settingsDescriptions.autoSkipSeconds || 'Skip inactivity longer than this (seconds).'}
            inputProps={{ min: 0, step: 0.1 }}
            disabled={Boolean(safeSettings.disableAutoSkip)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipCheckbox
            label="Disable Auto Skip"
            checked={Boolean(safeSettings.disableAutoSkip)}
            onChange={(checked: boolean) => onSettingsChange('disableAutoSkip', checked)}
            tooltip={settingsDescriptions.disableAutoSkip || 'Prevent automatically skipping inactivity.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipSlider
            label="Time Scale"
            value={typeof safeSettings.timeScale === 'string' ? parseFloat(safeSettings.timeScale) : safeSettings.timeScale || 1.0}
            onChange={(value: number | number[]) => onSettingsChange('timeScale', value)}
            tooltip={settingsDescriptions.timeScale || 'Adjust the overall speed of time.'}
            step={0.1}
            marks={[{ value: 0.5, label: '0.5x' }, { value: 1, label: '1x' }, { value: 2, label: '2x' }, { value: 5, label: '5x' }] as any}
            min={0.1}
            max={10}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipCheckbox
            label="Realtime Playback"
            checked={Boolean(safeSettings.realtime)}
            onChange={(checked: boolean) => onSettingsChange('realtime', checked)}
            tooltip={settingsDescriptions.realtime || 'Attempt to play back at realtime speed.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipCheckbox
            label="No Time Travel"
            checked={Boolean(safeSettings.noTimeTravel)}
            onChange={(checked: boolean) => onSettingsChange('noTimeTravel', checked)}
            tooltip={settingsDescriptions.noTimeTravel || 'Use last commit time if a commit is in the past.'}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Position & Loop</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Start Position"
            value={safeSettings.startPosition || ''}
            onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onSettingsChange('startPosition', e.target.value)}
            tooltip={settingsDescriptions.startPosition || "Start at a specific position (0.0-1.0 or 'random')."}
            placeholder="e.g., 0.0, 0.5, random"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Stop Position"
            value={safeSettings.stopPosition || ''}
            onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onSettingsChange('stopPosition', e.target.value)}
            tooltip={settingsDescriptions.stopPosition || 'Stop at a specific position (0.0-1.0).'}
            placeholder="e.g., 0.8, 1.0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Stop At Time (Seconds)"
            type="number"
            value={safeSettings.stopAtTime !== undefined ? safeSettings.stopAtTime : ''}
            onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleNumericChange('stopAtTime', e.target.value, 0, true)}
            tooltip={settingsDescriptions.stopAtTime || 'Stop rendering after a specific number of seconds (0 to disable).'}
            inputProps={{ min: 0, step: 1 }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Loop Delay (Seconds)"
            type="number"
            value={safeSettings.loopDelay !== undefined ? safeSettings.loopDelay : ''}
            onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleNumericChange('loopDelay', e.target.value, 0, true)}
            tooltip={settingsDescriptions.loopDelay || 'Delay between loops (seconds).'}
            inputProps={{ min: 0, step: 0.1 }}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default GourceTimelineSpeedTab; 