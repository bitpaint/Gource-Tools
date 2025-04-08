import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaGithub, FaTag, FaTimes, FaPlus, FaSave, FaArrowLeft } from 'react-icons/fa';
import api from '../services/api';
import { useNotification } from '../components/ui/NotificationContext';

const Container = styled.div`
  padding: 2rem;
  max-width: 1000px;
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

const ContentContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
`;

const MainSection = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

const SideSection = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  align-self: start;
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text};
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.borderColor};
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}30;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.borderColor};
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}30;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryDark || theme.colors.primary};
    opacity: 0.9;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.borderColor};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
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
    padding: 0.5rem;
    border: 1px solid ${({ theme }) => theme.colors.borderColor};
    border-radius: 4px 0 0 4px;
    font-size: 0.9rem;
    
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
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  
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
  margin-top: 0.5rem;
`;

const SuggestedTagButton = styled.button`
  background-color: ${({ theme }) => theme.colors.light};
  color: ${({ theme }) => theme.colors.text};
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
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
  height: 300px;
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
  margin-bottom: 1rem;
`;

const HelpText = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.9rem;
  margin-top: 0.5rem;
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    name: '',
    username: '',
    url: '',
    local_path: '',
    branch_default: 'main',
  });
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
      
      // Initialiser les valeurs du formulaire
      setFormValues({
        name: response.data.name || '',
        username: response.data.username || '',
        url: response.data.url || '',
        local_path: response.data.local_path || '',
        branch_default: response.data.branch_default || 'main',
      });
      
      // Initialiser les tags (s'ils existent)
      if (response.data.tags) {
        setTags(response.data.tags.split(',').map((tag: string) => tag.trim()));
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
  
  const handleSave = async () => {
    if (!repoIdOrSlug || !repository) return;
    
    try {
      setSaving(true);
      
      // Prepare data for update
      const updatedData = {
        name: formValues.name,
        username: formValues.username,
        url: formValues.url,
        local_path: formValues.local_path,
        branch_default: formValues.branch_default,
        tags: tags.join(',')
      };
      
      await api.repositories.update(repoIdOrSlug, updatedData);
      
      addNotification({
        type: 'success',
        message: 'Repository updated successfully',
        duration: 3000
      });
      
      // Update local state
      setRepository({
        ...repository,
        ...updatedData
      });
      
      // Navigate back to repositories list
      navigate('/repositories');
    } catch (err) {
      console.error('Error updating repository:', err);
      addNotification({
        type: 'error',
        message: 'Failed to update repository',
        duration: 3000
      });
    } finally {
      setSaving(false);
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
        duration: 3000
      });
      return;
    }
    
    setTags([...tags, trimmedTag]);
    setNewTag('');
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleAddSuggestedTag = (tag: string) => {
    if (tags.includes(tag)) return;
    
    setTags([...tags, tag]);
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
        <ButtonContainer>
          <SecondaryButton onClick={() => navigate('/repositories')}>
            <FaArrowLeft /> Back to Repositories
          </SecondaryButton>
        </ButtonContainer>
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
      
      <ContentContainer>
        <MainSection>
          <SectionTitle>Repository Details</SectionTitle>
          
          <FormGroup>
            <Label htmlFor="name">Repository Name</Label>
            <Input
              id="name"
              type="text"
              value={formValues.name}
              onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="url">Repository URL</Label>
            <Input
              id="url"
              type="text"
              value={formValues.url}
              onChange={(e) => setFormValues({ ...formValues, url: e.target.value })}
              placeholder="https://github.com/username/repository.git"
            />
            <HelpText>The URL to the Git repository. Used for syncing with GitHub.</HelpText>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={formValues.username}
              onChange={(e) => setFormValues({ ...formValues, username: e.target.value })}
              placeholder="github-username"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="local_path">Local Path</Label>
            <Input
              id="local_path"
              type="text"
              value={formValues.local_path}
              onChange={(e) => setFormValues({ ...formValues, local_path: e.target.value })}
              placeholder="C:/path/to/repository"
            />
            <HelpText>Local path on your machine where the repository is located.</HelpText>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="branch">Default Branch</Label>
            <Input
              id="branch"
              type="text"
              value={formValues.branch_default}
              onChange={(e) => setFormValues({ ...formValues, branch_default: e.target.value })}
              placeholder="main"
            />
            <HelpText>The default branch used for Gource visualizations.</HelpText>
          </FormGroup>
          
          <ButtonContainer>
            <SecondaryButton onClick={() => navigate('/repositories')}>
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={handleSave} disabled={saving}>
              <FaSave />
              {saving ? 'Saving...' : 'Save Repository'}
            </PrimaryButton>
          </ButtonContainer>
        </MainSection>
        
        <SideSection>
          <SectionTitle>Tags</SectionTitle>
          
          <InfoBox>
            Tags help you organize and search for repositories. Add descriptive tags related to the repository's purpose, technology, or team.
          </InfoBox>
          
          <TagInput>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a new tag..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <button onClick={handleAddTag}>
              <FaPlus />
            </button>
          </TagInput>
          
          <TagsContainer>
            {tags.length === 0 ? (
              <div style={{ color: '#999', fontStyle: 'italic' }}>No tags yet</div>
            ) : (
              tags.map((tag, index) => (
                <TagBadge key={index}>
                  <FaTag size={12} />
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} title="Remove tag">
                    <FaTimes size={12} />
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
                  >
                    <FaPlus size={10} />
                    {tag}
                  </SuggestedTagButton>
                ))}
              </SuggestedTagsContainer>
            </>
          )}
        </SideSection>
      </ContentContainer>
    </Container>
  );
};

export default EditRepository; 