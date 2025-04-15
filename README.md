# Gource-Tools

Complete application to visualize, customize, and export Git repository evolution visualizations with Gource.

## Overview

Gource-Tools is an integrated solution for creating advanced Gource visualizations of Git projects. It allows managing multiple repositories, customizing renderings, and generating high-quality videos with post-processing options.

The application provides an intuitive user interface to configure Gource visualizations without needing to master command lines, while still allowing for advanced customizations.

## Technical Architecture

### Application Structure

The application follows a client-server architecture:

- **Frontend**: React application with a complete user interface
- **Backend**: Node.js Express server managing Git, Gource, and FFmpeg operations

### Backend (Node.js/Express)

The server structure follows a layered architecture:

1.  **Routes**: Define API endpoints (`/api/repositories`, `/api/projects`, `/api/renderProfiles`, etc.)
2.  **Controllers**: Handle HTTP requests and coordinate operations
3.  **Services**: Contain the main business logic
4.  **Utilities**: Provide cross-cutting functionalities

#### Core Services

-   **repositoryService.js**: Management and validation of Git repositories
-   **projectService.js**: Organization of repositories into coherent projects
-   **renderService.js**: Execution and management of Gource renderings
-   **ffmpegService.js**: Video post-processing and effects application
-   **gourceConfigService.js**: Management of Gource configuration profiles
-   **settingsService.js**: Global application configuration

#### Key Utilities

-   **Database.js**: Singleton for data persistence with LowDB
-   **Logger.js**: Structured logging system
-   **ErrorHandler.js**: Centralized error management
-   **processUtils.js**: Utilities for process management

### Frontend (React)

The user interface is organized into functional pages:

-   **DashboardPage**: Overview of repositories, projects, and renderings
-   **RepositoriesPage**: Management of Git repositories
-   **ProjectsPage**: Organization of repositories into projects
-   **ConfigFilesPage**: Creation and modification of render profiles
-   **RenderPage**: Launching and monitoring renderings
-   **FFmpegEditorPage**: Video post-processing
-   **ExportsPage**: Viewing completed renderings
-   **SettingsPage**: Global configuration

### Data Storage

The application uses LowDB, a lightweight JSON-based database:

-   **Main Collections**:
    -   `repositories`: Imported Git repositories
    -   `projects`: Groupings of repositories for visualization
    -   `renderProfiles`: Custom Gource configurations
    -   `renders`: History and status of renderings
    -   `settings`: Global configuration

### Rendering Process

The visualization process follows these steps:

1.  **Log Generation**: Extraction of Git histories
2.  **Log Combination**: Merging histories for multi-repository projects
3.  **Gource Execution**: Application of visualization parameters
4.  **Video Capture**: Recording the rendering with FFmpeg
5.  **Post-processing** (optional): Applying effects, adding music, etc.

## Key Features

### 1. Git Repository Management

-   Import local repositories
-   Clone remote repositories (GitHub, GitLab, etc.)
-   Bulk import all repositories from a GitHub user
-   Automatic repository validation

### 2. Project Organization

-   Flexible grouping of repositories
-   Creation of multi-repository visualizations
-   Association of default render profiles

### 3. Gource Configuration Profiles

-   Creation and reuse of custom configurations
-   Full parameterization of Gource options
-   Built-in profiles for specific time periods (week, month, year)

### 4. Rendering and Visualization

-   Generation of custom visualizations
-   Log combination for multi-repository projects
-   Real-time monitoring of the rendering process

### 5. Video Post-processing

-   Adding titles, texts, and effects
-   Incorporating music
-   Transition effects (fade-in, fade-out)
-   Video quality optimization

### 6. Export and Sharing

-   Generation of high-quality MP4 videos
-   Rendering previews
-   Management of exported files

## Detailed Workflow

### 1. Importing Repositories

The application supports several import methods:

-   **Local Repositories**: Selecting a folder containing a Git repository
-   **Remote Repositories**: Cloning via URL (HTTPS or SSH)
-   **GitHub Bulk Import**: Retrieving all repositories from a user or organization

Each repository is verified to ensure it contains a valid Git history and is registered in the database.

### 2. Creating Projects

Projects allow grouping repositories for a common visualization:

1.  Selection of one or more repositories
2.  Configuration of a default render profile (optional)
3.  Customization of metadata (name, description)

### 3. Gource Configuration

The application allows customizing all aspects of Gource visualizations:

-   **Visual Appearance**: Colors, element sizes, visual effects
-   **Camera Behavior**: Zoom, rotation, user tracking
-   **Information Display**: Legends, dates, titles, file names
-   **Filtering**: By extension, user, time period
-   **Advanced Settings**: Performance, quality, specific behaviors

Configurations can be saved as reusable profiles.

### 4. Rendering Process

The rendering of a visualization follows these steps:

1.  **Preparation**: Creation of an isolated execution environment
2.  **Log Generation**: Extraction of Git histories with appropriate formatting
3.  **Gource Configuration**: Application of selected profile parameters
4.  **Rendering**: Execution of Gource with capture via FFmpeg
5.  **Finalization**: Saving metadata and the video file

For multi-repository projects, logs are merged with file path prefixing.

### 5. FFmpeg Post-processing

After the initial rendering, effects can be applied:

-   Adding texts and titles
-   Incorporating audio tracks
-   Transition effects (fade-in/out)
-   Image quality optimization

A real-time preview allows refining parameters before final application.

## Installation

### Prerequisites

-   **Node.js** (v14+)
-   **Git** (v2.x+)
-   **Gource** (v0.51+)
-   **FFmpeg** (v4.x+)

### Setup

1.  Clone the repository
    ```bash
    git clone https://github.com/your-username/Gource-Tools.git
    cd Gource-Tools
    ```

2.  Install server dependencies
    ```bash
    cd server
    npm install
    ```

3.  Install client dependencies
    ```bash
    cd ../client
    npm install
    ```

4.  Create a `.env` file in the root directory with necessary environment variables
    ```
    PORT=5000
    GITHUB_TOKEN=your_github_token (optional, for bulk import)
    ```

### Launching

1.  Start the server
    ```bash
    cd server
    npm start
    ```

2.  Start the client (in another terminal)
    ```bash
    cd client
    npm start
    ```

3.  Access the application via `http://localhost:3000`

## Database

The application uses LowDB to store data in a JSON file (`/db/db.json`). Main collections:

-   **repositories**: Imported Git repositories, with metadata and local paths
-   **projects**: Groupings of repositories, with references to repository IDs
-   **renderProfiles**: Saved Gource configurations
-   **renders**: History of renderings with statuses and metadata
-   **settings**: Global configuration (API tokens, preferences)

The implementation uses a singleton (`Database.js`) to ensure consistent access to the database.

## Recent Changes

### June 2023: Configuration Issues Fixed

-   Corrected parameter mapping between camelCase and kebab-case formats
-   Improved parameter validation
-   Fixed predefined profiles (Last Week, Last Month, Last Year)
-   Enhanced cross-platform support

### May 2023: Multi-Repository Visualization

-   Support for visualizing multiple repositories in a single rendering
-   Clear identification of repositories in the visualization
-   Unified timeline for all repositories

### April 2023: Enhanced Gource Configuration

-   New customization parameters
-   Improved user interface with sliders and color pickers
-   Better organization of parameters into thematic tabs

## License

MIT 