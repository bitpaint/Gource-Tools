import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';

// Pages
import RepositoriesPage from './pages/RepositoriesPage';
import ProjectsPage from './pages/ProjectsPage';
import ConfigFilesPage from './pages/ConfigFilesPage';
import RenderPage from './pages/RenderPage';
import ExportsPage from './pages/ExportsPage';
import SettingsPage from './pages/SettingsPage';

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        },
      },
    },
  },
});

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <Router>
        <div style={{ display: 'flex', height: '100vh' }}>
          <TopBar drawerOpen={drawerOpen} handleDrawerToggle={handleDrawerToggle} />
          <Sidebar drawerOpen={drawerOpen} handleDrawerToggle={handleDrawerToggle} />
          <main style={{ 
            flexGrow: 1, 
            padding: '24px', 
            overflow: 'auto', 
            marginTop: '70px',
            marginLeft: '0px',
            backgroundColor: theme.palette.background.default,
            borderRadius: '8px 0 0 0',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            <Routes>
              <Route path="/" element={<RepositoriesPage />} />
              <Route path="/repositories" element={<RepositoriesPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/render-profiles" element={<ConfigFilesPage />} />
              <Route path="/render" element={<RenderPage />} />
              <Route path="/exports" element={<ExportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App; 