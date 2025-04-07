import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useApi from '../../hooks/useApi';

const FormContainer = styled.div`
  background-color: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.medium};
  box-shadow: ${props => props.theme.shadows.small};
  max-width: 600px;
  margin: 0 auto;
`;

const FormTitle = styled.h2`
  margin-bottom: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.text};
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  margin-bottom: ${props => props.theme.spacing.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const Input = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.borderColor};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.typography.fontSize.base};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}30;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.borderColor};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.typography.fontSize.base};
  background-color: ${props => props.theme.colors.white};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}30;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
`;

const Button = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.small};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled(Button)`
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  border: none;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme.colors.primary}dd;
  }
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.borderColor};
  
  &:hover {
    background-color: ${props => props.theme.colors.light};
  }
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.danger};
  margin-top: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.small};
`;

const HelpText = styled.div`
  color: ${props => props.theme.colors.secondary};
  margin-top: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.small};
`;

const WarningMessage = styled.div`
  color: ${props => props.theme.colors.warning};
  margin-top: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.small};
`;

interface RepositoryFormProps {
  repositoryId?: string;
  projectId?: string;
  onSuccess?: () => void;
}

interface RepositoryFormData {
  project_id: string;
  url: string;
  tags?: string;
}

interface Project {
  id: string;
  name: string;
}

interface Repository {
  id: string;
  name: string;
  username: string | null;
  url: string | null;
  project_id: string;
  local_path: string | null;
  tags: string | null;
}

// Fonction pour extraire le nom du dépôt à partir de l'URL Git
const extractRepoName = (url: string): string => {
  if (!url) return '';
  
  // Retirer l'extension .git si présente
  let repoName = url.trim().replace(/\.git$/, '');
  
  // Extraire le nom du dépôt après le dernier '/' ou ':'
  const parts = repoName.split(/[\/:]/).filter(Boolean);
  return parts[parts.length - 1] || '';
};

const RepositoryForm: React.FC<RepositoryFormProps> = ({ repositoryId, projectId, onSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RepositoryFormData>({
    project_id: projectId || '',
    url: '',
    tags: '',
  });
  // Checking if repository URL already exists
  const [existingRepositories, setExistingRepositories] = useState<Repository[]>([]);
  const [urlExists, setUrlExists] = useState(false);

  // Liste des projets disponibles
  const [projects, setProjects] = useState<Project[]>([]);

  // Charger la liste des projets et des repositories au démarrage
  useEffect(() => {
    const loadProjectsAndRepositories = async () => {
      try {
        const [projectsResponse, repositoriesResponse] = await Promise.all([
          api.projects.getAll(),
          api.get('/repositories')
        ]);
        setProjects(projectsResponse.data);
        setExistingRepositories(repositoriesResponse.data);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
      }
    };
    
    loadProjectsAndRepositories();
  }, []);

  // Check if URL already exists when it changes
  useEffect(() => {
    if (formData.url.trim()) {
      const exists = existingRepositories.some(repo => 
        repo.url && repo.url.toLowerCase() === formData.url.toLowerCase() && 
        (!repositoryId || repo.id !== repositoryId) // Ignore current repository when editing
      );
      setUrlExists(exists);
    } else {
      setUrlExists(false);
    }
  }, [formData.url, existingRepositories, repositoryId]);

  useEffect(() => {
    // Si repositoryId est fourni, charger les données du dépôt pour l'édition
    if (repositoryId) {
      const fetchRepository = async () => {
        try {
          setLoading(true);
          const response = await api.repositories.getById(repositoryId);
          const repository = response.data;
          setFormData({
            project_id: repository.project_id || projectId || '',
            url: repository.url || '',
            tags: repository.tags || '',
          });
          setLoading(false);
        } catch (error) {
          setError('Erreur lors du chargement du dépôt');
          setLoading(false);
        }
      };

      fetchRepository();
    }
  }, [repositoryId, projectId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_id) {
      setError('Le projet est requis');
      return;
    }
    
    if (!formData.url.trim()) {
      setError('L\'URL du dépôt est requise');
      return;
    }
    
    if (!isValidUrl(formData.url)) {
      setError('L\'URL du dépôt est invalide');
      return;
    }

    // Check if URL already exists
    if (urlExists) {
      setError('Ce dépôt existe déjà. Veuillez utiliser celui existant.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Création ou mise à jour du dépôt
      if (repositoryId) {
        await api.repositories.update(repositoryId, formData);
      } else {
        await api.repositories.create(formData);
      }
      
      // Redirection ou callback de succès
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/projects/${formData.project_id}`);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du dépôt:', error);
      setError('Une erreur est survenue lors de la sauvegarde du dépôt');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
    } else {
      navigate('/repositories');
    }
  };
  
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <FormContainer>
      <FormTitle>{repositoryId ? 'Modifier le dépôt' : 'Ajouter un dépôt Git'}</FormTitle>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {urlExists && (
        <WarningMessage>
          Cette URL de dépôt existe déjà dans le système. Veuillez utiliser le dépôt existant au lieu d'en créer un nouveau.
        </WarningMessage>
      )}
      
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="project_id">Projet *</Label>
          <Select
            id="project_id"
            name="project_id"
            value={formData.project_id}
            onChange={handleChange}
            required
            disabled={loading || !!projectId}
          >
            <option value="">Sélectionnez un projet</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="url">URL du dépôt Git *</Label>
          <Input
            type="text"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://github.com/username/repo.git"
            required
            disabled={loading}
          />
          <HelpText>
            L'URL de clonage du dépôt Git. Par exemple, https://github.com/username/repo.git
          </HelpText>
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
          <Input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags || ''}
            onChange={handleChange}
            placeholder="frontend, react, ui, etc."
            disabled={loading}
          />
          <HelpText>
            Ajoutez des tags pour mieux organiser vos dépôts. Ces tags ne seront pas écrasés lors des synchronisations.
          </HelpText>
        </FormGroup>
        
        <ButtonContainer>
          <CancelButton type="button" onClick={handleCancel}>
            Annuler
          </CancelButton>
          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Chargement...' : repositoryId ? 'Mettre à jour' : 'Ajouter'}
          </SubmitButton>
        </ButtonContainer>
      </form>
    </FormContainer>
  );
};

export default RepositoryForm; 