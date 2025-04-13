const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const { execSync } = require('child_process');
const Database = require('./utils/Database');
const Logger = require('./utils/Logger');
const { defaultGourceConfig } = require('./config/defaultGourceConfig');
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

// Initialize database with required collections
const db = Database.initializeDatabase();
logger.info('Database initialized');

// Create default config file if it doesn't exist
const defaultProfileExists = db.get('renderProfiles')
  .find({ isDefault: true })
  .value();

if (!defaultProfileExists) {
  // Import default configuration from external file
  db.get('renderProfiles')
    .push(defaultGourceConfig)
    .write();
    
  logger.info('Created default Gource config file');
}

// Initialize custom render profiles (Last Week, Last Month, Last Year)
initCustomRenderProfiles();
logger.info('Custom render profiles initialized');

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