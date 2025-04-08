import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
  Tooltip,
  Divider,
  Checkbox,
  Grid,
  GridItem,
  Radio,
  RadioGroup,
  FormHelperText,
  Image,
  AspectRatio,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';

export interface GourceProfileFormData {
  id?: string;
  name: string;
  description: string;
  isDefault?: boolean;
  isGlobal?: boolean;
  
  // Paramètres de visualisation
  secondsPerDay: number;
  autoSkipSeconds: number;
  elasticity: number;
  fileIdle: number;
  
  // Paramètres visuels
  backgroundColor: string;
  cameraMode: 'overview' | 'track' | 'follow';
  hideItems: string[];
  disableBloom: boolean;
  
  // Paramètres de filtrage
  startDate: string;
  stopDate: string;
  maxUserFiles: number;
  maxFileLag: number;
  
  // Affichage d'utilisateurs
  userScale: number;
  userImageDir: string;
  highlightUsers: string[];
  
  // Affichage des fichiers
  fileScale: number;
  maxFiles: number;
  fileExtensions: string[];
  
  // Légende et texte
  showKey: boolean;
  dateFormat: string;
  fontName: string;
  fontSize: number;
  
  // Personnalisation avancée
  customLogo: string;
  logoPosition: string;
  logoScale: number;
  titleText: string;
  
  // Options d'exportation
  outputResolution: string;
  framerate: number;
}

