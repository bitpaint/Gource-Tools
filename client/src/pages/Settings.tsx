import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaGithub, FaSave, FaInfoCircle, FaCog, FaPaintBrush, FaTrash, FaKey, FaCheck, FaTimes, FaRegClock, FaRocket, FaExternalLinkAlt } from 'react-icons/fa';
import api from '../services/api';
import { useNotification } from '../components/ui/NotificationContext';
import { useGitHubToken } from '../components/ui/GitHubTokenContext';
import Confetti from 'react-confetti';

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
  background-color: ${props => props.$hasToken ? '#38a169' : '#fff'};
  border: 2px solid ${props => props.$hasToken ? '#38a169' : '#e53e3e'};
  color: ${props => props.$hasToken ? 'white' : '#e53e3e'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  font-size: 20px;
`;

const TokenInfo = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TokenTextInfo = styled.div`
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

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #e53e3e;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: #fff5f5;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const LinkButton = styled.a`
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
  text-decoration: none;
  
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

const ComparisonCard = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 20px 0;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const PlanColumn = styled.div<{ $isPro?: boolean }>`
  padding: 20px;
  background: ${props => props.$isPro ? '#f0f7ff' : '#f5f5f5'};
  border-left: ${props => props.$isPro ? '4px solid #0366d6' : 'none'};
  
  h3 {
    font-size: 18px;
    margin: 0 0 15px 0;
    color: ${props => props.$isPro ? '#0366d6' : '#666'};
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    color: #333;
    
    svg {
      color: #0366d6;
    }
  }
`;

const SetupTime = styled.div`
  font-size: 14px;
  color: #666;
  margin: 15px 0;
  display: flex;
  align-items: center;
  gap: 5px;
  
  svg {
    color: #0366d6;
  }
`;

const RateLimit = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 15px 0;
  
  span {
    font-size: 14px;
    color: #666;
    font-weight: normal;
  }
`;

const ScopeInfo = styled.div`
  background: #f6f8fa;
  border-radius: 6px;
  padding: 12px;
  margin: 15px 0;
  font-size: 14px;
  color: #666;
  
  strong {
    color: #333;
    display: block;
    margin-bottom: 4px;
  }
`;

const SaveButton = styled(Button)<{ $loading?: boolean }>`
  min-width: 140px;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  
  ${props => props.$loading && `
    &:before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 200%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      animation: loading 1.5s infinite;
    }
  `}
  
  @keyframes loading {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(100%);
    }
  }
`;

const Settings: React.FC = () => {
  const [githubToken, setGithubToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { addNotification } = useNotification();
  const { hasToken, tokenSource, removeToken } = useGitHubToken();

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
        const testResponse = await api.settings.testGithubToken();
        
        setTestResult({
          success: testResponse.data.success,
          message: testResponse.data.message
        });
        
        if (testResponse.data.success) {
          setShowConfetti(true);
          addNotification({
            type: 'success',
            message: '🎉 GitHub token saved successfully!'
          });
          setGithubToken('');
          setTimeout(() => {
            setShowConfetti(false);
            window.location.reload();
          }, 2000);
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
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={800}
          gravity={0.25}
          initialVelocityY={30}
          tweenDuration={50}
          colors={['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']}
        />
      )}
      <Title>Application Settings</Title>
      
      {/* GitHub Section */}
      <Section>
        <SectionTitle>
          🔑 GitHub Configuration
        </SectionTitle>
        
        <TokenStatusCard $hasToken={hasToken}>
          <TokenIcon $hasToken={hasToken}>
            {hasToken ? '✓' : '×'}
          </TokenIcon>
          <TokenInfo>
            <TokenTextInfo>
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
                  : 'Configure a GitHub token to increase your API rate limits.'}
              </TokenDescription>
            </TokenTextInfo>
            {hasToken && (
              <DeleteButton onClick={handleRemoveToken} disabled={loading}>
                🗑️
              </DeleteButton>
            )}
          </TokenInfo>
        </TokenStatusCard>

        {!hasToken && (
          <>
            <ComparisonCard>
              <PlanColumn>
                <h3>🐢 Without Token</h3>
                <SetupTime>
                  Setup: 0 min
                </SetupTime>
                <RateLimit>
                  60 <span>requests/hour</span>
                </RateLimit>
                <FeatureList>
                  <li>✓ Access to public repositories</li>
                  <li>✓ Basic GitHub API usage</li>
                  <li>× Limited rate for repository scanning</li>
                </FeatureList>
              </PlanColumn>
              
              <PlanColumn $isPro>
                <h3>🚀 With Free Token</h3>
                <SetupTime>
                  Quick Setup: ~1 min
                </SetupTime>
                <RateLimit>
                  5,000 <span>requests/hour</span>
                </RateLimit>
                <FeatureList>
                  <li>✓ Access to all repositories</li>
                  <li>✓ Increased API rate limits</li>
                  <li>✓ Faster repository scanning</li>
                </FeatureList>
                <ScopeInfo>
                  <strong>Required token scopes (100% free):</strong>
                  • For public repositories: <code>public_repo</code><br />
                  • For private repositories: <code>repo</code>
                </ScopeInfo>
                <LinkButton 
                  href="https://github.com/settings/tokens/new" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Create your free token ✨
                </LinkButton>
              </PlanColumn>
            </ComparisonCard>

            <ButtonGroup>
              <Input
                type="password"
                placeholder="Enter your free GitHub token"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
              />
              <SaveButton 
                onClick={handleSaveToken} 
                disabled={loading || !githubToken.trim()}
                $loading={loading}
              >
                {loading ? 'Saving...' : 'Save Token'}
              </SaveButton>
            </ButtonGroup>
          </>
        )}
        
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
          🎨 Gource Configuration
        </SectionTitle>
        <p>Gource settings are configured at the project level. Access a specific project to customize Gource rendering options.</p>
      </Section>

      {/* App Settings Section */}
      <Section>
        <SectionTitle>
          ⚙️ Application Configuration
        </SectionTitle>
        <p>Additional options coming in a future update.</p>
      </Section>
    </SettingsContainer>
  );
};

export default Settings; 