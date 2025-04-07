import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaGithub, FaPlus, FaSync, FaTrash, FaEdit, FaCopy, FaCalendarAlt, FaFolder, FaSearch, FaTags, FaTimes } from 'react-icons/fa';
import api from '../services/api';
import { useNotification } from '../components/ui/NotificationContext';

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
  align-items: start;
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

const UserGroup = styled.div`
  margin-bottom: 2rem;
`;

const UserHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 4px;
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
`;

const UserName = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  color: ${({ theme }) => theme.colors.text};
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Tag = styled.span`
  background-color: ${({ theme }) => theme.colors.light};
  color: ${({ theme }) => theme.colors.text};
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
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

const TagFilterToggle = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
  transition: color 0.2s;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primaryDark};
    text-decoration: underline;
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
  margin-right: 0.5rem;
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
  const [showTagFilters, setShowTagFilters] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();

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

  // Fonction pour afficher les tags d'un dépôt
  const renderTags = (tags: string | null) => {
    if (!tags) return null;
    const tagList = tags.split(',').map(tag => tag.trim());
    return (
      <BadgesContainer>
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
      </BadgesContainer>
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
        
        {(selectedTags.length > 0 || searchTerm) && (
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
        )}
        
        {availableTags.length > 0 && (
          <>
            <TagFilterToggle onClick={() => setShowTagFilters(!showTagFilters)}>
              <FaTags />
              {showTagFilters ? 'Masquer les tags' : 'Filtrer par tags'}
            </TagFilterToggle>
            
            {showTagFilters && (
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
          </>
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
        Object.entries(groupedRepositories).map(([username, repos]) => (
          <UserGroup key={username}>
            <UserHeader>
              <FaGithub size={20} />
              <UserName>{username}</UserName>
            </UserHeader>
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
              {repos.map((repo) => (
                <ListItem key={repo.id}>
                  <RepoNameCell>
                    <RepoIconWrapper>
                      <FaGithub />
                    </RepoIconWrapper>
                    <div>
                      <RepoName>{repo.name}</RepoName>
                      <BadgesContainer>
                        {repo.url && (
                          <AuthorBadge>
                            <FaGithub size={12} />
                            {extractRepoInfo(repo.url).username || repo.username || ''}
                          </AuthorBadge>
                        )}
                        {renderTags(repo.tags)}
                      </BadgesContainer>
                    </div>
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
          </UserGroup>
        ))
      )}
    </Container>
  );
};

export default RepositoryList; 
