import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaGithub, FaPlus, FaSync, FaTrash, FaEdit, FaCopy, FaCalendarAlt, FaFolder, FaSearch, FaTags, FaTimes, FaTag, FaCheckSquare, FaFolderPlus } from 'react-icons/fa';
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
  margin: 0;
  width: 100%;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 2rem;
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
  justify-content: center;
  gap: 0.5rem;
  background-color: #4CAF50;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 1rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  width: 100%;

  &:hover {
    background-color: #388E3C;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
`;

const ListContainer = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 0 0 5rem 0;
  overflow: hidden;
`;

const ListHeader = styled.div`
  background-color: ${({ theme }) => theme.colors.dark};
  padding: 0.4rem 0.8rem;
  display: grid;
  grid-template-columns: 32px minmax(200px, 1.2fr) minmax(300px, 2fr) 80px 160px;
  color: ${({ theme }) => theme.colors.white};
  font-weight: bold;
  align-items: center;
  font-size: 0.85rem;
  letter-spacing: 0.3px;
`;

const ListHeaderItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ListItem = styled.div`
  display: grid;
  grid-template-columns: 32px minmax(200px, 1.2fr) minmax(300px, 2fr) 80px 160px;
  padding: 0.4rem 0.8rem;
  padding-left: 2rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
  align-items: center;
  transition: all 0.2s;
  min-height: 36px;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
    transform: translateX(2px);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const RepoCell = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 0.8rem;
`;

const RepoName = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  
  &:before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #4CAF50;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const PathContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  border-radius: 4px;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
`;

const RepoActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 1px solid #e0e0e0;
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.8rem;
  font-weight: 500;
  gap: 3px;
  white-space: nowrap;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
    transform: translateY(-1px);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  &.edit {
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary}40;
  }

  &.sync {
    color: #4CAF50;
    border-color: #4CAF5040;
  }

  &.delete {
    color: #F44336;
    border-color: #F4433640;
  }
  
  &.project {
    color: #2196F3;
    border-color: #2196F340;
  }

  svg {
    font-size: 0.9rem;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.2rem;
  justify-content: flex-start;
  flex-wrap: nowrap;
`;

const DateCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.8rem;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  width: fit-content;
`;

const DateIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.primary};
  opacity: 0.8;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid ${({ theme }) => theme.colors.borderColor};
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text};
`;

const EmptyText = styled.p`
  color: ${({ theme }) => theme.colors.textLight};
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
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
  align-items: center;
  gap: 1rem;
  background-color: white;
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 1rem 0 2rem 0;
`;

const SearchInput = styled.div`
  position: relative;
  min-width: 300px;
  max-width: 400px;
  
  input {
    width: 100%;
    padding: 0.6rem 1rem 0.6rem 2.5rem;
    border: 1px solid ${({ theme }) => theme.colors.borderColor};
    border-radius: 6px;
    font-size: 0.9rem;
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
    }
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textLight};
  display: flex;
  align-items: center;
`;

const FilterSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
`;

const FilterLabel = styled.span`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
`;

const TagFilterButton = styled.button<{ isActive: boolean }>`
  background-color: ${({ theme, isActive }) => isActive ? theme.colors.primary : 'transparent'};
  color: ${({ theme, isActive }) => isActive ? theme.colors.white : theme.colors.text};
  border: 1px solid ${({ theme, isActive }) => isActive ? theme.colors.primary : theme.colors.borderColor};
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({ theme, isActive }) => isActive ? theme.colors.primary : theme.colors.background};
    transform: translateY(-1px);
  }
`;

const ClearFiltersButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.danger};
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-left: auto;
  border-radius: 4px;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.danger}10;
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
  background-color: ${({ theme }) => theme.colors.secondary}20;
  color: ${({ theme }) => theme.colors.secondary};
  padding: 0.15rem 0.4rem;
  border-radius: 20px;
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  margin: 0;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid ${({ theme }) => theme.colors.secondary}30;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary}30;
    transform: translateY(-1px);
  }
`;

const TagsCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  min-height: 22px;
  position: relative;
  padding: 0 4px;
  border-radius: 3px;
  align-items: center;
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
  padding: 0.4rem;
  border-radius: 50%;
  margin-right: 0.5rem;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.light};
    transform: rotate(90deg);
    transition: transform 0.3s;
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
  background: linear-gradient(to right, ${({ theme }) => theme.colors.light}, ${({ theme }) => theme.colors.background});
  padding: 0.4rem 0.8rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
  font-size: 0.9rem;
  min-height: 36px;
  
  &:hover {
    background: linear-gradient(to right, ${({ theme }) => theme.colors.light}, ${({ theme }) => theme.colors.white});
  }
`;

const GroupIcon = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.primary}10;
  padding: 0.2rem;
  border-radius: 50%;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  min-height: 20px;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 16px;
  height: 16px;
  cursor: pointer;
  border-radius: 3px;
  border: 1.5px solid ${({ theme }) => theme.colors.primary};
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: white;
  margin: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:checked {
    background-color: ${({ theme }) => theme.colors.primary};
  }

  &:checked::before {
    content: '✓';
    color: white;
    font-size: 11px;
    position: absolute;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary}20;
  }
`;

const BatchActionsBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.dark};
  color: white;
  padding: 0.6rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
`;

const BatchActionsLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BatchActionsRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SelectAllButton = styled.button`
  background: none;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const BatchActionButton = styled.button`
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-size: 0.9rem;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  &.delete {
    background-color: ${({ theme }) => theme.colors.danger}90;
    border-color: ${({ theme }) => theme.colors.danger};

    &:hover {
      background-color: ${({ theme }) => theme.colors.danger};
    }
  }
`;

