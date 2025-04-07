import { Request, Response } from 'express';
import db from '../models/database';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';
import * as gitService from '../services/gitService';

const execAsync = util.promisify(exec);

// Répertoire pour stocker les logs Gource et les rendus
const GOURCE_DIR = path.join(__dirname, '../../../data/gource');
const LOGS_DIR = path.join(GOURCE_DIR, 'logs');
const RENDERS_DIR = path.join(GOURCE_DIR, 'renders');

// S'assurer que les répertoires existent
[GOURCE_DIR, LOGS_DIR, RENDERS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

interface GourceConfig {
  id: string;
  project_id: string;
  speed: number;
  resolution: string;
  background_color: string;
  avatars_enabled: boolean;
  avatar_size: number;
  start_date?: string;
  end_date?: string;
  custom_options: string;
  created_at: string;
  updated_at: string;
}

interface GourceRender {
  id: string;
  config_id: string;
  project_id: string;
  output_format: string;
  quality: string;
  status: string;
  output_path: string;
  created_at: string;
  duration: number;
}

// Récupérer toutes les configurations Gource
export const getAllConfigs = async (req: Request, res: Response) => {
  try {
    const projectId = req.query.project_id as string;
    
    let query = 'SELECT * FROM gource_configs ORDER BY updated_at DESC';
    let params: any[] = [];
    
    if (projectId) {
      query = 'SELECT * FROM gource_configs WHERE project_id = ? ORDER BY updated_at DESC';
      params = [projectId];
    }
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Erreur lors de la récupération des configurations Gource:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la récupération des configurations Gource' });
      }
      
      return res.status(200).json(rows);
    });
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des configurations Gource:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des configurations Gource' });
  }
};

// Récupérer une configuration Gource par son ID
export const getConfigById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    db.get('SELECT * FROM gource_configs WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Erreur lors de la récupération de la configuration Gource:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la récupération de la configuration Gource' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Configuration Gource non trouvée' });
      }
      
      return res.status(200).json(row);
    });
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération de la configuration Gource:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération de la configuration Gource' });
  }
};

