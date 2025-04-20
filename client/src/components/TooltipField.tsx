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
  disabled = false,
  InputLabelProps = {},
  helperText = ''
}) => {
  
  // Universal handler that works with all components
  const handleChange = (e) => {
    // Get the new value from the event
    const newValue = e.target.value;
    
    // Special handling for date-text type
    if (type === 'date-text') {
      // Only allow digits and hyphens
      let formattedValue = newValue.replace(/[^\d-]/g, '');
      
      // Auto-format as YYYY-MM-DD
      if (formattedValue.length > 0) {
        const digits = formattedValue.replace(/-/g, '');
        if (digits.length <= 4) {
          // Just the year part
          formattedValue = digits;
        } else if (digits.length <= 6) {
          // Year and month
          formattedValue = `${digits.substring(0, 4)}-${digits.substring(4)}`;
        } else {
          // Full date
          formattedValue = `${digits.substring(0, 4)}-${digits.substring(4, 6)}-${digits.substring(6, 8)}`;
        }
      }
      
      // Return the processed value
      onChange({
        target: {
          value: formattedValue
        }
      });
    } 
    // Special handling for number type - parse the value correctly
    else if (type === 'number') {
      // Simply pass the event - parent components should handle parsing themselves
      // This ensures all numeric fields work consistently across all tabs
      onChange(e);
    }
    else {
      // For all other fields, just pass the original event
      onChange(e);
    }
  };

  // Determine the actual input type
  // For our custom date implementation, use text input
  const actualType = type === 'date-text' ? 'text' : type;
  
  // Set appropriate placeholder for date fields
  const actualPlaceholder = type === 'date-text' ? 'YYYY-MM-DD' : placeholder;

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        fullWidth
        label={label}
        value={value !== undefined ? value : ''}
        onChange={handleChange}
        type={actualType}
        placeholder={actualPlaceholder}
        multiline={multiline}
        rows={rows}
        disabled={disabled}
        helperText={helperText}
        InputLabelProps={{
          shrink: type === 'date-text' ? true : undefined,
          ...InputLabelProps
        }}
        inputProps={{
          ...inputProps,
          maxLength: type === 'date-text' ? 10 : undefined
        }}
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