/**
 * Service de rendu Gource
 * Responsable de l'exécution et de la gestion du processus de rendu
 * Optimisé exclusivement pour Windows 11 Pro
 */

const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { convertToGourceArgs } = require('../../shared/gourceConfig');
const GourceConfigService = require('./GourceConfigService');
const RepositoryService = require('./repoService');
const ProjectService = require('./ProjectService');
const { v4: uuidv4 } = require('uuid');

class RenderService {
  constructor() {
    // Chemins
    this.dbPath = path.join(__dirname, '../../db/db.json');
    this.exportsDir = path.join(__dirname, '../../exports');
    this.tempDir = path.join(__dirname, '../../temp');
    this.logsDir = path.join(__dirname, '../../logs');
    
    // Créer les répertoires nécessaires s'ils n'existent pas
    this.createDirectories();
    this.init();
  }

  /**
   * Initialise la base de données
   */
  init() {
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const db = this.getDatabase();
    
    // Vérifier si la collection renders existe
    if (!db.has('renders').value()) {
      db.set('renders', []).write();
    }
  }

  /**
   * Crée les répertoires nécessaires
   */
  createDirectories() {
    const dirs = [this.exportsDir, this.tempDir, this.logsDir];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
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
   * Récupère tous les rendus
   * @returns {Array} Liste des rendus
   */
  getAllRenders() {
    const db = this.getDatabase();
    return db.get('renders').value() || [];
  }

  /**
   * Récupère un rendu par son ID
   * @param {string} id - ID du rendu à récupérer
   * @returns {Object|null} Rendu ou null si non trouvé
   */
  getRenderById(id) {
    if (!id) return null;
    
    const db = this.getDatabase();
    return db.get('renders')
      .find({ id: id.toString() })
      .value() || null;
  }

  /**
   * Met à jour le statut d'un rendu
   * @param {string} renderId - ID du rendu
   * @param {string} status - Nouveau statut
   * @param {string} message - Message optionnel
   * @param {number} progress - Progrès en pourcentage
   * @returns {Object|null} Rendu mis à jour ou null si non trouvé
   */
  updateRenderStatus(renderId, status, message = null, progress = null) {
    if (!renderId) return null;
    
    const db = this.getDatabase();
    const render = db.get('renders')
      .find({ id: renderId.toString() })
      .value();
    
    if (!render) return null;
    
    const updates = { status };
    
    if (message !== null) {
      updates.message = message;
    }
    
    if (progress !== null && !isNaN(progress)) {
      updates.progress = Math.min(Math.max(progress, 0), 100);
    }
    
    // Si le statut est 'completed' ou 'failed', ajouter la date de fin
    if (status === 'completed' || status === 'failed') {
      updates.endTime = new Date().toISOString();
    }
    
    // Mettre à jour le rendu dans la base de données
    db.get('renders')
      .find({ id: renderId.toString() })
      .assign(updates)
      .write();
    
    return db.get('renders')
      .find({ id: renderId.toString() })
      .value();
  }

  /**
   * Démarre un nouveau processus de rendu
   * @param {string} projectId - ID du projet à rendre
   * @param {string} customName - Nom personnalisé pour le rendu (optionnel)
   * @returns {Object} Information sur le rendu créé
   */
  async startRender(projectId, customName = null) {
    if (!projectId) {
      throw new Error('ID de projet requis');
    }
    
    // Récupérer les détails du projet
    const project = ProjectService.getProjectWithDetails(projectId);
    if (!project) {
      throw new Error('Projet non trouvé');
    }
    
    if (!project.repositories || project.repositories.length === 0 || !project.repositoryDetails || project.repositoryDetails.length === 0) {
      throw new Error('Le projet ne contient aucun dépôt valide');
    }
    
    // Générer un ID unique pour le rendu
    const id = Date.now().toString();
    
    // Générer le nom de fichier
    const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace('T', '_').slice(0, 19);
    const projectName = project.name.replace(/[\\/:*?"<>|]/g, '_');
    const fileName = customName
      ? `${customName.replace(/[\\/:*?"<>|]/g, '_')}_${timestamp}.mp4`
      : `${projectName}_${timestamp}.mp4`;
    
    const videoFilePath = path.join(this.exportsDir, fileName);
    const logFilePath = path.join(this.tempDir, `${id}.log`);
    
    // Créer l'enregistrement de rendu initial
    const render = {
      id,
      projectId,
      projectName: project.name,
      fileName,
      filePath: videoFilePath,
      status: 'preparing',
      progress: 0,
      message: 'Préparation du rendu...',
      startTime: new Date().toISOString(),
      endTime: null,
      error: null
    };
    
    // Ajouter le rendu à la base de données
    const db = this.getDatabase();
    db.get('renders')
      .push(render)
      .write();
    
    try {
      // Démarrer le processus de rendu de manière asynchrone
      this.processRender(render, project, logFilePath);
      
      return render;
    } catch (error) {
      // En cas d'erreur, mettre à jour le statut
      this.updateRenderStatus(id, 'failed', `Erreur lors du démarrage du rendu: ${error.message}`, 0);
      throw error;
    }
  }

  /**
   * Traite le rendu de manière asynchrone
   * @param {Object} render - Informations sur le rendu
   * @param {Object} project - Informations sur le projet
   * @param {string} logFilePath - Chemin du fichier de log
   */
  async processRender(render, project, logFilePath) {
    try {
      // Mise à jour du statut
      this.updateRenderStatus(render.id, 'preparing', 'Préparation des fichiers de log...', 5);
      
      // Générer les logs Git combinés
      await this.generateCombinedLogs(project.repositoryDetails, logFilePath, render);
      
      // Démarrer le rendu Gource
      await this.executeGourceRender(logFilePath, render.filePath, project.renderProfile.settings, render);
      
    } catch (error) {
      console.error('Erreur lors du processus de rendu:', error);
      this.updateRenderStatus(render.id, 'failed', `Erreur: ${error.message}`, 0);
    }
  }

  /**
   * Génère un fichier de log combiné à partir de plusieurs dépôts
   * @param {Array} repositories - Liste des dépôts
   * @param {string} outputLogFile - Chemin du fichier de log de sortie
   * @param {Object} render - Informations sur le rendu
   */
  async generateCombinedLogs(repositories, outputLogFile, render) {
    try {
      // Mise à jour du statut
      this.updateRenderStatus(render.id, 'preparing', 'Génération des logs Git...', 10);
      
      // Créer le fichier de log combiné
      if (fs.existsSync(outputLogFile)) {
        fs.unlinkSync(outputLogFile);
      }
      
      fs.writeFileSync(outputLogFile, '', 'utf8');
      
      let combinedLogEntries = [];
      let processedRepos = 0;
      const totalRepos = repositories.length;
      
      // Traiter chaque dépôt
      for (const repo of repositories) {
        try {
          // Mise à jour du statut
          const progress = 10 + Math.round((processedRepos / totalRepos) * 20);
          this.updateRenderStatus(
            render.id, 
            'preparing', 
            `Traitement du dépôt ${processedRepos + 1}/${totalRepos}: ${repo.name}...`, 
            progress
          );
          
          // Générer le log Git pour ce dépôt
          const repoLogFile = await RepositoryService.generateGitLog(repo.path);
          
          // Lire le contenu du log
          const logContent = fs.readFileSync(repoLogFile, 'utf8').split('\n');
          
          // Formater chaque ligne en ajoutant le nom du dépôt
          const formattedLog = logContent
            .filter(line => line.trim() !== '')
            .map(line => {
              const parts = line.split('|');
              if (parts.length >= 3) {
                return `${parts[0]}|${parts[1]}|${repo.name}/${parts[2] || ''}|${parts[3] || ''}`;
              }
              return null;
            })
            .filter(line => line !== null);
          
          // Ajouter aux entrées combinées
          combinedLogEntries = combinedLogEntries.concat(formattedLog);
          
          // Nettoyer le fichier temporaire
          if (fs.existsSync(repoLogFile)) {
            fs.unlinkSync(repoLogFile);
          }
          
          processedRepos++;
        } catch (error) {
          console.error(`Erreur lors du traitement du dépôt ${repo.name}:`, error);
          // Continuer avec les autres dépôts
        }
      }
      
      // Tri des entrées par timestamp
      combinedLogEntries.sort((a, b) => {
        const timestampA = parseInt(a.split('|')[0], 10);
        const timestampB = parseInt(b.split('|')[0], 10);
        return timestampA - timestampB;
      });
      
      // Écrire le log combiné dans le fichier
      fs.writeFileSync(outputLogFile, combinedLogEntries.join('\n'), 'utf8');
      
      // Vérifier que le fichier n'est pas vide
      if (combinedLogEntries.length === 0) {
        throw new Error('Aucune entrée de log valide générée pour les dépôts');
      }
      
      // Mise à jour du statut
      this.updateRenderStatus(render.id, 'prepared', 'Logs préparés avec succès', 30);
      
      return outputLogFile;
    } catch (error) {
      console.error('Erreur lors de la génération des logs combinés:', error);
      throw error;
    }
  }

  /**
   * Exécute le rendu Gource vers un fichier vidéo
   * Optimisé exclusivement pour Windows 11 Pro
   * @param {string} logFilePath - Chemin du fichier de log
   * @param {string} outputFilePath - Chemin du fichier vidéo de sortie
   * @param {Object} settings - Paramètres de configuration Gource
   * @param {Object} render - Informations sur le rendu
   */
  async executeGourceRender(logFilePath, outputFilePath, settings, render) {
    try {
      // Mise à jour du statut
      this.updateRenderStatus(render.id, 'rendering', 'Démarrage du rendu Gource...', 35);
      
      // Créer le fichier de config Gource temporaire
      const tempConfigPath = path.join(this.tempDir, `gource_config_${render.id}.txt`);
      
      // Convertir les paramètres en arguments de ligne de commande
      const gourceArgs = convertToGourceArgs(settings);
      
      // Créer le fichier temporaire
      fs.writeFileSync(tempConfigPath, gourceArgs, 'utf8');
      
      // Déterminer la résolution
      const resolution = settings.resolution || '1920x1080';
      const framerate = settings.framerate || 60;
      
      // Créer le répertoire temporaire pour le pipe
      const pipePath = path.join(this.tempDir, `gource_pipe_${render.id}`);
      if (fs.existsSync(pipePath)) {
        try {
          fs.unlinkSync(pipePath);
        } catch (err) {
          console.warn(`Impossible de supprimer le fichier de pipe existant: ${err.message}`);
        }
      }
      
      // Générer le script PowerShell pour le rendu
      const powerShellScriptPath = path.join(this.tempDir, `render_script_${render.id}.ps1`);
      
      const scriptContent = `
# Script de rendu Gource optimisé pour Windows 11 Pro
$ErrorActionPreference = "Stop"

# Chemins des fichiers
$logFile = "${logFilePath.replace(/\\/g, '\\\\')}"
$pipeFile = "${pipePath.replace(/\\/g, '\\\\')}"
$outputFile = "${outputFilePath.replace(/\\/g, '\\\\')}"
$configFile = "${tempConfigPath.replace(/\\/g, '\\\\')}"

# Lire les arguments Gource depuis le fichier de config
$gourceArgs = Get-Content -Path $configFile

# Vérifier l'existence du log
if (-not (Test-Path $logFile)) {
    Write-Error "Fichier de log non trouvé: $logFile"
    exit 1
}

# Créer le pipe nommé si non existant
if (-not (Test-Path $pipeFile)) {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $pipeFile) | Out-Null
    $null = New-Item -ItemType File -Path $pipeFile -Force
}

# Construire la commande Gource
$gourceCmd = "gource --log-format custom $logFile --output-custom-log - $gourceArgs --output-ppm-stream - > $pipeFile"

# Construire la commande ffmpeg
$resolution = "${resolution}"
$framerate = ${framerate}
$ffmpegCmd = "ffmpeg -y -r $framerate -f image2pipe -vcodec ppm -i $pipeFile -vcodec libx264 -preset fast -pix_fmt yuv420p -crf 22 -threads 0 -bf 0 \`"$outputFile\`""

# Exécuter Gource et ffmpeg en parallèle
Write-Host "Démarrage du rendu Gource..."
$gourceProcess = Start-Process -FilePath "powershell" -ArgumentList "-Command", $gourceCmd -PassThru -NoNewWindow

Start-Sleep -Seconds 2

# Démarrer ffmpeg après que Gource ait commencé à générer des images
Write-Host "Démarrage de l'encodage ffmpeg..."
$ffmpegProcess = Start-Process -FilePath "powershell" -ArgumentList "-Command", $ffmpegCmd -PassThru -NoNewWindow

# Attendre que les processus terminent
Write-Host "Processus en cours..."
$gourceProcess.WaitForExit()
$gourceExitCode = $gourceProcess.ExitCode

$ffmpegProcess.WaitForExit()
$ffmpegExitCode = $ffmpegProcess.ExitCode

Write-Host "Gource exit code: $gourceExitCode"
Write-Host "ffmpeg exit code: $ffmpegExitCode"

# Nettoyer les fichiers temporaires
Remove-Item -Path $pipeFile -Force -ErrorAction SilentlyContinue
Remove-Item -Path $configFile -Force -ErrorAction SilentlyContinue

if ($gourceExitCode -ne 0 -or $ffmpegExitCode -ne 0) {
    Write-Error "Erreur durant le rendu. Gource: $gourceExitCode, ffmpeg: $ffmpegExitCode"
    exit 1
}

Write-Host "Rendu terminé avec succès!"
exit 0
`;
      
      // Écrire le script PowerShell
      fs.writeFileSync(powerShellScriptPath, scriptContent, 'utf8');
      
      // Mise à jour du statut
      this.updateRenderStatus(render.id, 'rendering', 'Exécution du processus de rendu...', 40);
      
      // Exécuter le script PowerShell
      const logOutputStream = fs.createWriteStream(path.join(this.logsDir, `render_${render.id}.log`));
      
      // Lance PowerShell avec le script
      const psProcess = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', powerShellScriptPath], {
        stdio: 'pipe',
        detached: true
      });
      
      // Redirection des flux
      psProcess.stdout.pipe(logOutputStream);
      psProcess.stderr.pipe(logOutputStream);
      
      // Mettre périodiquement à jour le statut du rendu
      const statusUpdater = setInterval(() => {
        if (fs.existsSync(outputFilePath)) {
          try {
            const stats = fs.statSync(outputFilePath);
            if (stats.size > 0) {
              // Calculer la progression basée sur le temps écoulé (estimation)
              const currentTime = new Date();
              const startTime = new Date(render.startTime);
              const elapsedSeconds = (currentTime - startTime) / 1000;
              
              // Estimer la progression (max 95% jusqu'à ce que le rendu soit terminé)
              const estimatedProgress = Math.min(40 + (elapsedSeconds / 3), 95);
              
              this.updateRenderStatus(render.id, 'rendering', 'Rendu en cours...', estimatedProgress);
            }
          } catch (error) {
            console.error('Erreur lors de la vérification du fichier de sortie:', error);
          }
        }
      }, 5000); // Mise à jour toutes les 5 secondes
      
      // Attendre la fin du processus
      return new Promise((resolve, reject) => {
        psProcess.on('exit', (code) => {
          clearInterval(statusUpdater);
          
          if (code === 0) {
            // Rendu réussi
            this.updateRenderStatus(render.id, 'completed', 'Rendu terminé avec succès', 100);
            resolve();
          } else {
            // Erreur lors du rendu
            const errorMsg = `Erreur lors du rendu (code ${code})`;
            this.updateRenderStatus(render.id, 'failed', errorMsg, 0);
            reject(new Error(errorMsg));
          }
          
          // Nettoyage des fichiers temporaires
          try {
            if (fs.existsSync(powerShellScriptPath)) {
              fs.unlinkSync(powerShellScriptPath);
            }
            if (fs.existsSync(tempConfigPath)) {
              fs.unlinkSync(tempConfigPath);
            }
            if (fs.existsSync(pipePath)) {
              fs.unlinkSync(pipePath);
            }
          } catch (error) {
            console.error('Erreur lors du nettoyage des fichiers temporaires:', error);
          }
        });
        
        psProcess.on('error', (error) => {
          clearInterval(statusUpdater);
          const errorMsg = `Erreur lors du lancement du processus: ${error.message}`;
          this.updateRenderStatus(render.id, 'failed', errorMsg, 0);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Erreur lors de l\'exécution du rendu Gource:', error);
      this.updateRenderStatus(render.id, 'failed', `Erreur: ${error.message}`, 0);
      throw error;
    }
  }

  /**
   * Supprime un rendu et son fichier vidéo associé
   * @param {string} id - ID du rendu à supprimer
   * @returns {boolean} true si supprimé, false sinon
   */
  deleteRender(id) {
    if (!id) return false;
    
    const db = this.getDatabase();
    const render = db.get('renders')
      .find({ id: id.toString() })
      .value();
    
    if (!render) return false;
    
    // Supprimer le fichier vidéo si existant
    if (render.filePath && fs.existsSync(render.filePath)) {
      try {
        fs.unlinkSync(render.filePath);
      } catch (error) {
        console.error(`Erreur lors de la suppression du fichier ${render.filePath}:`, error);
        // Continuer même si le fichier ne peut pas être supprimé
      }
    }
    
    // Supprimer les fichiers de log associés
    const logFile = path.join(this.logsDir, `render_${id}.log`);
    if (fs.existsSync(logFile)) {
      try {
        fs.unlinkSync(logFile);
      } catch (error) {
        console.error(`Erreur lors de la suppression du log ${logFile}:`, error);
      }
    }
    
    // Supprimer l'enregistrement de la base de données
    db.get('renders')
      .remove({ id: id.toString() })
      .write();
    
    return true;
  }
}

module.exports = new RenderService(); 
      .write();
    
    return true;
  }
}

module.exports = new RenderService(); 
 * Service de rendu Gource
 * Responsable de l'exécution et de la gestion du processus de rendu
 * Optimisé exclusivement pour Windows 11 Pro
 */

const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { convertToGourceArgs } = require('../../shared/gourceConfig');
const GourceConfigService = require('./GourceConfigService');
const RepositoryService = require('./RepositoryService');
const ProjectService = require('./ProjectService');

class RenderService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../../db/db.json');
    this.exportsDir = path.join(__dirname, '../../../exports');
    this.tempDir = path.join(__dirname, '../../../temp');
    this.logsDir = path.join(__dirname, '../../../logs');
    
    // Créer les répertoires nécessaires s'ils n'existent pas
    this.createDirectories();
    this.init();
  }

