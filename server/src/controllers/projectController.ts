import { Request, Response } from 'express';
import db from '../models/database';
import { v4 as uuidv4 } from 'uuid';

interface Project {
  id: string;
  name: string;
  description?: string;
  last_modified: string;
}

interface ProfileRow {
  id: string;
}

// Helper pour générer un slug à partir d'un nom
const generateSlug = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

// Récupérer tous les projets
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    db.all('SELECT * FROM projects ORDER BY last_modified DESC', (err, rows) => {
      if (err) {
        console.error('Erreur lors de la récupération des projets:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la récupération des projets' });
      }
      
      return res.status(200).json(rows);
    });
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des projets:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des projets' });
  }
};

// Récupérer un projet par son ID ou son slug
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Vérifie d'abord si c'est un UUID (format standard UUID v4)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    
    if (isUuid) {
      // Recherche par ID
      db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Erreur lors de la récupération du projet:', err.message);
          return res.status(500).json({ error: 'Erreur lors de la récupération du projet' });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'Projet non trouvé' });
        }
        
        return res.status(200).json(row);
      });
    } else {
      // Recherche par slug (considérant le slug comme le nom formaté)
      // Note: Cette approche est simple mais peut poser des problèmes si deux projets ont le même slug
      // Une meilleure solution serait d'ajouter un champ slug dans la table projets
      const query = "SELECT * FROM projects WHERE LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '.', ''), '_', '-')) = LOWER(?)";
      
      console.log('Recherche par slug, requête:', query);
      console.log('Paramètres:', [id]);
      
      db.get(query, [id], (err, row) => {
        if (err) {
          console.error('Erreur lors de la récupération du projet par slug:', err.message);
          return res.status(500).json({ error: 'Erreur lors de la récupération du projet' });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'Projet non trouvé' });
        }
        
        return res.status(200).json(row);
      });
    }
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération du projet:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération du projet' });
  }
};

// Créer un nouveau projet
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Le nom du projet est requis' });
    }
    
    const id = uuidv4();
    
    db.run(
      'INSERT INTO projects (id, name, description) VALUES (?, ?, ?)',
      [id, name, description || null],
      function(err) {
        if (err) {
          console.error('Erreur lors de la création du projet:', err.message);
          return res.status(500).json({ error: 'Erreur lors de la création du projet' });
        }
        
        // Chercher le profil Gource par défaut pour l'associer au projet
        db.get('SELECT id FROM gource_profiles WHERE is_default = 1 AND is_global = 1 LIMIT 1', [], (err, profileRow: ProfileRow | undefined) => {
          if (err) {
            console.error('Erreur lors de la recherche du profil par défaut:', err.message);
            // Continuer même si on ne peut pas associer le profil par défaut
          }
          
          // Si un profil par défaut a été trouvé, l'associer au projet
          if (profileRow && profileRow.id) {
            db.run(
              'INSERT INTO project_profiles (project_id, profile_id, is_default) VALUES (?, ?, 1)',
              [id, profileRow.id],
              function(err) {
                if (err) {
                  console.error('Erreur lors de l\'association du profil par défaut au projet:', err.message);
                  // Continuer même si on ne peut pas associer le profil par défaut
                }
                
                console.log(`Profil par défaut ${profileRow.id} associé au projet ${id}`);
              }
            );
          }
          
          const newProject: Project = {
            id,
            name,
            description,
            last_modified: new Date().toISOString()
          };
          
          return res.status(201).json(newProject);
        });
      }
    );
  } catch (error) {
    console.error('Erreur inattendue lors de la création du projet:', error);
    return res.status(500).json({ error: 'Erreur lors de la création du projet' });
  }
};

// Mettre à jour un projet
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Le nom du projet est requis' });
    }
    
    // Vérifier si le projet existe
    db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Erreur lors de la recherche du projet:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du projet' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Projet non trouvé' });
      }
      
      const now = new Date().toISOString();
      
      db.run(
        'UPDATE projects SET name = ?, description = ?, last_modified = ? WHERE id = ?',
        [name, description || null, now, id],
        function(err) {
          if (err) {
            console.error('Erreur lors de la mise à jour du projet:', err.message);
            return res.status(500).json({ error: 'Erreur lors de la mise à jour du projet' });
          }
          
          const updatedProject: Project = {
            id,
            name,
            description,
            last_modified: now
          };
          
          return res.status(200).json(updatedProject);
        }
      );
    });
  } catch (error) {
    console.error('Erreur inattendue lors de la mise à jour du projet:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du projet' });
  }
};

// Supprimer un projet
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Vérifier si le projet existe
    db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Erreur lors de la recherche du projet:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la suppression du projet' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Projet non trouvé' });
      }
      
      db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Erreur lors de la suppression du projet:', err.message);
          return res.status(500).json({ error: 'Erreur lors de la suppression du projet' });
        }
        
        return res.status(200).json({ message: 'Projet supprimé avec succès' });
      });
    });
  } catch (error) {
    console.error('Erreur inattendue lors de la suppression du projet:', error);
    return res.status(500).json({ error: 'Erreur lors de la suppression du projet' });
  }
}; 