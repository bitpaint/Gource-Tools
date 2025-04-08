import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';
import ReactConfetti from 'react-confetti';
import { useSpring, animated } from '@react-spring/web';

interface FormData {
  name: string;
  url: string;
  branch_default: string;
}

interface ImportData {
  username: string;
  platform: 'github' | 'gitlab';
}

interface ImportResult {
  id: string;
  name: string;
  url: string;
  success: boolean;
  error?: string;
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

const WarningMessage = styled.div`
  background-color: #fff8e1;
  color: #f57f17;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #ffe082;
`;

// Animations and success UI
const SuccessCardBase = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 2rem;
  max-width: 600px;
  text-align: center;
  margin-top: 2rem;
  position: relative;
  overflow: hidden;
`;

const SuccessCard = animated(SuccessCardBase);

const SuccessIcon = styled.div`
  background-color: ${({ theme }) => theme.colors.success || '#28a745'};
  color: white;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 1.5rem auto;
  font-size: 2.5rem;
`;

const SuccessTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const SuccessDescription = styled.p`
  color: ${({ theme }) => theme.colors.text}99;
  margin-bottom: 2rem;
  font-size: 1rem;
`;

const ResultsList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 2rem;
  text-align: left;
  border: 1px solid ${({ theme }) => theme.colors.background};
  border-radius: 4px;
`;

const ResultItem = styled.div<{ $success: boolean }>`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.background};
  display: flex;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
  
  &::before {
    content: ${({ $success }) => $success ? '"✅"' : '"❌"'};
    margin-right: 0.75rem;
  }
  
  color: ${({ $success, theme }) => $success ? theme.colors.text : theme.colors.danger};
`;

const ActionButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  font-weight: 600;
  padding: 0.875rem 1.75rem;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}cc;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid ${({ theme }) => theme.colors.primary};
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.text};
  margin-top: 1rem;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

