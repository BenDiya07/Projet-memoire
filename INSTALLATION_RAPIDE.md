# 🚀 Installation Rapide - Faire Fonctionner l'Inscription

## ⚡ Commandes à Exécuter (Copier-Coller)

### **1️⃣ Installer les Dépendances Python**

Ouvrez un **nouveau terminal** (important !) et tapez :

```bash
cd "F:\CODING\Nouveau dossier (2)\backend"
pip install flask flask-cors flask-sqlalchemy flask-migrate flask-jwt-extended bcrypt python-jose passlib email-validator python-dotenv python-dateutil pytz psycopg2
```

**Attendez que tout s'installe (1-2 minutes)...**

---

### **2️⃣ Créer le Fichier .env**

**Option A : Manuellement**

1. Créer un fichier nommé `.env` dans le dossier `backend/`
2. Copier ce contenu dedans :

```env
# Base de données
DB_NAME=university
DB_PASSWORD=METTEZ_VOTRE_MOT_DE_PASSE_ICI

# Autres configs
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=dev-secret-key-2024
JWT_SECRET_KEY=jwt-secret-key-2024
CORS_ORIGINS=*
SQL_ECHO=False
```

3. **⚠️ IMPORTANT : Remplacez `METTEZ_VOTRE_MOT_DE_PASSE_ICI` par votre vrai mot de passe PostgreSQL !**

4. Sauvegarder

**Option B : Via PowerShell**

```powershell
cd "F:\CODING\Nouveau dossier (2)\backend"

$envContent = @"
DB_NAME=university
DB_PASSWORD=VOTRE_MOT_DE_PASSE
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=dev-secret-key-2024
JWT_SECRET_KEY=jwt-secret-key-2024
CORS_ORIGINS=*
SQL_ECHO=False
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
```

**N'oubliez pas de changer `VOTRE_MOT_DE_PASSE` !**

---

### **3️⃣ Démarrer le Backend**

```bash
cd "F:\CODING\Nouveau dossier (2)\backend"
python run.py
```

**Vous devriez voir :**
```
============================================================
🎓 SERVEUR API - GESTION DES COURS UNIVERSITAIRES
============================================================

🌐 Serveur démarré sur http://localhost:5000
🔧 Mode: DEBUG
📊 Base de données: university

✨ Le serveur est prêt !
```

---

### **4️⃣ Vérifier que Ça Marche**

**Test 1 : API Health**

Ouvrir dans le navigateur :
```
http://localhost:5000/health
```

Résultat attendu :
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "development"
}
```

✅ Si vous voyez ça → **TOUT EST OK !**

---

### **5️⃣ Tester l'Inscription**

**Test Rapide (Console Navigateur) :**

1. Ouvrir `login.html` dans le navigateur
2. Appuyer sur **F12** (Console)
3. Copier-coller ce code :

```javascript
fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
        studentId: '2024001'
    })
})
.then(r => r.json())
.then(d => {
    console.log('Résultat:', d);
    if(d.success) {
        alert('✅ INSCRIPTION RÉUSSIE !');
    } else {
        alert('❌ Erreur: ' + d.message);
    }
});
```

4. Appuyer sur **Entrée**

✅ **Si vous voyez "INSCRIPTION RÉUSSIE !" → ÇA MARCHE !** 🎉

---

### **6️⃣ Test via l'Interface**

1. **Cliquer sur l'onglet "Inscription"**
2. **Remplir le formulaire**
3. **Cliquer "S'inscrire"**

---

## 🔍 Vérifier dans la Base de Données

**Via pgAdmin :**
```
university → Tables → users → Clic droit → View/Edit Data → All Rows
```

**Via Python :**
```bash
cd database
python show_tables.py
```

**Via SQL Shell :**
```sql
\c university
SELECT * FROM users;
```

---

## ❌ Problèmes Courants

### **Erreur : ModuleNotFoundError**

**Solution :** Réinstaller les dépendances
```bash
pip install -r backend/requirements.txt
```

### **Erreur : "could not connect to server"**

**Solution :** PostgreSQL n'est pas démarré

**Windows :**
```bash
net start postgresql-x64-14
```

**Ou via Services :**
- `Windows + R` → `services.msc`
- Chercher "postgresql"
- Clic droit → Démarrer

### **Erreur : "authentication failed"**

**Solution :** Mauvais mot de passe dans `.env`

Vérifier `backend/.env` :
```env
DB_PASSWORD=VOTRE_VRAI_MOT_DE_PASSE
```

### **Erreur : "CORS policy"**

**Solution :** Déjà configuré ! Mais si problème, vérifier `backend/.env` :
```env
CORS_ORIGINS=*
```

---

## 📝 Checklist Complète

- [ ] PostgreSQL démarré
- [ ] Base `university` créée
- [ ] Dépendances Python installées (`pip install ...`)
- [ ] Fichier `backend/.env` créé avec le bon mot de passe
- [ ] Backend démarré (`python run.py`)
- [ ] `/health` retourne "connected"
- [ ] Test d'inscription réussi

---

## 🎯 Commandes Rapides - Résumé

```bash
# 1. Installer les dépendances
cd backend
pip install flask flask-cors flask-sqlalchemy flask-jwt-extended bcrypt psycopg2 python-dotenv

# 2. Créer .env (n'oubliez pas le mot de passe !)
# Créer manuellement le fichier backend/.env

# 3. Démarrer
python run.py

# 4. Tester
# Navigateur: http://localhost:5000/health
```

---

## ✅ Une Fois que Tout Marche

Vous pourrez :
- ✅ **S'inscrire** via le formulaire HTML
- ✅ **Se connecter** avec les comptes créés
- ✅ **Créer des cours** (admin)
- ✅ **Suggérer des cours** (professeur)
- ✅ **Voir l'emploi du temps** (étudiant)

---

**Suivez ces étapes et l'inscription fonctionnera à 100% !** 🚀

