import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import GourceConfigForm from '../components/gource/GourceConfigForm';
import GourceConfigList from '../components/gource/GourceConfigList';
import GourceRenderForm from '../components/gource/GourceRenderForm';
import { useNotification } from '../components/ui/NotificationContext';
import { useApi } from '../hooks/useApi';
import api from '../services/api';

interface Project {
  id: string;
  name: string;
  description: string;
}

interface GourceConfig {
  id: string;
  project_id: string;
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

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  margin: 0;
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
  
  &:hover {
    background-color: #45a049;
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

const GourceConfigPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [showRenderForm, setShowRenderForm] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<GourceConfig | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  
  // S'assurer que projectId n'est pas undefined
  const safeProjectId = projectId || '';
  
  // Définir les fonctions d'API de manière stable
  const getProject = useCallback(() => api.projects.getById(safeProjectId), [safeProjectId]);
  const getConfigs = useCallback(() => api.gource.getConfigsByProject(safeProjectId), [safeProjectId]);
  
  // Charger les détails du projet
  const [projectState, fetchProject] = useApi(
    getProject,
    true
  );
  
  // Charger les configurations Gource
  const [configsState, fetchConfigs] = useApi(
    getConfigs,
    true
  );
  
  // État pour les actions en cours
  const [savingConfig, setSavingConfig] = useState(false);
  const [creatingRender, setCreatingRender] = useState(false);

  useEffect(() => {
    if (projectState.data) {
      setProject(projectState.data as Project);
    }
  }, [projectState.data]);

  const handleCreateConfig = () => {
    setCurrentConfig(null);
    setShowConfigForm(true);
  };
  
  const handleEditConfig = (config: GourceConfig) => {
    setCurrentConfig(config);
    setShowConfigForm(true);
  };
  
  const handleViewConfig = (config: GourceConfig) => {
    // Future implementation for preview
    addNotification({
      type: 'info',
      message: 'Preview will be implemented soon'
    });
  };
  
  const handleConfigRender = (config: GourceConfig) => {
    setCurrentConfig(config);
    setShowRenderForm(true);
  };
  
  const handleCloseModal = () => {
    setShowConfigForm(false);
    setShowRenderForm(false);
    setCurrentConfig(null);
  };
  
  const handleSaveConfig = async (configData: any) => {
    try {
      setSavingConfig(true);
      
      // Update or create a configuration
      if (currentConfig?.id) {
        await api.gource.updateConfig(currentConfig.id, configData);
        addNotification({
          type: 'success',
          message: 'Configuration updated successfully'
        });
      } else {
        await api.gource.createConfig(configData);
        addNotification({
          type: 'success',
          message: 'Configuration created successfully'
        });
      }
      
      // Refresh the list
      fetchConfigs();
      handleCloseModal();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      addNotification({
        type: 'error',
        message: `Error: ${errorMessage}`
      });
    } finally {
      setSavingConfig(false);
    }
  };
  
  const handleCreateRender = async (renderOptions: RenderOptions) => {
    try {
      setCreatingRender(true);
      const response = await api.gource.createRender(renderOptions);
      
      addNotification({
        type: 'success',
        message: 'The render has been initiated. You will be notified when it is complete.'
      });
      
      // Close the modal
      handleCloseModal();
      
      // Redirect to a future render tracking page
      // navigate(`/renders/${response.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during rendering';
      addNotification({
        type: 'error',
        message: `Error: ${errorMessage}`
      });
    } finally {
      setCreatingRender(false);
    }
  };
  
  if (projectState.loading) {
    return <LoadingState>Loading project...</LoadingState>;
  }
  
  if (projectState.error) {
    return (
      <Container>
        <div>Error: {projectState.error}</div>
        <BackButton onClick={() => navigate('/projects')}>
          Back to projects
        </BackButton>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <BackButton onClick={() => navigate(`/projects/${safeProjectId}`)}>
            ← Back to project
          </BackButton>
          <Title>Gource Configurations - {project?.name}</Title>
        </div>
        <Button onClick={handleCreateConfig}>
          New configuration
        </Button>
      </Header>
      
      <PageContent>
        {configsState.loading ? (
          <LoadingState>Loading configurations...</LoadingState>
        ) : configsState.error ? (
          <div>Error loading configurations: {configsState.error}</div>
        ) : (
          <GourceConfigList
            configs={configsState.data as GourceConfig[] || []}
            onSelect={handleViewConfig}
            onEdit={handleEditConfig}
            onRender={handleConfigRender}
          />
        )}
      </PageContent>
      
      {/* Modal for configuration form */}
      {showConfigForm && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {currentConfig ? 'Edit configuration' : 'New configuration'}
              </ModalTitle>
              <CloseButton onClick={handleCloseModal}>×</CloseButton>
            </ModalHeader>
            <GourceConfigForm
              initialConfig={currentConfig || undefined}
              projectId={safeProjectId}
              onSubmit={handleSaveConfig}
              onCancel={handleCloseModal}
              loading={savingConfig}
            />
          </ModalContent>
        </Modal>
      )}
      
      {/* Modal for render form */}
      {showRenderForm && currentConfig && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Create a render</ModalTitle>
              <CloseButton onClick={handleCloseModal}>×</CloseButton>
            </ModalHeader>
            <GourceRenderForm
              configId={currentConfig.id}
              onSubmit={handleCreateRender}
              onCancel={handleCloseModal}
              loading={creatingRender}
            />
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default GourceConfigPage; 