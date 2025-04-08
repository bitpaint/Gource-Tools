import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaGithub, FaPlus, FaSync, FaTrash, FaEdit, FaCopy, FaCalendarAlt, FaFolder, FaSearch, FaTags, FaTimes, FaTag } from 'react-icons/fa';
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

const RepoActionButton = styled.button`
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
  position: relative;
`;

const BadgesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
`;

const TagAddButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 50%;
  margin-left: 0.5rem;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.light};
  }
`;

const TagInput = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: white;
  z-index: 10;
  display: flex;
  align-items: center;
  
  input {
    flex: 1;
    border: 1px solid ${({ theme }) => theme.colors.borderColor};
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-size: 0.9rem;
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }
  
  button {
    margin-left: 0.5rem;
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.primary};
      opacity: 0.8;
    }
  }
`;

const TagRemoveButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin-left: 0.25rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.danger};
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  
  &:hover {
    color: ${({ theme }) => theme.colors.danger};
    opacity: 0.8;
  }
`;

// Ajout des nouveaux composants styled pour le groupement et la sélection
const GroupHeader = styled.div`
  background-color: ${({ theme }) => theme.colors.light};
  padding: 0.75rem 1.5rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
`;

const GroupIcon = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const BatchActionsBar = styled.div`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  border-radius: 0 0 8px 8px;
  animation: slideUp 0.3s ease;
  
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
`;

const BatchAction = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

const SelectAllButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.25rem;
  margin-left: 0.5rem;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: underline;
  }
