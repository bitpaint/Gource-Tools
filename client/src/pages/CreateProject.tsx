import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';

interface Repository {
  id: string;
  name: string;
  url: string | null;
}

interface FormData {
  name: string;
  description: string;
  selectedRepositories: string[];
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

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.background};
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const RepositoryList = styled.div`
  margin-top: 1rem;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.background};
  border-radius: 4px;
`;

const RepositoryItem = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.background};
  display: flex;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
`;

const RepositoryCheckbox = styled.input`
  margin-right: 1rem;
`;

const RepositoryLabel = styled.label`
  display: block;
  cursor: pointer;
  
  .url {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.text}99;
    margin-top: 0.25rem;
  }
`;

const RepoName = styled.span`
  font-weight: 500;
`;

const RepoUrl = styled.span`
  margin-left: auto;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text}99;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

const LoadingMessage = styled.div`
  text-align: center;
  padding: 1rem;
  color: ${({ theme }) => theme.colors.text}99;
`;

const NoReposMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.text}99;
`;

const HelperText = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.secondary};
  margin-top: 0.5rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 4px;
  text-align: center;
`;

const EmptyMessage = styled.p`
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text}99;
`;

const AddLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const RepositoriesWrapper = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.background};
  border-radius: 4px;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 1rem;
  color: ${({ theme }) => theme.colors.text}99;
`;

const FormContainer = styled.div`
  max-width: 800px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.background};
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const CreateProject: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    selectedRepositories: []
  });
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/repositories');
      setRepositories(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading repositories:', err);
      setError('Unable to load repositories. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRepoToggle = (repoId: string) => {
    setFormData(prev => {
      const selectedRepositories = prev.selectedRepositories.includes(repoId)
        ? prev.selectedRepositories.filter(id => id !== repoId)
        : [...prev.selectedRepositories, repoId];
      return { ...prev, selectedRepositories };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }
    
    if (formData.selectedRepositories.length === 0) {
      setError('You must select at least one repository for your project');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await api.post('/projects', {
        name: formData.name,
        description: formData.description
      });
      
      const projectId = response.data.id;
      
      const linkPromises = formData.selectedRepositories.map(repoId => 
        api.post('/project-repositories', {
          project_id: projectId,
          repository_id: repoId
        })
      );
      
      await Promise.all(linkPromises);
      
      navigate(`/projects/${projectId}`);
      
    } catch (error) {
      console.error('Error creating project:', error);
      setError('An error occurred while creating the project. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>Create New Project</Title>
        <Subtitle>Projects allow you to combine Git repositories for Gource visualizations</Subtitle>
      </Header>
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">Project Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Project name"
            disabled={submitting}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Project description (optional)"
            disabled={submitting}
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Repositories to Include</Label>
          <RepositoriesWrapper>
            {loading ? (
              <LoadingMessage>Loading repositories...</LoadingMessage>
            ) : repositories.length === 0 ? (
              <NoReposMessage>
                No repositories available. Please add repositories first.
              </NoReposMessage>
            ) : (
              repositories.map(repo => (
                <RepositoryItem 
                  key={repo.id} 
                  onClick={() => handleRepoToggle(repo.id)}
                >
                  <RepositoryCheckbox 
                    type="checkbox" 
                    checked={formData.selectedRepositories.includes(repo.id)}
                    onChange={() => {}} // Handled by parent onClick
                    disabled={submitting}
                  />
                  <RepositoryLabel>
                    <RepoName>{repo.name}</RepoName>
                    {repo.url && <RepoUrl>{repo.url}</RepoUrl>}
                  </RepositoryLabel>
                </RepositoryItem>
              ))
            )}
          </RepositoriesWrapper>
        </FormGroup>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <ButtonContainer>
          <CancelButton type="button" onClick={() => navigate('/projects')} disabled={submitting}>
            Cancel
          </CancelButton>
          <SubmitButton type="submit" disabled={submitting || loading || formData.selectedRepositories.length === 0}>
            {submitting ? 'Creating...' : 'Create Project'}
          </SubmitButton>
        </ButtonContainer>
      </Form>
    </Container>
  );
};

export default CreateProject; 