import React from 'react';
import { 
  TextField, 
  InputAdornment, 
  IconButton,
  Tooltip
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

/**
 * A text field with a tooltip icon for additional information
 */
const TooltipField = ({ 
  label, 
  value, 
  onChange, 
  fullWidth = true, 
  tooltip = null,
  type = 'text',
  ...props
}) => {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth={fullWidth}
      type={type}
      InputProps={{
        endAdornment: tooltip && (
          <InputAdornment position="end">
            <Tooltip title={tooltip}>
              <IconButton size="small">
                <HelpOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        )
      }}
      {...props}
    />
  );
};

export default TooltipField; 