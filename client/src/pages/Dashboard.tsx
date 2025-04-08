import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaGithub } from 'react-icons/fa';
import api from '../services/api';
import QuickStart from '../components/ui/QuickStart';
import { useGitHubToken } from '../components/ui/GitHubTokenContext';
import { useNotification } from '../components/ui/NotificationContext';

const Container = styled.div`
  width: 100%;
`;

const WelcomeText = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Title = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.xxlarge};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textLight};
  font-size: ${props => props.theme.typography.fontSize.medium};
`;

const DashboardGrid = styled.div`
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

const GithubWarningCard = styled.div`
  background-color: #f8f9fa;
  border-radius: ${props => props.theme.borderRadius.medium};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  border-left: 4px solid #6c757d;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const WarningIcon = styled.div`
  font-size: 24px;
  color: #6c757d;
`;

const WarningContent = styled.div`
  flex: 1;
`;

const WarningTitle = styled.h3`
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
  font-size: ${props => props.theme.typography.fontSize.medium};
  color: #333;
`;

const WarningText = styled.p`
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  color: ${props => props.theme.colors.textLight};
  font-size: ${props => props.theme.typography.fontSize.small};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const ConfigureButton = styled.button`
  background-color: #0366d6;
  color: white;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: none;
  border-radius: ${props => props.theme.borderRadius.small};
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #0353b4;
  }
`;

const SkipButton = styled.button`
  background-color: #f5f5f5;
  color: #333;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: none;
  border-radius: ${props => props.theme.borderRadius.small};
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #e5e5e5;
  }
`;

const Dashboard: React.FC = () => {
  // Local state to store data
  const [projects, setProjects] = useState<any[]>([]);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [renders, setRenders] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    projects: true,
    repositories: true,
    renders: true
  });
  
  const { hasToken, showTokenDialog } = useGitHubToken();
  const { addNotification } = useNotification();

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
        
        // Simulate loading renders (replace with actual API call when implemented)
        setTimeout(() => {
          setRenders([]);
          setLoading(prev => ({ ...prev, renders: false }));
        }, 500);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading({ projects: false, repositories: false, renders: false });
      }
    };

    fetchData();
  }, []);

  // Calculate statistics
  const projectCount = projects.length || 0;
  const repositoryCount = repositories.length || 0;
  const renderCount = renders.length || 0;

  // Function to dismiss token warning and continue
  const handleSkipToken = () => {
    addNotification({
      type: 'info',
      message: 'Using GitHub API without authentication (limited to 60 requests per hour)',
      duration: 5000
    });
    
    // Here you would set a state or localStorage flag to hide the warning
    // This is just a placeholder - implement based on your app's state management
    localStorage.setItem('skipGitHubTokenWarning', 'true');
    window.location.reload();
  };

  return (
    <Container>
      <WelcomeText>
        <Title>Dashboard</Title>
        <Subtitle>Welcome to Gource-Tools. Manage your projects and create Gource visualizations easily.</Subtitle>
      </WelcomeText>
      
      {!hasToken && !localStorage.getItem('skipGitHubTokenWarning') && (
        <GithubWarningCard>
          <WarningIcon>
            <FaGithub />
          </WarningIcon>
          <WarningContent>
            <WarningTitle>Enhance your GitHub experience</WarningTitle>
            <WarningText>
              For better performance with GitHub repositories, you can configure a personal access token.
              This will increase the API rate limit from 60 to 5,000 requests per hour.
            </WarningText>
            <ButtonGroup>
              <ConfigureButton onClick={showTokenDialog}>
                Configure GitHub Token
              </ConfigureButton>
              <SkipButton onClick={handleSkipToken}>
                Continue without token
              </SkipButton>
            </ButtonGroup>
          </WarningContent>
        </GithubWarningCard>
      )}
      
      <QuickStart 
        projectCount={projectCount}
        repositoryCount={repositoryCount}
        renderCount={renderCount}
      />
      
      <DashboardGrid>
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
            <StatsNumber>{renderCount}</StatsNumber>
            <StatsLabel>Generated visualizations</StatsLabel>
            {loading.renders && <LoadingIndicator>Loading...</LoadingIndicator>}
          </CardContent>
        </DashboardCard>
      </DashboardGrid>
    </Container>
  );
};

export default Dashboard; 