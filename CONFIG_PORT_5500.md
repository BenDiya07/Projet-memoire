# ⚙️ Configuration Port 5500

## ✅ Modifications Appliquées

Le backend a été configuré pour utiliser le **port 5500** au lieu de 5000.

---

## 📝 Fichier .env à Créer

Créez un fichier `.env` dans `backend/` avec ce contenu :

```env
# Serveur sur port 5500
PORT=5500

# Base de données
DB_NAME=university
DB_PASSWORD=VOTRE_MOT_DE_PASSE_POSTGRES

# Développement
FLASK_ENV=development
FLASK_DEBUG=1

# Sécurité
SECRET_KEY=dev-secret-key-2024
JWT_SECRET_KEY=jwt-secret-key-2024

# CORS
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500,file://

# Autres
SQL_ECHO=False
```

**⚠️ Changez `VOTRE_MOT_DE_PASSE_POSTGRES` par votre vrai mot de passe !**

---

## 🚀 Démarrer le Backend

```bash
cd backend
python run.py
```

**Le serveur démarrera sur :** `http://localhost:5500`

---

## ✅ URLs Mises à Jour

### **Endpoints API**

- **Health Check :** `http://localhost:5500/health`
- **Login :** `http://localhost:5500/api/auth/login`
- **Register :** `http://localhost:5500/api/auth/register`
- **Courses :** `http://localhost:5500/api/courses`
- **Suggestions :** `http://localhost:5500/api/suggestions`

### **Frontend**

Le fichier `auth.js` a été mis à jour pour utiliser le port **5500**.

---

## 🧪 Test Rapide

### **1. Vérifier la santé du serveur**

```
http://localhost:5500/health
```

**Résultat attendu :**
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "development"
}
```

### **2. Test d'inscription (Console navigateur)**

```javascript
fetch('http://localhost:5500/api/auth/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        role: 'student'
    })
})
.then(r => r.json())
.then(d => console.log(d));
```

---

## 📋 Fichiers Modifiés

✅ **backend/run.py** - Port par défaut changé à 5500  
✅ **auth.js** - URL de l'API mise à jour  
✅ **backend/.env.example** - Template avec PORT=5500  

---

## 🔧 Si Vous Voulez Changer de Port

Modifiez simplement dans `backend/.env` :

```env
PORT=VOTRE_PORT_ICI
```

Pas besoin de modifier le code !

---

## ✨ Prochaines Étapes

1. ✅ Créer le fichier `backend/.env` avec votre mot de passe
2. ✅ Démarrer le backend : `python run.py`
3. ✅ Vérifier : `http://localhost:5500/health`
4. ✅ Ouvrir `login.html`
5. ✅ Tester l'inscription !

---

**Le backend est maintenant configuré pour le port 5500 !** 🎉

