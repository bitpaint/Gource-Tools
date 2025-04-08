import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaGithub, FaPlus, FaSync, FaTrash, FaEdit, FaCopy, FaCalendarAlt, FaFolder, FaSearch, FaTags, FaTimes } from 'react-icons/fa';
import api from '../services/api';
import { useNotification } from '../components/ui/NotificationContext';
import { useGitHubToken } from '../components/ui/GitHubTokenContext';

interface Repository {
  id: string;
  name: string;
  username: string | null;
  url: string | null;
  local_path: string | null;
  branch_default: string;
  tags: string | null;
  last_updated: string;
}

// Type pour les dépôts groupés par nom d'utilisateur
interface GroupedRepositories {
  [username: string]: Repository[];
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
  grid-template-columns: minmax(200px, 1fr) 90px 1fr auto auto;
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
  grid-template-columns: minmax(200px, 1fr) 90px 1fr auto auto;
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

const RepoCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const RepoName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const PathContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
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

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SearchInput = styled.div`
  position: relative;
  flex: 1;
  
  input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid ${({ theme }) => theme.colors.borderColor};
    border-radius: 4px;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}30;
    }
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textLight};
  display: flex;
  align-items: center;
`;

const ActiveFiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const FilterTag = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${({ theme }) => theme.colors.primary}20;
  border: 1px solid ${({ theme }) => theme.colors.primary}40;
  color: ${({ theme }) => theme.colors.primary};
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  
  button {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 0.8rem;
    
    &:hover {
      color: ${({ theme }) => theme.colors.danger};
    }
  }
`;

const ExpandableTagsList = styled.div`
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const TagFilterButton = styled.button<{ isActive: boolean }>`
  background-color: ${({ theme, isActive }) => isActive ? theme.colors.primary : theme.colors.light};
  color: ${({ theme, isActive }) => isActive ? theme.colors.white : theme.colors.text};
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({ theme, isActive }) => isActive ? theme.colors.primary : theme.colors.border};
  }
`;

const AuthorBadge = styled.span`
  background-color: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`;

const TagBadge = styled.span`
  background-color: ${({ theme }) => theme.colors.secondary}15;
  color: ${({ theme }) => theme.colors.secondary};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-right: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary}25;
  }
`;

const TagsCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  min-height: 30px;
  padding: 4px 0;
`;

const BadgesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
`;

const RepositoryList: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [groupedRepositories, setGroupedRepositories] = useState<GroupedRepositories>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { hasToken, showTokenDialog } = useGitHubToken();

  // Fonction pour extraire le nom d'utilisateur et le nom du dépôt à partir de l'URL Git
  const extractRepoInfo = (url: string): { username: string; repoName: string } => {
    if (!url) return { username: '', repoName: '' };
    
    // Nettoyer l'URL
    let cleanUrl = url.trim().replace(/\.git$/, '');
    
    // Gérer les URLs SSH et HTTPS
    const sshMatch = cleanUrl.match(/git@github\.com:([^/]+)\/([^/]+)/);
    const httpsMatch = cleanUrl.match(/https:\/\/github\.com\/([^/]+)\/([^/]+)/);
    
    if (sshMatch) {
      return {
        username: sshMatch[1],
        repoName: sshMatch[2]
      };
    } else if (httpsMatch) {
      return {
        username: httpsMatch[1],
        repoName: httpsMatch[2]
      };
    }
    
    // Si on ne peut pas extraire, retourner des valeurs par défaut
    return { username: '', repoName: '' };
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  useEffect(() => {
    // Extraire et regrouper les tags disponibles
    const tagsSet = new Set<string>();
    repositories.forEach(repo => {
      if (repo.tags) {
        const repoTags = repo.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        repoTags.forEach(tag => tagsSet.add(tag));
      }
    });
    setAvailableTags(Array.from(tagsSet).sort());
  }, [repositories]);

  useEffect(() => {
    // Filtrer les dépôts en fonction de la recherche et des tags sélectionnés
    const filteredRepos = repositories.filter(repo => {
      // Filtre par terme de recherche
      const matchesSearch = searchTerm === '' || 
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (repo.url && extractRepoInfo(repo.url).username.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtre par tags
      const matchesTags = selectedTags.length === 0 || 
        (repo.tags && selectedTags.every(tag => 
          repo.tags!.split(',').map(t => t.trim()).includes(tag)
        ));
      
      return matchesSearch && matchesTags;
    });
    
    // Regrouper les dépôts filtrés par nom d'utilisateur
    const grouped: GroupedRepositories = {};
    
    filteredRepos.forEach(repo => {
      const repoInfo = repo.url ? extractRepoInfo(repo.url) : { username: '', repoName: '' };
      const username = repoInfo.username || repo.username || '';
      
      // Ne pas créer de groupe pour les dépôts sans utilisateur
      if (username) {
        if (!grouped[username]) {
          grouped[username] = [];
        }
        grouped[username].push(repo);
      }
    });
    
    setGroupedRepositories(grouped);
  }, [repositories, searchTerm, selectedTags]);

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
      
      addNotification({
        type: 'success',
        message: 'Repository synchronized successfully',
        duration: 3000
      });
      
      // Rafraîchir la liste pour obtenir les tags mis à jour
      fetchRepositories();
    } catch (err) {
      console.error('Error synchronizing repository:', err);
      addNotification({
        type: 'error',
        message: 'Failed to synchronize repository',
        duration: 3000
      });
    }
  };

