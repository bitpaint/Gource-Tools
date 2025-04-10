import { Request, Response } from 'express';
import db from '../models/database';
import { v4 as uuidv4 } from 'uuid';
import * as gitService from '../services/gitService';
import { getGitHubCredentials, isGitHubTokenValid, createGitHubHeaders as createHeaders } from '../utils/githubAuth';

interface Repository {
  id: string;
  name: string;
  username?: string | null;
  url?: string | null;
  local_path?: string | null;
  branch_default?: string;
  tags?: string | null;
  last_updated: string;
  last_tags_update?: string;
}

interface ProjectRepository {
  id: string;
  project_id: string;
  repository_id: string;
  branch_override?: string;
  display_name?: string;
}

// Get GitHub token (try all available sources)
async function getGitHubToken(): Promise<string | null> {
  return getGitHubCredentials();
}

// Function for creating GitHub API request headers
async function createGitHubHeaders(): Promise<HeadersInit> {
  return createHeaders();
}

// Fonction pour créer des tags fallback pour les dépôts GitHub connus
function getDefaultTagsForRepo(username: string, repoName: string): string[] {
  const lowerRepoName = repoName.toLowerCase();
  
  // Détecter le langage de programmation à partir du nom
  const languageTags: string[] = [];
  if (lowerRepoName.includes('node') || lowerRepoName.includes('js') || lowerRepoName.includes('javascript')) {
    languageTags.push('javascript', 'nodejs');
  } else if (lowerRepoName.includes('python') || lowerRepoName.includes('py')) {
    languageTags.push('python');
  } else if (lowerRepoName.includes('rust') || lowerRepoName.includes('rs')) {
    languageTags.push('rust');
  } else if (lowerRepoName.includes('go')) {
    languageTags.push('golang');
  } else if (lowerRepoName.includes('java')) {
    languageTags.push('java');
  } else if (lowerRepoName.includes('react')) {
    languageTags.push('javascript', 'reactjs');
  } else if (lowerRepoName.includes('vue')) {
    languageTags.push('javascript', 'vuejs');
  }
  
  // Ajouter des tags basés sur le dépôt NOSTR spécifique
  if (username.toLowerCase() === 'nostr-protocol' || lowerRepoName.includes('nostr')) {
    languageTags.push('nostr', 'protocol');
    
    if (lowerRepoName === 'nips') {
      return [...languageTags, 'nips', 'specifications', 'documentation'];
    } else if (lowerRepoName === 'nostr') {
      return [...languageTags, 'core', 'reference-implementation'];
    } else if (lowerRepoName === 'data-vending-machines') {
      return [...languageTags, 'dvm', 'data-processing'];
    }
  }
  
  // Ajouter des tags génériques si aucun tag spécifique n'a été trouvé
  if (languageTags.length === 0) {
    languageTags.push('code', 'repository');
  }
  
  return languageTags;
}

// Récupérer tous les dépôts
export const getAllRepositories = async (req: Request, res: Response) => {
  try {
    const { project_id } = req.query;
    
    // Définir la requête SQL de base
    let sql = 'SELECT * FROM repositories';
    const params: any[] = [];
    
    // Ajouter un filtre par projet si nécessaire
    if (project_id) {
      sql += ' WHERE id IN (SELECT repository_id FROM project_repositories WHERE project_id = ?)';
      params.push(project_id);
    }
    
    // Ajouter un ordre de tri
    sql += ' ORDER BY name ASC';
    
    // Exécuter la requête
    db.all(sql, params, async (err, rows) => {
      if (err) {
        console.error('Erreur lors de la récupération des dépôts:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la récupération des dépôts' });
      }
      
      // Retourner directement les dépôts sans enrichissement des topics GitHub
      return res.json(rows);
    });
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des dépôts:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des dépôts' });
  }
};

