import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Snackbar
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { settingsApi } from '../api/api';

const SettingsPage = () => {
  const [githubToken, setGithubToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsApi.get();
      
      if (response.data && response.data.githubToken) {
        // Masquer le token pour des raisons de sécurité
        const maskedToken = response.data.githubToken 
          ? `${response.data.githubToken.substring(0, 4)}...${response.data.githubToken.substring(response.data.githubToken.length - 4)}` 
          : '';
        setGithubToken(maskedToken);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await settingsApi.update({
        githubToken
      });
      
      setSuccess(true);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccess(false);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Configure application settings
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            GitHub API Token
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure your GitHub Personal Access Token to avoid API rate limits.
            Generate a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">https://github.com/settings/tokens</a> with 'repo' scope.
          </Typography>
          
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <TextField
              fullWidth
              label="GitHub Token"
              variant="outlined"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              type="password"
              margin="normal"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              helperText="Your token will be stored securely and used for GitHub API calls"
            />
          )}
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={saving || loading}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Settings'}
          </Button>
        </CardActions>
      </Card>

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