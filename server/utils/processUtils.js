/**
 * Process Utility Functions
 * Provides helper functions for process management
 */

const { exec } = require('child_process');
const os = require('os');
const Logger = require('./Logger');

// Create a component logger
const logger = Logger.createComponentLogger('ProcessUtils');

/**
 * Kill a process and all its child processes
 * @param {number|string} pid - Process ID to kill
 * @param {string} signal - Signal to send (default: 'SIGKILL')
 * @returns {Promise<boolean>} Success status
 */
async function killProcessTree(pid, signal = 'SIGKILL') {
  if (!pid) {
    logger.warn('No PID provided to killProcessTree');
    return false;
  }

  logger.info(`Attempting to kill process tree with PID: ${pid}`);
  
  try {
    const isWindows = os.platform() === 'win32';
    
    if (isWindows) {
      // On Windows, use taskkill with /T to kill the process tree
      await new Promise((resolve, reject) => {
        exec(`taskkill /pid ${pid} /T /F`, (error, stdout, stderr) => {
          if (error) {
            // Don't consider it an error if the process was already gone
            if (!error.message.includes('not found')) {
              logger.warn(`Error killing process tree: ${error.message}`);
              reject(error);
              return;
            }
          }
          
          logger.success(`Process tree with PID ${pid} terminated`);
          resolve(stdout);
        });
      });
    } else {
      // On Unix-like systems
      // First get all child processes
      const childPids = await getChildPids(pid);
      
      // Kill all child processes and then the parent
      const allPids = [...childPids, pid];
      
      for (const processId of allPids) {
        try {
          process.kill(parseInt(processId, 10), signal);
          logger.info(`Killed process with PID: ${processId}`);
        } catch (killError) {
          // Ignore if process is already gone
          if (killError.code !== 'ESRCH') {
            logger.warn(`Error killing process ${processId}: ${killError.message}`);
          }
        }
      }
      
      logger.success(`Process tree with PID ${pid} terminated`);
    }
    
    return true;
  } catch (error) {
    logger.error(`Failed to kill process tree with PID ${pid}: ${error.message}`);
    return false;
  }
}

/**
 * Get all child process IDs for a given parent PID (Unix-like systems only)
 * @param {number|string} parentPid - Parent process ID
 * @returns {Promise<string[]>} Array of child PIDs
 */
async function getChildPids(parentPid) {
  return new Promise((resolve, reject) => {
    // Use ps command to find all child processes
    exec(`ps -o pid --ppid ${parentPid} --no-headers`, (error, stdout, stderr) => {
      if (error) {
        // If ps command fails, return empty array instead of rejecting
        logger.warn(`Error finding child processes: ${error.message}`);
        resolve([]);
        return;
      }
      
      // Parse the output to get the PIDs
      const childPids = stdout.split('\n')
        .map(line => line.trim())
        .filter(line => line !== '');
      
      logger.info(`Found ${childPids.length} child processes for PID ${parentPid}`);
      resolve(childPids);
    });
  });
}

module.exports = {
  killProcessTree
}; 