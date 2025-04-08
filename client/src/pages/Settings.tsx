import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaGithub, FaSave, FaInfoCircle, FaCog, FaPaintBrush } from 'react-icons/fa';
import api from '../services/api';
import { useNotification } from '../components/ui/NotificationContext';

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

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin-top: 5px;
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

const Settings: React.FC = () => {
  const [githubToken, setGithubToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [tokenSource, setTokenSource] = useState<string | null>(null);
  const { addNotification } = useNotification();

  // Check if a token already exists
  useEffect(() => {
    const checkToken = async () => {
      try {
        const response = await api.settings.checkGithubToken();
        if (response.data.hasToken) {
          setGithubToken('••••••••••••••••••••'); // Token masked for security
          setTokenSource(response.data.source);
        }
      } catch (error) {
        console.error('Error checking token:', error);
      }
    };
    
    checkToken();
  }, []);

  const handleSaveToken = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const response = await api.settings.saveGithubToken(githubToken);
      
      if (response.data.success) {
        addNotification({
          type: 'success',
          message: 'GitHub token saved successfully'
        });
        
        // Test the token
        await testGithubToken();
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
  
  const testGithubToken = async () => {
    try {
      const response = await api.settings.testGithubToken();
      
      setTestResult({
        success: response.data.success,
        message: response.data.message
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Error testing token'
      });
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
        
        {tokenSource && (
          <InfoMessage>
            <FaInfoCircle />
            <div>
              <strong>Automatic GitHub Token Detection</strong>
              <p>
                The application has automatically detected a valid GitHub token from {
                  tokenSource === 'env' ? 'your .env file' :
                  tokenSource === 'gitCredentialManager' ? 'Git Credential Manager (Git\'s secure storage)' :
                  tokenSource === 'githubCLI' ? 'GitHub CLI' : 'an unknown source'
                }.
                This is not a security issue, but a feature to facilitate authentication.
                You can replace this token with your own if you wish.
              </p>
            </div>
          </InfoMessage>
        )}
        
        <FormGroup>
          <Label htmlFor="github-token">GitHub Personal Access Token</Label>
          <Input
            type="password"
            id="github-token"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="ghp_your_github_token"
          />
          {tokenSource && (
            <SuccessMessage>
              {tokenSource === 'env' && "✅ Token found in .env file"}
              {tokenSource === 'gitCredentialManager' && "✅ Token found in Git Credential Manager"}
              {tokenSource === 'githubCLI' && "✅ Token found via GitHub CLI"}
            </SuccessMessage>
          )}
          <HelpText>
            This token is used to increase GitHub API rate limits and access more information.
            You can create a token in your GitHub settings under Developer Settings {'>'} Personal Access Tokens.
            Required permissions: 'public_repo' or 'repo' (for private repositories).
          </HelpText>
        </FormGroup>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button 
            onClick={handleSaveToken} 
            disabled={loading || !githubToken}
          >
            <FaSave /> Save Token
          </Button>
          
          {tokenSource && (
            <Button 
              onClick={testGithubToken} 
              disabled={loading}
              style={{ background: '#2ecc71' }}
            >
              Test Current Token
            </Button>
          )}
        </div>
        
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