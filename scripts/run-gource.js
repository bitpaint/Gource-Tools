#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const readline = require('readline');

// Global constants
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const PRESETS_DIR = path.join(CONFIG_DIR, 'presets');
const DEFAULT_CONFIG = path.join(CONFIG_DIR, 'default.conf');
const TEMP_DIR = path.join(__dirname, '..', 'temp');
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const AVATARS_DIR = path.join(__dirname, '..', 'avatars');
const RENDERS_DIR = path.join(__dirname, '..', 'exports', 'renders');

// Ensure directories exist
[TEMP_DIR, LOGS_DIR, AVATARS_DIR, RENDERS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Parse configuration file
function parseConfigFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Config file not found: ${filePath}`);
    return {};
  }
  
  const config = {};
  const content = fs.readFileSync(filePath, 'utf8');
  
  content.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.startsWith('#') || line.trim() === '') return;
    
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      config[key] = value;
    }
  });
  
  return config;
}

// Convert config object to Gource arguments
function configToArgs(config) {
  const args = [];
  
  Object.entries(config).forEach(([key, value]) => {
    // Handle special cases
    if (key === 'viewport') {
      args.push(`--${value}`);
    } else if (key === 'hide') {
      args.push(`--hide`, value);
    } else if (value === 'true') {
      args.push(`--${key}`);
    } else if (value === 'false') {
      // Skip false boolean options
    } else {
      args.push(`--${key}`, value);
    }
  });
  
  return args;
}

// Validate camera-mode (one of the problematic settings)
function validateCameraMode(config) {
  if (config['camera-mode'] && 
      !['overview', 'track'].includes(config['camera-mode'])) {
    console.warn(`Warning: Invalid camera-mode "${config['camera-mode']}", using "overview" instead`);
    config['camera-mode'] = 'overview';
  }
  return config;
}

// Get a list of available presets
function getAvailablePresets() {
  if (!fs.existsSync(PRESETS_DIR)) return [];
  
  return fs.readdirSync(PRESETS_DIR)
    .filter(file => file.endsWith('.conf'))
    .map(file => file.replace('.conf', ''));
}

// Run Gource with specified options
async function runGource(logFile, options = {}) {
  // Load default config
  let config = parseConfigFile(DEFAULT_CONFIG);
  
  // Load preset if specified
  if (options.preset) {
    const presetFile = path.join(PRESETS_DIR, `${options.preset}.conf`);
    if (fs.existsSync(presetFile)) {
      const presetConfig = parseConfigFile(presetFile);
      config = { ...config, ...presetConfig };
    } else {
      console.error(`Preset not found: ${options.preset}`);
      return false;
    }
  }
  
  // Override with custom config if specified
  if (options.configFile) {
    const customConfig = parseConfigFile(options.configFile);
    config = { ...config, ...customConfig };
  }
  
  // Override with command line options
  if (options.overrides) {
    config = { ...config, ...options.overrides };
  }
  
  // Validate config
  config = validateCameraMode(config);
  
  // Prepare arguments
  const args = [logFile, ...configToArgs(config)];
  
  console.log('Running Gource with the following configuration:');
  Object.entries(config).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  // Determine if we're rendering to a file
  const isRendering = config['output-ppm-stream'] === '-';
  
  if (isRendering) {
    return await renderToVideo(logFile, args, options.outputFile);
  } else {
    return await runGourceInteractive(logFile, args);
  }
}

// Run Gource in interactive mode
async function runGourceInteractive(logFile, args) {
  console.log('\nStarting Gource in interactive mode...');
  
  const gource = spawn('gource', args, { stdio: 'inherit' });
  
  return new Promise((resolve, reject) => {
    gource.on('close', code => {
      if (code === 0) {
        console.log('Gource completed successfully');
        resolve(true);
      } else {
        console.error(`Gource exited with code ${code}`);
        resolve(false);
      }
    });
    
    gource.on('error', err => {
      console.error('Failed to start Gource:', err);
      reject(err);
    });
  });
}

// Render Gource to video using ffmpeg
async function renderToVideo(logFile, args, outputFile) {
  if (!outputFile) {
    const timestamp = Date.now();
    outputFile = path.join(RENDERS_DIR, `gource-${timestamp}.mp4`);
  }
  
  console.log('\nStarting Gource rendering to', outputFile);
  
  // Find framerate in args
  let framerate = '60';
  const framerateIndex = args.indexOf('--output-framerate');
  if (framerateIndex !== -1 && framerateIndex < args.length - 1) {
    framerate = args[framerateIndex + 1];
  }
  
  // Remove output args as we'll pipe to ffmpeg
  const filteredArgs = args.filter(arg => 
    arg !== '--output-ppm-stream' && 
    arg !== '-' && 
    arg !== '--output-framerate' && 
    arg !== framerate
  );
  
  // Create directory for output file if it doesn't exist
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Setup the pipeline: gource -> ffmpeg
  const gource = spawn('gource', [...filteredArgs, '--output-ppm-stream', '-']);
  const ffmpeg = spawn('ffmpeg', [
    '-y',                 // Overwrite output file if it exists
    '-r', framerate,      // Input framerate
    '-f', 'image2pipe',   // Input format
    '-vcodec', 'ppm',     // Input codec
    '-i', '-',            // Input from stdin
    '-vcodec', 'libx264', // Output codec
    '-preset', 'medium',  // Encoding preset
    '-pix_fmt', 'yuv420p',// Pixel format for better compatibility
    '-crf', '23',         // Quality
    outputFile            // Output file
  ]);
  
  // Pipe gource output to ffmpeg
  gource.stdout.pipe(ffmpeg.stdin);
  
  // Log progress
  let lastProgress = '';
  gource.stderr.on('data', (data) => {
    const progressMatch = data.toString().match(/progress: (\d+)%/);
    if (progressMatch && progressMatch[1] !== lastProgress) {
      lastProgress = progressMatch[1];
      process.stdout.write(`Rendering progress: ${lastProgress}%\r`);
    }
  });
  
  return new Promise((resolve, reject) => {
    ffmpeg.on('close', code => {
      if (code === 0) {
        console.log(`\nRendering completed successfully: ${outputFile}`);
        resolve(true);
      } else {
        console.error(`\nffmpeg exited with code ${code}`);
        resolve(false);
      }
    });
    
    gource.on('error', err => {
      console.error('Failed to start Gource:', err);
      reject(err);
    });
    
    ffmpeg.on('error', err => {
      console.error('Failed to start ffmpeg:', err);
      reject(err);
    });
  });
}

// Calculate date ranges
function getDateRange(range) {
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  switch (range) {
    case 'week':
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return {
        start: lastWeek.toISOString().split('T')[0],
        end: today
      };
    case 'month':
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return {
        start: lastMonth.toISOString().split('T')[0],
        end: today
      };
    case 'year':
      const lastYear = new Date(now);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      return {
        start: lastYear.toISOString().split('T')[0],
        end: today
      };
    default:
      return null;
  }
}

// Print usage instructions
function printUsage() {
  const presets = getAvailablePresets();
  
  console.log(`
Usage: node run-gource.js [options] <log-file>

Options:
  --preset <name>       Use a preset configuration (available: ${presets.join(', ')})
  --config <file>       Use a custom configuration file
  --output <file>       Specify output file for rendering
  --start-date <date>   Start date (YYYY-MM-DD)
  --stop-date <date>    Stop date (YYYY-MM-DD)
  --time-range <range>  Predefined time range (week, month, year)
  --help                Show this help

Examples:
  node run-gource.js logs/project.log
  node run-gource.js --preset 4k --output renders/project-4k.mp4 logs/project.log
  node run-gource.js --time-range year logs/project.log
  `);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    return;
  }
  
  // Parse command line arguments
  const options = {
    overrides: {}
  };
  
  let logFile = null;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const option = arg.slice(2);
      
      switch (option) {
        case 'preset':
          options.preset = args[++i];
          break;
        case 'config':
          options.configFile = args[++i];
          break;
        case 'output':
          options.outputFile = args[++i];
          break;
        case 'start-date':
          options.overrides['start-date'] = args[++i];
          break;
        case 'stop-date':
          options.overrides['stop-date'] = args[++i];
          break;
        case 'time-range':
          const range = args[++i];
          const dates = getDateRange(range);
          if (dates) {
            options.overrides['start-date'] = dates.start;
            options.overrides['stop-date'] = dates.end;
          }
          break;
        default:
          // For any other option, add it to overrides
          if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
            options.overrides[option] = args[++i];
          } else {
            options.overrides[option] = 'true';
          }
      }
    } else {
      // Non-option argument is treated as the log file
      logFile = arg;
    }
  }
  
  if (!logFile) {
    console.error('Error: No log file specified');
    printUsage();
    return;
  }
  
  // Check if log file exists
  if (!fs.existsSync(logFile)) {
    console.error(`Error: Log file not found: ${logFile}`);
    return;
  }
  
  try {
    await runGource(logFile, options);
  } catch (err) {
    console.error('Error running Gource:', err);
  }
}

// Run the script
main(); 