**WARNING: Vibecoded by Bitpaint (a bicycle mecanic)**

# Gource-Tools

Complete application to visualize, customize, and export Git repository evolution visualizations using Gource.

---

## Overview

Gource-Tools is an integrated solution for creating advanced Gource visualizations of Git projects. It allows managing multiple repositories, customizing renderings, and generating high-quality videos with post-processing options.

The application provides an intuitive user interface to configure Gource visualizations without needing to master command lines, while still allowing for advanced customizations.

---

## Technical Architecture

### Application Structure

The application follows a client-server architecture:

*   **Frontend**: React application (`client/`) providing a complete user interface.
*   **Backend**: Node.js Express server (`server/`) managing Git, Gource, and FFmpeg operations.

### Backend (`server/`)

The server structure follows a layered architecture:

1.  **Routes**: Define API endpoints (e.g., `/api/repositories`, `/api/projects`). Found in `server/routes/`.
2.  **Controllers**: Handle HTTP requests and coordinate operations. Found in `server/controllers/`.
3.  **Services**: Contain the main business logic (Git operations, Gource/FFmpeg execution, data manipulation). Found in `server/services/`.
4.  **Utilities**: Provide cross-cutting functionalities (database access, logging). Found in `server/utils/`.
5.  **Config**: Contains server configuration files (default settings, system profiles). Found in `server/config/`.

#### Core Services

*   `repositoryService.js`: Management and validation of Git repositories.
*   `projectService.js`: Organization of repositories into coherent projects.
*   `renderService.js`: Execution and management of Gource renderings.
*   `ffmpegService.js`: Video post-processing and effects application.
*   `gourceConfigService.js`: Management of Gource configuration profiles.
*   `settingsService.js`: Global application configuration.

#### Key Utilities

*   `Database.js`: Singleton for data persistence with LowDB.
*   `Logger.js`: Structured logging system.
*   `ErrorHandler.js`: Centralized error management.
*   `processUtils.js`: Utilities for process management (e.g., killing process trees).

### Frontend (`client/`)

The user interface is organized into functional pages (`client/src/pages/`):

*   `DashboardPage`: Overview of repositories, projects, and renderings.
*   `RepositoriesPage`: Management of Git repositories.
*   `ProjectsPage`: Organization of repositories into projects.
*   `ConfigFilesPage`: Creation and modification of render profiles.
*   `RenderPage`: Launching and monitoring renderings.
*   `FFmpegEditorPage`: Video post-processing.
*   `ExportsPage`: Viewing completed renderings.
*   `SettingsPage`: Global configuration.

Reusable UI components are located in `client/src/components/`.
API communication logic is centralized in `client/src/api/api.js`.
Shared configuration between client and server can be found in `client/src/shared/`.

### Data Storage

The application uses LowDB, a lightweight JSON-based database stored in `db/db.json`.

*   **Main Collections**:
    *   `repositories`: Imported Git repositories.
    *   `projects`: Groupings of repositories for visualization.
    *   `renderProfiles`: Custom Gource configurations.
    *   `renders`: History and status of renderings.
    *   `settings`: Global configuration (API tokens, preferences).

### Rendering Process

The visualization process follows these steps:

1.  **Log Generation**: Extraction of Git histories.
2.  **Log Combination**: Merging histories for multi-repository projects.
3.  **Gource Execution**: Application of visualization parameters.
4.  **Video Capture**: Recording the rendering with FFmpeg.
5.  **Post-processing** (optional): Applying effects, adding music, etc.

---

## Key Features

### 1. Git Repository Management

*   Import local repositories.
*   Clone remote repositories (GitHub, GitLab, etc.).
*   Bulk import all repositories from a GitHub user.
*   Automatic repository validation.

### 2. Project Organization

*   Flexible grouping of repositories.
*   Creation of multi-repository visualizations.
*   Association of default render profiles.

### 3. Gource Configuration Profiles

