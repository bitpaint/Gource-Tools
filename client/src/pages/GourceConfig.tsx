import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import GourceRenderForm from '../components/gource/GourceRenderForm';
import { useNotification } from '../components/ui/NotificationContext';
import { useApi } from '../hooks/useApi';
import api from '../services/api';
import { FaPlus, FaPlay, FaInfo, FaArrowLeft, FaLink, FaUnlink, FaStar, FaEdit } from 'react-icons/fa';

interface Project {
  id: string;
  name: string;
  description: string;
}

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
  created_at: string;
  updated_at: string;
  is_default: boolean;
}

interface ProfileLink {
  profile_id: string;
  project_id: string;
  is_default: boolean;
}

interface Repository {
  id: string;
  name: string;
  url: string | null;
  project_id: string;
}

interface RenderOptions {
  config_id: string;
  output_format: 'mp4' | 'webm' | 'gif';
  quality: 'low' | 'medium' | 'high';
}

const Container = styled.div`
  padding: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  margin: 0;
`;

const Subtitle = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  background-color: #4caf50;
  color: white;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background-color: #45a049;
  }
`;

const LinkButton = styled.button`
  padding: 0.7rem 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}10;
  }
`;

const BackButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  background-color: #f5f5f5;
  color: #333;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

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
  max-width: 800px;
  max-height: 90vh;
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

const PageContent = styled.div`
  margin-top: 1.5rem;
`;

const LoadingState = styled.div`
  padding: 2rem;
  text-align: center;
  color: #666;
  font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #ef9a9a;
`;

const WarningMessage = styled.div`
  background-color: #fff8e1;
  color: #f57f17;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #ffe082;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InfoMessage = styled.div`
  background-color: #e3f2fd;
  color: #1565c0;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #90caf9;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: #ff9800;
  color: white;
  cursor: pointer;
  
  &:hover {
    background-color: #f57c00;
  }
`;

const ProfilesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const ProfileCard = styled.div<{ isDefault?: boolean }>`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  border: ${props => props.isDefault ? '2px solid #4caf50' : '1px solid #e0e0e0'};
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ProfileCardHeader = styled.div`
  padding: 1.2rem;
  background-color: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderColor};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ProfileCardTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DefaultBadge = styled.span`
  background-color: #4caf50;
  color: white;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
`;

const ProfileCardBody = styled.div`
  padding: 1.2rem;
  flex-grow: 1;
`;

const ProfileDescription = styled.p`
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  line-height: 1.5;
  height: 4.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const ProfileSettings = styled.div`
  margin-top: 1rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.85rem;
`;

const SettingItem = styled.div`
  margin-bottom: 0.5rem;
  display: flex;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled.span`
  font-weight: 500;
  margin-right: 0.5rem;
  min-width: 100px;
`;

const ProfileCardFooter = styled.div`
  padding: 0.8rem 1.2rem;
  border-top: 1px solid ${({ theme }) => theme.colors.borderColor};
  display: flex;
  justify-content: space-between;
