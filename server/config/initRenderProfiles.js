/**
 * Script d'initialisation des profils de rendu personnalisés
 * Ce script vérifie si les profils définis dans customRenderProfiles.js
 * existent déjà dans la base de données et les ajoute si nécessaire
 */
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { customRenderProfiles } = require('./customRenderProfiles');

// Fonction pour initialiser les profils de rendu personnalisés
function initCustomRenderProfiles() {
  try {
    console.log('🔄 Vérification des profils de rendu personnalisés...');
    
    // Charger la base de données
    const adapter = new FileSync(path.join(__dirname, '../../db/db.json'));
    const db = low(adapter);
    
    // S'assurer que la collection renderProfiles existe
    if (!db.has('renderProfiles').value()) {
      db.set('renderProfiles', []).write();
      console.log('✅ Collection renderProfiles créée');
    }
    
    // Récupérer les profils existants
    const existingProfiles = db.get('renderProfiles').value();
    
    // Vérifier et ajouter chaque profil personnalisé s'il n'existe pas déjà
    let addedCount = 0;
    
    for (const profile of customRenderProfiles) {
      // Vérifier si un profil avec le même ID existe déjà
      const existingProfile = existingProfiles.find(p => p.id === profile.id);
      
      if (!existingProfile) {
        // Ajouter le profil à la base de données
        db.get('renderProfiles')
          .push(profile)
          .write();
        
        console.log(`✅ Profil ajouté: ${profile.name}`);
        addedCount++;
      } else {
        console.log(`ℹ️ Profil déjà existant: ${profile.name}`);
      }
    }
    
    if (addedCount > 0) {
      console.log(`✅ ${addedCount} nouveaux profils de rendu ajoutés`);
    } else {
      console.log('ℹ️ Aucun nouveau profil de rendu ajouté');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des profils de rendu:', error);
    return false;
  }
}

module.exports = initCustomRenderProfiles; 