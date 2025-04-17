/**
 * FFmpeg Service
 * Handles operations related to FFmpeg video processing
 */

const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const crypto = require('crypto');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const Database = require('../utils/Database'); // Importer Database

class FFmpegService {
  constructor() {
    const __rootdir = path.resolve(path.dirname(__dirname), '../');
    this.dbPath = path.join(__rootdir, 'db/db.json');
    this.exportsDir = path.join(__rootdir, 'exports');
    this.tempDir = path.join(__rootdir, 'temp');
    this.previewsDir = path.join(this.tempDir, 'previews');
    
    // Create required directories if they don't exist
    this.createDirectories();
  }
  
  /**
   * Create necessary directories
   */
  createDirectories() {
    const dirs = [this.exportsDir, this.tempDir, this.previewsDir];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
  
  /**
   * Get a fresh database instance
   * @deprecated Utiliser Database.getDatabase() à la place
   */
  // getDatabase() {
  //   const adapter = new FileSync(this.dbPath);
  //   return low(adapter);
  // }
  
  /**
   * Update render status in database
   */
  updateRenderStatus(renderId, status, message = null, progress = null) {
    if (!renderId) return null;
    
    const db = Database.getDatabase(); // Utiliser l'instance partagée
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
    
    // Add end time if render is completed or failed
    if (status === 'completed' || status === 'failed') {
      updates.endTime = new Date().toISOString();
    }
    
    // Update render in database
    db.get('renders')
      .find({ id: renderId.toString() })
      .assign(updates)
      .write();
    
    return db.get('renders')
      .find({ id: renderId.toString() })
      .value();
  }
  
  /**
   * Generate a preview with FFmpeg filters
   * @param {string} renderId - The ID of the render to preview
   * @param {Object} filters - FFmpeg filter options
   * @returns {Object} Preview result
   */
  async generatePreview(renderId, filters) {
    // Get render from database
    const db = Database.getDatabase(); // Utiliser l'instance partagée
    const render = db.get('renders')
      .find({ id: renderId })
      .value();
    
    if (!render) {
      throw new Error('Render not found');
    }
    
    if (!fs.existsSync(render.filePath)) {
      throw new Error('Render file not found');
    }
    
    // Create a unique preview ID
    const previewId = `preview_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const previewFilePath = path.join(this.previewsDir, `${previewId}.mp4`);
    
    // Ensure previews directory exists
    if (!fs.existsSync(this.previewsDir)) {
      fs.mkdirSync(this.previewsDir, { recursive: true });
    }
    
    try {
      // Build FFmpeg command for preview
      const ffmpegCommand = this.buildFFmpegCommand(render.filePath, previewFilePath, filters, true);
      
      // Execute FFmpeg command
      await this.executeFFmpegCommand(ffmpegCommand, previewId, renderId);
      
      // Return preview information
      const previewUrl = `/temp/previews/${path.basename(previewFilePath)}`;
      return {
        success: true,
        previewUrl,
        previewId
      };
    } catch (error) {
      console.error('Error generating preview:', error);
      throw new Error(`Failed to generate preview: ${error.message}`);
    }
  }
  
  /**
   * Apply FFmpeg filters to a render
   * @param {string} renderId - The ID of the *original* render to process
   * @param {Object} filters - FFmpeg filter options
   * @returns {Promise<Object>} Promise resolving with the new render ID and initial status
   */
  async applyFilters(originalRenderId, filters) {
    const db = Database.getDatabase(); 
    const originalRender = db.get('renders')
      .find({ id: originalRenderId })
      .value();

    if (!originalRender) {
      throw new Error('Original render not found');
    }
    if (!fs.existsSync(originalRender.filePath)) {
      throw new Error('Original render file not found');
    }

    // 1. Generate output details and NEW render ID first
    const outputFileName = this.generateOutputFileName(originalRender.fileName, filters);
    const outputFilePath = path.join(this.exportsDir, outputFileName);
    const newRenderId = Date.now().toString(); // Use timestamp as unique ID for the new processed render

    // 2. Create the initial DB entry for the NEW render
    const newRenderEntry = {
      id: newRenderId,
      projectId: originalRender.projectId,
      projectName: originalRender.projectName,
      fileName: outputFileName, // Store planned filename
      filePath: null, // File path is not ready yet
      status: 'queued', // Start as 'queued' or 'initializing'
      progress: 0,
      startTime: new Date().toISOString(),
      endTime: null,
      isProcessed: true,
      originalRenderId: originalRenderId,
      appliedFilters: filters,
      message: 'Waiting to start processing...'
    };

    try {
      db.get('renders').push(newRenderEntry).write();
      console.log(`Created initial DB entry for new render: ${newRenderId}`);

      // 3. Start the FFmpeg process asynchronously
      // We don't await here, let it run in the background.
      // Pass the NEW renderId for progress updates.
      this.executeFFmpegCommand(
        this.buildFFmpegCommand(originalRender.filePath, outputFilePath, filters, false),
        outputFileName, // This might be less relevant now, use newRenderId for tracking
        newRenderId // IMPORTANT: Pass the new ID for status updates
      ).then(result => {
          console.log(`FFmpeg process completed successfully for render ${newRenderId}`);
          // Update the final details in the DB upon successful completion
          db.get('renders')
            .find({ id: newRenderId })
            .assign({ 
              filePath: outputFilePath, // Set the actual file path
              status: 'completed', // Status is likely already set by executeFFmpegCommand, but ensure it
              progress: 100,
              endTime: new Date().toISOString(),
              message: 'Video processed successfully'
            })
            .write();
        }).catch(error => {
          console.error(`FFmpeg process failed for render ${newRenderId}:`, error);
          // Update status to 'failed' in the DB
          this.updateRenderStatus(newRenderId, 'failed', `FFmpeg failed: ${error.message || 'Unknown error'}`, 0);
          // Optionally delete the potentially incomplete output file
          if (fs.existsSync(outputFilePath)) {
            try {
              fs.unlinkSync(outputFilePath);
            } catch (unlinkErr) {
              console.error(`Failed to delete incomplete output file ${outputFilePath}:`, unlinkErr);
            }
          }
        });

      // 4. Return the NEW render ID immediately to the frontend
      console.log(`Returning new render ID ${newRenderId} to frontend for polling.`);
      return {
        success: true,
        message: 'FFmpeg processing started',
        renderId: newRenderId // Return the ID of the new entry
      };

    } catch (error) {
      console.error('Error initiating filter application:', error);
      // If DB write fails or other initial error occurs, update status if possible
      this.updateRenderStatus(newRenderId, 'failed', `Initialization failed: ${error.message}`, 0);
      throw new Error(`Failed to initiate filter application: ${error.message}`);
    }
  }
  
  /**
   * Generate output filename for processed video
   * @param {string} originalFileName - Original filename
   * @param {Object} filters - Applied filters
   * @returns {string} Generated filename
   */
  generateOutputFileName(originalFileName, filters) {
    const timestamp = Date.now();
    const fileExt = path.extname(originalFileName) || '.mp4'; // Ensure extension exists
    const baseName = path.basename(originalFileName, fileExt);
    let suffix = '_edited'; // Simpler suffix

    // Optional: Add more specific suffix based on filters if needed
    // if (filters.fade && filters.fade.enabled) suffix += '_fade';
    // if (filters.music && filters.music.enabled) suffix += '_music';
    
    // Sanitize baseName just in case
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');

    return `${safeBaseName}${suffix}_${timestamp}${fileExt}`;
  }
  
  /**
   * Build FFmpeg command based on filters
   * @param {string} inputPath - Input file path
   * @param {string} outputPath - Output file path
   * @param {Object} filters - Filter options
   * @param {boolean} isPreview - Whether this is a preview or final render
   * @returns {Array} FFmpeg command arguments
   */
  buildFFmpegCommand(inputPath, outputPath, filters, isPreview = false) {
    const args = ['-y']; // Overwrite output without asking
    const complexFilterParts = [];
    let videoInputStream = '[0:v]';
    let audioInputStream = null;
    let videoOutputStream = '[vout]'; // Default output stream names
    let audioOutputStream = '[aout]';

    // Input file (video)
    args.push('-i', inputPath);
    
    // Try to detect original audio stream
    try {
      const probeCmd = `ffprobe -v error -select_streams a:0 -show_entries stream=index -of csv=p=0 \"${inputPath}\"`;
        const hasAudio = execSync(probeCmd, { encoding: 'utf8' }).trim() !== '';
        if (hasAudio) {
        audioInputStream = '[0:a]';
        }
      } catch (error) {
      console.log('No audio stream detected in original file.');
    }

    // Input file (music)
    if (filters.music && filters.music.enabled && filters.music.file) {
      if (fs.existsSync(filters.music.file)) {
        args.push('-i', filters.music.file);
        // If music is added, it becomes the primary audio source (input 1)
        audioInputStream = '[1:a]'; 
      } else {
        console.warn(`Music file not found: ${filters.music.file}`);
        // Keep original audio if music file not found
      }
    }

    let currentVideoFilter = videoInputStream;
    let currentAudioFilter = audioInputStream;

    // --- Apply Video Filters --- 

    // Apply Video Fade
    if (filters.fade && filters.fade.enabled) {
      const durationIn = filters.fade.durationIn || 0;
      const durationOut = filters.fade.durationOut || 0;
      const videoFilters = [];
      if (durationIn > 0) {
        videoFilters.push(`fade=t=in:st=0:d=${durationIn}`);
      }
      if (durationOut > 0) {
        try {
          const durationCmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 \"${inputPath}\"`;
          const duration = parseFloat(execSync(durationCmd, { encoding: 'utf8' }).trim());
          if (!isNaN(duration)) {
            const fadeOutStart = Math.max(0, duration - durationOut);
            videoFilters.push(`fade=t=out:st=${fadeOutStart}:d=${durationOut}`);
          }
        } catch (error) {
          console.error('Error getting video duration for fade-out:', error);
        }
      }
      if (videoFilters.length > 0) {
        complexFilterParts.push(`${currentVideoFilter}${videoFilters.join(',')}[vfade]`);
        currentVideoFilter = '[vfade]';
      }
    }
    
    // --- Apply Audio Filters --- 
    let audioFilterChain = '';

    // Apply Audio Fade (if audio exists)
    if (currentAudioFilter && filters.fade && filters.fade.enabled) {
      const durationIn = filters.fade.durationIn || 0;
      const durationOut = filters.fade.durationOut || 0;
      const audioFilters = [];
      if (durationIn > 0) {
        audioFilters.push(`afade=t=in:st=0:d=${durationIn}`);
      }
      if (durationOut > 0) {
        try {
           // Use the same duration logic as video fade
          const durationCmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 \"${inputPath}\"`;
            const duration = parseFloat(execSync(durationCmd, { encoding: 'utf8' }).trim());
            if (!isNaN(duration)) {
             const fadeOutStart = Math.max(0, duration - durationOut);
             audioFilters.push(`afade=t=out:st=${fadeOutStart}:d=${durationOut}`);
          }
        } catch (error) {
           console.error('Error getting audio duration for afade-out:', error);
        }
      }
      if (audioFilters.length > 0) {
        audioFilterChain += (audioFilterChain ? ',' : '') + audioFilters.join(',');
      }
    }

    // Apply Music Volume (if music was added)
    if (filters.music && filters.music.enabled && filters.music.file && audioInputStream === '[1:a]') { 
      const volume = (filters.music.volume !== undefined && filters.music.volume >= 0) ? filters.music.volume : 0.8;
      audioFilterChain += (audioFilterChain ? ',' : '') + `volume=${volume}`;
    }

    // Add audio filter chain to complex filter if needed
    if (currentAudioFilter && audioFilterChain) {
      complexFilterParts.push(`${currentAudioFilter}${audioFilterChain}${audioOutputStream}`);
    } else if (currentAudioFilter) {
      // If no filters applied, just pass the input stream
      complexFilterParts.push(`${currentAudioFilter}aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo${audioOutputStream}`); // Ensure consistent format
      } else {
       audioOutputStream = null; // No audio output if no input and no music
      }

    // Final video output stream name
    if (currentVideoFilter !== videoOutputStream) {
       complexFilterParts.push(`${currentVideoFilter}copy${videoOutputStream}`); // Ensure last video filter output is named correctly
    }
    
    // Add complex filter argument if any filters were used
    if (complexFilterParts.length > 0) {
      args.push('-filter_complex', complexFilterParts.join(';'));
    }
    
    // Map streams
    if (videoOutputStream && complexFilterParts.length > 0) {
      args.push('-map', videoOutputStream);
    } else {
      args.push('-map', '0:v'); // Map original video if no complex filter
    }

    if (audioOutputStream && complexFilterParts.length > 0) {
      args.push('-map', audioOutputStream);
    } else if (audioInputStream && !complexFilterParts.length && audioInputStream === '[1:a]') {
       // Map music directly if no other audio filters and music was added
       args.push('-map', '1:a');
    } else if (audioInputStream && !complexFilterParts.length && audioInputStream === '[0:a]'){
        // Map original audio directly if no other audio filters
       args.push('-map', '0:a');
    }
    
    // Set codec and quality for preview or final output
    let preset = 'medium';
    let crf = '23';
    let audioBitrate = '192k';

    if (!isPreview) {
        switch (filters.quality) {
            case 'low':
                preset = 'fast'; // faster encoding
                crf = '28';
                audioBitrate = '128k';
                break;
            case 'high':
                preset = 'medium'; // Slower encoding, better quality
                crf = '20';
                audioBitrate = '256k';
                break;
            case 'medium': // Default
            default:
                preset = 'medium';
                crf = '23';
                audioBitrate = '192k';
                break;
        }
        args.push('-c:v', 'libx264', '-preset', preset, '-crf', crf);
        if (audioOutputStream || audioInputStream) {
             args.push('-c:a', 'aac', '-b:a', audioBitrate);
      }
    } else {
      // Preview settings (lower quality, faster)
      args.push(
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '30', // Higher CRF for faster preview
        '-t', '15', // Limit preview to 15 seconds
        '-s', '640x360' // Lower resolution for preview
      );
      if (audioOutputStream || audioInputStream) {
        args.push('-c:a', 'aac', '-b:a', '96k'); // Lower audio bitrate for preview
      }
    }
    
    // Output file
    args.push(outputPath);
    
    console.log('Built FFmpeg command:', args.join(' ')); // Log the final command
    return args;
  }
  
