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

interface RepositoryFormProps {
  repositoryId?: string;
  projectId?: string;
  onSuccess?: () => void;
}

interface RepositoryFormData {
  project_id: string;
  url: string;
}

interface Project {
  id: string;
  name: string;
}

interface Repository {
  id: string;
  name: string;
  url: string | null;
  project_id: string;
  local_path: string | null;
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
  });

  // Liste des projets disponibles
  const [projects, setProjects] = useState<Project[]>([]);

  // Charger la liste des projets au démarrage
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await api.projects.getAll();
        setProjects(response.data);
      } catch (err) {
        console.error('Erreur lors du chargement des projets:', err);
      }
    };
    
    loadProjects();
  }, []);

  useEffect(() => {
    // Si repositoryId est fourni, charger les données du dépôt pour l'édition
    if (repositoryId) {
      const fetchRepository = async () => {
        try {
          setLoading(true);
          const response = await api.repositories.getById(repositoryId);
          const repository = response.data;
          setFormData({
            project_id: repository.project_id,
            url: repository.url || '',
          });
          setLoading(false);
        } catch (error) {
          setError('Erreur lors du chargement du dépôt');
          setLoading(false);
        }
      };

      fetchRepository();
    }
  }, [repositoryId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!formData.project_id) {
        setError('Le projet est requis');
        setLoading(false);
        return;
      }
      
      if (!formData.url.trim()) {
        setError("L'URL du dépôt Git est requise");
        setLoading(false);
        return;
      }
      
      // Extraire le nom du dépôt à partir de l'URL
      const name = extractRepoName(formData.url);
      
      if (!name) {
        setError("Impossible d'extraire le nom du dépôt à partir de l'URL");
        setLoading(false);
        return;
      }
      
      const repositoryData = {
        ...formData,
        name,
      };
      
      if (repositoryId) {
        // Mise à jour d'un dépôt existant
        await api.repositories.update(repositoryId, repositoryData);
      } else {
        // Création d'un nouveau dépôt
        await api.repositories.create(repositoryData);
      }
      
      setLoading(false);
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/repositories');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/repositories');
  };

  return (
    <FormContainer>
      <FormTitle>{repositoryId ? 'Modifier le dépôt' : 'Ajouter un dépôt Git'}</FormTitle>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
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