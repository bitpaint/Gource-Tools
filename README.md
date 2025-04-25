# Gource-Tools

Gource-Tools est une application web moderne permettant de gérer, visualiser et exporter l'activité de dépôts Git à l'aide de [Gource](https://gource.io/) et de [FFmpeg](https://ffmpeg.org/). Elle propose une interface graphique intuitive pour importer des dépôts, configurer des profils de rendu et générer des vidéos de visualisation.

## Fonctionnalités principales
- **Importation de dépôts Git** (individuels ou en masse depuis GitHub)
- **Gestion de projets** regroupant plusieurs dépôts
- **Configuration de profils de rendu** pour Gource
- **Lancement et suivi de rendus vidéo** (Gource + FFmpeg)
- **Tableau de bord** avec statistiques, graphiques et actions rapides
- **Export et prévisualisation des vidéos générées**

## Architecture
- **Frontend** : React + TypeScript + Material UI (MUI)
- **Backend** : Node.js + Express
- **Base de données** : lowdb (JSON)
- **Outils externes** : Gource, FFmpeg

## Prérequis
- Node.js >= 18.x
- npm >= 9.x
- [Gource](https://gource.io/) installé et accessible dans le PATH
- [FFmpeg](https://ffmpeg.org/) installé et accessible dans le PATH

## Installation
Clonez le dépôt puis installez les dépendances pour le backend et le frontend :

```bash
# Clonez le projet
git clone https://github.com/votre-utilisateur/Gource-Tools.git
cd Gource-Tools

# Installez toutes les dépendances (frontend + backend)
npm run install-all
```

## Configuration
Copiez le fichier `.env.example` en `.env` et adaptez les variables selon vos besoins (ports, tokens GitHub, etc.) :

```bash
cp .env.example .env
```

Variables courantes :
- `PORT` : port du serveur Express (par défaut 5000)
- `GITHUB_TOKEN` : (optionnel) pour lever les limitations de l'API GitHub lors des imports massifs

## Lancement de l'application
En mode développement (frontend et backend lancés en parallèle) :

```bash
npm start
```

- Frontend : [http://localhost:5173](http://localhost:5173)
- Backend API : [http://localhost:5000/api](http://localhost:5000/api)

## Utilisation
1. **Ajouter un dépôt** : via l’onglet « Repositories », importer un dépôt Git (local ou distant).
2. **Créer un projet** : regrouper plusieurs dépôts dans un projet.
3. **Configurer un profil de rendu** : personnaliser les options Gource (thème, durée, filtres, etc.).
4. **Lancer un rendu** : générer une vidéo de visualisation.
5. **Exporter et prévisualiser** : télécharger ou visionner les vidéos générées.

## Structure du projet
```
Gource-Tools/
├── client/        # Frontend React (src/, pages/, components/)
├── server/        # Backend Express (routes/, controllers/, services/)
├── db/            # Base de données lowdb (JSON)
├── exports/       # Vidéos générées
├── repos/         # Dépôts Git importés
├── temp/          # Fichiers temporaires, prévisualisations
├── .env           # Configuration des variables d'environnement
```

## Contribution
Les contributions sont les bienvenues ! Pour proposer une amélioration :
1. Forkez ce dépôt
2. Créez une branche (`feature/ma-fonctionnalite`)
3. Commitez vos modifications
4. Ouvrez une Pull Request

Merci de respecter la structure du projet et d’ajouter des tests si nécessaire.

## Licence
MIT

---

**Auteur initial** : [Cursor AI]

**Mainteneur** : [Votre nom/prénom ou équipe]

Pour toute question ou bug, ouvrez une issue sur GitHub.
