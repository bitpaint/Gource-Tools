"use strict";
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
exports.deleteProject = exports.updateProject = exports.createProject = exports.getProjectById = exports.getAllProjects = void 0;
const database_1 = __importDefault(require("../models/database"));
const uuid_1 = require("uuid");
// Récupérer tous les projets
const getAllProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        database_1.default.all('SELECT * FROM projects ORDER BY last_modified DESC', (err, rows) => {
            if (err) {
                console.error('Erreur lors de la récupération des projets:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la récupération des projets' });
            }
            return res.status(200).json(rows);
        });
    }
    catch (error) {
        console.error('Erreur inattendue lors de la récupération des projets:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération des projets' });
    }
});
exports.getAllProjects = getAllProjects;
// Récupérer un projet par son ID
const getProjectById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        database_1.default.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
            if (err) {
                console.error('Erreur lors de la récupération du projet:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la récupération du projet' });
            }
            if (!row) {
                return res.status(404).json({ error: 'Projet non trouvé' });
            }
            return res.status(200).json(row);
        });
    }
    catch (error) {
        console.error('Erreur inattendue lors de la récupération du projet:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération du projet' });
    }
});
exports.getProjectById = getProjectById;
// Créer un nouveau projet
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Le nom du projet est requis' });
        }
        const id = (0, uuid_1.v4)();
        database_1.default.run('INSERT INTO projects (id, name, description) VALUES (?, ?, ?)', [id, name, description || null], function (err) {
            if (err) {
                console.error('Erreur lors de la création du projet:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la création du projet' });
            }
            const newProject = {
                id,
                name,
                description,
                last_modified: new Date().toISOString()
            };
            return res.status(201).json(newProject);
        });
    }
    catch (error) {
        console.error('Erreur inattendue lors de la création du projet:', error);
        return res.status(500).json({ error: 'Erreur lors de la création du projet' });
    }
});
exports.createProject = createProject;
// Mettre à jour un projet
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Le nom du projet est requis' });
        }
        // Vérifier si le projet existe
        database_1.default.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
            if (err) {
                console.error('Erreur lors de la recherche du projet:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la mise à jour du projet' });
            }
            if (!row) {
                return res.status(404).json({ error: 'Projet non trouvé' });
            }
            const now = new Date().toISOString();
            database_1.default.run('UPDATE projects SET name = ?, description = ?, last_modified = ? WHERE id = ?', [name, description || null, now, id], function (err) {
                if (err) {
                    console.error('Erreur lors de la mise à jour du projet:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la mise à jour du projet' });
                }
                const updatedProject = {
                    id,
                    name,
                    description,
                    last_modified: now
                };
                return res.status(200).json(updatedProject);
            });
        });
    }
    catch (error) {
        console.error('Erreur inattendue lors de la mise à jour du projet:', error);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du projet' });
    }
});
exports.updateProject = updateProject;
// Supprimer un projet
const deleteProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Vérifier si le projet existe
        database_1.default.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
            if (err) {
                console.error('Erreur lors de la recherche du projet:', err.message);
                return res.status(500).json({ error: 'Erreur lors de la suppression du projet' });
            }
            if (!row) {
                return res.status(404).json({ error: 'Projet non trouvé' });
            }
            database_1.default.run('DELETE FROM projects WHERE id = ?', [id], function (err) {
                if (err) {
                    console.error('Erreur lors de la suppression du projet:', err.message);
                    return res.status(500).json({ error: 'Erreur lors de la suppression du projet' });
                }
                return res.status(200).json({ message: 'Projet supprimé avec succès' });
            });
        });
    }
    catch (error) {
        console.error('Erreur inattendue lors de la suppression du projet:', error);
        return res.status(500).json({ error: 'Erreur lors de la suppression du projet' });
    }
});
exports.deleteProject = deleteProject;
