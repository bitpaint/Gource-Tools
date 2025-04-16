const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const { execSync } = require('child_process');
const Database = require('./utils/Database');
const Logger = require('./utils/Logger');
const initCustomRenderProfiles = require('./config/initRenderProfiles');

// Create a logger for the server
const logger = Logger.createComponentLogger('Server');

// Initialize environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
logger.info('Environment variables loaded');

// Initialize database
const dbPath = path.join(__dirname, '../db');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
  logger.info('Created database directory');
}

// Import the SINGLETON instance of the Database class
const DatabaseInstance = require('./utils/Database');
// Initialization is now handled within the Database class constructor
logger.info('Database initialization triggered by require.');

// Get the shared DB instance for operations within index.js
const db = DatabaseInstance.getDatabase(); 

// Check if db instance is valid before proceeding
if (!db) {
    logger.error('Failed to get database instance in index.js. Cannot proceed with initialization.');
    process.exit(1); // Exit if DB is not available
}

// Initialize/Verify custom render profiles (which includes the default)
// MUST run before any logic that might depend on the default profile existing.
try {
    initCustomRenderProfiles();
    logger.info('Custom render profiles initialized/verified.');
} catch(initError) {
     logger.error('Error initializing custom profiles:', initError);
     // Decide if this is fatal, maybe exit?
     process.exit(1);
}

// Initialize API routes
const repositoriesRouter = require('./routes/repositories');
const projectsRouter = require('./routes/projects');
const configFilesRouter = require('./routes/configFiles');
const rendersRouter = require('./routes/renders');
const settingsRouter = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Check if Gource and ffmpeg are installed
try {
  execSync('gource --help', { stdio: 'ignore' });
  logger.info('Gource is installed');
} catch (error) {
  logger.error('Gource is not installed or not in PATH', error);
}

try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
  logger.info('ffmpeg is installed');
} catch (error) {
  logger.error('ffmpeg is not installed or not in PATH', error);
}

// API Routes
app.use('/api/repositories', repositoriesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/renderProfiles', configFilesRouter);
app.use('/api/renders', rendersRouter);
app.use('/api/settings', settingsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      gource: true,
      ffmpeg: true,
      database: true
    },
    directories: {
      repos: false,
      exports: false,
      temp: false
    }
  };

  // Check required software
  try {
    execSync('gource --help', { stdio: 'ignore' });
  } catch (error) {
    healthStatus.services.gource = false;
    healthStatus.status = 'warning';
  }

  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
  } catch (error) {
    healthStatus.services.ffmpeg = false;
    healthStatus.status = 'warning';
  }

  // Check directories
  const reposDir = path.join(__dirname, '../repos');
  try {
    fs.accessSync(reposDir, fs.constants.W_OK);
    healthStatus.directories.repos = true;
  } catch (error) {
    healthStatus.status = 'warning';
  }

  const exportsDir = path.join(__dirname, '../exports');
  try {
    fs.accessSync(exportsDir, fs.constants.W_OK);
    healthStatus.directories.exports = true;
  } catch (error) {
    healthStatus.status = 'warning';
  }

  const tempDir = path.join(__dirname, '../temp');
  try {
    fs.accessSync(tempDir, fs.constants.W_OK);
    healthStatus.directories.temp = true;
  } catch (error) {
    healthStatus.status = 'warning';
  }

  res.json(healthStatus);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Serve static files from exports directory
app.use('/exports', express.static(path.join(__dirname, '../exports')));

// Serve preview files from temp/previews directory
app.use('/temp/previews', express.static(path.join(__dirname, '../temp/previews')));

// Serve audio files for FFmpeg
app.use('/temp/music', express.static(path.join(__dirname, '../temp/music')));

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Access the application at http://localhost:${PORT}`);
}); 