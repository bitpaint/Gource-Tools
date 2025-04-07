import { Request, Response } from 'express';
import db from '../models/database';
import { v4 as uuidv4 } from 'uuid';
import * as gitService from '../services/gitService';

interface Repository {
  id: string;
  name: string;
  url?: string | null;
  local_path?: string | null;
  branch_default?: string;
  last_updated: string;
}

interface ProjectRepository {
  id: string;
  project_id: string;
  repository_id: string;
  branch_override?: string;
  display_name?: string;
}

// Récupérer tous les dépôts
export const getAllRepositories = async (req: Request, res: Response) => {
  try {
    const projectId = req.query.project_id as string;
    
    if (projectId) {
      // Si project_id est fourni, récupérer les dépôts liés à ce projet
      db.all(`
        SELECT r.*, pr.branch_override, pr.display_name, pr.id as link_id 
        FROM repositories r
        JOIN project_repositories pr ON r.id = pr.repository_id
        WHERE pr.project_id = ?
        ORDER BY r.last_updated DESC
      `, [projectId], (err, rows) => {
        if (err) {
          console.error('Erreur lors de la récupération des dépôts du projet:', err.message);
          return res.status(500).json({ error: 'Erreur lors de la récupération des dépôts' });
        }
        
        return res.status(200).json(rows);
      });
    } else {
      // Sinon, récupérer tous les dépôts
      db.all('SELECT * FROM repositories ORDER BY last_updated DESC', [], (err, rows) => {
        if (err) {
          console.error('Erreur lors de la récupération des dépôts:', err.message);
          return res.status(500).json({ error: 'Erreur lors de la récupération des dépôts' });
        }
        
        return res.status(200).json(rows);
      });
    }
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des dépôts:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des dépôts' });
  }
};

