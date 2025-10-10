# 🎓 DÉMARRAGE - Base de Données PostgreSQL

## 👋 Bienvenue !

Votre base de données PostgreSQL avec backend Python Flask est maintenant **complète et prête à l'emploi** ! 

Ce document vous guide pour démarrer en **5 minutes**.

---

## 📋 Ce Qui A Été Créé

### ✅ Base de Données PostgreSQL
- **14 tables** complètes avec relations
- **Triggers automatiques** pour la logique métier
- **Vues SQL** pour les requêtes complexes
- **Données de test** pour démarrer immédiatement

### ✅ Backend Python Flask
- **API REST complète** avec 25+ endpoints
- **Authentification JWT** sécurisée
- **3 rôles** : Admin, Professeur, Étudiant
- **Gestion complète** : cours, suggestions, emplois du temps

### ✅ Documentation
- Guide de démarrage rapide
- Documentation API complète
- Scripts d'installation automatiques

---

## 🚀 Installation (5 minutes)

### 1️⃣ Prérequis

Installez si nécessaire :
- ✅ PostgreSQL 14+ → [Télécharger](https://www.postgresql.org/download/)
- ✅ Python 3.9+ → [Télécharger](https://www.python.org/downloads/)

### 2️⃣ Installer PostgreSQL

**Windows :**
1. Télécharger et installer PostgreSQL
2. Mémoriser le mot de passe de l'utilisateur `postgres`
3. Vérifier que le service PostgreSQL est démarré

**Vérification :**
```bash
psql --version
# Doit afficher: psql (PostgreSQL) 14.x
```

### 3️⃣ Configurer Python

```bash
# Ouvrir un terminal dans le dossier du projet
cd "F:\CODING\Nouveau dossier (2)"

# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement
venv\Scripts\activate

# Installer les dépendances
cd backend
pip install -r requirements.txt
```

### 4️⃣ Configurer la Base de Données

```bash
# Copier le fichier de configuration
copy .env.example .env

# IMPORTANT : Éditer .env et mettre votre mot de passe PostgreSQL
notepad .env
```

Dans le fichier `.env`, modifier cette ligne :
```env
DB_PASSWORD=VOTRE_MOT_DE_PASSE_POSTGRES
```

### 5️⃣ Initialiser la Base de Données

```bash
# Aller dans le dossier database
cd ..\database

# Lancer le script d'installation
python setup_database.py
```

**Suivez les instructions** :
- Host: `localhost` (appuyez sur Entrée)
- Port: `5432` (appuyez sur Entrée)
- User: `postgres` (appuyez sur Entrée)
- Database: `gestion_cours_db` (appuyez sur Entrée)
- **Password: VOTRE MOT DE PASSE**
- Insérer données de test: `O` (Oui)

✅ La base de données est créée avec des données de test !

### 6️⃣ Démarrer le Serveur

```bash
# Retour au dossier backend
cd ..\backend

# Démarrer le serveur Flask
python run.py
```

Vous devriez voir :
```
============================================================
🎓 SERVEUR API - GESTION DES COURS UNIVERSITAIRES
============================================================
🌐 Serveur démarré sur http://localhost:5000
```

### 7️⃣ Vérifier l'Installation

Ouvrez votre navigateur : **http://localhost:5000/health**

✅ Si vous voyez `"status": "healthy"` → **Tout fonctionne !**

---

## 🎯 Comptes de Test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | admin@univ.fr | password123 |
| **Professeur** | prof@univ.fr | password123 |
| **Étudiant** | etudiant@univ.fr | password123 |

---

## 📝 Tester l'API

### Test 1 : Connexion

**Navigateur ou Postman :**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@univ.fr",
  "password": "password123"
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "access_token": "eyJ0eXAiOiJKV1QiLCJ...",
  "user": {
    "id": 1,
    "email": "admin@univ.fr",
    "first_name": "Admin",
    "role": {
      "name": "admin"
    }
  }
}
```

### Test 2 : Liste des Cours

**Utiliser le token obtenu :**
```
GET http://localhost:5000/api/courses
Authorization: Bearer VOTRE_TOKEN_ICI
```

---

## 🔗 Connecter le Frontend

Votre frontend HTML existant doit maintenant utiliser l'API au lieu de `localStorage`.

### Modifier `auth.js`

**AVANT (localStorage) :**
```javascript
login(email, password, role) {
    const credentials = {
        'admin@univ.fr': { password: 'admin123', role: 'admin' },
        // ...
    };
    // Logique localStorage...
}
```

**APRÈS (API) :**
```javascript
async login(email, password, role) {
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
            localStorage.setItem('userRole', data.user.role.name);
            
            return {
                success: true,
                user: data.user,
                message: 'Connexion réussie'
            };
        } else {
            return {
                success: false,
                message: data.message
            };
        }
    } catch (error) {
        return {
            success: false,
            message: 'Erreur de connexion au serveur'
        };
    }
}
```

### Utiliser le Token dans les Requêtes

```javascript
async function getCourses() {
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:5000/api/courses', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    const data = await response.json();
    return data.courses;
}
```

---

## 📚 Documentation

| Fichier | Description |
|---------|-------------|
| `README_DATABASE.md` | Documentation complète et détaillée |
| `QUICKSTART.md` | Guide de démarrage rapide |
| `STRUCTURE_PROJET.md` | Architecture du projet |
| `START_HERE.md` | Ce fichier |

---

## 🆘 Problèmes Courants

### ❌ "Connection refused"
**Solution :** PostgreSQL n'est pas démarré
```bash
# Windows : Vérifier Services → PostgreSQL
# Linux : sudo service postgresql start
```

### ❌ "ModuleNotFoundError"
**Solution :** Activer l'environnement virtuel
```bash
venv\Scripts\activate
```

### ❌ "Authentication failed for user postgres"
**Solution :** Vérifier le mot de passe dans `.env`

### ❌ "Database does not exist"
**Solution :** Relancer le script d'installation
```bash
cd database
python setup_database.py
```

---

## 📡 Endpoints Disponibles

### Authentification (`/api/auth`)
- `POST /register` - Inscription
- `POST /login` - Connexion
- `GET /me` - Profil utilisateur
- `POST /logout` - Déconnexion

### Cours (`/api/courses`)
- `GET /` - Liste des cours
- `GET /<id>` - Détails d'un cours
- `POST /` - Créer un cours (Admin)
- `PUT /<id>` - Modifier un cours (Admin)
- `DELETE /<id>` - Supprimer un cours (Admin)
- `GET /schedule` - Emploi du temps
- `GET /my-courses` - Mes cours
- `POST /<id>/enroll` - S'inscrire à un cours

### Suggestions (`/api/suggestions`)
- `GET /` - Liste des suggestions
- `GET /<id>` - Détails d'une suggestion
- `POST /` - Créer une suggestion (Professeur)
- `POST /<id>/approve` - Approuver (Admin)
- `POST /<id>/reject` - Rejeter (Admin)
- `GET /stats` - Statistiques

---

## 🎯 Prochaines Étapes

### Phase 1 : Local (MAINTENANT) ✅
1. ✅ Installer PostgreSQL
2. ✅ Configurer le backend
3. ✅ Initialiser la base de données
4. ✅ Tester l'API
5. ⏭️ Connecter le frontend
6. ⏭️ Tester l'application complète

### Phase 2 : Développement
- Ajouter plus de fonctionnalités
- Améliorer l'interface
- Tests unitaires
- Optimisations

### Phase 3 : AWS (FUTUR)
- Créer instance RDS PostgreSQL
- Déployer sur EC2/Elastic Beanstalk
- Configuration production
- Mise en ligne

---

## ✨ Fonctionnalités

✅ Authentification sécurisée (JWT)  
✅ Gestion multi-rôles (Admin/Prof/Étudiant)  
✅ CRUD complet sur les cours  
✅ Système de suggestions  
✅ Détection automatique de conflits  
✅ Emplois du temps dynamiques  
✅ Gestion des salles et équipements  
✅ Notifications utilisateurs  
✅ Audit et traçabilité  
✅ API REST documentée  
✅ Prêt pour AWS RDS  

---

## 📞 Support

**En cas de problème :**

1. Vérifier les logs du serveur Flask (terminal)
2. Vérifier `/health` endpoint
3. Consulter `README_DATABASE.md`
4. Vérifier que PostgreSQL est démarré

---

## 🎉 Félicitations !

Votre infrastructure backend est maintenant **opérationnelle** ! 

**Testez-la dès maintenant :**
```bash
# Terminal 1 : Serveur backend
cd backend
python run.py

# Terminal 2 : Test
curl http://localhost:5000/health
```

**Bon développement !** 🚀

---

*Créé avec ❤️ pour votre projet de gestion de cours universitaires*

