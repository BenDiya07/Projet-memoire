# 🎓 Système de Gestion des Cours Universitaires

Application web de gestion des cours universitaires avec système d'authentification multi-rôles (Admin, Professeur, Étudiant).

## 📋 Prérequis

- **Python 3.8+** avec pip
- **PostgreSQL 12+**
- **Navigateur web moderne** (Chrome, Firefox, Edge)

## 🚀 Installation

### 1. Configuration de la base de données

```bash
# Créer la base de données PostgreSQL
psql -U postgres
CREATE DATABASE university;
\q

# Initialiser les tables
cd database
psql -U postgres -d university -f schema.sql
```

### 2. Configuration du backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env (copier depuis env.example)
# Modifier les paramètres de connexion à la base de données
copy env.example .env
```

Éditer le fichier `.env` avec vos paramètres :
```env
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=university
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

JWT_SECRET_KEY=votre_clé_secrète_jwt
```

### 3. Initialiser les données

```bash
# Toujours dans le dossier backend avec l'environnement virtuel activé
flask seed_db
```

## ▶️ Démarrage de l'application

### 1. Démarrer le serveur backend (API)

```bash
cd backend
# Si l'environnement virtuel n'est pas activé :
venv\Scripts\activate  # Windows
# ou
source venv/bin/activate  # Linux/Mac

python run.py
```

Le serveur API démarre sur **http://localhost:5001**

### 2. Ouvrir le frontend

Ouvrez simplement le fichier `login.html` dans votre navigateur web.

**Ou** utilisez un serveur local (recommandé) :
```bash
# Avec Python
python -m http.server 8000

# Avec Node.js
npx http-server -p 8000

# Avec PHP
php -S localhost:8000
```

Puis accédez à **http://localhost:8000/login.html**

## 👥 Comptes de démonstration

Après avoir exécuté `flask seed_db`, vous pouvez vous connecter avec :

| Rôle          | Email              | Mot de passe  | Accès                                    |
|---------------|--------------------|--------------|-----------------------------------------|
| **Admin**     | admin@univ.fr      | password123  | Dashboard, Gestion, Suggestions, Emploi |
| **Professeur**| prof@univ.fr       | password123  | Gestion, Suggestions                     |
| **Étudiant**  | etudiant@univ.fr   | password123  | Emploi du temps                          |

## 📁 Structure du projet

```
Projet-memoire/
├── backend/              # API Flask
│   ├── app.py           # Application principale
│   ├── config.py        # Configuration
│   ├── models.py        # Modèles de données
│   ├── run.py           # Point d'entrée
│   ├── requirements.txt # Dépendances Python
│   └── routes/          # Routes API
│       ├── auth.py      # Authentification
│       ├── courses.py   # Gestion des cours
│       └── suggestions.py # Suggestions de cours
├── database/            # Scripts SQL
│   └── schema.sql       # Schéma de la base de données
├── login.html           # Page de connexion/inscription
├── dashboard.html       # Tableau de bord (Admin)
├── gestion.html         # Gestion des cours (Admin/Prof)
├── suggestion-cours.html # Suggestions (Admin/Prof)
├── emploi-temps.html    # Emploi du temps (Tous)
├── auth.js              # Gestion de l'authentification
├── script.js            # Scripts frontend
├── theme.js             # Gestion du thème clair/sombre
└── styles.css           # Styles globaux

```

## 🔧 Fonctionnalités

### ✅ Authentification
- ✅ Inscription avec validation
- ✅ Connexion avec détection automatique du rôle
- ✅ Système JWT pour sécuriser les API
- ✅ Gestion des sessions
- ✅ Mode fallback local si le backend est indisponible

### 📚 Gestion des cours
- 📝 Créer, modifier, supprimer des cours
- 👨‍🏫 Assigner des professeurs
- 🏫 Gérer les salles et équipements
- 📅 Définir les horaires

### 💡 Suggestions de cours
- ➕ Professeurs peuvent suggérer de nouveaux cours
- ✅ Admin peut approuver ou rejeter
- 📋 Suivi du statut des suggestions

### 📅 Emploi du temps
- 📆 Vue hebdomadaire des cours
- 🔍 Filtrage par étudiant/professeur
- 📱 Interface responsive

### 🎨 Interface utilisateur
- 🌓 Mode clair/sombre
- 📱 Design responsive
- 🎯 Navigation contextuelle selon le rôle
- ⚡ Interface moderne et intuitive

## 🛠️ API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur
- `POST /api/auth/refresh` - Rafraîchir le token

### Cours
- `GET /api/courses` - Liste des cours
- `POST /api/courses` - Créer un cours
- `PUT /api/courses/<id>` - Modifier un cours
- `DELETE /api/courses/<id>` - Supprimer un cours

### Suggestions
- `GET /api/suggestions` - Liste des suggestions
- `POST /api/suggestions` - Créer une suggestion
- `PUT /api/suggestions/<id>` - Modifier une suggestion
- `DELETE /api/suggestions/<id>` - Supprimer une suggestion

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt
- Authentification JWT
- Validation des entrées côté serveur
- Protection CORS configurée
- Audit des actions utilisateur

## 🐛 Dépannage

### Le backend ne démarre pas
- Vérifiez que PostgreSQL est en cours d'exécution
- Vérifiez les paramètres de connexion dans `.env`
- Assurez-vous que la base de données `university` existe

### Erreur de connexion frontend/backend
- Vérifiez que le backend tourne sur le port 5001
- Vérifiez les CORS dans `backend/app.py`
- Ouvrez la console du navigateur (F12) pour voir les erreurs

### Les comptes de test ne fonctionnent pas
- Exécutez `flask seed_db` depuis le dossier backend
- Vérifiez que la commande s'est terminée sans erreur

## 📝 Architecture

Le projet suit une architecture **MVC (Model-View-Controller)** :
- **Model** : `backend/models.py` - Modèles SQLAlchemy
- **View** : Fichiers HTML - Interface utilisateur
- **Controller** : `backend/routes/` - Logique métier et routes API

## 🤝 Contribution

Ce projet est un système de gestion universitaire développé dans le cadre d'un mémoire.

## 📄 Licence

Projet académique - Tous droits réservés

---

**Développé avec ❤️ pour la gestion des cours universitaires**

