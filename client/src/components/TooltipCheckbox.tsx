import React from 'react';
import {
  Box,
  FormControlLabel,
  Checkbox,
  Tooltip,
  IconButton
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

const TooltipCheckbox = ({
  label,
  checked,
  onChange,
  tooltip,
  disabled = false
}) => {
  
  const handleChange = (event) => {
    onChange(event.target.checked);
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
          />
        }
        label={label}
      />
      {tooltip && (
        <Tooltip title={tooltip}>
          <IconButton size="small" sx={{ ml: 0.5 }}>
            <HelpOutline fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default TooltipCheckbox; 