# 🚀 Démarrage Rapide

Guide rapide pour installer et lancer l'application en 5 minutes.

## ⚡ Installation Automatique (Windows)

```batch
# 1. Exécuter le script d'installation
INSTALL.bat

# 2. Éditer backend\.env avec vos paramètres de base de données
# 3. Créer la base de données et les tables (voir ci-dessous)
# 4. Lancer l'application
START.bat
```

## 📋 Installation Manuelle

### 1️⃣ Créer la base de données

```bash
# Ouvrir PostgreSQL
psql -U postgres

# Créer la base
CREATE DATABASE university;
\q

# Exécuter le schéma
cd database
psql -U postgres -d university -f schema.sql
```

### 2️⃣ Configurer le backend

```bash
cd backend

# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement
venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Copier et éditer .env
copy env.example .env
notepad .env
```

**Éditer `.env` avec vos paramètres :**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=university
DB_USER=postgres
DB_PASSWORD=VOTRE_MOT_DE_PASSE
JWT_SECRET_KEY=une_cle_secrete_aleatoire
```

### 3️⃣ Initialiser les données de test

```bash
# Depuis le dossier backend avec l'environnement activé
flask seed_db
```

### 4️⃣ Démarrer l'application

**Terminal 1 - Backend :**
```bash
cd backend
venv\Scripts\activate
python run.py
```

**Terminal 2 - Frontend (optionnel) :**
```bash
# Avec Python
python -m http.server 8000

# OU simplement ouvrir login.html dans le navigateur
```

## 🎯 Accès à l'application

- **Backend API :** http://localhost:5001
- **Frontend :** Ouvrir `login.html` ou http://localhost:8000/login.html

## 👥 Se connecter

Utilisez les comptes de test créés par `flask seed_db` :

| Rôle       | Email             | Mot de passe |
|------------|-------------------|--------------|
| Admin      | admin@univ.fr     | password123  |
| Professeur | prof@univ.fr      | password123  |
| Étudiant   | etudiant@univ.fr  | password123  |

## 🔧 Commandes utiles

```bash
# Activer l'environnement virtuel
cd backend
venv\Scripts\activate

# Réinitialiser la base de données
flask init_db
flask seed_db

# Lancer le serveur
python run.py

# Voir les logs en mode debug
set FLASK_DEBUG=True
python run.py
```

## ❌ Problèmes courants

### ❌ "ModuleNotFoundError"
```bash
# Réinstaller les dépendances
pip install -r requirements.txt
```

### ❌ "Connection refused" sur PostgreSQL
- Vérifiez que PostgreSQL est démarré
- Vérifiez les paramètres dans `.env`
- Testez la connexion : `psql -U postgres -d university`

### ❌ "CORS error" dans le navigateur
- Vérifiez que le backend tourne sur le port 5001
- Vérifiez que les CORS sont configurés dans `backend/app.py`

### ❌ Les comptes de test ne fonctionnent pas
```bash
# Réexécuter le seed
cd backend
venv\Scripts\activate
flask seed_db
```

## 📚 Documentation complète

Pour plus de détails, consultez le fichier `README.md`

---

**Bon développement ! 🎓**

