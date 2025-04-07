"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRenderStatus = exports.createRender = exports.updateConfig = exports.createConfig = exports.getConfigById = exports.getAllConfigs = void 0;
const database_1 = __importDefault(require("../models/database"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const gitService = __importStar(require("../services/gitService"));
const avatarService = __importStar(require("../services/avatarService"));
const execAsync = util_1.default.promisify(child_process_1.exec);
// Répertoire pour stocker les logs Gource et les rendus
const GOURCE_DIR = path_1.default.join(__dirname, '../../../data/gource');
const LOGS_DIR = path_1.default.join(GOURCE_DIR, 'logs');
const RENDERS_DIR = path_1.default.join(GOURCE_DIR, 'renders');
// S'assurer que les répertoires existent
[GOURCE_DIR, LOGS_DIR, RENDERS_DIR].forEach(dir => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
});
// Récupérer toutes les configurations Gource
const getAllConfigs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projectId = req.query.project_id;
        let query = 'SELECT * FROM gource_configs ORDER BY updated_at DESC';
        let params = [];
        if (projectId) {
            query = 'SELECT * FROM gource_configs WHERE project_id = ? ORDER BY updated_at DESC';
            params = [projectId];
        }
        database_1.default.all(query, params, (err, rows) => {
            if (err) {
                console.error('Erreur lors de la récupération des configurations Gource:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la récupération des configurations Gource' });
            }
            return res.status(200).json(rows);
        });
    }
    catch (error) {
        console.error('Erreur inattendue lors de la récupération des configurations Gource:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération des configurations Gource' });
    }
});
exports.getAllConfigs = getAllConfigs;
// Récupérer une configuration Gource par son ID
const getConfigById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        database_1.default.get('SELECT * FROM gource_configs WHERE id = ?', [id], (err, row) => {
            if (err) {
                console.error('Erreur lors de la récupération de la configuration Gource:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la récupération de la configuration Gource' });
            }
            if (!row) {
                return res.status(404).json({ error: 'Configuration Gource non trouvée' });
            }
            return res.status(200).json(row);
        });
    }
    catch (error) {
        console.error('Erreur inattendue lors de la récupération de la configuration Gource:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération de la configuration Gource' });
    }
});
exports.getConfigById = getConfigById;
// Créer une nouvelle configuration Gource
const createConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { project_id, speed, resolution, background_color, avatars_enabled, avatar_size, start_date, end_date, custom_options, download_avatars } = req.body;
        if (!project_id) {
            return res.status(400).json({ error: 'L\'ID du projet est requis' });
        }
        // Vérifier si le projet existe
        database_1.default.get('SELECT * FROM projects WHERE id = ?', [project_id], (err, row) => {
            if (err) {
                console.error('Erreur lors de la vérification du projet:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la création de la configuration Gource' });
            }
            if (!row) {
                return res.status(404).json({ error: 'Projet non trouvé' });
            }
            const id = (0, uuid_1.v4)();
            const now = new Date().toISOString();
            database_1.default.run(`INSERT INTO gource_configs (
          id, project_id, speed, resolution, background_color, 
          avatars_enabled, avatar_size, start_date, end_date, 
          custom_options, created_at, updated_at, download_avatars
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                id, project_id,
                speed || 1.0,
                resolution || '1280x720',
                background_color || '000000',
                avatars_enabled !== undefined ? avatars_enabled : true,
                avatar_size || 30,
                start_date || null,
                end_date || null,
                custom_options || '',
                now, now,
                download_avatars !== undefined ? download_avatars : true
            ], function (err) {
                if (err) {
                    console.error('Erreur lors de la création de la configuration Gource:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la création de la configuration Gource' });
                }
                const newConfig = {
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
                    updated_at: now,
                    download_avatars: download_avatars !== undefined ? download_avatars : true
                };
                return res.status(201).json(newConfig);
            });
        });
    }
    catch (error) {
        console.error('Erreur inattendue lors de la création de la configuration Gource:', error);
        return res.status(500).json({ error: 'Erreur lors de la création de la configuration Gource' });
    }
});
exports.createConfig = createConfig;
// Mettre à jour une configuration Gource
const updateConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { speed, resolution, background_color, avatars_enabled, avatar_size, start_date, end_date, custom_options, download_avatars } = req.body;
        // Vérifier si la configuration existe
        database_1.default.get('SELECT * FROM gource_configs WHERE id = ?', [id], (err, row) => {
            if (err) {
                console.error('Erreur lors de la vérification de la configuration Gource:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration Gource' });
            }
            if (!row) {
                return res.status(404).json({ error: 'Configuration Gource non trouvée' });
            }
            const now = new Date().toISOString();
            const config = row;
            // Mettre à jour seulement les champs fournis
            const updatedFields = {
                speed: speed !== undefined ? speed : config.speed,
                resolution: resolution !== undefined ? resolution : config.resolution,
                background_color: background_color !== undefined ? background_color : config.background_color,
                avatars_enabled: avatars_enabled !== undefined ? avatars_enabled : config.avatars_enabled,
                avatar_size: avatar_size !== undefined ? avatar_size : config.avatar_size,
                start_date: start_date !== undefined ? start_date : config.start_date,
                end_date: end_date !== undefined ? end_date : config.end_date,
                custom_options: custom_options !== undefined ? custom_options : config.custom_options,
                updated_at: now,
                download_avatars: download_avatars !== undefined ? download_avatars : config.download_avatars
            };
            database_1.default.run(`UPDATE gource_configs SET 
          speed = ?, 
          resolution = ?, 
          background_color = ?, 
          avatars_enabled = ?, 
          avatar_size = ?,
          start_date = ?,
          end_date = ?,
          custom_options = ?,
          updated_at = ?,
          download_avatars = ?
        WHERE id = ?`, [
                updatedFields.speed,
                updatedFields.resolution,
                updatedFields.background_color,
                updatedFields.avatars_enabled ? 1 : 0,
                updatedFields.avatar_size,
                updatedFields.start_date,
                updatedFields.end_date,
                updatedFields.custom_options,
                updatedFields.updated_at,
                updatedFields.download_avatars ? 1 : 0,
                id
            ], function (err) {
                if (err) {
                    console.error('Erreur lors de la mise à jour de la configuration Gource:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration Gource' });
                }
                const updatedConfig = Object.assign(Object.assign({}, config), updatedFields);
                return res.status(200).json(updatedConfig);
            });
        });
    }
    catch (error) {
        console.error('Erreur inattendue lors de la mise à jour de la configuration Gource:', error);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration Gource' });
    }
});
exports.updateConfig = updateConfig;
// Créer un nouveau rendu Gource
const createRender = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { config_id, output_format, quality } = req.body;
        if (!config_id) {
            return res.status(400).json({ error: 'L\'ID de configuration est requis' });
        }
        // Vérifier si la configuration existe
        database_1.default.get('SELECT * FROM gource_configs WHERE id = ?', [config_id], (err, configRow) => {
            if (err) {
                console.error('Erreur lors de la recherche de la configuration Gource:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la création du rendu Gource' });
            }
            if (!configRow) {
                return res.status(404).json({ error: 'Configuration Gource non trouvée' });
            }
            const config = configRow;
            // Récupérer les dépôts du projet
            database_1.default.all('SELECT * FROM repositories WHERE project_id = ?', [config.project_id], (err, repoRows) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    console.error('Erreur lors de la récupération des dépôts:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la création du rendu Gource' });
                }
                if (!repoRows || repoRows.length === 0) {
                    return res.status(400).json({ error: 'Le projet ne contient aucun dépôt' });
                }
                const id = (0, uuid_1.v4)();
                const now = new Date().toISOString();
                const format = output_format || 'mp4';
                const renderQuality = quality || 'medium';
                const outputFilename = `gource_${id}.${format}`;
                const outputPath = path_1.default.join(RENDERS_DIR, outputFilename);
                // Créer l'entrée de rendu avec le statut "pending"
                database_1.default.run(`INSERT INTO gource_renders (
            id, config_id, project_id, output_format, quality, 
            status, output_path, created_at, duration
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    id, config_id, config.project_id, format, renderQuality,
                    'pending', outputPath, now, 0
                ], function (err) {
                    if (err) {
                        console.error('Erreur lors de la création de l\'entrée de rendu:', err.message);
                        return res.status(500).json({ error: 'Erreur lors de la création du rendu Gource' });
                    }
                    const newRender = {
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
                });
            }));
        });
    }
    catch (error) {
        console.error('Erreur inattendue lors de la création du rendu Gource:', error);
        return res.status(500).json({ error: 'Erreur lors de la création du rendu Gource' });
    }
});
exports.createRender = createRender;
// Récupérer le statut d'un rendu
const getRenderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        database_1.default.get('SELECT * FROM gource_renders WHERE id = ?', [id], (err, row) => {
            if (err) {
                console.error('Erreur lors de la récupération du statut de rendu:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la récupération du statut de rendu' });
            }
            if (!row) {
                return res.status(404).json({ error: 'Rendu non trouvé' });
            }
            return res.status(200).json(row);
        });
    }
    catch (error) {
        console.error('Erreur inattendue lors de la récupération du statut de rendu:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération du statut de rendu' });
    }
});
exports.getRenderStatus = getRenderStatus;
// Fonction pour démarrer le processus de rendu en arrière-plan
function startRenderProcess(render, config, repositories) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Mettre à jour le statut à "processing"
            yield updateRenderStatus(render.id, 'processing');
            // Créer le fichier de mapping des avatars si les avatars sont activés
            let avatarMappingFile = '';
            if (config.avatars_enabled) {
                const avatarMappingPath = path_1.default.join(GOURCE_DIR, `avatar-mapping-${render.id}.txt`);
                try {
                    avatarMappingFile = yield avatarService.createGourceAvatarMapping(avatarMappingPath);
                    console.log(`Fichier de mapping des avatars créé: ${avatarMappingFile}`);
                }
                catch (error) {
                    console.warn('Erreur lors de la création du fichier de mapping des avatars:', error);
                }
            }
            // Générer les logs Gource pour chaque dépôt
            const logFiles = yield Promise.all(repositories.map((repo) => __awaiter(this, void 0, void 0, function* () {
                if (!repo.local_path)
                    return null;
                // Si les avatars sont activés et le téléchargement est activé, télécharger les avatars du dépôt
                if (config.avatars_enabled && config.download_avatars) {
                    try {
                        console.log(`Téléchargement des avatars pour le dépôt: ${repo.name}`);
                        const result = yield avatarService.downloadAvatarsForRepo(repo.local_path);
                        console.log(`Téléchargement des avatars terminé: ${result.success}/${result.total} avatars téléchargés`);
                    }
                    catch (error) {
                        console.warn(`Erreur lors du téléchargement des avatars pour ${repo.name}:`, error);
                    }
                }
                const logFile = path_1.default.join(LOGS_DIR, `${repo.id}_gource.log`);
                yield gitService.getGourceLogs(repo.local_path, logFile, repo.branch_override || repo.branch_default);
                return logFile;
            })));
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
                if (avatarMappingFile) {
                    gourceCmd += `--user-image-file "${avatarMappingFile}" `;
                }
                gourceCmd += `--user-scale ${config.avatar_size / 100} `;
            }
            else {
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
            yield execAsync(fullCmd);
            const endTime = Date.now();
            const duration = Math.round((endTime - startTime) / 1000);
            // Mettre à jour le statut et la durée
            yield updateRenderStatus(render.id, 'completed', duration);
        }
        catch (error) {
            console.error('Erreur pendant le processus de rendu:', error);
            yield updateRenderStatus(render.id, 'failed');
            throw error;
        }
    });
}
// Fonction pour mettre à jour le statut d'un rendu
function updateRenderStatus(renderId_1, status_1) {
    return __awaiter(this, arguments, void 0, function* (renderId, status, duration = 0) {
        return new Promise((resolve, reject) => {
            const updateFields = duration > 0
                ? `status = ?, duration = ?`
                : `status = ?`;
            const params = duration > 0
                ? [status, duration, renderId]
                : [status, renderId];
            database_1.default.run(`UPDATE gource_renders SET ${updateFields} WHERE id = ?`, params, function (err) {
                if (err) {
                    console.error('Erreur lors de la mise à jour du statut de rendu:', err.message);
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    });
}
