import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Tooltip,
  IconButton,
  Popover,
  Typography
} from '@mui/material';
import { HelpOutline, ColorLens } from '@mui/icons-material';
import { SketchPicker } from 'react-color';

const ColorPickerField = ({ label, value, onChange, tooltip, disabled = false }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [tempColor, setTempColor] = useState(value || '#000000');

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChangeComplete = (color) => {
    setTempColor(color.hex);
    onChange(color.hex);
  };

  // Manual input change handler
  const handleInputChange = (e) => {
    const newColor = e.target.value;
    setTempColor(newColor);
    
    // Only update parent if it's a valid hex color
    if (/^#([0-9A-F]{3}){1,2}$/i.test(newColor)) {
      onChange(newColor);
    }
  };

  const open = Boolean(anchorEl);
  const colorPreview = {
    width: 20,
    height: 20,
    backgroundColor: value,
    borderRadius: '3px',
    border: '1px solid #ccc',
    display: 'inline-block',
    marginRight: 1
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        fullWidth
        label={label}
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Box sx={colorPreview} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={handleClick} size="small" disabled={disabled}>
                <ColorLens />
              </IconButton>
              {tooltip && (
                <Tooltip title={tooltip}>
                  <IconButton size="small" sx={{ ml: 0.5 }}>
                    <HelpOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </InputAdornment>
          ),
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 1 }}>
          <Typography variant="body2" gutterBottom>
            Sélectionner une couleur
          </Typography>
          <SketchPicker
            color={tempColor}
            onChangeComplete={handleChangeComplete}
            disableAlpha
          />
        </Box>
      </Popover>
    </Box>
  );
};

export default ColorPickerField; 