*   Creation and reuse of custom configurations.
*   Full parameterization of Gource options.
*   **System Profiles**: Includes four pre-configured profiles: "Everything in 1 min", "Last Week in 1 min", "Last Month in 1 min", and "Last Year in 1 min". These profiles automatically calculate the start date and visualization speed (`secondsPerDay`) to fit the desired timeframe and video duration. System profiles cannot be edited or deleted.
*   **User Profiles**: Users can create, edit, and delete their own custom profiles.
*   **Default Profile**: The "Everything in 1 min" profile serves as the default application-wide profile. It is automatically selected when creating a new project if no other default is specified. Users can designate any other profile (system or user) as the default for new projects via the "Config Files" page.
*   **Removal of Old Defaults**: The previous "Default Gource Config File" and "Realtime Overview" profiles have been removed.
*   **Duplication**: Any profile can be duplicated to create a new customizable user profile.
*   **Enhanced Input Controls**: All date inputs provide intuitive YYYY-MM-DD formatting, numeric fields can be completely cleared, and values are only validated when needed.

### 4. Rendering and Visualization

*   Generation of custom visualizations.
*   Log combination for multi-repository projects.
*   Real-time monitoring of the rendering process.

### 5. Video Post-processing

*   Adding titles, texts, and effects.
*   Incorporating music.
*   Transition effects (fade-in, fade-out).
*   Video quality optimization.

### 6. Export and Sharing

*   Generation of high-quality MP4 videos.
*   Rendering previews.
*   Management of exported files.

---

## Detailed Workflow

### 1. Importing Repositories

The application supports several import methods:

*   **Local Repositories**: Selecting a folder containing a Git repository.
*   **Remote Repositories**: Cloning via URL (HTTPS or SSH).
*   **GitHub Bulk Import**: Retrieving all repositories from a user or organization.

Each repository is verified to ensure it contains a valid Git history and is registered in the database.

### 2. Creating Projects

Projects allow grouping repositories for a common visualization:

