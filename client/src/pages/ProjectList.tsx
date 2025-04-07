import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaPlus, FaTrash, FaEdit, FaPlay, FaFolder } from 'react-icons/fa';
import api from '../services/api';

interface Project {
  id: string;
  name: string;
  description: string;
  last_modified: string;
  repository_count?: number;
}

const Container = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const AddButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}dd;
  }
`;

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 1rem;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const CardHeader = styled.div`
  background-color: ${({ theme }) => theme.colors.primary}20;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ProjectIconWrapper = styled.div`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
`;

const ProjectName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
  flex: 1;
`;

const CardBody = styled.div`
  padding: 1rem;
`;

const ProjectDescription = styled.p`
  color: ${({ theme }) => theme.colors.text}cc;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  min-height: 40px;
`;

const ProjectInfo = styled.div`
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text}99;
  font-size: 0.9rem;
`;

const CardActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.background};
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: ${({ theme }) => theme.colors.text};

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }

  &.edit {
    color: ${({ theme }) => theme.colors.primary};
  }

  &.play {
    color: ${({ theme }) => theme.colors.success};
  }

  &.delete {
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const EmptyTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const EmptyText = styled.p`
  color: ${({ theme }) => theme.colors.text}99;
  margin-bottom: 1.5rem;
`;

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.projects.getAll();
      setProjects(response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des projets:', err);
      setError('Impossible de charger les projets. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project? This action is irreversible.')) {
      return;
    }

    try {
      await api.projects.delete(id);
      fetchProjects(); // Refresh the list after deletion
    } catch (err) {
      console.error('Error deleting project:', err);
      // Handle error (add notification)
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Container>
      <Header>
        <Title>Gource Projects</Title>
        <AddButton to="/projects/create">
          <FaPlus /> Create Project
        </AddButton>
      </Header>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : projects.length === 0 ? (
        <EmptyState>
          <EmptyTitle>No Projects</EmptyTitle>
          <EmptyText>
            Start by creating a project to organize your Gource visualizations.
          </EmptyText>
          <AddButton to="/projects/create">
            <FaPlus /> Create Project
          </AddButton>
        </EmptyState>
      ) : (
        <CardGrid>
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <ProjectIconWrapper>
                  <FaFolder />
                </ProjectIconWrapper>
                <ProjectName>{project.name}</ProjectName>
              </CardHeader>
              <CardBody>
                <ProjectDescription>
                  {project.description || 'No description'}
                </ProjectDescription>
                <ProjectInfo>
                  Modified on: {formatDate(project.last_modified)}
                </ProjectInfo>
                <ProjectInfo>
                  {project.repository_count 
                    ? `${project.repository_count} repositor${project.repository_count > 1 ? 'ies' : 'y'}` 
                    : 'No repository'}
                </ProjectInfo>
                <CardActions>
                  <ActionButton 
                    className="edit" 
                    onClick={() => navigate(`/projects/${project.id}`)}
                    title="Details"
                  >
                    <FaEdit />
                  </ActionButton>
                  <ActionButton 
                    className="play"
                    onClick={() => navigate(`/gource/${project.id}`)}
                    title="Configure Gource"
                  >
                    <FaPlay />
                  </ActionButton>
                  <ActionButton 
                    className="delete" 
                    onClick={() => handleDeleteProject(project.id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </ActionButton>
                </CardActions>
              </CardBody>
            </Card>
          ))}
        </CardGrid>
      )}
    </Container>
  );
};

export default ProjectList; 
