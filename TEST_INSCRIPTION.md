# ✅ Test de l'Inscription - Guide Complet

## 🎯 Est-ce que l'inscription va fonctionner ?

**Réponse : OUI ! Mais il faut suivre ces étapes :**

---

## 📋 **Checklist Avant de Tester**

### ✅ **1. Base de données créée**
```
✓ Base 'university' créée
✓ Tables créées (14 tables)
```

### ⚠️ **2. Backend configuré**

**Vérifiez le fichier `backend/.env` :**

```env
DB_NAME=university          ← DOIT être "university" !
DB_PASSWORD=VOTRE_PASSWORD  ← Mettez votre mot de passe PostgreSQL
```

**Si le fichier n'existe pas ou est incorrect :**

1. Ouvrir `backend/.env`
2. Modifier :
   ```env
   DB_NAME=university
   DB_PASSWORD=VOTRE_VRAI_MOT_DE_PASSE
   ```
3. Sauvegarder

### ⚠️ **3. Dépendances Python installées**

```bash
cd backend
pip install -r requirements.txt
```

---

## 🚀 **Comment Tester l'Inscription (3 étapes)**

### **Étape 1 : Démarrer le Backend**

```bash
cd backend
python run.py
```

**Vous devriez voir :**
```
============================================================
🎓 SERVEUR API - GESTION DES COURS UNIVERSITAIRES
============================================================

🌐 Serveur démarré sur http://localhost:5000
🔧 Mode: DEBUG
📊 Base de données: university  ← Vérifiez que c'est bien "university" !

📝 Endpoints disponibles:
   - http://localhost:5000/health
   - http://localhost:5000/api/auth/login
   - http://localhost:5000/api/auth/register
...
```

### **Étape 2 : Vérifier la Connexion à la Base**

**Ouvrir dans le navigateur :**
```
http://localhost:5000/health
```

**Résultat attendu :**
```json
{
  "status": "healthy",
  "database": "connected",  ← IMPORTANT !
  "environment": "development"
}
```

✅ Si vous voyez `"database": "connected"` → **C'EST BON !**

❌ Si vous voyez une erreur → Vérifiez le mot de passe dans `.env`

### **Étape 3 : Tester l'Inscription**

#### **Option A : Via l'Interface HTML**

1. **Ouvrir `login.html`** dans votre navigateur

2. **Cliquer sur l'onglet "Inscription"**

3. **Remplir le formulaire :**
   ```
   Prénom: Jean
   Nom: Dupont
   Email: jean.dupont@test.fr
   Mot de passe: test1234
   Confirmer: test1234
   Numéro étudiant: 2024999 (optionnel)
   Type de compte: Étudiant
   ☑ J'accepte les conditions
   ```

4. **Cliquer sur "S'inscrire"**

5. **Résultat attendu :**
   ```
   ✅ Inscription réussie !
   ```

#### **Option B : Via l'API Directement (Test)**

**Avec un outil comme Postman, ou via JavaScript Console :**

```javascript
fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@test.fr',
        password: 'test1234',
        role: 'student',
        studentId: '2024999'
    })
})
.then(res => res.json())
.then(data => console.log(data));
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Inscription réussie",
  "user": {
    "id": 1,
    "email": "jean.dupont@test.fr",
    "first_name": "Jean",
    "last_name": "Dupont",
    "role": {
      "name": "student"
    }
  }
}
```

---

## ✅ **Vérifier que l'Inscription a Fonctionné**

### **Méthode 1 : Via pgAdmin**

1. Ouvrir pgAdmin
2. Naviguer : `university → Schemas → public → Tables → users`
3. Clic droit → View/Edit Data → All Rows
4. Vous devriez voir votre utilisateur !

### **Méthode 2 : Via SQL Shell**

```sql
-- Se connecter
\c university

-- Voir tous les utilisateurs
SELECT id, email, first_name, last_name, role FROM users;

-- Résultat attendu :
-- id | email                   | first_name | last_name | role
-- ---|-------------------------|------------|-----------|--------
--  1 | jean.dupont@test.fr     | Jean       | Dupont    | student
```