  /**
   * Initialise la base de données
   */
  init() {
    const db = this.getDatabase();
    
    // Vérifier si la collection renders existe
    if (!db.has('renders').value()) {
      db.set('renders', []).write();
    }
  }

  /**
   * Crée les répertoires nécessaires
   */
  createDirectories() {
    const dirs = [this.exportsDir, this.tempDir, this.logsDir];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
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
   * Récupère tous les rendus
   * @returns {Array} Liste des rendus
   */
  getAllRenders() {
    const db = this.getDatabase();
    return db.get('renders').value() || [];
  }

  /**
   * Récupère un rendu par son ID
   * @param {string} id - ID du rendu à récupérer
   * @returns {Object|null} Rendu ou null si non trouvé
   */
  getRenderById(id) {
    if (!id) return null;
    
    const db = this.getDatabase();
    return db.get('renders')
      .find({ id: id.toString() })
      .value() || null;
  }

  /**
   * Met à jour le statut d'un rendu
   * @param {string} renderId - ID du rendu
   * @param {string} status - Nouveau statut
   * @param {string} message - Message optionnel
   * @param {number} progress - Progrès en pourcentage
   * @returns {Object|null} Rendu mis à jour ou null si non trouvé
   */
  updateRenderStatus(renderId, status, message = null, progress = null) {
    if (!renderId) return null;
    
    const db = this.getDatabase();
    const render = db.get('renders')
      .find({ id: renderId.toString() })
      .value();
    
    if (!render) return null;
    
    const updates = { status };
    
    if (message !== null) {
      updates.message = message;
    }
    
    if (progress !== null && !isNaN(progress)) {
      updates.progress = Math.min(Math.max(progress, 0), 100);
    }
    
    // Si le statut est 'completed' ou 'failed', ajouter la date de fin
    if (status === 'completed' || status === 'failed') {
      updates.endTime = new Date().toISOString();
    }
    
    // Mettre à jour le rendu dans la base de données
    db.get('renders')
      .find({ id: renderId.toString() })
      .assign(updates)
      .write();
    
    return db.get('renders')
      .find({ id: renderId.toString() })
      .value();
  }

  /**
   * Démarre un nouveau processus de rendu
   * @param {string} projectId - ID du projet à rendre
   * @param {string} customName - Nom personnalisé pour le rendu (optionnel)
   * @returns {Object} Information sur le rendu créé
   */
  async startRender(projectId, customName = null) {
    if (!projectId) {
      throw new Error('ID de projet requis');
    }
    
    // Récupérer les détails du projet
    const project = ProjectService.getProjectWithDetails(projectId);
    if (!project) {
      throw new Error('Projet non trouvé');
    }
    
    if (!project.repositories || project.repositories.length === 0 || !project.repositoryDetails || project.repositoryDetails.length === 0) {
      throw new Error('Le projet ne contient aucun dépôt valide');
    }
    
    // Générer un ID unique pour le rendu
    const id = Date.now().toString();
    
    // Générer le nom de fichier
    const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace('T', '_').slice(0, 19);
    const projectName = project.name.replace(/[\\/:*?"<>|]/g, '_');
    const fileName = customName
      ? `${customName.replace(/[\\/:*?"<>|]/g, '_')}_${timestamp}.mp4`
      : `${projectName}_${timestamp}.mp4`;
    
    const videoFilePath = path.join(this.exportsDir, fileName);
    const logFilePath = path.join(this.tempDir, `${id}.log`);
    
    // Créer l'enregistrement de rendu initial
    const render = {
      id,
      projectId,
      projectName: project.name,
      fileName,
      filePath: videoFilePath,
      status: 'preparing',
      progress: 0,
      message: 'Préparation du rendu...',
      startTime: new Date().toISOString(),
      endTime: null,
      error: null
    };
    
    // Ajouter le rendu à la base de données
    const db = this.getDatabase();
    db.get('renders')
      .push(render)
      .write();
    
    try {
      // Démarrer le processus de rendu de manière asynchrone
      this.processRender(render, project, logFilePath);
      
      return render;
    } catch (error) {
      // En cas d'erreur, mettre à jour le statut
      this.updateRenderStatus(id, 'failed', `Erreur lors du démarrage du rendu: ${error.message}`, 0);
      throw error;
    }
  }

  /**
   * Traite le rendu de manière asynchrone
   * @param {Object} render - Informations sur le rendu
   * @param {Object} project - Informations sur le projet
   * @param {string} logFilePath - Chemin du fichier de log
   */
  async processRender(render, project, logFilePath) {
    try {
      // Mise à jour du statut
      this.updateRenderStatus(render.id, 'preparing', 'Préparation des fichiers de log...', 5);
      
      // Générer les logs Git combinés
      await this.generateCombinedLogs(project.repositoryDetails, logFilePath, render);
      
      // Démarrer le rendu Gource
      await this.executeGourceRender(logFilePath, render.filePath, project.renderProfile.settings, render);
      
    } catch (error) {
      console.error('Erreur lors du processus de rendu:', error);
      this.updateRenderStatus(render.id, 'failed', `Erreur: ${error.message}`, 0);
    }
  }

  /**
   * Génère un fichier de log combiné à partir de plusieurs dépôts
   * @param {Array} repositories - Liste des dépôts
   * @param {string} outputLogFile - Chemin du fichier de log de sortie
   * @param {Object} render - Informations sur le rendu
   */
  async generateCombinedLogs(repositories, outputLogFile, render) {
    try {
      // Mise à jour du statut
      this.updateRenderStatus(render.id, 'preparing', 'Génération des logs Git...', 10);
      
      // Créer le fichier de log combiné
      if (fs.existsSync(outputLogFile)) {
        fs.unlinkSync(outputLogFile);
      }
      
      fs.writeFileSync(outputLogFile, '', 'utf8');
      
      let combinedLogEntries = [];
      let processedRepos = 0;
      const totalRepos = repositories.length;
      
      // Traiter chaque dépôt
      for (const repo of repositories) {
        try {
          // Mise à jour du statut
          const progress = 10 + Math.round((processedRepos / totalRepos) * 20);
          this.updateRenderStatus(
            render.id, 
            'preparing', 
            `Traitement du dépôt ${processedRepos + 1}/${totalRepos}: ${repo.name}...`, 
            progress
          );
          
          // Générer le log Git pour ce dépôt
          const repoLogFile = await RepositoryService.generateGitLog(repo.path);
          
          // Lire le contenu du log
          const logContent = fs.readFileSync(repoLogFile, 'utf8').split('\n');
          
          // Formater chaque ligne en ajoutant le nom du dépôt
          const formattedLog = logContent
            .filter(line => line.trim() !== '')
            .map(line => {
              const parts = line.split('|');
              if (parts.length >= 3) {
                return `${parts[0]}|${parts[1]}|${repo.name}/${parts[2] || ''}|${parts[3] || ''}`;
              }
              return null;
            })
            .filter(line => line !== null);
          
          // Ajouter aux entrées combinées
          combinedLogEntries = combinedLogEntries.concat(formattedLog);
          
          // Nettoyer le fichier temporaire
          if (fs.existsSync(repoLogFile)) {
            fs.unlinkSync(repoLogFile);
          }
          
          processedRepos++;
        } catch (error) {
          console.error(`Erreur lors du traitement du dépôt ${repo.name}:`, error);
          // Continuer avec les autres dépôts
        }
      }
      
      // Tri des entrées par timestamp
      combinedLogEntries.sort((a, b) => {
        const timestampA = parseInt(a.split('|')[0], 10);
        const timestampB = parseInt(b.split('|')[0], 10);
        return timestampA - timestampB;
      });
      
      // Écrire le log combiné dans le fichier
      fs.writeFileSync(outputLogFile, combinedLogEntries.join('\n'), 'utf8');
      
      // Vérifier que le fichier n'est pas vide
      if (combinedLogEntries.length === 0) {
        throw new Error('Aucune entrée de log valide générée pour les dépôts');
      }
      
      // Mise à jour du statut
      this.updateRenderStatus(render.id, 'prepared', 'Logs préparés avec succès', 30);
      
      return outputLogFile;
    } catch (error) {
      console.error('Erreur lors de la génération des logs combinés:', error);
      throw error;
    }
  }

  /**
   * Exécute le rendu Gource vers un fichier vidéo
   * Optimisé exclusivement pour Windows 11 Pro
   * @param {string} logFilePath - Chemin du fichier de log
   * @param {string} outputFilePath - Chemin du fichier vidéo de sortie
   * @param {Object} settings - Paramètres de configuration Gource
   * @param {Object} render - Informations sur le rendu
   */
  async executeGourceRender(logFilePath, outputFilePath, settings, render) {
    try {
      // Mise à jour du statut
      this.updateRenderStatus(render.id, 'rendering', 'Démarrage du rendu Gource...', 35);
      
      // Créer le fichier de config Gource temporaire
      const tempConfigPath = path.join(this.tempDir, `gource_config_${render.id}.txt`);
      
      // Convertir les paramètres en arguments de ligne de commande
      const gourceArgs = convertToGourceArgs(settings);
      
      // Créer le fichier temporaire
      fs.writeFileSync(tempConfigPath, gourceArgs, 'utf8');
      
      // Déterminer la résolution
      const resolution = settings.resolution || '1920x1080';
      const framerate = settings.framerate || 60;
      
      // Créer le répertoire temporaire pour le pipe
      const pipePath = path.join(this.tempDir, `gource_pipe_${render.id}`);
      if (fs.existsSync(pipePath)) {
        try {
          fs.unlinkSync(pipePath);
        } catch (err) {
          console.warn(`Impossible de supprimer le fichier de pipe existant: ${err.message}`);
        }
      }
      
      // Générer le script PowerShell pour le rendu
      const powerShellScriptPath = path.join(this.tempDir, `render_script_${render.id}.ps1`);
      
      const scriptContent = `
# Script de rendu Gource optimisé pour Windows 11 Pro
$ErrorActionPreference = "Stop"

# Chemins des fichiers
$logFile = "${logFilePath.replace(/\\/g, '\\\\')}"
$pipeFile = "${pipePath.replace(/\\/g, '\\\\')}"
$outputFile = "${outputFilePath.replace(/\\/g, '\\\\')}"
$configFile = "${tempConfigPath.replace(/\\/g, '\\\\')}"

# Lire les arguments Gource depuis le fichier de config
$gourceArgs = Get-Content -Path $configFile

# Vérifier l'existence du log
if (-not (Test-Path $logFile)) {
    Write-Error "Fichier de log non trouvé: $logFile"
    exit 1
}

# Créer le pipe nommé si non existant
if (-not (Test-Path $pipeFile)) {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $pipeFile) | Out-Null
    $null = New-Item -ItemType File -Path $pipeFile -Force
}

# Construire la commande Gource
$gourceCmd = "gource --log-format custom $logFile --output-custom-log - $gourceArgs --output-ppm-stream - > $pipeFile"

# Construire la commande ffmpeg
$resolution = "${resolution}"
$framerate = ${framerate}
$ffmpegCmd = "ffmpeg -y -r $framerate -f image2pipe -vcodec ppm -i $pipeFile -vcodec libx264 -preset fast -pix_fmt yuv420p -crf 22 -threads 0 -bf 0 \`"$outputFile\`""

# Exécuter Gource et ffmpeg en parallèle
Write-Host "Démarrage du rendu Gource..."
$gourceProcess = Start-Process -FilePath "powershell" -ArgumentList "-Command", $gourceCmd -PassThru -NoNewWindow

Start-Sleep -Seconds 2

# Démarrer ffmpeg après que Gource ait commencé à générer des images
Write-Host "Démarrage de l'encodage ffmpeg..."
$ffmpegProcess = Start-Process -FilePath "powershell" -ArgumentList "-Command", $ffmpegCmd -PassThru -NoNewWindow

# Attendre que les processus terminent
Write-Host "Processus en cours..."
$gourceProcess.WaitForExit()
$gourceExitCode = $gourceProcess.ExitCode

$ffmpegProcess.WaitForExit()
$ffmpegExitCode = $ffmpegProcess.ExitCode

Write-Host "Gource exit code: $gourceExitCode"
Write-Host "ffmpeg exit code: $ffmpegExitCode"

# Nettoyer les fichiers temporaires
Remove-Item -Path $pipeFile -Force -ErrorAction SilentlyContinue
Remove-Item -Path $configFile -Force -ErrorAction SilentlyContinue

if ($gourceExitCode -ne 0 -or $ffmpegExitCode -ne 0) {
    Write-Error "Erreur durant le rendu. Gource: $gourceExitCode, ffmpeg: $ffmpegExitCode"
    exit 1
}

Write-Host "Rendu terminé avec succès!"
exit 0
`;
      
      // Écrire le script PowerShell
      fs.writeFileSync(powerShellScriptPath, scriptContent, 'utf8');
      
      // Mise à jour du statut
      this.updateRenderStatus(render.id, 'rendering', 'Exécution du processus de rendu...', 40);
      
      // Exécuter le script PowerShell
      const logOutputStream = fs.createWriteStream(path.join(this.logsDir, `render_${render.id}.log`));
      
      // Lance PowerShell avec le script
      const psProcess = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', powerShellScriptPath], {
        stdio: 'pipe',
        detached: true
      });
      
      // Redirection des flux
      psProcess.stdout.pipe(logOutputStream);
      psProcess.stderr.pipe(logOutputStream);
      
      // Mettre périodiquement à jour le statut du rendu
      const statusUpdater = setInterval(() => {
        if (fs.existsSync(outputFilePath)) {
          try {
            const stats = fs.statSync(outputFilePath);
            if (stats.size > 0) {
              // Calculer la progression basée sur le temps écoulé (estimation)
              const currentTime = new Date();
              const startTime = new Date(render.startTime);
              const elapsedSeconds = (currentTime - startTime) / 1000;
              
              // Estimer la progression (max 95% jusqu'à ce que le rendu soit terminé)
              const estimatedProgress = Math.min(40 + (elapsedSeconds / 3), 95);
              
              this.updateRenderStatus(render.id, 'rendering', 'Rendu en cours...', estimatedProgress);
            }
          } catch (error) {
            console.error('Erreur lors de la vérification du fichier de sortie:', error);
          }
        }
      }, 5000); // Mise à jour toutes les 5 secondes
      
      // Attendre la fin du processus
      return new Promise((resolve, reject) => {
        psProcess.on('exit', (code) => {
          clearInterval(statusUpdater);
          
          if (code === 0) {
            // Rendu réussi
            this.updateRenderStatus(render.id, 'completed', 'Rendu terminé avec succès', 100);
            resolve();
          } else {
            // Erreur lors du rendu
            const errorMsg = `Erreur lors du rendu (code ${code})`;
            this.updateRenderStatus(render.id, 'failed', errorMsg, 0);
            reject(new Error(errorMsg));
          }
          
          // Nettoyage des fichiers temporaires
          try {
            if (fs.existsSync(powerShellScriptPath)) {
              fs.unlinkSync(powerShellScriptPath);
            }
            if (fs.existsSync(tempConfigPath)) {
              fs.unlinkSync(tempConfigPath);
            }
            if (fs.existsSync(pipePath)) {
              fs.unlinkSync(pipePath);
            }
          } catch (error) {
            console.error('Erreur lors du nettoyage des fichiers temporaires:', error);
          }
        });
        
        psProcess.on('error', (error) => {
          clearInterval(statusUpdater);
          const errorMsg = `Erreur lors du lancement du processus: ${error.message}`;
          this.updateRenderStatus(render.id, 'failed', errorMsg, 0);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Erreur lors de l\'exécution du rendu Gource:', error);
      this.updateRenderStatus(render.id, 'failed', `Erreur: ${error.message}`, 0);
      throw error;
    }
  }

  /**
   * Supprime un rendu et son fichier vidéo associé
   * @param {string} id - ID du rendu à supprimer
   * @returns {boolean} true si supprimé, false sinon
   */
  deleteRender(id) {
    if (!id) return false;
    
    const db = this.getDatabase();
    const render = db.get('renders')
      .find({ id: id.toString() })
      .value();
    
    if (!render) return false;
    
    // Supprimer le fichier vidéo si existant
    if (render.filePath && fs.existsSync(render.filePath)) {
      try {
        fs.unlinkSync(render.filePath);
      } catch (error) {
        console.error(`Erreur lors de la suppression du fichier ${render.filePath}:`, error);
        // Continuer même si le fichier ne peut pas être supprimé
      }
    }
    
    // Supprimer les fichiers de log associés
    const logFile = path.join(this.logsDir, `render_${id}.log`);
    if (fs.existsSync(logFile)) {
      try {
        fs.unlinkSync(logFile);
      } catch (error) {
        console.error(`Erreur lors de la suppression du log ${logFile}:`, error);
      }
    }
    
    // Supprimer l'enregistrement de la base de données
    db.get('renders')
      .remove({ id: id.toString() })
      .write();
    
    return true;
  }
}

module.exports = new RenderService(); 