// Récupérer un dépôt par son ID ou son slug
export const getRepositoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const projectId = req.query.project_id as string;
    
    // Vérifie d'abord si c'est un UUID (format standard UUID v4)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    
    if (projectId) {
      // Si project_id est fourni, récupérer le dépôt dans le contexte du projet
      let query = `
        SELECT r.*, pr.branch_override, pr.display_name, pr.id as link_id 
        FROM repositories r
        JOIN project_repositories pr ON r.id = pr.repository_id
        WHERE pr.project_id = ? AND 
      `;
      
      let params = [projectId];
      
      if (isUuid) {
        // Recherche par ID
        query += 'r.id = ?';
        params.push(id);
      } else {
        // Recherche par slug (nom formaté)
        query += 'LOWER(REPLACE(REPLACE(REPLACE(r.name, " ", "-"), ".", ""), "_", "-")) = LOWER(?)';
        params.push(id);
      }
      
      db.get(query, params, (err, row) => {
        if (err) {
          console.error('Erreur lors de la récupération du dépôt dans un projet:', err.message);
          return res.status(500).json({ error: 'Erreur lors de la récupération du dépôt' });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'Dépôt non trouvé dans ce projet' });
        }
        
        return res.status(200).json(row);
      });
    } else {
      // Sinon, récupérer le dépôt général
      let query = 'SELECT * FROM repositories WHERE ';
      let params = [];
      
      if (isUuid) {
        // Recherche par ID
        query += 'id = ?';
        params.push(id);
      } else {
        // Recherche par slug (nom formaté)
        query += "LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '.', ''), '_', '-')) = LOWER(?)";
        params.push(id);
      }
      
      console.log('Recherche par slug, requête:', query);
      console.log('Paramètres:', params);
      
      db.get(query, params, (err, row) => {
        if (err) {
          console.error('Erreur lors de la récupération du dépôt:', err.message);
          return res.status(500).json({ error: 'Erreur lors de la récupération du dépôt' });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'Dépôt non trouvé' });
        }
        
        return res.status(200).json(row);
      });
    }
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération du dépôt:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération du dépôt' });
  }
};

