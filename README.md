# Gource-Tools

Une interface web moderne pour Gource, un outil de visualisation de l'historique des dépôts Git.

![Gource-Tools Screenshot](https://raw.githubusercontent.com/bitpaint/bitcoin-gources/main/gource/art/screenshoot.jpg)

## 🍩 Qu'est-ce que Gource-Tools?

Gource-Tools est une boîte à outils complète conçue pour Gource. Sa fonction principale est de simplifier le processus de téléchargement de plusieurs dépôts, la génération de fichiers logs, et leur fusion en un seul fichier global nommé ACombinedLog.txt. De plus, Gource-Tools automatise le téléchargement des avatars depuis Gravatar. Cette boîte à outils est particulièrement utile pour gérer des projets à grande échelle avec de nombreux dépôts distincts.

## ⚙️ Prérequis

- `git` : Pour cloner et interagir avec les dépôts
- `gource` : Pour générer les visualisations
- `Python 3.6+` : Pour le backend
- `Node.js 14+` et `npm` : Pour le frontend
- `FFmpeg` : Pour le rendu vidéo
- `perl` et `cpan` avec `Parallel::ForkManager` : Pour télécharger les avatars

## 🚀 Installation

### Installation rapide

#### Sur Linux/macOS

```bash
# Installer les dépendances
./install.sh

# Démarrer l'application
./run.sh
```

#### Sur Windows

```
# Installer les dépendances
install.bat

# Démarrer l'application
run.bat
```

### Installation manuelle

#### Backend (Flask)

```bash
cd gource-web/backend
pip install -r requirements.txt
python app.py
```

#### Frontend (React)

```bash
cd gource-web/frontend
npm install
npm start
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## 🧰 Architecture

Gource-Tools est divisé en deux parties principales :

### Backend (Python/Flask)

Le backend gère :
- L'interaction avec les dépôts Git
- La génération des logs Gource
- Le téléchargement des avatars
- Le rendu des visualisations via Gource et FFmpeg

### Frontend (React)

Le frontend fournit :
- Une interface utilisateur moderne et intuitive
- Des formulaires faciles à utiliser pour configurer les visualisations
- Une gestion visuelle des dépôts et des logs
- Des paramètres de rendu personnalisables

## 📋 Fonctionnalités

- **Gestion de dépôts**
  - Ajout de dépôts à partir d'URLs
  - Suppression de dépôts
  - Vue d'ensemble des dépôts disponibles

- **Génération de logs**
  - Création de logs pour chaque dépôt
  - Combinaison de logs pour une visualisation multi-projets
  - Configuration des options de log

- **Téléchargement d'avatars**
  - Récupération automatique des avatars depuis Gravatar
  - Association aux contributeurs dans la visualisation

- **Visualisation**
  - Prévisualisation interactive directement dans l'interface
  - Nombreuses options de configuration (dates, vitesse, etc.)
  - Support pour les résolutions HD et 4K

- **Rendu vidéo**
  - Export au format MP4 haute qualité
  - Configuration avancée du rendu
  - Support pour l'audio personnalisé

- **Configuration**
  - Paramètres globaux pour les API
  - Options de rendu par défaut
  - Personnalisation de l'interface

## 📝 Instructions pour les développeurs

### Structure du projet

```
gource-web/
├── backend/               # API Flask
│   ├── app.py             # Point d'entrée de l'API
│   └── requirements.txt   # Dépendances Python
├── frontend/              # Application React
│   ├── public/            # Fichiers statiques
│   ├── src/               # Code source React
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/         # Pages de l'application
│   │   └── App.js         # Composant racine
│   └── package.json       # Configuration npm
├── repos/                 # Dépôts Git clonés (créé automatiquement)
├── logs/                  # Logs générés (créé automatiquement)
├── avatars/               # Avatars téléchargés (créé automatiquement)
├── renders/               # Rendus vidéo (créé automatiquement)
└── config/                # Fichiers de configuration
```

### Développement du backend

Le backend est construit avec Flask et fournit une API REST pour interagir avec Gource et les dépôts Git. Pour ajouter de nouvelles fonctionnalités :

1. Modifiez `app.py` pour ajouter de nouveaux endpoints
2. Installez les dépendances nécessaires dans `requirements.txt`
3. Testez vos modifications avec Postman ou curl

### Développement du frontend

Le frontend utilise React avec Material-UI pour l'interface utilisateur. Pour modifier l'interface :

1. Modifiez les composants existants dans `src/components/`
2. Ajoutez de nouvelles pages dans `src/pages/`
3. Mettez à jour les routes dans `App.js`

### Tests

Pour tester l'application complète :

1. Lancez le backend : `cd backend && python app.py`
2. Dans un autre terminal, lancez le frontend : `cd frontend && npm start`
3. Accédez à [http://localhost:3000](http://localhost:3000)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🙋‍♂️ Aide et support

Pour toute question ou assistance, veuillez ouvrir une issue sur GitHub.
