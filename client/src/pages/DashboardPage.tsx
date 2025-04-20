import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Divider,
  Button
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { repositoriesApi, projectsApi, rendersApi } from '../api/api';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    repositories: [],
    projects: [],
    renders: []
  });
  const [chartData, setChartData] = useState({
    reposByType: [],
    rendersByStatus: [],
    projectActivity: []
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fallback à l'approche originale si l'API des statistiques échoue
      try {
        // Tentative d'utiliser la nouvelle API de statistiques
        const [reposRes, rendersRes, statsRes] = await Promise.all([
          repositoriesApi.getAll(),
          rendersApi.getAll(),
          repositoriesApi.getStats()
        ]);
        
        // Set raw data
        setStats({
          repositories: reposRes.data,
          renders: rendersRes.data,
          stats: statsRes.data
        });
        
        // Process data for charts based on the new stats API
        prepareChartData(statsRes.data, rendersRes.data);
      } catch (statsError) {
        console.warn('Stats API not available, falling back to basic data:', statsError);
        
        // Fallback: charger les données de base
        const [reposRes, projectsRes, rendersRes] = await Promise.all([
          repositoriesApi.getAll(),
          projectsApi.getAll(),
          rendersApi.getAll()
        ]);
        
        // Set raw data without stats
        setStats({
          repositories: reposRes.data,
          projects: projectsRes.data,
          renders: rendersRes.data
        });
        
        // Use original data processing method
        const reposByType = reposRes.data.reduce((acc, repo) => {
          const type = getRepositoryType(repo.url);
          const existingType = acc.find(item => item.name === type);
          
          if (existingType) {
            existingType.value += 1;
          } else {
            acc.push({ name: type, value: 1 });
          }
          
          return acc;
        }, []);
        
        // Group renders by status
        const rendersByStatus = rendersRes.data.reduce((acc, render) => {
          const existingStatus = acc.find(item => item.name === render.status);
          
          if (existingStatus) {
            existingStatus.value += 1;
          } else {
            acc.push({ name: render.status, value: 1 });
          }
          
          return acc;
        }, []);
        
        // Calculate project activity (number of renders per project)
        const projectActivity = projectsRes.data.map(project => {
          const projectRenders = rendersRes.data.filter(render => 
            render.projectId === project.id
          ).length;
          
          return {
            name: project.name,
            renders: projectRenders
          };
        }).sort((a, b) => b.renders - a.renders).slice(0, 5); // Top 5 most active
        
        setChartData({
          reposByType,
          rendersByStatus,
          projectActivity
        });
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const prepareChartData = (stats, renders) => {
    // Convert repository types to chart format
    const reposByType = Object.entries(stats.byType).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
      value: count
    }));
    
    // Group renders by status
    const rendersByStatus = renders.reduce((acc, render) => {
      const existingStatus = acc.find(item => item.name === render.status);
      
      if (existingStatus) {
        existingStatus.value += 1;
      } else {
        acc.push({ name: render.status, value: 1 });
      }
      
      return acc;
    }, []);
    
    // Use project activity from stats
    const projectActivity = stats.activity.rendersByProject
      .slice(0, 5) // Top 5 most active
      .map(project => ({
        name: project.name,
        renders: project.renderCount
      }));
    
    setChartData({
      reposByType,
      rendersByStatus,
      projectActivity
    });
  };
  
  // Helper function for repository type
  const getRepositoryType = (url) => {
    if (!url) return 'Unknown';
    if (url.includes('github.com')) return 'Github';
    if (url.includes('gitlab.com')) return 'Gitlab';
    if (url.includes('bitbucket.org')) return 'Bitbucket';
    if (url.startsWith('file://') || url.startsWith('/') || /^[A-Z]:\\/.test(url)) return 'Local';
    return 'Other';
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {stats.repositories?.length || 0}
              </Typography>
              <Typography color="textSecondary">
                Repositories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {stats.stats?.activity?.totalCommits || 
                 stats.repositories?.reduce((sum, repo) => sum + (repo.stats?.totalCommits || 0), 0) || 
                 0}
              </Typography>
              <Typography color="textSecondary">
                Total Commits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {stats.stats?.projectUsage?.reduce((sum, repo) => sum + repo.projectCount, 0) || 
                 stats.projects?.length || 
                 0}
              </Typography>
              <Typography color="textSecondary">
                Projects
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {stats.renders?.length || 0}
              </Typography>
              <Typography color="textSecondary">
                Total Renders
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3}>
        {/* Repository Types */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Repositories by Type
            </Typography>
            <Box height={300} display="flex" justifyContent="center" alignItems="center">
              {chartData.reposByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.reposByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.reposByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography>No repository data available</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Render Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Renders by Status
            </Typography>
            <Box height={300} display="flex" justifyContent="center" alignItems="center">
              {chartData.rendersByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.rendersByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.rendersByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography>No render data available</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Project Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Most Active Projects
            </Typography>
            <Box height={300} display="flex" justifyContent="center" alignItems="center">
              {chartData.projectActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.projectActivity}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="renders" fill="#8884d8" name="Number of Renders" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography>No project activity data available</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Quick Actions */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/repositories')}
            >
              Add Repository
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/projects')}
            >
              Create Project
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/render')}
            >
              Start New Render
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default DashboardPage; 