### **Méthode 3 : Via Python**

```python
import psycopg2

conn = psycopg2.connect(
    host='localhost',
    user='postgres',
    password='VOTRE_PASSWORD',
    database='university'
)

cursor = conn.cursor()
cursor.execute("SELECT email, first_name, last_name, role FROM users")
for row in cursor.fetchall():
    print(row)

cursor.close()
conn.close()
```

---

## 🔍 **Troubleshooting - Si ça ne Marche Pas**

### ❌ **Erreur : "Connection refused"**

**Cause :** Le backend n'est pas démarré

**Solution :**
```bash
cd backend
python run.py
```

---

### ❌ **Erreur : "Database connection error"**

**Cause :** Mauvais mot de passe dans `.env`

**Solution :**
1. Ouvrir `backend/.env`
2. Modifier `DB_PASSWORD=VOTRE_VRAI_MOT_DE_PASSE`
3. Redémarrer le backend

---

### ❌ **Erreur : "Un compte avec cet email existe déjà"**

**Cause :** Vous avez déjà créé cet utilisateur

**Solution :** Utilisez un autre email ou supprimez l'ancien :

```sql
-- Dans psql
DELETE FROM users WHERE email = 'jean.dupont@test.fr';
```

---

### ❌ **Erreur : "CORS policy"**

**Cause :** Le frontend et backend sont sur des domaines différents

**Solution :** Vérifiez que dans `backend/config.py` :
```python
CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
```

Ou dans `.env` :
```env
CORS_ORIGINS=*
```

---

### ❌ **Le formulaire ne fait rien**

**Cause :** Le JavaScript n'utilise pas encore l'API

**Solution :** Vérifiez que dans `script.js` la fonction `register` appelle bien l'API :

```javascript
// DOIT appeler l'API, pas localStorage
const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    // ...
});
```

---

## 🎯 **Flux Complet d'Inscription**

```
1. Utilisateur remplit le formulaire
   ↓
2. JavaScript envoie POST /api/auth/register
   ↓
3. Backend Flask reçoit la requête
   ↓
4. Vérifie que l'email n'existe pas déjà
   ↓
5. Hash le mot de passe avec bcrypt
   ↓
6. INSERT INTO users (PostgreSQL)
   ↓
7. Renvoie {success: true, user: {...}}
   ↓
8. Frontend affiche "Inscription réussie !"
```

---

## 📝 **Test Complet - Étape par Étape**

### **1. Préparer**
```bash
# Terminal 1 - Démarrer le backend
cd backend
python run.py
```

### **2. Vérifier**
```
# Navigateur
http://localhost:5000/health
→ Doit afficher "connected"
```

### **3. Inscrire**
```
# Ouvrir login.html
# Onglet "Inscription"
# Remplir et envoyer
```

### **4. Confirmer**
```sql
-- SQL Shell
\c university
SELECT * FROM users;
```

---

## ✅ **Résultat Final Attendu**

Après une inscription réussie :

1. ✅ Message : "Inscription réussie !"
2. ✅ Utilisateur dans la table `users`
3. ✅ Mot de passe hashé (sécurisé)
4. ✅ Rôle assigné correctement
5. ✅ Possibilité de se connecter immédiatement

---

## 🎉 **Pour Tester la Connexion Après Inscription**

1. Revenir à l'onglet "Connexion"
2. Email : `jean.dupont@test.fr`
3. Password : `test1234`
4. Cliquer "Se connecter"
5. → Devrait rediriger vers `emploi-temps.html` (étudiant)

---

## 💡 **Commandes Rapides Utiles**

```bash
# Démarrer le backend
cd backend && python run.py

# Vérifier la santé
curl http://localhost:5000/health

# Tester l'inscription (PowerShell)
Invoke-RestMethod -Uri http://localhost:5000/api/auth/register -Method POST -ContentType "application/json" -Body '{"firstName":"Test","lastName":"User","email":"test@test.fr","password":"test123","role":"student"}'

# Voir les utilisateurs (psql)
psql -U postgres -d university -c "SELECT * FROM users;"
```

---

**Maintenant, testez ! Le système est prêt !** 🚀