interface ProfileFormProps {
  initialValues?: Partial<GourceProfileFormData>;
  onSubmit: (data: GourceProfileFormData) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const defaultFormValues: GourceProfileFormData = {
  name: '',
  description: '',
  
  // Paramètres de visualisation
  secondsPerDay: 86400,
  autoSkipSeconds: 0.5,
  elasticity: 0.5,
  fileIdle: 0,
  
  // Paramètres visuels
  backgroundColor: '#000000',
  cameraMode: 'overview',
  hideItems: [],
  disableBloom: false,
  
  // Paramètres de filtrage
  startDate: '',
  stopDate: '',
  maxUserFiles: 100,
  maxFileLag: 3,
  
  // Affichage d'utilisateurs
  userScale: 1,
  userImageDir: '',
  highlightUsers: [],
  
  // Affichage des fichiers
  fileScale: 1,
  maxFiles: 1000,
  fileExtensions: [],
  
  // Légende et texte
  showKey: true,
  dateFormat: '%d/%m/%y',
  fontName: 'Arial',
  fontSize: 14,
  
  // Personnalisation avancée
  customLogo: '',
  logoPosition: 'top-left',
  logoScale: 1,
  titleText: '',
  
  // Options d'exportation
  outputResolution: '1920x1080',
  framerate: 60
};

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialValues = {},
  onSubmit,
  onCancel,
  isProcessing = false,
}) => {
  const [formData, setFormData] = useState<GourceProfileFormData>({
    ...defaultFormValues,
    ...initialValues,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name: string, value: number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleMultiSelectChange = (name: string, value: string[]) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Composant d'info-bulle réutilisable
  const InfoTooltip = ({ text }: { text: string }) => (
    <Tooltip label={text} hasArrow placement="top">
      <InfoIcon ml={1} color="gray.400" />
    </Tooltip>
  );

  // Emplacement pour une image descriptive
  const DescriptiveImage = ({ name, alt }: { name: string; alt: string }) => (
    <AspectRatio maxW="250px" ratio={16 / 9} my={2} border="1px" borderColor="gray.200" borderRadius="md">
      <Box>
        {/* Remplacer par <Image src={`/images/gource/${name}.png`} alt={alt} fallbackSrc="/images/placeholder.png" objectFit="cover" /> */}
        <Text fontSize="sm" color="gray.500" textAlign="center">
          Image: {alt}
        </Text>
      </Box>
    </AspectRatio>
  );

  return (
    <form onSubmit={handleSubmit}>
      <Tabs isLazy colorScheme="teal">
        <TabList>
          <Tab>Général</Tab>
          <Tab>Visualisation</Tab>
          <Tab>Apparence</Tab>
          <Tab>Utilisateurs & Fichiers</Tab>
          <Tab>Personnalisation</Tab>
          <Tab>Exportation</Tab>
        </TabList>

        <TabPanels>
          {/* Onglet 1: Informations générales */}
          <TabPanel>
            <VStack spacing={4} align="start">
              <FormControl isRequired>
                <FormLabel>Nom du profil</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Projet Standard"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description du profil de visualisation"
                  rows={3}
                />
              </FormControl>
              
              <DescriptiveImage name="profile-general" alt="Exemple de visualisation avec ce profil" />
            </VStack>
          </TabPanel>

          {/* Onglet 2: Paramètres de visualisation */}
          <TabPanel>
            <VStack spacing={4} align="start">
              <FormControl>
                <FormLabel>
                  Secondes par jour
                  <InfoTooltip text="Nombre de secondes que dure chaque journée dans l'animation" />
                </FormLabel>
                <NumberInput
                  min={1}
                  max={86400}
                  value={formData.secondsPerDay}
                  onChange={(_, value) => handleNumberChange('secondsPerDay', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>
                  Saut automatique (secondes)
                  <InfoTooltip text="Saut automatique quand il n'y a pas d'activité pendant cette durée" />
                </FormLabel>
                <NumberInput
                  min={0}
                  step={0.1}
                  value={formData.autoSkipSeconds}
                  onChange={(_, value) => handleNumberChange('autoSkipSeconds', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>
                  Élasticité
                  <InfoTooltip text="Contrôle l'élasticité des branches dans la visualisation" />
                </FormLabel>
                <NumberInput
                  min={0}
                  max={1}
                  step={0.1}
                  value={formData.elasticity}
                  onChange={(_, value) => handleNumberChange('elasticity', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>
                  Temps d'inactivité des fichiers (secondes)
                  <InfoTooltip text="Temps avant qu'un fichier non modifié disparaisse" />
                </FormLabel>
                <NumberInput
                  min={0}
                  value={formData.fileIdle}
                  onChange={(_, value) => handleNumberChange('fileIdle', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <DescriptiveImage name="time-parameters" alt="Impact des paramètres temporels" />
            </VStack>
          </TabPanel>

          {/* Onglet 3: Apparence visuelle */}
          <TabPanel>
            <VStack spacing={4} align="start">
              <FormControl>
                <FormLabel>
                  Couleur de fond
                  <InfoTooltip text="Couleur d'arrière-plan de la visualisation" />
                </FormLabel>
                <HStack>
                  <Input
                    type="color"
                    name="backgroundColor"
                    value={formData.backgroundColor}
                    onChange={handleChange}
                    w="80px"
                  />
                  <Input
                    name="backgroundColor"
                    value={formData.backgroundColor}
                    onChange={handleChange}
                    w="120px"
                  />
                </HStack>
              </FormControl>

              <FormControl>
                <FormLabel>
                  Mode de caméra
                  <InfoTooltip text="Comment la caméra se déplace pendant la visualisation" />
                </FormLabel>
                <Select
                  name="cameraMode"
                  value={formData.cameraMode}
                  onChange={handleChange}
                >
                  <option value="overview">Vue d'ensemble</option>
                  <option value="track">Suivi d'activité</option>
                  <option value="follow">Suivre les utilisateurs</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>
                  Masquer des éléments
                  <InfoTooltip text="Éléments à ne pas afficher dans la visualisation" />
                </FormLabel>
                <VStack align="start">
                  <Checkbox
                    isChecked={formData.hideItems.includes('usernames')}
                    onChange={(e) => {
                      const updatedHideItems = e.target.checked
                        ? [...formData.hideItems, 'usernames']
                        : formData.hideItems.filter(item => item !== 'usernames');
                      handleMultiSelectChange('hideItems', updatedHideItems);
                    }}
                  >
                    Noms d'utilisateurs
                  </Checkbox>
                  <Checkbox
                    isChecked={formData.hideItems.includes('files')}
                    onChange={(e) => {
                      const updatedHideItems = e.target.checked
                        ? [...formData.hideItems, 'files']
                        : formData.hideItems.filter(item => item !== 'files');
                      handleMultiSelectChange('hideItems', updatedHideItems);
                    }}
                  >
                    Fichiers
                  </Checkbox>
                  <Checkbox
                    isChecked={formData.hideItems.includes('tree')}
                    onChange={(e) => {
                      const updatedHideItems = e.target.checked
                        ? [...formData.hideItems, 'tree']
                        : formData.hideItems.filter(item => item !== 'tree');
                      handleMultiSelectChange('hideItems', updatedHideItems);
                    }}
                  >
                    Structure d'arborescence
                  </Checkbox>
                </VStack>
              </FormControl>

              <FormControl>
                <FormLabel>
                  Désactiver l'effet bloom
                  <InfoTooltip text="Désactive l'effet de lumière diffuse autour des éléments" />
                </FormLabel>
                <Switch
                  isChecked={formData.disableBloom}
                  onChange={(e) => handleSwitchChange('disableBloom', e.target.checked)}
                />
              </FormControl>
              
              <DescriptiveImage name="visual-effects" alt="Effets visuels et modes de caméra" />
            </VStack>
          </TabPanel>

          {/* Onglet 4: Utilisateurs & Fichiers */}
          <TabPanel>
            <Tabs isLazy variant="soft-rounded" colorScheme="green" size="sm">
              <TabList>
                <Tab>Utilisateurs</Tab>
                <Tab>Fichiers</Tab>
                <Tab>Filtrage</Tab>
              </TabList>
              
              <TabPanels>
                {/* Sous-onglet Utilisateurs */}
                <TabPanel>
                  <VStack spacing={4} align="start">
                    <FormControl>
                      <FormLabel>
                        Échelle utilisateur
                        <InfoTooltip text="Taille des icônes d'utilisateurs" />
                      </FormLabel>
                      <NumberInput
                        min={0.1}
                        max={5}
                        step={0.1}
                        value={formData.userScale}
                        onChange={(_, value) => handleNumberChange('userScale', value)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>
                        Dossier d'images utilisateurs
                        <InfoTooltip text="Dossier contenant des images personnalisées pour les utilisateurs" />
                      </FormLabel>
                      <Input
                        name="userImageDir"
                        value={formData.userImageDir}
                        onChange={handleChange}
                        placeholder="path/to/user/images"
                      />
                      <FormHelperText>Les images doivent être nommées selon les noms d'utilisateurs</FormHelperText>
                    </FormControl>

                    <FormControl>
                      <FormLabel>
                        Utilisateurs à mettre en évidence
                        <InfoTooltip text="Liste des utilisateurs à mettre en évidence, séparés par des virgules" />
                      </FormLabel>
                      <Input
                        placeholder="user1,user2,user3"
                        value={formData.highlightUsers.join(',')}
                        onChange={(e) => handleMultiSelectChange('highlightUsers', e.target.value.split(',').map(u => u.trim()).filter(Boolean))}
                      />
                    </FormControl>
                    
                    <DescriptiveImage name="user-customization" alt="Personnalisation des utilisateurs" />
                  </VStack>
                </TabPanel>
                
                {/* Sous-onglet Fichiers */}
                <TabPanel>
                  <VStack spacing={4} align="start">
                    <FormControl>
                      <FormLabel>
                        Échelle des fichiers
                        <InfoTooltip text="Taille des icônes de fichiers" />
                      </FormLabel>
                      <NumberInput
                        min={0.1}
                        max={5}
                        step={0.1}
                        value={formData.fileScale}
                        onChange={(_, value) => handleNumberChange('fileScale', value)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>
                        Nombre maximal de fichiers
                        <InfoTooltip text="Limite le nombre de fichiers affichés simultanément" />
                      </FormLabel>
                      <NumberInput
                        min={10}
                        max={10000}
                        value={formData.maxFiles}
                        onChange={(_, value) => handleNumberChange('maxFiles', value)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>
                        Extensions de fichiers à inclure
                        <InfoTooltip text="Extensions spécifiques à inclure, séparées par des virgules. Laissez vide pour toutes les inclure." />
                      </FormLabel>
                      <Input
                        placeholder="js,ts,css,html"
                        value={formData.fileExtensions.join(',')}
                        onChange={(e) => handleMultiSelectChange('fileExtensions', e.target.value.split(',').map(ext => ext.trim()).filter(Boolean))}
                      />
                    </FormControl>
                    
                    <DescriptiveImage name="file-customization" alt="Personnalisation des fichiers" />
                  </VStack>
                </TabPanel>
                
                {/* Sous-onglet Filtrage */}
                <TabPanel>
                  <VStack spacing={4} align="start">
                    <FormControl>
                      <FormLabel>
                        Date de début
                        <InfoTooltip text="Ne montrer que les commits à partir de cette date (YYYY-MM-DD)" />
                      </FormLabel>
                      <Input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>
                        Date de fin
                        <InfoTooltip text="Ne montrer que les commits jusqu'à cette date (YYYY-MM-DD)" />
                      </FormLabel>
                      <Input
                        type="date"
                        name="stopDate"
                        value={formData.stopDate}
                        onChange={handleChange}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>
                        Fichiers max par utilisateur
                        <InfoTooltip text="Nombre maximum de fichiers qu'un utilisateur peut modifier simultanément" />
                      </FormLabel>
                      <NumberInput
                        min={1}
                        max={1000}
                        value={formData.maxUserFiles}
                        onChange={(_, value) => handleNumberChange('maxUserFiles', value)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>
                        Décalage max des fichiers
                        <InfoTooltip text="Temps maximum (en jours) qu'un fichier peut rester derrière l'action actuelle" />
                      </FormLabel>
                      <NumberInput
                        min={0}
                        max={30}
                        value={formData.maxFileLag}
                        onChange={(_, value) => handleNumberChange('maxFileLag', value)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <DescriptiveImage name="filtering" alt="Options de filtrage" />
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </TabPanel>

          {/* Onglet 5: Personnalisation */}
          <TabPanel>
            <VStack spacing={4} align="start">
              <FormControl>
                <FormLabel>
                  Afficher la légende
                  <InfoTooltip text="Affiche une légende avec les informations utilisateurs et l'horodatage" />
                </FormLabel>
                <Switch
                  isChecked={formData.showKey}
                  onChange={(e) => handleSwitchChange('showKey', e.target.checked)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Format de date
                  <InfoTooltip text="Format d'affichage de la date dans la visualisation" />
                </FormLabel>
                <Input
                  name="dateFormat"
                  value={formData.dateFormat}
                  onChange={handleChange}
                  placeholder="%d/%m/%y"
                />
                <FormHelperText>Format strftime: %d = jour, %m = mois, %y = année</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>
                  Police d'écriture
                  <InfoTooltip text="Nom de la police à utiliser" />
                </FormLabel>
                <Input
                  name="fontName"
                  value={formData.fontName}
                  onChange={handleChange}
                  placeholder="Arial"
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Taille de police
                  <InfoTooltip text="Taille de la police en points" />
                </FormLabel>
                <NumberInput
                  min={8}
                  max={72}
                  value={formData.fontSize}
                  onChange={(_, value) => handleNumberChange('fontSize', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <Divider my={2} />

              <FormControl>
                <FormLabel>
                  Logo personnalisé
                  <InfoTooltip text="Chemin vers un logo personnalisé à afficher" />
                </FormLabel>
                <Input
                  name="customLogo"
                  value={formData.customLogo}
                  onChange={handleChange}
                  placeholder="path/to/logo.png"
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Position du logo
                  <InfoTooltip text="Position du logo dans la visualisation" />
                </FormLabel>
                <RadioGroup
                  value={formData.logoPosition}
                  onChange={(value) => setFormData(prev => ({ ...prev, logoPosition: value }))}
                >
                  <Grid templateColumns="repeat(3, 1fr)" gap={2}>
                    <Radio value="top-left">Haut gauche</Radio>
                    <Radio value="top-center">Haut centre</Radio>
                    <Radio value="top-right">Haut droite</Radio>
                    <Radio value="bottom-left">Bas gauche</Radio>
                    <Radio value="bottom-center">Bas centre</Radio>
                    <Radio value="bottom-right">Bas droite</Radio>
                  </Grid>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel>
                  Échelle du logo
                  <InfoTooltip text="Taille du logo (1 = taille normale)" />
                </FormLabel>
                <NumberInput
                  min={0.1}
                  max={3}
                  step={0.1}
                  value={formData.logoScale}
                  onChange={(_, value) => handleNumberChange('logoScale', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>
                  Texte de titre
                  <InfoTooltip text="Texte de titre à afficher dans la visualisation" />
                </FormLabel>
                <Input
                  name="titleText"
                  value={formData.titleText}
                  onChange={handleChange}
                  placeholder="Mon Projet Génial"
                />
              </FormControl>
              
              <DescriptiveImage name="customization" alt="Options de personnalisation" />
            </VStack>
          </TabPanel>

          {/* Onglet 6: Exportation */}
          <TabPanel>
            <VStack spacing={4} align="start">
              <FormControl>
                <FormLabel>
                  Résolution de sortie
                  <InfoTooltip text="Résolution de la vidéo générée" />
                </FormLabel>
                <Select
                  name="outputResolution"
                  value={formData.outputResolution}
                  onChange={handleChange}
                >
                  <option value="1280x720">HD 720p (1280x720)</option>
                  <option value="1920x1080">Full HD 1080p (1920x1080)</option>
                  <option value="2560x1440">QHD 1440p (2560x1440)</option>
                  <option value="3840x2160">4K UHD (3840x2160)</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>
                  Images par seconde
                  <InfoTooltip text="Nombre d'images par seconde pour la vidéo" />
                </FormLabel>
                <NumberInput
                  min={24}
                  max={120}
                  value={formData.framerate}
                  onChange={(_, value) => handleNumberChange('framerate', value)}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <DescriptiveImage name="export-options" alt="Options d'exportation" />
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <HStack mt={6} spacing={4} justifyContent="flex-end">
        <Button onClick={onCancel} variant="outline">
          Annuler
        </Button>
        <Button
          type="submit"
          colorScheme="teal"
          isLoading={isProcessing}
          loadingText="Enregistrement..."
        >
          Enregistrer
        </Button>
      </HStack>
    </form>
  );
};

export default ProfileForm; 