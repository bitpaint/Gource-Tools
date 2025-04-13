# Gource-Tools

Outils pour visualiser l'évolution des dépôts Git avec Gource.

## Modifications récentes

### Configuration Gource améliorée

Nous avons apporté plusieurs améliorations à la gestion des configurations Gource :

1. **Réduction de l'élasticité par défaut** : L'élasticité a été réduite de 0.5 à 0.3 pour une visualisation plus stable.

2. **Ajout de nouveaux paramètres** :
   - `titleText` : Texte personnalisé pour le titre
   - `showDates` : Affichage des dates dans la visualisation
   - `disableProgress` : Option pour désactiver la barre de progression
   - `disableAutoRotate` : Option pour désactiver la rotation automatique
   - `showLines` : Option pour afficher/masquer les lignes fichier/utilisateur
   - `followUsers` : Option pour que la caméra suive les utilisateurs
   - `maxFilelag` : Délai maximal avant apparition des fichiers
   - `multiSampling` : Anti-aliasing pour améliorer la qualité
   - `bloom` : Effet de luminosité pour les éléments brillants
   - `bloomIntensity` : Intensité de l'effet bloom
   - `bloomMultiplier` : Multiplicateur de l'effet bloom

3. **Amélioration de l'interface utilisateur** :
   - Ajout d'un sélecteur de couleur pour définir la couleur d'arrière-plan
   - Ajout d'info-bulles explicatives pour chaque paramètre
   - Organisation des paramètres en onglets thématiques (Vidéo, Visualisation, Apparence, Temps, Filtrage, Avancé)
   - Ajout de curseurs pour ajuster facilement les valeurs numériques

4. **Documentation** :
   - Documentation détaillée pour chaque paramètre
   - Lien vers la documentation Gource pour les paramètres avancés

5. **Refactorisation** :
   - Création de composants réutilisables (ColorPickerField, TooltipField, TooltipSlider, TooltipCheckbox)
   - Utilitaires pour la conversion des formats de paramètres (camelCase <-> kebab-case)
   - Génération de commandes Gource à partir des paramètres

### Visualisation multi-dépôts

L'application prend en charge la visualisation de plusieurs dépôts Git dans une même animation :

1. **Intégration transparente** : 
   - Créez un projet contenant plusieurs dépôts Git
   - L'application gère automatiquement la combinaison des logs

2. **Rendu combiné** : 
   - Tous les dépôts sont visualisés dans un même rendu Gource
   - Conforme aux recommandations officielles de la [documentation Gource](https://github.com/acaudwell/Gource/wiki/Visualizing-Multiple-Repositories)

3. **Distinction visuelle** : 
   - Chaque dépôt est clairement identifié par son nom dans la visualisation
   - Les fichiers de chaque dépôt sont préfixés par le nom du dépôt

4. **Chronologie unifiée** : 
   - Les activités de tous les dépôts sont combinées sur une timeline commune
   - Tri chronologique de tous les événements pour une visualisation fluide

Cette fonctionnalité est idéale pour visualiser :
- Des projets modulaires avec plusieurs composants
- L'évolution parallèle de projets liés
- L'activité globale d'une équipe sur plusieurs projets

### Correction des problèmes de configuration (Juin 2023)

Nous avons résolu plusieurs problèmes liés aux configurations Gource personnalisées :

1. **Uniformisation des paramètres** :
   - Mappage complet entre les formats camelCase (côté client) et kebab-case (Gource)
   - Tous les paramètres sont désormais correctement convertis dans les deux sens

2. **Validation robuste** :
   - Validation complète des paramètres numériques, booléens et textuels
   - Détection et correction automatique des valeurs invalides
   - Remplacement des valeurs undefined par des valeurs par défaut appropriées

3. **Amélioration des profils prédéfinis** :
   - Correction des profils "Last Week", "Last Month" et "Last Year"
   - Calcul dynamique des dates sur le serveur pour la compatibilité Windows/Linux
   - Meilleure gestion des formats de date et des plages temporelles

4. **Génération de fichiers de configuration améliorée** :
   - Format précis respectant la syntaxe Gource
   - Gestion correcte des paramètres booléens et flags
   - Support complet des options de paramétrage Gource

5. **Compatibilité multiplateforme** :
   - Support complet sous Windows et Linux
   - Élimination des dépendances spécifiques au système d'exploitation

## Installation

1. Cloner le dépôt
2. Installer les dépendances du serveur : `cd server && npm install`
3. Installer les dépendances du client : `cd client && npm install`
4. Démarrer le serveur : `cd server && npm start`
5. Démarrer le client : `cd client && npm start`

## Prérequis

- Node.js
- Gource
- Git

## Utilisation

1. Importez vos dépôts Git
2. Créez ou modifiez une configuration Gource
3. Générez des visualisations
4. Exportez des vidéos

## Licence

MIT 