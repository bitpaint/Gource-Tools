/**
 * Types partagés entre le frontend et le backend
 */

/**
 * Interface représentant un projet Gource
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  lastModified: Date;
  repositories: Repository[];
  configuration: GourceConfig;
}

/**
 * Interface représentant un dépôt Git
 */
export interface Repository {
  id: string;
  name: string;
  url: string;
  localPath: string;
  branch: string;
  lastUpdated: Date;
}

/**
 * Interface représentant la configuration Gource
 */
export interface GourceConfig {
  speed: number;
  resolution: string;
  backgroundColor: string;
  avatarsEnabled: boolean;
  avatarSize: number;
  startDate?: Date;
  endDate?: Date;
  customOptions: string;
}

/**
 * Interface représentant un rendu Gource
 */
export interface Render {
  id: string;
  projectId: string;
  outputFormat: 'mp4' | 'webm' | 'gif';
  quality: 'low' | 'medium' | 'high';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  outputPath: string;
  createdAt: Date;
  duration: number;
}

/**
 * Interface représentant un avatar d'utilisateur
 */
export interface Avatar {
  id: string;
  email: string;
  username: string;
  imagePath: string;
} 