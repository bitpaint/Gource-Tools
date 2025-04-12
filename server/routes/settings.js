const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { Octokit } = require('@octokit/rest');

const envPath = path.resolve(__dirname, '../../.env');

// GET /api/settings
router.get('/', (req, res) => {
  try {
    // Vérifier si le fichier .env existe
    if (!fs.existsSync(envPath)) {
      return res.json({
        githubToken: '',
        tokenStatus: 'missing'
      });
    }
    
    // Lire le fichier .env actuel
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    const token = envConfig.GITHUB_TOKEN || '';
    
    // Vérifier si le token est valide
    let tokenStatus = 'unknown';
    if (!token) {
      tokenStatus = 'missing';
    } else if (token.length < 30) {
      tokenStatus = 'invalid_format';
    } else {
      tokenStatus = 'present'; // On vérifiera la validité lors de l'utilisation
    }
    
    // Renvoyer uniquement les paramètres pertinents
    res.json({
      githubToken: token,
      tokenStatus: tokenStatus
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// POST /api/settings
router.post('/', async (req, res) => {
  try {
    const { githubToken } = req.body;
    
    // Vérifier si le fichier .env existe, sinon le créer
    let envConfig = {};
    if (fs.existsSync(envPath)) {
      envConfig = dotenv.parse(fs.readFileSync(envPath));
    }
    
    // Vérifier si le token est valide en faisant un appel de test à l'API GitHub
    let tokenStatus = 'invalid';
    let message = '';
    
    if (githubToken && githubToken.length > 30) {
      try {
        const octokit = new Octokit({ auth: githubToken });
        const { data } = await octokit.users.getAuthenticated();
        
        if (data && data.login) {
          tokenStatus = 'valid';
          message = `Token validé pour l'utilisateur GitHub: ${data.login}`;
          console.log(message);
        }
      } catch (apiError) {
        tokenStatus = 'invalid';
        message = `Token GitHub invalide: ${apiError.message || 'Erreur de connexion à l\'API GitHub'}`;
        console.error(message);
      }
    } else if (githubToken === '') {
      tokenStatus = 'removed';
      message = 'Token GitHub supprimé';
    } else {
      message = 'Format de token invalide, veuillez fournir un token GitHub valide';
    }
    
    // Mettre à jour le token GitHub
    envConfig.GITHUB_TOKEN = githubToken;
    
    // Convertir en format .env
    const newEnv = Object.entries(envConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Écrire dans le fichier
    fs.writeFileSync(envPath, newEnv);
    
    // Mettre à jour les variables d'environnement dans le processus actuel
    process.env.GITHUB_TOKEN = githubToken;
    
    res.json({ 
      success: true, 
      tokenStatus, 
      message 
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings', details: error.message });
  }
});

module.exports = router; 