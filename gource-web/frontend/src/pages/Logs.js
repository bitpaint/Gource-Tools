import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import axios from 'axios';

function Logs() {
  const [logs, setLogs] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchRepositories();
    fetchLogs();
  }, []);

  const fetchRepositories = async () => {
    try {
      const response = await axios.get('/api/repositories');
      setRepositories(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des dépôts");
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      // Cette API n'est pas encore implémentée dans le backend
      // À implémenter: GET /api/logs
      const response = await axios.get('/api/logs');
      setLogs(response.data);
    } catch (err) {
      // On gère silencieusement cette erreur puisque l'API n'existe pas encore
      setLogs([]);
    }
  };

  const handleRepoSelect = (repoName) => {
    if (selectedRepos.includes(repoName)) {
      setSelectedRepos(selectedRepos.filter(repo => repo !== repoName));
    } else {
      setSelectedRepos([...selectedRepos, repoName]);
    }
  };

  const handleSelectAll = () => {
    if (selectedRepos.length === repositories.length) {
      setSelectedRepos([]);
    } else {
      setSelectedRepos([...repositories]);
    }
  };

  const generateLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/logs/generate', {
        repositories: selectedRepos.length > 0 ? selectedRepos : undefined
      });
      setSuccess("Logs générés avec succès");
      fetchLogs();
    } catch (err) {
      setError("Erreur lors de la génération des logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const combineLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/logs/combine');
      setSuccess("Logs combinés avec succès");
      fetchLogs();
    } catch (err) {
      setError("Erreur lors de la combinaison des logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestion des Logs
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sélection des dépôts
              </Typography>
              <Paper sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                <List>
                  <ListItem button onClick={handleSelectAll}>
                    <ListItemText 
                      primary={selectedRepos.length === repositories.length 
                        ? "Désélectionner tout" 
                        : "Sélectionner tout"} 
                    />
                  </ListItem>
                  <Divider />
                  {repositories.map((repo) => (
                    <ListItem 
                      key={repo} 
                      button 
                      selected={selectedRepos.includes(repo)}
                      onClick={() => handleRepoSelect(repo)}
                    >
                      <ListItemText primary={repo} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth
                onClick={generateLogs}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Générer les logs"}
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Logs disponibles
              </Typography>
              <Paper sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                <List>
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={log} />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="Aucun log disponible" />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                color="secondary" 
                fullWidth
                onClick={combineLogs}
                disabled={loading || logs.length < 2}
              >
                {loading ? <CircularProgress size={24} /> : "Combiner tous les logs"}
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Logs; 