// Créer un nouveau dépôt dans le système et optionnellement l'associer à un projet
export const createRepository = async (req: Request, res: Response) => {
  try {
    const { project_id, name, url, branch_default } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Le nom du dépôt est requis' });
    }
    
    // Si un project_id est fourni, vérifier si le projet existe
    if (project_id) {
      db.get('SELECT * FROM projects WHERE id = ?', [project_id], async (err, row) => {
        if (err) {
          console.error('Erreur lors de la vérification du projet:', err.message);
          return res.status(500).json({ error: 'Erreur lors de la création du dépôt' });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'Projet non trouvé' });
        }
        
        // Continuer avec la création du dépôt
        await createRepositoryAndLink();
      });
    } else {
      // Créer le dépôt sans lien avec un projet
      await createRepositoryAndLink();
    }
    
    async function createRepositoryAndLink() {
      try {
        // Si une URL est fournie, chercher d'abord si ce dépôt existe déjà
        let repoId: string;
        let local_path: string | null = null;
        
        if (url) {
          // Normaliser l'URL du dépôt avant de vérifier s'il existe
          const normalizedUrl = gitService.normalizeGitUrl(url);
          repoId = gitService.generateRepoId(normalizedUrl);
          
          // Vérifier si le dépôt existe déjà
          const existingRepo = await new Promise<Repository | null>((resolve) => {
            db.get('SELECT * FROM repositories WHERE id = ?', [repoId], (err, row) => {
              if (err || !row) {
                resolve(null);
              } else {
                resolve(row as Repository);
              }
            });
          });
          
          if (existingRepo) {
            // Le dépôt existe déjà, on peut juste l'associer au projet si nécessaire
            if (project_id) {
              await linkRepositoryToProject(existingRepo.id, project_id, name, branch_default);
            }
            
            return res.status(200).json({
              ...existingRepo,
              message: 'Repository already exists and was retrieved successfully',
              existing: true
            });
          }
          
          // Le dépôt n'existe pas encore, le télécharger
          try {
            local_path = await gitService.downloadRepository(normalizedUrl);
          } catch (error: any) {
            // Préparer un message d'erreur convivial
            let errorMessage = 'Error downloading repository';
            
            if (error.message.includes("does not exist or is private")) {
              errorMessage = `Repository ${normalizedUrl} doesn't exist or is private. Check the URL and make sure the repository is public.`;
            } else if (error.message.includes("Authentication required")) {
              errorMessage = `Repository ${normalizedUrl} requires authentication. Only public repositories are supported at the moment.`;
            } else if (error.message.includes("timeout")) {
              errorMessage = `Downloading repository ${normalizedUrl} took too long. The repository might be too large or temporarily unavailable.`;
            }
            
            console.error('Detailed error while downloading repository:', error);
            return res.status(400).json({ error: errorMessage });
          }
        } else {
          // Pas d'URL, c'est un dépôt local
          repoId = uuidv4();
        }
        
        // Créer l'entrée du dépôt
        const now = new Date().toISOString();
        
        // Extraire le username de l'URL si disponible
        const username = url ? extractUsername(url) : null;
        
        await new Promise<void>((resolve, reject) => {
          db.run(
            'INSERT INTO repositories (id, name, username, url, local_path, branch_default, tags, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [repoId, name, username, url || null, local_path || null, branch_default || 'main', null, now],
            function(err) {
              if (err) {
                console.error('Error creating repository:', err.message);
                reject(err);
                return;
              }
              resolve();
            }
          );
        });
        
        const newRepo = {
          id: repoId,
          name,
          username,
          url: url || null,
          local_path: local_path || null,
          branch_default: branch_default || 'main',
          tags: null,
          last_updated: now
        };
        
        // Si un project_id est fourni, créer le lien entre le projet et le dépôt
        if (project_id) {
          await linkRepositoryToProject(repoId, project_id, name, branch_default);
          return res.status(201).json({
            ...newRepo,
            message: 'Repository created and linked to project successfully'
          });
        }
        
        return res.status(201).json({
          ...newRepo,
          message: 'Repository created successfully'
        });
      } catch (error: any) {
        console.error('Error creating repository:', error);
        
        // Préparer un message d'erreur convivial
        let errorMessage = 'Error creating repository';
        
        if (error.message.includes("UNIQUE constraint failed")) {
          errorMessage = `A repository with the same name already exists. Please choose a different name.`;
        }
        
        return res.status(500).json({ error: errorMessage });
      }
    }
    
    async function linkRepositoryToProject(repoId: string, projectId: string, displayName?: string, branchOverride?: string) {
      // Vérifier si le lien existe déjà
      const existingLink = await new Promise<boolean>((resolve) => {
        db.get(
          'SELECT * FROM project_repositories WHERE project_id = ? AND repository_id = ?',
          [projectId, repoId],
          (err, row) => {
            if (err || !row) {
              resolve(false);
            } else {
              resolve(true);
            }
          }
        );
      });
      
      if (existingLink) {
        return; // Le lien existe déjà, ne rien faire
      }
      
      // Créer le lien
      const linkId = uuidv4();
      
      await new Promise<void>((resolve, reject) => {
        db.run(
          'INSERT INTO project_repositories (id, project_id, repository_id, branch_override, display_name) VALUES (?, ?, ?, ?, ?)',
          [linkId, projectId, repoId, branchOverride || null, displayName || null],
          function(err) {
            if (err) {
              console.error('Erreur lors de la liaison du dépôt au projet:', err.message);
              reject(err);
              return;
            }
            resolve();
          }
        );
      });
    }
  } catch (error) {
    console.error('Erreur inattendue lors de la création du dépôt:', error);
    return res.status(500).json({ error: 'Erreur lors de la création du dépôt' });
  }
};

