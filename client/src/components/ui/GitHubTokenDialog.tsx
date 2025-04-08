import React, { useState } from 'react';
import styled from 'styled-components';
import { FaGithub, FaInfoCircle, FaExternalLinkAlt, FaCheck } from 'react-icons/fa';
import { useNotification } from './NotificationContext';
import api from '../../services/api';

interface GitHubTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const DialogContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 600px;
  max-width: 90%;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  padding: 0;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const DialogHeader = styled.div`
  padding: 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eaeaea;
  
  svg {
    color: #333;
    font-size: 24px;
    margin-right: 12px;
  }
`;

const DialogTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
`;

const DialogContent = styled.div`
  padding: 20px;
`;

const DialogFooter = styled.div`
  padding: 15px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #eaeaea;
  background-color: #f9f9f9;
  border-radius: 0 0 8px 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  margin-top: 5px;
  margin-bottom: 10px;
  
  &:focus {
    outline: none;
    border-color: #0366d6;
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
  }
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  margin-bottom: 5px;
  color: #333;
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

const HelpText = styled.div`
  margin-top: 10px;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
`;

const InfoCard = styled.div`
  background-color: #f0f7ff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  border-left: 4px solid #3498db;
  
  h3 {
    margin-top: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    color: #333;
  }
  
  p {
    margin-bottom: 0;
    line-height: 1.5;
    font-size: 14px;
  }
`;

const ScopeOption = styled.div`
  margin: 12px 0;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 10px;
  background-color: #f6f8fa;
`;

const ScopeTitle = styled.div`
  font-weight: 500;
  margin-bottom: 5px;
`;

const ScopeDescription = styled.div`
  font-size: 13px;
  color: #666;
`;

const LinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #0366d6;
  text-decoration: none;
  margin-top: 8px;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #0366d6;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #0353b4;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #f5f5f5;
  color: #333;
  
  &:hover:not(:disabled) {
    background-color: #e5e5e5;
  }
`;

const GitHubTokenDialog: React.FC<GitHubTokenDialogProps> = ({ isOpen, onClose }) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { addNotification } = useNotification();

  if (!isOpen) return null;

  const handleSaveToken = async () => {
    if (!token.trim()) {
      setError('Please enter a GitHub token');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await api.settings.saveGithubToken(token);
      
      if (response.data.success) {
        const testResponse = await api.settings.testGithubToken();
        
        if (testResponse.data.success) {
          setSuccess(`Token valid! Connected as ${testResponse.data.user}`);
          addNotification({
            type: 'success',
            message: 'GitHub token saved successfully'
          });
          
          // Close after short delay to show success message
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          setError(testResponse.data.message || 'Token saved but validation failed');
        }
      } else {
        setError('Error saving token');
      }
    } catch (error) {
      console.error('Error saving GitHub token:', error);
      setError('Error saving token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const skipForNow = () => {
    addNotification({
      type: 'info',
      message: 'Using GitHub API without authentication (limited to 60 requests per hour)',
      duration: 5000
    });
    onClose();
  };

  return (
    <Overlay>
      <DialogContainer>
        <DialogHeader>
          <FaGithub />
          <DialogTitle>GitHub Authentication</DialogTitle>
        </DialogHeader>
        
        <DialogContent>
          <InfoCard>
            <h3><FaInfoCircle /> Why a GitHub token is recommended</h3>
            <p>
              GitHub API limits unauthenticated requests to 60 per hour.
              With a token, this limit increases to 5,000 requests per hour, improving
              performance when working with multiple repositories.
            </p>
            <ScopeOption>
              <ScopeTitle>Required token scopes</ScopeTitle>
              <ScopeDescription>
                <strong>For public repositories only:</strong> Check the <code>public_repo</code> option<br />
                <strong>For private repositories:</strong> Check the <code>repo</code> option (in the main menu)
              </ScopeDescription>
            </ScopeOption>
            <LinkButton 
              href="https://github.com/settings/tokens/new" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Create token on GitHub <FaExternalLinkAlt size={12} />
            </LinkButton>
          </InfoCard>
          
          <Label htmlFor="github-token">GitHub Personal Access Token</Label>
          <Input
            type="password"
            id="github-token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_your_github_token"
          />
          
          <HelpText>
            This token will be stored only in your local .env file.
            You can remove or modify it anytime from the Settings page.
          </HelpText>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}
        </DialogContent>
        
        <DialogFooter>
          <SecondaryButton onClick={skipForNow}>
            Continue without token
          </SecondaryButton>
          <PrimaryButton 
            onClick={handleSaveToken} 
            disabled={loading || !token.trim()}
          >
            {loading ? 'Saving...' : 'Save Token'}
          </PrimaryButton>
        </DialogFooter>
      </DialogContainer>
    </Overlay>
  );
};

export default GitHubTokenDialog; 