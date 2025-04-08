import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useNotification } from '../components/ui/NotificationContext';
import { FaInfoCircle, FaRedo, FaQuestionCircle } from 'react-icons/fa';
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
  
  // Paramètres Gource supplémentaires
  hide_filenames: boolean;
  hide_usernames: boolean;
  hide_date: boolean;
  hide_files: boolean;
  hide_users: boolean;
  hide_tree: boolean;
  hide_root: boolean;
  hide_bloom: boolean;
  highlight_users: string;
  highlight_dirs: string;
  file_idle_time: number;
  max_user_speed: number;
  camera_mode: string;
  padding: number;
  title: string;
  logo: string;
  background_image: string;
  font_size: number;
  dir_depth: number;
  filename_time: number;
  max_files: number;
  seconds_per_day: number;
  auto_skip_seconds: number;
  time_scale: number;
  elasticity: number;
  date_format: string;
  font_color: string;
  key: string;
}

const Container = styled.div`
  padding: 2rem;
  max-width: 900px;
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
  position: relative;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const TooltipIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  color: ${({ theme }) => theme.colors.primary};
  cursor: help;
  position: relative;
`;

const TooltipContent = styled.div<{ visible: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  width: 300px;
  background-color: ${({ theme }) => theme.colors.dark};
  color: white;
  padding: 0.8rem;
  border-radius: 4px;
  font-weight: normal;
  font-size: 0.85rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  display: ${props => props.visible ? 'block' : 'none'};
  
  &::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 10px;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid ${({ theme }) => theme.colors.dark};
  }
`;

const ImagePlaceholder = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px dashed ${({ theme }) => theme.colors.borderColor};
  border-radius: 4px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.5rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.9rem;
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
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.background};
    cursor: not-allowed;
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

const ResetButton = styled(Button)`
  background-color: #FF9800;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #F57C00;
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

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
  margin-top: 0;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.1rem;
`;

const Tooltip: React.FC<{ content: string; image?: string }> = ({ content, image }) => {
  const [visible, setVisible] = useState(false);
  
  return (
    <TooltipIcon 
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <FaInfoCircle size={16} />
      <TooltipContent visible={visible}>
        {content}
        {image && (
          <ImagePlaceholder>
            Future image placeholder for this setting
          </ImagePlaceholder>
        )}
      </TooltipContent>
    </TooltipIcon>
  );
};

const DefaultBadge = styled.span`
  background-color: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-left: 1rem;
