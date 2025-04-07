import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';

interface Repository {
  id: string;
  name: string;
  url: string;
}

interface Project {
  id: string;
  name: string;
}

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

const Form = styled.form`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 600px;
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

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.background};
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SearchInput = styled(Input)`
  margin-bottom: 1rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
`;

const CancelButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background}dd;
  }
`;

const SubmitButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}dd;
  }
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

const InfoText = styled.div`
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text}99;
`;

const RepositoriesList = styled.div`
  margin-top: 1rem;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.background};
  border-radius: 4px;
`;

const EmptyMessage = styled.div`
  padding: 1rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.text}99;
`;

const RepositoryItem = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.background};
  background-color: ${({ $selected, theme }) => $selected ? theme.colors.background : 'transparent'};
  cursor: pointer;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const Checkbox = styled.input`
  margin-right: 1rem;
`;

const RepositoryInfo = styled.div`
  flex: 1;
`;

const RepositoryName = styled.div`
  font-weight: 500;
`;

const RepositoryUrl = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const AddNewButton = styled(Button)`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  margin-bottom: 1rem;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
`;

/**
 * LinkRepositoriesToProject - Component for linking existing repositories to a project
 * This component is specifically for linking repositories that already exist in the system
 * NOT for downloading new repositories (use AddRepository for that)
 */
const LinkRepositoriesToProject: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
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
    if (projectId) {
      fetchProject();
      fetchRepositories();
    }
  }, [projectId]);
  
  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
    } catch (err) {
      console.error('Error loading project:', err);
      setError('Error loading project. Please try again.');
    }
  };
  
  const fetchRepositories = async () => {
    try {
      setLoading(true);
      
      // Fetch all repositories
      const allReposResponse = await api.get('/repositories');
      
      // Fetch repositories already linked to project
      const projectReposResponse = await api.get(`/repositories?project_id=${projectId}`);
      
      // Filter out repositories already linked to the project
      const linkedRepoIds = projectReposResponse.data.map((repo: Repository) => repo.id);
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
        repo.url.toLowerCase().includes(searchTerm.toLowerCase())
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
      setSelectedRepositories([]);
      
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
    navigate('/repositories/add');
  };
  
  return (
    <Container>
      <Header>
        <Title>Link Repositories to Project</Title>
        <Subtitle>
          {project ? `Select repositories to link to ${project.name}` : 'Loading project...'}
        </Subtitle>
      </Header>
      
      <Form onSubmit={handleSubmit}>
        <AddNewButton type="button" onClick={handleAddNewRepository}>
          Download New Repository
        </AddNewButton>
        
        <FormGroup>
          <Label>Search Repositories</Label>
          <SearchInput 
            type="text" 
            value={searchTerm} 
            onChange={handleSearchChange}
            placeholder="Search by name or URL"
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Available Repositories</Label>
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
                    type="checkbox" 
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
              No available repositories found. Download new repositories first.
            </EmptyMessage>
          )}
        </FormGroup>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        
        <InfoText>
          Select repositories you want to link to this project. You can only link repositories 
          that have already been downloaded to the system.
        </InfoText>
        
        <ButtonContainer>
          <CancelButton type="button" onClick={() => navigate(`/projects/${projectId}`)}>
            Cancel
          </CancelButton>
          <SubmitButton 
            type="submit" 
            disabled={submitting || selectedRepositories.length === 0}
          >
            {submitting ? 'Linking...' : 'Link Selected Repositories'}
          </SubmitButton>
        </ButtonContainer>
      </Form>
    </Container>
  );
};

export default LinkRepositoriesToProject; 