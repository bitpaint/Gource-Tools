import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { FaSearch, FaLink, FaPlus, FaArrowLeft } from 'react-icons/fa';
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

const Form = styled.form`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 800px;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 1rem;
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

const RepositoriesList = styled.div`
  margin-top: 1rem;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.background};
  border-radius: 4px;
`;

const RepositoryItem = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.background};
  background-color: ${({ $selected, theme }) => $selected ? `${theme.colors.primary}10` : 'transparent'};
  cursor: pointer;
  
  &:hover {
    background-color: ${({ $selected, theme }) => $selected ? `${theme.colors.primary}20` : theme.colors.background};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const RepositoryInfo = styled.div`
  flex: 1;
  margin-left: 1rem;
`;

const RepositoryName = styled.div`
  font-weight: 500;
`;

const RepositoryUrl = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const EmptyMessage = styled.div`
  padding: 1.5rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.textLight};
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
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
  transition: background-color 0.2s;
`;

const CancelButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background}dd;
  }
`;

const SubmitButton = styled(Button)<{ $disabled?: boolean }>`
  background-color: ${({ theme, $disabled }) => $disabled ? `${theme.colors.primary}80` : theme.colors.primary};
  color: white;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  
  &:hover {
    background-color: ${({ theme, $disabled }) => $disabled ? `${theme.colors.primary}80` : `${theme.colors.primary}dd`};
  }
`;

const InfoMessage = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.85rem;
  margin-top: 0.5rem;
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  margin-top: 0.5rem;
  font-size: 0.85rem;
`;

const SuccessMessage = styled.div`
  color: ${({ theme }) => theme.colors.success || '#28a745'};
  margin-top: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 16px;
  height: 16px;
`;

const AddNewButton = styled(Button)`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
`;

/**
 * ProjectRepositoriesManager - Component for managing repository connections to a project
 * This component allows linking existing repositories to a project or adding new ones
 */
const ProjectRepositoriesManager: React.FC = () => {
  const { projectIdOrSlug } = useParams<{ projectIdOrSlug: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  const [project, setProject] = useState<Project | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filteredRepositories, setFilteredRepositories] = useState<Repository[]>([]);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    // Fetch project details
    if (projectIdOrSlug) {
      fetchProject();
    }
  }, [projectIdOrSlug]);
  
  useEffect(() => {
    // Fetch repositories once we have the project ID
    if (projectId) {
      fetchRepositories();
    }
  }, [projectId]);
  
  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${projectIdOrSlug}`);
      setProject(response.data);
      setProjectId(response.data.id);
    } catch (err) {
      console.error('Error loading project:', err);
      setError('Error loading project. Please try again.');
      addNotification({
        type: 'error',
        message: 'Error loading project. Please try again.',
        duration: 3000
      });
    }
  };
  
  const fetchRepositories = async () => {
    try {
      setLoading(true);
      
      // Get all repositories in the system
      const allReposResponse = await api.get('/repositories');
      
      // Get repositories already linked to the project
      const projectReposResponse = await api.get(`/repositories?project_id=${projectId}`);
      
      // Extract IDs of repositories already linked to the project
      const linkedRepoIds = projectReposResponse.data.map((repo: Repository) => repo.id);
      
      // Filter out repositories that are already linked to the project
      const availableRepos = allReposResponse.data.filter(
        (repo: Repository) => !linkedRepoIds.includes(repo.id)
      );
      
      setRepositories(availableRepos);
      setFilteredRepositories(availableRepos);
      setLoading(false);
    } catch (err) {
      console.error('Error loading repositories:', err);
      setError('Error loading repositories. Please try again.');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Filter repositories based on search term
    if (searchTerm.trim() === '') {
      setFilteredRepositories(repositories);
    } else {
      const filtered = repositories.filter(repo => 
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (repo.url && repo.url.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRepositories(filtered);
    }
  }, [searchTerm, repositories]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleRepositorySelect = (repoId: string) => {
    setSelectedRepositories(prev => {
      if (prev.includes(repoId)) {
        return prev.filter(id => id !== repoId);
      } else {
        return [...prev, repoId];
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRepositories.length === 0) {
      setError('Please select at least one repository to link');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Link each selected repository to the project
      const promises = selectedRepositories.map(repoId => 
        api.post('/project-repositories', {
          project_id: projectId,
          repository_id: repoId
        })
      );
      
      await Promise.all(promises);
      
      setSuccess(`Successfully linked ${selectedRepositories.length} repositories to project`);
      addNotification({
        type: 'success',
        message: `Successfully linked ${selectedRepositories.length} repositories to project`,
        duration: 3000
      });
      
      // Navigate back to project detail page after successful link
      setTimeout(() => {
        navigate(`/projects/${projectId}`);
      }, 1500);
    } catch (err) {
      console.error('Error linking repositories to project:', err);
      setError('Error linking repositories to project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleAddNewRepository = () => {
    navigate('/repositories/add', { 
      state: { returnToProject: true, projectId: projectId } 
    });
  };
  
  const handleCancel = () => {
    navigate(`/projects/${projectId}`);
  };
  
  return (
    <Container>
      <BackButton onClick={handleCancel}>
        <FaArrowLeft size={12} /> Back to project
      </BackButton>
      
      <Header>
        <Title>Link Repositories to Project</Title>
        {project && <Subtitle>Project: {project.name}</Subtitle>}
      </Header>
      
      <Form onSubmit={handleSubmit}>
        <ButtonContainer>
          <AddNewButton type="button" onClick={handleAddNewRepository}>
            <FaPlus size={14} /> Add New Repository
          </AddNewButton>
        </ButtonContainer>
        
        <FormGroup>
          <Label>Available Repositories</Label>
          <SearchContainer>
            <SearchIcon>
              <FaSearch size={14} />
            </SearchIcon>
            <SearchInput 
              type="text" 
              value={searchTerm} 
              onChange={handleSearchChange}
              placeholder="Search by name or URL"
            />
          </SearchContainer>
          
          {loading ? (
            <EmptyMessage>Loading repositories...</EmptyMessage>
          ) : filteredRepositories.length > 0 ? (
            <RepositoriesList>
              {filteredRepositories.map(repo => (
                <RepositoryItem 
                  key={repo.id} 
                  $selected={selectedRepositories.includes(repo.id)}
                  onClick={() => handleRepositorySelect(repo.id)}
                >
                  <Checkbox 
                    checked={selectedRepositories.includes(repo.id)}
                    onChange={() => {}}
                  />
                  <RepositoryInfo>
                    <RepositoryName>{repo.name}</RepositoryName>
                    <RepositoryUrl>{repo.url}</RepositoryUrl>
                  </RepositoryInfo>
                </RepositoryItem>
              ))}
            </RepositoriesList>
          ) : (
            <EmptyMessage>
              No available repositories found. Add new repositories first.
            </EmptyMessage>
          )}
        </FormGroup>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        
        <InfoMessage>
          Select repositories you want to link to this project. You can only link repositories 
          that have already been added to the system.
        </InfoMessage>
        
        <ButtonContainer>
          <CancelButton type="button" onClick={handleCancel}>
            Cancel
          </CancelButton>
          <SubmitButton 
            type="submit" 
            $disabled={submitting || selectedRepositories.length === 0}
            disabled={submitting || selectedRepositories.length === 0}
          >
            {submitting ? 'Linking...' : 'Link Selected Repositories'}
          </SubmitButton>
        </ButtonContainer>
      </Form>
    </Container>
  );
};

export default ProjectRepositoriesManager; 