// Récupérer un dépôt par son ID
export const getRepositoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const projectId = req.query.project_id as string;
    
    if (projectId) {
      // Si project_id est fourni, récupérer le dépôt dans le contexte du projet
      db.get(`
        SELECT r.*, pr.branch_override, pr.display_name, pr.id as link_id 
        FROM repositories r
        JOIN project_repositories pr ON r.id = pr.repository_id
        WHERE r.id = ? AND pr.project_id = ?
      `, [id, projectId], (err, row) => {
        if (err) {
          console.error('Erreur lors de la récupération du dépôt:', err.message);
          return res.status(500).json({ error: 'Erreur lors de la récupération du dépôt' });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'Dépôt non trouvé dans ce projet' });
        }
        
        return res.status(200).json(row);
      });
    } else {
      // Sinon, récupérer le dépôt général
      db.get('SELECT * FROM repositories WHERE id = ?', [id], (err, row) => {
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

// Créer un nouveau dépôt dans le système et l'associer à un projet
export const createRepository = async (req: Request, res: Response) => {
  try {
    const { project_id, name, url, branch_default } = req.body;
    
    if (!project_id || !name) {
      return res.status(400).json({ error: 'Le projet ID et le nom du dépôt sont requis' });
    }
    
    // Vérifier si le projet existe
    db.get('SELECT * FROM projects WHERE id = ?', [project_id], async (err, row) => {
      if (err) {
        console.error('Erreur lors de la vérification du projet:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la création du dépôt' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Projet non trouvé' });
      }
      
      try {
        // Si une URL est fournie, chercher d'abord si ce dépôt existe déjà
        if (url) {
          const repoId = gitService.generateRepoId(url);
          
          db.get('SELECT * FROM repositories WHERE id = ?', [repoId], async (err, existingRepo) => {
            if (err) {
              console.error('Erreur lors de la recherche du dépôt existant:', err.message);
              return res.status(500).json({ error: 'Erreur lors de la création du dépôt' });
            }
            
            let repoToUse: Repository;
            
            // Si le dépôt n'existe pas encore, le créer
            if (!existingRepo) {
              const now = new Date().toISOString();
              let local_path;
              
              try {
                // Cloner le dépôt
                local_path = await gitService.cloneRepository(url);
              } catch (error) {
                console.error('Erreur lors du clonage du dépôt:', error);
                return res.status(500).json({ 
                  error: `Erreur lors du clonage du dépôt: ${(error as Error).message || 'Erreur inconnue'}` 
                });
              }
              
              // Créer l'entrée du dépôt
              await new Promise<void>((resolve, reject) => {
                db.run(
                  'INSERT INTO repositories (id, name, url, local_path, branch_default, last_updated) VALUES (?, ?, ?, ?, ?, ?)',
                  [repoId, name, url, local_path, branch_default || 'main', now],
                  function(err) {
                    if (err) {
                      console.error('Erreur lors de la création du dépôt:', err.message);
                      reject(err);
                      return;
                    }
                    resolve();
                  }
                );
              });
              
              repoToUse = {
                id: repoId,
                name,
                url,
                local_path,
                branch_default: branch_default || 'main',
                last_updated: now
              };
            } else {
              // Utiliser le dépôt existant
              repoToUse = existingRepo as Repository;
            }
            
            // Créer le lien entre le projet et le dépôt
            const linkId = uuidv4();
            
            db.run(
              'INSERT INTO project_repositories (id, project_id, repository_id, branch_override, display_name) VALUES (?, ?, ?, ?, ?)',
              [linkId, project_id, repoToUse.id, branch_default || undefined, name],
              function(err) {
                if (err) {
                  console.error('Erreur lors de la liaison du dépôt au projet:', err.message);
                  return res.status(500).json({ error: 'Erreur lors de la liaison du dépôt au projet' });
                }
                
                const projectRepo: ProjectRepository = {
                  id: linkId,
                  project_id,
                  repository_id: repoToUse.id,
                  branch_override: branch_default,
                  display_name: name
                };
                
                return res.status(201).json({
                  ...repoToUse,
                  link_id: linkId,
                  branch_override: branch_default,
                  display_name: name
                });
              }
            );
          });
        } else {
          // Dépôt local sans URL
          const repoId = uuidv4();
          const now = new Date().toISOString();
          
          // Créer l'entrée du dépôt
          db.run(
            'INSERT INTO repositories (id, name, url, local_path, branch_default, last_updated) VALUES (?, ?, ?, ?, ?, ?)',
            [repoId, name, null, null, branch_default || 'main', now],
            function(err) {
              if (err) {
                console.error('Erreur lors de la création du dépôt:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la création du dépôt' });
              }
              
              // Créer le lien entre le projet et le dépôt
              const linkId = uuidv4();
              
              db.run(
                'INSERT INTO project_repositories (id, project_id, repository_id, branch_override, display_name) VALUES (?, ?, ?, ?, ?)',
                [linkId, project_id, repoId, branch_default || undefined, name],
                function(err) {
                  if (err) {
                    console.error('Erreur lors de la liaison du dépôt au projet:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la liaison du dépôt au projet' });
                  }
                  
                  const newRepository: Repository = {
                    id: repoId,
                    name,
                    url: null,
                    local_path: null,
                    branch_default: branch_default || 'main',
                    last_updated: now
                  };
                  
                  return res.status(201).json({
                    ...newRepository,
                    link_id: linkId,
                    branch_override: branch_default,
                    display_name: name
                  });
                }
              );
            }
          );
        }
      } catch (error) {
        console.error('Erreur lors de la création du dépôt:', error);
        return res.status(500).json({ 
          error: `Erreur lors de la création du dépôt: ${(error as Error).message || 'Erreur inconnue'}` 
        });
      }
    });
  } catch (error) {
    console.error('Erreur inattendue lors de la création du dépôt:', error);
    return res.status(500).json({ error: 'Erreur lors de la création du dépôt' });
  }
};

// Mettre à jour un dépôt
export const updateRepository = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, url, branch_default, branch_override, display_name } = req.body;
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
                'UPDATE repositories SET name = ?, branch_default = ? WHERE id = ?',
                [name, branch_default || typedRow.branch_default, id],
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
                    display_name: display_name || name
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
          'UPDATE repositories SET name = ?, branch_default = ? WHERE id = ?',
          [name, branch_default || repository.branch_default, id],
          function(err) {
            if (err) {
              console.error('Erreur lors de la mise à jour du dépôt:', err.message);
              return res.status(500).json({ error: 'Erreur lors de la mise à jour du dépôt' });
            }
            
            return res.status(200).json({
              ...repository,
              name,
              branch_default: branch_default || repository.branch_default
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
    const { username, platform, project_id } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    if (platform !== 'github' && platform !== 'gitlab') {
      return res.status(400).json({ error: 'Platform must be either "github" or "gitlab"' });
    }
    
    // Vérifier si le projet existe (si project_id est fourni)
    if (project_id) {
      const projectExists = await new Promise<boolean>((resolve) => {
        db.get('SELECT * FROM projects WHERE id = ?', [project_id], (err, row) => {
          if (err || !row) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
      
      if (!projectExists) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }
    
    // Récupérer les dépôts depuis l'API de la plateforme
    let repositories: Array<{ name: string, url: string }> = [];
    
    try {
      if (platform === 'github') {
        // Récupérer les dépôts GitHub
        const githubApiUrl = `https://api.github.com/users/${username}/repos`;
        const response = await fetch(githubApiUrl);
        
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        repositories = data.map((repo: any) => ({
          name: repo.name,
          url: repo.clone_url
        }));
      } else if (platform === 'gitlab') {
        // Récupérer les dépôts GitLab
        const gitlabApiUrl = `https://gitlab.com/api/v4/users/${username}/projects`;
        const response = await fetch(gitlabApiUrl);
        
        if (!response.ok) {
          throw new Error(`GitLab API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        repositories = data.map((repo: any) => ({
          name: repo.name,
          url: repo.http_url_to_repo
        }));
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération des dépôts depuis ${platform}:`, error);
      return res.status(500).json({ 
        error: `Erreur lors de la récupération des dépôts depuis ${platform}: ${(error as Error).message}` 
      });
    }
    
    if (repositories.length === 0) {
      return res.status(404).json({ 
        error: `Aucun dépôt public trouvé pour ${username} sur ${platform}` 
      });
    }
    
    // Créer/récupérer les dépôts et les associer au projet
    const results = [];
    
    for (const repo of repositories) {
      try {
        const repoId = gitService.generateRepoId(repo.url);
        
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
        
        let repoToUse: Repository;
        
        if (!existingRepo) {
          // Cloner le dépôt
          const local_path = await gitService.cloneRepository(repo.url);
          const now = new Date().toISOString();
          
          // Créer l'entrée du dépôt
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
        
        // Si un projet_id est fourni, créer la liaison
        if (project_id) {
          // Vérifier si la liaison existe déjà
          const linkExists = await new Promise<boolean>((resolve) => {
            db.get(
              'SELECT * FROM project_repositories WHERE project_id = ? AND repository_id = ?',
              [project_id, repoToUse.id],
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
                [linkId, project_id, repoToUse.id, repo.name],
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
        console.error(`Erreur lors de l'import du dépôt ${repo.name}:`, error);
        results.push({
          name: repo.name,
          url: repo.url,
          success: false,
          error: (error as Error).message
        });
      }
    }
    
    return res.status(200).json({
      message: `${results.filter(r => r.success).length} dépôts importés avec succès sur ${repositories.length} dépôts trouvés`,
      results
    });
    
  } catch (error) {
    console.error('Erreur inattendue lors de l\'import des dépôts:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'import des dépôts' });
  }
}; 