1.  Selection of one or more repositories.
2.  Configuration of a default render profile (optional).
3.  Configuration of a render profile (the application's default profile is pre-selected).
4.  Customization of metadata (name, description).

### 3. Gource Configuration

The application allows customizing all aspects of Gource visualizations:

*   **Visual Appearance**: Colors, element sizes, visual effects.
*   **Camera Behavior**: Zoom, rotation, user tracking.
*   **Information Display**: Legends, dates, titles, file names.
*   **Filtering**: By extension, user, time period.
*   **Advanced Settings**: Performance, quality, specific behaviors.

Configurations can be saved as reusable profiles.
System profiles provide quick presets for common timeframes, while user profiles allow full customization. The configuration management page allows creating, duplicating, deleting (user profiles only), and setting any profile as the application default (initially "Everything in 1 min"). The table view truncates long descriptions and shows dynamic speeds (`'auto'`) correctly.

#### User Interface Enhancements

The configuration interface includes several user experience improvements:

*   **Intuitive Date Inputs**: Date fields use a simplified YYYY-MM-DD format with automatic formatting as you type, eliminating the need for browser date pickers.
*   **Relative Date Options**: Start dates can be configured relative to the current date (e.g., "30 days from today") for dynamic visualizations.
*   **Flexible Numeric Inputs**: All numeric settings can be completely cleared rather than being forced to default values, providing more control.
*   **Clear Visual Feedback**: Each field provides appropriate visual feedback when being modified or when containing invalid values.
*   **Comprehensive Help**: Every setting includes detailed tooltips explaining its function, accepted values, and effect on the visualization.

### 4. Rendering Process

The rendering of a visualization follows these steps:

1.  **Preparation**: Creation of an isolated execution environment.
2.  **Log Generation**: Extraction of the *complete* Git histories for all selected repositories.
3.  **Log Combination**: Merging histories for multi-repository projects, prefixing file paths to avoid conflicts.
4.  **Parameter Calculation**: If using a dynamic profile, calculates the effective start date and `secondsPerDay` based on the full log and profile settings (e.g., `relative-30d`, `auto-60s`).
5.  **Gource Configuration**: Application of selected profile parameters, including calculated dynamic values. Time filtering (start/stop dates) is applied here via Gource arguments, not during log generation.
6.  **Rendering**: Execution of Gource using the combined log and final parameters, with capture via FFmpeg.
7.  **Finalization**: Saving metadata and the video file.

**Note on Multi-Repository Projects**: Logs are merged with file path prefixing to avoid conflicts.

**Note on Rendering Pipeline**: The pipeline generates full logs first and applies time filters via Gource arguments.

### 5. FFmpeg Post-processing

After the initial rendering, effects can be applied:

*   Adding texts and titles.
*   Incorporating audio tracks.
*   Transition effects (fade-in/out).
*   Image quality optimization.

A real-time preview allows refining parameters before final application.

---

## Installation

### Prerequisites

*   **Node.js** (v14+ recommended)
*   **Git** (v2.x+)
*   **Gource** (v0.51+)
*   **FFmpeg** (v4.x+)

Ensure `git`, `gource`, and `ffmpeg` are available in your system's PATH.

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/Gource-Tools.git # Replace with actual URL if different
    cd Gource-Tools
    ```

2.  **Install server dependencies:**
    ```bash
    cd server
    npm install
    ```

3.  **Install client dependencies:**
    ```bash
    cd ../client
    npm install
    ```

4.  **Create `.env` file:**
    Create a file named `.env` in the root directory of the project (where `server/` and `client/` are).
    Add the following content:
    ```dotenv
    # Port for the backend server
    PORT=5000

    # Optional: GitHub token for bulk import (requires 'repo' scope)
    GITHUB_TOKEN=
    ```
    You can generate a GitHub token [here](https://github.com/settings/tokens).

### Launching

1.  **Start the server:**
    ```bash
    cd server
    npm start
    ```

2.  **Start the client (in another terminal):**
    ```bash
    cd client
    npm start
    ```

3.  **Access the application:**
    Open your web browser and navigate to `http://localhost:3000` (or the port specified by React).

---

## Database

The application uses LowDB to store data in a JSON file (`db/db.json`). Main collections:

*   `repositories`: Imported Git repositories, with metadata and local paths.
*   `projects`: Groupings of repositories, with references to repository IDs.
*   `renderProfiles`: Saved Gource configurations.
*   `renders`: History of renderings with statuses and metadata.
*   `settings`: Global configuration (API tokens, preferences).

The implementation uses a singleton (`Database.js`) to ensure consistent access to the database.

---

## Component Documentation

This section details the purpose and functionality of key files within the application.

### Server (`server/`)

*   **`index.js`**: Main entry point for the backend server. Initializes Express, middleware, database, routes, and starts the server.
*   **`purge.js`**: Standalone script (`npm run purge` from `server/`) to delete the database file (`db/db.json`) and clean temporary/output directories (`logs/`, `exports/`, `repos/`, `temp/`).

#### Routes (`server/routes/`)

*   `repositories.js`: Handles API requests related to Git repositories (add, get, delete, bulk import, status checks).
*   `projects.js`: Handles API requests for managing projects (groups of repositories).
*   `configFiles.js`: Handles API requests for managing Gource render profiles (CRUD operations).
*   `renders.js`: Handles API requests for starting, monitoring, and managing Gource render processes.
*   `settings.js`: Handles API requests for managing application settings (e.g., GitHub token).

#### Controllers (`server/controllers/`)

*   `RepositoryController.js`: Contains the logic for handling repository-related HTTP requests, interacting with `RepositoryService` and `Database`.
*   `ProjectController.js`: Logic for handling project-related HTTP requests, using `ProjectService`.
*   `ConfigController.js`: Logic for handling Gource configuration profile requests, using `GourceConfigService`.
*   `RenderController.js`: Logic for handling render requests (start, status), using `RenderService` and `FFmpegService`.
*   `SettingsController.js`: Logic for handling settings requests, using `SettingsService`.

#### Services (`server/services/`)

*   `repositoryService.js`: Core logic for Git operations (cloning, validation, log generation) and repository data management.
*   `projectService.js`: Core logic for creating, updating, deleting, and retrieving project data.
*   `renderService.js`: Manages the entire Gource rendering pipeline, including log combination, Gource execution via `child_process`, status updates, and interaction with `FFmpegService`.
*   `ffmpegService.js`: Handles video post-processing using FFmpeg (adding audio, titles, effects, generating previews).
*   `gourceConfigService.js`: Manages the retrieval and creation of Gource render profiles stored in the database.
*   `settingsService.js`: Manages loading, saving, and validating application settings (GitHub token, default profile ID).

#### Utilities (`server/utils/`)

*   `Database.js`: Implements the Singleton pattern for accessing the LowDB database instance. Provides common DB operations and initial setup.
*   `Logger.js`: Provides a structured logging utility with different levels (info, warn, error, success, etc.) and component-specific loggers.
*   `ErrorHandler.js`: (If present) Centralized utility for handling and formatting errors consistently for API responses.
*   `processUtils.js`: Contains utilities for managing external processes, specifically `killProcessTree` for forcefully terminating Gource/FFmpeg processes.

#### Config (`server/config/`)

*   `defaultGourceConfig.js`: *Deprecated*. Defines the old default Gource settings (no longer used for initialization).
*   `customRenderProfiles.js`: Defines the system pre-configured render profiles (e.g., "Last Week", "Everything in 1min"). This is the source of truth for system profiles.
*   `initRenderProfiles.js`: Script run on server start to ensure system profiles from `customRenderProfiles.js` exist in the database.

### Client (`client/`)

#### API (`client/src/api/`)

*   `api.js`: Centralizes all communication with the backend API using Axios. Defines functions for each API endpoint.

#### Pages (`client/src/pages/`)

*   `DashboardPage.js`: Main landing page, displays summary statistics and recent activity.
*   `RepositoriesPage.js`: UI for viewing, adding (single/bulk), and deleting Git repositories.
*   `ProjectsPage.js`: UI for creating, viewing, editing, and deleting projects (groups of repositories).
*   `ConfigFilesPage.js`: UI for managing Gource render profiles (viewing, creating, editing, deleting).
*   `RenderPage.js`: UI for selecting a project and render profile to start a new Gource render, and monitoring progress.
*   `FFmpegEditorPage.js`: UI for applying post-processing effects (titles, audio, fades) to completed renders using FFmpeg.
*   `ExportsPage.js`: UI for viewing and managing completed video exports.
*   `SettingsPage.js`: UI for managing application settings (e.g., GitHub token).

#### Components (`client/src/components/`)

*   Contains reusable React components used across different pages (e.g., `GourcePreview.js`, form elements like `ColorPickerField.js`, `TooltipSlider.js`).

### Shared (`client/src/shared/`)

*   `gourceConfig.js`: Contains shared logic and data structures related to Gource configuration, used by both frontend and backend (e.g., mapping Gource options, parameter descriptions, argument conversion).

---

## Recent Changes

*   Corrected parameter mapping between camelCase and kebab-case formats.
*   Improved parameter validation.
*   Implemented dynamic system profiles ("Everything in 1 min", "Last Week/Month/Year in 1 min") with automatic date and speed calculation.
*   Fixed date formatting for Gource arguments.
*   Refactored rendering pipeline to generate full logs first and apply time filters via Gource arguments.
*   Improved default profile management: "Everything in 1 min" is the initial default, but any profile can be set as default, it's pre-selected on project creation, and initialized correctly on first launch.
*   Added profile duplication functionality.
*   Corrected UI inconsistencies (Edit/Delete buttons disabled for system profiles, dynamic SPD display).
*   Ensured system profiles are updated correctly on server start to maintain consistency.
*   Removed old, unused default profile definitions and initialization logic.
*   Fixed `convertToGourceArgs` to correctly handle the `settings.hide` array.
*   Updated `purge.js` to delete the database file correctly.
*   Fixed `settingsService.js` initialization logic.
*   Ensured consistent behavior across server startup, purge, and UI regarding default profiles.

---

## License

MIT 