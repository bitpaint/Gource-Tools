import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaGithub, FaPlus, FaSync, FaTrash, FaEdit, FaCopy, FaCalendarAlt, FaFolder } from 'react-icons/fa';
import api from '../services/api';
import { useNotification } from '../components/ui/NotificationContext';

interface Repository {
  id: string;
  name: string;
  url: string | null;
  local_path: string | null;
  branch_default: string;
  last_updated: string;
}

const Container = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const TitleIcon = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
`;

const AddButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #4CAF50; /* Vert */
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.3s;

  &:hover {
    background-color: #388E3C; /* Vert foncé */
  }
`;

const ListContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const ListHeader = styled.div`
  background-color: ${({ theme }) => theme.colors.dark};
  padding: 0.75rem 1.5rem;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  color: ${({ theme }) => theme.colors.white};
  font-weight: bold;
  align-items: center;
`;

const ListHeaderItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ListItem = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
  align-items: center;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const RepoNameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const RepoIconWrapper = styled.div`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.dark};
  display: flex;
  align-items: center;
`;

const RepoName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const PathContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  max-width: 250px;
`;

const PathValue = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textLight};
  display: flex;
  align-items: center;
  
  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: ${({ theme }) => theme.colors.text};

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
    transform: scale(1.1);
  }

  &.edit {
    color: ${({ theme }) => theme.colors.primary};
  }

  &.sync {
    color: #4CAF50; /* Vert */
    &:hover {
      color: #388E3C; /* Vert foncé */
    }
  }

  &.delete {
    color: #F44336; /* Rouge */
    &:hover {
      color: #D32F2F; /* Rouge foncé */
    }
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const DateCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const DateIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.primary};
  opacity: 0.6;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const EmptyTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const EmptyText = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 1.5rem;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 1.5rem;
  opacity: 0.4;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.textLight};
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.danger};
`;

const RepositoryList: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const response = await api.repositories.getAll();
      setRepositories(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading repositories:', err);
      setError('Unable to load repositories. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncRepository = async (id: string) => {
    try {
      await api.repositories.sync(id);
      fetchRepositories(); // Refresh the list after synchronization
    } catch (err) {
      console.error('Error synchronizing repository:', err);
      // Handle error (add notification)
    }
  };

  const handleDeleteRepository = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this repository? This action is irreversible.')) {
      return;
    }

    try {
      await api.repositories.delete(id);
      fetchRepositories(); // Refresh the list after deletion
    } catch (err) {
      console.error('Error deleting repository:', err);
      // Handle error (add notification)
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      // Fallback for older browsers or if permissions aren't granted
      if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
      }
      
      await navigator.clipboard.writeText(text);
      addNotification({
        type: 'success',
        message: 'Path copied to clipboard!',
        duration: 3000
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
      addNotification({
        type: 'error',
        message: 'Failed to copy path to clipboard',
        duration: 3000
      });
    }
  };

  // Fallback copy method for older browsers
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Make the textarea out of viewport
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        addNotification({
          type: 'success',
          message: 'Path copied to clipboard!',
          duration: 3000
        });
      } else {
        addNotification({
          type: 'error', 
          message: 'Failed to copy path',
          duration: 3000
        });
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      addNotification({
        type: 'error',
        message: 'Failed to copy path to clipboard',
        duration: 3000
      });
    }

    document.body.removeChild(textArea);
  };

  return (
    <Container>
      <Header>
        <Title>
          <TitleIcon><FaGithub size={24} /></TitleIcon>
          Git Repositories
        </Title>
        <AddButton to="/repositories/add">
          <FaPlus /> Add Repository
        </AddButton>
      </Header>

      {loading ? (
        <LoadingIndicator>Loading repositories...</LoadingIndicator>
      ) : error ? (
        <ErrorMessage>Error: {error}</ErrorMessage>
      ) : repositories.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <FaGithub />
          </EmptyIcon>
          <EmptyTitle>No Repositories</EmptyTitle>
          <EmptyText>
            Add a Git repository to start generating Gource visualizations.
          </EmptyText>
          <AddButton to="/repositories/add">
            <FaPlus /> Add Repository
          </AddButton>
        </EmptyState>
      ) : (
        <ListContainer>
          <ListHeader>
            <ListHeaderItem>
              <FaGithub /> Repository
            </ListHeaderItem>
            <ListHeaderItem>
              <FaFolder /> Path
            </ListHeaderItem>
            <ListHeaderItem>
              <FaCalendarAlt /> Last Updated
            </ListHeaderItem>
            <div>Actions</div>
          </ListHeader>
          {repositories.map((repo) => (
            <ListItem key={repo.id}>
              <RepoNameCell>
                <RepoIconWrapper>
                  <FaGithub />
                </RepoIconWrapper>
                <RepoName>{repo.name}</RepoName>
              </RepoNameCell>
              <PathContainer>
                {repo.local_path ? (
                  <>
                    <PathValue title={repo.local_path}>
                      {repo.local_path}
                    </PathValue>
                    <CopyButton 
                      onClick={() => copyToClipboard(repo.local_path || '')}
                      title="Copy path to clipboard"
                    >
                      <FaCopy size={14} />
                    </CopyButton>
                  </>
                ) : (
                  'Not available'
                )}
              </PathContainer>
              <DateCell>
                <DateIcon><FaCalendarAlt size={14} /></DateIcon>
                {formatDate(repo.last_updated)}
              </DateCell>
              <Actions>
                <ActionButton 
                  className="edit" 
                  onClick={() => navigate(`/repositories/${repo.id}`)}
                  title="Edit"
                >
                  <FaEdit />
                </ActionButton>
                {repo.local_path && (
                  <ActionButton 
                    className="sync" 
                    onClick={() => handleSyncRepository(repo.id)}
                    title="Synchronize"
                  >
                    <FaSync />
                  </ActionButton>
                )}
                <ActionButton 
                  className="delete" 
                  onClick={() => handleDeleteRepository(repo.id)}
                  title="Delete"
                >
                  <FaTrash />
                </ActionButton>
              </Actions>
            </ListItem>
          ))}
        </ListContainer>
      )}
    </Container>
  );
};

export default RepositoryList; 
