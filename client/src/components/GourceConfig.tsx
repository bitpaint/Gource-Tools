import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  useToast,
  Flex,
  Select,
  HStack,
  IconButton,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Spinner,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, StarIcon } from '@chakra-ui/icons';
import api from '../services/api';
import ProfileForm, { GourceProfileFormData } from './ProfileForm';
import { defaultGourceProfile } from '../models/defaultProfile';

interface GourceConfigProps {
  projectId?: string;
}

interface Profile {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isGlobal: boolean;
  // autres propriétés du profil...
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

const GourceConfig: React.FC<GourceConfigProps> = ({ projectId }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projectProfiles, setProjectProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<Profile | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Charger les profils au démarrage
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Charger les profils globaux
        const globalProfilesResponse = await api.getProfiles();
        let globalProfiles = globalProfilesResponse;

        // Vérifier si un profil par défaut global existe
        const globalDefaultExists = globalProfiles.some((p: Profile) => p.isGlobal && p.isDefault);
        
        // Si aucun profil par défaut global n'existe, en créer un
        if (!globalDefaultExists) {
          try {
            const createdProfile = await api.createProfile(defaultGourceProfile);
            globalProfiles = [...globalProfiles, createdProfile];
          } catch (error) {
            console.error('Erreur lors de la création du profil par défaut:', error);
          }
        }
        
        setProfiles(globalProfiles);
        
        // Si un projet est spécifié, chargez également ses profils spécifiques
        if (projectId) {
          const projectProfilesResponse = await api.getProjectProfiles(projectId);
          setProjectProfiles(projectProfilesResponse);
          
          // Sélectionner le profil par défaut du projet s'il existe
          const defaultProjectProfile = projectProfilesResponse.find((p: Profile) => p.isDefault);
          if (defaultProjectProfile) {
            setSelectedProfile(defaultProjectProfile.id);
          } else {
            // Si aucun profil par défaut pour le projet, utiliser le profil global par défaut
            const defaultGlobalProfile = globalProfiles.find((p: Profile) => p.isGlobal && p.isDefault);
            if (defaultGlobalProfile) {
              setSelectedProfile(defaultGlobalProfile.id);
              // Définir ce profil comme profil par défaut pour ce projet
              try {
                await api.linkProfileToProject(projectId, defaultGlobalProfile.id);
                await api.setProfileAsDefault(projectId, defaultGlobalProfile.id);
                
                // Mettre à jour la liste des profils du projet
                setProjectProfiles([...projectProfilesResponse, {
                  ...defaultGlobalProfile,
                  isDefault: true
                }]);
              } catch (error) {
                console.error('Erreur lors de l\'attribution du profil par défaut:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des profils:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les profils Gource.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [projectId, toast]);

  const handleCreateProfile = () => {
    setProfileToEdit(null);
    onOpen();
  };

  const handleEditProfile = (profile: Profile) => {
    setProfileToEdit(profile);
    onOpen();
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce profil ?')) {
      try {
        await api.deleteProfile(profileId);
        
        // Mettre à jour les listes de profils
        setProfiles(profiles.filter(p => p.id !== profileId));
        setProjectProfiles(projectProfiles.filter(p => p.id !== profileId));
        
        toast({
          title: 'Succès',
          description: 'Profil supprimé avec succès.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Erreur lors de la suppression du profil:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le profil.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleSetDefault = async (profileId: string) => {
    if (!projectId) return;
    
    try {
      await api.setProfileAsDefault(projectId, profileId);
      
      // Mettre à jour l'état local
      setProjectProfiles(
        projectProfiles.map(p => ({
          ...p,
          isDefault: p.id === profileId
        }))
      );
      
      setSelectedProfile(profileId);
      
      toast({
        title: 'Succès',
        description: 'Profil défini comme défaut pour ce projet.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur lors de la définition du profil par défaut:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de définir le profil par défaut.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleProfileChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProfile(event.target.value);
  };

  const handleSubmitProfile = async (formData: GourceProfileFormData) => {
    try {
      setIsSubmitting(true);
      
      let response: ApiResponse<Profile>;
      
      // Création ou mise à jour d'un profil
      if (profileToEdit) {
        response = await api.updateProfile(profileToEdit.id, formData);
        
        // Mettre à jour les listes de profils
        setProfiles(profiles.map(p => 
          p.id === profileToEdit.id ? response.data : p
        ));
        
        setProjectProfiles(projectProfiles.map(p => 
          p.id === profileToEdit.id ? response.data : p
        ));
        
        toast({
          title: 'Succès',
          description: 'Profil mis à jour avec succès.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Créer un nouveau profil
        response = await api.createProfile(formData);
        
        // Si le profil est global, ajoutez-le à la liste des profils globaux
        if (!formData.isGlobal && projectId) {
          // Associer le profil au projet si c'est un profil spécifique au projet
          await api.linkProfileToProject(projectId, response.data.id);
          setProjectProfiles([...projectProfiles, response.data]);
        } else {
          setProfiles([...profiles, response.data]);
        }
        
        toast({
          title: 'Succès',
          description: 'Profil créé avec succès.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le profil.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combiner les profils globaux et de projet pour l'affichage
  const allProfiles = [...projectProfiles, ...profiles.filter(p => 
    !projectProfiles.some(pp => pp.id === p.id)
  )];

  return (
    <Box p={4}>
      <Heading size="md" mb={4}>Configuration Gource</Heading>
      
      {isLoading ? (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" color="teal.500" />
        </Flex>
      ) : (
        <VStack spacing={4} align="stretch">
          {projectId && (
            <Box>
              <Text mb={2} fontWeight="medium">Profil Gource pour ce projet</Text>
              <HStack>
                <Select 
                  placeholder="Sélectionner un profil"
                  value={selectedProfile}
                  onChange={handleProfileChange}
                  flex="1"
                >
                  {allProfiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} {profile.isDefault ? '(Défaut)' : ''} {profile.isGlobal ? '(Global)' : ''}
                    </option>
                  ))}
                </Select>
                
                {selectedProfile && (
                  <Tooltip label="Définir comme profil par défaut">
                    <IconButton
                      aria-label="Définir comme profil par défaut"
                      icon={<StarIcon />}
                      colorScheme={projectProfiles.find(p => p.id === selectedProfile)?.isDefault ? 'yellow' : 'gray'}
                      onClick={() => handleSetDefault(selectedProfile)}
                    />
                  </Tooltip>
                )}
              </HStack>
            </Box>
          )}
          
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontWeight="medium">Profils disponibles</Text>
              <Button leftIcon={<AddIcon />} colorScheme="teal" size="sm" onClick={handleCreateProfile}>
                Nouveau profil
              </Button>
            </Flex>
            
            {allProfiles.length === 0 ? (
              <Text color="gray.500">Aucun profil disponible. Créez-en un nouveau pour commencer.</Text>
            ) : (
              <VStack spacing={2} align="stretch">
                {allProfiles.map(profile => (
                  <Flex 
                    key={profile.id} 
                    p={3} 
                    bg="gray.50" 
                    borderRadius="md" 
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Text fontWeight="bold">{profile.name}</Text>
                      <Text fontSize="sm" color="gray.600">{profile.description}</Text>
                    </Box>
                    <HStack>
                      {projectId && (
                        <Tooltip label="Définir comme profil par défaut">
                          <IconButton
                            aria-label="Définir comme profil par défaut"
                            size="sm"
                            icon={<StarIcon />}
                            colorScheme={profile.isDefault ? 'yellow' : 'gray'}
                            onClick={() => handleSetDefault(profile.id)}
                          />
                        </Tooltip>
                      )}
                      <Tooltip label="Modifier ce profil">
                        <IconButton
                          aria-label="Modifier ce profil"
                          size="sm"
                          icon={<EditIcon />}
                          onClick={() => handleEditProfile(profile)}
                        />
                      </Tooltip>
                      <Tooltip label="Supprimer ce profil">
                        <IconButton
                          aria-label="Supprimer ce profil"
                          size="sm"
                          icon={<DeleteIcon />}
                          colorScheme="red"
                          onClick={() => handleDeleteProfile(profile.id)}
                        />
                      </Tooltip>
                    </HStack>
                  </Flex>
                ))}
              </VStack>
            )}
          </Box>
        </VStack>
      )}
      
      {/* Modal pour créer/éditer un profil */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>
            {profileToEdit ? 'Modifier le profil' : 'Créer un nouveau profil'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <ProfileForm
              initialValues={profileToEdit || {}}
              onSubmit={handleSubmitProfile}
              onCancel={onClose}
              isProcessing={isSubmitting}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default GourceConfig; 