/**
 * AddRepository - Component for downloading new Git repositories to Gource Tools
 * This component is specifically for adding new repositories to the system
 * NOT for associating existing repositories with projects (use LinkRepositoryToProject for that)
 */
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const projectId = searchParams.get('project_id');

  // If there's a project ID, redirect to the LinkRepositoryToProject page
  useEffect(() => {
    if (projectId) {
      navigate(`/projects/${projectId}/link-repositories`);
    }
  }, [projectId, navigate]);

  // Animation for success card
  const successCardAnimation = useSpring({
    from: { opacity: 0, transform: 'translateY(30px)' },
    to: { opacity: showSuccessCard ? 1 : 0, transform: showSuccessCard ? 'translateY(0px)' : 'translateY(30px)' },
    config: { tension: 280, friction: 20 }
  });
  
  // Reset state when switching tabs
  useEffect(() => {
    setError(null);
    setSuccess(null);
    setShowSuccessCard(false);
    setShowConfetti(false);
  }, [activeTab]);

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

  // Function to normalize Git URLs
  const normalizeGitUrl = (url: string): string => {
    // If it's already a valid URL
    if (isValidUrl(url)) {
      const urlObj = new URL(url);
      
      // If it's a GitHub URL
      if (urlObj.hostname === 'github.com') {
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        
        // If it's a web page URL (not .git)
        if (pathParts.length >= 2 && !url.endsWith('.git')) {
          // Convert to clone URL
          return `https://${urlObj.hostname}/${pathParts[0]}/${pathParts[1]}.git`;
        }
      }
      
      return url;
    }
    
    // If it might be a username or organization
    if (url.indexOf('/') === -1 && url.indexOf('.') === -1) {
      // Suggest bulk import
      setActiveTab('bulk');
      setImportData(prev => ({ ...prev, username: url }));
      setError('This appears to be a username. Please use the bulk import tab instead.');
      return '';
    }
    
    // If it might be a repo name without full URL
    if (url.includes('/') && !url.includes('://')) {
      // Convert to GitHub URL by default
      return `https://github.com/${url}.git`;
    }
    
    return url;
  };

  const addRepository = () => {
    if (!quickUrl.trim()) return;
    
    // Normalize the URL
    const normalizedUrl = normalizeGitUrl(quickUrl);
    
    // If normalization suggested a bulk import
    if (!normalizedUrl) {
      return;
    }
    
    if (!isValidUrl(normalizedUrl)) {
      setError('Invalid repository URL. Please enter a valid URL or use the format "username/repo".');
      return;
    }
    
    // Extract repository name from URL
    const urlObj = new URL(normalizedUrl);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    let name = pathParts[pathParts.length - 1].replace(/\.git$/, '');
    
    const newRepo = { url: normalizedUrl, name };
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
    setLoadingProgress(`Discovering repositories for ${importData.username}...`);

    try {
      const response = await api.post('/repositories/import', {
        username: importData.username,
        platform: importData.platform
      });
      
      // Show success UI
      setShowSuccessCard(true);
      setShowConfetti(true);
      setImportResults(response.data.results || []);
      
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      
      // Reset form
      setImportData({
        username: '',
        platform: 'github'
      });
    } catch (err: any) {
      console.error('Error importing repositories:', err);
      setError(err.response?.data?.error || 'An error occurred while importing repositories. Please try again.');
    } finally {
      setSubmitting(false);
      setLoadingProgress('');
    }
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (repositories.length === 0 && quickUrl.trim()) {
      addRepository();
      if (error) return;
    }
    
    if (repositories.length === 0) {
      setError('You must specify at least one repository URL');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      setLoadingProgress(`Downloading repositories...`);
      
      const results: ImportResult[] = [];
      
      for (let i = 0; i < repositories.length; i++) {
        const repo = repositories[i];
        setLoadingProgress(`Downloading ${repo.name} (${i+1}/${repositories.length})...`);
        
        try {
          const response = await api.post('/repositories', {
            name: repo.name,
            url: repo.url
          });
          
          results.push({
            id: response.data.id,
            name: repo.name,
            url: repo.url,
            success: true
          });
        } catch (err: any) {
          results.push({
            id: '',
            name: repo.name,
            url: repo.url,
            success: false,
            error: err.response?.data?.error || 'Unknown error'
          });
        }
      }
      
      // Show success UI
      setImportResults(results);
      setShowSuccessCard(true);
      setShowConfetti(true);
      setRepositories([]);
      
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    } catch (err: any) {
      console.error('Error creating repositories:', err);
      setError(err.response?.data?.error || 'An error occurred while creating repositories. Please try again.');
    } finally {
      setSubmitting(false);
      setLoadingProgress('');
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
      setLoadingProgress(`Downloading repository ${formData.name}...`);
      
      const response = await api.post('/repositories', {
        name: formData.name,
        url: formData.url || null,
        branch_default: formData.branch_default
      });
      
      // Show success UI with one result
      setImportResults([{
        id: response.data.id,
        name: formData.name,
        url: formData.url,
        success: true
      }]);
      
      setShowSuccessCard(true);
      setShowConfetti(true);
      
      // Reset form
      setFormData({
        name: '',
        url: '',
        branch_default: 'main'
      });
      
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    } catch (err: any) {
      console.error('Error creating repository:', err);
      setError(err.response?.data?.error || 'An error occurred while creating the repository. Please try again.');
    } finally {
      setSubmitting(false);
      setLoadingProgress('');
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
  
  const handleGoToProjects = () => {
    navigate('/projects');
  };
  
  const handleAddAnother = () => {
    setShowSuccessCard(false);
    setShowConfetti(false);
    setSuccess(null);
    setError(null);
  };

  return (
    <Container>
      {/* Confetti effect on success */}
      {showConfetti && (
        <ReactConfetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          gravity={0.1}
        />
      )}
      
      {/* Loading overlay */}
      {submitting && (
        <LoadingOverlay>
          <LoadingSpinner />
          <LoadingText>{loadingProgress || 'Processing...'}</LoadingText>
        </LoadingOverlay>
      )}
      
      <Header>
        <Title>Download Git Repository</Title>
        <Subtitle>Add a new Git repository to Gource Tools</Subtitle>
      </Header>
      
      {/* Success card UI */}
      {showSuccessCard ? (
        <SuccessCard style={successCardAnimation}>
          <SuccessIcon>✓</SuccessIcon>
          <SuccessTitle>Repositories Downloaded Successfully!</SuccessTitle>
          <SuccessDescription>
            {importResults.filter(r => r.success).length} of {importResults.length} repositories were downloaded successfully.
          </SuccessDescription>
          
          {importResults.length > 0 && (
            <ResultsList>
              {importResults.map((result, index) => (
                <ResultItem key={index} $success={result.success}>
                  <strong>{result.name}</strong> - {result.success ? 'Downloaded successfully' : result.error}
                </ResultItem>
              ))}
            </ResultsList>
          )}
          
          <ActionButtonsContainer>
            <CancelButton onClick={handleAddAnother}>
              Download More
            </CancelButton>
            <ActionButton onClick={handleGoToProjects}>
              Go to Projects
            </ActionButton>
          </ActionButtonsContainer>
        </SuccessCard>
      ) : (
        <>
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
          
          {activeTab === 'quick' && (
            <Form onSubmit={handleQuickSubmit}>
              <FormGroup>
                <Label>Repository URL or "username/repo"</Label>
                <UrlForm>
                  <UrlInput 
                    type="text" 
                    value={quickUrl} 
                    onChange={(e) => setQuickUrl(e.target.value)}
                    onKeyDown={handleUrlKeyDown}
                    placeholder="e.g., https://github.com/username/repo.git or username/repo"
                  />
                  <AddButton 
                    type="button" 
                    onClick={addRepository}
                    disabled={!quickUrl.trim()}
                  >
                    Add
                  </AddButton>
                </UrlForm>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                {success && <SuccessMessage>{success}</SuccessMessage>}
                <InfoText>
                  Enter the full URL of a Git repository or use the "username/repo" format for GitHub repositories.
                  To import all repositories from a user, use the Bulk Import tab.
                </InfoText>
              </FormGroup>

              {repositories.length > 0 && (
                <FormGroup>
                  <Label>Repositories to download</Label>
                  <RepositoryList>
                    {repositories.map((repo, index) => (
                      <RepositoryItem key={index}>
                        <div>{repo.name} ({repo.url})</div>
                        <RemoveButton 
                          type="button" 
                          onClick={() => removeRepository(index)}
                        >
                          Remove
                        </RemoveButton>
                      </RepositoryItem>
                    ))}
                  </RepositoryList>
                </FormGroup>
              )}
              
              <ButtonContainer>
                <CancelButton type="button" onClick={() => navigate(-1)}>
                  Cancel
                </CancelButton>
                <SubmitButton 
                  type="submit" 
                  disabled={submitting || repositories.length === 0}
                >
                  {submitting ? 'Downloading...' : 'Download Repositories'}
                </SubmitButton>
              </ButtonContainer>
            </Form>
          )}
          
          {activeTab === 'bulk' && (
            <Form onSubmit={(e) => { e.preventDefault(); handleImport(); }}>
              <FormGroup>
                <Label htmlFor="username">Username</Label>
                <Input
                  type="text"
                  id="username"
                  name="username"
                  value={importData.username}
                  onChange={handleImportDataChange}
                  placeholder="e.g., octocat"
                  required
                />
                <InfoText>
                  Enter the username or organization whose public repositories you want to import.
                </InfoText>
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="platform">Platform</Label>
                <Select
                  id="platform"
                  name="platform"
                  value="github"
                  disabled={true}
                >
                  <option value="github">GitHub</option>
                </Select>
              </FormGroup>
              
              {error && <ErrorMessage>{error}</ErrorMessage>}
              {success && <SuccessMessage>{success}</SuccessMessage>}
              
              <ButtonContainer>
                <CancelButton type="button" onClick={() => navigate(-1)}>
                  Cancel
                </CancelButton>
                <SubmitButton type="submit" disabled={submitting || !importData.username}>
                  {submitting ? 'Importing...' : 'Import Repositories'}
                </SubmitButton>
              </ButtonContainer>
            </Form>
          )}
        </>
      )}
    </Container>
  );
};

export default AddRepository; 