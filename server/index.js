const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const { execSync } = require('child_process');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// Initialize environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize database
const dbPath = path.join(__dirname, '../db');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

const adapter = new FileSync(path.join(dbPath, 'db.json'));
const db = low(adapter);

// Set default values for database
db.defaults({ 
  repositories: [], 
  projects: [], 
  renderProfiles: [],
  renders: []
}).write();

// Create default config file if it doesn't exist
const defaultProfileExists = db.get('renderProfiles')
  .find({ isDefault: true })
  .value();

if (!defaultProfileExists) {
  // Default settings for Gource
  const defaultSettings = {
    resolution: '1920x1080',
    framerate: 60,
    secondsPerDay: 1,
    autoSkipSeconds: 0.1,
    elasticity: 0.5,
    title: true,
    key: true,
    background: '#000000',
    fontScale: 1.0,
    cameraMode: 'overview',
    userScale: 1.0,
    timeScale: 1.0,
    highlightUsers: false,
    hideUsers: '',
    hideFilesRegex: '',
    hideRoot: false,
    maxUserCount: 0,
    extraArgs: ''
  };

  const defaultProfile = {
    id: 'default',
    name: 'Default Gource Config File',
    description: 'Default config file used for all projects that don\'t have a specific config file',
    settings: defaultSettings,
    isDefault: true,
    dateCreated: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };

  db.get('renderProfiles')
    .push(defaultProfile)
    .write();
    
  console.log('✅ Created default Gource config file');
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
  console.log('✅ Gource is installed');
} catch (error) {
  console.error('❌ Gource is not installed or not in PATH. Please install Gource to use this application.');
}

try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
  console.log('✅ ffmpeg is installed');
} catch (error) {
  console.error('❌ ffmpeg is not installed or not in PATH. Please install ffmpeg to use this application.');
}

// API Routes
app.use('/api/repositories', repositoriesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/renderProfiles', configFilesRouter);
app.use('/api/renders', rendersRouter);
app.use('/api/settings', settingsRouter);

// Endpoint pour vérifier l'état de l'application
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

  // Vérifier les logiciels requis
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

  // Vérifier les répertoires
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
}); 