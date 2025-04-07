import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaPlus, FaTrash, FaEdit, FaPlay, FaFolder, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';
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
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const TitleIcon = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
`;

const AddButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #4CAF50; /* Vert */
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.3s;

  &:hover {
    background-color: #388E3C; /* Vert foncé */
  }
`;

const ListContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const ListHeader = styled.div`
  background-color: ${({ theme }) => theme.colors.dark};
  padding: 0.75rem 1.5rem;
  display: grid;
  grid-template-columns: 2fr 2fr 1fr auto;
  color: ${({ theme }) => theme.colors.white};
  font-weight: bold;
  align-items: center;
`;

const ListHeaderItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ListItem = styled.div`
  display: grid;
  grid-template-columns: 2fr 2fr 1fr auto;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
  align-items: center;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const ProjectNameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ProjectIconWrapper = styled.div`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
`;

const ProjectName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const ProjectDescription = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DescriptionIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.primary};
  opacity: 0.6;
`;

const DateCell = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DateIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.primary};
  opacity: 0.6;
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
  transition: all 0.2s;
  color: ${({ theme }) => theme.colors.text};

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
    transform: scale(1.1);
  }

  &.edit {
    color: ${({ theme }) => theme.colors.primary};
  }

  &.play {
    color: #4CAF50; /* Vert */
    &:hover {
      color: #388E3C; /* Vert foncé */
    }
  }

  &.delete {
    color: #F44336; /* Rouge */
    &:hover {
      color: #D32F2F; /* Rouge foncé */
    }
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
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
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 1.5rem;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 1.5rem;
  opacity: 0.4;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.danger};
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
        <Title>
          <TitleIcon><FaFolder size={24} /></TitleIcon>
          Gource Projects
        </Title>
        <AddButton to="/projects/create">
          <FaPlus /> Create Project
        </AddButton>
      </Header>

      {loading ? (
        <LoadingIndicator>Loading projects...</LoadingIndicator>
      ) : error ? (
        <ErrorMessage>Error: {error}</ErrorMessage>
      ) : projects.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <FaFolder />
          </EmptyIcon>
          <EmptyTitle>No Projects</EmptyTitle>
          <EmptyText>
            Start by creating a project to organize your Gource visualizations.
          </EmptyText>
          <AddButton to="/projects/create">
            <FaPlus /> Create Project
          </AddButton>
        </EmptyState>
      ) : (
        <ListContainer>
          <ListHeader>
            <ListHeaderItem>
              <FaFolder /> Project
            </ListHeaderItem>
            <ListHeaderItem>
              <FaInfoCircle /> Description
            </ListHeaderItem>
            <ListHeaderItem>
              <FaCalendarAlt /> Last Modified
            </ListHeaderItem>
            <div>Actions</div>
          </ListHeader>
          {projects.map((project) => (
            <ListItem key={project.id}>
              <ProjectNameCell>
                <ProjectIconWrapper>
                  <FaFolder />
                </ProjectIconWrapper>
                <ProjectName>{project.name}</ProjectName>
              </ProjectNameCell>
              <ProjectDescription>
                <DescriptionIcon><FaInfoCircle size={14} /></DescriptionIcon>
                {project.description || 'No description'}
              </ProjectDescription>
              <DateCell>
                <DateIcon><FaCalendarAlt size={14} /></DateIcon>
                {formatDate(project.last_modified)}
              </DateCell>
              <Actions>
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
              </Actions>
            </ListItem>
          ))}
        </ListContainer>
      )}
    </Container>
  );
};

export default ProjectList; 
