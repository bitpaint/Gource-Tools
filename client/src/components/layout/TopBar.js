import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton,
  Box,
  Link,
  Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import GitHubIcon from '@mui/icons-material/GitHub';

const TopBar = ({ drawerOpen, handleDrawerToggle }) => {
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
        height: '70px'
      }}
    >
      <Toolbar sx={{ height: '100%', minHeight: '70px' }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <img 
            src="/Gourcetools.png" 
            alt="Gource Tools Logo" 
            height="45" 
            style={{ marginRight: '15px' }} 
          />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
            Gource Tools
          </Typography>
        </Box>
        <Tooltip title="GitHub Repository">
          <Link 
            href="https://github.com/bitpaint/Gource-Tools"
            target="_blank" 
            rel="noopener noreferrer"
            color="inherit"
          >
            <IconButton color="inherit">
              <GitHubIcon />
            </IconButton>
          </Link>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar; 