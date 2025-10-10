# 🚀 Guide de Démarrage Rapide

## Installation en 5 minutes

### ✅ Étape 1 : Prérequis

Assurez-vous d'avoir installé :
- PostgreSQL 14+ (mot de passe `postgres` requis)
- Python 3.9+

### ✅ Étape 2 : Configuration Python

```bash
# Créer et activer l'environnement virtuel
python -m venv venv
venv\Scripts\activate  # Windows
# ou source venv/bin/activate  # Mac/Linux

# Installer les dépendances
cd backend
pip install -r requirements.txt
```

### ✅ Étape 3 : Configurer la base de données

```bash
# Créer le fichier .env
copy .env.example .env  # Windows
# ou cp .env.example .env  # Mac/Linux
```

Éditer `.env` et mettre votre mot de passe PostgreSQL :
```env
DB_PASSWORD=VOTRE_MOT_DE_PASSE_POSTGRES
```

### ✅ Étape 4 : Initialiser la base de données

```bash
cd database
python setup_database.py
```

Suivez les instructions à l'écran. Appuyez sur Entrée pour accepter les valeurs par défaut.

### ✅ Étape 5 : Démarrer le serveur

```bash
cd backend
python run.py
```

Le serveur démarre sur **http://localhost:5000**

### ✅ Étape 6 : Tester

Ouvrez votre navigateur : **http://localhost:5000/health**

Si vous voyez `"status": "healthy"` ➜ **C'est bon !** ✨

---

## 🎯 Comptes de Test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@univ.fr | password123 |
| Professeur | prof@univ.fr | password123 |
| Étudiant | etudiant@univ.fr | password123 |

---

## 🔗 Connecter le Frontend

Dans vos fichiers HTML, ouvrez `auth.js` et modifiez la fonction `login` :

```javascript
// Remplacer la logique localStorage par un appel API
async login(email, password, role) {
    const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
    });
    
    const data = await response.json();
    
    if (data.success) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        localStorage.setItem('userRole', data.user.role.name);
        return { success: true, user: data.user };
    }
    
    return { success: false, message: data.message };
}
```

---

## 📝 Endpoints Principaux

### Connexion
```
POST http://localhost:5000/api/auth/login
Body: {"email": "admin@univ.fr", "password": "password123"}
```

### Liste des cours
```
GET http://localhost:5000/api/courses
Headers: Authorization: Bearer VOTRE_TOKEN
```

### Créer une suggestion (Professeur)
```
POST http://localhost:5000/api/suggestions
Headers: Authorization: Bearer VOTRE_TOKEN
Body: {
  "course_name": "Nouveau cours",
  "justification": "Pourquoi ce cours est important..."
}
```

---

## 🛠️ Commandes Utiles

```bash
# Redémarrer PostgreSQL (Windows)
net stop postgresql-x64-14
net start postgresql-x64-14

# Voir les tables créées
psql -U postgres -d gestion_cours_db
\dt

# Réinitialiser la base de données
cd database
python setup_database.py
```

---

## ❓ Problèmes Courants

### "Connection refused"
➜ PostgreSQL n'est pas démarré. Démarrez-le via Services (Windows) ou `sudo service postgresql start` (Linux)

### "ModuleNotFoundError"
➜ Activez l'environnement virtuel : `venv\Scripts\activate`

### "Authentication failed"
➜ Vérifiez le mot de passe dans le fichier `.env`

---

## 🎉 C'est Parti !

Votre application est maintenant prête. 

Ouvrez `login.html` dans votre navigateur et connectez-vous avec un des comptes de test !

**Bon développement !** 🚀