// Modification de la fonction pour afficher les dates au format "1d ago", "2w ago", etc.
const getRelativeTimeString = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`;
  return `${Math.floor(diffInSeconds / 31536000)}y`;
};

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

  // Ajout de la fonction pour gérer l'ajout au projet
  const handleAddToProject = () => {
    navigate('/projects/add', { state: { repositories: selectedRepos } });
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

  // Mise à jour du rendu des tags pour optimiser l'espace
  const renderTags = (repo: Repository) => {
    const { id, tags } = repo;
    
    if (editingTagRepo === id) {
      return (
        <TagInput>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="New tag"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag(id)}
          />
          <button onClick={() => handleAddTag(id)}>Add</button>
          <button onClick={cancelEditingTags}>✕</button>
        </TagInput>
      );
    }
    
    if (!tags) {
      return (
        <>
          <TagAddButton onClick={() => startEditingTags(id)} title="Add new tag">
            <FaPlus size={12} />
          </TagAddButton>
          <span style={{ color: '#999', fontStyle: 'italic', fontSize: '0.8rem' }}>No tags</span>
        </>
      );
    }
    
    const tagList = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    
    if (tagList.length === 0) {
      return (
        <>
          <TagAddButton onClick={() => startEditingTags(id)} title="Add new tag">
            <FaPlus size={12} />
          </TagAddButton>
          <span style={{ color: '#999', fontStyle: 'italic', fontSize: '0.8rem' }}>No tags</span>
        </>
      );
    }
    
    return (
      <>
        <TagAddButton onClick={() => startEditingTags(id)} title="Add new tag">
          <FaPlus size={12} />
        </TagAddButton>
        {tagList.map((tag, index) => (
          <TagBadge
            key={index}
            onClick={() => handleTagFilter(tag)}
            title="Click to filter by this tag"
          >
            <FaTags size={10} />
            {tag}
            <TagRemoveButton 
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(id, tag);
              }}
              title="Remove tag"
            >
              <FaTimes size={8} />
            </TagRemoveButton>
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

  // Fonction pour gérer la sélection/désélection d'un dépôt
  const handleRepoSelect = (id: string) => {
    setSelectedRepos(prev => 
      prev.includes(id) 
        ? prev.filter(repoId => repoId !== id)
        : [...prev, id]
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
          <TitleIcon><FaGithub size={28} /></TitleIcon>
          Git Repositories
        </Title>
        <AddButton to="/repositories/add">
          <FaPlus /> Add Repository
        </AddButton>
      </Header>

      <SearchContainer>
        <SearchInput>
          <SearchIcon>
            <FaSearch size={16} />
          </SearchIcon>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search repositories or users..."
          />
        </SearchInput>

        <FilterSection>
          {availableTags.length > 0 && (
            <>
              <FilterLabel>Tags:</FilterLabel>
              {availableTags.slice(0, 3).map(tag => (
                <TagFilterButton
                  key={tag}
                  isActive={selectedTags.includes(tag)}
                  onClick={() => handleTagFilter(tag)}
                >
                  {tag}
                </TagFilterButton>
              ))}
              {availableTags.length > 3 && (
                <TagFilterButton
                  isActive={false}
                  onClick={() => {/* TODO: Implement tags dropdown */}}
                >
                  +{availableTags.length - 3} more
                </TagFilterButton>
              )}
            </>
          )}
        </FilterSection>

        {(selectedTags.length > 0 || searchTerm) && (
          <ClearFiltersButton onClick={clearFilters}>
            <FaTimes size={12} />
            Clear filters
          </ClearFiltersButton>
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
          <EmptyTitle>No matching repositories found</EmptyTitle>
          <EmptyText>
            No repositories match your search criteria. Would you like to add a new repository instead?
          </EmptyText>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={clearFilters} 
              style={{ 
                padding: '0.7rem 1.2rem', 
                borderRadius: '6px', 
                border: 'none', 
                backgroundColor: '#f0f0f0', 
                cursor: 'pointer' 
              }}
            >
              Clear filters
            </button>
            <AddButton to="/repositories/add">
              <FaPlus /> Add New Repository
            </AddButton>
          </div>
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
            </CheckboxContainer>
            <ListHeaderItem>Repository</ListHeaderItem>
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
                <div style={{ marginLeft: 'auto', fontSize: '0.9rem', opacity: 0.7 }}>
                  {expandedGroups.includes(username) ? '▼' : '►'}
                </div>
              </GroupHeader>
              
              {expandedGroups.includes(username) && repos.map((repo) => (
                <ListItem key={repo.id}>
                  <CheckboxContainer>
                    <Checkbox 
                      type="checkbox" 
                      checked={selectedRepos.includes(repo.id)}
                      onChange={() => handleRepoSelect(repo.id)}
                    />
                  </CheckboxContainer>
                  <RepoCell>
                    <RepoName onClick={() => handleRepoSelect(repo.id)}>
                      {repo.name}
                    </RepoName>
                  </RepoCell>
                  <TagsCell>
                    {renderTags(repo)}
                  </TagsCell>
                  <DateCell>
                    {getRelativeTimeString(repo.last_updated)}
                  </DateCell>
                  <Actions>
                    <RepoActionButton 
                      className="project"
                      onClick={() => handleAddToProject()}
                      title="Add to project"
                    >
                      <FaFolderPlus />
                    </RepoActionButton>
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
              <BatchActionsLeft>
                <SelectAllButton onClick={handleSelectAll}>
                  <FaCheckSquare />
                  {selectedRepos.length === repositories.length ? 'Unselect All' : 'Select All'}
                </SelectAllButton>
                <span>{selectedRepos.length} repositories selected</span>
              </BatchActionsLeft>
              <BatchActionsRight>
                <BatchActionButton onClick={handleAddToProject}>
                  <FaFolderPlus />
                  Add to Project
                </BatchActionButton>
                <BatchActionButton onClick={handleBatchSync}>
                  <FaSync />
                  Update All
                </BatchActionButton>
                <BatchActionButton className="delete" onClick={handleBatchDelete}>
                  <FaTrash />
                  Delete All
                </BatchActionButton>
              </BatchActionsRight>
            </BatchActionsBar>
          )}
        </ListContainer>
      )}
    </Container>
  );
};

export default RepositoryList; 