// Créer une nouvelle configuration Gource
export const createConfig = async (req: Request, res: Response) => {
  try {
    const { 
      project_id, 
      speed, 
      resolution, 
      background_color, 
      avatars_enabled, 
      avatar_size,
      start_date,
      end_date,
      custom_options
    } = req.body;
    
    if (!project_id) {
      return res.status(400).json({ error: 'L\'ID du projet est requis' });
    }
    
    // Vérifier si le projet existe
    db.get('SELECT * FROM projects WHERE id = ?', [project_id], (err, row) => {
      if (err) {
        console.error('Erreur lors de la vérification du projet:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la création de la configuration Gource' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Projet non trouvé' });
      }
      
      const id = uuidv4();
      const now = new Date().toISOString();
      
      db.run(
        `INSERT INTO gource_configs (
          id, project_id, speed, resolution, background_color, 
          avatars_enabled, avatar_size, start_date, end_date, 
          custom_options, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, project_id, 
          speed || 1.0, 
          resolution || '1280x720', 
          background_color || '000000',
          avatars_enabled !== undefined ? avatars_enabled : true,
          avatar_size || 30,
          start_date || null,
          end_date || null,
          custom_options || '',
          now, now
        ],
        function(err) {
          if (err) {
            console.error('Erreur lors de la création de la configuration Gource:', err.message);
            return res.status(500).json({ error: 'Erreur lors de la création de la configuration Gource' });
          }
          
          const newConfig: GourceConfig = {
            id,
            project_id,
            speed: speed || 1.0,
            resolution: resolution || '1280x720',
            background_color: background_color || '000000',
            avatars_enabled: avatars_enabled !== undefined ? avatars_enabled : true,
            avatar_size: avatar_size || 30,
            start_date: start_date || null,
            end_date: end_date || null,
            custom_options: custom_options || '',
            created_at: now,
            updated_at: now
          };
          
          return res.status(201).json(newConfig);
        }
      );
    });
  } catch (error) {
    console.error('Erreur inattendue lors de la création de la configuration Gource:', error);
    return res.status(500).json({ error: 'Erreur lors de la création de la configuration Gource' });
  }
};

// Mettre à jour une configuration Gource
export const updateConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      speed, 
      resolution, 
      background_color, 
      avatars_enabled, 
      avatar_size,
      start_date,
      end_date,
      custom_options
    } = req.body;
    
    // Vérifier si la configuration existe
    db.get('SELECT * FROM gource_configs WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Erreur lors de la recherche de la configuration Gource:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration Gource' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Configuration Gource non trouvée' });
      }
      
      const config = row as GourceConfig;
      const now = new Date().toISOString();
      
      db.run(
        `UPDATE gource_configs SET 
          speed = ?, resolution = ?, background_color = ?, 
          avatars_enabled = ?, avatar_size = ?, start_date = ?, 
          end_date = ?, custom_options = ?, updated_at = ? 
        WHERE id = ?`,
        [
          speed !== undefined ? speed : config.speed,
          resolution || config.resolution,
          background_color || config.background_color,
          avatars_enabled !== undefined ? avatars_enabled : config.avatars_enabled,
          avatar_size !== undefined ? avatar_size : config.avatar_size,
          start_date !== undefined ? start_date : config.start_date,
          end_date !== undefined ? end_date : config.end_date,
          custom_options !== undefined ? custom_options : config.custom_options,
          now,
          id
        ],
        function(err) {
          if (err) {
            console.error('Erreur lors de la mise à jour de la configuration Gource:', err.message);
            return res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration Gource' });
          }
          
          const updatedConfig: GourceConfig = {
            ...config,
            speed: speed !== undefined ? speed : config.speed,
            resolution: resolution || config.resolution,
            background_color: background_color || config.background_color,
            avatars_enabled: avatars_enabled !== undefined ? avatars_enabled : config.avatars_enabled,
            avatar_size: avatar_size !== undefined ? avatar_size : config.avatar_size,
            start_date: start_date !== undefined ? start_date : config.start_date,
            end_date: end_date !== undefined ? end_date : config.end_date,
            custom_options: custom_options !== undefined ? custom_options : config.custom_options,
            updated_at: now
          };
          
          return res.status(200).json(updatedConfig);
        }
      );
    });
  } catch (error) {
    console.error('Erreur inattendue lors de la mise à jour de la configuration Gource:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration Gource' });
  }
};

// Créer un nouveau rendu Gource
export const createRender = async (req: Request, res: Response) => {
  try {
    const { config_id, output_format, quality } = req.body;
    
    if (!config_id) {
      return res.status(400).json({ error: 'L\'ID de configuration est requis' });
    }
    
    // Vérifier si la configuration existe
    db.get('SELECT * FROM gource_configs WHERE id = ?', [config_id], (err, configRow) => {
      if (err) {
        console.error('Erreur lors de la recherche de la configuration Gource:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la création du rendu Gource' });
      }
      
      if (!configRow) {
        return res.status(404).json({ error: 'Configuration Gource non trouvée' });
      }
      
      const config = configRow as GourceConfig;
      
      // Récupérer les dépôts du projet
      db.all('SELECT * FROM repositories WHERE project_id = ?', [config.project_id], async (err, repoRows) => {
        if (err) {
          console.error('Erreur lors de la récupération des dépôts:', err.message);
          return res.status(500).json({ error: 'Erreur lors de la création du rendu Gource' });
        }
        
        if (!repoRows || repoRows.length === 0) {
          return res.status(400).json({ error: 'Le projet ne contient aucun dépôt' });
        }
        
        const id = uuidv4();
        const now = new Date().toISOString();
        const format = output_format || 'mp4';
        const renderQuality = quality || 'medium';
        const outputFilename = `gource_${id}.${format}`;
        const outputPath = path.join(RENDERS_DIR, outputFilename);
        
        // Créer l'entrée de rendu avec le statut "pending"
        db.run(
          `INSERT INTO gource_renders (
            id, config_id, project_id, output_format, quality, 
            status, output_path, created_at, duration
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, config_id, config.project_id, format, renderQuality,
            'pending', outputPath, now, 0
          ],
          function(err) {
            if (err) {
              console.error('Erreur lors de la création de l\'entrée de rendu:', err.message);
              return res.status(500).json({ error: 'Erreur lors de la création du rendu Gource' });
            }
            
            const newRender: GourceRender = {
              id,
              config_id,
              project_id: config.project_id,
              output_format: format,
              quality: renderQuality,
              status: 'pending',
              output_path: outputPath,
              created_at: now,
              duration: 0
            };
            
            // Démarrer le processus de rendu en arrière-plan
            startRenderProcess(newRender, config, repoRows)
              .catch(error => {
                console.error('Erreur lors du processus de rendu:', error);
                // Mettre à jour le statut en cas d'erreur
                updateRenderStatus(id, 'failed');
              });
            
            return res.status(201).json(newRender);
          }
        );
      });
    });
  } catch (error) {
    console.error('Erreur inattendue lors de la création du rendu Gource:', error);
    return res.status(500).json({ error: 'Erreur lors de la création du rendu Gource' });
  }
};

