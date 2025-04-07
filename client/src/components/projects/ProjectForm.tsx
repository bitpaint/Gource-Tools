import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import api, { projectsApi } from '../../services/api';

const FormContainer = styled.div`
  background-color: ${props => props.theme.colors.white};
  padding: 2rem;
  border-radius: ${props => props.theme.borderRadius.medium};
  box-shadow: ${props => props.theme.shadows.medium};
  max-width: 800px;
  margin: 0 auto;
`;

const FormTitle = styled.h2`
  color: ${props => props.theme.colors.text};
  margin-bottom: 1.5rem;
  font-weight: ${props => props.theme.typography.fontWeight.semiBold};
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  color: ${props => props.theme.colors.text};
  background-color: ${props => props.theme.colors.white};
  border: 1px solid ${props => props.theme.colors.borderColor};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.typography.fontSize.base};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}30;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  color: ${props => props.theme.colors.text};
  background-color: ${props => props.theme.colors.white};
  border: 1px solid ${props => props.theme.colors.borderColor};
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: ${props => props.theme.typography.fontSize.base};
  min-height: 120px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}30;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: ${props => props.theme.borderRadius.small};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  
  &:active {
    transform: translateY(1px);
  }
`;

const CancelButton = styled(Button)`
  background-color: ${props => props.theme.colors.light};
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.borderColor};
  
  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
`;

const SubmitButton = styled(Button)`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  
  &:hover {
    background-color: ${props => props.theme.colors.primaryDark};
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.borderColor};
    cursor: not-allowed;
  }
`;

interface ProjectFormProps {
  projectId?: string;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const isEditMode = !!projectId;
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isEditMode) {
      fetchProjectDetails();
    }
  }, [projectId, isEditMode]);
  
  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await projectsApi.getById(projectId as string);
      const project = response.data;
      setFormData({
        name: project.name,
        description: project.description || ''
      });
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error);
      setError('Impossible de charger les détails du projet. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (isEditMode) {
        await projectsApi.update(projectId as string, formData);
      } else {
        await projectsApi.create(formData);
      }
      
      // Rediriger vers la liste des projets après le succès
      navigate('/projects');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du projet:', error);
      setError('Une erreur est survenue lors de l\'enregistrement du projet. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };
  
  return (
    <FormContainer>
      <FormTitle>{isEditMode ? 'Modifier le projet' : 'Créer un nouveau projet'}</FormTitle>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">Nom du projet</Label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Ex: Mon projet Gource"
          />
        </FormGroup>
        
        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <TextArea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
            placeholder="Description du projet (optionnelle)"
          />
        </FormGroup>
        
        <ButtonContainer>
          <CancelButton type="button" onClick={() => navigate('/projects')} disabled={loading}>
            Annuler
          </CancelButton>
          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Chargement...' : isEditMode ? 'Mettre à jour' : 'Créer'}
          </SubmitButton>
        </ButtonContainer>
      </form>
    </FormContainer>
  );
};

export default ProjectForm; 