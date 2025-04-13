/**
 * Service de gestion des configurations Gource
 * Responsable de l'accès et des opérations sur les profils de rendu
 */

const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { defaultGourceConfig } = require('../config/defaultGourceConfig');

class GourceConfigService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../db/db.json');
    this.init();
  }

  /**
   * Initialise la base de données
   */
  init() {
    const db = this.getDatabase();
    
    // Vérifier si la collection renderProfiles existe
    if (!db.has('renderProfiles').value()) {
      db.set('renderProfiles', []).write();
    }
    
    // Vérifier si un profil par défaut existe
    const defaultProfileExists = db.get('renderProfiles')
      .find({ isDefault: true })
      .value();
    
    if (!defaultProfileExists) {
      // Ajouter le profil par défaut
      db.get('renderProfiles')
        .push(defaultGourceConfig)
        .write();
      
      console.log('Profil de rendu par défaut créé');
    }
  }

  /**
   * Récupère une instance fraîche de la base de données
   * @returns {Object} Instance de la base de données
   */
  getDatabase() {
    const adapter = new FileSync(this.dbPath);
    return low(adapter);
  }

  /**
   * Récupère tous les profils de rendu
   * @returns {Array} Liste des profils de rendu
   */
  getAllRenderProfiles() {
    const db = this.getDatabase();
    return db.get('renderProfiles').value() || [];
  }

  /**
   * Récupère un profil de rendu par son ID
   * @param {string} id - ID du profil à récupérer
   * @returns {Object|null} Profil de rendu ou null si non trouvé
   */
  getRenderProfileById(id) {
    if (!id) return null;
    
    const db = this.getDatabase();
    return db.get('renderProfiles')
      .find({ id: id.toString() })
      .value() || null;
  }

  /**
   * Récupère le profil de rendu par défaut
   * @returns {Object|null} Profil de rendu par défaut ou null si non trouvé
   */
  getDefaultRenderProfile() {
    const db = this.getDatabase();
    return db.get('renderProfiles')
      .find({ isDefault: true })
      .value() || null;
  }

  /**
   * Crée un nouveau profil de rendu
   * @param {Object} profileData - Données du profil à créer
   * @returns {Object} Profil créé
   */
  createRenderProfile(profileData) {
    const db = this.getDatabase();
    
    // Valider les données requises
    if (!profileData.name) {
      throw new Error('Le nom du profil est requis');
    }
    
    // Vérifier si un profil avec le même nom existe déjà
    const existingProfile = db.get('renderProfiles')
      .find({ name: profileData.name })
      .value();
    
    if (existingProfile) {
      throw new Error(`Un profil avec le nom "${profileData.name}" existe déjà`);
    }
    
    // Générer un ID unique
    const id = Date.now().toString();
    
    // Créer le profil
    const newProfile = {
      id,
      name: profileData.name,
      description: profileData.description || '',
      settings: profileData.settings || {},
      isDefault: !!profileData.isDefault,
      dateCreated: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    // Si c'est un profil par défaut, supprimer l'état par défaut des autres profils
    if (newProfile.isDefault) {
      db.get('renderProfiles')
        .forEach(profile => {
          if (profile.isDefault) {
            profile.isDefault = false;
          }
        })
        .write();
    }
    
    // Ajouter le profil à la base de données
    db.get('renderProfiles')
      .push(newProfile)
      .write();
    
    return newProfile;
  }

  /**
   * Met à jour un profil de rendu existant
   * @param {string} id - ID du profil à mettre à jour
   * @param {Object} profileData - Nouvelles données du profil
   * @returns {Object|null} Profil mis à jour ou null si non trouvé
   */
  updateRenderProfile(id, profileData) {
    if (!id) return null;
    
    const db = this.getDatabase();
    const profile = db.get('renderProfiles')
      .find({ id: id.toString() })
      .value();
    
    if (!profile) return null;
    
    // Vérifier si un autre profil avec le même nom existe déjà
    if (profileData.name && profileData.name !== profile.name) {
      const existingProfile = db.get('renderProfiles')
        .find({ name: profileData.name })
        .value();
      
      if (existingProfile && existingProfile.id !== id) {
        throw new Error(`Un profil avec le nom "${profileData.name}" existe déjà`);
      }
    }
    
    // Préparer les données à mettre à jour
    const updatedProfile = {
      ...profile,
      ...profileData,
      lastModified: new Date().toISOString()
    };
    
    // Si c'est un profil par défaut, supprimer l'état par défaut des autres profils
    if (updatedProfile.isDefault) {
      db.get('renderProfiles')
        .forEach(p => {
          if (p.id !== id && p.isDefault) {
            p.isDefault = false;
          }
        })
        .write();
    }
    
    // Mettre à jour le profil dans la base de données
    db.get('renderProfiles')
      .find({ id: id.toString() })
      .assign(updatedProfile)
      .write();
    
    return updatedProfile;
  }

  /**
   * Supprime un profil de rendu
   * @param {string} id - ID du profil à supprimer
   * @returns {boolean} true si supprimé, false sinon
   */
  deleteRenderProfile(id) {
    if (!id) return false;
    
    const db = this.getDatabase();
    const profile = db.get('renderProfiles')
      .find({ id: id.toString() })
      .value();
    
    if (!profile) return false;
    
    // Ne pas supprimer un profil par défaut
    if (profile.isDefault) {
      throw new Error('Cannot delete the default render profile');
    }
    
    // Supprimer le profil de la base de données
    db.get('renderProfiles')
      .remove({ id: id.toString() })
      .write();
    
    return true;
  }
}

module.exports = new GourceConfigService(); 