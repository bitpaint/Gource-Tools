import { execSync } from 'child_process';
import axios from 'axios';

/**
 * Retrieves GitHub credentials from different sources:
 * 1. .env file (GITHUB_TOKEN)
 * 2. Git Credential Manager 
 * 3. GitHub CLI (gh)
 * 4. Returns null if no credential is found
 */
export async function getGitHubCredentials(): Promise<string | null> {
    // Vérifier si le token a été explicitement supprimé
    if (process.env.GITHUB_TOKEN_DISABLED === 'true') {
        console.log('GitHub token has been explicitly disabled by user');
        return null;
    }

    // 1. Check .env first
    if (process.env.GITHUB_TOKEN) {
        // Make sure it's not the masked token
        const token = process.env.GITHUB_TOKEN.trim();
        if (token.includes('•') || token.includes('*')) {
            console.log('Warning: Masked token detected in .env file. Please replace with actual token.');
            return null;
        }
        console.log('Using GitHub token from .env file');
        return token;
    }

    // Si aucun token n'est trouvé dans .env, on n'utilise pas les autres sources
    // pour éviter que le token ne revienne automatiquement après suppression
    return null;

    /* Anciennes méthodes désactivées pour respecter la suppression manuelle
    // 2. Try to get token from Git Credential Manager
    try {
        const output = execSync('git credential fill', {
            input: 'url=https://github.com\n\n',
            encoding: 'utf-8'
        });

        // Parse the output to get the token
        const match = output.match(/password=(.+)\n/);
        if (match && match[1]) {
            const token = match[1].trim();
            // Make sure it's not just bullets or other invalid characters
            if (token.includes('•') || token.includes('*') || token.length < 10) {
                console.log('Warning: Invalid token format detected in Git Credential Manager');
                return null;
            }
            console.log('Using GitHub credentials from Git Credential Manager');
            return token;
        }
    } catch (error) {
        console.log('Info: No GitHub credentials found in Git Credential Manager');
    }

    // 3. Try to use GitHub CLI if available
    try {
        const ghToken = await getGitHubTokenFromCLI();
        if (ghToken) {
            const token = ghToken.trim();
            // Validate token format
            if (token.includes('•') || token.includes('*') || token.length < 10) {
                console.log('Warning: Invalid token format detected from GitHub CLI');
                return null;
            }
            console.log('Using GitHub token from GitHub CLI');
            return token;
        }
    } catch (error) {
        console.log('Info: GitHub CLI not available or not authenticated');
    }
    */

    // 4. Return null to use unauthenticated API
    console.log('Warning: Using GitHub API without authentication (rate limit may apply)');
    return null;
}

/**
 * Checks if a GitHub token is valid
 */
export async function isGitHubTokenValid(token: string): Promise<boolean> {
    if (!token || token.includes('•') || token.includes('*') || token.length < 10) {
        console.log('Invalid token format');
        return false;
    }
    
    try {
        const response = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github+json',
                'User-Agent': 'Gource-Tools-App',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });
        return response.status === 200;
    } catch (error: any) {
        console.error('GitHub token validation error:', error.message || 'Unknown error');
        return false;
    }
}

/**
 * Creates GitHub API headers with authentication if available
 */
export async function createGitHubHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Gource-Tools-App',
        'X-GitHub-Api-Version': '2022-11-28'
    };

    const token = await getGitHubCredentials();
    if (token && !token.includes('•') && !token.includes('*') && token.length >= 10) {
        // Use Bearer format for newer tokens, but token format for older ones for compatibility
        headers['Authorization'] = token.startsWith('github_pat_') ? 
            `Bearer ${token}` : `token ${token}`;
    }

    return headers;
}

/**
 * Retrieves the GitHub token from GitHub CLI if available
 */
async function getGitHubTokenFromCLI(): Promise<string | null> {
    try {
        // Check if gh CLI is installed and authenticated
        const statusOutput = execSync('gh auth status', { encoding: 'utf-8' });
        if (statusOutput.includes('Logged in to github.com')) {
            // Get the token
            const tokenOutput = execSync('gh auth token', { encoding: 'utf-8' });
            return tokenOutput.trim();
        }
    } catch (error) {
        // gh CLI is not installed or not authenticated
    }
    return null;
} 