`;

const RepositoryList: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [groupedRepositories, setGroupedRepositories] = useState<GroupedRepositories>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editingTagRepo, setEditingTagRepo] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { hasToken } = useGitHubToken();

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
      
      // Rafraîchir la liste
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

  const startEditingTags = (repoId: string) => {
    setEditingTagRepo(repoId);
    setNewTag('');
  };

  const cancelEditingTags = () => {
    setEditingTagRepo(null);
    setNewTag('');
  };

  const handleAddTag = async (repoId: string) => {
    if (!newTag.trim()) {
      cancelEditingTags();
      return;
    }

    try {
      const repo = repositories.find(r => r.id === repoId);
      if (!repo) return;

      const currentTags = repo.tags ? repo.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const tagToAdd = newTag.trim();
      
      if (currentTags.includes(tagToAdd)) {
        addNotification({
          type: 'warning',
          message: 'Tag already exists',
          duration: 3000
        });
        cancelEditingTags();
        return;
      }

      const newTags = [...currentTags, tagToAdd].join(',');
      
      // Send all required fields to the API
      await api.repositories.update(repoId, { 
        name: repo.name,
        username: repo.username,
        url: repo.url,
        local_path: repo.local_path,
        branch_default: repo.branch_default,
        tags: newTags
      });
      
      // Update local state
      setRepositories(repos => 
        repos.map(r => 
          r.id === repoId ? { ...r, tags: newTags } : r
        )
      );
      
      addNotification({
        type: 'success',
        message: 'Tag added successfully',
        duration: 3000
      });
      
      cancelEditingTags();
    } catch (err) {
      console.error('Error adding tag:', err);
      addNotification({
        type: 'error',
        message: 'Failed to add tag',
        duration: 3000
      });
    }
  };

  const handleRemoveTag = async (repoId: string, tagToRemove: string) => {
    try {
      const repo = repositories.find(r => r.id === repoId);
      if (!repo || !repo.tags) return;

      const currentTags = repo.tags.split(',').map(t => t.trim()).filter(Boolean);
      const newTags = currentTags.filter(tag => tag !== tagToRemove).join(',');
      
      // Send all required fields to the API
      await api.repositories.update(repoId, { 
        name: repo.name,
        username: repo.username,
        url: repo.url,
        local_path: repo.local_path,
        branch_default: repo.branch_default,
        tags: newTags
      });
      
      // Update local state
      setRepositories(repos => 
        repos.map(r => 
          r.id === repoId ? { ...r, tags: newTags } : r
        )
      );
      
      addNotification({
        type: 'success',
        message: 'Tag removed successfully',
        duration: 3000
      });
    } catch (err) {
      console.error('Error removing tag:', err);
      addNotification({
        type: 'error',
        message: 'Failed to remove tag',
        duration: 3000
      });
    }
  };

  // Fonction pour afficher les tags d'un dépôt
  const renderTags = (repo: Repository) => {
    const { id, tags } = repo;
    
    if (editingTagRepo === id) {
      return (
        <TagInput>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Enter new tag"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag(id)}
          />
          <button onClick={() => handleAddTag(id)}>Add</button>
          <button onClick={cancelEditingTags} style={{ backgroundColor: '#ccc' }}>Cancel</button>
        </TagInput>
      );
    }
    
    if (!tags) {
      return (
        <>
          <span style={{ color: '#999', fontStyle: 'italic' }}>No tags</span>
          <TagAddButton onClick={() => startEditingTags(id)}>
            <FaPlus size={14} />
          </TagAddButton>
        </>
      );
    }
    
    const tagList = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    
    if (tagList.length === 0) {
      return (
        <>
          <span style={{ color: '#999', fontStyle: 'italic' }}>No tags</span>
          <TagAddButton onClick={() => startEditingTags(id)}>
            <FaPlus size={14} />
          </TagAddButton>
        </>
      );
    }
    
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
            <TagRemoveButton 
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(id, tag);
              }}
              title="Remove tag"
            >
              <FaTimes size={12} />
            </TagRemoveButton>
          </TagBadge>
        ))}
        <TagAddButton onClick={() => startEditingTags(id)}>
          <FaPlus size={14} />
        </TagAddButton>
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

  // Fonction pour gérer la sélection/désélection d'un dépôt
  const handleSelectRepository = (repoId: string) => {
    setSelectedRepos(prev => 
      prev.includes(repoId)
        ? prev.filter(id => id !== repoId)
        : [...prev, repoId]
    );
  };
  
  // Fonction pour gérer la sélection/désélection d'un groupe entier
  const handleSelectGroup = (username: string) => {
    if (!groupedRepositories[username]) return;
    
    const reposInGroup = groupedRepositories[username].map(repo => repo.id);
    
    // Vérifier si tous les dépôts du groupe sont déjà sélectionnés
    const allSelected = reposInGroup.every(id => selectedRepos.includes(id));
    
    if (allSelected) {
      // Désélectionner tous les dépôts du groupe
      setSelectedRepos(prev => prev.filter(id => !reposInGroup.includes(id)));
    } else {
      // Sélectionner tous les dépôts du groupe
      const newSelected = [...selectedRepos];
      reposInGroup.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      setSelectedRepos(newSelected);
    }
  };
  
  // Fonction pour vérifier si tous les dépôts d'un groupe sont sélectionnés
  const isGroupSelected = (username: string): boolean => {
    const reposInGroup = groupedRepositories[username] || [];
    return reposInGroup.length > 0 && reposInGroup.every(repo => selectedRepos.includes(repo.id));
  };
  
  // Fonction pour vérifier si certains dépôts d'un groupe sont sélectionnés
  const isGroupPartiallySelected = (username: string): boolean => {
    const reposInGroup = groupedRepositories[username] || [];
    return reposInGroup.some(repo => selectedRepos.includes(repo.id)) && 
           !reposInGroup.every(repo => selectedRepos.includes(repo.id));
  };
  
  // Fonction pour gérer l'expansion/réduction d'un groupe
  const toggleGroupExpansion = (username: string) => {
    setExpandedGroups(prev => 
      prev.includes(username)
        ? prev.filter(u => u !== username)
        : [...prev, username]
    );
  };
  
  // Sélectionner/désélectionner tous les dépôts
  const handleSelectAll = () => {
    if (selectedRepos.length === repositories.length) {
      setSelectedRepos([]);
    } else {
      setSelectedRepos(repositories.map(repo => repo.id));
    }
  };
  
  // Gérer les actions par lot
  const handleBatchDelete = async () => {
    if (selectedRepos.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedRepos.length} repositories? This action is irreversible.`)) {
      return;
    }
    
    try {
      // Créer un tableau de promesses pour supprimer tous les dépôts sélectionnés
      const deletePromises = selectedRepos.map(id => api.repositories.delete(id));
      
      // Attendre que toutes les suppressions soient terminées
      await Promise.all(deletePromises);
      
      addNotification({
        type: 'success',
        message: `Successfully deleted ${selectedRepos.length} repositories`,
        duration: 3000
      });
      
      // Rafraîchir la liste et réinitialiser la sélection
      fetchRepositories();
      setSelectedRepos([]);
    } catch (err) {
      console.error('Error deleting repositories:', err);
      addNotification({
        type: 'error',
        message: 'Failed to delete some repositories',
        duration: 3000
      });
    }
  };
  
  const handleBatchSync = async () => {
    if (selectedRepos.length === 0) return;
    
    try {
      addNotification({
        type: 'info',
        message: `Synchronizing ${selectedRepos.length} repositories...`,
        duration: 3000
      });
      
      // Créer un tableau de promesses pour synchroniser tous les dépôts sélectionnés
      const syncPromises = selectedRepos.map(id => api.repositories.sync(id));
      
      // Attendre que toutes les synchronisations soient terminées
      await Promise.all(syncPromises);
      
      addNotification({
        type: 'success',
        message: `Successfully synchronized ${selectedRepos.length} repositories`,
        duration: 3000
      });
      
      // Rafraîchir la liste
      fetchRepositories();
    } catch (err) {
      console.error('Error synchronizing repositories:', err);
      addNotification({
        type: 'error',
        message: 'Failed to synchronize some repositories',
        duration: 3000
      });
    }
  };
  
  // Gérer les tags par lot
  const handleBatchAddTag = async () => {
    if (selectedRepos.length === 0) return;
    
    const tagToAdd = prompt('Enter a tag to add to selected repositories:');
    if (!tagToAdd?.trim()) return;
    
    try {
      // Récupérer les dépôts sélectionnés
      const selectedRepositories = repositories.filter(repo => selectedRepos.includes(repo.id));
      
      // Mettre à jour chaque dépôt
      const updatePromises = selectedRepositories.map(repo => {
        const currentTags = repo.tags ? repo.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        // Éviter les doublons
        if (!currentTags.includes(tagToAdd.trim())) {
          currentTags.push(tagToAdd.trim());
        }
        const newTags = currentTags.join(',');
        
        return api.repositories.update(repo.id, { 
          name: repo.name,
          username: repo.username,
          url: repo.url,
          local_path: repo.local_path,
          branch_default: repo.branch_default,
          tags: newTags
        });
      });
      
      await Promise.all(updatePromises);
      
      addNotification({
        type: 'success',
        message: `Tag "${tagToAdd}" added to ${selectedRepos.length} repositories`,
        duration: 3000
      });
      
      // Rafraîchir la liste
      fetchRepositories();
    } catch (err) {
      console.error('Error adding tag to repositories:', err);
      addNotification({
        type: 'error',
        message: 'Failed to add tag to some repositories',
        duration: 3000
      });
    }
  };

  // Initialiser l'expansion des groupes
  useEffect(() => {
    // Par défaut, tous les groupes sont développés
    const allUsernames = Object.keys(groupedRepositories);
    setExpandedGroups(allUsernames);
  }, [groupedRepositories]);

  return (
    <Container>
      <Header>
        <Title>
          <TitleIcon><FaGithub size={24} /></TitleIcon>
          Git Repositories
        </Title>
        <div style={{ display: 'flex', gap: '1rem' }}>
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
              placeholder="Search repositories or users..."
            />
          </SearchInput>
        </SearchRow>
        
        <ActiveFiltersContainer>
          {searchTerm && (
            <FilterTag>
              Search: {searchTerm}
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
                Clear all filters
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
          <EmptyTitle>No results</EmptyTitle>
          <EmptyText>
            No repositories match your search criteria.
          </EmptyText>
          <button onClick={clearFilters}>Clear filters</button>
        </EmptyState>
      ) : (
        <ListContainer>
          <ListHeader>
            <CheckboxContainer>
              <Checkbox 
                type="checkbox" 
                checked={selectedRepos.length === repositories.length && repositories.length > 0}
                onChange={handleSelectAll}
              />
              <SelectAllButton onClick={handleSelectAll}>
                {selectedRepos.length === repositories.length && repositories.length > 0 
                  ? 'Deselect All' 
                  : 'Select All'}
              </SelectAllButton>
            </CheckboxContainer>
            <ListHeaderItem>Repository</ListHeaderItem>
            <ListHeaderItem>Path</ListHeaderItem>
            <ListHeaderItem>Tags</ListHeaderItem>
            <ListHeaderItem>Last Updated</ListHeaderItem>
            <div>Actions</div>
          </ListHeader>
          
          {Object.entries(groupedRepositories).map(([username, repos]) => (
            <div key={username}>
              <GroupHeader onClick={() => toggleGroupExpansion(username)}>
                <CheckboxContainer onClick={(e) => {
                  e.stopPropagation();
                  handleSelectGroup(username);
                }}>
                  <Checkbox 
                    type="checkbox" 
                    checked={isGroupSelected(username)}
                    onChange={() => {}}
                    ref={el => {
                      if (el) {
                        el.indeterminate = isGroupPartiallySelected(username);
                      }
                    }}
                  />
                </CheckboxContainer>
                <GroupIcon>
                  <FaGithub size={18} />
                </GroupIcon>
                {username} ({repos.length})
                <div style={{ marginLeft: 'auto', fontSize: '0.9rem' }}>
                  {expandedGroups.includes(username) ? 'Click to collapse' : 'Click to expand'}
                </div>
              </GroupHeader>
              
              {expandedGroups.includes(username) && repos.map((repo) => (
                <ListItem key={repo.id}>
                  <CheckboxContainer>
                    <Checkbox 
                      type="checkbox" 
                      checked={selectedRepos.includes(repo.id)}
                      onChange={() => handleSelectRepository(repo.id)}
                    />
                  </CheckboxContainer>
                  <RepoCell>
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
                    {renderTags(repo)}
                  </TagsCell>
                  <DateCell>
                    <DateIcon><FaCalendarAlt size={14} /></DateIcon>
                    {formatDate(repo.last_updated)}
                  </DateCell>
                  <Actions>
                    <RepoActionButton 
                      className="sync" 
                      onClick={() => handleSyncRepository(repo.id)}
                      title="Synchronize"
                    >
                      <FaSync />
                    </RepoActionButton>
                    <RepoActionButton 
                      className="edit" 
                      onClick={() => navigate(`/repositories/${repo.id}`)}
                      title="Edit"
                    >
                      <FaEdit />
                    </RepoActionButton>
                    <RepoActionButton 
                      className="delete" 
                      onClick={() => handleDeleteRepository(repo.id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </RepoActionButton>
                  </Actions>
                </ListItem>
              ))}
            </div>
          ))}
          
          {selectedRepos.length > 0 && (
            <BatchActionsBar>
              <div>
                <strong>{selectedRepos.length}</strong> repositories selected
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <BatchAction onClick={handleBatchAddTag}>
                  <FaTag /> Add Tag
                </BatchAction>
                <BatchAction onClick={handleBatchSync}>
                  <FaSync /> Sync All
                </BatchAction>
                <BatchAction onClick={handleBatchDelete} style={{ backgroundColor: 'rgba(244, 67, 54, 0.7)' }}>
                  <FaTrash /> Delete All
                </BatchAction>
              </div>
            </BatchActionsBar>
          )}
        </ListContainer>
      )}
    </Container>
  );
};

export default RepositoryList; 