  const handleDeleteRepository = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this repository? This action is irreversible.')) {
      return;
    }

    try {
      await api.repositories.delete(id);
      fetchRepositories(); // Refresh the list after deletion
      addNotification({
        type: 'success',
        message: 'Repository deleted successfully',
        duration: 3000
      });
    } catch (err) {
      console.error('Error deleting repository:', err);
      addNotification({
        type: 'error',
        message: 'Failed to delete repository',
        duration: 3000
      });
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

  // Fonction pour afficher les tags d'un dépôt
  const renderTags = (tags: string | null) => {
    if (!tags) return <span style={{ color: '#999', fontStyle: 'italic' }}>No tags</span>;
    
    const tagList = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    
    if (tagList.length === 0) return <span style={{ color: '#999', fontStyle: 'italic' }}>No tags</span>;
    
    return (
      <>
        {tagList.map((tag, index) => (
          <TagBadge
            key={index}
            onClick={() => handleTagFilter(tag)}
            title="Cliquer pour filtrer par ce tag"
          >
            <FaTags size={12} />
            {tag}
          </TagBadge>
        ))}
      </>
    );
  };

  const handleTagFilter = (tag: string) => {
    setSelectedTags(prevTags => 
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  };

  const removeTagFilter = (tag: string) => {
    setSelectedTags(prevTags => prevTags.filter(t => t !== tag));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
  };

  // Dans le composant RepositoryList, j'ajoute une fonction de debug pour afficher les tags
  const debugTags = () => {
    console.log("=== DEBUG TAGS ===");
    console.log("Available tags:", availableTags);
    
    repositories.forEach(repo => {
      console.log(`Repo: ${repo.name}`);
      console.log(`Has tags: ${!!repo.tags}`);
      if (repo.tags) {
        console.log(`Tags: ${repo.tags}`);
        const tagList = repo.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        console.log(`Parsed tags (${tagList.length}):`, tagList);
      }
      console.log("---");
    });
    
    addNotification({
      type: 'info',
      message: 'Tags info printed to console',
      duration: 2000
    });
  };

  // Function to force update GitHub tags
  const handleForceUpdateTags = async () => {
    try {
      setLoading(true);
      addNotification({
        type: 'info',
        message: 'Updating tags...',
        duration: 2000
      });
      
      const response = await api.repositories.forceUpdateTags();
      
      // Check if we hit the rate limit
      if (response.status === 429) {
        addNotification({
          type: 'warning',
          message: 'GitHub API rate limit reached. Some repositories were updated, but the process was stopped. Please try again later or check your authentication token.',
          duration: 5000
        });
      } else {
        addNotification({
          type: 'success',
          message: response.data.message,
          duration: 3000
        });
      }
      
      // Reload repositories after update
      await fetchRepositories();
    } catch (error: any) {
      console.error('Error updating tags:', error);
      
      // Check if it's a rate limit error
      if (error.response && error.response.status === 429) {
        addNotification({
          type: 'error',
          message: 'GitHub API rate limit reached. Please try again later or check your authentication token.',
          duration: 5000
        });
      } else {
        addNotification({
          type: 'error',
          message: 'Error updating tags. Please try again later.',
          duration: 3000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          <TitleIcon><FaGithub size={24} /></TitleIcon>
          Git Repositories
        </Title>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={debugTags}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#FF9800',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Debug Tags
          </button>
          <button 
            onClick={handleForceUpdateTags}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#2196F3',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Update GitHub Tags
          </button>
          <AddButton to="/repositories/add">
            <FaPlus /> Add Repository
          </AddButton>
        </div>
      </Header>

      <SearchContainer>
        <SearchRow>
          <SearchInput>
            <SearchIcon>
              <FaSearch />
            </SearchIcon>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un dépôt ou un utilisateur..."
            />
          </SearchInput>
        </SearchRow>
        
        <ActiveFiltersContainer>
          {searchTerm && (
            <FilterTag>
              Recherche: {searchTerm}
              <button onClick={() => setSearchTerm('')}>
                <FaTimes />
              </button>
            </FilterTag>
          )}
          
          {selectedTags.map(tag => (
            <FilterTag key={tag}>
              {tag}
              <button onClick={() => removeTagFilter(tag)}>
                <FaTimes />
              </button>
            </FilterTag>
          ))}
          
          {(selectedTags.length > 0 || searchTerm) && (
            <FilterTag>
              <button onClick={clearFilters}>
                Effacer tous les filtres
              </button>
            </FilterTag>
          )}
        </ActiveFiltersContainer>
        
        {availableTags.length > 0 && (
          <ExpandableTagsList>
            {availableTags.map(tag => (
              <TagFilterButton
                key={tag}
                isActive={selectedTags.includes(tag)}
                onClick={() => handleTagFilter(tag)}
              >
                {tag}
              </TagFilterButton>
            ))}
          </ExpandableTagsList>
        )}
      </SearchContainer>

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
      ) : Object.keys(groupedRepositories).length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <FaSearch />
          </EmptyIcon>
          <EmptyTitle>Aucun résultat</EmptyTitle>
          <EmptyText>
            Aucun dépôt ne correspond aux critères de recherche.
          </EmptyText>
          <button onClick={clearFilters}>Effacer les filtres</button>
        </EmptyState>
      ) : (
        <ListContainer>
          <ListHeader>
            <ListHeaderItem>Auteur / Dépôt</ListHeaderItem>
            <ListHeaderItem>Path</ListHeaderItem>
            <ListHeaderItem>Tags</ListHeaderItem>
            <ListHeaderItem>Last Updated</ListHeaderItem>
            <div>Actions</div>
          </ListHeader>
          {Object.values(groupedRepositories).flat().map((repo) => (
            <ListItem key={repo.id}>
              <RepoCell>
                <AuthorBadge>
                  <FaGithub size={12} />
                  {repo.url ? extractRepoInfo(repo.url).username : repo.username || ''}
                </AuthorBadge>
                <RepoName>{repo.name}</RepoName>
              </RepoCell>
              <PathContainer>
                {repo.local_path ? (
                  <CopyButton 
                    onClick={() => copyToClipboard(repo.local_path || '')}
                    title={`Copy path: ${repo.local_path}`}
                  >
                    <FaCopy size={16} />
                  </CopyButton>
                ) : (
                  'N/A'
                )}
              </PathContainer>
              <TagsCell>
                {repo.tags && renderTags(repo.tags)}
              </TagsCell>
              <DateCell>
                <DateIcon><FaCalendarAlt size={14} /></DateIcon>
                {formatDate(repo.last_updated)}
              </DateCell>
              <Actions>
                <ActionButton 
                  className="sync" 
                  onClick={() => handleSyncRepository(repo.id)}
                  title="Synchronize"
                >
                  <FaSync />
                </ActionButton>
                <ActionButton 
                  className="edit" 
                  onClick={() => navigate(`/repositories/${repo.id}`)}
                  title="Edit"
                >
                  <FaEdit />
                </ActionButton>
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
