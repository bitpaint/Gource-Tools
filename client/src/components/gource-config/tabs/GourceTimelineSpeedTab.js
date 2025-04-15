import React from 'react';
import {
  Grid,
  Typography,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  Box
} from '@mui/material';

// Import custom components
import TooltipField from '../../TooltipField';
import TooltipSlider from '../../TooltipSlider';
import TooltipCheckbox from '../../TooltipCheckbox';

// Define Time Units for the new selector
const timeUnits = [
  { value: 'day', label: 'Day(s)' },
  { value: 'week', label: 'Week(s)' },
  { value: 'month', label: 'Month(s)' },
  { value: 'year', label: 'Year(s)' },
];

// Helper function to parse the relative string into number and unit
const parseRelativeDate = (relativeString) => {
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
const GourceTimelineSpeedTab = ({ settings, onSettingsChange, settingsDescriptions }) => {

  const safeSettings = settings || {};
  const { number: currentNumber, unit: currentUnit } = parseRelativeDate(
    safeSettings.useRelativeStartDate ? safeSettings.startDate : ''
  );

  // Simplified handlers - Just call onSettingsChange
  const handleFixedStartDateChange = (event) => {
    // Pass the key 'startDateFixed' so the parent handler knows it's the fixed input
    onSettingsChange('startDateFixed', event.target.value);
  };

  const handleRelativeDateToggle = (event) => {
    onSettingsChange('useRelativeStartDate', event.target.checked);
  };

  const handleRelativeNumberChange = (event) => {
    const number = Math.max(1, parseInt(event.target.value, 10) || 1);
    onSettingsChange('relativeStartDateNumber', number);
  };

  const handleRelativeUnitChange = (event) => {
    onSettingsChange('relativeStartDateUnit', event.target.value);
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
                    fullWidth
                    variant="outlined"
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
                      onChange={handleRelativeUnitChange}
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
                <Grid item xs={0} sm={4} />
              </>
            ) : (
              <Grid item xs={12} sm={8}>
                <TooltipField
                  label="Fixed Start Date"
                  type="date"
                  value={safeSettings.startDateFixed || ''}
                  onChange={handleFixedStartDateChange}
                  tooltip={settingsDescriptions.startDate || 'Set a fixed start date (YYYY-MM-DD).'}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: { '::-webkit-calendar-picker-indicator': { filter: 'invert(0.8)', cursor: 'pointer' }, color: 'text.primary' } }}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
            )}
          </Grid>
        </Grid>

        <Grid item xs={12} md={9} sx={{ ml: { md: '25%' } }}>
          <TooltipField
            label="Stop Date (Optional)"
            type="date"
            value={safeSettings.stopDate || ''}
            onChange={(value) => onSettingsChange('stopDate', value)}
            tooltip={settingsDescriptions.stopDate || 'Set a fixed stop date (YYYY-MM-DD). Leave empty to render until the end.'}
            InputLabelProps={{ shrink: true }}
            InputProps={{ sx: { '::-webkit-calendar-picker-indicator': { filter: 'invert(0.8)', cursor: 'pointer' }, color: 'text.primary' } }}
            fullWidth
            variant="outlined"
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Speed & Flow</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Seconds Per Day"
            type="number"
            value={safeSettings.secondsPerDay || 1}
            onChange={(value) => onSettingsChange('secondsPerDay', parseFloat(value) || 1)}
            tooltip={settingsDescriptions.secondsPerDay || 'Number of seconds each day lasts.'}
            inputProps={{ min: 0.1, step: 0.1 }}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Auto Skip Seconds"
            type="number"
            value={safeSettings.autoSkipSeconds || 0.1}
            onChange={(value) => onSettingsChange('autoSkipSeconds', parseFloat(value) || 0.1)}
            tooltip={settingsDescriptions.autoSkipSeconds || 'Skip inactivity longer than this (seconds).'}
            inputProps={{ min: 0, step: 0.1 }}
            disabled={safeSettings.disableAutoSkip}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipCheckbox
            label="Disable Auto Skip"
            checked={Boolean(safeSettings.disableAutoSkip)}
            onChange={(checked) => onSettingsChange('disableAutoSkip', checked)}
            tooltip={settingsDescriptions.disableAutoSkip || 'Prevent automatically skipping inactivity.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipSlider
            label="Time Scale"
            value={safeSettings.timeScale || 1.0}
            onChange={(value) => onSettingsChange('timeScale', value)}
            tooltip={settingsDescriptions.timeScale || 'Adjust the overall speed of time.'}
            step={0.1}
            marks={[{ value: 0.5, label: '0.5x' }, { value: 1, label: '1x' }, { value: 2, label: '2x' }, { value: 5, label: '5x' }]}
            min={0.1}
            max={10}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipCheckbox
            label="Realtime Playback"
            checked={Boolean(safeSettings.realtime)}
            onChange={(checked) => onSettingsChange('realtime', checked)}
            tooltip={settingsDescriptions.realtime || 'Attempt to play back at realtime speed.'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipCheckbox
            label="No Time Travel"
            checked={Boolean(safeSettings.noTimeTravel)}
            onChange={(checked) => onSettingsChange('noTimeTravel', checked)}
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
            onChange={(value) => onSettingsChange('startPosition', value)}
            tooltip={settingsDescriptions.startPosition || "Start at a specific position (0.0-1.0 or 'random')."}
            placeholder="e.g., 0.0, 0.5, random"
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Stop Position"
            value={safeSettings.stopPosition || ''}
            onChange={(value) => onSettingsChange('stopPosition', value)}
            tooltip={settingsDescriptions.stopPosition || 'Stop at a specific position (0.0-1.0).'}
            placeholder="e.g., 0.8, 1.0"
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TooltipField
            label="Stop After Time (Seconds)"
            type="number"
            value={safeSettings.stopAtTime || 0}
            onChange={(value) => onSettingsChange('stopAtTime', parseInt(value) || 0)}
            tooltip={settingsDescriptions.stopAtTime || 'Stop simulation after X seconds.'}
            helperText="0 to disable"
            inputProps={{ min: 0 }}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <TooltipCheckbox
            label="Loop Visualization"
            checked={Boolean(safeSettings.loop)}
            onChange={(checked) => onSettingsChange('loop', checked)}
            tooltip={settingsDescriptions.loop || 'Loop the visualization when it ends.'}
          />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <TooltipField
            label="Loop Delay (Seconds)"
            type="number"
            value={safeSettings.loopDelaySeconds || 3}
            onChange={(value) => onSettingsChange('loopDelaySeconds', parseInt(value) || 3)}
            tooltip={settingsDescriptions.loopDelaySeconds || 'Pause duration before looping.'}
            inputProps={{ min: 0 }}
            disabled={!safeSettings.loop}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <TooltipCheckbox
            label="Stop At End"
            checked={Boolean(safeSettings.stopAtEnd)}
            onChange={(checked) => onSettingsChange('stopAtEnd', checked)}
            tooltip={settingsDescriptions.stopAtEnd || 'Stop simulation exactly at the end of the log.'}
          />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <TooltipCheckbox
            label="Don't Stop (Keep Rotating)"
            checked={Boolean(safeSettings.dontStop)}
            onChange={(checked) => onSettingsChange('dontStop', checked)}
            tooltip={settingsDescriptions.dontStop || 'Keep camera rotating after the log ends.'}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default GourceTimelineSpeedTab; 