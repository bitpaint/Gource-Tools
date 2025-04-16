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
   * @param {string} renderId - The ID of the render to process
   * @param {Object} filters - FFmpeg filter options
   * @returns {Object} Processing result
   */
  async applyFilters(renderId, filters) {
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
    
    // Generate output filename
    const outputFileName = this.generateOutputFileName(render.fileName, filters);
    const outputFilePath = path.join(this.exportsDir, outputFileName);
    
    try {
      // Update render status
      this.updateRenderStatus(renderId, 'processing', 'Applying FFmpeg filters', 0);
      
      // Build FFmpeg command
      const ffmpegCommand = this.buildFFmpegCommand(render.filePath, outputFilePath, filters, false);
      
      // Execute FFmpeg command
      await this.executeFFmpegCommand(ffmpegCommand, outputFileName, renderId);
      
      // Create a new render entry for the processed video
      const processedRender = {
        id: Date.now().toString(),
        projectId: render.projectId,
        projectName: render.projectName,
        fileName: outputFileName,
        filePath: outputFilePath,
        status: 'completed',
        progress: 100,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        isProcessed: true,
        originalRenderId: renderId,
        appliedFilters: filters
      };
      
      // Add to database
      db.get('renders')
        .push(processedRender)
        .write();
      
      // Return result
      return {
        success: true,
        message: 'Filters applied successfully',
        renderId: processedRender.id,
        fileName: outputFileName,
        filePath: outputFilePath
      };
    } catch (error) {
      console.error('Error applying filters:', error);
      this.updateRenderStatus(renderId, 'completed', `Failed to apply filters: ${error.message}`, 0);
      throw new Error(`Failed to apply filters: ${error.message}`);
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
    const fileExt = path.extname(originalFileName);
    const baseName = path.basename(originalFileName, fileExt);
    let suffix = '';
    
    // Add filter info to filename
    if (filters.title) suffix += '_titled';
    if (filters.audioTrack) suffix += '_audio';
    if (filters.fadeIn || filters.fadeOut) suffix += '_faded';
    
    return `${baseName}${suffix}_${timestamp}${fileExt}`;
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
    const args = ['-y'];
    const complexFilterParts = [];
    let videoStreamMap = '0:v';
    let audioStreamMap = null;
    
    // Input file
    args.push('-i', inputPath);
    
    // Add audio file if specified
    if (filters.audioTrack) {
      args.push('-i', path.join(__dirname, '../../', filters.audioTrack.replace(/^\//, '')));
      audioStreamMap = '1:a';
    } else {
      // Use original audio if available
      try {
        const probeCmd = `ffprobe -v error -select_streams a -show_entries stream=codec_name -of csv=p=0 "${inputPath}"`;
        const hasAudio = execSync(probeCmd, { encoding: 'utf8' }).trim() !== '';
        if (hasAudio) {
          audioStreamMap = '0:a';
        }
      } catch (error) {
        console.log('No audio stream in original file:', error.message);
      }
    }
    
    // Add fade effects if specified
    if (filters.fadeIn || filters.fadeOut) {
      const videoFilters = [];
      const audioFilters = [];
      
      // Apply video fade in/out
      if (filters.fadeIn && filters.fadeIn > 0) {
        videoFilters.push(`fade=t=in:st=0:d=${filters.fadeIn}`);
      }
      
      if (filters.fadeOut && filters.fadeOut > 0) {
        // Get video duration to calculate fade out start time
        try {
          const durationCmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${inputPath}"`;
          const duration = parseFloat(execSync(durationCmd, { encoding: 'utf8' }).trim());
          
          if (!isNaN(duration)) {
            const fadeOutStart = Math.max(0, duration - filters.fadeOut);
            videoFilters.push(`fade=t=out:st=${fadeOutStart}:d=${filters.fadeOut}`);
          }
        } catch (error) {
          console.error('Error getting video duration:', error);
        }
      }
      
      // Apply the same fade effects to audio if it exists
      if (audioStreamMap && (filters.fadeIn > 0 || filters.fadeOut > 0)) {
        if (filters.fadeIn > 0) {
          audioFilters.push(`afade=t=in:st=0:d=${filters.fadeIn}`);
        }
        
        if (filters.fadeOut > 0) {
          try {
            const durationCmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${inputPath}"`;
            const duration = parseFloat(execSync(durationCmd, { encoding: 'utf8' }).trim());
            
            if (!isNaN(duration)) {
              const fadeOutStart = Math.max(0, duration - filters.fadeOut);
              audioFilters.push(`afade=t=out:st=${fadeOutStart}:d=${filters.fadeOut}`);
            }
          } catch (error) {
            console.error('Error getting audio duration:', error);
          }
        }
      }
      
      // Add video filters to the complex filter
      if (videoFilters.length > 0) {
        complexFilterParts.push(`[0:v]${videoFilters.join(',')}[v]`);
        videoStreamMap = '[v]';
      }
      
      // Add audio filters to the complex filter
      if (audioFilters.length > 0 && audioStreamMap) {
        const audioStreamIndex = audioStreamMap.replace(/\D/g, '');
        complexFilterParts.push(`[${audioStreamIndex}:a]${audioFilters.join(',')}[a]`);
        audioStreamMap = '[a]';
      }
    }
    
    // Add title if specified
    if (filters.title && filters.title.text) {
      const {
        text,
        fontSize = 24,
        fontColor = 'white',
        backgroundColor = 'black@0.5',
        position = 'center',
        duration = 5
      } = filters.title;
      
      const fontSizeValue = fontSize || 24;
      const fontColorValue = fontColor || 'white';
      const backgroundColorValue = backgroundColor || 'black@0.5';
      
      let titleFilter;
      
      // Position calculation
      let x, y;
      switch (position) {
        case 'top':
          x = '(w-text_w)/2';
          y = '10';
          break;
        case 'bottom':
          x = '(w-text_w)/2';
          y = 'h-th-10';
          break;
        case 'top-left':
          x = '10';
          y = '10';
          break;
        case 'top-right':
          x = 'w-tw-10';
          y = '10';
          break;
        case 'bottom-left':
          x = '10';
          y = 'h-th-10';
          break;
        case 'bottom-right':
          x = 'w-tw-10';
          y = 'h-th-10';
          break;
        case 'center':
        default:
          x = '(w-text_w)/2';
          y = '(h-text_h)/2';
          break;
      }
      
      // Create title filter
      titleFilter = `drawtext=text='${text.replace(/'/g, "\\'")}':fontcolor=${fontColorValue}:fontsize=${fontSizeValue}:x=${x}:y=${y}:box=1:boxcolor=${backgroundColorValue}:enable='between(t,0,${duration})'`;
      
      if (videoStreamMap === '0:v') {
        complexFilterParts.push(`[0:v]${titleFilter}[v]`);
        videoStreamMap = '[v]';
      } else {
        // Append to existing video stream
        const lastStreamName = videoStreamMap;
        complexFilterParts.push(`${lastStreamName}${titleFilter}[v]`);
        videoStreamMap = '[v]';
      }
    }
    
    // Apply complex filter if needed
    if (complexFilterParts.length > 0) {
      args.push('-filter_complex', complexFilterParts.join(';'));
    }
    
    // Map streams
    args.push('-map', videoStreamMap);
    
    if (audioStreamMap) {
      args.push('-map', audioStreamMap);
    }
    
    // Set codec and quality for preview or final output
    if (isPreview) {
      // Preview: lower quality, faster encoding
      args.push(
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-t', '30', // Limit preview to 30 seconds
        '-s', '854x480' // 480p
      );
      
      if (audioStreamMap) {
        args.push('-c:a', 'aac', '-b:a', '128k');
      }
    } else {
      // Final output: maintain quality
      args.push(
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23'
      );
      
      if (audioStreamMap) {
        args.push('-c:a', 'aac', '-b:a', '192k');
      }
    }
    
    // Output file
    args.push(outputPath);
    
    return args;
  }
  
  /**
   * Execute an FFmpeg command
   * @param {Array} args - FFmpeg command arguments
   * @param {string} outputId - Identifier for the output
   * @param {string} renderId - Render ID for status updates
   * @returns {Promise} Promise resolving when command completes
   */
  executeFFmpegCommand(args, outputId, renderId) {
    return new Promise((resolve, reject) => {
      console.log('Executing FFmpeg command:', 'ffmpeg', args.join(' '));
      
      const ffmpegProcess = spawn('ffmpeg', args, {
        windowsHide: true
      });
      
      let stdoutData = '';
      let stderrData = '';
      let progress = 0;
      
      ffmpegProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });
      
      ffmpegProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderrData += output;
        
        // Extract progress information
        const timeMatch = output.match(/time=(\d+):(\d+):(\d+)\.\d+/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const seconds = parseInt(timeMatch[3]);
          
          // Calculate seconds
          const currentTime = hours * 3600 + minutes * 60 + seconds;
          
          // Estimate progress (assuming 60 seconds video)
          const estimatedDuration = 60;
          progress = Math.min(Math.round((currentTime / estimatedDuration) * 100), 99);
          
          // Update render status
          if (renderId) {
            this.updateRenderStatus(renderId, 'processing', `Applying FFmpeg filters (${progress}%)`, progress);
          }
        }
      });
      
      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          if (renderId) {
            this.updateRenderStatus(renderId, 'completed', 'FFmpeg processing completed', 100);
          }
          resolve({ success: true, outputId });
        } else {
          console.error('FFmpeg process exited with code:', code);
          console.error('FFmpeg stderr:', stderrData);
          reject(new Error(`FFmpeg process failed with code ${code}`));
        }
      });
      
      ffmpegProcess.on('error', (error) => {
        console.error('FFmpeg process error:', error);
        reject(error);
      });
    });
  }
}

module.exports = new FFmpegService(); 