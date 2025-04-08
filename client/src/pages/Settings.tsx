import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaGithub, FaSave, FaInfoCircle, FaCog, FaPaintBrush, FaTrash, FaKey, FaCheck, FaTimes } from 'react-icons/fa';
import api from '../services/api';
import { useNotification } from '../components/ui/NotificationContext';
import { useGitHubToken } from '../components/ui/GitHubTokenContext';

const SettingsContainer = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  margin-bottom: 20px;
  color: #333;
  font-size: 24px;
`;

const Section = styled.section`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 10px;
    color: #4078c0;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    border-color: #4078c0;
    outline: none;
  }
`;

const HelpText = styled.p`
  font-size: 13px;
  color: #666;
  margin-top: 5px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  background: #4078c0;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #2f5bb7;
  }
  
  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 8px;
  }
`;

const DangerButton = styled(Button)`
  background: #e74c3c;
  
  &:hover {
    background: #c0392b;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin-top: 5px;
  padding: 8px;
  background: #fff9f9;
  border-radius: 4px;
  border-left: 3px solid #e74c3c;
`;

const SuccessMessage = styled.div`
  color: #2ecc71;
  font-size: 14px;
  margin-top: 5px;
  padding: 8px;
  background: #f8fffa;
  border-radius: 4px;
  border-left: 3px solid #2ecc71;
`;

const InfoMessage = styled.div`
  color: #3498db;
  font-size: 14px;
  margin-top: 5px;
  padding: 12px;
  background: #f0f7ff;
  border-radius: 4px;
  border-left: 3px solid #3498db;
  display: flex;
  align-items: flex-start;
  
  svg {
    margin-right: 8px;
    margin-top: 2px;
    flex-shrink: 0;
  }
`;

const TokenStatusCard = styled.div<{ $hasToken: boolean }>`
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  background-color: ${props => props.$hasToken ? '#f0fff4' : '#fff5f5'};
  border: 1px solid ${props => props.$hasToken ? '#68d391' : '#feb2b2'};
`;

const TokenIcon = styled.div<{ $hasToken: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.$hasToken ? '#38a169' : '#e53e3e'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  
  svg {
    font-size: 20px;
  }
`;

const TokenInfo = styled.div`
  flex: 1;
`;

const TokenTitle = styled.h3`
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
`;

const TokenDescription = styled.p`
  margin: 0;
  color: #666;
  font-size: 14px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const Settings: React.FC = () => {
  const [githubToken, setGithubToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { addNotification } = useNotification();
  const { hasToken, tokenSource, showTokenDialog, removeToken } = useGitHubToken();

  const handleSaveToken = async () => {
    if (!githubToken.trim()) {
      addNotification({
        type: 'error',
        message: 'Please enter a GitHub token'
      });
      return;
    }

    setLoading(true);
    setTestResult(null);
    
    try {
      const response = await api.settings.saveGithubToken(githubToken);
      
      if (response.data.success) {
        // Tester le token
        const testResponse = await api.settings.testGithubToken();
        
        setTestResult({
          success: testResponse.data.success,
          message: testResponse.data.message
        });
        
        if (testResponse.data.success) {
          addNotification({
            type: 'success',
            message: 'GitHub token saved successfully'
          });
          // Vider le champ de saisie pour des raisons de sécurité
          setGithubToken('');
          // Rafraîchir la page après un court délai
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          addNotification({
            type: 'warning',
            message: 'Token saved but validation failed'
          });
        }
      } else {
        addNotification({
          type: 'error',
          message: 'Error saving token'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Error saving token'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveToken = async () => {
    if (!window.confirm('Are you sure you want to remove your GitHub token? This will limit your API usage.')) {
      return;
    }
    
    setLoading(true);
    
    try {
      await removeToken();
      addNotification({
        type: 'success',
        message: 'GitHub token removed successfully'
      });
      
      // Rafraîchir la page après un court délai
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Error removing token'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsContainer>
      <Title>Application Settings</Title>
      
      {/* GitHub Section */}
      <Section>
        <SectionTitle>
          <FaGithub /> GitHub Configuration
        </SectionTitle>
        
        <TokenStatusCard $hasToken={hasToken}>
          <TokenIcon $hasToken={hasToken}>
            {hasToken ? <FaCheck /> : <FaTimes />}
          </TokenIcon>
          <TokenInfo>
            <TokenTitle>
              {hasToken 
                ? 'GitHub Token Configured' 
                : 'No GitHub Token Found'}
            </TokenTitle>
            <TokenDescription>
              {hasToken 
                ? `Your GitHub token is currently ${tokenSource === 'env' 
                    ? 'stored in your .env file' 
                    : tokenSource === 'gitCredentialManager' 
                      ? 'found in Git Credential Manager' 
                      : 'configured via GitHub CLI'}.`
                : 'Without a GitHub token, you are limited to 60 API requests per hour.'}
            </TokenDescription>
          </TokenInfo>
        </TokenStatusCard>
        
        {hasToken ? (
          <ButtonGroup>
            <DangerButton onClick={handleRemoveToken} disabled={loading}>
              <FaTrash /> Remove Token
            </DangerButton>
          </ButtonGroup>
        ) : (
          <>
            <InfoMessage>
              <FaInfoCircle />
              <div>
                <strong>Why do I need a GitHub token?</strong>
                <p>
                  GitHub API has rate limits for unauthenticated requests (60 per hour).
                  With a token, this limit increases to 5,000 requests per hour, ensuring better performance
                  when working with GitHub repositories, especially when fetching tags and metadata.
                </p>
              </div>
            </InfoMessage>
            
            <ButtonGroup>
              <Button onClick={showTokenDialog}>
                <FaKey /> Configure GitHub Token
              </Button>
            </ButtonGroup>
            
            <FormGroup style={{ marginTop: '20px' }}>
              <Label htmlFor="github-token">Or Enter GitHub Personal Access Token</Label>
              <Input
                type="password"
                id="github-token"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_your_github_token"
              />
              <HelpText>
                You can create a token in your GitHub settings under Developer Settings {'>'} Personal Access Tokens.
                Required permissions: 'public_repo' or 'repo' (for private repositories).
              </HelpText>
              
              <Button 
                onClick={handleSaveToken} 
                disabled={loading || !githubToken.trim()}
                style={{ marginTop: '10px' }}
              >
                <FaSave /> Save Token
              </Button>
              
              {testResult && (
                testResult.success ? (
                  <SuccessMessage>
                    {testResult.message}
                  </SuccessMessage>
                ) : (
                  <ErrorMessage>
                    {testResult.message}
                  </ErrorMessage>
                )
              )}
            </FormGroup>
          </>
        )}
      </Section>

      {/* Gource Settings Section */}
      <Section>
        <SectionTitle>
          <FaPaintBrush /> Gource Configuration
        </SectionTitle>
        <p>Gource settings are configured at the project level. Access a specific project to customize Gource rendering options.</p>
      </Section>

      {/* App Settings Section */}
      <Section>
        <SectionTitle>
          <FaCog /> Application Configuration
        </SectionTitle>
        <p>Additional options coming in a future update.</p>
      </Section>
    </SettingsContainer>
  );
};

export default Settings; 