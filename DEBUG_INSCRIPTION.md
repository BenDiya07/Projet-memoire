# 🔧 Inscription Corrigée !

## ✅ Problème Identifié et Résolu

**Problème :** La fonction `register()` dans `auth.js` n'appelait pas l'API backend, elle utilisait uniquement localStorage.

**Solution :** Mise à jour de `auth.js` et `script.js` pour utiliser l'API.

---

## 🔄 Modifications Appliquées

### **1. auth.js - Fonction register() mise à jour**

```javascript
// AVANT (localStorage uniquement)
register(userData) {
    const existingUsers = this.getRegisteredUsers();
    // ... sauvegarde en localStorage
}

// APRÈS (API backend + fallback)
async register(userData) {
    const response = await fetch('http://localhost:5500/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(userData)
    });
    // ... avec fallback localStorage si backend indisponible
}
```

### **2. script.js - Formulaire d'inscription async**

```javascript
// AVANT
registerForm.addEventListener('submit', function(e) {
    const result = authManager.register(userData);
}

// APRÈS  
registerForm.addEventListener('submit', async function(e) {
    const result = await authManager.register(userData);
}
```

---

## 🚀 Test de l'Inscription

### **1. Vérifier que le Backend est Démarré**

```bash
cd backend
python run.py
```

Devrait afficher :
```
🌐 Serveur démarré sur http://localhost:5500
📊 Base de données: university
```

### **2. Vérifier la Connexion à la Base**

```
http://localhost:5500/health
```

Devrait retourner :
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### **3. Ouvrir le Frontend**

- Clic droit sur `login.html` → Open with Live Server
- Ou double-clic sur `login.html`

### **4. S'Inscrire**

1. **Cliquer sur l'onglet "Inscription"**
2. **Remplir :**
   - Prénom : `Jean`
   - Nom : `Dupont`
   - Email : `jean.dupont@test.fr`
   - Mot de passe : `test1234`
   - Confirmer : `test1234`
   - Numéro étudiant : `2024001` (optionnel)
   - Type : Étudiant
   - ☑ Accepter les conditions
3. **Cliquer "S'inscrire"**

**Résultat attendu :**
```
✅ Inscription réussie !

Nom: Jean Dupont
Email: jean.dupont@test.fr
Rôle: student
Numéro étudiant: 2024001

Vous pouvez maintenant vous connecter.
```

---

## 🔍 Vérifier dans la Base de Données

### **Via Python**

```bash
cd database
python show_tables.py
# Entrez votre mot de passe
# Devrait afficher: users: 1 ligne(s)
```

### **Via SQL Shell**

```sql
\c university
SELECT id, email, first_name, last_name, role FROM users;
```

### **Via pgAdmin**

```
university → Tables → users → Clic droit → View/Edit Data → All Rows
```

---

## 🧪 Test Complet - Étape par Étape

### **Étape 1 : Backend**

```bash
# Terminal 1
cd backend
python run.py
```

### **Étape 2 : Health Check**

```
Navigateur: http://localhost:5500/health
→ "database": "connected" ✅
```

### **Étape 3 : Frontend**

```
Ouvrir login.html
→ Onglet "Inscription"
```

### **Étape 4 : Remplir le Formulaire**

```
Prénom: Test
Nom: User
Email: test@example.com
Password: password123
Confirmer: password123
Rôle: Étudiant
☑ Conditions
```

### **Étape 5 : S'inscrire**

```
Cliquer "S'inscrire"
→ "Inscription en cours..."
→ "✅ Inscription réussie !"
```

### **Étape 6 : Se Connecter**

```
→ Bascule automatique vers l'onglet "Connexion"
Email: test@example.com
Password: password123
→ Connexion automatique !
→ Redirection vers emploi-temps.html
```

---

## 🔍 Debug - Console du Navigateur

Ouvrez la console (F12) pour voir :

```
📝 Données d'inscription: {firstName: "Test", lastName: "User", ...}
✅ Inscription réussie via API: {id: 1, email: "test@example.com", ...}
📊 Résultat de l'inscription: {success: true, user: {...}}
```

---

## 🆘 Dépannage

### **❌ Erreur : "Inscription en cours..." reste bloqué**

**Cause :** Backend pas démarré ou mauvaise URL

**Solution :**
1. Vérifier que le backend tourne sur port 5500
2. Vérifier la console (F12) pour les erreurs CORS ou réseau

### **❌ Erreur : "Un compte avec cet email existe déjà"**

**Cause :** Email déjà utilisé

**Solution :** Utiliser un autre email ou supprimer l'utilisateur :

```sql
DELETE FROM users WHERE email = 'test@example.com';
```

### **❌ Erreur : "database connection error"**

**Cause :** Mauvais mot de passe dans `.env`

**Solution :** 
```env
# backend/.env
DB_PASSWORD=VOTRE_VRAI_MOT_DE_PASSE
```

### **❌ Erreur : "CORS policy"**

**Cause :** Backend pas configuré pour CORS

**Solution :** Vérifier `backend/.env` :
```env
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500,file://,*
```

---

## ✅ Checklist Finale

- [ ] Backend démarré (`python run.py`)
- [ ] `/health` retourne "connected"
- [ ] Fichier `.env` existe avec le bon mot de passe
- [ ] Frontend ouvert (login.html)
- [ ] Console navigateur (F12) ouverte pour voir les logs
- [ ] Formulaire rempli correctement
- [ ] Bouton "S'inscrire" cliqué

---

## 🎯 Flux Complet

```
1. Utilisateur remplit le formulaire
   ↓
2. JavaScript valide les données (password match, etc.)
   ↓
3. Affiche "Inscription en cours..."
   ↓
4. Envoie POST http://localhost:5500/api/auth/register
   ↓
5. Backend vérifie que l'email n'existe pas
   ↓
6. Backend hash le mot de passe (bcrypt)
   ↓
7. Backend insère dans PostgreSQL (table users)
   ↓
8. Backend renvoie {success: true, user: {...}}
   ↓
9. Frontend affiche "✅ Inscription réussie !"
   ↓
10. Bascule vers l'onglet "Connexion"
```

---

## 📝 Test Rapide (Console)

Ouvrez la console du navigateur (F12) et tapez :

```javascript
authManager.register({
    firstName: 'Quick',
    lastName: 'Test',
    email: 'quick@test.fr',
    password: 'test1234',
    role: 'student',
    studentId: '2024999'
}).then(r => console.log('Résultat:', r));
```

Si ça affiche `{success: true, ...}` → **L'INSCRIPTION MARCHE !** ✅

---

**L'inscription est maintenant fonctionnelle avec l'API backend !** 🎉

