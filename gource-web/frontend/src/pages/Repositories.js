import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

const Repositories = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [addingRepo, setAddingRepo] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/repositories');
      setRepositories(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des dépôts', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors du chargement des dépôts',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewRepoUrl('');
  };

  const handleAddRepository = async () => {
    if (!newRepoUrl) return;

    setAddingRepo(true);
    try {
      await axios.post('/api/repositories', { url: newRepoUrl });
      await fetchRepositories();
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: 'Dépôt ajouté avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du dépôt', error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.response?.data?.error || 'Impossible d\'ajouter le dépôt'}`,
        severity: 'error'
      });
    } finally {
      setAddingRepo(false);
    }
  };

  const handleDeleteRepository = async (repoName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le dépôt ${repoName}?`)) {
      return;
    }

    try {
      await axios.delete(`/api/repositories/${repoName}`);
      await fetchRepositories();
      setSnackbar({
        open: true,
        message: 'Dépôt supprimé avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du dépôt', error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.response?.data?.error || 'Impossible de supprimer le dépôt'}`,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Dépôts
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Ajouter un dépôt
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : repositories.length === 0 ? (
          <Box my={4} textAlign="center">
            <Typography variant="body1" color="textSecondary" gutterBottom>
              Aucun dépôt n'a été ajouté
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              sx={{ mt: 2 }}
            >
              Ajouter votre premier dépôt
            </Button>
          </Box>
        ) : (
          <>
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button
                startIcon={<RefreshIcon />}
                onClick={fetchRepositories}
              >
                Actualiser
              </Button>
            </Box>
            <List>
              {repositories.map((repo, index) => (
                <React.Fragment key={repo}>
                  <ListItem>
                    <ListItemText
                      primary={repo}
                      secondary={
                        <Chip
                          label="Git"
                          size="small"
                          sx={{ bgcolor: '#e8eaf6', mr: 1 }}
                        />
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleDeleteRepository(repo)}
                      >
                        <DeleteIcon color="error" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < repositories.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </Paper>

      {/* Dialog pour ajouter un nouveau dépôt */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Ajouter un nouveau dépôt</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Entrez l'URL du dépôt Git que vous souhaitez ajouter.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="repo-url"
            label="URL du dépôt Git"
            type="url"
            fullWidth
            variant="outlined"
            value={newRepoUrl}
            onChange={(e) => setNewRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repository.git"
            disabled={addingRepo}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={addingRepo}>
            Annuler
          </Button>
          <Button 
            onClick={handleAddRepository} 
            disabled={!newRepoUrl || addingRepo}
            variant="contained"
            startIcon={addingRepo ? <CircularProgress size={20} /> : null}
          >
            {addingRepo ? 'Ajout en cours...' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Repositories; 