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
  width: 100%;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  width: 100%;
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
  width: 100%;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  width: 100%;
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
  padding: 0.75rem 1.5rem;
  min-width: 150px;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background}dd;
  }
  
  @media (max-width: 600px) {
    width: 100%;
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
  margin-top: 0.8rem;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text}cc;
  text-align: center;
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
  width: 100%;
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
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  width: 100%;
`;

const UrlInput = styled(Input)`
  width: 100%;
`;

const DownloadButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 0.75rem 1rem;
  width: 100%;
  margin-top: 0.5rem;
  font-weight: 500;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  max-width: 100%;
  
  &:disabled {
    background-color: #e0e0e0;
    color: #757575;
    cursor: not-allowed;
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
  width: 100%;
  text-align: center;
  margin-top: 2rem;
  position: relative;
  overflow: hidden;
`;

const SuccessCard = animated(SuccessCardBase);

const SuccessIcon = styled.div`
  background-color: ${({ theme }) => theme.colors.success || '#28a745'};
  color: white;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 1.5rem auto;
  font-size: 2rem;
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
  max-height: 250px;
  overflow-y: auto;
  margin-bottom: 1.5rem;
  text-align: left;
  border: 1px solid ${({ theme }) => theme.colors.background};
  border-radius: 4px;
  width: 100%;
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
  min-width: 150px;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}cc;
  }
  
  @media (max-width: 600px) {
    width: 100%;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.92);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
  padding: 2rem;
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  border-top: 4px solid ${({ theme }) => theme.colors.primary};
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 1.5rem;
  text-align: center;
  font-weight: 500;
`;

const LoadingProgressContainer = styled.div`
  width: 90%;
  background-color: #f0f0f0;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const LoadingProgressBar = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${props => `${props.$progress}%`};
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const LoadingDetails = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text}aa;
  margin-top: 0.5rem;
  text-align: center;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  
  @media (max-width: 600px) {
    flex-direction: column;
    width: 100%;
  }
`;

/**
 * AddRepository - Component for downloading new Git repositories to Gource Tools
 * This component is specifically for adding new repositories to the system
 * NOT for associating existing repositories with projects (use LinkRepositoryToProject for that)
 */
