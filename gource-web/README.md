# Gource-Web

Une interface web moderne pour Gource, un outil de visualisation de l'historique des dépôts Git.

![Gource-Web Screenshot](https://raw.githubusercontent.com/bitpaint/bitcoin-gources/main/gource/art/screenshoot.jpg)

## 🍩 Qu'est-ce que Gource-Web?

Gource-Web est une version modernisée de Gource-Tools, conçue pour simplifier la gestion de dépôts Git multiples et la création de visualisations Gource à travers une interface web intuitive. L'application conserve toutes les fonctionnalités de base de Gource-Tools tout en facilitant son utilisation grâce à une interface utilisateur moderne.

## ⚙️ Prérequis

- `git` : Pour cloner et interagir avec les dépôts
- `gource` : Pour générer les visualisations
- `Python 3.6+` : Pour le backend
- `Node.js 14+` et `npm` : Pour le frontend
- `FFmpeg` : Pour le rendu vidéo
- `perl` et `cpan` avec `Parallel::ForkManager` : Pour télécharger les avatars

## 🚀 Installation

### Backend (Flask)

```bash
cd gource-web/backend
pip install -r requirements.txt
python app.py
```

### Frontend (React)

```bash
cd gource-web/frontend
npm install
npm start
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## 🧰 Architecture

Gource-Web est divisé en deux parties principales :

### Backend (Python/Flask)

Le backend gère :
- L'interaction avec les dépôts Git
- La génération des logs Gource
- Le téléchargement des avatars
- Le rendu des visualisations via Gource et FFmpeg

### Frontend (React)

Le frontend fournit :
- Une interface utilisateur moderne et intuitive
- Des formulaires pour configurer facilement les visualisations
- Une gestion visuelle des dépôts et des logs
- Des paramètres personnalisables pour le rendu

## 📋 Fonctionnalités

- **Gestion des dépôts**
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

## 📄 License

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🙋‍♂️ Aide et support

Pour toute question ou assistance, veuillez ouvrir une issue sur GitHub. 