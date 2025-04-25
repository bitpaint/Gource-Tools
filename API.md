# Documentation de l'API Gource-Tools

Cette documentation décrit les principales routes de l’API backend (Express) de Gource-Tools. Toutes les routes commencent par `/api/`.

---

## Authentification
Aucune authentification par défaut. (À sécuriser si besoin en production !)

---

## 📁 Dépôts Git (`/api/repositories`)

- `GET    /api/repositories`  
  Liste tous les dépôts importés.

- `GET    /api/repositories/:id`  
  Détail d’un dépôt par ID.

- `POST   /api/repositories`  
  Ajoute un nouveau dépôt (corps : `{ url: string, ... }`).

- `POST   /api/repositories/bulk-import`  
  Import en masse depuis GitHub (corps : `{ githubUrl: string, ... }`).

- `POST   /api/repositories/update/:id`  
  Met à jour un dépôt (pull + régénère le log).

- `POST   /api/repositories/:id/pull`  
  Fait un `git pull` sur le dépôt.

- `DELETE /api/repositories/:id`  
  Supprime le dépôt.

- `GET    /api/repositories/stats`  
  Statistiques pour le dashboard.

---

## 📦 Projets (`/api/projects`)

- `GET    /api/projects`  
  Liste tous les projets.

- `POST   /api/projects`  
  Crée un projet.

- `GET    /api/projects/:id`  
  Détail d’un projet.

- `PUT    /api/projects/:id`  
  Met à jour un projet.

- `DELETE /api/projects/:id`  
  Supprime un projet.

---

## 🎬 Rendus Gource (`/api/renders`)

- `GET    /api/renders`  
  Liste tous les rendus vidéo.

- `POST   /api/renders`  
  Lance un nouveau rendu (corps : options de rendu).

- `GET    /api/renders/:id`  
  Détail d’un rendu.

- `DELETE /api/renders/:id`  
  Supprime un rendu.

---

## ⚙️ Profils de rendu (`/api/renderProfiles`)

- `GET    /api/renderProfiles`  
  Liste les profils de rendu disponibles.

- `POST   /api/renderProfiles`  
  Ajoute un profil.

- `PUT    /api/renderProfiles/:id`  
  Met à jour un profil.

- `DELETE /api/renderProfiles/:id`  
  Supprime un profil.

---

## 🛠️ Paramètres (`/api/settings`)

- `GET    /api/settings`  
  Récupère les paramètres globaux.

- `PUT    /api/settings`  
  Met à jour les paramètres globaux.

---

## 🔍 Santé du serveur

- `GET    /api/health`  
  Renvoie un état de santé du serveur, des dépendances et des dossiers.

---

## 📤 Téléchargement de vidéos/export

- `GET /exports/:filename`  
  Télécharge une vidéo générée.

- `GET /temp/previews/:filename`  
  Télécharge une prévisualisation temporaire.

---

## ❗ Remarques
- Toutes les routes renvoient du JSON.
- Les erreurs sont renvoyées avec un code HTTP approprié et un message.
- Pour les imports et rendus lourds, utiliser les endpoints de suivi de statut (voir `/bulk-import-status/`, `/clone-status/`).

---

Pour plus de détails ou d’exemples de payload, voir le code source ou demander une extension de cette documentation !