// Mettre à jour un dépôt
export const updateRepository = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, url, branch_default, branch_override, display_name, tags } = req.body;
    const project_id = req.query.project_id as string;
    
    if (!name) {
      return res.status(400).json({ error: 'Le nom du dépôt est requis' });
    }
    
    // Si project_id est fourni, mettre à jour le lien
    if (project_id) {
      // Vérifier si le lien existe
      db.get(
        'SELECT pr.*, r.* FROM project_repositories pr JOIN repositories r ON pr.repository_id = r.id WHERE r.id = ? AND pr.project_id = ?',
        [id, project_id],
        async (err, row) => {
          if (err) {
            console.error('Erreur lors de la recherche du lien:', err.message);
            return res.status(500).json({ error: 'Erreur lors de la mise à jour du dépôt' });
          }
          
          if (!row) {
            return res.status(404).json({ error: 'Lien projet-dépôt non trouvé' });
          }
          
          const typedRow = row as any;
          
          // Mettre à jour le lien
          db.run(
            'UPDATE project_repositories SET branch_override = ?, display_name = ? WHERE project_id = ? AND repository_id = ?',
            [branch_override || undefined, display_name || name, project_id, id],
            function(err) {
              if (err) {
                console.error('Erreur lors de la mise à jour du lien:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la mise à jour du dépôt' });
              }
              
              // Mettre à jour le dépôt
              db.run(
                'UPDATE repositories SET name = ?, branch_default = ?, tags = ? WHERE id = ?',
                [name, branch_default || typedRow.branch_default, tags || typedRow.tags, id],
                function(err) {
                  if (err) {
                    console.error('Erreur lors de la mise à jour du dépôt:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la mise à jour du dépôt' });
                  }
                  
                  return res.status(200).json({
                    ...typedRow,
                    name,
                    branch_default: branch_default || typedRow.branch_default,
                    branch_override: branch_override || undefined,
                    display_name: display_name || name,
                    tags: tags || typedRow.tags
                  });
                }
              );
            }
          );
        }
      );
    } else {
      // Mettre à jour uniquement le dépôt
      db.get('SELECT * FROM repositories WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Erreur lors de la recherche du dépôt:', err.message);
          return res.status(500).json({ error: 'Erreur lors de la mise à jour du dépôt' });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'Dépôt non trouvé' });
        }
        
        const repository = row as Repository;
        
        // Mettre à jour le dépôt
        db.run(
          'UPDATE repositories SET name = ?, branch_default = ?, tags = ? WHERE id = ?',
          [name, branch_default || repository.branch_default, tags || repository.tags, id],
          function(err) {
            if (err) {
              console.error('Erreur lors de la mise à jour du dépôt:', err.message);
              return res.status(500).json({ error: 'Erreur lors de la mise à jour du dépôt' });
            }
            
            return res.status(200).json({
              ...repository,
              name,
              branch_default: branch_default || repository.branch_default,
              tags: tags || repository.tags
            });
          }
        );
      });
    }
  } catch (error) {
    console.error('Erreur inattendue lors de la mise à jour du dépôt:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du dépôt' });
  }
};

// Supprimer un dépôt (ou son lien avec un projet)
export const deleteRepository = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project_id = req.query.project_id as string;
    
    if (project_id) {
      // Si project_id est fourni, supprimer uniquement le lien
      db.run(
        'DELETE FROM project_repositories WHERE project_id = ? AND repository_id = ?',
        [project_id, id],
        function(err) {
          if (err) {
            console.error('Erreur lors de la suppression du lien:', err.message);
            return res.status(500).json({ error: 'Erreur lors de la suppression du lien' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Lien projet-dépôt non trouvé' });
          }
          
          return res.status(200).json({ message: 'Dépôt retiré du projet avec succès' });
        }
      );
    } else {
      // Sinon, supprimer complètement le dépôt
      db.get('SELECT * FROM repositories WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Erreur lors de la recherche du dépôt:', err.message);
          return res.status(500).json({ error: 'Erreur lors de la suppression du dépôt' });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'Dépôt non trouvé' });
        }
        
        // D'abord supprimer tous les liens
        db.run('DELETE FROM project_repositories WHERE repository_id = ?', [id], function(err) {
          if (err) {
            console.error('Erreur lors de la suppression des liens:', err.message);
            return res.status(500).json({ error: 'Erreur lors de la suppression du dépôt' });
          }
          
          // Puis supprimer le dépôt
          db.run('DELETE FROM repositories WHERE id = ?', [id], function(err) {
            if (err) {
              console.error('Erreur lors de la suppression du dépôt:', err.message);
              return res.status(500).json({ error: 'Erreur lors de la suppression du dépôt' });
            }
            
            return res.status(200).json({ message: 'Dépôt supprimé avec succès' });
          });
        });
      });
    }
  } catch (error) {
    console.error('Erreur inattendue lors de la suppression du dépôt:', error);
    return res.status(500).json({ error: 'Erreur lors de la suppression du dépôt' });
  }
};

