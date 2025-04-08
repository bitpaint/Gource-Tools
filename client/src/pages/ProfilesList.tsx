import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaPlus, FaTrash, FaEdit, FaPlay, FaList, FaCalendarAlt, FaInfoCircle, FaSearch, FaTags, FaTimes, FaCheckSquare, FaSync, FaLink, FaUnlink } from 'react-icons/fa';
import api from '../services/api';
import { useNotification } from '../components/ui/NotificationContext';

interface GourceProfile {
  id: string;
  name: string;
  description: string;
  speed: number;
  resolution: string;
  background_color: string;
  avatars_enabled: boolean;
  avatar_size: number;
  start_date?: string;
  end_date?: string;
  custom_options: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  project_count?: number;
}

interface ProjectLink {
  project_id: string;
  project_name: string;
  profile_id: string;
  is_default: boolean;
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

const ProfileCell = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 0.8rem;
`;

const ProfileName = styled.h3`
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

const DefaultBadge = styled.span`
  background-color: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.5rem;
`;

const Description = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

const Actions = styled.div`
  display: flex;
  gap: 0.2rem;
  justify-content: flex-start;
  flex-wrap: nowrap;
`;

const ActionButton = styled.button`
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

  &.link {
    color: #2196F3;
    border-color: #2196F340;
  }

  &.play {
    color: #4CAF50;
    border-color: #4CAF5040;
  }

  &.delete {
    color: #F44336;
    border-color: #F4433640;
  }
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

// Modal pour lier les profils aux projets
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const ProjectItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ProjectName = styled.div`
  font-weight: 500;
`;

const ProjectActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

// Fonction pour afficher les dates au format relatif
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

const ProfilesList: React.FC = () => {
  const [profiles, setProfiles] = useState<GourceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<string | null>(null);
  const [projectLinks, setProjectLinks] = useState<ProjectLink[]>([]);
  const [availableProjects, setAvailableProjects] = useState<{id: string, name: string}[]>([]);
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await api.gource.getProfiles();
      setProfiles(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError('Unable to load profiles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    // Vérifier si le profil est un profil par défaut
    const profile = profiles.find(p => p.id === id);
    if (profile?.is_default) {
      addNotification({
        type: 'error',
        message: 'Cannot delete a default profile',
        duration: 3000
      });
      return;
    }

    if (!window.confirm('Are you sure you want to delete this profile? This action is irreversible.')) {
      return;
    }

    try {
      await api.gource.deleteProfile(id);
      fetchProfiles();
      addNotification({
        type: 'success',
        message: 'Profile deleted successfully',
        duration: 3000
      });
    } catch (err) {
      console.error('Error deleting profile:', err);
      addNotification({
        type: 'error',
        message: 'Failed to delete profile',
        duration: 3000
      });
    }
  };

  const handleProfileSelect = (id: string) => {
    setSelectedProfiles(prev => 
      prev.includes(id) 
        ? prev.filter(profileId => profileId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProfiles.length === profiles.length) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles(profiles.map(profile => profile.id));
    }
  };

  const handleBatchDelete = async () => {
    // Vérifier si des profils par défaut sont sélectionnés
    const defaultProfileSelected = profiles.some(p => p.is_default && selectedProfiles.includes(p.id));
    if (defaultProfileSelected) {
      addNotification({
        type: 'error',
        message: 'Cannot delete default profiles',
        duration: 3000
      });
      return;
    }

    if (selectedProfiles.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedProfiles.length} profiles? This action is irreversible.`)) {
      return;
    }
    
    try {
      const deletePromises = selectedProfiles.map(id => api.gource.deleteProfile(id));
      await Promise.all(deletePromises);
      
      addNotification({
        type: 'success',
        message: `Successfully deleted ${selectedProfiles.length} profiles`,
        duration: 3000
      });
      
      fetchProfiles();
      setSelectedProfiles([]);
    } catch (err) {
      console.error('Error deleting profiles:', err);
      addNotification({
        type: 'error',
        message: 'Failed to delete some profiles',
        duration: 3000
      });
    }
  };

  // Fonction pour ouvrir le modal de liaison avec les projets
  const handleOpenLinkModal = async (profileId: string) => {
    try {
      setCurrentProfile(profileId);
      
      // Charger les projets liés à ce profil
      const linksResponse = await api.gource.getProfileProjects(profileId);
      setProjectLinks(linksResponse.data || []);
      
      // Charger tous les projets disponibles
      const projectsResponse = await api.projects.getAll();
      setAvailableProjects(projectsResponse.data || []);
      
      setShowLinkModal(true);
    } catch (err) {
      console.error('Error loading project links:', err);
      addNotification({
        type: 'error',
        message: 'Failed to load project links',
        duration: 3000
      });
    }
  };

  // Fonction pour lier un profil à un projet
  const handleLinkToProject = async (projectId: string) => {
    if (!currentProfile) return;
    
    try {
      await api.gource.linkProfileToProject(currentProfile, projectId);
      
      // Rafraîchir la liste des liens
      const linksResponse = await api.gource.getProfileProjects(currentProfile);
      setProjectLinks(linksResponse.data);
      
      addNotification({
        type: 'success',
        message: 'Profile linked to project successfully',
        duration: 3000
      });
    } catch (err) {
      console.error('Error linking profile to project:', err);
      addNotification({
        type: 'error',
        message: 'Failed to link profile to project',
        duration: 3000
      });
    }
  };

  // Fonction pour définir un profil comme par défaut pour un projet
  const handleSetAsDefault = async (projectId: string) => {
    if (!currentProfile) return;
    
    try {
      await api.gource.setProfileAsDefault(currentProfile, projectId);
      
      // Rafraîchir la liste des liens
      const linksResponse = await api.gource.getProfileProjects(currentProfile);
      setProjectLinks(linksResponse.data);
      
      addNotification({
        type: 'success',
        message: 'Profile set as default for this project',
        duration: 3000
      });
    } catch (err) {
      console.error('Error setting profile as default:', err);
      addNotification({
        type: 'error',
        message: 'Failed to set profile as default',
        duration: 3000
      });
    }
  };

  // Fonction pour délier un profil d'un projet
  const handleUnlinkFromProject = async (projectId: string) => {
    if (!currentProfile) return;
    
    try {
      await api.gource.unlinkProfileFromProject(currentProfile, projectId);
      
      // Rafraîchir la liste des liens
      const linksResponse = await api.gource.getProfileProjects(currentProfile);
      setProjectLinks(linksResponse.data);
      
      addNotification({
        type: 'success',
        message: 'Profile unlinked from project successfully',
        duration: 3000
      });
    } catch (err) {
      console.error('Error unlinking profile from project:', err);
      addNotification({
        type: 'error',
        message: 'Failed to unlink profile from project',
        duration: 3000
      });
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <Header>
        <Title>
          <TitleIcon><FaList size={28} /></TitleIcon>
          Gource Profiles
        </Title>
        <AddButton to="/profiles/create">
          <FaPlus /> Create Profile
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
            placeholder="Search profiles..."
          />
        </SearchInput>
      </SearchContainer>

      {loading ? (
        <LoadingIndicator>Loading profiles...</LoadingIndicator>
      ) : error ? (
        <ErrorMessage>Error: {error}</ErrorMessage>
      ) : profiles.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <FaList />
          </EmptyIcon>
          <EmptyTitle>No Profiles</EmptyTitle>
          <EmptyText>
            Start by creating a profile to customize your Gource visualizations.
          </EmptyText>
          <AddButton to="/profiles/create">
            <FaPlus /> Create Profile
          </AddButton>
        </EmptyState>
      ) : filteredProfiles.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <FaSearch />
          </EmptyIcon>
          <EmptyTitle>No matching profiles found</EmptyTitle>
          <EmptyText>
            No profiles match your search criteria. Would you like to create a new profile instead?
          </EmptyText>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={() => setSearchTerm('')} 
              style={{ 
                padding: '0.7rem 1.2rem', 
                borderRadius: '6px', 
                border: 'none', 
                backgroundColor: '#f0f0f0', 
                cursor: 'pointer' 
              }}
            >
              Clear search
            </button>
            <AddButton to="/profiles/create">
              <FaPlus /> Create New Profile
            </AddButton>
          </div>
        </EmptyState>
      ) : (
        <ListContainer>
          <ListHeader>
            <CheckboxContainer>
              <Checkbox 
                checked={selectedProfiles.length === profiles.length && profiles.length > 0}
                onChange={handleSelectAll}
              />
            </CheckboxContainer>
            <ListHeaderItem>Profile</ListHeaderItem>
            <ListHeaderItem>Description</ListHeaderItem>
            <ListHeaderItem>Last Modified</ListHeaderItem>
            <div>Actions</div>
          </ListHeader>

          {filteredProfiles.map((profile) => (
            <ListItem key={profile.id}>
              <CheckboxContainer>
                <Checkbox 
                  checked={selectedProfiles.includes(profile.id)}
                  onChange={() => handleProfileSelect(profile.id)}
                />
              </CheckboxContainer>
              <ProfileCell>
                <ProfileName onClick={() => handleProfileSelect(profile.id)}>
                  {profile.name}
                  {profile.is_default && <DefaultBadge>Default</DefaultBadge>}
                </ProfileName>
                {profile.project_count !== undefined && (
                  <Description>
                    {profile.project_count} projects
                  </Description>
                )}
              </ProfileCell>
              <Description>
                {profile.description || 'No description'}
              </Description>
              <DateCell>
                <DateIcon>
                  <FaCalendarAlt size={12} />
                </DateIcon>
                {getRelativeTimeString(profile.updated_at)}
              </DateCell>
              <Actions>
                <ActionButton 
                  className="link"
                  onClick={() => handleOpenLinkModal(profile.id)}
                  title="Link to projects"
                >
                  <FaLink />
                </ActionButton>
                <ActionButton 
                  className="edit" 
                  onClick={() => navigate(`/profiles/${profile.id}`)}
                  title="Edit"
                >
                  <FaEdit />
                </ActionButton>
                {!profile.is_default && (
                  <ActionButton 
                    className="delete" 
                    onClick={() => handleDeleteProfile(profile.id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </ActionButton>
                )}
              </Actions>
            </ListItem>
          ))}

          {selectedProfiles.length > 0 && (
            <BatchActionsBar>
              <BatchActionsLeft>
                <SelectAllButton onClick={handleSelectAll}>
                  <FaCheckSquare />
                  {selectedProfiles.length === profiles.length ? 'Unselect All' : 'Select All'}
                </SelectAllButton>
                <span>{selectedProfiles.length} profiles selected</span>
              </BatchActionsLeft>
              <BatchActionsRight>
                <BatchActionButton className="delete" onClick={handleBatchDelete}>
                  <FaTrash />
                  Delete All
                </BatchActionButton>
              </BatchActionsRight>
            </BatchActionsBar>
          )}
        </ListContainer>
      )}

      {/* Modal pour lier des profils aux projets */}
      {showLinkModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Link Profile to Projects</ModalTitle>
              <CloseButton onClick={() => setShowLinkModal(false)}>×</CloseButton>
            </ModalHeader>
            
            <div>
              <h3>Projects using this profile</h3>
              {projectLinks.length === 0 ? (
                <p>This profile is not linked to any project yet.</p>
              ) : (
                projectLinks.map(link => (
                  <ProjectItem key={link.project_id}>
                    <ProjectName>
                      {link.project_name}
                      {link.is_default && <DefaultBadge>Default</DefaultBadge>}
                    </ProjectName>
                    <ProjectActions>
                      {!link.is_default && (
                        <ActionButton 
                          className="play" 
                          onClick={() => handleSetAsDefault(link.project_id)}
                          title="Set as default"
                        >
                          Set as default
                        </ActionButton>
                      )}
                      <ActionButton 
                        className="delete" 
                        onClick={() => handleUnlinkFromProject(link.project_id)}
                      >
                        <FaUnlink />
                      </ActionButton>
                    </ProjectActions>
                  </ProjectItem>
                ))
              )}
              
              <h3>Available projects</h3>
              {(availableProjects || []).filter(project => !(projectLinks || []).some(link => link.project_id === project.id)).length === 0 ? (
                <p>No more projects available.</p>
              ) : (
                (availableProjects || [])
                  .filter(project => !(projectLinks || []).some(link => link.project_id === project.id))
                  .map(project => (
                    <ProjectItem key={project.id}>
                      <ProjectName>{project.name}</ProjectName>
                      <ActionButton 
                        className="play" 
                        onClick={() => handleLinkToProject(project.id)}
                      >
                        <FaLink /> Link
                      </ActionButton>
                    </ProjectItem>
                  ))
              )}
            </div>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default ProfilesList; 