  /**
   * Execute an FFmpeg command
   * @param {Array} args - FFmpeg command arguments
   * @param {string} outputId - Identifier for the output (less critical now)
   * @param {string} renderId - Render ID for status updates (MUST be the NEW render ID)
   * @returns {Promise} Promise resolving when command completes
   */
  executeFFmpegCommand(args, outputId, renderId) { // Ensure renderId is the new one
    return new Promise(async (resolve, reject) => {
      // Ensure renderId is provided
      if (!renderId) {
        console.error("executeFFmpegCommand called without a renderId!");
        return reject(new Error("Missing renderId for FFmpeg execution tracking."));
      }

      console.log(`Executing FFmpeg for renderId ${renderId}:`, 'ffmpeg', args.join(' '));

      // --- Get Duration ---
      const inputPathIndex = args.findIndex(arg => arg === '-i') + 1;
      const inputPath = args[inputPathIndex];
      let totalDuration = null; 

      try {
        // Initial status update: Queued -> Processing
        this.updateRenderStatus(renderId, 'processing', 'Detecting video duration...', 1);

        const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`;
        const durationOutput = execSync(durationCmd, { encoding: 'utf8' }).trim();
        const duration = parseFloat(durationOutput);
        if (!isNaN(duration) && duration > 0) {
          totalDuration = duration;
          console.log(`[Render ${renderId}] Detected video duration: ${totalDuration} seconds.`);
          this.updateRenderStatus(renderId, 'processing', 'Starting FFmpeg process...', 5); // Update status before spawn
        } else {
          console.warn(`[Render ${renderId}] Could not parse duration from ffprobe output: ${durationOutput}. Progress calculation might be inaccurate.`);
          this.updateRenderStatus(renderId, 'processing', 'Starting FFmpeg process (duration unknown)...', 5); // Still update status
        }
      } catch (error) {
        console.error(`[Render ${renderId}] Error getting video duration with ffprobe for ${inputPath}:`, error.message);
        console.warn(`[Render ${renderId}] Could not get video duration. Progress calculation might be inaccurate.`);
        this.updateRenderStatus(renderId, 'processing', 'Starting FFmpeg process (duration error)...', 5); // Update status even on error
      }

      // --- Start FFmpeg ---
      const ffmpegProcess = spawn('ffmpeg', args, {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'] 
      });

      let stderrOutput = '';
      let lastProgressUpdate = 0;
      let lastReportedProgress = 5; // Start from 5% since we updated status before spawn
      const progressUpdateInterval = 300; // Update progress slightly less frequently (300ms)

      // --- Handle stderr ---
      ffmpegProcess.stderr.on('data', (data) => {
        const outputChunk = data.toString();
        stderrOutput += outputChunk;

        if (totalDuration !== null) {
          const timeMatch = outputChunk.match(/time=(\d{2,}):(\d{2}):(\d{2}\.\d+)/);
          if (timeMatch) {
            try {
              const hours = parseInt(timeMatch[1], 10);
              const minutes = parseInt(timeMatch[2], 10);
              const seconds = parseFloat(timeMatch[3]); 
              const currentTime = hours * 3600 + minutes * 60 + seconds;

              if (currentTime >= 0) {
                const rawProgress = Math.round((currentTime / totalDuration) * 100);
                // Ensure progress increases and stays within 5-95 range during processing
                const progress = Math.min(Math.max(Math.max(rawProgress, 5), lastReportedProgress), 95); 

                if (progress > lastReportedProgress) { // Only update if progress actually increased
                    lastReportedProgress = progress;
                    const now = Date.now();
                    if (now - lastProgressUpdate > progressUpdateInterval) {
                      console.log(`[Render ${renderId}] FFmpeg Progress: ${progress}% (${currentTime.toFixed(2)}/${totalDuration.toFixed(2)}s)`);
                      this.updateRenderStatus(renderId, 'processing', `Processing video (${progress}%)`, progress);
                      lastProgressUpdate = now;
                    }
                }
              }
            } catch (parseError) {
              // console.warn('Error parsing time from FFmpeg stderr:', parseError); // Reduce noise
            }
          }
        } else {
            // If duration is unknown, maybe log chunks occasionally but don't try to parse progress
             // console.log(`[Render ${renderId}] FFmpeg stderr chunk (no duration):`, outputChunk.substring(0, 100)); 
        }
      });

      // --- Handle stdout (Drain) ---
      ffmpegProcess.stdout.on('data', (data) => { /* Drain buffer */ });

      // --- Handle Process Exit ---
      ffmpegProcess.on('close', (code) => {
        console.log(`[Render ${renderId}] FFmpeg process exited with code: ${code}`);
        if (code === 0) {
          // Final updates are handled in the .then() block of applyFilters
          // Ensure progress hits 97-100 here for immediate feedback if needed
          this.updateRenderStatus(renderId, 'processing', 'Finalizing video...', 97); 
          // The final 'completed' status with 100% is set in applyFilters.then()
          // This ensures the file path is also updated correctly.
          console.log(`[Render ${renderId}] FFmpeg finished successfully.`);
          resolve({ success: true, outputId: renderId }); // Resolve with the renderId
        } else {
          console.error(`[Render ${renderId}] FFmpeg process failed.`);
          console.error(`[Render ${renderId}] FFmpeg stderr final output:`, stderrOutput.slice(-2000)); 
          // Rejecting here will trigger the .catch() block in applyFilters
          reject(new Error(`FFmpeg process failed with code ${code}.`));
        }
      });

      // --- Handle Process Error ---
      ffmpegProcess.on('error', (error) => {
        console.error(`[Render ${renderId}] Failed to start FFmpeg process:`, error);
        // Rejecting here will trigger the .catch() block in applyFilters
        reject(error);
      });
    });
  }
}

module.exports = new FFmpegService(); 