// Synchroniser un dépôt (git pull)
export const syncRepository = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Vérifier si le dépôt existe
    db.get('SELECT * FROM repositories WHERE id = ?', [id], async (err, row) => {
      if (err) {
        console.error('Erreur lors de la recherche du dépôt:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la synchronisation du dépôt' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Dépôt non trouvé' });
      }
      
      const repository = row as Repository;
      
      // Vérifier si le dépôt a un chemin local
      if (!repository.local_path) {
        return res.status(400).json({ error: 'Ce dépôt n\'a pas de chemin local à synchroniser' });
      }
      
      try {
        // Synchroniser le dépôt
        const result = await gitService.updateRepository(repository.local_path);
        
        // Mettre à jour la date de dernière modification
        const now = new Date().toISOString();
        
        db.run(
          'UPDATE repositories SET last_updated = ? WHERE id = ?',
          [now, id],
          function(err) {
            if (err) {
              console.error('Erreur lors de la mise à jour de la date:', err.message);
              return res.status(500).json({ error: 'Erreur lors de la mise à jour de la date' });
            }
            
            return res.status(200).json({ 
              message: 'Dépôt synchronisé avec succès',
              result,
              last_updated: now
            });
          }
        );
      } catch (error) {
        console.error('Erreur lors de la synchronisation du dépôt:', error);
        return res.status(500).json({ 
          error: `Erreur lors de la synchronisation du dépôt: ${(error as Error).message || 'Erreur inconnue'}` 
        });
      }
    });
  } catch (error) {
    console.error('Erreur inattendue lors de la synchronisation du dépôt:', error);
    return res.status(500).json({ error: 'Erreur lors de la synchronisation du dépôt' });
  }
};

// Récupérer les branches d'un dépôt
export const getRepositoryBranches = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Vérifier si le dépôt existe
    db.get('SELECT * FROM repositories WHERE id = ?', [id], async (err, row) => {
      if (err) {
        console.error('Erreur lors de la recherche du dépôt:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la récupération des branches' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Dépôt non trouvé' });
      }
      
      const repository = row as Repository;
      
      // Vérifier si le dépôt a un chemin local
      if (!repository.local_path) {
        return res.status(400).json({ error: 'Ce dépôt n\'a pas de chemin local pour récupérer les branches' });
      }
      
      try {
        // Récupérer les branches
        const branches = await gitService.getBranches(repository.local_path);
        
        return res.status(200).json({ branches });
      } catch (error) {
        console.error('Erreur lors de la récupération des branches:', error);
        return res.status(500).json({ 
          error: `Erreur lors de la récupération des branches: ${(error as Error).message || 'Erreur inconnue'}` 
        });
      }
    });
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des branches:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des branches' });
  }
};

// Importer les dépôts d'un utilisateur ou d'une organisation
export const importRepositories = async (req: Request, res: Response) => {
  try {
    const { type, username, projectId } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Nom d\'utilisateur manquant' });
    }
    
    // Récupérer uniquement les dépôts GitHub
    // Seule l'intégration GitHub est supportée
    const githubApiUrl = `https://api.github.com/users/${username}/repos`;
    const response = await fetch(githubApiUrl, {
      headers: await createGitHubHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const repositories = data.map((repo: any) => ({
      name: repo.name,
      url: repo.clone_url
    }));
    
    if (repositories.length === 0) {
      return res.status(404).json({ 
        error: `No public repositories found for ${username} on GitHub` 
      });
    }
    
    // Create/retrieve repositories and link them to the project
    const results = [];
    
    for (const repo of repositories) {
      try {
        const repoId = gitService.generateRepoId(repo.url);
        
        // Check if repository already exists
        const existingRepo = await new Promise<Repository | null>((resolve) => {
          db.get('SELECT * FROM repositories WHERE id = ?', [repoId], (err, row) => {
            if (err || !row) {
              resolve(null);
            } else {
              resolve(row as Repository);
            }
          });
        });
        
        let repoToUse: Repository;
        
        if (!existingRepo) {
          // Download the repository
          const local_path = await gitService.downloadRepository(repo.url);
          const now = new Date().toISOString();
          
          // Create repository entry
          await new Promise<void>((resolve, reject) => {
            db.run(
              'INSERT INTO repositories (id, name, url, local_path, branch_default, last_updated) VALUES (?, ?, ?, ?, ?, ?)',
              [repoId, repo.name, repo.url, local_path, 'main', now],
              function(err) {
                if (err) {
                  reject(err);
                  return;
                }
                resolve();
              }
            );
          });
          
          repoToUse = {
            id: repoId,
            name: repo.name,
            url: repo.url,
            local_path,
            branch_default: 'main',
            last_updated: now
          };
        } else {
          repoToUse = existingRepo;
        }
        
        // If a project_id is provided, create the link
        if (projectId) {
          // Check if link already exists
          const linkExists = await new Promise<boolean>((resolve) => {
            db.get(
              'SELECT * FROM project_repositories WHERE project_id = ? AND repository_id = ?',
              [projectId, repoToUse.id],
              (err, row) => {
                if (err || !row) {
                  resolve(false);
                } else {
                  resolve(true);
                }
              }
            );
          });
          
          if (!linkExists) {
            const linkId = uuidv4();
            
            await new Promise<void>((resolve, reject) => {
              db.run(
                'INSERT INTO project_repositories (id, project_id, repository_id, display_name) VALUES (?, ?, ?, ?)',
                [linkId, projectId, repoToUse.id, repo.name],
                function(err) {
                  if (err) {
                    reject(err);
                    return;
                  }
                  resolve();
                }
              );
            });
          }
        }
        
        results.push({
          id: repoToUse.id,
          name: repoToUse.name,
          url: repoToUse.url,
          success: true
        });
      } catch (error) {
        console.error(`Error importing repository ${repo.name}:`, error);
        results.push({
          name: repo.name,
          url: repo.url,
          success: false,
          error: (error as Error).message
        });
      }
    }
    
    return res.status(200).json({
      message: `${results.filter(r => r.success).length} repositories successfully imported out of ${repositories.length} found`,
      results
    });
    
  } catch (error) {
    console.error('Unexpected error during repository import:', error);
    return res.status(500).json({ error: 'Error importing repositories' });
  }
};