// Récupérer le statut d'un rendu
export const getRenderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    db.get('SELECT * FROM gource_renders WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Erreur lors de la récupération du statut de rendu:', err.message);
        return res.status(500).json({ error: 'Erreur lors de la récupération du statut de rendu' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Rendu non trouvé' });
      }
      
      return res.status(200).json(row);
    });
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération du statut de rendu:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération du statut de rendu' });
  }
};

// Fonction pour démarrer le processus de rendu en arrière-plan
async function startRenderProcess(render: GourceRender, config: GourceConfig, repositories: any[]) {
  try {
    // Mettre à jour le statut à "processing"
    await updateRenderStatus(render.id, 'processing');
    
    // Générer les logs Gource pour chaque dépôt
    const logFiles = await Promise.all(
      repositories.map(async (repo) => {
        if (!repo.local_path) return null;
        
        const logFile = path.join(LOGS_DIR, `${repo.id}_gource.log`);
        await gitService.getGourceLogs(repo.local_path, logFile);
        return logFile;
      })
    );
    
    // Filtrer les logs null (dépôts sans chemin local)
    const validLogFiles = logFiles.filter(log => log !== null);
    
    if (validLogFiles.length === 0) {
      throw new Error('Aucun log Gource valide n\'a pu être généré');
    }
    
    // Préparer les options de Gource
    const [width, height] = config.resolution.split('x');
    
    // Construire la commande Gource
    let gourceCmd = `gource --output-ppm-stream - `;
    
    // Ajouter les logs combinés
    validLogFiles.forEach(logFile => {
      gourceCmd += `--log-file "${logFile}" `;
    });
    
    // Ajouter les options de configuration
    gourceCmd += `--seconds-per-day ${config.speed} `;
    gourceCmd += `--viewport ${width}x${height} `;
    gourceCmd += `--background-colour ${config.background_color} `;
    
    if (config.avatars_enabled) {
      gourceCmd += `--user-image-dir "${path.join(GOURCE_DIR, 'avatars')}" `;
      gourceCmd += `--default-user-image "${path.join(GOURCE_DIR, 'avatars', 'default.png')}" `;
      gourceCmd += `--user-scale ${config.avatar_size / 100} `;
    } else {
      gourceCmd += `--disable-bloom `;
    }
    
    if (config.start_date) {
      const startTimestamp = new Date(config.start_date).getTime() / 1000;
      gourceCmd += `--start-position ${startTimestamp} `;
    }
    
    if (config.end_date) {
      const endTimestamp = new Date(config.end_date).getTime() / 1000;
      gourceCmd += `--stop-position ${endTimestamp} `;
    }
    
    // Ajouter les options personnalisées
    if (config.custom_options) {
      gourceCmd += `${config.custom_options} `;
    }
    
    // Options de qualité FFmpeg
    let ffmpegOptions = '';
    switch (render.quality) {
      case 'high':
        ffmpegOptions = '-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p';
        break;
      case 'medium':
        ffmpegOptions = '-c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p';
        break;
      case 'low':
        ffmpegOptions = '-c:v libx264 -preset fast -crf 28 -pix_fmt yuv420p';
        break;
      default:
        ffmpegOptions = '-c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p';
    }
    
    // Commande complète avec pipe vers FFmpeg
    const fullCmd = `${gourceCmd} | ffmpeg -y -f image2pipe -vcodec ppm -i - ${ffmpegOptions} "${render.output_path}"`;
    
    // Exécuter la commande
    const startTime = Date.now();
    await execAsync(fullCmd);
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    // Mettre à jour le statut et la durée
    await updateRenderStatus(render.id, 'completed', duration);
    
  } catch (error) {
    console.error('Erreur pendant le processus de rendu:', error);
    await updateRenderStatus(render.id, 'failed');
    throw error;
  }
}

// Fonction pour mettre à jour le statut d'un rendu
async function updateRenderStatus(renderId: string, status: string, duration: number = 0) {
  return new Promise<void>((resolve, reject) => {
    const updateFields = duration > 0 
      ? `status = ?, duration = ?` 
      : `status = ?`;
    const params = duration > 0 
      ? [status, duration, renderId] 
      : [status, renderId];
    
    db.run(
      `UPDATE gource_renders SET ${updateFields} WHERE id = ?`,
      params,
      function(err) {
        if (err) {
          console.error('Erreur lors de la mise à jour du statut de rendu:', err.message);
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
} 