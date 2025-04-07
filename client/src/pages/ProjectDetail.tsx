import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useApi } from '../hooks/useApi';
import api from '../services/api';
import { useNotification } from '../components/ui/NotificationContext';

interface Project {
  id: string;
  name: string;
  description: string;
  last_modified: string;
}

interface Repository {
  id: string;
  name: string;
  url?: string;
  local_path?: string;
  branch?: string;
  last_updated: string;
}

const Container = styled.div`
  padding: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  margin: 0;
`;

const Description = styled.p`
  color: #666;
  margin-top: 0.5rem;
`;

const LastModified = styled.p`
  color: #888;
  font-size: 0.9rem;
  font-style: italic;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const Button = styled.button`
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
`;

const EditButton = styled(Button)`
  background-color: #ff9800;
  color: white;
  
  &:hover {
    background-color: #e68a00;
  }
`;

const GourceButton = styled(Button)`
  background-color: #2196f3;
  color: white;
  
  &:hover {
    background-color: #0b7dda;
  }
`;

const DeleteButton = styled(Button)`
  background-color: #f44336;
  color: white;
  
  &:hover {
    background-color: #d32f2f;
  }
`;

const BackButton = styled(Button)`
  background-color: #f5f5f5;
  color: #333;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const Section = styled.section`
  margin-top: 2rem;
`;

const SectionTitle = styled.h2`
  color: #444;
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const RepositoriesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
`;

const RepositoryCard = styled.div`
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const RepoName = styled.h3`
  margin: 0;
  color: #333;
`;

const RepoInfo = styled.p`
  margin: 0;
  color: #666;
  font-size: 0.9rem;
`;

const RepoActions = styled.div`
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const RepoButton = styled.button`
  padding: 0.5rem 0.7rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  background-color: #f5f5f5;
  color: #333;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const LoadingState = styled.div`
  padding: 2rem;
  text-align: center;
  color: #666;
  font-size: 1.1rem;
`;

const AddRepoButton = styled(Button)`
  background-color: #4caf50;
  color: white;
  margin-left: auto;
  display: flex;
  align-items: center;
  
  &:hover {
    background-color: #45a049;
  }
`;

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  // S'assurer que projectId n'est pas undefined
  const safeProjectId = projectId || '';
  
  // Définir les fonctions d'API de manière stable
  const getProject = useCallback(() => api.projects.getById(safeProjectId), [safeProjectId]);
  const getRepositories = useCallback(() => api.repositories.getAll(safeProjectId), [safeProjectId]);
  
  // Charger les détails du projet
  const [projectState, fetchProject] = useApi(
    getProject,
    true
  );
  
  // Charger les dépôts du projet
  const [repositoriesState, fetchRepositories] = useApi(
    getRepositories,
    true
  );
  
  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project and all its repositories?')) {
      return;
    }
    
    try {
      await api.projects.delete(safeProjectId);
      addNotification({
        type: 'success',
        message: 'Project successfully deleted'
      });
      navigate('/projects');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      addNotification({
        type: 'error',
        message: `Error during deletion: ${errorMessage}`
      });
    }
  };
  
  const handleEditProject = () => {
    navigate(`/projects/${safeProjectId}/edit`);
  };
  
  const handleGourceConfig = () => {
    navigate(`/projects/${safeProjectId}/gource`);
  };
  
  const handleAddRepository = () => {
    navigate(`/projects/${safeProjectId}/link-repositories`);
  };
  
  const handleEditRepository = (repoId: string) => {
    navigate(`/repositories/${repoId}/edit`);
  };
  
  const handleDeleteRepository = async (repoId: string) => {
    if (!window.confirm('Are you sure you want to delete this repository?')) {
      return;
    }
    
    try {
      await api.repositories.delete(repoId);
      addNotification({
        type: 'success',
        message: 'Repository successfully deleted'
      });
      fetchRepositories();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      addNotification({
        type: 'error',
        message: `Error during deletion: ${errorMessage}`
      });
    }
  };
  
  const handleSyncRepository = async (repoId: string) => {
    try {
      await api.repositories.sync(repoId);
      addNotification({
        type: 'success',
        message: 'Repository successfully synchronized'
      });
      fetchRepositories();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      addNotification({
        type: 'error',
        message: `Error during synchronization: ${errorMessage}`
      });
    }
  };
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  if (projectState.loading) {
    return <LoadingState>Loading project...</LoadingState>;
  }
  
  if (projectState.error) {
    return (
      <Container>
        <div>Error: {projectState.error}</div>
        <BackButton onClick={() => navigate('/projects')}>
          Back to projects
        </BackButton>
      </Container>
    );
  }
  
  const project = projectState.data as Project;
  
  return (
    <Container>
      <Header>
        <div>
          <Title>{project.name}</Title>
          <Description>{project.description}</Description>
          <LastModified>Last modified: {formatDate(project.last_modified)}</LastModified>
        </div>
        <ButtonGroup>
          <GourceButton onClick={handleGourceConfig}>
            Gource Configuration
          </GourceButton>
          <EditButton onClick={handleEditProject}>
            Edit
          </EditButton>
          <DeleteButton onClick={handleDeleteProject}>
            Delete
          </DeleteButton>
        </ButtonGroup>
      </Header>
      
      <Section>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <SectionTitle>Repositories</SectionTitle>
          <AddRepoButton onClick={handleAddRepository}>
            + Link Repository
          </AddRepoButton>
        </div>
        
        {repositoriesState.loading ? (
          <LoadingState>Loading repositories...</LoadingState>
        ) : repositoriesState.error ? (
          <div>Error loading repositories: {repositoriesState.error}</div>
        ) : (repositoriesState.data as Repository[])?.length === 0 ? (
          <p>No repositories associated with this project. Add one to get started.</p>
        ) : (
          <RepositoriesList>
            {(repositoriesState.data as Repository[]).map(repo => (
              <RepositoryCard key={repo.id}>
                <RepoName>{repo.name}</RepoName>
                {repo.url && <RepoInfo>URL: {repo.url}</RepoInfo>}
                {repo.branch && <RepoInfo>Branch: {repo.branch}</RepoInfo>}
                <RepoInfo>Last updated: {formatDate(repo.last_updated)}</RepoInfo>
                
                <RepoActions>
                  <RepoButton onClick={() => handleSyncRepository(repo.id)}>
                    Synchronize
                  </RepoButton>
                  <RepoButton onClick={() => handleEditRepository(repo.id)}>
                    Edit
                  </RepoButton>
                  <RepoButton onClick={() => handleDeleteRepository(repo.id)}>
                    Delete
                  </RepoButton>
                </RepoActions>
              </RepositoryCard>
            ))}
          </RepositoriesList>
        )}
      </Section>
    </Container>
  );
};

export default ProjectDetail; 