import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';

interface FormData {
  name: string;
  url: string;
  branch_default: string;
}

interface ImportData {
  username: string;
  platform: 'github' | 'gitlab';
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

const InfoText = styled.div`
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text}99;
`;

const SuccessMessage = styled.div`
  color: ${({ theme }) => theme.colors.success || '#28a745'};
  margin-top: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
`;

const Tabs = styled.div`
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.background};
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid ${({ $active, theme }) => $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.text};
  font-weight: ${({ $active }) => $active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Select = styled.select`
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

const UrlForm = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const UrlInput = styled(Input)`
  flex: 1;
`;

const AddButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 0.75rem 1rem;
`;

const RepositoryList = styled.div`
  margin-top: 1rem;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.background};
  border-radius: 4px;
`;

const RepositoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.background};
  
  &:last-child {
    border-bottom: none;
  }
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.danger};
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const AddRepository: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quick' | 'bulk'>('quick');
  const [quickUrl, setQuickUrl] = useState('');
  const [repositories, setRepositories] = useState<Array<{ url: string, name: string }>>([]);
  const [importData, setImportData] = useState<ImportData>({
    username: '',
    platform: 'github'
  });
  const [formData, setFormData] = useState<FormData>({
    name: '',
    url: '',
    branch_default: 'main'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const projectId = searchParams.get('project_id');

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImportDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setImportData(prev => ({ ...prev, [name]: value }));
    setSuccess(null);
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRepository();
    }
  };

  const addRepository = () => {
    if (!quickUrl.trim()) return;
    
    if (!isValidUrl(quickUrl)) {
      setError('Repository URL is invalid');
      return;
    }
    
    // Extract name from URL
    const urlObj = new URL(quickUrl);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    let name = pathParts[pathParts.length - 1].replace(/\.git$/, '');
    
    const newRepo = { url: quickUrl, name };
    setRepositories(prev => [...prev, newRepo]);
    setQuickUrl('');
    setError(null);
    setSuccess(null);
  };

  const removeRepository = (index: number) => {
    setRepositories(prev => prev.filter((_, i) => i !== index));
    setSuccess(null);
  };

  const handleImport = async () => {
    if (!importData.username.trim()) {
      setError('Username is required');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/repositories/import', {
        username: importData.username,
        platform: importData.platform,
        project_id: projectId || undefined
      });
      
      setSuccess(`Successfully imported repositories from ${importData.username}`);
      setImportData({
        username: '',
        platform: 'github'
      });
      
      // Optionally redirect if projectId was provided
      if (projectId) {
        navigate(`/projects/${projectId}`);
      }
    } catch (err) {
      console.error('Error importing repositories:', err);
      setError('An error occurred while importing repositories. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (repositories.length === 0 && quickUrl.trim()) {
      addRepository();
      if (error) return;
    }
    
    if (repositories.length === 0) {
      setError('At least one repository URL is required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      const promises = repositories.map(repo => 
        api.post('/repositories', {
          name: repo.name,
          url: repo.url,
          branch_default: 'main',
          project_id: projectId || undefined
        })
      );
      
      await Promise.all(promises);
      
      // Show success message and clear form
      setSuccess(`Successfully added ${repositories.length} repositories`);
      setRepositories([]);
      
      // Optionally redirect if projectId was provided
      if (projectId) {
        navigate(`/projects/${projectId}`);
      }
      
    } catch (err) {
      console.error('Error creating repositories:', err);
      setError('An error occurred while creating repositories. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Repository name is required');
      return;
    }
    
    if (formData.url && !isValidUrl(formData.url)) {
      setError('Repository URL is invalid');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // Create the repository
      const response = await api.post('/repositories', {
        name: formData.name,
        url: formData.url || null,
        branch_default: formData.branch_default,
        project_id: projectId || undefined
      });
      
      // Show success message and clear form
      setSuccess(`Successfully added repository ${formData.name}`);
      setFormData({
        name: '',
        url: '',
        branch_default: 'main'
      });
      
      // Optionally redirect if projectId was provided
      if (projectId) {
        navigate(`/projects/${projectId}`);
      }
      
    } catch (err) {
      console.error('Error creating repository:', err);
      setError('An error occurred while creating the repository. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <Container>
      <Header>
        <Title>Add Repository</Title>
        <Subtitle>Add a Git repository to use in your projects</Subtitle>
      </Header>
      
      <Tabs>
        <Tab 
          $active={activeTab === 'quick'} 
          onClick={() => setActiveTab('quick')}
        >
          Quick Add
        </Tab>
        <Tab 
          $active={activeTab === 'bulk'} 
          onClick={() => setActiveTab('bulk')}
        >
          Bulk Import
        </Tab>
      </Tabs>
      
      {activeTab === 'quick' ? (
        <Form onSubmit={handleQuickSubmit}>
          <UrlForm>
            <UrlInput
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              onKeyDown={handleUrlKeyDown}
              placeholder="Enter repository URL and press Enter"
              disabled={submitting}
            />
            <AddButton 
              type="button" 
              onClick={addRepository}
              disabled={submitting}
            >
              Add
            </AddButton>
          </UrlForm>
          
          {repositories.length > 0 && (
            <RepositoryList>
              {repositories.map((repo, index) => (
                <RepositoryItem key={index}>
                  <div>
                    <strong>{repo.name}</strong>
                    <div><small>{repo.url}</small></div>
                  </div>
                  <RemoveButton 
                    type="button" 
                    onClick={() => removeRepository(index)}
                    disabled={submitting}
                  >
                    Remove
                  </RemoveButton>
                </RepositoryItem>
              ))}
            </RepositoryList>
          )}
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
          
          <ButtonContainer>
            <CancelButton 
              type="button" 
              onClick={() => projectId ? navigate(`/projects/${projectId}`) : navigate('/repositories')} 
              disabled={submitting}
            >
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Repositories'}
            </SubmitButton>
          </ButtonContainer>
        </Form>
      ) : (
        <Form onSubmit={(e) => { e.preventDefault(); handleImport(); }}>
          <FormGroup>
            <Label htmlFor="platform">Platform</Label>
            <Select
              id="platform"
              name="platform"
              value={importData.platform}
              onChange={handleImportDataChange}
              disabled={submitting}
            >
              <option value="github">GitHub</option>
              <option value="gitlab">GitLab</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="username">Username/Organization</Label>
            <Input
              id="username"
              name="username"
              value={importData.username}
              onChange={handleImportDataChange}
              placeholder={`Enter ${importData.platform === 'github' ? 'GitHub' : 'GitLab'} username or organization`}
              disabled={submitting}
              required
            />
            <InfoText>
              All public repositories from this {importData.platform === 'github' ? 'GitHub' : 'GitLab'} user/organization will be imported.
            </InfoText>
          </FormGroup>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
          
          <ButtonContainer>
            <CancelButton 
              type="button" 
              onClick={() => projectId ? navigate(`/projects/${projectId}`) : navigate('/repositories')} 
              disabled={submitting}
            >
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={submitting}>
              {submitting ? 'Importing...' : 'Import Repositories'}
            </SubmitButton>
          </ButtonContainer>
        </Form>
      )}
    </Container>
  );
};

export default AddRepository; 