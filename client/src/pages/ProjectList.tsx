import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaPlus, FaTrash, FaEdit, FaPlay, FaFolder, FaCalendarAlt, FaInfoCircle, FaSearch, FaTags, FaTimes, FaCheckSquare, FaSync } from 'react-icons/fa';
import api from '../services/api';
import { useNotification } from '../components/ui/NotificationContext';

interface Project {
  id: string;
  name: string;
  description: string;
  last_modified: string;
  repository_count?: number;
  tags?: string;
}

const Container = styled.div`
  padding: 2rem;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 2rem;
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
  justify-content: center;
  gap: 0.5rem;
  background-color: #4CAF50;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 1rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  width: 100%;

  &:hover {
    background-color: #388E3C;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: white;
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 1rem 0 2rem 0;
`;

const SearchInput = styled.div`
  position: relative;
  min-width: 300px;
  max-width: 400px;
  
  input {
    width: 100%;
    padding: 0.6rem 1rem 0.6rem 2.5rem;
    border: 1px solid ${({ theme }) => theme.colors.borderColor};
    border-radius: 6px;
    font-size: 0.9rem;
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
    }
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textLight};
  display: flex;
  align-items: center;
`;

const ListContainer = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 0 0 5rem 0;
  overflow: hidden;
`;

const ListHeader = styled.div`
  background-color: ${({ theme }) => theme.colors.dark};
  padding: 0.4rem 0.8rem;
  display: grid;
  grid-template-columns: 32px minmax(200px, 1.2fr) minmax(300px, 2fr) 80px 160px;
  color: ${({ theme }) => theme.colors.white};
  font-weight: bold;
  align-items: center;
  font-size: 0.85rem;
  letter-spacing: 0.3px;
`;

const ListHeaderItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ListItem = styled.div`
  display: grid;
  grid-template-columns: 32px minmax(200px, 1.2fr) minmax(300px, 2fr) 80px 160px;
  padding: 0.4rem 0.8rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
  align-items: center;
  transition: all 0.2s;
  min-height: 36px;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
    transform: translateX(2px);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const ProjectCell = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 0.8rem;
`;

const ProjectName = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  
  &:before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #4CAF50;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Description = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DateCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.8rem;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  width: fit-content;
`;

const DateIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.primary};
  opacity: 0.8;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.2rem;
  justify-content: flex-start;
  flex-wrap: nowrap;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid #e0e0e0;
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.8rem;
  font-weight: 500;
  gap: 3px;
  white-space: nowrap;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
    transform: translateY(-1px);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  &.edit {
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary}40;
  }

  &.play {
    color: #4CAF50;
    border-color: #4CAF5040;
  }

  &.delete {
    color: #F44336;
    border-color: #F4433640;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  min-height: 20px;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 16px;
  height: 16px;
  cursor: pointer;
  border-radius: 3px;
  border: 1.5px solid ${({ theme }) => theme.colors.primary};
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: white;
  margin: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:checked {
    background-color: ${({ theme }) => theme.colors.primary};
  }

  &:checked::before {
    content: '✓';
    color: white;
    font-size: 11px;
    position: absolute;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary}20;
  }
`;

const BatchActionsBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.dark};
  color: white;
  padding: 0.6rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
`;

const BatchActionsLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BatchActionsRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SelectAllButton = styled.button`
  background: none;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const BatchActionButton = styled.button`
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-size: 0.9rem;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  &.delete {
    background-color: ${({ theme }) => theme.colors.danger}90;
    border-color: ${({ theme }) => theme.colors.danger};

    &:hover {
      background-color: ${({ theme }) => theme.colors.danger};
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid ${({ theme }) => theme.colors.borderColor};
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const EmptyText = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
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

// Fonction pour afficher les dates au format relatif
const getRelativeTimeString = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`;
  return `${Math.floor(diffInSeconds / 31536000)}y`;
};

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const navigate = useNavigate();
  const { addNotification } = useNotification();

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
      console.error('Error loading projects:', err);
      setError('Unable to load projects. Please try again later.');
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
      fetchProjects();
      addNotification({
        type: 'success',
        message: 'Project deleted successfully',
        duration: 3000
      });
    } catch (err) {
      console.error('Error deleting project:', err);
      addNotification({
        type: 'error',
        message: 'Failed to delete project',
        duration: 3000
      });
    }
  };

  const handleProjectSelect = (id: string) => {
    setSelectedProjects(prev => 
      prev.includes(id) 
        ? prev.filter(projectId => projectId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(projects.map(project => project.id));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedProjects.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedProjects.length} projects? This action is irreversible.`)) {
      return;
    }
    
    try {
      const deletePromises = selectedProjects.map(id => api.projects.delete(id));
      await Promise.all(deletePromises);
      
      addNotification({
        type: 'success',
        message: `Successfully deleted ${selectedProjects.length} projects`,
        duration: 3000
      });
      
      fetchProjects();
      setSelectedProjects([]);
    } catch (err) {
      console.error('Error deleting projects:', err);
      addNotification({
        type: 'error',
        message: 'Failed to delete some projects',
        duration: 3000
      });
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <Header>
        <Title>
          <TitleIcon><FaFolder size={28} /></TitleIcon>
          Gource Projects
        </Title>
        <AddButton to="/projects/create">
          <FaPlus /> Create Project
        </AddButton>
      </Header>

      <SearchContainer>
        <SearchInput>
          <SearchIcon>
            <FaSearch size={16} />
          </SearchIcon>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects..."
          />
        </SearchInput>
      </SearchContainer>

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
      ) : filteredProjects.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <FaSearch />
          </EmptyIcon>
          <EmptyTitle>No matching projects found</EmptyTitle>
          <EmptyText>
            No projects match your search criteria. Would you like to create a new project instead?
          </EmptyText>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={() => setSearchTerm('')} 
              style={{ 
                padding: '0.7rem 1.2rem', 
                borderRadius: '6px', 
                border: 'none', 
                backgroundColor: '#f0f0f0', 
                cursor: 'pointer' 
              }}
            >
              Clear search
            </button>
            <AddButton to="/projects/create">
              <FaPlus /> Create New Project
            </AddButton>
          </div>
        </EmptyState>
      ) : (
        <ListContainer>
          <ListHeader>
            <CheckboxContainer>
              <Checkbox 
                checked={selectedProjects.length === projects.length && projects.length > 0}
                onChange={handleSelectAll}
              />
            </CheckboxContainer>
            <ListHeaderItem>Project</ListHeaderItem>
            <ListHeaderItem>Description</ListHeaderItem>
            <ListHeaderItem>Last Modified</ListHeaderItem>
            <div>Actions</div>
          </ListHeader>

          {filteredProjects.map((project) => (
            <ListItem key={project.id}>
              <CheckboxContainer>
                <Checkbox 
                  checked={selectedProjects.includes(project.id)}
                  onChange={() => handleProjectSelect(project.id)}
                />
              </CheckboxContainer>
              <ProjectCell>
                <ProjectName onClick={() => handleProjectSelect(project.id)}>
                  {project.name}
                </ProjectName>
                {project.repository_count !== undefined && (
                  <Description>
                    {project.repository_count} repositories
                  </Description>
                )}
              </ProjectCell>
              <Description>
                {project.description || 'No description'}
              </Description>
              <DateCell>
                <DateIcon>
                  <FaCalendarAlt size={12} />
                </DateIcon>
                {getRelativeTimeString(project.last_modified)}
              </DateCell>
              <Actions>
                <ActionButton 
                  className="play"
                  onClick={() => navigate(`/projects/${project.id}/gource`)}
                  title="Configure Gource"
                >
                  <FaPlay />
                </ActionButton>
                <ActionButton 
                  className="edit" 
                  onClick={() => navigate(`/projects/${project.id}`)}
                  title="Edit"
                >
                  <FaEdit />
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

          {selectedProjects.length > 0 && (
            <BatchActionsBar>
              <BatchActionsLeft>
                <SelectAllButton onClick={handleSelectAll}>
                  <FaCheckSquare />
                  {selectedProjects.length === projects.length ? 'Unselect All' : 'Select All'}
                </SelectAllButton>
                <span>{selectedProjects.length} projects selected</span>
              </BatchActionsLeft>
              <BatchActionsRight>
                <BatchActionButton className="delete" onClick={handleBatchDelete}>
                  <FaTrash />
                  Delete All
                </BatchActionButton>
              </BatchActionsRight>
            </BatchActionsBar>
          )}
        </ListContainer>
      )}
    </Container>
  );
};

export default ProjectList; 
