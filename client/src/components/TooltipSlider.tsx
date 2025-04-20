import React from 'react';
import {
  Box,
  Typography,
  Slider,
  Tooltip,
  IconButton,
  Grid,
  TextField,
  InputAdornment
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

const TooltipSlider = ({
  label,
  value,
  onChange,
  tooltip,
  min = 0,
  max = 100,
  step = 1,
  marks = [],
  unit = '',
  disabled = false
}) => {
  
  const handleSliderChange = (event, newValue) => {
    onChange(newValue);
  };

  const handleInputChange = (event) => {
    const newValue = parseFloat(event.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" id={`${label.replace(/\s+/g, '-').toLowerCase()}-slider`}>
              {label}
            </Typography>
            {tooltip && (
              <Tooltip title={tooltip}>
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <HelpOutline fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Slider
            value={typeof value === 'number' ? value : 0}
            onChange={handleSliderChange}
            aria-labelledby={`${label.replace(/\s+/g, '-').toLowerCase()}-slider`}
            valueLabelDisplay="auto"
            step={step}
            marks={marks}
            min={min}
            max={max}
            disabled={disabled}
            sx={{ mt: 1 }}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            value={value}
            onChange={handleInputChange}
            type="number"
            InputProps={{
              endAdornment: unit ? <InputAdornment position="end">{unit}</InputAdornment> : null,
              inputProps: { 
                min: min, 
                max: max, 
                step: step
              }
            }}
            size="small"
            disabled={disabled}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TooltipSlider; 