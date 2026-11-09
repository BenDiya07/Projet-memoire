# Projet Memoire - Gestion des Cours Universitaires

Application web de gestion de cours universitaires : planification des emplois du temps, gestion des professeurs et des salles, détection des conflits et suggestions de nouveaux cours.

## Stack technique

| Couche     | Technologie                      |
|------------|----------------------------------|
| Backend    | Python Flask, SQLAlchemy, JWT    |
| Base de données | SQLite (développement), PostgreSQL (production) |
| Frontend   | React, TypeScript, Vite (HTML historique conservé pendant la migration) |
| Visualisation | Chart.js                      |

## Prérequis

- Python 3.10+
- SQLite (inclus avec Python) pour le développement local
- PostgreSQL 14+ pour une installation ou un déploiement PostgreSQL
- Node.js (optionnel, pour servir le frontend via Live Server / VS Code)

## Installation

### Frontend React (nouvelle interface)

Le dossier `frontend/` contient la nouvelle interface React + TypeScript. Elle est séparée du frontend HTML historique, qui reste disponible pendant la migration.

```powershell
cd frontend
npm install
npm run dev
```

Le serveur Vite transmet les appels `/api` vers Flask sur le port 5001. L’API utilise SQLite en développement local par défaut ; PostgreSQL reste disponible pour la production.

### Backend et base de données

```powershell
cd backend
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item env.example .env }
py init_sqlite.py
py run.py
```

La base SQLite et ses données de démonstration sont créées dans `backend/instance/campusflow.sqlite3`. L’initialiseur est idempotent : il crée les tables et ajoute les données de démonstration manquantes sans supprimer les données existantes.

Pour utiliser PostgreSQL en développement, définir `DB_TYPE=postgresql` dans `backend/.env`, renseigner les variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` et `DB_PASSWORD`, puis appliquer les scripts SQL existants dans `database/`.

Le serveur Flask est accessible sur `http://localhost:5001` et son état sur `http://localhost:5001/health`.

### Frontend historique

Ouvrir le projet dans VS Code et lancer **Live Server** (port 5500), ou servir le dossier racine avec n'importe quel serveur statique, puis ouvrir `login.html`.

## Comptes de démonstration

L’inscription depuis l’application crée uniquement des comptes étudiants. Les rôles professeur et administrateur sont attribués par un administrateur ou configurés dans les données de démonstration.

| Rôle       | Email            | Mot de passe |
|------------|------------------|--------------|
| Admin      | admin@univ.fr    | password123  |
| Professeur | prof@univ.fr     | password123  |
| Étudiant   | etudiant@univ.fr | password123  |

## Structure du projet

```
backend/              # API Flask
  routes/             # Blueprints (auth, courses, suggestions, stats)
  app.py              # Factory de l'application
  config.py           # Configuration par environnement
  models.py           # Modèles SQLAlchemy
  run.py              # Point d'entrée (port 5001)
database/             # Scripts SQL et configuration
  schema.sql          # Schéma de la base
  init_db.sql         # Données de test
  setup_database.py   # Assistant d'installation
dashboard.html        # Tableau de bord (statistiques, graphiques)
gestion.html          # Gestion des cours, professeurs, salles
suggestion-cours.html # Suggestions de nouveaux cours
emploi-temps.html     # Emploi du temps
login.html            # Connexion / inscription
```

## API principale

| Méthode | Endpoint                  | Description                    |
|---------|---------------------------|--------------------------------|
| POST    | `/api/auth/login`         | Connexion                      |
| POST    | `/api/auth/register`      | Inscription étudiant           |
| GET     | `/api/courses`            | Liste des cours                |
| POST    | `/api/courses`            | Ajouter un cours (admin)       |
| GET     | `/api/courses/schedule`   | Emploi du temps                |
| GET     | `/api/courses/rooms`      | Liste des salles               |
| GET     | `/api/suggestions`        | Liste des suggestions          |
| POST    | `/api/suggestions`        | Soumettre une suggestion       |
| GET     | `/api/stats`              | Statistiques du tableau de bord|