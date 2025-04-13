/**
 * Script d'initialisation des profils de rendu personnalisés
 * Ce script vérifie si les profils définis dans customRenderProfiles.js
 * existent déjà dans la base de données et les ajoute si nécessaire
 */
const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { customRenderProfiles } = require('./customRenderProfiles');

// Initialiser les profils de rendu personnalisés dans la base de données
function initCustomRenderProfiles() {
  const dbPath = path.join(__dirname, '../../db/db.json');
  const adapter = new FileSync(dbPath);
  const db = low(adapter);
  
  // Vérifier si la collection renderProfiles existe
  if (!db.has('renderProfiles').value()) {
    db.set('renderProfiles', []).write();
  }
  
  // Ajouter les profils personnalisés s'ils n'existent pas déjà
  if (customRenderProfiles && Array.isArray(customRenderProfiles)) {
    for (const profile of customRenderProfiles) {
      const existingProfile = db.get('renderProfiles')
        .find({ id: profile.id })
        .value();
      
      if (!existingProfile) {
        console.log(`Ajout du profil de rendu personnalisé: ${profile.name}`);
        db.get('renderProfiles')
          .push(profile)
          .write();
      } else {
        console.log(`Le profil de rendu personnalisé existe déjà: ${profile.name}`);
        
        // Mettre à jour les profils existants avec les nouvelles propriétés
        // Cela permet de mettre à jour des profils existants lorsqu'on ajoute de nouvelles fonctionnalités
        if (profile.dynamicTimeCalculation !== undefined && 
            existingProfile.dynamicTimeCalculation === undefined) {
          console.log(`Mise à jour du profil existant avec des propriétés supplémentaires: ${profile.name}`);
          db.get('renderProfiles')
            .find({ id: profile.id })
            .assign({
              ...existingProfile,
              dynamicTimeCalculation: profile.dynamicTimeCalculation,
              lastModified: new Date().toISOString()
            })
            .write();
        }
      }
    }
    
    // Vérifier s'il y a un profil par défaut
    const hasDefault = db.get('renderProfiles')
      .find({ isDefault: true })
      .value();
    
    // S'il n'y a pas de profil par défaut, définir le premier profil "Everything in 1min" comme profil par défaut
    if (!hasDefault) {
      const everythingProfile = customRenderProfiles.find(p => p.id === 'everything_1m');
      if (everythingProfile) {
        console.log('Aucun profil par défaut trouvé, définition de "Everything in 1min" comme profil par défaut');
        db.get('renderProfiles')
          .find({ id: everythingProfile.id })
          .assign({ isDefault: true })
          .write();
      }
    }
  }
}

module.exports = initCustomRenderProfiles; 