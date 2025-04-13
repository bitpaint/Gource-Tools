/**
 * Configuration globale de l'application
 */

module.exports = {
  // Répertoires par défaut
  directories: {
    exports: 'exports',
    temp: 'temp',
    logs: 'logs',
    db: 'db'
  },
  
  // Configuration de rendu
  render: {
    defaultResolution: '1920x1080',
    defaultFramerate: 60,
    maxConcurrentRenders: 1
  },
  
  // Configuration par défaut pour Gource
  gource: {
    defaultSecondsPerDay: 1,
    autoTimeCalculation: true
  },

  // Limites des fichiers
  files: {
    maxUploadSize: 100 * 1024 * 1024 // 100MB
  }
}; 