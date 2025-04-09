import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaFolder, FaPlus, FaSearch, FaArrowLeft, FaLink, FaCheck, FaCheckSquare } from 'react-icons/fa';
import api from '../services/api';
import { useNotification } from '../components/ui/NotificationContext';
import { Project, Repository } from '../types';

// Styled Components
const Container = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const TitleIcon = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text}99;
  margin: 0;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
  padding: 0;
  margin-bottom: 1rem;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 2rem;
  max-width: 600px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid ${({ theme }) => theme.colors.background};
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textLight};
`;

const ListContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  overflow: hidden;
`;

const ProjectItem = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.background};
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${({ $selected, theme }) => $selected ? `${theme.colors.primary}10` : 'transparent'};
  
  &:hover {
    background-color: ${({ $selected, theme }) => $selected ? `${theme.colors.primary}20` : theme.colors.background};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const CheckboxContainer = styled.div`
  margin-right: 1rem;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 16px;
  height: 16px;
`;

const ProjectIcon = styled.div`
  background-color: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.25rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
`;

const ProjectInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-left: 1rem;
`;

const ProjectName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const ProjectMeta = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textLight};
  margin-top: 0.25rem;
`;

const EmptyMessage = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.textLight};
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
`;

const CancelButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background}dd;
  }
`;

const ActionButton = styled(Button)<{ $disabled?: boolean }>`
  background-color: ${({ theme, $disabled }) => $disabled ? `${theme.colors.primary}80` : theme.colors.primary};
  color: white;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  
  &:hover {
    background-color: ${({ theme, $disabled }) => $disabled ? `${theme.colors.primary}80` : `${theme.colors.primary}dd`};
  }
`;

const CreateProjectButton = styled(Button)`
  background-color: #4CAF50;
  color: white;
  
  &:hover {
    background-color: #388E3C;
  }
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.danger}10;
  border-radius: 4px;
  margin-bottom: 1.5rem;
`;

const SuccessMessage = styled.div`
  color: ${({ theme }) => theme.colors.success || '#28a745'};
  background-color: ${({ theme }) => theme.colors.success ? `${theme.colors.success}10` : '#28a74510'};
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
`;

const RepositoriesSummary = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
`;

const SummaryTitle = styled.h3`
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
  color: ${({ theme }) => theme.colors.text};
`;

const RepoChip = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.85rem;
  margin: 0.25rem;
`;

const ActionsBar = styled.div`
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

const ActionsLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ActionsRight = styled.div`
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

// Helper function to format relative time
const getRelativeTimeString = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

/**
 * RepositoryProjectsManager - Component for linking repositories to projects
 * This component is used when starting from the repositories view to link repositories to one or more projects
 */
const RepositoryProjectsManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotification();
  
  // Get repositories from location state
  const repositories: string[] = location.state?.repositories || [];
  const repoNames: string[] = location.state?.repositoryNames || [];
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [linkedProjects, setLinkedProjects] = useState<string[]>([]);
  
  useEffect(() => {
    // Redirect if no repositories provided
    if (repositories.length === 0) {
      addNotification({
        type: 'warning',
        message: 'No repositories selected to link',
        duration: 3000
      });
      navigate('/repositories');
      return;
    }
    
    fetchProjects();
  }, []);
  
  useEffect(() => {
    // Filter projects based on search term
    if (searchTerm.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [searchTerm, projects]);
  
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      
      // Add slug to each project
      const projectsWithSlugs = response.data.map((project: Project) => ({
        ...project,
        slug: project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }));
      
      setProjects(projectsWithSlugs);
      setFilteredProjects(projectsWithSlugs);
      setLoading(false);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Unable to load projects. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };
  
  const handleSelectAll = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map(project => project.id));
    }
  };
  
  const handleLinkRepositories = async () => {
    if (selectedProjects.length === 0) {
      setError('Please select at least one project');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // For each selected project, link all repositories
      for (const projectId of selectedProjects) {
        // Skip if already linked
        if (linkedProjects.includes(projectId)) continue;
        
        // Create an array of promises to link all repositories to this project
        const promises = repositories.map(repoId => 
          api.post('/project-repositories', {
            project_id: projectId,
            repository_id: repoId
          })
        );
        
        await Promise.all(promises);
        
        // Add this project to the list of linked projects
        setLinkedProjects(prev => [...prev, projectId]);
      }
      
      setSuccess(`Successfully linked ${repositories.length} repositories to ${selectedProjects.length} projects`);
      addNotification({
        type: 'success',
        message: `Successfully linked repositories to ${selectedProjects.length} projects`,
        duration: 3000
      });
      
    } catch (err) {
      console.error('Error linking repositories to projects:', err);
      setError('Error linking repositories to projects. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleCreateProject = () => {
    navigate('/projects/create', { state: { repositories } });
  };
  
  const handleGoBack = () => {
    navigate('/repositories');
  };
  
  const isProjectLinked = (projectId: string) => {
    return linkedProjects.includes(projectId);
  };
  
  return (
    <Container>
      <BackButton onClick={handleGoBack}>
        <FaArrowLeft size={12} /> Back to Repositories
      </BackButton>
      
      <Header>
        <Title>
          <TitleIcon><FaFolder size={24} /></TitleIcon>
          Link Repositories to Projects
        </Title>
        <Subtitle>
          Select projects to link {repositories.length} repositories to
        </Subtitle>
      </Header>
      
      {repositories.length > 0 && (
        <RepositoriesSummary>
          <SummaryTitle>Selected Repositories ({repositories.length})</SummaryTitle>
          <div>
            {repoNames.map((name, index) => (
              <RepoChip key={index}>
                {name}
              </RepoChip>
            ))}
          </div>
        </RepositoriesSummary>
      )}
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      <SearchContainer>
        <SearchIcon>
          <FaSearch size={14} />
        </SearchIcon>
        <SearchInput 
          type="text" 
          value={searchTerm} 
          onChange={handleSearchChange}
          placeholder="Search projects..."
        />
      </SearchContainer>
      
      {loading ? (
        <LoadingIndicator>Loading projects...</LoadingIndicator>
      ) : filteredProjects.length === 0 ? (
        <EmptyMessage>
          No projects found. Create a new project first.
        </EmptyMessage>
      ) : (
        <ListContainer>
          {filteredProjects.map(project => (
            <ProjectItem
              key={project.id}
              $selected={selectedProjects.includes(project.id)}
              onClick={() => handleProjectSelect(project.id)}
            >
              <CheckboxContainer>
                <Checkbox 
                  checked={selectedProjects.includes(project.id)}
                  onChange={() => {}}
                />
              </CheckboxContainer>
              <ProjectIcon>
                <FaFolder />
              </ProjectIcon>
              <ProjectInfo>
                <ProjectName>{project.name}</ProjectName>
                <ProjectMeta>
                  Modified {getRelativeTimeString(project.last_modified)}
                  {project.repository_count !== undefined && ` • ${project.repository_count} repositories`}
                </ProjectMeta>
              </ProjectInfo>
              {isProjectLinked(project.id) && (
                <span style={{ color: '#4CAF50' }}>
                  <FaCheck size={16} />
                </span>
              )}
            </ProjectItem>
          ))}
        </ListContainer>
      )}
      
      <ButtonContainer>
        <CreateProjectButton onClick={handleCreateProject}>
          <FaPlus size={14} /> Create New Project
        </CreateProjectButton>
      </ButtonContainer>
      
      {selectedProjects.length > 0 && (
        <ActionsBar>
          <ActionsLeft>
            <SelectAllButton onClick={handleSelectAll}>
              <FaCheckSquare />
              {selectedProjects.length === filteredProjects.length ? 'Unselect All' : 'Select All'}
            </SelectAllButton>
            <span>{selectedProjects.length} project(s) selected</span>
          </ActionsLeft>
          <ActionsRight>
            <CancelButton onClick={handleGoBack}>
              Cancel
            </CancelButton>
            <ActionButton 
              onClick={handleLinkRepositories}
              $disabled={submitting}
              disabled={submitting}
            >
              <FaLink size={14} />
              {submitting ? 'Linking...' : 'Link to Selected Projects'}
            </ActionButton>
          </ActionsRight>
        </ActionsBar>
      )}
    </Container>
  );
};

export default RepositoryProjectsManager; 