const AddRepository: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quick' | 'bulk'>('quick');
  const [quickUrl, setQuickUrl] = useState('');
  const [importData, setImportData] = useState<ImportData>({
    username: '',
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
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressDetails, setProgressDetails] = useState('');
  
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
    
    // Focus the appropriate input field when switching tabs
    setTimeout(() => {
      if (activeTab === 'quick') {
        const quickInput = document.querySelector('input[value="' + quickUrl + '"]') as HTMLInputElement;
        if (quickInput) quickInput.focus();
      } else if (activeTab === 'bulk') {
        const usernameInput = document.getElementById('username') as HTMLInputElement;
        if (usernameInput) usernameInput.focus();
      }
    }, 100);
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
      
      // Check if it might be a username/organization
      if (quickUrl.trim() && quickUrl.indexOf('/') === -1 && quickUrl.indexOf('.') === -1) {
        // Suggest bulk import
        setActiveTab('bulk');
        setImportData(prev => ({ ...prev, username: quickUrl }));
        setQuickUrl('');
        
        // Focus the username input in the bulk tab
        setTimeout(() => {
          const usernameInput = document.getElementById('username');
          if (usernameInput) {
            usernameInput.focus();
          }
        }, 100);
        
        return;
      }
      
      handleQuickDownload();
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
      // We'll handle this in the keydown handler instead
      return '';
    }
    
    // If it might be a repo name without full URL
    if (url.includes('/') && !url.includes('://')) {
      // Convert to GitHub URL by default
      return `https://github.com/${url}.git`;
    }
    
    return url;
  };

  // New function to directly download a repository
  const handleQuickDownload = async () => {
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
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      setLoadingProgress(`Downloading repository ${name}`);
      setProgressPercent(10);
      setProgressDetails('Initializing download...');
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgressPercent(prev => {
          const newProgress = prev + Math.random() * 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            setProgressDetails('Finalizing repository setup...');
            return 90;
          }
          
          if (newProgress > 30 && newProgress < 60) {
            setProgressDetails('Cloning Git repository...');
          } else if (newProgress >= 60 && newProgress < 90) {
            setProgressDetails('Processing repository data...');
          }
          
          return newProgress;
        });
      }, 800);
      
      const response = await api.post('/repositories', {
        name: name,
        url: normalizedUrl
      });
      
      // Complete the progress
      clearInterval(progressInterval);
      setProgressPercent(100);
      setProgressDetails('Download complete!');
      
      // Show success UI
      setTimeout(() => {
        setImportResults([{
          id: response.data.id,
          name: name,
          url: normalizedUrl,
          success: true
        }]);
        
        setShowSuccessCard(true);
        setShowConfetti(true);
        setQuickUrl('');
      }, 500);
      
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    } catch (err: any) {
      console.error('Error downloading repository:', err);
      setError(err.response?.data?.error || 'An error occurred while downloading the repository. Please try again.');
    } finally {
      setSubmitting(false);
      setLoadingProgress('');
      setProgressPercent(0);
      setProgressDetails('');
    }
  };

  const handleImport = async () => {
    if (!importData.username.trim()) {
      setError('Username is required');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setLoadingProgress(`Discovering repositories for ${importData.username}`);
    setProgressPercent(10);
    setProgressDetails('Searching for repositories...');

    try {
      // Simulate progress updates for the search phase
      const searchProgressInterval = setInterval(() => {
        setProgressPercent(prev => {
          const newProgress = prev + Math.random() * 3;
          if (newProgress >= 40) {
            clearInterval(searchProgressInterval);
            setProgressDetails(`Found repositories for ${importData.username}, preparing download...`);
            return 40;
          }
          
          if (newProgress > 20 && newProgress < 40) {
            setProgressDetails(`Scanning ${importData.username}'s repositories...`);
          }
          
          return newProgress;
        });
      }, 1000);
      
      const response = await api.post('/repositories/import', {
        username: importData.username,
        platform: 'github'
      });
      
      clearInterval(searchProgressInterval);
      
      // If we have results, show progress for each repository download
      if (response.data.results && response.data.results.length > 0) {
        const totalRepos = response.data.results.length;
        setProgressDetails(`Found ${totalRepos} repositories, starting download...`);
        
        // Calculate progress increment per repo
        const progressPerRepo = 50 / totalRepos;
        let currentProgress = 40; // Start at 40% after search phase
        
        // Simulate downloading each repository
        const downloadProgressInterval = setInterval(() => {
          setProgressPercent(prev => {
            const newProgress = prev + (progressPerRepo / 10); // Increment gradually
            if (newProgress >= 95) {
              clearInterval(downloadProgressInterval);
              setProgressDetails('Finalizing repository imports...');
              return 95;
            }
            
            // Update message occasionally with count
            const completedCount = Math.floor((newProgress - 40) / progressPerRepo);
            if (completedCount > 0 && completedCount % Math.max(1, Math.floor(totalRepos / 10)) === 0) {
              setProgressDetails(`Downloaded ${completedCount} of ${totalRepos} repositories...`);
            }
            
            return newProgress;
          });
        }, Math.min(500, 5000 / totalRepos)); // Faster updates for many repos
        
        // Complete the progress after a delay proportional to repo count
        setTimeout(() => {
          clearInterval(downloadProgressInterval);
          setProgressPercent(100);
          setProgressDetails('Import complete!');
          
          // Show success UI
          setTimeout(() => {
            setShowSuccessCard(true);
            setShowConfetti(true);
            setImportResults(response.data.results || []);
          }, 500);
        }, Math.min(3000, 500 + (totalRepos * 100))); // Faster for many repos
      } else {
        // No repos found
        setProgressPercent(100);
        setProgressDetails('No repositories found');
        setError('No repositories were found for this username or organization');
      }
      
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      
      // Reset form
      setImportData({
        username: '',
      });
    } catch (err: any) {
      console.error('Error importing repositories:', err);
      setError(err.response?.data?.error || 'An error occurred while importing repositories. Please try again.');
    } finally {
      setSubmitting(false);
      setProgressPercent(0);
      setProgressDetails('');
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

  // Add a new function to handle keydown in the username input
  const handleEnterKeyForUsername = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleImport();
    }
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
          <LoadingText>{loadingProgress}</LoadingText>
          <LoadingProgressContainer>
            <LoadingProgressBar $progress={progressPercent} />
          </LoadingProgressContainer>
          <LoadingDetails>{progressDetails}</LoadingDetails>
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
            <Form onSubmit={(e) => { e.preventDefault(); handleQuickDownload(); }}>
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
                  <DownloadButton 
                    type="submit" 
                    disabled={submitting || !quickUrl.trim()}
                  >
                    {submitting ? 'Downloading...' : 'Download Repository'}
                  </DownloadButton>
                </UrlForm>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                {success && <SuccessMessage>{success}</SuccessMessage>}
                <InfoText>
                  Enter a Git URL or "username/repo" format for GitHub repositories.
                </InfoText>
              </FormGroup>
            </Form>
          )}
          
          {activeTab === 'bulk' && (
            <Form onSubmit={(e) => { e.preventDefault(); handleImport(); }}>
              <FormGroup>
                <Label htmlFor="username">Username or Organization</Label>
                <Input
                  type="text"
                  id="username"
                  name="username"
                  value={importData.username}
                  onChange={handleImportDataChange}
                  onKeyDown={handleEnterKeyForUsername}
                  placeholder="e.g., octocat"
                  required
                />
                <DownloadButton 
                  type="submit" 
                  disabled={submitting || !importData.username}
                >
                  {submitting ? 'Importing...' : 'Import Repositories'}
                </DownloadButton>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                {success && <SuccessMessage>{success}</SuccessMessage>}
                <InfoText>
                  Enter GitHub username/organization to import their public repositories.
                </InfoText>
              </FormGroup>
            </Form>
          )}
        </>
      )}
    </Container>
  );
};

export default AddRepository; 