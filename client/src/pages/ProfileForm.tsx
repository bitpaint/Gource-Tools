import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useNotification } from '../components/ui/NotificationContext';
import api from '../services/api';

interface GourceProfile {
  id?: string;
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
}

const Container = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const FormSection = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
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
  padding: 0.8rem;
  border: 1px solid ${({ theme }) => theme.colors.borderColor};
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid ${({ theme }) => theme.colors.borderColor};
  border-radius: 4px;
  font-size: 1rem;
  min-height: 120px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid ${({ theme }) => theme.colors.borderColor};
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  
  label {
    margin: 0;
    cursor: pointer;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: #f5f5f5;
  color: ${({ theme }) => theme.colors.text};
  
  &:hover:not(:disabled) {
    background-color: #e0e0e0;
  }
`;

const SaveButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  margin-top: 0.5rem;
  font-size: 0.9rem;
`;

const DateInput = styled(Input).attrs({ type: 'date' })``;

const ColorInput = styled(Input).attrs({ type: 'color' })`
  height: 40px;
  padding: 0.4rem;
  cursor: pointer;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.1rem;
`;

const ProfileForm: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  const [loading, setLoading] = useState(profileId ? true : false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const initialProfileState: GourceProfile = {
    name: '',
    description: '',
    speed: 1.0,
    resolution: '1280x720',
    background_color: '#000000',
    avatars_enabled: true,
    avatar_size: 30,
    custom_options: '',
    is_default: false
  };
  
  const [profile, setProfile] = useState<GourceProfile>(initialProfileState);
  
  useEffect(() => {
    // Si on a un ID de profil, on charge les données du profil existant
    if (profileId) {
      fetchProfile(profileId);
    }
  }, [profileId]);
  
  const fetchProfile = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.gource.getProfileById(id);
      setProfile(response.data);
      setErrors({});
    } catch (err) {
      console.error('Error loading profile:', err);
      addNotification({
        type: 'error',
        message: 'Failed to load profile data',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const updatedValue = type === 'number' ? parseFloat(value) : value;
    
    setProfile(prev => ({
      ...prev,
      [name]: updatedValue
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setProfile(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!profile.name.trim()) {
      newErrors.name = 'Profile name is required';
    }
    
    if (isNaN(profile.speed) || profile.speed <= 0) {
      newErrors.speed = 'Speed must be a positive number';
    }
    
    if (!profile.resolution.match(/^\d+x\d+$/)) {
      newErrors.resolution = 'Resolution must be in format WIDTHxHEIGHT (e.g. 1280x720)';
    }
    
    if (profile.avatar_size <= 0) {
      newErrors.avatar_size = 'Avatar size must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      if (profileId) {
        // Mise à jour d'un profil existant
        await api.gource.updateProfile(profileId, profile);
        addNotification({
          type: 'success',
          message: 'Profile updated successfully',
          duration: 3000
        });
      } else {
        // Création d'un nouveau profil
        await api.gource.createProfile(profile);
        addNotification({
          type: 'success',
          message: 'Profile created successfully',
          duration: 3000
        });
      }
      
      // Rediriger vers la liste des profils
      navigate('/profiles');
    } catch (err) {
      console.error('Error saving profile:', err);
      addNotification({
        type: 'error',
        message: 'Failed to save profile',
        duration: 3000
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/profiles');
  };
  
  if (loading) {
    return <LoadingIndicator>Loading profile data...</LoadingIndicator>;
  }
  
  return (
    <Container>
      <Header>
        <Title>{profileId ? 'Edit Profile' : 'Create Profile'}</Title>
      </Header>
      
      <form onSubmit={handleSubmit}>
        <FormSection>
          <FormGroup>
            <Label htmlFor="name">Profile Name</Label>
            <Input
              id="name"
              name="name"
              value={profile.name}
              onChange={handleChange}
              placeholder="Enter profile name"
            />
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={profile.description}
              onChange={handleChange}
              placeholder="Enter a description for this profile"
            />
          </FormGroup>
        </FormSection>
        
        <FormSection>
          <h2>Gource Parameters</h2>
          
          <FormGroup>
            <Label htmlFor="speed">Animation Speed</Label>
            <Input
              id="speed"
              name="speed"
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={profile.speed}
              onChange={handleChange}
            />
            {errors.speed && <ErrorMessage>{errors.speed}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="resolution">Resolution</Label>
            <Select
              id="resolution"
              name="resolution"
              value={profile.resolution}
              onChange={handleChange}
            >
              <option value="1280x720">1280x720 (720p)</option>
              <option value="1920x1080">1920x1080 (1080p)</option>
              <option value="2560x1440">2560x1440 (1440p)</option>
              <option value="3840x2160">3840x2160 (4K)</option>
            </Select>
            {errors.resolution && <ErrorMessage>{errors.resolution}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="background_color">Background Color</Label>
            <ColorInput
              id="background_color"
              name="background_color"
              value={profile.background_color}
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Checkbox>
              <input
                id="avatars_enabled"
                name="avatars_enabled"
                type="checkbox"
                checked={profile.avatars_enabled}
                onChange={handleCheckboxChange}
              />
              <Label htmlFor="avatars_enabled">Show avatars</Label>
            </Checkbox>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="avatar_size">Avatar Size</Label>
            <Input
              id="avatar_size"
              name="avatar_size"
              type="number"
              min="1"
              max="100"
              value={profile.avatar_size}
              onChange={handleChange}
              disabled={!profile.avatars_enabled}
            />
            {errors.avatar_size && <ErrorMessage>{errors.avatar_size}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="start_date">Start Date (Optional)</Label>
            <DateInput
              id="start_date"
              name="start_date"
              value={profile.start_date || ''}
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="end_date">End Date (Optional)</Label>
            <DateInput
              id="end_date"
              name="end_date"
              value={profile.end_date || ''}
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="custom_options">Custom Gource Options</Label>
            <Textarea
              id="custom_options"
              name="custom_options"
              value={profile.custom_options}
              onChange={handleChange}
              placeholder="Enter additional Gource command line options"
            />
          </FormGroup>
        </FormSection>
        
        <ButtonGroup>
          <CancelButton type="button" onClick={handleCancel}>
            Cancel
          </CancelButton>
          <SaveButton type="submit" disabled={saving}>
            {saving ? 'Saving...' : profileId ? 'Update Profile' : 'Create Profile'}
          </SaveButton>
        </ButtonGroup>
      </form>
    </Container>
  );
};

export default ProfileForm; 