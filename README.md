# Gource Tools

<div align="center">
  <img src="client/public/Gourcetools.png" alt="Gource Tools Logo" width="200">
  <h3>A modern UI for creating and customizing Gource visualizations</h3>
</div>

## 🚀 Overview

**Gource-Tools** is a comprehensive application designed to simplify the creation of Gource visualizations for Git repositories. It provides a user-friendly interface to manage repositories, configure visualization parameters, and export high-quality video renderings.

![Gource Tools Screenshot](https://github.com/bitpaint/Gource-Tools/raw/main/client/public/Gourcetools.png)

## ✨ Features

* **Repository Management**  
   * Clone and manage multiple Git repositories  
   * Group repositories into projects  
   * Sync repositories with remote sources  
   * Organize with tags and search functionality
* **Project Organization**  
   * Create projects with multiple repositories  
   * Configure project-specific visualization settings  
   * Manage repository relationships
* **Modern Architecture**  
   * React + Material UI frontend  
   * Node.js + Express backend  
   * LowDB database for data persistence  
   * Clean separation of concerns

## 🔧 Installation

### Prerequisites

* Node.js 16+
* Git installed on your system
* Gource installed (for rendering)
* FFmpeg installed (for video generation)

### Setup

```bash
# Clone the repository
git clone https://github.com/bitpaint/Gource-Tools.git
cd Gource-Tools

# Install dependencies
npm install

# Start development servers
npm run dev
```

This will start both the frontend and backend servers in development mode.

## 📦 Project Structure

```
Gource-Tools/
├── client/             # Frontend React application
│   ├── public/         # Static assets
│   └── src/            # React source code
├── server/             # Backend Express application
│   ├── routes/         # API routes
│   └── index.js        # Main server file
├── exports/            # Generated video outputs
├── logs/               # Log files
├── repos/              # Cloned repositories
└── db/                 # Database files
```

## 🤝 Contributing

Contributions, issues and feature requests are welcome! Feel free to check the [issues page](https://github.com/bitpaint/Gource-Tools/issues).

## 📝 License

This project is [MIT](https://opensource.org/licenses/MIT) licensed.

---

<div align="center">
  <p>
    <a href="https://github.com/bitpaint/Gource-Tools">
      <img src="https://img.shields.io/badge/GitHub-Gource%20Tools-blue?style=for-the-badge&logo=github" alt="GitHub - Gource Tools">
    </a>
  </p>
  <p>Made with ❤️ for the Git visualization community</p>
</div> 