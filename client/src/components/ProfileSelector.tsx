import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Select,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, StarIcon } from '@chakra-ui/icons';
import api from '../services/api';
import ProfileForm, { GourceProfileFormData } from './ProfileForm';

interface ProfileSelectorProps {
  projectId?: string;
  selectedProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
  showManagementOptions?: boolean;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  projectId,
  selectedProfileId,
  onSelectProfile,
  showManagementOptions = true,
}) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAction, setCurrentAction] = useState<'create' | 'edit' | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Charger les profils - soit tous les profils, soit les profils liés au projet
  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      try {
        let data;
        if (projectId) {
          data = await api.getProjectProfiles(projectId);
        } else {
          data = await api.getProfiles();
        }
        setProfiles(data);
        
        // Sélectionner le profil actif ou le premier profil
        if (selectedProfileId && data.find((p: any) => p.id === selectedProfileId)) {
          setSelectedProfile(data.find((p: any) => p.id === selectedProfileId));
        } else if (data.length > 0) {
          // Trouver d'abord un profil par défaut s'il existe
          const defaultProfile = data.find((p: any) => p.is_default);
          if (defaultProfile) {
            setSelectedProfile(defaultProfile);
            onSelectProfile(defaultProfile.id);
          } else {
            setSelectedProfile(data[0]);
            onSelectProfile(data[0].id);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des profils:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les profils Gource',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [projectId, selectedProfileId, onSelectProfile, toast]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const profileId = e.target.value;
    const profile = profiles.find(p => p.id === profileId);
    setSelectedProfile(profile);
    onSelectProfile(profileId);
  };

  const handleCreateProfile = () => {
    setCurrentAction('create');
    onOpen();
  };

  const handleEditProfile = () => {
    setCurrentAction('edit');
    onOpen();
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfile) return;
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le profil "${selectedProfile.name}" ?`)) {
      try {
        await api.deleteProfile(selectedProfile.id);
        
        // Rafraîchir la liste des profils
        let updatedProfiles;
        if (projectId) {
          updatedProfiles = await api.getProjectProfiles(projectId);
        } else {
          updatedProfiles = await api.getProfiles();
        }
        
        setProfiles(updatedProfiles);
        
        // Sélectionner un autre profil si disponible
        if (updatedProfiles.length > 0) {
          setSelectedProfile(updatedProfiles[0]);
          onSelectProfile(updatedProfiles[0].id);
        } else {
          setSelectedProfile(null);
          onSelectProfile('');
        }
        
        toast({
          title: 'Succès',
          description: 'Le profil a été supprimé',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Erreur lors de la suppression du profil:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le profil',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleSetDefaultProfile = async () => {
    if (!selectedProfile || !projectId) return;
    
    try {
      await api.setProfileAsDefault(projectId, selectedProfile.id);
      
      // Rafraîchir la liste des profils
      const updatedProfiles = await api.getProjectProfiles(projectId);
      setProfiles(updatedProfiles);
      
      toast({
        title: 'Succès',
        description: `"${selectedProfile.name}" défini comme profil par défaut`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur lors de la définition du profil par défaut:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de définir le profil par défaut',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSubmitProfile = async (formData: GourceProfileFormData) => {
    try {
      if (currentAction === 'create') {
        const newProfile = await api.createProfile(formData);
        
        // Si un projet est spécifié, lier le profil au projet
        if (projectId) {
          await api.linkProfileToProject(projectId, newProfile.id);
        }
        
        toast({
          title: 'Succès',
          description: 'Nouveau profil créé',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else if (currentAction === 'edit' && selectedProfile) {
        await api.updateProfile(selectedProfile.id, formData);
        
        toast({
          title: 'Succès',
          description: 'Profil mis à jour',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Rafraîchir la liste des profils
      let updatedProfiles;
      if (projectId) {
        updatedProfiles = await api.getProjectProfiles(projectId);
      } else {
        updatedProfiles = await api.getProfiles();
      }
      setProfiles(updatedProfiles);
      
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le profil',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading size="md">Profil Gource</Heading>
          
          {showManagementOptions && (
            <HStack spacing={2}>
              <Tooltip label="Créer un nouveau profil">
                <IconButton
                  aria-label="Créer un profil"
                  icon={<AddIcon />}
                  size="sm"
                  onClick={handleCreateProfile}
                />
              </Tooltip>
              
              <Tooltip label="Modifier le profil">
                <IconButton
                  aria-label="Modifier le profil"
                  icon={<EditIcon />}
                  size="sm"
                  onClick={handleEditProfile}
                  isDisabled={!selectedProfile}
                />
              </Tooltip>
              
              <Tooltip label="Supprimer le profil">
                <IconButton
                  aria-label="Supprimer le profil"
                  icon={<DeleteIcon />}
                  size="sm"
                  onClick={handleDeleteProfile}
                  isDisabled={!selectedProfile}
                />
              </Tooltip>
              
              {projectId && (
                <Tooltip label="Définir comme profil par défaut">
                  <IconButton
                    aria-label="Définir comme profil par défaut"
                    icon={<StarIcon />}
                    size="sm"
                    onClick={handleSetDefaultProfile}
                    isDisabled={!selectedProfile || (selectedProfile && selectedProfile.is_default)}
                    colorScheme={selectedProfile && selectedProfile.is_default ? "yellow" : "gray"}
                  />
                </Tooltip>
              )}
            </HStack>
          )}
        </Flex>
        
        <Select
          placeholder={isLoading ? "Chargement des profils..." : "Sélectionner un profil"}
          value={selectedProfile?.id || ''}
          onChange={handleProfileChange}
          isDisabled={isLoading || profiles.length === 0}
        >
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}{profile.is_default ? ' (Défaut)' : ''}
            </option>
          ))}
        </Select>
        
        {selectedProfile && (
          <Box p={4} bg="gray.50" borderRadius="md">
            <Text fontSize="sm" color="gray.600">
              {selectedProfile.description || "Aucune description disponible"}
            </Text>
          </Box>
        )}
      </VStack>

      {/* Modal pour création/édition de profil */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>
            {currentAction === 'create' ? 'Créer un nouveau profil' : 'Modifier le profil'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <ProfileForm
              initialValues={currentAction === 'edit' && selectedProfile ? selectedProfile : undefined}
              onSubmit={handleSubmitProfile}
              onCancel={onClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProfileSelector; 