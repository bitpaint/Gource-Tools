// Profil Gource par défaut pour l'initialisation de la base de données
export const defaultGourceProfile = {
  name: "Default Profile",
  description: "Standard Gource configuration with balanced parameters for clear and pleasant visualization",
  is_default: 1,
  is_global: 1,
  
  // Paramètres visuels
  secondsPerDay: 10,
  autoSkipSeconds: 0.5,
  elasticity: 0.5,
  fileIdle: 0,
  backgroundColor: '#000000',
  cameraMode: 'overview',
  hideItems: '',
  disableBloom: 0,
  
  // Paramètres de filtrage
  startDate: '',
  stopDate: '',
  maxUserFiles: 100,
  maxFileLag: 3,
  
  // Affichage d'utilisateurs
  userScale: 1.0,
  userImageDir: '',
  highlightUsers: '',
  
  // Affichage des fichiers
  fileScale: 1.0,
  maxFiles: 1000,
  fileExtensions: '',
  
  // Légende et texte
  showKey: 1,
  dateFormat: '%Y-%m-%d',
  fontName: 'Arial',
  fontSize: 14,
  
  // Personnalisation avancée
  customLogo: '',
  logoPosition: 'top-left',
  logoScale: 1.0,
  titleText: '',
  
  // Options d'exportation
  outputResolution: '1920x1080',
  framerate: 60
}; 