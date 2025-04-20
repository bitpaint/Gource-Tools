import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box,
  TextField,
  CircularProgress,
  Alert,
  CardContent,
  CardActions,
  Snackbar,
  Chip,
  Grid,
  Paper,
  Divider,
  Tooltip,
  Switch,
  FormControlLabel,
  IconButton,
  Popover
} from '@mui/material';
import { 
  Save as SaveIcon, 
  CheckCircle as CheckCircleIcon, 
  Error as ErrorIcon, 
  Help as HelpIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { settingsApi } from '../api/api';
import { green, red, orange, grey } from '@mui/material/colors';

// Define token status type
type TokenStatus = 'valid' | 'invalid' | 'missing' | 'unknown' | 'loading';

const SettingsPage = () => {
  const [githubToken, setGithubToken] = useState('');
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('loading');
  const [originalToken, setOriginalToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showFullToken, setShowFullToken] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInfoClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleInfoClose = () => {
    setAnchorEl(null);
  };

  const openInfo = Boolean(anchorEl);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsApi.get();
      
      if (response.data && response.data.githubToken) {
        // Store the real token value
        setOriginalToken(response.data.githubToken);
        
        // Determine if we should display masked or full token
        const tokenToDisplay = showFullToken 
          ? response.data.githubToken 
          : maskToken(response.data.githubToken);
        
        setGithubToken(tokenToDisplay);
        setTokenStatus(response.data.tokenStatus || 'unknown');
      } else {
        setGithubToken('');
        setTokenStatus('missing');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings. Please try again.');
      setTokenStatus('unknown');
    } finally {
      setLoading(false);
    }
  };

  const maskToken = (token: string): string => {
    if (!token) return '';
    if (token.length <= 8) return token; // Don't mask very short tokens
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setTokenStatus('loading');
      
      const response = await settingsApi.update({
        githubToken
      });
      
      if (response.data) {
        setTokenStatus(response.data.tokenStatus || 'unknown');
        setOriginalToken(githubToken);
        
        // Reset edit mode after saving
        setIsEditMode(false);
        
        // If token was deleted, make sure we don't show a masked version
        if (!githubToken) {
          setShowFullToken(false);
        }
      }
      
      setSuccess(true);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
      setTokenStatus('unknown');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEditMode = () => {
    if (isEditMode) {
      // Cancel edit - restore original token (masked or full based on current setting)
      const tokenToDisplay = showFullToken ? originalToken : maskToken(originalToken);
      setGithubToken(tokenToDisplay);
    } else {
      // Enter edit mode - show full token for editing
      setGithubToken(originalToken);
    }
    setIsEditMode(!isEditMode);
  };

  const handleToggleShowToken = () => {
    setShowFullToken(!showFullToken);
    
    // Update displayed token based on new visibility setting
    if (!showFullToken && !isEditMode) {
      setGithubToken(originalToken);
    } else if (showFullToken && !isEditMode) {
      setGithubToken(maskToken(originalToken));
    }
  };

  const handleClearToken = () => {
    setGithubToken('');
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  const getTokenStatusInfo = () => {
    switch (tokenStatus) {
      case 'valid':
        return {
          icon: <CheckCircleIcon sx={{ color: green[500] }} />,
          label: 'Valid',
          color: green[500],
          message: 'Your GitHub token is valid and ready for use.'
        };
      case 'invalid':
        return {
          icon: <ErrorIcon sx={{ color: red[500] }} />,
          label: 'Invalid',
          color: red[500],
          message: 'This GitHub token is invalid. Please check your token and try again.'
        };
      case 'missing':
        return {
          icon: <WarningIcon sx={{ color: orange[500] }} />,
          label: 'Missing',
          color: orange[500],
          message: 'No GitHub token configured. Some features may be limited by API rate limits.'
        };
      case 'loading':
        return {
          icon: <CircularProgress size={20} />,
          label: 'Checking',
          color: grey[500],
          message: 'Checking token status...'
        };
      default:
        return {
          icon: <HelpIcon sx={{ color: grey[500] }} />,
          label: 'Unknown',
          color: grey[500],
          message: 'Unable to determine token status'
        };
    }
  };

  const statusInfo = getTokenStatusInfo();

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Configure application settings for optimal performance
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="h6" component="h2" gutterBottom>
            GitHub API Token
          </Typography>
        </Box>
        
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" mb={1}>
                <Chip 
                  icon={statusInfo.icon} 
                  label={`Status: ${statusInfo.label}`} 
                  sx={{ 
                    bgcolor: `${statusInfo.color}20`, 
                    color: statusInfo.color,
                    fontWeight: 'bold'
                  }}
                />
                <Tooltip title={statusInfo.message}>
                  <InfoIcon sx={{ ml: 1, color: 'text.secondary', fontSize: 18 }} />
                </Tooltip>
              </Box>
              <Typography variant="body2" color="text.secondary" component="div">
                {statusInfo.message}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" mb={2}>
                Configure your GitHub Personal Access Token to avoid API rate limits.
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Button 
                    component="a" 
                    href="https://github.com/settings/tokens/new" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="small"
                    sx={{ 
                      mr: 1, 
                      bgcolor: 'background.paper', 
                      borderColor: 'primary.main',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                        color: 'white'
                      }
                    }}
                  >
                    Generate a token
                  </Button>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    with 'repo' scope
                  </Typography>
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={handleInfoClick}
                    aria-describedby="repo-scope-popover"
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                  <Popover
                    id="repo-scope-popover"
                    open={openInfo}
                    anchorEl={anchorEl}
                    onClose={handleInfoClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                  >
                    <Box p={2} width={350}>
                      <Typography variant="subtitle2" gutterBottom>Required Scope: repo</Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        When creating your GitHub token, make sure to select the "repo" scope as shown below:
                      </Typography>
                      <Box 
                        component="img" 
                        src="/images/repo-scope.png" 
                        alt="GitHub repo scope example" 
                        sx={{ 
                          width: '100%', 
                          border: '1px solid #ddd', 
                          borderRadius: 1 
                        }}
                      />
                    </Box>
                  </Popover>
                </Box>
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box mb={2}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={showFullToken} 
                      onChange={handleToggleShowToken}
                      disabled={isEditMode || loading}
                    />
                  }
                  label="Show full token"
                />
              </Box>
              
              {loading ? (
                <Box display="flex" alignItems="center">
                  <CircularProgress size={24} />
                  <Typography variant="body2" ml={2}>Loading settings...</Typography>
                </Box>
              ) : (
                <TextField
                  fullWidth
                  label="GitHub Token"
                  variant="outlined"
                  value={githubToken}
                  onChange={(e) => isEditMode && setGithubToken(e.target.value)}
                  type={showFullToken || isEditMode ? "text" : "password"}
                  margin="normal"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  helperText="Your token will be stored securely and used for GitHub API calls"
                  disabled={!isEditMode && !loading}
                  InputProps={{
                    endAdornment: isEditMode && (
                      <Tooltip title="Clear token">
                        <Button 
                          onClick={handleClearToken}
                          color="error"
                          startIcon={<DeleteIcon />}
                        >
                          Clear
                        </Button>
                      </Tooltip>
                    )
                  }}
                />
              )}
            </Grid>
          </Grid>
        </CardContent>
        
        <CardActions sx={{ p: 2, bgcolor: 'background.default', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            color={isEditMode ? "error" : "primary"}
            onClick={handleToggleEditMode}
            disabled={loading}
          >
            {isEditMode ? 'Cancel' : 'Edit Token'}
          </Button>
          
          {isEditMode && (
            <Button
              variant="contained"
              color="primary"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSaveSettings}
              disabled={saving || loading}
            >
              {saving ? 'Saving...' : 'Save Token'}
            </Button>
          )}
        </CardActions>
      </Paper>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        message="Settings saved successfully"
      />
    </Container>
  );
};

export default SettingsPage; 