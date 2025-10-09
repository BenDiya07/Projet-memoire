# ⚠️ Problème de Port Résolu

## 🔴 Problème Détecté

```
Une tentative d'accès à un socket de manière interdite par ses autorisations d'accès a été tentée
```

**Cause :** Le port **5500** est déjà utilisé par **Live Server** (extension VS Code).

---

## ✅ Solution Appliquée

Le backend utilise maintenant le **port 5001** au lieu de 5500.

### **Architecture Finale**

```
Frontend (HTML/JS)  →  Port 5500 (Live Server)
Backend (Flask API) →  Port 5001 (Notre serveur)
Base de données     →  Port 5432 (PostgreSQL)
```

---

## 📝 Configuration Mise à Jour

### **Fichier .env à créer** (backend/.env)

```env
# Backend sur port 5001
PORT=5001

# Base de données
DB_NAME=university
DB_PASSWORD=VOTRE_MOT_DE_PASSE_POSTGRES

# Développement
FLASK_ENV=development
FLASK_DEBUG=1

# Sécurité
SECRET_KEY=dev-secret-key-2024
JWT_SECRET_KEY=jwt-secret-key-2024

# CORS - Autoriser les requêtes depuis Live Server (port 5500)
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500,file://
```

---

## 🚀 Démarrer l'Application

### **1. Créer le fichier .env**

Créez `backend/.env` avec le contenu ci-dessus.

**⚠️ N'oubliez pas de changer le mot de passe !**

### **2. Démarrer le Backend**

```bash
cd backend
python run.py
```

**Le serveur démarrera sur :** `http://localhost:5001`

### **3. Ouvrir le Frontend**

**Option A : Avec Live Server (Recommandé)**
- Clic droit sur `login.html` → "Open with Live Server"
- Ouvrira sur : `http://localhost:5500` (ou 127.0.0.1:5500)

**Option B : Directement**
- Double-clic sur `login.html`
- Ouvrira avec : `file:///...`

---

## ✅ URLs Finales

### **Frontend (Live Server)**
- `http://localhost:5500/login.html`
- `http://localhost:5500/dashboard.html`
- etc.

### **Backend API (Flask)**
- Health: `http://localhost:5001/health`
- Login: `http://localhost:5001/api/auth/login`
- Register: `http://localhost:5001/api/auth/register`
- Courses: `http://localhost:5001/api/courses`
- Suggestions: `http://localhost:5001/api/suggestions`

---

## 🧪 Test Complet

### **1. Démarrer le Backend**

```bash
cd backend
python run.py
```

Devrait afficher :
```
🌐 Serveur démarré sur http://localhost:5001
📊 Base de données: university
```

### **2. Vérifier la Santé**

Ouvrir dans le navigateur :
```
http://localhost:5001/health
```

Attendu :
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### **3. Ouvrir le Frontend**

**Avec Live Server :**
- Clic droit sur `login.html` → Open with Live Server
- Va ouvrir `http://localhost:5500/login.html`

### **4. Tester l'Inscription**

- Cliquer sur "Inscription"
- Remplir le formulaire
- S'inscrire
- → Le frontend (port 5500) appellera le backend (port 5001)

---

## 🔍 Vérifier Quel Port est Utilisé

### **Windows (PowerShell)**

```powershell
# Voir ce qui utilise le port 5500
netstat -ano | findstr :5500

# Voir ce qui utilise le port 5001
netstat -ano | findstr :5001
```

### **Tuer un Processus si Nécessaire**

```powershell
# Trouver le PID du processus
netstat -ano | findstr :5001

# Tuer le processus (remplacez PID par le numéro)
taskkill /PID <PID> /F
```

---

## 📋 Modifications Appliquées

✅ **backend/run.py** - Port changé à 5001  
✅ **auth.js** - URL API mise à jour pour port 5001  
✅ **CORS configuré** - Autorise les requêtes depuis port 5500  

---

## 🎯 Workflow Complet

```
1. L'utilisateur ouvre login.html avec Live Server
   → Frontend sur http://localhost:5500

2. L'utilisateur remplit le formulaire d'inscription
   → JavaScript envoie une requête POST

3. Requête vers http://localhost:5001/api/auth/register
   → Backend Flask traite la requête

4. Backend vérifie la base de données (PostgreSQL port 5432)
   → Crée l'utilisateur

5. Backend renvoie la réponse au frontend
   → Frontend affiche "Inscription réussie !"
```

---

## ✨ C'est Prêt !

Maintenant :
- ✅ **Frontend** : Port 5500 (Live Server)
- ✅ **Backend** : Port 5001 (Flask)
- ✅ **Base de données** : Port 5432 (PostgreSQL)
- ✅ **CORS configuré** pour permettre la communication

**Démarrez le backend et testez !** 🚀

---

## 🆘 Si Problème Persiste

### **Erreur : "Port already in use"**

Changez le port dans `backend/.env` :
```env
PORT=8000
```

Et dans `auth.js`, changez toutes les URLs :
```javascript
fetch('http://localhost:8000/api/auth/login', ...)
```

### **Erreur : "CORS policy"**

Vérifiez que dans `backend/.env` :
```env
CORS_ORIGINS=http://localhost:5500,*
```

---

**Tout est configuré ! Créez le fichier .env et démarrez !** 🎉