`;

const CardButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
  
  &.primary {
    color: ${({ theme }) => theme.colors.primary};
  }
  
  &.warning {
    color: #ff9800;
  }
  
  &.danger {
    color: #f44336;
  }
  
  &.success {
    color: #4caf50;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid ${({ theme }) => theme.colors.borderColor};
  margin-top: 2rem;
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

const GourceConfigPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  const [showRenderForm, setShowRenderForm] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<GourceProfile | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [hasRepositories, setHasRepositories] = useState(false);
  const [linkedProfiles, setLinkedProfiles] = useState<GourceProfile[]>([]);
  const [defaultProfile, setDefaultProfile] = useState<string | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<GourceProfile[]>([]);
  const [showLinkProfileModal, setShowLinkProfileModal] = useState(false);
  
  // S'assurer que projectId n'est pas undefined
  const safeProjectId = projectId || '';
  
  // Définir les fonctions d'API de manière stable
  const getProject = useCallback(() => api.projects.getById(safeProjectId), [safeProjectId]);
  const getRepositories = useCallback(() => api.repositories.getAll(safeProjectId), [safeProjectId]);
  const getLinkedProfiles = useCallback(() => api.gource.getProjectProfiles(safeProjectId), [safeProjectId]);
  const getAllProfiles = useCallback(() => api.gource.getProfiles(), []);
  
  // Charger les détails du projet
  const [projectState, fetchProject] = useApi(
    getProject,
    true
  );
  
  // Charger les repositories du projet
  const [repositoriesState, fetchRepositories] = useApi(
    getRepositories,
    true
  );
  
  // Charger les profils liés au projet
  const [linkedProfilesState, fetchLinkedProfiles] = useApi(
    getLinkedProfiles,
    true
  );
  
  // Charger tous les profils disponibles
  const [allProfilesState, fetchAllProfiles] = useApi(
    getAllProfiles,
    true
  );
  
  // État pour les actions en cours
  const [creatingRender, setCreatingRender] = useState(false);

  useEffect(() => {
    if (projectState.data) {
      setProject(projectState.data as Project);
    }
  }, [projectState.data]);

  useEffect(() => {
    if (repositoriesState.data) {
      const repos = repositoriesState.data as Repository[];
      setRepositories(repos);
      setHasRepositories(repos.length > 0);
    }
  }, [repositoriesState.data]);

  useEffect(() => {
    if (linkedProfilesState.data) {
      const profilesData = linkedProfilesState.data as { profiles: GourceProfile[], default_profile_id: string };
      setLinkedProfiles(profilesData.profiles || []);
      setDefaultProfile(profilesData.default_profile_id || null);
    }
  }, [linkedProfilesState.data]);

  useEffect(() => {
    if (allProfilesState.data) {
      setAvailableProfiles(allProfilesState.data as GourceProfile[]);
    }
  }, [allProfilesState.data]);
  
  const handleRender = (profile: GourceProfile) => {
    // Check if the project has repositories before showing the render form
    if (!hasRepositories) {
      addNotification({
        type: 'error',
        message: 'Cannot create a render: this project has no repositories',
        duration: 3000
      });
      return;
    }
    
    setCurrentProfile(profile);
    setShowRenderForm(true);
  };
  
  const handleCloseModal = () => {
    setShowRenderForm(false);
    setShowLinkProfileModal(false);
    setCurrentProfile(null);
  };
  
  const handleCreateRender = async (renderOptions: Omit<RenderOptions, 'config_id'> & { config_id?: string }) => {
    try {
      setCreatingRender(true);
      
      // Vérifier que currentProfile n'est pas null
      if (!currentProfile) {
        throw new Error("Aucun profil sélectionné");
      }
      
      // Transformer les options pour correspondre à l'API
      const apiOptions: RenderOptions = {
        config_id: currentProfile.id,
        output_format: renderOptions.output_format,
        quality: renderOptions.quality
      };
      
      const response = await api.post('/gource/renders', apiOptions);
      
      addNotification({
        type: 'success',
        message: 'The render has been initiated. You will be notified when it is complete.',
        duration: 3000
      });
      
      // Close the modal
      handleCloseModal();
      
      // Redirect to a future render tracking page
      // navigate(`/renders/${response.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during rendering';
      addNotification({
        type: 'error',
        message: `Error: ${errorMessage}`,
        duration: 3000
      });
    } finally {
      setCreatingRender(false);
    }
  };
  
  const handleAddRepository = () => {
    navigate(`/repositories/add?project_id=${safeProjectId}`);
  };
  
  const handleOpenLinkProfileModal = () => {
    fetchAllProfiles();
    setShowLinkProfileModal(true);
  };

  const handleLinkProfile = async (profileId: string) => {
    try {
      await api.gource.linkProfileToProject(profileId, safeProjectId);
      
      addNotification({
        type: 'success',
        message: 'Profile linked to project successfully',
        duration: 3000
      });
      
      fetchLinkedProfiles();
    } catch (err) {
      console.error('Error linking profile to project:', err);
      addNotification({
        type: 'error',
        message: 'Failed to link profile to project',
        duration: 3000
      });
    }
  };

  const handleUnlinkProfile = async (profileId: string) => {
    try {
      await api.gource.unlinkProfileFromProject(profileId, safeProjectId);
      
      addNotification({
        type: 'success',
        message: 'Profile unlinked from project successfully',
        duration: 3000
      });
      
      fetchLinkedProfiles();
    } catch (err) {
      console.error('Error unlinking profile from project:', err);
      addNotification({
        type: 'error',
        message: 'Failed to unlink profile from project',
        duration: 3000
      });
    }
  };

  const handleSetAsDefault = async (profileId: string) => {
    try {
      await api.gource.setProfileAsDefault(profileId, safeProjectId);
      
      addNotification({
        type: 'success',
        message: 'Default profile set successfully',
        duration: 3000
      });
      
      setDefaultProfile(profileId);
      fetchLinkedProfiles();
    } catch (err) {
      console.error('Error setting default profile:', err);
      addNotification({
        type: 'error',
        message: 'Failed to set default profile',
        duration: 3000
      });
    }
  };
  
  const handleCreateProfile = () => {
    navigate('/profiles/create');
  };
  
  const handleEditProfile = (profileId: string) => {
    navigate(`/profiles/${profileId}`);
  };
  
  if (projectState.loading || linkedProfilesState.loading) {
    return <LoadingState>Loading project and profiles...</LoadingState>;
  }
  
  if (projectState.error) {
    return (
      <Container>
        <ErrorMessage>Error: {projectState.error}</ErrorMessage>
        <BackButton onClick={() => navigate('/projects')}>
          <FaArrowLeft /> Back to projects
        </BackButton>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <BackButton onClick={() => navigate(`/projects/${safeProjectId}`)}>
            <FaArrowLeft /> Back to project
          </BackButton>
          <Title>Gource Visualization - {project?.name}</Title>
          <Subtitle>
            Configure and generate Gource visualizations for this project
          </Subtitle>
        </HeaderLeft>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <LinkButton onClick={handleOpenLinkProfileModal}>
            <FaLink /> Link Profile
          </LinkButton>
          <Button onClick={handleCreateProfile}>
            <FaPlus /> Create New Profile
          </Button>
        </div>
      </Header>
      
      {!hasRepositories && (
        <WarningMessage>
          <div>
            <strong>No repositories found!</strong> You need to add at least one repository to this project before creating a Gource visualization.
          </div>
          <ActionButton onClick={handleAddRepository}>
            Add Repository
          </ActionButton>
        </WarningMessage>
      )}
      
      {hasRepositories && !linkedProfiles.length && (
        <InfoMessage>
          <FaInfo size={24} />
          <div>
            <strong>No profiles linked!</strong> Link an existing profile or create a new one to start visualizing this project with Gource.
          </div>
        </InfoMessage>
      )}
      
      <PageContent>
        {linkedProfilesState.error ? (
          <ErrorMessage>Error loading profiles: {linkedProfilesState.error}</ErrorMessage>
        ) : linkedProfiles.length === 0 ? (
          <EmptyState>
            <EmptyTitle>No Gource Profiles Linked</EmptyTitle>
            <EmptyText>
              To generate Gource visualizations, link or create a profile with the visualization settings you prefer.
            </EmptyText>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <LinkButton onClick={handleOpenLinkProfileModal}>
                <FaLink /> Link Existing Profile
              </LinkButton>
              <Button onClick={handleCreateProfile}>
                <FaPlus /> Create New Profile
              </Button>
            </div>
          </EmptyState>
        ) : (
          <ProfilesGrid>
            {linkedProfiles.map(profile => (
              <ProfileCard key={profile.id} isDefault={profile.id === defaultProfile}>
                <ProfileCardHeader>
                  <ProfileCardTitle>
                    {profile.name}
                    {profile.id === defaultProfile && (
                      <DefaultBadge>Default</DefaultBadge>
                    )}
                  </ProfileCardTitle>
                </ProfileCardHeader>
                <ProfileCardBody>
                  <ProfileDescription>
                    {profile.description || 'No description provided'}
                  </ProfileDescription>
                  <ProfileSettings>
                    <SettingItem>
                      <SettingLabel>Resolution:</SettingLabel>
                      <span>{profile.resolution}</span>
                    </SettingItem>
                    <SettingItem>
                      <SettingLabel>Speed:</SettingLabel>
                      <span>{profile.speed}x</span>
                    </SettingItem>
                    <SettingItem>
                      <SettingLabel>Avatars:</SettingLabel>
                      <span>{profile.avatars_enabled ? 'Enabled' : 'Disabled'}</span>
                    </SettingItem>
                  </ProfileSettings>
                </ProfileCardBody>
                <ProfileCardFooter>
                  <div>
                    {profile.id !== defaultProfile && (
                      <CardButton 
                        className="success" 
                        onClick={() => handleSetAsDefault(profile.id)}
                        title="Set as default profile"
                      >
                        <FaStar /> Default
                      </CardButton>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <CardButton 
                      className="primary" 
                      onClick={() => handleEditProfile(profile.id)}
                      title="Edit profile"
                    >
                      <FaEdit />
                    </CardButton>
                    <CardButton 
                      className="danger" 
                      onClick={() => handleUnlinkProfile(profile.id)}
                      title="Unlink profile"
                    >
                      <FaUnlink />
                    </CardButton>
                    <CardButton 
                      className="success" 
                      onClick={() => handleRender(profile)}
                      title="Generate visualization"
                    >
                      <FaPlay />
                    </CardButton>
                  </div>
                </ProfileCardFooter>
              </ProfileCard>
            ))}
          </ProfilesGrid>
        )}
      </PageContent>
      
      {/* Modal for render form */}
      {showRenderForm && currentProfile && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Create a Gource Render</ModalTitle>
              <CloseButton onClick={handleCloseModal}>×</CloseButton>
            </ModalHeader>
            <GourceRenderForm
              profile_id={currentProfile.id}
              onSubmit={handleCreateRender}
              onCancel={handleCloseModal}
              loading={creatingRender}
            />
          </ModalContent>
        </Modal>
      )}
      
      {/* Modal for linking profiles */}
      {showLinkProfileModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Link Gource Profile</ModalTitle>
              <CloseButton onClick={handleCloseModal}>×</CloseButton>
            </ModalHeader>
            
            {allProfilesState.loading ? (
              <LoadingState>Loading available profiles...</LoadingState>
            ) : allProfilesState.error ? (
              <ErrorMessage>Error loading profiles: {allProfilesState.error}</ErrorMessage>
            ) : (
              <div>
                <h3>Available Profiles</h3>
                {availableProfiles
                  .filter(profile => !linkedProfiles.some(lp => lp.id === profile.id))
                  .length === 0 ? (
                  <p>No more profiles available. Create a new profile to link to this project.</p>
                ) : (
                  <ProfilesGrid>
                    {availableProfiles
                      .filter(profile => !linkedProfiles.some(lp => lp.id === profile.id))
                      .map(profile => (
                        <ProfileCard key={profile.id}>
                          <ProfileCardHeader>
                            <ProfileCardTitle>
                              {profile.name}
                              {profile.is_default && (
                                <DefaultBadge>Default</DefaultBadge>
                              )}
                            </ProfileCardTitle>
                          </ProfileCardHeader>
                          <ProfileCardBody>
                            <ProfileDescription>
                              {profile.description || 'No description provided'}
                            </ProfileDescription>
                            <ProfileSettings>
                              <SettingItem>
                                <SettingLabel>Resolution:</SettingLabel>
                                <span>{profile.resolution}</span>
                              </SettingItem>
                              <SettingItem>
                                <SettingLabel>Speed:</SettingLabel>
                                <span>{profile.speed}x</span>
                              </SettingItem>
                              <SettingItem>
                                <SettingLabel>Avatars:</SettingLabel>
                                <span>{profile.avatars_enabled ? 'Enabled' : 'Disabled'}</span>
                              </SettingItem>
                            </ProfileSettings>
                          </ProfileCardBody>
                          <ProfileCardFooter>
                            <div></div>
                            <Button 
                              onClick={() => handleLinkProfile(profile.id)}
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                            >
                              <FaLink /> Link to Project
                            </Button>
                          </ProfileCardFooter>
                        </ProfileCard>
                      ))}
                  </ProfilesGrid>
                )}
              </div>
            )}
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default GourceConfigPage; 