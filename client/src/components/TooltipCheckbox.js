import React from 'react';
import { 
  FormControlLabel, 
  Checkbox, 
  Box,
  Tooltip,
  IconButton
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

/**
 * A checkbox with a tooltip icon for additional information
 */
const TooltipCheckbox = ({ 
  label, 
  checked, 
  onChange, 
  tooltip = null,
  ...props
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            {...props}
          />
        }
        label={label}
      />
      {tooltip && (
        <Tooltip title={tooltip}>
          <IconButton size="small">
            <HelpOutline fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default TooltipCheckbox; 