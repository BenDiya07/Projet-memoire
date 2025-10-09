# 🎓 Base de Données PostgreSQL - Gestion des Cours Universitaires

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Installation PostgreSQL](#installation-postgresql)
4. [Configuration](#configuration)
5. [Initialisation de la Base de Données](#initialisation-de-la-base-de-données)
6. [Lancement du Backend](#lancement-du-backend)
7. [Tests](#tests)
8. [API Endpoints](#api-endpoints)
9. [Déploiement AWS RDS](#déploiement-aws-rds)

---

## 🎯 Vue d'ensemble

Ce projet utilise **PostgreSQL** comme base de données relationnelle avec un backend **Python/Flask** pour gérer un système de cours universitaires.

### Architecture

```
Frontend (HTML/JS) ←→ Backend API (Flask) ←→ PostgreSQL Database
```

### Fonctionnalités

- ✅ Authentification utilisateurs (Admin, Professeur, Étudiant)
- ✅ Gestion des cours et emplois du temps
- ✅ Système de suggestions de cours
- ✅ Détection automatique de conflits
- ✅ Gestion des salles et équipements
- ✅ Audit logs et notifications
- ✅ API REST complète

---

## 🔧 Prérequis

### Logiciels requis

- **PostgreSQL** 14+ ([Télécharger](https://www.postgresql.org/download/))
- **Python** 3.9+ ([Télécharger](https://www.python.org/downloads/))
- **pip** (gestionnaire de paquets Python)
- **Git** (optionnel)

### Vérifier les installations

```bash
# PostgreSQL
psql --version
# Sortie: psql (PostgreSQL) 14.x

# Python
python --version
# Sortie: Python 3.9.x ou supérieur

# pip
pip --version
```

---

## 💾 Installation PostgreSQL

### Windows

1. **Télécharger** l'installateur depuis [postgresql.org](https://www.postgresql.org/download/windows/)
2. **Installer** PostgreSQL avec les paramètres par défaut
3. **Mémoriser** le mot de passe de l'utilisateur `postgres`
4. **Vérifier** que PostgreSQL est démarré (Services Windows)

### macOS

```bash
# Avec Homebrew
brew install postgresql@14
brew services start postgresql@14
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

## ⚙️ Configuration

### 1. Cloner/Préparer le projet

```bash
cd "F:\CODING\Nouveau dossier (2)"
```

### 2. Créer un environnement virtuel Python

```bash
# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate
```

### 3. Installer les dépendances Python

```bash
cd backend
pip install -r requirements.txt
```

### 4. Configurer les variables d'environnement

Créer un fichier `.env` dans le dossier `backend/` :

```bash
# Copier l'exemple
copy .env.example .env    # Windows
# ou
cp .env.example .env      # macOS/Linux
```

Éditer le fichier `.env` :

```env
# Environnement
FLASK_ENV=development
FLASK_DEBUG=1

# Sécurité
SECRET_KEY=votre-cle-secrete-aleatoire-tres-longue
JWT_SECRET_KEY=votre-cle-jwt-aleatoire-tres-longue

# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_cours_db
DB_USER=postgres
DB_PASSWORD=VOTRE_MOT_DE_PASSE_POSTGRES

# CORS
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

---

## 🗄️ Initialisation de la Base de Données

### Méthode 1 : Script Python automatique (Recommandé)

```bash
# Dans le dossier database/
cd database
python setup_database.py
```

Le script va :
1. ✅ Créer la base de données `gestion_cours_db`
2. ✅ Créer toutes les tables (schema.sql)
3. ✅ Insérer les données de test (init_db.sql)
4. ✅ Afficher un résumé

**Comptes de test créés :**
- **Admin:** admin@univ.fr / password123
- **Professeur:** prof@univ.fr / password123
- **Étudiant:** etudiant@univ.fr / password123

### Méthode 2 : Manuelle avec psql

```bash
# 1. Se connecter à PostgreSQL
psql -U postgres

# 2. Créer la base de données
CREATE DATABASE gestion_cours_db;

# 3. Se connecter à la nouvelle base
\c gestion_cours_db

# 4. Exécuter le schéma
\i database/schema.sql

# 5. Exécuter les données initiales
\i database/init_db.sql

# 6. Vérifier
SELECT COUNT(*) FROM users;
\q
```

---

## 🚀 Lancement du Backend

### 1. Démarrer le serveur Flask

```bash
# Dans le dossier backend/
cd backend
python run.py
```

Vous devriez voir :

```
============================================================
🎓 SERVEUR API - GESTION DES COURS UNIVERSITAIRES
============================================================

🌐 Serveur démarré sur http://localhost:5000
🔧 Mode: DEBUG
📊 Base de données: gestion_cours_db

📝 Endpoints disponibles:
   - http://localhost:5000/health
   - http://localhost:5000/api/auth/login
   - http://localhost:5000/api/courses
   - http://localhost:5000/api/suggestions
============================================================
```

### 2. Tester la connexion

Ouvrir un navigateur et aller sur : **http://localhost:5000/health**

Réponse attendue :
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "development"
}
```

---

## 🧪 Tests

### Test de l'API avec curl

```bash
# Test de connexion
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@univ.fr\",\"password\":\"password123\"}"

# Récupérer les cours (avec token)
curl http://localhost:5000/api/courses \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Test avec Postman

1. **Importer** la collection (à créer)
2. **Tester** les endpoints d'authentification
3. **Utiliser** le token JWT pour les requêtes suivantes

---

## 📡 API Endpoints

### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil utilisateur |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/roles` | Liste des rôles |

### Cours

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/courses` | Liste des cours |
| GET | `/api/courses/<id>` | Détails d'un cours |
| POST | `/api/courses` | Créer un cours (Admin) |
| PUT | `/api/courses/<id>` | Modifier un cours (Admin) |
| DELETE | `/api/courses/<id>` | Supprimer un cours (Admin) |
| GET | `/api/courses/schedule` | Emploi du temps |
| GET | `/api/courses/my-courses` | Mes cours |
| POST | `/api/courses/<id>/enroll` | S'inscrire |

### Suggestions

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/suggestions` | Liste des suggestions |
| GET | `/api/suggestions/<id>` | Détails d'une suggestion |
| POST | `/api/suggestions` | Créer une suggestion (Prof) |
| POST | `/api/suggestions/<id>/approve` | Approuver (Admin) |
| POST | `/api/suggestions/<id>/reject` | Rejeter (Admin) |
| GET | `/api/suggestions/stats` | Statistiques |

---

## 🔗 Connexion Frontend ↔ Backend

### Modifier le frontend pour utiliser l'API

Dans vos fichiers JavaScript (`auth.js`, `gestion-script.js`, etc.), remplacez localStorage par des appels API :

```javascript
// Exemple: auth.js
async function login(email, password, role) {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, role })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Stocker le token JWT
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            return { success: true, user: data.user };
        } else {
            return { success: false, message: data.message };
        }
    } catch (error) {
        return { success: false, message: 'Erreur de connexion' };
    }
}
```

---

## ☁️ Déploiement AWS RDS

### Étapes pour AWS (préparation future)

1. **Créer une instance RDS PostgreSQL**
   - Région: eu-west-1 (ou votre choix)
   - Type: db.t3.micro (Free Tier)
   - Stockage: 20 GB

2. **Configurer les variables d'environnement**
   ```env
   FLASK_ENV=production
   RDS_HOSTNAME=votre-instance.xxx.rds.amazonaws.com
   RDS_PORT=5432
   RDS_DB_NAME=gestion_cours_db
   RDS_USERNAME=admin
   RDS_PASSWORD=votre_mot_de_passe_sécurisé
   ```

3. **Déployer avec Elastic Beanstalk ou EC2**

4. **Exécuter les migrations**
   ```bash
   python setup_database.py
   ```

---

## 🛠️ Dépannage

### Erreur : "psycopg2 not found"

```bash
pip install psycopg2-binary
```

### Erreur : "Connection refused"

- Vérifier que PostgreSQL est démarré
- Vérifier le port (5432 par défaut)
- Vérifier le mot de passe dans `.env`

### Erreur : "Database does not exist"

```bash
cd database
python setup_database.py
```

### Logs PostgreSQL

```bash
# Windows
# Voir dans: C:\Program Files\PostgreSQL\14\data\log

# Linux/macOS
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## 📊 Structure de la Base de Données

### Tables principales

- **users** : Utilisateurs (admin, professeurs, étudiants)
- **courses** : Cours disponibles
- **course_schedules** : Planning des cours
- **course_suggestions** : Suggestions de cours
- **rooms** : Salles disponibles
- **student_enrollments** : Inscriptions étudiants
- **conflicts** : Conflits détectés
- **notifications** : Notifications utilisateurs
- **audit_logs** : Journal d'audit

### Vues SQL

- **v_complete_schedule** : Emploi du temps complet
- **v_pending_suggestions** : Suggestions en attente
- **v_dashboard_stats** : Statistiques dashboard
- **v_active_conflicts** : Conflits actifs

---

## 📞 Support

Pour toute question :
- Consultez les logs du serveur Flask
- Vérifiez les logs PostgreSQL
- Testez avec `/health` endpoint

---

## 🎉 Félicitations !

Votre base de données PostgreSQL est maintenant configurée et opérationnelle ! 

**Prochaines étapes :**
1. ✅ Tester l'API avec Postman
2. ✅ Connecter le frontend
3. ✅ Personnaliser les données
4. ✅ Préparer le déploiement AWS

Bon développement ! 🚀

