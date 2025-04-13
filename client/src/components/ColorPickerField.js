import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  InputAdornment, 
  IconButton,
  Tooltip,
  ClickAwayListener,
  Paper
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { ChromePicker } from 'react-color';

/**
 * A color picker field component that allows selecting colors with a color picker
 */
const ColorPickerField = ({ 
  label, 
  value, 
  onChange, 
  fullWidth = true, 
  tooltip = null
}) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);

  const handleClick = (event) => {
    setDisplayColorPicker(true);
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
  };

  const handleColorChange = (color) => {
    onChange(color.hex);
  };

  return (
    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', width: fullWidth ? '100%' : 'auto' }}>
      <TextField
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        fullWidth={fullWidth}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: value,
                  border: '1px solid rgba(0, 0, 0, 0.23)',
                  borderRadius: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.1)'
                  }
                }}
                onClick={handleClick}
              />
            </InputAdornment>
          ),
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
      />

      {displayColorPicker && (
        <ClickAwayListener onClickAway={handleClose}>
          <Box
            sx={{
              position: 'absolute',
              zIndex: 1500,
              top: '100%',
              left: 0,
              marginTop: '8px'
            }}
          >
            <Paper elevation={3} sx={{ borderRadius: 1, overflow: 'hidden' }}>
              <ChromePicker 
                color={value} 
                onChange={handleColorChange} 
                disableAlpha 
              />
            </Paper>
          </Box>
        </ClickAwayListener>
      )}
    </Box>
  );
};

export default ColorPickerField; 