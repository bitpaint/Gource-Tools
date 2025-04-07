import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  Box,
  Chip,
  LinearProgress,
  Paper
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import DescriptionIcon from '@mui/icons-material/Description';
import MovieIcon from '@mui/icons-material/Movie';
import FolderIcon from '@mui/icons-material/Folder';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    repositories: 0,
    logs: 0,
    renders: 0,
    loading: true
  });

  useEffect(() => {
    // Simuler le chargement des stats
    const fetchStats = async () => {
      try {
        const reposResponse = await axios.get('/api/repositories');
        
        // Idéalement, ces endpoints seraient aussi implémentés
        // const logsResponse = await axios.get('/api/logs');
        // const rendersResponse = await axios.get('/api/renders');
        
        setStats({
          repositories: reposResponse.data.length,
          logs: 0, // logsResponse.data.length,
          renders: 0, // rendersResponse.data.length,
          loading: false
        });
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques', error);
        setStats({
          repositories: 0,
          logs: 0,
          renders: 0,
          loading: false
        });
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Dépôts',
      count: stats.repositories,
      icon: <GitHubIcon fontSize="large" />,
      color: '#90caf9',
      path: '/repositories'
    },
    {
      title: 'Logs',
      count: stats.logs,
      icon: <DescriptionIcon fontSize="large" />,
      color: '#a5d6a7',
      path: '/logs'
    },
    {
      title: 'Rendus',
      count: stats.renders,
      icon: <MovieIcon fontSize="large" />,
      color: '#ffcc80',
      path: '/render'
    },
  ];

  const quickActions = [
    {
      title: 'Ajouter un dépôt',
      icon: <FolderIcon />,
      color: '#81c784',
      path: '/repositories'
    },
    {
      title: 'Générer des logs',
      icon: <DescriptionIcon />,
      color: '#64b5f6',
      path: '/logs'
    },
    {
      title: 'Visualiser',
      icon: <MovieIcon />,
      color: '#e57373',
      path: '/visualize'
    }
  ];

  if (stats.loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Tableau de bord
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((card) => (
          <Grid item xs={12} md={4} key={card.title}>
            <Card 
              sx={{ 
                minHeight: 150,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <CardActionArea 
                onClick={() => navigate(card.path)}
                sx={{ height: '100%' }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -35,
                    right: -35,
                    height: 120,
                    width: 120,
                    borderRadius: '50%',
                    backgroundColor: card.color,
                    opacity: 0.2,
                    zIndex: 0
                  }}
                />
                <CardContent sx={{ height: '100%', position: 'relative', zIndex: 1 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" component="div">
                      {card.title}
                    </Typography>
                    <Box sx={{ color: card.color }}>
                      {card.icon}
                    </Box>
                  </Box>
                  <Typography variant="h3" component="div" sx={{ mt: 3 }}>
                    {card.count}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" sx={{ mb: 2 }}>
        Actions rapides
      </Typography>
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2}>
          {quickActions.map((action) => (
            <Grid item key={action.title}>
              <Chip
                icon={action.icon}
                label={action.title}
                onClick={() => navigate(action.path)}
                sx={{ 
                  bgcolor: action.color, 
                  color: 'white',
                  '&:hover': {
                    bgcolor: action.color,
                    opacity: 0.9
                  }
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Typography variant="h5" sx={{ mb: 2 }}>
        Bienvenue sur Gource-Web
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" paragraph>
          Gource-Web est une interface moderne pour Gource, un outil de visualisation de l'historique des dépôts Git. 
          Il vous permet de facilement télécharger des dépôts, générer des logs, et créer des visualisations.
        </Typography>
        <Typography variant="body1">
          Commencez par ajouter un dépôt dans la section "Dépôts", puis générez les logs et créez votre première visualisation.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Dashboard; 