// Fonction pour lier un dépôt existant à un projet
export const linkRepositoryToProject = async (req: Request, res: Response) => {
  try {
    const { repository_id, project_id, branch_override, display_name } = req.body;
    
    if (!repository_id || !project_id) {
      return res.status(400).json({ error: 'Le repository_id et le project_id sont requis' });
    }
    
    // Vérifier si le dépôt existe
    const repo = await new Promise<Repository | null>((resolve) => {
      db.get('SELECT * FROM repositories WHERE id = ?', [repository_id], (err, row) => {
        if (err || !row) {
          resolve(null);
        } else {
          resolve(row as Repository);
        }
      });
    });
    
    if (!repo) {
      return res.status(404).json({ error: 'Dépôt non trouvé' });
    }
    
    // Vérifier si le projet existe
    const project = await new Promise<any | null>((resolve) => {
      db.get('SELECT * FROM projects WHERE id = ?', [project_id], (err, row) => {
        if (err || !row) {
          resolve(null);
        } else {
          resolve(row);
        }
      });
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }
    
    // Vérifier si le lien existe déjà
    const existingLink = await new Promise<boolean>((resolve) => {
      db.get(
        'SELECT * FROM project_repositories WHERE project_id = ? AND repository_id = ?',
        [project_id, repository_id],
        (err, row) => {
          if (err || !row) {
            resolve(false);
          } else {
            resolve(true);
          }
        }
      );
    });
    
    if (existingLink) {
      return res.status(200).json({
        message: 'Le dépôt est déjà associé à ce projet',
        existing: true
      });
    }
    
    // Créer le lien
    const linkId = uuidv4();
    
    await new Promise<void>((resolve, reject) => {
      db.run(
        'INSERT INTO project_repositories (id, project_id, repository_id, branch_override, display_name) VALUES (?, ?, ?, ?, ?)',
        [linkId, project_id, repository_id, branch_override || null, display_name || repo.name],
        function(err) {
          if (err) {
            console.error('Erreur lors de la liaison du dépôt au projet:', err.message);
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
    
    return res.status(201).json({
      message: 'Dépôt lié au projet avec succès',
      id: linkId,
      project_id,
      repository_id,
      branch_override: branch_override || null,
      display_name: display_name || repo.name
    });
    
  } catch (error) {
    console.error('Erreur lors de la liaison du dépôt au projet:', error);
    return res.status(500).json({
      error: `Erreur lors de la liaison du dépôt au projet: ${(error as Error).message || 'Erreur inconnue'}`
    });
  }
};

// Fonction pour extraire le nom du dépôt à partir de l'URL Git
const extractRepoName = (url: string): string => {
  if (!url) return '';
  
  // Retirer l'extension .git si présente
  let repoName = url.trim().replace(/\.git$/, '');
  
  // Extraire le nom du dépôt après le dernier '/' ou ':'
  const parts = repoName.split(/[\/:]/).filter(Boolean);
  return parts[parts.length - 1] || '';
};

// Fonction pour extraire le nom d'utilisateur à partir de l'URL Git
const extractUsername = (url: string): string => {
  if (!url) return '';
  
  // Retirer l'extension .git si présente
  let cleanUrl = url.trim().replace(/\.git$/, '');
  
  // Pour les URL HTTP(S)
  if (cleanUrl.includes('github.com') || cleanUrl.includes('gitlab.com')) {
    // Format: https://github.com/username/repo
    const parts = cleanUrl.split('/').filter(Boolean);
    if (parts.length >= 2) {
      // L'index du nom d'utilisateur dépend de la structure de l'URL
      const domainIndex = parts.findIndex(part => 
        part === 'github.com' || part === 'gitlab.com');
      if (domainIndex !== -1 && parts.length > domainIndex + 1) {
        return parts[domainIndex + 1];
      }
    }
  } 
  // Pour les URL SSH
  else if (cleanUrl.includes('@github.com') || cleanUrl.includes('@gitlab.com')) {
    // Format: git@github.com:username/repo
    const match = cleanUrl.match(/@(?:github|gitlab)\.com[:|\/]([^\/]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return '';
};

// Function to import a GitHub repository
export const importRepository = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Extract owner and repo name from URL
    let owner = '';
    let repoName = '';
    
    // HTTPS format: https://github.com/username/repo.git
    const httpsMatch = url.match(/https:\/\/github\.com\/([^\/]+)\/([^\/\.]+)(?:\.git)?/);
    
    // SSH format: git@github.com:username/repo.git
    const sshMatch = url.match(/git@github\.com:([^\/]+)\/([^\/\.]+)(?:\.git)?/);
    
    if (httpsMatch) {
      owner = httpsMatch[1];
      repoName = httpsMatch[2];
    } else if (sshMatch) {
      owner = sshMatch[1];
      repoName = sshMatch[2];
    } else {
      return res.status(400).json({ error: 'Invalid GitHub URL format' });
    }
    
    // Get repository info from GitHub API
    console.log(`Fetching repository data for ${owner}/${repoName}`);
    
    const apiUrl = `https://api.github.com/repos/${owner}/${repoName}`;
    const headers = await createGitHubHeaders();
    
    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        return res.status(404).json({ 
          error: 'Repository not found on GitHub. Make sure the URL is correct and the repository is public or you have access to it.' 
        });
      }
      
      if (response.status === 403) {
        return res.status(403).json({ 
          error: 'GitHub API rate limit reached. Please try again later or add a GitHub token in the settings.' 
        });
      }
      
      return res.status(response.status).json({ 
        error: `GitHub API error: ${response.statusText}` 
      });
    }
    
    const repoData = await response.json();
    
    // Generate default tags based on repository name
    let topics: string[] = getDefaultTagsForRepo(owner, repoName);
    
    // Create repository record in the database
    db.run(
      `INSERT INTO repositories (name, description, url, clone_url, default_branch, stars, forks, last_commit, tags, last_tags_update)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        repoData.name,
        repoData.description || '',
        url,
        repoData.clone_url,
        repoData.default_branch,
        repoData.stargazers_count,
        repoData.forks_count,
        repoData.updated_at,
        topics.join(','),
        new Date().toISOString()
      ],
      function(err) {
        if (err) {
          console.error('Error saving repository:', err.message);
          return res.status(500).json({ error: 'Error saving repository' });
        }
        
        return res.status(201).json({
          id: this.lastID,
          name: repoData.name,
          description: repoData.description || '',
          url: url,
          clone_url: repoData.clone_url,
          default_branch: repoData.default_branch,
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          last_commit: repoData.updated_at,
          tags: topics.join(',')
        });
      }
    );
  } catch (error: any) {
    console.error('Error importing repository:', error);
    return res.status(500).json({ 
      error: 'Error importing repository',
      message: error.message || 'Unknown error'
    });
  }
}; 