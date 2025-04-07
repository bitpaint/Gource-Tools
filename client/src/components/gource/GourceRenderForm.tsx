import React, { useState } from 'react';
import styled from 'styled-components';

interface GourceRenderFormProps {
  configId: string;
  onSubmit: (renderOptions: RenderOptions) => void;
  onCancel?: () => void;
  loading?: boolean;
}

interface RenderOptions {
  config_id: string;
  output_format: 'mp4' | 'webm' | 'gif';
  quality: 'low' | 'medium' | 'high';
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 500px;
  margin: 0 auto;
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
`;

const Title = styled.h2`
  margin-top: 0;
  color: #333;
  text-align: center;
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

const Select = styled.select`
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
`;

const OptionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const RadioOption = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f0f0f0;
  }
  
  &.selected {
    background-color: #e6f7ff;
    border-color: #1890ff;
  }
`;

const RadioInput = styled.input`
  margin: 0;
`;

const RadioLabel = styled.label`
  font-size: 0.9rem;
  cursor: pointer;
  flex-grow: 1;
`;

const OptionDescription = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.2rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.7rem 1.5rem;
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

const InfoBox = styled.div`
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  padding: 0.8rem;
  font-size: 0.9rem;
  color: #0050b3;
  margin-bottom: 1rem;
`;

const GourceRenderForm: React.FC<GourceRenderFormProps> = ({
  configId,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [renderOptions, setRenderOptions] = useState<RenderOptions>({
    config_id: configId,
    output_format: 'mp4',
    quality: 'medium',
  });

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRenderOptions(prev => ({ 
      ...prev, 
      output_format: e.target.value as 'mp4' | 'webm' | 'gif' 
    }));
  };

  const handleQualityChange = (quality: 'low' | 'medium' | 'high') => {
    setRenderOptions(prev => ({ ...prev, quality }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(renderOptions);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Title>Créer un nouveau rendu</Title>
      
      <InfoBox>
        Le rendu peut prendre plusieurs minutes en fonction de la taille des dépôts 
        et des paramètres choisis. Vous serez notifié lorsque le rendu sera terminé.
      </InfoBox>
      
      <FormGroup>
        <Label htmlFor="output_format">Format de sortie</Label>
        <Select
          id="output_format"
          name="output_format"
          value={renderOptions.output_format}
          onChange={handleFormatChange}
          required
        >
          <option value="mp4">MP4 (recommandé)</option>
          <option value="webm">WebM</option>
          <option value="gif">GIF (pour les petites visualisations)</option>
        </Select>
      </FormGroup>
      
      <FormGroup>
        <Label>Qualité du rendu</Label>
        <OptionGroup>
          <RadioOption 
            className={renderOptions.quality === 'low' ? 'selected' : ''}
            onClick={() => handleQualityChange('low')}
          >
            <RadioInput 
              type="radio" 
              id="quality_low" 
              name="quality" 
              value="low"
              checked={renderOptions.quality === 'low'}
              onChange={() => {}}
            />
            <RadioLabel htmlFor="quality_low">Basse</RadioLabel>
            <OptionDescription>Rendu rapide, fichier léger, qualité réduite</OptionDescription>
          </RadioOption>
          
          <RadioOption 
            className={renderOptions.quality === 'medium' ? 'selected' : ''}
            onClick={() => handleQualityChange('medium')}
          >
            <RadioInput 
              type="radio" 
              id="quality_medium" 
              name="quality" 
              value="medium"
              checked={renderOptions.quality === 'medium'}
              onChange={() => {}}
            />
            <RadioLabel htmlFor="quality_medium">Moyenne (recommandée)</RadioLabel>
            <OptionDescription>Bon équilibre entre qualité et taille de fichier</OptionDescription>
          </RadioOption>
          
          <RadioOption 
            className={renderOptions.quality === 'high' ? 'selected' : ''}
            onClick={() => handleQualityChange('high')}
          >
            <RadioInput 
              type="radio" 
              id="quality_high" 
              name="quality" 
              value="high"
              checked={renderOptions.quality === 'high'}
              onChange={() => {}}
            />
            <RadioLabel htmlFor="quality_high">Haute</RadioLabel>
            <OptionDescription>Meilleure qualité, fichier plus lourd, rendu plus lent</OptionDescription>
          </RadioOption>
        </OptionGroup>
      </FormGroup>
      
      <ButtonGroup>
        {onCancel && (
          <CancelButton type="button" onClick={onCancel} disabled={loading}>
            Annuler
          </CancelButton>
        )}
        <SubmitButton type="submit" disabled={loading}>
          {loading ? 'Création...' : 'Créer le rendu'}
        </SubmitButton>
      </ButtonGroup>
    </Form>
  );
};

export default GourceRenderForm; 