import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../services/api';

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${props => props.theme.spacing.lg};
`;

const DashboardCard = styled.div`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.small};
`;

const CardTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSize.large};
  margin-bottom: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text};
`;

const CardContent = styled.div`
  color: ${props => props.theme.colors.text};
`;

const StatsNumber = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xxl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.dark};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const StatsLabel = styled.div`
  font-size: ${props => props.theme.typography.fontSize.small};
  color: ${props => props.theme.colors.textLight};
`;

const LoadingIndicator = styled.span`
  display: block;
  color: ${props => props.theme.colors.textLight};
  font-style: italic;
  font-size: ${props => props.theme.typography.fontSize.small};
  margin-top: ${props => props.theme.spacing.xs};
`;

const Dashboard: React.FC = () => {
  // Local state to store data
  const [projects, setProjects] = useState<any[]>([]);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    projects: true,
    repositories: true
  });

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load projects
        const projectsResponse = await api.projects.getAll();
        setProjects(projectsResponse.data);
        setLoading(prev => ({ ...prev, projects: false }));

        // Load repositories
        const repositoriesResponse = await api.repositories.getAll();
        setRepositories(repositoriesResponse.data);
        setLoading(prev => ({ ...prev, repositories: false }));
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading({ projects: false, repositories: false });
      }
    };

    fetchData();
  }, []);

  // Calculate statistics
  const projectCount = projects.length || 0;
  const repositoryCount = repositories.length || 0;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to Gource-Tools. Manage your projects and create Gource visualizations easily.</p>
      
      <DashboardContainer>
        <DashboardCard>
          <CardTitle>Projects</CardTitle>
          <CardContent>
            <StatsNumber>{projectCount}</StatsNumber>
            <StatsLabel>Created projects</StatsLabel>
            {loading.projects && <LoadingIndicator>Loading...</LoadingIndicator>}
          </CardContent>
        </DashboardCard>
        
        <DashboardCard>
          <CardTitle>Repositories</CardTitle>
          <CardContent>
            <StatsNumber>{repositoryCount}</StatsNumber>
            <StatsLabel>Configured repositories</StatsLabel>
            {loading.repositories && <LoadingIndicator>Loading...</LoadingIndicator>}
          </CardContent>
        </DashboardCard>
        
        <DashboardCard>
          <CardTitle>Renders</CardTitle>
          <CardContent>
            <StatsNumber>0</StatsNumber>
            <StatsLabel>Generated visualizations</StatsLabel>
          </CardContent>
        </DashboardCard>
        
        <DashboardCard>
          <CardTitle>Quick Start</CardTitle>
          <CardContent>
            {projectCount === 0 ? (
              <p>To get started, create a new project and add a Git repository to it.</p>
            ) : repositoryCount === 0 ? (
              <p>You have created {projectCount} project(s). Now add a Git repository to create visualizations.</p>
            ) : (
              <p>You have {projectCount} project(s) and {repositoryCount} repository(ies). You can now create Gource visualizations!</p>
            )}
          </CardContent>
        </DashboardCard>
      </DashboardContainer>
    </div>
  );
};

export default Dashboard; 