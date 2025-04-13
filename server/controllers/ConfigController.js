/**
 * Config Controller
 * Handles HTTP requests related to render profile configurations
 */

const GourceConfigService = require('../services/GourceConfigService');
const Validator = require('../validators/RequestValidator');

/**
 * Validate and fix numeric values in Gource config
 * @param {Object} settings - Gource settings to validate and fix
 * @returns {Object} Validated and fixed settings
 */
function validateAndFixSettings(settings) {
  if (!settings) return settings;
  
  const fixedSettings = { ...settings };
  
  // List of numeric parameters
  const numericParams = [
    'seconds-per-day', 'auto-skip-seconds', 'elasticity', 
    'font-scale', 'user-scale', 'time-scale', 'file-scale', 'dir-size',
    'max-file-lag', 'bloom-intensity', 'bloom-multiplier', 'framerate',
    'max-user-count', 'font-size', 'filename-font-size', 'dirname-font-size', 'user-font-size'
  ];
  
  // List of boolean parameters that use 0/1
  const booleanParams = [
    'highlight-users', 'bloom', 'multi-sampling'
  ];
  
  // List of boolean parameters that are flags
  const flagParams = [
    'title', 'key', 'show-dates', 'disable-progress', 'disable-auto-rotate',
    'show-files', 'follow-users', 'hide-root', 'swap-title-date'
  ];
  
  // Ensure title is always defined correctly
  if (fixedSettings['title'] === undefined) {
    fixedSettings['title'] = true;
  }
  
  // Ensure background color is defined correctly
  if (!fixedSettings['background-colour'] && !fixedSettings['background']) {
    fixedSettings['background-colour'] = '000000';
  }
  
  // Validate and fix numeric values
  for (const [key, value] of Object.entries(fixedSettings)) {
    // Skip empty or undefined values
    if (value === '' || value === null || value === undefined) continue;
    
    // Convert and validate numeric values
    if (numericParams.includes(key)) {
      if (typeof value === 'string') {
        fixedSettings[key] = parseFloat(value.toString().replace(',', '.'));
      }
      
      // Check if it's a valid number
      if (isNaN(fixedSettings[key])) {
        // Default values for numeric parameters
        switch (key) {
          case 'seconds-per-day': fixedSettings[key] = 1; break;
          case 'auto-skip-seconds': fixedSettings[key] = 0.1; break;
          case 'elasticity': fixedSettings[key] = 0.3; break;
          case 'font-scale': fixedSettings[key] = 1.0; break;
          case 'user-scale': fixedSettings[key] = 1.0; break;
          case 'time-scale': fixedSettings[key] = 1.0; break;
          case 'file-scale': fixedSettings[key] = 1.0; break;
          case 'dir-size': fixedSettings[key] = 1.0; break;
          case 'max-file-lag': fixedSettings[key] = 0.5; break;
          case 'bloom-intensity': fixedSettings[key] = 0.4; break;
          case 'bloom-multiplier': fixedSettings[key] = 0.7; break;
          case 'framerate': fixedSettings[key] = 60; break;
          case 'max-user-count': fixedSettings[key] = 0; break;
          case 'font-size': fixedSettings[key] = 16; break;
          case 'filename-font-size': fixedSettings[key] = 14; break;
          case 'dirname-font-size': fixedSettings[key] = 14; break;
          case 'user-font-size': fixedSettings[key] = 14; break;
          default: fixedSettings[key] = 0; break;
        }
      }
      
      // Specific validations for certain parameters
      if (key === 'seconds-per-day' && fixedSettings[key] <= 0) {
        fixedSettings[key] = 1;
      }
      if (key === 'elasticity' && (fixedSettings[key] < 0 || fixedSettings[key] > 1)) {
        fixedSettings[key] = 0.3;
      }
      if ((key === 'bloom-intensity' || key === 'bloom-multiplier') && 
          (fixedSettings[key] < 0 || fixedSettings[key] > 1)) {
        fixedSettings[key] = key === 'bloom-intensity' ? 0.4 : 0.7;
      }
    }
    
    // Convert and validate boolean values
    else if (booleanParams.includes(key)) {
      if (typeof value === 'boolean') {
        fixedSettings[key] = value ? 1 : 0;
      } else if (value === 'true' || value === '1' || value === 1) {
        fixedSettings[key] = 1;
      } else if (value === 'false' || value === '0' || value === 0) {
        fixedSettings[key] = 0;
      }
    }
    
    // Handle boolean flag parameters
    else if (flagParams.includes(key)) {
      if (typeof value === 'string') {
        fixedSettings[key] = value === 'true' || value === '1';
      } else if (typeof value !== 'boolean') {
        // Convert to boolean if not already
        fixedSettings[key] = Boolean(value);
      }
    }
    
    // Process color values (remove # for Gource)
    else if (typeof value === 'string' && 
             (key.endsWith('-colour') || key === 'background-colour' || key === 'background')) {
      fixedSettings[key] = value.replace(/^#/, '');
    }
  }
  
  // Convert background to background-colour if necessary
  if (fixedSettings['background'] && !fixedSettings['background-colour']) {
    fixedSettings['background-colour'] = fixedSettings['background'];
    delete fixedSettings['background'];
  }
  
  // Ensure title is always defined if missing
  if (fixedSettings['title'] === undefined) {
    fixedSettings['title'] = true;
  }
  
  return fixedSettings;
}

/**
 * Get all render profiles
 */
const getAllRenderProfiles = (req, res) => {
  try {
    const renderProfiles = GourceConfigService.getAllRenderProfiles();
    res.json(renderProfiles);
  } catch (error) {
    console.error('Error fetching render profiles:', error);
    res.status(500).json({ error: 'Failed to fetch render profiles' });
  }
};

/**
 * Get a render profile by ID
 */
const getRenderProfileById = (req, res) => {
  try {
    const validation = Validator.validateId(req.params.id);
    if (!Validator.handleValidation(validation, res)) return;
    
    const renderProfile = GourceConfigService.getRenderProfileById(req.params.id);
    
    if (!renderProfile) {
      return res.status(404).json({ error: 'Render profile not found' });
    }
    
    res.json(renderProfile);
  } catch (error) {
    console.error('Error fetching render profile by ID:', error);
    res.status(500).json({ error: 'Failed to fetch render profile' });
  }
};

/**
 * Create a new render profile
 */
const createRenderProfile = (req, res) => {
  try {
    const validation = Validator.validateRequired(req.body, ['name']);
    if (!Validator.handleValidation(validation, res)) return;
    
    const { name, description, settings } = req.body;
    
    // Validate and fix settings
    const validatedSettings = validateAndFixSettings(settings);
    
    // Create project using service
    const profileData = {
      name,
      description,
      settings: validatedSettings || {}
    };
    
    try {
      const newProfile = GourceConfigService.createRenderProfile(profileData);
      res.status(201).json(newProfile);
    } catch (serviceError) {
      // Handle service-specific errors
      return res.status(400).json({ error: serviceError.message });
    }
  } catch (error) {
    console.error('Error creating render profile:', error);
    res.status(500).json({ 
      error: 'Failed to create render profile', 
      details: error.message 
    });
  }
};

/**
 * Update a render profile
 */
const updateRenderProfile = (req, res) => {
  try {
    const idValidation = Validator.validateId(req.params.id);
    if (!Validator.handleValidation(idValidation, res)) return;
    
    const { name, description, settings } = req.body;
    
    // Check if render profile exists
    const renderProfile = GourceConfigService.getRenderProfileById(req.params.id);
    if (!renderProfile) {
      return res.status(404).json({ error: 'Render profile not found' });
    }
    
    // Protect default Gource config
    if (renderProfile.isDefault) {
      return res.status(403).json({ error: 'The default Gource config file cannot be modified' });
    }
    
    // Validate and fix settings
    const validatedSettings = validateAndFixSettings(settings);
    
    // Update profile using service
    const profileData = {
      name,
      description,
      settings: validatedSettings
    };
    
    try {
      const updatedProfile = GourceConfigService.updateRenderProfile(req.params.id, profileData);
      res.json(updatedProfile);
    } catch (serviceError) {
      // Handle service-specific errors
      return res.status(400).json({ error: serviceError.message });
    }
  } catch (error) {
    console.error('Error updating render profile:', error);
    res.status(500).json({ 
      error: 'Failed to update render profile', 
      details: error.message 
    });
  }
};

/**
 * Delete a render profile
 */
const deleteRenderProfile = (req, res) => {
  try {
    const validation = Validator.validateId(req.params.id);
    if (!Validator.handleValidation(validation, res)) return;
    
    // Check if render profile exists
    const renderProfile = GourceConfigService.getRenderProfileById(req.params.id);
    if (!renderProfile) {
      return res.status(404).json({ error: 'Render profile not found' });
    }
    
    // Protect default Gource config
    if (renderProfile.isDefault) {
      return res.status(403).json({ error: 'The default Gource config file cannot be deleted' });
    }
    
    try {
      // Delete render profile using service
      const result = GourceConfigService.deleteRenderProfile(req.params.id);
      
      if (result) {
        res.json({ message: 'Render profile deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete render profile' });
      }
    } catch (serviceError) {
      // Handle service-specific errors
      return res.status(400).json({ error: serviceError.message });
    }
  } catch (error) {
    console.error('Error deleting render profile:', error);
    res.status(500).json({ 
      error: 'Failed to delete render profile', 
      details: error.message 
    });
  }
};

module.exports = {
  getAllRenderProfiles,
  getRenderProfileById,
  createRenderProfile,
  updateRenderProfile,
  deleteRenderProfile,
  validateAndFixSettings
}; 