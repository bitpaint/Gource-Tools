import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

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

interface GourceConfigListProps {
  configs: GourceConfig[];
  onSelect: (config: GourceConfig) => void;
  onEdit: (config: GourceConfig) => void;
  onRender: (config: GourceConfig) => void;
  loading?: boolean;
}

const ListContainer = styled.div`
  margin-top: 1rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #ddd;
`;

const TableHead = styled.thead`
  background-color: #f5f5f5;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f9f9f9;
  }
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

const TableHeader = styled.th`
  padding: 0.75rem;
  text-align: left;
  border-bottom: 2px solid #ddd;
`;

const TableCell = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid #ddd;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

const Button = styled.button`
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
`;

const ViewButton = styled(Button)`
  background-color: #2196f3;
  color: white;
  
  &:hover {
    background-color: #0b7dda;
  }
`;

const EditButton = styled(Button)`
  background-color: #ff9800;
  color: white;
  
  &:hover {
    background-color: #e68a00;
  }
`;

const RenderButton = styled(Button)`
  background-color: #4caf50;
  color: white;
  
  &:hover {
    background-color: #45a049;
  }
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  border: 1px dashed #ddd;
  border-radius: 8px;
  margin-top: 1rem;
`;

const ColorPreview = styled.div<{ color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: ${props => `#${props.color}`};
  border: 1px solid #ddd;
  display: inline-block;
  margin-right: 0.5rem;
`;

const GourceConfigList: React.FC<GourceConfigListProps> = ({
  configs,
  onSelect,
  onEdit,
  onRender,
  loading = false,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return <div>Chargement des configurations...</div>;
  }

  if (!configs || configs.length === 0) {
    return (
      <EmptyState>
        <h3>Aucune configuration trouvée</h3>
        <p>Créez une nouvelle configuration pour commencer à visualiser vos dépôts</p>
      </EmptyState>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <ListContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Résolution</TableHeader>
            <TableHeader>Vitesse</TableHeader>
            <TableHeader>Arrière-plan</TableHeader>
            <TableHeader>Avatars</TableHeader>
            <TableHeader>Dernière mise à jour</TableHeader>
            <TableHeader>Actions</TableHeader>
          </TableRow>
        </TableHead>
        <tbody>
          {configs.map(config => (
            <TableRow key={config.id}>
              <TableCell>{config.resolution}</TableCell>
              <TableCell>{config.speed}x</TableCell>
              <TableCell>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ColorPreview color={config.background_color} />
                  #{config.background_color}
                </div>
              </TableCell>
              <TableCell>{config.avatars_enabled ? 'Activés' : 'Désactivés'}</TableCell>
              <TableCell>{formatDate(config.updated_at)}</TableCell>
              <TableCell>
                <ButtonGroup>
                  <ViewButton onClick={() => onSelect(config)} title="Voir les détails">
                    Voir
                  </ViewButton>
                  <EditButton onClick={() => onEdit(config)} title="Modifier">
                    Éditer
                  </EditButton>
                  <RenderButton onClick={() => onRender(config)} title="Créer un rendu">
                    Rendu
                  </RenderButton>
                </ButtonGroup>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </ListContainer>
  );
};

export default GourceConfigList; 