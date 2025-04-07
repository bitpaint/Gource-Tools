# Gource-Tools Moderne

Application web moderne pour visualiser l'historique Git à travers Gource.

## 🌟 Vision du Projet

Transformer les scripts bash originaux de Gource-Tools en une application web intuitive qui permet la gestion, la configuration et le rendu de visualisations Gource pour les dépôts Git.

## 🛠️ Technologies

- **Frontend**: React avec TypeScript
- **Backend**: Node.js/Express
- **Base de données**: SQLite
- **Packaging**: Electron pour application desktop
- **Conteneurisation**: Docker

## 📋 Fonctionnalités Principales

- Gestion complète des dépôts Git
- Génération et personnalisation des visualisations Gource
- Gestion automatisée des avatars
- Prévisualisation en temps réel et export en différents formats
- Interface utilisateur intuitive et responsive

## 🚀 Structure du Projet

```
gource-tools/
├── client/                  # Frontend React
│   ├── src/
│   │   ├── components/      # Composants réutilisables
│   │   ├── pages/           # Pages de l'application
│   │   ├── services/        # Services API
│   │   ├── hooks/           # Hooks personnalisés
│   │   ├── styles/          # Styles globaux
│   │   └── routes/          # Configuration des routes
├── server/                  # Backend Node.js
│   ├── src/
│   │   ├── controllers/     # Contrôleurs API
│   │   ├── services/        # Services métier
│   │   ├── models/          # Modèles de données
│   │   └── api/             # Routes API
├── data/                    # Stockage des données
│   ├── repositories/        # Dépôts Git clonés
│   └── gource/              # Configurations et rendus Gource
├── electron/                # Configuration Electron
├── shared/                  # Code partagé
├── docs/                    # Documentation
└── scripts/                 # Scripts utilitaires
```

## 📝 Roadmap

1. **Phase 1**: ✅ Configuration du projet et fondations
2. **Phase 2**: 🔄 Fonctionnalités de base Gource et dépôts (En cours)
3. **Phase 3**: Système de rendu et prévisualisation
4. **Phase 4**: UI/UX avancée et intégrations
5. **Phase 5**: Packaging et déploiement

## 📜 Règles du Projet (Pour l'Assistant IA)

- Répondre en français, coder en anglais
- Maintenir la documentation du projet à jour (README, ROADMAP)
- Structurer le code de manière modulaire et maintenable
- Fournir des instructions claires pour les prochaines étapes

## 💻 Installation & Démarrage

### Prérequis

- Node.js v14+
- Git
- Gource (pour le rendu des visualisations)
- FFmpeg (pour l'export des vidéos)

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/yourusername/gource-tools.git
cd gource-tools

# Installer les dépendances
npm install

# Installer les dépendances du frontend et du backend
cd client && npm install
cd ../server && npm install
cd ..
```

### Démarrage en développement

```bash
# Démarrer le frontend et le backend en parallèle
npm run dev
```

### Build de production

```bash
# Construire le frontend et le backend
npm run build
```

## 🤝 Contribution

Ce projet est développé en collaboration avec une assistance IA.

## 📄 Licence

MIT 

## 📱 Fonctionnalités implémentées

- ✅ Création et gestion de projets
- ✅ Import et clonage de dépôts Git
- ✅ Configuration des paramètres Gource
- ✅ Génération de logs Git pour Gource
- ✅ Interface utilisateur réactive et moderne
- ✅ API RESTful complète 