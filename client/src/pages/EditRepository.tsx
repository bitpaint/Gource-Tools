import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaGithub, FaTag, FaTimes, FaPlus, FaArrowLeft } from 'react-icons/fa';
import api from '../services/api';
import { useNotification } from '../components/ui/NotificationContext';

const Container = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primaryDark || theme.colors.primary};
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const TitleIcon = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
`;

const TagsSection = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text};
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const TagInput = styled.div`
  display: flex;
  margin-top: 0.5rem;
  
  input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid ${({ theme }) => theme.colors.borderColor};
    border-radius: 4px 0 0 4px;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }
  
  button {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
    border: none;
    border-radius: 0 4px 4px 0;
    padding: 0 0.75rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    
    &:hover {
      opacity: 0.9;
    }
  }
`;

const TagBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background-color: ${({ theme }) => theme.colors.secondary}15;
  color: ${({ theme }) => theme.colors.secondary};
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.95rem;
  
  button {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    padding: 0;
    margin-left: 0.25rem;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.danger};
    
    &:hover {
      opacity: 0.8;
    }
  }
`;

const SuggestedTagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const SuggestedTagButton = styled.button`
  background-color: ${({ theme }) => theme.colors.light};
  color: ${({ theme }) => theme.colors.text};
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.border};
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: ${({ theme }) => theme.colors.textLight};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  padding: 0.75rem;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.danger}10;
  margin-bottom: 1rem;
`;

const InfoBox = styled.div`
  padding: 1rem;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.info}15;
  color: ${({ theme }) => theme.colors.info};
  margin-bottom: 1.5rem;
`;

const RepositoryName = styled.div`
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
`;

interface Repository {
  id: string;
  name: string;
  username: string | null;
  url: string | null;
  local_path: string | null;
  branch_default: string;
  tags: string | null;
  last_updated: string;
  slug?: string;
}

const EditRepository: React.FC = () => {
  const { repoIdOrSlug } = useParams<{ repoIdOrSlug: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  const [repository, setRepository] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  useEffect(() => {
    if (repoIdOrSlug) {
      fetchRepository();
    }
  }, [repoIdOrSlug]);
  
  const fetchRepository = async () => {
    try {
      setLoading(true);
      const response = await api.repositories.getById(repoIdOrSlug || '');
      
      // Mettre à jour les données du dépôt
      setRepository(response.data);
      
      // Initialiser les tags (s'ils existent)
      if (response.data.tags) {
        setTags(response.data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean));
      }
      
      // Fetch all repositories to extract available tags
      const allReposResponse = await api.repositories.getAll();
      const allRepos = allReposResponse.data;
      
      // Extract unique tags from all repositories
      const tagsSet = new Set<string>();
      allRepos.forEach((repo: Repository) => {
        if (repo.tags) {
          const repoTags = repo.tags.split(',').map(tag => tag.trim()).filter(Boolean);
          repoTags.forEach(tag => tagsSet.add(tag));
        }
      });
      
      setAvailableTags(Array.from(tagsSet).sort());
      setError(null);
    } catch (err) {
      console.error('Error fetching repository:', err);
      setError('Failed to load repository');
    } finally {
      setLoading(false);
    }
  };
  
  const updateTags = async (updatedTags: string[]) => {
    if (!repoIdOrSlug || !repository || updating) return;
    
    try {
      setUpdating(true);
      
      // Prepare data for update - include required fields
      const updatedData = {
        name: repository.name, // Le champ name est requis par l'API
        username: repository.username,
        url: repository.url,
        local_path: repository.local_path,
        branch_default: repository.branch_default,
        tags: updatedTags.join(',')
      };
      
      await api.repositories.update(repoIdOrSlug, updatedData);
      
      // Update local state
      setRepository({
        ...repository,
        tags: updatedTags.join(',')
      });
      
      // Show quick notification
      addNotification({
        type: 'success',
        message: 'Tags updated',
        duration: 2000
      });
      
    } catch (err) {
      console.error('Error updating repository tags:', err);
      addNotification({
        type: 'error',
        message: 'Failed to update tags',
        duration: 3000
      });
    } finally {
      setUpdating(false);
    }
  };
  
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const trimmedTag = newTag.trim();
    
    // Check if tag already exists
    if (tags.includes(trimmedTag)) {
      addNotification({
        type: 'warning',
        message: 'Tag already exists',
        duration: 2000
      });
      return;
    }
    
    const updatedTags = [...tags, trimmedTag];
    setTags(updatedTags);
    setNewTag('');
    
    // Update tags on server
    updateTags(updatedTags);
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    
    // Update tags on server
    updateTags(updatedTags);
  };
  
  const handleAddSuggestedTag = (tag: string) => {
    if (tags.includes(tag)) return;
    
    const updatedTags = [...tags, tag];
    setTags(updatedTags);
    
    // Update tags on server
    updateTags(updatedTags);
  };
  
  const getSuggestedTags = () => {
    // Filter out tags that are already added
    return availableTags.filter(tag => !tags.includes(tag));
  };
  
  if (loading) {
    return (
      <Container>
        <LoadingIndicator>Loading repository details...</LoadingIndicator>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
        <button onClick={() => navigate('/repositories')}>
          <FaArrowLeft /> Back to Repositories
        </button>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/repositories')}>
          <FaArrowLeft />
        </BackButton>
        <Title>
          <TitleIcon><FaGithub /></TitleIcon>
          Edit Repository
        </Title>
      </Header>
      
      <TagsSection>
        {repository && <RepositoryName>{repository.name}</RepositoryName>}
        
        <SectionTitle>Tags</SectionTitle>
        
        <InfoBox>
          Tags help you organize and search for repositories. Changes are saved automatically.
        </InfoBox>
        
        <TagInput>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a new tag..."
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <button onClick={handleAddTag} disabled={updating}>
            <FaPlus />
          </button>
        </TagInput>
        
        <TagsContainer>
          {tags.length === 0 ? (
            <div style={{ color: '#999', fontStyle: 'italic', padding: '0.5rem 0' }}>No tags yet</div>
          ) : (
            tags.map((tag, index) => (
              <TagBadge key={index}>
                <FaTag size={14} />
                {tag}
                <button onClick={() => handleRemoveTag(tag)} title="Remove tag" disabled={updating}>
                  <FaTimes size={14} />
                </button>
              </TagBadge>
            ))
          )}
        </TagsContainer>
        
        {getSuggestedTags().length > 0 && (
          <>
            <SectionTitle style={{ marginTop: '2rem' }}>Suggested Tags</SectionTitle>
            <SuggestedTagsContainer>
              {getSuggestedTags().map((tag, index) => (
                <SuggestedTagButton 
                  key={index}
                  onClick={() => handleAddSuggestedTag(tag)}
                  title="Click to add this tag"
                  disabled={updating}
                >
                  <FaPlus size={12} />
                  {tag}
                </SuggestedTagButton>
              ))}
            </SuggestedTagsContainer>
          </>
        )}
      </TagsSection>
    </Container>
  );
};

export default EditRepository; 