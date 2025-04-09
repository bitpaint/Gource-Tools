# Gource-Tools

![Version](https://img.shields.io/badge/version-0.3.0-blue.svg?cacheSeconds=2592000)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

> A modern UI for creating and customizing Gource visualizations

## 🚀 Overview

**Gource-Tools** is a comprehensive application designed to simplify the creation of Gource visualizations for Git repositories. It provides a user-friendly interface to manage repositories, configure visualization parameters, and export high-quality video renderings.

![Screenshot](./docs/screenshot.png)

## ✨ Features

- **Repository Management**
  - Clone and manage multiple Git repositories
  - Group repositories into projects
  - Sync repositories with remote sources
  - Organize with tags and search functionality

- **Project Organization**
  - Create projects with multiple repositories
  - Configure project-specific visualization settings
  - Manage repository relationships

- **Modern Architecture**
  - React + TypeScript frontend with styled-components
  - Node.js + Express backend
  - SQLite database for data persistence
  - Clean separation of concerns

- **Developer-friendly**
  - Comprehensive documentation
  - Well-structured codebase
  - Consistent naming conventions
  - Centralized type definitions

## 🔧 Installation

### Prerequisites

- Node.js 16+
- Git installed on your system
- Gource installed (for rendering)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/gource-tools.git
cd gource-tools

# Install dependencies
npm install

# Start development servers
npm run dev
```

This will start both the frontend and backend servers in development mode.

## 📦 Project Structure

```
gource-tools/
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Application pages/routes
│   │   ├── routes/        # Routing configuration
│   │   ├── services/      # API services
│   │   ├── styles/        # Global styles and themes
│   │   └── types/         # TypeScript type definitions
│   └── public/            # Static assets
├── server/                # Backend Express application
│   ├── src/
│   │   ├── controllers/   # API route handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helper utilities
├── shared/                # Shared code between client and server
│   └── types/             # Shared TypeScript interfaces
├── scripts/               # Build and utility scripts
└── docs/                  # Documentation
```

## 🧩 Key Components

### Frontend
- **Repository Management**: Browse, search, and manage Git repositories
- **Project Management**: Create and configure projects with multiple repositories
- **Settings**: Configure global application settings

### Backend
- **Git Integration**: Clone, pull, and analyze Git repositories
- **Data Management**: Store and retrieve project and repository data
- **Gource Integration**: Generate and customize Gource visualizations

## 🔄 Development Workflow

For the full development roadmap, see [ROADMAP.md](./ROADMAP.md).

### Current Status
- Completed repository and project management functionality
- Refactored architecture for better maintainability
- Centralized type system

### Next Steps
- Implement Gource visualization configuration
- Add user avatar management
- Create render queue system

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

## 📝 License

This project is [MIT](./LICENSE) licensed.

---

_Made with ❤️ for the Git visualization community_ 