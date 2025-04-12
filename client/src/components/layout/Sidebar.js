import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  useMediaQuery,
  useTheme,
  Toolbar,
  Typography
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import SettingsIcon from '@mui/icons-material/Settings';
import MovieIcon from '@mui/icons-material/Movie';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import TuneIcon from '@mui/icons-material/Tune';

const drawerWidth = 240;

const menuItems = [
  { text: 'Repositories', icon: <GitHubIcon />, path: '/repositories' },
  { text: 'Projects', icon: <FolderSpecialIcon />, path: '/projects' },
  { text: 'Gource Config Files', icon: <SettingsIcon />, path: '/render-profiles' },
  { text: 'Render', icon: <MovieIcon />, path: '/render' },
  { text: 'Exports', icon: <VideoLibraryIcon />, path: '/exports' },
  { text: 'Settings', icon: <TuneIcon />, path: '/settings' },
];

const Sidebar = ({ drawerOpen, handleDrawerToggle }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img 
            src="/Gourcetools.png" 
            alt="Gource Tools Logo" 
            width="100"
            style={{ margin: '10px 0' }}
          />
          <Typography 
            variant="subtitle2" 
            component="div" 
            align="center"
            sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 1 }}
          >
            v0.2a
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  handleDrawerToggle();
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path ? 'primary.main' : 'text.primary'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ mt: 'auto' }} />
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          © 2025 Gource Tools
        </Typography>
      </Box>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            marginTop: '70px',
            height: 'calc(100% - 70px)'
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            marginTop: '70px',
            height: 'calc(100% - 70px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.12)'
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar; 