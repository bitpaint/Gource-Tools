import React from 'react';
import { Box } from '@mui/material';

/**
 * Tab panel component for Gource configuration tabs
 * Used to wrap each tab's content for showing/hiding based on selected tab
 */
const GourceTabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`gource-tabpanel-${index}`}
      aria-labelledby={`gource-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ 
          pt: 1,
          px: { xs: 1, sm: 2 },
          height: '100%',
          overflowY: 'auto'
        }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export default GourceTabPanel; 