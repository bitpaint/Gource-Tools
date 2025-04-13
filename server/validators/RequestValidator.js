/**
 * Request Validator
 * Utility functions for validating API request data
 */

/**
 * Validates that a request body contains all required fields
 * @param {Object} body - The request body
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Object} Validation result {valid: boolean, message: string}
 */
function validateRequired(body, requiredFields) {
  if (!body) {
    return { valid: false, message: 'Request body is missing' };
  }

  const missingFields = requiredFields.filter(field => !body[field]);
  
  if (missingFields.length > 0) {
    return { 
      valid: false, 
      message: `Missing required fields: ${missingFields.join(', ')}` 
    };
  }
  
  return { valid: true };
}

/**
 * Validates a string ID
 * @param {string} id - The ID to validate
 * @returns {Object} Validation result {valid: boolean, message: string}
 */
function validateId(id) {
  if (!id) {
    return { valid: false, message: 'ID is required' };
  }
  
  if (typeof id !== 'string') {
    return { valid: false, message: 'ID must be a string' };
  }
  
  return { valid: true };
}

/**
 * Validates file exists at given path
 * @param {string} filePath - The file path to check
 * @param {string} errorMessage - Custom error message
 * @returns {Object} Validation result {valid: boolean, message: string}
 */
function validateFileExists(filePath, errorMessage = 'File not found') {
  const fs = require('fs');
  
  if (!filePath) {
    return { valid: false, message: 'File path is required' };
  }
  
  if (!fs.existsSync(filePath)) {
    return { valid: false, message: errorMessage };
  }
  
  return { valid: true };
}

/**
 * Validates render filter options
 * @param {Object} filters - The filter options
 * @returns {Object} Validation result {valid: boolean, message: string, sanitizedFilters: Object}
 */
function validateRenderFilters(filters) {
  if (!filters) {
    return { valid: false, message: 'Filter options are required' };
  }
  
  const sanitizedFilters = {};
  
  // Title validation
  if (filters.title) {
    if (typeof filters.title !== 'object') {
      return { valid: false, message: 'Title filter must be an object' };
    }
    
    if (!filters.title.text) {
      return { valid: false, message: 'Title text is required' };
    }
    
    sanitizedFilters.title = {
      text: String(filters.title.text),
      fontSize: filters.title.fontSize ? Number(filters.title.fontSize) : 24,
      fontColor: filters.title.fontColor || 'white',
      backgroundColor: filters.title.backgroundColor || 'black@0.5',
      position: filters.title.position || 'center',
      duration: filters.title.duration ? Number(filters.title.duration) : 5
    };
  }
  
  // Audio track validation
  if (filters.audioTrack) {
    if (!filters.audioTrack.startsWith('/temp/music/')) {
      return { valid: false, message: 'Invalid audio track path' };
    }
    
    sanitizedFilters.audioTrack = filters.audioTrack;
  }
  
  // Fade validation
  if (filters.fadeIn !== undefined) {
    const fadeIn = Number(filters.fadeIn);
    if (isNaN(fadeIn) || fadeIn < 0) {
      return { valid: false, message: 'Fade in must be a positive number' };
    }
    sanitizedFilters.fadeIn = fadeIn;
  }
  
  if (filters.fadeOut !== undefined) {
    const fadeOut = Number(filters.fadeOut);
    if (isNaN(fadeOut) || fadeOut < 0) {
      return { valid: false, message: 'Fade out must be a positive number' };
    }
    sanitizedFilters.fadeOut = fadeOut;
  }
  
  return { 
    valid: true, 
    sanitizedFilters: Object.keys(sanitizedFilters).length > 0 ? sanitizedFilters : filters 
  };
}

/**
 * Applies validation and returns appropriate HTTP response
 * @param {Object} validation - Validation result from a validation function
 * @param {Object} res - Express response object
 * @returns {boolean} false if validation failed and response was sent, true if validation passed
 */
function handleValidation(validation, res) {
  if (!validation.valid) {
    res.status(400).json({ error: validation.message });
    return false;
  }
  return true;
}

module.exports = {
  validateRequired,
  validateId,
  validateFileExists,
  validateRenderFilters,
  handleValidation
}; 