import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import api from '../../services/api';
import GitHubTokenDialog from './GitHubTokenDialog';

interface GitHubTokenContextType {
  hasToken: boolean;
  tokenSource: string | null;
  showTokenDialog: () => void;
  removeToken: () => Promise<void>;
}

const GitHubTokenContext = createContext<GitHubTokenContextType | undefined>(undefined);

export const GitHubTokenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [tokenSource, setTokenSource] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);

  const checkForToken = async () => {
    try {
      const response = await api.settings.checkGithubToken();
      setHasToken(response.data.hasToken);
      setTokenSource(response.data.source);
      
      // Si aucun token n'est trouvé et que c'est la première vérification, ouvrir le dialogue
      if (!response.data.hasToken && !initialCheckDone) {
        // Délai court pour permettre au reste de l'application de se charger
        setTimeout(() => {
          setIsDialogOpen(true);
        }, 500);
      }
      
      setInitialCheckDone(true);
    } catch (error) {
      console.error('Erreur lors de la vérification du token GitHub:', error);
      setInitialCheckDone(true);
    }
  };

  useEffect(() => {
    checkForToken();
  }, []);

  const showTokenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    // Vérifier à nouveau le statut du token après la fermeture du dialogue
    checkForToken();
  };

  const removeToken = async () => {
    try {
      await api.settings.removeGithubToken();
      setHasToken(false);
      setTokenSource(null);
    } catch (error) {
      console.error('Erreur lors de la suppression du token GitHub:', error);
    }
  };

  return (
    <GitHubTokenContext.Provider value={{ hasToken, tokenSource, showTokenDialog, removeToken }}>
      {children}
      <GitHubTokenDialog isOpen={isDialogOpen} onClose={handleDialogClose} />
    </GitHubTokenContext.Provider>
  );
};

export const useGitHubToken = () => {
  const context = useContext(GitHubTokenContext);
  if (context === undefined) {
    throw new Error('useGitHubToken must be used within a GitHubTokenProvider');
  }
  return context;
};

export default GitHubTokenContext; 