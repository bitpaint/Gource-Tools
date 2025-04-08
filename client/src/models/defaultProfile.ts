import { GourceProfileFormData } from '../components/ProfileForm';

export const defaultGourceProfile: GourceProfileFormData = {
  name: "Profil par défaut",
  description: "Configuration Gource standard avec des paramètres équilibrés pour une visualisation claire et agréable",
  
  // Paramètres de visualisation
  secondsPerDay: 10,
  autoSkipSeconds: 0.5,
  elasticity: 0.5,
  fileIdle: 0,
  
  // Paramètres visuels
  backgroundColor: "#000000",
  cameraMode: "overview",
  hideItems: [],
  disableBloom: false,
  
  // Paramètres de filtrage
  startDate: "",
  stopDate: "",
  maxUserFiles: 100,
  maxFileLag: 3,
  
  // Affichage d'utilisateurs
  userScale: 1.0,
  userImageDir: "",
  highlightUsers: [],
  
  // Affichage des fichiers
  fileScale: 1.0,
  maxFiles: 1000,
  fileExtensions: [],
  
  // Légende et texte
  showKey: true,
  dateFormat: "%Y-%m-%d",
  fontName: "Arial",
  fontSize: 14,
  
  // Personnalisation avancée
  customLogo: "",
  logoPosition: "top-left",
  logoScale: 1.0,
  titleText: "",
  
  // Options d'exportation
  outputResolution: "1920x1080",
  framerate: 60,
  
  // Métadonnées
  isGlobal: true,
  isDefault: true
};

export default defaultGourceProfile; 