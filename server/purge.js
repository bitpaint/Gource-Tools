/**
 * Script de purge pour Gource-Tools
 * 
 * Ce script:
 * 1. Nettoie la base de données (repos, projets, rendus)
 * 2. Supprime les dossiers de dépôts
 * 3. Supprime les logs et exports
 * 4. Préserve les API keys et paramètres
 */

const fs = require('fs');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { defaultGourceConfig } = require('./config/defaultGourceConfig');

console.log('🧹 Démarrage de la purge de Gource-Tools...');

// Chemins des dossiers à nettoyer
const basePath = path.resolve(__dirname, '../');
const reposDir = path.join(basePath, 'repos');
const logsDir = path.join(basePath, 'logs');
const exportsDir = path.join(basePath, 'exports');
const tempDir = path.join(basePath, 'temp');
const dbPath = path.join(basePath, 'db/db.json');

// Fonction pour supprimer un dossier et tout son contenu récursivement
function cleanDirectory(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`📂 Le dossier ${directory} n'existe pas, création...`);
    fs.mkdirSync(directory, { recursive: true });
    return;
  }

  try {
    // Lire le contenu du dossier
    const files = fs.readdirSync(directory);
    
    // Parcourir et supprimer chaque fichier/dossier
    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Supprimer le dossier et son contenu récursivement
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`🗑️ Dossier supprimé: ${fullPath}`);
      } else {
        // Supprimer le fichier
        fs.unlinkSync(fullPath);
        console.log(`🗑️ Fichier supprimé: ${fullPath}`);
      }
    }
    
    console.log(`✅ Dossier nettoyé: ${directory}`);
  } catch (error) {
    console.error(`❌ Erreur lors du nettoyage du dossier ${directory}:`, error);
  }
}

// Nettoyer la base de données tout en préservant les paramètres
function cleanDatabase() {
  if (!fs.existsSync(dbPath)) {
    console.log(`📄 Le fichier de base de données n'existe pas: ${dbPath}`);
    
    // S'assurer que le répertoire existe
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Créer un fichier DB vide avec structure de base
    const emptyDb = {
      repositories: [],
      projects: [],
      renderProfiles: [defaultGourceConfig],
      renders: [],
      settings: {}
    };
    
    fs.writeFileSync(dbPath, JSON.stringify(emptyDb, null, 2));
    console.log(`✅ Nouvelle base de données créée avec configuration par défaut`);
    return;
  }

  try {
    // Charger la base de données
    const adapter = new FileSync(dbPath);
    const db = low(adapter);
    
    // Sauvegarder les paramètres et API keys
    const settings = db.get('settings').value() || {};
    
    // Récupérer le profil par défaut s'il existe
    const defaultProfile = db.get('renderProfiles')
      .find({ isDefault: true })
      .value();
    
    // Réinitialiser la base de données
    db.set('repositories', [])
      .set('projects', [])
      .set('renders', [])
      .set('renderProfiles', defaultProfile ? [defaultProfile] : [defaultGourceConfig])
      .write();
    
    // Restaurer les paramètres
    db.set('settings', settings).write();
    
    console.log(`✅ Base de données nettoyée, ${Object.keys(settings).length} paramètres préservés`);
    
    // Afficher les clés API préservées
    if (settings.githubToken) {
      console.log(`🔑 Token GitHub préservé: ${settings.githubToken.substring(0, 4)}...${settings.githubToken.substring(settings.githubToken.length - 4)}`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors du nettoyage de la base de données:`, error);
  }
}

// Exécuter le nettoyage
console.log('🔄 Nettoyage des dossiers...');
cleanDirectory(reposDir);
cleanDirectory(logsDir);
cleanDirectory(exportsDir);
cleanDirectory(tempDir);

console.log('🔄 Nettoyage de la base de données...');
cleanDatabase();

console.log('✅ Purge terminée! L\'application a été réinitialisée tout en préservant les clés API et paramètres.');
console.log('🚀 Vous pouvez redémarrer le serveur pour appliquer les changements.'); 