`;

const ProfileForm: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  const [loading, setLoading] = useState(profileId ? true : false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  const initialProfileState: GourceProfile = {
    name: '',
    description: '',
    speed: 1.0,
    resolution: '1280x720',
    background_color: '#000000',
    avatars_enabled: true,
    avatar_size: 30,
    custom_options: '',
    is_default: false,
    
    // Valeurs par défaut pour les paramètres supplémentaires
    hide_filenames: false,
    hide_usernames: false,
    hide_date: false,
    hide_files: false,
    hide_users: false,
    hide_tree: false,
    hide_root: false,
    hide_bloom: false,
    highlight_users: '',
    highlight_dirs: '',
    file_idle_time: 0,
    max_user_speed: 500,
    camera_mode: 'overview',
    padding: 1.1,
    title: '',
    logo: '',
    background_image: '',
    font_size: 10,
    dir_depth: 3,
    filename_time: 4.0,
    max_files: 1000,
    seconds_per_day: 10,
    auto_skip_seconds: 3,
    time_scale: 1.0,
    elasticity: 0.1,
    date_format: '%Y-%m-%d',
    font_color: '#FFFFFF',
    key: ''
  };
  
  const [profile, setProfile] = useState<GourceProfile>(initialProfileState);
  const [isDefaultProfile, setIsDefaultProfile] = useState(false);
  
  useEffect(() => {
    // Si on a un ID de profil, on charge les données du profil existant
    if (profileId) {
      fetchProfile(profileId);
    } else {
      // Si c'est un nouveau profil, vérifier si on doit créer un profil par défaut
      checkIfDefaultProfileNeeded();
    }
  }, [profileId]);
  
  const checkIfDefaultProfileNeeded = async () => {
    try {
      // Vérifier si un profil par défaut existe déjà
      const response = await api.gource.getProfiles();
      const profiles = response.data;
      const defaultExists = profiles.some((p: GourceProfile) => p.is_default);
      
      // Si aucun profil par défaut n'existe, marquer ce nouveau profil comme par défaut
      if (!defaultExists) {
        setProfile(prev => ({ ...prev, is_default: true, name: 'Default Profile' }));
        setIsDefaultProfile(true);
      }
    } catch (err) {
      console.error('Error checking default profiles:', err);
    }
  };
  
  const fetchProfile = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.gource.getProfileById(id);
      const profileData = response.data;
      
      setProfile(profileData);
      setIsDefaultProfile(profileData.is_default);
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
    let updatedValue: any = value;
    
    // Convertir les valeurs numériques
    if (type === 'number') {
      updatedValue = value === '' ? '' : parseFloat(value);
    }
    
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
    
    // Validation pour les nouveaux champs numériques
    if (profile.max_user_speed < 0) {
      newErrors.max_user_speed = 'Max user speed cannot be negative';
    }
    
    if (profile.padding <= 0) {
      newErrors.padding = 'Padding must be greater than 0';
    }
    
    if (profile.font_size <= 0) {
      newErrors.font_size = 'Font size must be greater than 0';
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
  
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset this profile to default values?')) {
      setProfile({
        ...initialProfileState,
        id: profile.id,
        name: profile.name,
        description: profile.description,
        is_default: profile.is_default
      });
      addNotification({
        type: 'info',
        message: 'Profile reset to default values',
        duration: 3000
      });
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
        <Title>
          {profileId ? `Edit Profile: ${profile.name}` : 'Create Profile'}
          {isDefaultProfile && <DefaultBadge>Default Profile</DefaultBadge>}
        </Title>
      </Header>
      
      <form onSubmit={handleSubmit}>
        <FormSection>
          <SectionTitle>Basic Information</SectionTitle>
          
          <FormGroup>
            <Label htmlFor="name">
              Profile Name
              <Tooltip content="A unique name to identify this profile" />
            </Label>
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
            <Label htmlFor="description">
              Description
              <Tooltip content="A brief description of what this profile is for or what it customizes" />
            </Label>
            <Textarea
              id="description"
              name="description"
              value={profile.description}
              onChange={handleChange}
              placeholder="Enter a description for this profile"
            />
          </FormGroup>
          
          <FormGroup>
            <Checkbox>
              <input
                id="is_default"
                name="is_default"
                type="checkbox"
                checked={profile.is_default}
                onChange={handleCheckboxChange}
                disabled={isDefaultProfile} // Ne pas permettre de décocher si c'est déjà le profil par défaut
              />
              <Label htmlFor="is_default">
                Use as default profile
                <Tooltip content="When checked, this profile will be automatically applied to new projects. Only one profile can be the default." />
              </Label>
            </Checkbox>
          </FormGroup>
        </FormSection>
        
        <FormSection>
          <SectionTitle>
            Visualization Settings
            <Tooltip content="These settings control the overall appearance and behavior of the Gource visualization" image="true" />
          </SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="speed">
                Animation Speed
                <Tooltip content="Controls how fast the simulation runs. Higher values make the simulation run faster." image="true" />
              </Label>
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
              <Label htmlFor="resolution">
                Resolution
                <Tooltip content="The width and height of the visualization window" />
              </Label>
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
                <option value="custom">Custom Resolution</option>
              </Select>
              {profile.resolution === 'custom' && (
                <Input
                  placeholder="Width x Height (e.g. 1600x900)"
                  style={{ marginTop: '0.5rem' }}
                  onChange={e => setProfile(prev => ({ ...prev, resolution: e.target.value }))}
                />
              )}
              {errors.resolution && <ErrorMessage>{errors.resolution}</ErrorMessage>}
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="background_color">
                Background Color
                <Tooltip content="The color of the background in the visualization" />
              </Label>
              <ColorInput
                id="background_color"
                name="background_color"
                value={profile.background_color}
                onChange={handleChange}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="font_color">
                Font Color
                <Tooltip content="The color of text in the visualization" />
              </Label>
              <ColorInput
                id="font_color"
                name="font_color"
                value={profile.font_color}
                onChange={handleChange}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="camera_mode">
                Camera Mode
                <Tooltip content="How the camera behaves during the visualization" image="true" />
              </Label>
              <Select
                id="camera_mode"
                name="camera_mode"
                value={profile.camera_mode}
                onChange={handleChange}
              >
                <option value="overview">Overview (default)</option>
                <option value="track">Track Active Users</option>
                <option value="follow">Follow the Most Active User</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="padding">
                View Padding
                <Tooltip content="Adjusts the padding around the visualization. Higher values zoom out more." />
              </Label>
              <Input
                id="padding"
                name="padding"
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={profile.padding}
                onChange={handleChange}
              />
              {errors.padding && <ErrorMessage>{errors.padding}</ErrorMessage>}
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="time_scale">
                Time Scale
                <Tooltip content="Adjust the time scale of the simulation. Larger values speed up the simulation relative to real time." />
              </Label>
              <Input
                id="time_scale"
                name="time_scale"
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={profile.time_scale}
                onChange={handleChange}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="seconds_per_day">
                Seconds Per Day
                <Tooltip content="How many seconds to display each day in the repository history" />
              </Label>
              <Input
                id="seconds_per_day"
                name="seconds_per_day"
                type="number"
                min="1"
                max="100"
                value={profile.seconds_per_day}
                onChange={handleChange}
              />
            </FormGroup>
          </FormRow>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="auto_skip_seconds">
                Auto Skip Seconds
                <Tooltip content="Skip to next activity if nothing happens for specified number of seconds" />
              </Label>
              <Input
                id="auto_skip_seconds"
                name="auto_skip_seconds"
                type="number"
                min="0"
                max="60"
                value={profile.auto_skip_seconds}
                onChange={handleChange}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="elasticity">
                Branch Elasticity
                <Tooltip content="Adjust the springiness of the branches. Higher values make branches more dynamic." image="true" />
              </Label>
              <Input
                id="elasticity"
                name="elasticity"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={profile.elasticity}
                onChange={handleChange}
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="date_format">
                Date Format
                <Tooltip content="Format for displaying dates in the visualization. Uses strftime format codes." />
              </Label>
              <Input
                id="date_format"
                name="date_format"
                value={profile.date_format}
                onChange={handleChange}
                placeholder="%Y-%m-%d"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="title">
                Custom Title
                <Tooltip content="Custom title to display in the visualization" />
              </Label>
              <Input
                id="title"
                name="title"
                value={profile.title}
                onChange={handleChange}
                placeholder="Enter a custom title"
              />
            </FormGroup>
          </FormRow>
        </FormSection>
        
        <FormSection>
          <SectionTitle>
            File & User Display
            <Tooltip content="These settings control how files and users are displayed in the visualization" image="true" />
          </SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="avatars_enabled">
                Show User Avatars
                <Tooltip content="Whether to display user avatars in the visualization" image="true" />
              </Label>
              <Checkbox>
                <input
                  id="avatars_enabled"
                  name="avatars_enabled"
                  type="checkbox"
                  checked={profile.avatars_enabled}
                  onChange={handleCheckboxChange}
                />
                <span>Enable user avatars</span>
              </Checkbox>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="avatar_size">
                Avatar Size
                <Tooltip content="Size of user avatars in pixels" />
              </Label>
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
          </FormRow>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="max_user_speed">
                Max User Speed
                <Tooltip content="Maximum speed users can travel in the visualization" />
              </Label>
              <Input
                id="max_user_speed"
                name="max_user_speed"
                type="number"
                min="0"
                max="1000"
                value={profile.max_user_speed}
                onChange={handleChange}
              />
              {errors.max_user_speed && <ErrorMessage>{errors.max_user_speed}</ErrorMessage>}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="file_idle_time">
                File Idle Time
                <Tooltip content="Time in seconds files remain active after they've been touched" />
              </Label>
              <Input
                id="file_idle_time"
                name="file_idle_time"
                type="number"
                min="0"
                max="300"
                value={profile.file_idle_time}
                onChange={handleChange}
              />
            </FormGroup>
          </FormRow>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="dir_depth">
                Directory Depth
                <Tooltip content="Controls how deep the directory structure is visualized" image="true" />
              </Label>
              <Input
                id="dir_depth"
                name="dir_depth"
                type="number"
                min="1"
                max="10"
                value={profile.dir_depth}
                onChange={handleChange}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="filename_time">
                Filename Time
                <Tooltip content="Time in seconds filenames are visible after they are touched" />
              </Label>
              <Input
                id="filename_time"
                name="filename_time"
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={profile.filename_time}
                onChange={handleChange}
              />
            </FormGroup>
          </FormRow>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="max_files">
                Max Files
                <Tooltip content="Maximum number of files to display at once. Use 0 for unlimited." />
              </Label>
              <Input
                id="max_files"
                name="max_files"
                type="number"
                min="0"
                max="100000"
                value={profile.max_files}
                onChange={handleChange}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="font_size">
                Font Size
                <Tooltip content="Size of text in the visualization" />
              </Label>
              <Input
                id="font_size"
                name="font_size"
                type="number"
                min="1"
                max="30"
                value={profile.font_size}
                onChange={handleChange}
              />
              {errors.font_size && <ErrorMessage>{errors.font_size}</ErrorMessage>}
            </FormGroup>
          </FormRow>
        </FormSection>
        
        <FormSection>
          <SectionTitle>
            Visual Effects & Filtering
            <Tooltip content="These settings control which elements are shown or hidden and special visual effects" image="true" />
          </SectionTitle>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormGroup>
              <Checkbox>
                <input
                  id="hide_filenames"
                  name="hide_filenames"
                  type="checkbox"
                  checked={profile.hide_filenames}
                  onChange={handleCheckboxChange}
                />
                <Label htmlFor="hide_filenames">
                  Hide Filenames
                  <Tooltip content="Don't show filenames" />
                </Label>
              </Checkbox>
            </FormGroup>
            
            <FormGroup>
              <Checkbox>
                <input
                  id="hide_usernames"
                  name="hide_usernames"
                  type="checkbox"
                  checked={profile.hide_usernames}
                  onChange={handleCheckboxChange}
                />
                <Label htmlFor="hide_usernames">
                  Hide Usernames
                  <Tooltip content="Don't show usernames" />
                </Label>
              </Checkbox>
            </FormGroup>
            
            <FormGroup>
              <Checkbox>
                <input
                  id="hide_date"
                  name="hide_date"
                  type="checkbox"
                  checked={profile.hide_date}
                  onChange={handleCheckboxChange}
                />
                <Label htmlFor="hide_date">
                  Hide Date
                  <Tooltip content="Don't show the date display" />
                </Label>
              </Checkbox>
            </FormGroup>
            
            <FormGroup>
              <Checkbox>
                <input
                  id="hide_files"
                  name="hide_files"
                  type="checkbox"
                  checked={profile.hide_files}
                  onChange={handleCheckboxChange}
                />
                <Label htmlFor="hide_files">
                  Hide Files
                  <Tooltip content="Don't show files" />
                </Label>
              </Checkbox>
            </FormGroup>
            
            <FormGroup>
              <Checkbox>
                <input
                  id="hide_users"
                  name="hide_users"
                  type="checkbox"
                  checked={profile.hide_users}
                  onChange={handleCheckboxChange}
                />
                <Label htmlFor="hide_users">
                  Hide Users
                  <Tooltip content="Don't show users" />
                </Label>
              </Checkbox>
            </FormGroup>
            
            <FormGroup>
              <Checkbox>
                <input
                  id="hide_tree"
                  name="hide_tree"
                  type="checkbox"
                  checked={profile.hide_tree}
                  onChange={handleCheckboxChange}
                />
                <Label htmlFor="hide_tree">
                  Hide Tree
                  <Tooltip content="Don't show the directory tree" />
                </Label>
              </Checkbox>
            </FormGroup>
            
            <FormGroup>
              <Checkbox>
                <input
                  id="hide_root"
                  name="hide_root"
                  type="checkbox"
                  checked={profile.hide_root}
                  onChange={handleCheckboxChange}
                />
                <Label htmlFor="hide_root">
                  Hide Root
                  <Tooltip content="Don't show the root directory node" />
                </Label>
              </Checkbox>
            </FormGroup>
            
            <FormGroup>
              <Checkbox>
                <input
                  id="hide_bloom"
                  name="hide_bloom"
                  type="checkbox"
                  checked={profile.hide_bloom}
                  onChange={handleCheckboxChange}
                />
                <Label htmlFor="hide_bloom">
                  Hide Bloom
                  <Tooltip content="Disable bloom effect (light glow)" image="true" />
                </Label>
              </Checkbox>
            </FormGroup>
          </div>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="highlight_users">
                Highlight Users
                <Tooltip content="Comma-separated list of users to highlight" />
              </Label>
              <Input
                id="highlight_users"
                name="highlight_users"
                value={profile.highlight_users}
                onChange={handleChange}
                placeholder="e.g. user1,user2,user3"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="highlight_dirs">
                Highlight Directories
                <Tooltip content="Comma-separated list of directories to highlight" />
              </Label>
              <Input
                id="highlight_dirs"
                name="highlight_dirs"
                value={profile.highlight_dirs}
                onChange={handleChange}
                placeholder="e.g. src/,docs/,tests/"
              />
            </FormGroup>
          </FormRow>
        </FormSection>
        
        <FormSection>
          <SectionTitle>
            Time Range
            <Tooltip content="Optionally limit the visualization to a specific time range" />
          </SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="start_date">
                Start Date (Optional)
                <Tooltip content="Starts visualization from this date" />
              </Label>
              <DateInput
                id="start_date"
                name="start_date"
                value={profile.start_date || ''}
                onChange={handleChange}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="end_date">
                End Date (Optional)
                <Tooltip content="Ends visualization at this date" />
              </Label>
              <DateInput
                id="end_date"
                name="end_date"
                value={profile.end_date || ''}
                onChange={handleChange}
              />
            </FormGroup>
          </FormRow>
        </FormSection>
        
        <FormSection>
          <SectionTitle>
            Assets & Custom Options
            <Tooltip content="Add custom images and Gource command-line options" />
          </SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="logo">
                Logo Path
                <Tooltip content="Path to an image file to use as a logo overlay" image="true" />
              </Label>
              <Input
                id="logo"
                name="logo"
                value={profile.logo}
                onChange={handleChange}
                placeholder="Path to logo image file"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="background_image">
                Background Image
                <Tooltip content="Path to an image file to use as the background" image="true" />
              </Label>
              <Input
                id="background_image"
                name="background_image"
                value={profile.background_image}
                onChange={handleChange}
                placeholder="Path to background image file"
              />
            </FormGroup>
          </FormRow>
          
          <FormGroup>
            <Label htmlFor="key">
              Key (Legend)
              <Tooltip content="Add a key (legend) to the visualization to explain color meanings" />
            </Label>
            <Textarea
              id="key"
              name="key"
              value={profile.key}
              onChange={handleChange}
              placeholder="Format: extension=color,extension=color (e.g. cpp=FF0000,js=00FF00)"
              style={{ minHeight: '80px' }}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="custom_options">
              Custom Gource Options
              <Tooltip content="Additional command-line options to pass to Gource. These will override any conflicting settings above." />
            </Label>
            <Textarea
              id="custom_options"
              name="custom_options"
              value={profile.custom_options}
              onChange={handleChange}
              placeholder="Enter additional Gource command line options (e.g. --user-friction 0.2 --bloom-multiplier 1.2)"
            />
          </FormGroup>
        </FormSection>
        
        <ButtonGroup>
          <CancelButton type="button" onClick={handleCancel}>
            Cancel
          </CancelButton>
          
          <ResetButton type="button" onClick={handleReset}>
            Reset to Default
          </ResetButton>
          
          <SaveButton type="submit" disabled={saving}>
            {saving ? 'Saving...' : profileId ? 'Update Profile' : 'Create Profile'}
          </SaveButton>
        </ButtonGroup>
      </form>
    </Container>
  );
};

export default ProfileForm; 