# Roadmap du Projet Gource-Tools

Cette roadmap détaille les étapes de développement du projet Gource-Tools.

## Phase 1: Fondation (Configuration Initiale)

### Semaine 1-2: Mise en place de l'environnement
- [x] Créer le README et la roadmap initiale
- [x] Initialiser la structure du projet (client/server)
- [x] Mettre en place l'environnement de développement React/TypeScript
- [x] Configurer le serveur Node.js/Express
- [x] Établir la base de données SQLite
- [x] Configurer les outils de build et de développement

### Semaine 3-4: Fonctionnalités de base
- [x] Développer la navigation principale et le layout de l'application
- [x] Créer les modèles de données fondamentaux (Projet, Dépôt, Configuration)
- [x] Implémenter l'API REST de base
- [x] Développer le dashboard principal
- [x] Mettre en place l'intégration Git basique

## Phase 2: Fonctionnalités Gource et Gestion des Dépôts

### Semaine 5-6: Gestion des dépôts
- [x] Développer la fonctionnalité d'import de dépôts locaux
- [x] Implémenter le clonage de dépôts distants (GitHub, GitLab)
- [x] Créer l'interface de gestion des dépôts
- [x] Ajouter la fonctionnalité de filtrage et d'organisation des projets

### Semaine 7-8: Intégration Gource
- [x] Développer l'intégration avec Gource (génération de logs)
- [x] Créer l'interface de configuration des paramètres Gource
- [ ] Ajouter la fonctionnalité de filtrage et d'organisation des profiles - crer un profile par défaut qui existe déja et qui est modifiable. Et un manager de profiles gource.
- [ ] Implémenter la gestion des avatars (GitHub, Gravatar)



## Phase 3: Système de Rendu et Prévisualisation



### Semaine 9-10: Export et Rendu
- [ ] Intégrer FFmpeg pour l'export vidéo
- [ ] Développer la file d'attente des rendus
- [ ] Implémenter les différentes options d'export (MP4, WebM, GIF)
- [ ] Créer l'interface de personnalisation des rendus

### Semaine 11-12: Prévisualisation
- [ ] Intégrer un système de prévisualisation WebGL
- [ ] Développer l'affichage en temps réel des modifications
- [ ] Créer l'interface de prévisualisation interactive
- [ ] Optimiser pour différentes tailles de dépôts

## Phase 4: UI/UX Avancée et Intégrations

### Semaine 13-14: UI/UX avancée
- [ ] Affiner l'interface utilisateur (thèmes, responsive)
- [ ] Développer des composants interactifs avancés
- [ ] Améliorer l'expérience utilisateur (tutoriels, aide contextuelle)
- [ ] Implémenter des animations et transitions

### Semaine 15-16: Intégrations sociales
- [ ] Développer l'intégration avec YouTube pour l'upload
- [ ] Ajouter le partage sur Twitter, TikTok, Instagram
- [ ] Implémenter des fonctionnalités d'édition légère
- [ ] Créer l'interface de partage

## Phase 5: Packaging et Déploiement

### Semaine 17-18: Électronification
- [ ] Configurer Electron pour l'application desktop
- [ ] Adapter l'UI/UX pour desktop
- [ ] Gérer les permissions et l'accès aux fichiers système
- [ ] Ajouter les mises à jour automatiques

### Semaine 19-20: Finalisation
- [ ] Conteneuriser avec Docker
- [ ] Créer la documentation utilisateur complète
- [ ] Procéder aux tests complets
- [ ] Préparer la release 1.0

## Suivi des Progrès

### Progression actuelle
- Phase: 2
- Tâches complétées: 13/28
- État: Correction du problème de structure de base de données pour la récupération des dépôts GitHub
- Prochaine étape: Implémentation de le telechargement des avatars.