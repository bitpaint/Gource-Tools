import { Request, Response } from 'express';
import db from '../models/database';
import { v4 as uuidv4 } from 'uuid';

interface Project {
  id: string;
  name: string;
  description?: string;
  last_modified: string;
}

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

// Récupérer un projet par son ID
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
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
        
        const newProject: Project = {
          id,
          name,
          description,
          last_modified: new Date().toISOString()
        };
        
        return res.status(201).json(newProject);
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