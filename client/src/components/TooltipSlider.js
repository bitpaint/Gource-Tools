import React from 'react';
import { 
  Box, 
  Typography, 
  Slider, 
  Tooltip,
  IconButton
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

/**
 * A slider with a tooltip icon for additional information
 */
const TooltipSlider = ({ 
  label, 
  value, 
  onChange, 
  tooltip = null,
  min = 0,
  max = 1,
  step = 0.1,
  marks = [],
  ...props
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography gutterBottom>{label}</Typography>
        {tooltip && (
          <Tooltip title={tooltip}>
            <IconButton size="small">
              <HelpOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Slider
        value={value}
        onChange={(e, newValue) => onChange(newValue)}
        valueLabelDisplay="auto"
        step={step}
        marks={marks}
        min={min}
        max={max}
        {...props}
      />
    </Box>
  );
};

export default TooltipSlider; 