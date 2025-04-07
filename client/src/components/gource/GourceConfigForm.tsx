import React, { useState } from 'react';
import styled from 'styled-components';

interface GourceConfigFormProps {
  initialConfig?: GourceConfig;
  projectId: string;
  onSubmit: (config: GourceConfig) => void;
  onCancel?: () => void;
  loading?: boolean;
}

interface GourceConfig {
  id?: string;
  project_id: string;
  speed: number;
  resolution: string;
  background_color: string;
  avatars_enabled: boolean;
  avatar_size: number;
  start_date?: string;
  end_date?: string;
  custom_options: string;
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  input[type="checkbox"] {
    width: 1.2rem;
    height: 1.2rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled(Button)`
  background-color: #4caf50;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #45a049;
  }
`;

const CancelButton = styled(Button)`
  background-color: #f44336;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #d32f2f;
  }
`;

const commonResolutions = [
  '1280x720',
  '1920x1080',
  '2560x1440',
  '3840x2160',
];

const GourceConfigForm: React.FC<GourceConfigFormProps> = ({
  initialConfig,
  projectId,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [config, setConfig] = useState<GourceConfig>(
    initialConfig || {
      project_id: projectId,
      speed: 1.0,
      resolution: '1280x720',
      background_color: '000000',
      avatars_enabled: true,
      avatar_size: 30,
      custom_options: '',
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setConfig(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setConfig(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setConfig(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormGroup>
        <Label htmlFor="speed">Vitesse de simulation</Label>
        <Input
          type="number"
          id="speed"
          name="speed"
          value={config.speed}
          onChange={handleChange}
          min="0.1"
          max="10"
          step="0.1"
          required
        />
        <small>Vitesse de simulation en secondes par jour</small>
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="resolution">Résolution</Label>
        <Select
          id="resolution"
          name="resolution"
          value={config.resolution}
          onChange={handleChange}
          required
        >
          {commonResolutions.map(res => (
            <option key={res} value={res}>{res}</option>
          ))}
          <option value="custom">Personnalisée</option>
        </Select>
        {config.resolution === 'custom' && (
          <Input
            type="text"
            name="resolution"
            placeholder="largeur x hauteur (ex: 1280x720)"
            pattern="[0-9]+x[0-9]+"
            onChange={handleChange}
            required
          />
        )}
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="background_color">Couleur d'arrière-plan</Label>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Input
            type="color"
            id="background_color_picker"
            value={`#${config.background_color}`}
            onChange={(e) => {
              const hexColor = e.target.value.replace('#', '');
              setConfig(prev => ({ ...prev, background_color: hexColor }));
            }}
          />
          <Input
            type="text"
            id="background_color"
            name="background_color"
            value={config.background_color}
            onChange={handleChange}
            pattern="[0-9A-Fa-f]{6}"
            required
          />
        </div>
        <small>Couleur en format hexadécimal (sans #)</small>
      </FormGroup>
      
      <FormGroup>
        <Checkbox>
          <Input
            type="checkbox"
            id="avatars_enabled"
            name="avatars_enabled"
            checked={config.avatars_enabled}
            onChange={(e) => setConfig(prev => ({ ...prev, avatars_enabled: e.target.checked }))}
          />
          <Label htmlFor="avatars_enabled">Activer les avatars</Label>
        </Checkbox>
      </FormGroup>
      
      {config.avatars_enabled && (
        <FormGroup>
          <Label htmlFor="avatar_size">Taille des avatars</Label>
          <Input
            type="range"
            id="avatar_size"
            name="avatar_size"
            min="10"
            max="100"
            value={config.avatar_size}
            onChange={handleChange}
          />
          <div>{config.avatar_size}%</div>
        </FormGroup>
      )}
      
      <FormGroup>
        <Label htmlFor="start_date">Date de début (optionnel)</Label>
        <Input
          type="date"
          id="start_date"
          name="start_date"
          value={config.start_date || ''}
          onChange={handleChange}
        />
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="end_date">Date de fin (optionnel)</Label>
        <Input
          type="date"
          id="end_date"
          name="end_date"
          value={config.end_date || ''}
          onChange={handleChange}
        />
      </FormGroup>
      
      <FormGroup>
        <Label htmlFor="custom_options">Options personnalisées</Label>
        <Input
          type="text"
          id="custom_options"
          name="custom_options"
          value={config.custom_options}
          onChange={handleChange}
          placeholder="--hide-filenames --hide-root --bloom-multiplier 1.2"
        />
        <small>Options supplémentaires pour Gource</small>
      </FormGroup>
      
      <ButtonGroup>
        {onCancel && (
          <CancelButton type="button" onClick={onCancel} disabled={loading}>
            Annuler
          </CancelButton>
        )}
        <SubmitButton type="submit" disabled={loading}>
          {loading ? 'Chargement...' : initialConfig ? 'Mettre à jour' : 'Créer'}
        </SubmitButton>
      </ButtonGroup>
    </Form>
  );
};

export default GourceConfigForm; 