/**
 * Service de gestion des projets
 * Responsable de l'accès et des opérations sur les projets
 */

const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

class ProjectService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../db/db.json');
    this.init();
  }

  /**
   * Initialise la base de données
   */
  init() {
    const db = this.getDatabase();
    
    // Vérifier si la collection projects existe
    if (!db.has('projects').value()) {
      db.set('projects', []).write();
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
   * Récupère tous les projets
   * @returns {Array} Liste des projets
   */
  getAllProjects() {
    const db = this.getDatabase();
    return db.get('projects').value() || [];
  }

  /**
   * Récupère un projet par son ID
   * @param {string} id - ID du projet à récupérer
   * @returns {Object|null} Projet ou null si non trouvé
   */
  getProjectById(id) {
    if (!id) return null;
    
    const db = this.getDatabase();
    return db.get('projects')
      .find({ id: id.toString() })
      .value() || null;
  }

  /**
   * Récupère un projet avec tous ses détails (référentiels et profil de rendu)
   * @param {string} projectId - ID du projet à récupérer
   * @returns {Object|null} Projet avec détails ou null si non trouvé
   */
  getProjectWithDetails(projectId) {
    if (!projectId) return null;
    
    // Récupérer le projet
    const project = this.getProjectById(projectId);
    
    if (!project) return null;
    
    // Récupérer les détails des référentiels
    const db = this.getDatabase();
    const repositoryDetails = project.repositories.map(repoId => {
      return db.get('repositories')
        .find({ id: repoId })
        .value();
    }).filter(repo => repo !== undefined);
    
    // Récupérer le profil de rendu
    let renderProfile = null;
    if (project.renderProfileId) {
      renderProfile = db.get('renderProfiles')
        .find({ id: project.renderProfileId })
        .value();
    }
    
    if (!renderProfile) {
      // Utiliser le profil par défaut si aucun profil n'est spécifié
      renderProfile = db.get('renderProfiles')
        .find({ isDefault: true })
        .value();
    }
    
    return {
      ...project,
      repositoryDetails,
      renderProfile
    };
  }

  /**
   * Crée un nouveau projet
   * @param {Object} projectData - Données du projet à créer
   * @returns {Object} Projet créé
   */
  createProject(projectData) {
    const db = this.getDatabase();
    
    // Valider les données requises
    if (!projectData.name) {
      throw new Error('Le nom du projet est requis');
    }
    
    // Vérifier si un projet avec le même nom existe déjà
    const existingProject = db.get('projects')
      .find({ name: projectData.name })
      .value();
    
    if (existingProject) {
      throw new Error(`Un projet avec le nom "${projectData.name}" existe déjà`);
    }
    
    // Générer un ID unique
    const id = Date.now().toString();
    
    // Créer le projet
    const newProject = {
      id,
      name: projectData.name,
      description: projectData.description || '',
      repositories: projectData.repositories || [],
      renderProfileId: projectData.renderProfileId || null,
      dateCreated: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    // Ajouter le projet à la base de données
    db.get('projects')
      .push(newProject)
      .write();
    
    return newProject;
  }

  /**
   * Met à jour un projet existant
   * @param {string} id - ID du projet à mettre à jour
   * @param {Object} projectData - Nouvelles données du projet
   * @returns {Object|null} Projet mis à jour ou null si non trouvé
   */
  updateProject(id, projectData) {
    if (!id) return null;
    
    const db = this.getDatabase();
    const project = db.get('projects')
      .find({ id: id.toString() })
      .value();
    
    if (!project) return null;
    
    // Vérifier si un autre projet avec le même nom existe déjà
    if (projectData.name && projectData.name !== project.name) {
      const existingProject = db.get('projects')
        .find({ name: projectData.name })
        .value();
      
      if (existingProject && existingProject.id !== id) {
        throw new Error(`Un projet avec le nom "${projectData.name}" existe déjà`);
      }
    }
    
    // Préparer les données à mettre à jour
    const updatedProject = {
      ...project,
      ...projectData,
      lastModified: new Date().toISOString()
    };
    
    // Mettre à jour le projet dans la base de données
    db.get('projects')
      .find({ id: id.toString() })
      .assign(updatedProject)
      .write();
    
    return updatedProject;
  }

  /**
   * Supprime un projet
   * @param {string} id - ID du projet à supprimer
   * @returns {boolean} true si supprimé, false sinon
   */
  deleteProject(id) {
    if (!id) return false;
    
    const db = this.getDatabase();
    const project = db.get('projects')
      .find({ id: id.toString() })
      .value();
    
    if (!project) return false;
    
    // Supprimer le projet de la base de données
    db.get('projects')
      .remove({ id: id.toString() })
      .write();
    
    return true;
  }
}

module.exports = new ProjectService(); 