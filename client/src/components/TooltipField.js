import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Tooltip,
  IconButton
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

const TooltipField = ({ 
  label, 
  value, 
  onChange, 
  tooltip, 
  type = 'text',
  placeholder = '',
  multiline = false,
  rows = 1,
  InputProps = {},
  inputProps = {},
  disabled = false
}) => {
  
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        fullWidth
        label={label}
        value={value || ''}
        onChange={handleChange}
        type={type}
        placeholder={placeholder}
        multiline={multiline}
        rows={rows}
        disabled={disabled}
        inputProps={inputProps}
        InputProps={{
          ...InputProps,
          endAdornment: (
            <InputAdornment position="end">
              {tooltip && (
                <Tooltip title={tooltip}>
                  <IconButton size="small">
                    <HelpOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {InputProps.endAdornment}
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default TooltipField; 