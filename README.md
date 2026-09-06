# Projet Memoire - Gestion des Cours Universitaires

Application web de gestion de cours universitaires : planification des emplois du temps, gestion des professeurs et des salles, détection des conflits et suggestions de nouveaux cours.

## Stack technique

| Couche     | Technologie                      |
|------------|----------------------------------|
| Backend    | Python Flask, SQLAlchemy, JWT    |
| Base de données | PostgreSQL                  |
| Frontend   | HTML / CSS / JavaScript vanilla  |
| Visualisation | Chart.js                      |

## Prérequis

- Python 3.10+
- PostgreSQL 14+
- Node.js (optionnel, pour servir le frontend via Live Server / VS Code)

## Installation

### 1. Base de données

```bash
cd database
py setup_database.py
```

Le script crée la base `university`, applique `schema.sql` et insère les données de test (`init_db.sql`).

### 2. Backend

```bash
cd backend
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Créer le fichier `.env` à partir de `env.example` puis démarrer :

```bash
py run.py
```

Le serveur Flask est accessible sur `http://localhost:5001`.

### 3. Frontend

Ouvrir le projet dans VS Code et lancer **Live Server** (port 5500), ou servir le dossier racine avec n'importe quel serveur statique, puis ouvrir `login.html`.

## Comptes de démonstration

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