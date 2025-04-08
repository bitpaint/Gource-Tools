import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { getGitHubCredentials, isGitHubTokenValid } from '../utils/githubAuth';

// Path to .env file
const envPath = path.resolve(process.cwd(), '.env');

// Check if a GitHub token exists
export const checkGithubToken = async (req: Request, res: Response) => {
  try {
    // Check via githubAuth to get the token and its source
    let source = 'none';
    
    if (process.env.GITHUB_TOKEN) {
      source = 'env';
    } else {
      try {
        const tokenFromCredManager = await getGitHubCredentials();
        if (tokenFromCredManager) {
          // Determine the source of the token in the log message
          if (process.env.GITHUB_TOKEN) {
            source = 'env';
          } else if (process.env.GITHUB_CLI_TOKEN) {
            source = 'githubCLI';
          } else {
            source = 'gitCredentialManager';
          }
        }
      } catch (error) {
        console.error('Error retrieving token:', error);
      }
    }
    
    const token = await getGitHubCredentials();
    return res.json({ 
      hasToken: !!token,
      source: source
    });
  } catch (error) {
    console.error('Error checking GitHub token:', error);
    return res.status(500).json({ 
      error: 'Error checking GitHub token'
    });
  }
};

// Save a GitHub token in the .env file
export const saveGithubToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Missing token' });
    }
    
    // Read the current content of the .env file
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Replace or add the GITHUB_TOKEN variable
    const envLines = envContent.split('\n');
    
    // Supprimer les marqueurs spécifiques au GitHub token
    const filteredLines = envLines.filter(line => 
      !line.startsWith('GITHUB_TOKEN=') && 
      !line.startsWith('GITHUB_TOKEN_DISABLED=')
    );
    
    // Add the token
    filteredLines.push(`GITHUB_TOKEN=${token}`);
    
    // Write to the .env file
    fs.writeFileSync(envPath, filteredLines.join('\n'));
    
    // Reload environment variables
    process.env.GITHUB_TOKEN = token;
    delete process.env.GITHUB_TOKEN_DISABLED;
    dotenv.config();
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error saving GitHub token:', error);
    return res.status(500).json({ 
      error: 'Error saving GitHub token'
    });
  }
};

// Test if the GitHub token works correctly
export const testGithubToken = async (req: Request, res: Response) => {
  try {
    // Get the token
    const token = await getGitHubCredentials();
    
    if (!token) {
      return res.json({
        success: false,
        message: 'No GitHub token found'
      });
    }
    
    // Check if the token is valid with our new function
    const isValid = await isGitHubTokenValid(token);
    
    if (!isValid) {
      return res.json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Test the token by making a request to the GitHub API
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Gource-Tools-App',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        message: `Token valid! Connected as ${data.login}`,
        user: data.login,
        avatar: data.avatar_url
      });
    } else {
      const errorData = await response.json();
      return res.json({
        success: false,
        message: `Error: ${response.status} - ${errorData.message || 'Invalid token'}`
      });
    }
  } catch (error) {
    console.error('Error testing GitHub token:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing token'
    });
  }
};

// Supprimer le token GitHub du fichier .env
export const removeGithubToken = async (req: Request, res: Response) => {
  try {
    // Lire le contenu actuel du fichier .env
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Supprimer la ligne avec GITHUB_TOKEN
    const envLines = envContent.split('\n');
    const updatedEnvLines = envLines.filter(line => !line.startsWith('GITHUB_TOKEN='));
    
    // Ajouter un marqueur pour indiquer que le token a été explicitement désactivé
    updatedEnvLines.push('GITHUB_TOKEN_DISABLED=true');
    
    // Écrire dans le fichier .env
    fs.writeFileSync(envPath, updatedEnvLines.join('\n'));
    
    // Recharger les variables d'environnement
    delete process.env.GITHUB_TOKEN;
    process.env.GITHUB_TOKEN_DISABLED = 'true';
    dotenv.config();
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error removing GitHub token:', error);
    return res.status(500).json({ 
      error: 'Error removing GitHub token'
    });
  }
}; 