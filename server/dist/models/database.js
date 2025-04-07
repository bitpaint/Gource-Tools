"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure data directory exists
const dataDir = path_1.default.join(__dirname, '../../../data');
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
// Initialize database
const dbPath = path_1.default.join(dataDir, 'gource-tools.db');
const db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    }
    else {
        console.log('Connected to SQLite database');
        initializeTables();
    }
});
// Create tables if they don't exist
function initializeTables() {
    db.serialize(() => {
        // Projects table
        db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Repositories table (independent of projects)
        db.run(`
      CREATE TABLE IF NOT EXISTS repositories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT,
        local_path TEXT,
        branch_default TEXT DEFAULT 'main',
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        username TEXT,
        topics TEXT
      )
    `);
        // Project-Repositories linking table
        db.run(`
      CREATE TABLE IF NOT EXISTS project_repositories (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        repository_id TEXT NOT NULL,
        branch_override TEXT,
        display_name TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        FOREIGN KEY (repository_id) REFERENCES repositories (id) ON DELETE CASCADE,
        UNIQUE(project_id, repository_id)
      )
    `);
        // Gource configurations table
        db.run(`
      CREATE TABLE IF NOT EXISTS gource_configs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        speed REAL DEFAULT 1.0,
        resolution TEXT DEFAULT '1280x720',
        background_color TEXT DEFAULT '000000',
        avatars_enabled INTEGER DEFAULT 1,
        avatar_size INTEGER DEFAULT 30,
        start_date TEXT,
        end_date TEXT,
        custom_options TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        download_avatars INTEGER DEFAULT 1,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `);
        // Gource renders table
        db.run(`
      CREATE TABLE IF NOT EXISTS gource_renders (
        id TEXT PRIMARY KEY,
        config_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        output_format TEXT NOT NULL,
        quality TEXT NOT NULL,
        status TEXT NOT NULL,
        output_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        duration INTEGER DEFAULT 0,
        FOREIGN KEY (config_id) REFERENCES gource_configs (id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `);
        // Avatars table
        db.run(`
      CREATE TABLE IF NOT EXISTS avatars (
        id TEXT PRIMARY KEY,
        email TEXT,
        username TEXT NOT NULL,
        image_path TEXT NOT NULL,
        provider TEXT DEFAULT 'github',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(username)
      )
    `);
        // Migration de branch à branch_default si la table existe déjà
        db.get("PRAGMA table_info(repositories)", (err, row) => {
            if (err) {
                console.error('Erreur lors de la vérification du schéma de la table repositories:', err.message);
                return;
            }
            // Vérifier si la colonne 'branch' existe et si 'branch_default' n'existe pas
            db.get("SELECT 1 FROM pragma_table_info('repositories') WHERE name = 'branch'", (err, branchExists) => {
                if (err) {
                    console.error('Erreur lors de la vérification de la colonne branch:', err.message);
                    return;
                }
                if (branchExists) {
                    db.get("SELECT 1 FROM pragma_table_info('repositories') WHERE name = 'branch_default'", (err, branchDefaultExists) => {
                        if (err) {
                            console.error('Erreur lors de la vérification de la colonne branch_default:', err.message);
                            return;
                        }
                        if (!branchDefaultExists) {
                            console.log('Migration de la colonne branch vers branch_default...');
                            // Créer une table temporaire avec le nouveau schéma
                            db.run(`
                CREATE TABLE repositories_new (
                  id TEXT PRIMARY KEY,
                  name TEXT NOT NULL,
                  url TEXT,
                  local_path TEXT,
                  branch_default TEXT DEFAULT 'main',
                  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
                )
              `, (err) => {
                                if (err) {
                                    console.error('Erreur lors de la création de la table temporaire:', err.message);
                                    return;
                                }
                                // Copier les données en renommant la colonne
                                db.run(`
                  INSERT INTO repositories_new (id, name, url, local_path, branch_default, last_updated)
                  SELECT id, name, url, local_path, branch, last_updated FROM repositories
                `, (err) => {
                                    if (err) {
                                        console.error('Erreur lors de la copie des données:', err.message);
                                        return;
                                    }
                                    // Supprimer l'ancienne table
                                    db.run(`DROP TABLE repositories`, (err) => {
                                        if (err) {
                                            console.error('Erreur lors de la suppression de l\'ancienne table:', err.message);
                                            return;
                                        }
                                        // Renommer la nouvelle table
                                        db.run(`ALTER TABLE repositories_new RENAME TO repositories`, (err) => {
                                            if (err) {
                                                console.error('Erreur lors du renommage de la table:', err.message);
                                                return;
                                            }
                                            console.log('Migration de la table repositories terminée avec succès');
                                        });
                                    });
                                });
                            });
                        }
                    });
                }
            });
        });
        console.log('Database tables created or already exist');
    });
}
exports.default = db;
