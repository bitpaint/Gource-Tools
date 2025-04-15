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
-   **Dynamic System Profiles**: Includes pre-configured profiles like "Everything in 1 min", "Last Week/Month/Year in 1 min". These profiles automatically calculate the start date and visualization speed (`secondsPerDay`) to fit the desired timeframe and video duration. System profiles cannot be edited or deleted.
-   **User Profiles**: Users can create, edit, and delete their own custom profiles.
-   **Default Profile Management**: Any profile (system or user) can be designated as the default for new projects via the "Config Files" page. The default profile is automatically selected when creating a new project.
-   **Duplication**: Any profile can be duplicated to create a new customizable user profile.
-   **Enhanced Input Controls**: All date inputs provide intuitive YYYY-MM-DD formatting, numeric fields can be completely cleared, and values are only validated when needed.

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
3.  Configuration of a render profile (the application's default profile is pre-selected).
4.  Customization of metadata (name, description)

### 3. Gource Configuration

The application allows customizing all aspects of Gource visualizations:

-   **Visual Appearance**: Colors, element sizes, visual effects
-   **Camera Behavior**: Zoom, rotation, user tracking
-   **Information Display**: Legends, dates, titles, file names
-   **Filtering**: By extension, user, time period
-   **Advanced Settings**: Performance, quality, specific behaviors

Configurations can be saved as reusable profiles.
System profiles provide quick presets for common timeframes, while user profiles allow full customization.
The configuration management page allows creating, duplicating, deleting (user profiles only), and setting any profile as the application default. The table view truncates long descriptions and shows dynamic speeds ('auto') correctly.

#### User Interface Enhancements

The configuration interface includes several user experience improvements:

- **Intuitive Date Inputs**: Date fields use a simplified YYYY-MM-DD format with automatic formatting as you type, eliminating the need for browser date pickers
- **Relative Date Options**: Start dates can be configured relative to the current date (e.g., "30 days from today") for dynamic visualizations
- **Flexible Numeric Inputs**: All numeric settings can be completely cleared rather than being forced to default values, providing more control
- **Clear Visual Feedback**: Each field provides appropriate visual feedback when being modified or when containing invalid values
- **Comprehensive Help**: Every setting includes detailed tooltips explaining its function, accepted values, and effect on the visualization

### 4. Rendering Process

The rendering of a visualization follows these steps:

1.  **Preparation**: Creation of an isolated execution environment
2.  **Log Generation**: Extraction of the *complete* Git histories for all selected repositories.
3.  **Log Combination**: Merging histories for multi-repository projects, prefixing file paths to avoid conflicts.
4.  **Parameter Calculation**: If using a dynamic profile, calculates the effective start date and `secondsPerDay` based on the full log and profile settings (e.g., "relative-30d", "auto-60s").
5.  **Gource Configuration**: Application of selected profile parameters, including calculated dynamic values. Time filtering (start/stop dates) is applied here via Gource arguments, not during log generation.
6.  **Rendering**: Execution of Gource using the combined log and final parameters, with capture via FFmpeg.
7.  **Finalization**: Saving metadata and the video file.

For multi-repository projects, logs are merged with file path prefixing.

Refactored rendering pipeline to generate full logs first and apply time filters via Gource arguments.
Improved default profile management: any profile can be set as default, it's pre-selected on project creation, and initialized correctly on first launch.
Added profile duplication functionality.
Corrected UI inconsistencies (Edit/Delete buttons disabled for system profiles, dynamic SPD display).
Ensured system profiles are updated correctly on server start to maintain consistency.

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

## Component Documentation

This section details the purpose and functionality of key files within the application.

### Server (`server/`)

- **`index.js`**: Main entry point for the backend server. Initializes Express, middleware, database, routes, and starts the server.
- **`purge.js`**: Standalone script to clean the database and remove temporary files/folders, preserving settings.

#### Routes (`server/routes/`)

- **`repositories.js`**: Handles API requests related to Git repositories (add, get, delete, bulk import, status checks).
- **`projects.js`**: Handles API requests for managing projects (groups of repositories).
- **`configFiles.js`**: Handles API requests for managing Gource render profiles (CRUD operations).
- **`renders.js`**: Handles API requests for starting, monitoring, and managing Gource render processes.
- **`settings.js`**: Handles API requests for managing application settings (e.g., GitHub token).

#### Controllers (`server/controllers/`)

- **`RepositoryController.js`**: Contains the logic for handling repository-related HTTP requests, interacting with `RepositoryService` and `Database`.
- **`ProjectController.js`**: Logic for handling project-related HTTP requests, using `ProjectService`.
- **`ConfigController.js`**: Logic for handling Gource configuration profile requests, using `GourceConfigService`.
- **`RenderController.js`**: Logic for handling render requests (start, status), using `RenderService` and `FFmpegService`.
- **`SettingsController.js`**: Logic for handling settings requests, using `SettingsService`.

#### Services (`server/services/`)

- **`repositoryService.js`**: Core logic for Git operations (cloning, validation, log generation) and repository data management.
- **`projectService.js`**: Core logic for creating, updating, deleting, and retrieving project data.
- **`renderService.js`**: Manages the entire Gource rendering pipeline, including log combination, Gource execution via `child_process`, status updates, and interaction with `FFmpegService`.
- **`ffmpegService.js`**: Handles video post-processing using FFmpeg (adding audio, titles, effects, generating previews).
- **`gourceConfigService.js`**: Manages the retrieval and creation of Gource render profiles stored in the database.
- **`settingsService.js`**: Manages loading, saving, and validating application settings (currently focused on the GitHub token in `.env`).

#### Utilities (`server/utils/`)

- **`Database.js`**: Implements the Singleton pattern for accessing the LowDB database instance. Provides common DB operations.
- **`Logger.js`**: Provides a structured logging utility with different levels (info, warn, error, success, etc.) and component-specific loggers.
- **`ErrorHandler.js`**: (If present) Centralized utility for handling and formatting errors consistently for API responses.
- **`processUtils.js`**: Contains utilities for managing external processes, specifically `killProcessTree` for forcefully terminating Gource/FFmpeg processes.

#### Config (`server/config/`)

- **`defaultGourceConfig.js`**: Defines the default Gource settings used when creating the initial database or default profile.
- **`customRenderProfiles.js`**: Defines additional pre-configured render profiles (e.g., "Last Week", "Everything in 1min").
- **`initRenderProfiles.js`**: Script run on server start to ensure default and custom profiles exist in the database.

### Client (`client/`)

#### API (`client/src/api/`)

- **`api.js`**: Centralizes all communication with the backend API using Axios. Defines functions for each API endpoint.

#### Pages (`client/src/pages/`)

- **`DashboardPage.js`**: Main landing page, displays summary statistics and recent activity.
- **`RepositoriesPage.js`**: UI for viewing, adding (single/bulk), and deleting Git repositories.
- **`ProjectsPage.js`**: UI for creating, viewing, editing, and deleting projects (groups of repositories).
- **`ConfigFilesPage.js`**: UI for managing Gource render profiles (viewing, creating, editing, deleting).
- **`RenderPage.js`**: UI for selecting a project and render profile to start a new Gource render, and monitoring progress.
- **`FFmpegEditorPage.js`**: UI for applying post-processing effects (titles, audio, fades) to completed renders using FFmpeg.
- **`ExportsPage.js`**: UI for viewing and managing completed video exports.
- **`SettingsPage.js`**: UI for managing application settings (e.g., GitHub token).

#### Components (`client/src/components/`)

- Contains reusable React components used across different pages (e.g., `GourcePreview.js`, form elements like `ColorPickerField.js`, `TooltipSlider.js`).

### Shared (`shared/`)

- **`gourceConfig.js`**: Contains shared logic and data structures related to Gource configuration, used by both frontend and backend (e.g., mapping Gource options, parameter descriptions, argument conversion).

## Recent Changes
---

-   Corrected parameter mapping between camelCase and kebab-case formats
-   Improved parameter validation
-   Implemented dynamic system profiles ("Everything in 1 min", "Last Week/Month/Year in 1 min") with automatic date and speed calculation.
-   Fixed date formatting for Gource arguments.
-   Refactored rendering pipeline to generate full logs first and apply time filters via Gource arguments.
-   Improved default profile management: any profile can be set as default, it's pre-selected on project creation, and initialized correctly on first launch.
-   Added profile duplication functionality.
-   Corrected UI inconsistencies (Edit/Delete buttons disabled for system profiles, dynamic SPD display).
-   Ensured system profiles are updated correctly on server start to maintain consistency.

---

-   Support for visualizing multiple repositories in a single rendering
-   Clear identification of repositories in the visualization
-   Unified timeline for all repositories

---

-   New customization parameters
-   Improved user interface with sliders and color pickers
-   Better organization of parameters into thematic tabs

## License

MIT 