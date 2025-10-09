# 🔐 Connexion avec Détection Automatique du Rôle

## 📋 Ce qui a été modifié

### ✅ **Changements Implémentés**

1. **Formulaire de connexion simplifié** (`login.html`)
   - ❌ Suppression du sélecteur de rôle (radio buttons)
   - ✅ Seulement Email + Mot de passe

2. **Backend intelligent** (`backend/routes/auth.py`)
   - ✅ Détection automatique du rôle de l'utilisateur
   - ✅ Redirection appropriée selon le rôle

3. **Frontend mis à jour** (`auth.js` et `script.js`)
   - ✅ Appel API sans paramètre de rôle
   - ✅ Réception du rôle détecté automatiquement
   - ✅ Fallback en mode local si backend indisponible

---

## 🎯 Comment ça fonctionne maintenant

### **Avant (avec sélection de rôle)**

```
Utilisateur:
1. Entre email: admin@univ.fr
2. Entre mot de passe: password123
3. ❌ DOIT sélectionner: Admin
4. Clique sur "Se connecter"

Backend:
- Vérifie email + password + rôle sélectionné
- Si le rôle ne correspond pas → Erreur
```

### **Après (détection automatique)**

```
Utilisateur:
1. Entre email: admin@univ.fr
2. Entre mot de passe: password123
3. ✅ Clique sur "Se connecter" (c'est tout !)

Backend:
- Cherche l'utilisateur par email
- Vérifie le mot de passe
- ✅ DÉTECTE automatiquement que c'est un Admin
- Renvoie les infos avec le rôle
- Redirige vers le dashboard admin
```

---

## 📝 Exemple Concret

### **Test 1 : Connexion Admin**

```
Email: admin@univ.fr
Password: password123

→ Le système détecte automatiquement: ADMIN
→ Redirection vers: dashboard.html
```

### **Test 2 : Connexion Professeur**

```
Email: prof@univ.fr
Password: password123

→ Le système détecte automatiquement: PROFESSOR
→ Redirection vers: gestion.html
```

### **Test 3 : Connexion Étudiant**

```
Email: etudiant@univ.fr
Password: password123

→ Le système détecte automatiquement: STUDENT
→ Redirection vers: emploi-temps.html
```

---

## 🔄 Flux Technique Détaillé

### **1. L'utilisateur entre ses identifiants**

```html
<!-- login.html -->
<form id="loginForm">
    <input type="email" id="email" placeholder="Email">
    <input type="password" id="password" placeholder="Mot de passe">
    <!-- Plus de sélection de rôle ! -->
    <button type="submit">Se connecter</button>
</form>
```

### **2. Le JavaScript envoie au backend**

```javascript
// script.js & auth.js
const result = await authManager.login(email, password);
// Plus besoin d'envoyer le rôle !

// Requête HTTP
fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
        email: email,
        password: password
        // Pas de rôle envoyé !
    })
});
```

### **3. Le backend détecte le rôle**

```python
# backend/routes/auth.py
@auth_bp.route('/login', methods=['POST'])
def login():
    # 1. Récupérer email et password
    email = data.get('email')      # admin@univ.fr
    password = data.get('password') # password123
    
    # 2. Chercher l'utilisateur par email uniquement
    user = User.query.filter_by(email=email).first()
    
    # 3. Vérifier le mot de passe
    if bcrypt.checkpw(password, user.password_hash):
        # 4. ✅ Récupérer le rôle depuis la base de données
        role = user.role.name  # "admin"
        
        # 5. Créer le token avec le rôle
        token = create_access_token(
            identity=user.id,
            additional_claims={'role': role}
        )
        
        # 6. Renvoyer au frontend
        return {
            'success': True,
            'access_token': token,
            'user': {
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}",
                'role': {'name': role}  # ← Le rôle détecté !
            }
        }
```

### **4. PostgreSQL renvoie le rôle**

```sql
-- Requête automatique via SQLAlchemy
SELECT 
    users.id,
    users.email,
    users.first_name,
    users.last_name,
    roles.name AS role_name
FROM users
JOIN roles ON users.role_id = roles.id
WHERE users.email = 'admin@univ.fr';

-- Résultat:
-- role_name: 'admin'  ← Détecté automatiquement !
```

### **5. Le frontend reçoit le rôle**

```javascript
// auth.js
const data = await response.json();

if (data.success) {
    // Stocker le rôle détecté
    const detectedRole = data.user.role.name; // "admin"
    localStorage.setItem('userRole', detectedRole);
    
    // Rediriger selon le rôle
    if (detectedRole === 'admin') {
        window.location.href = 'dashboard.html';
    } else if (detectedRole === 'professor') {
        window.location.href = 'gestion.html';
    } else if (detectedRole === 'student') {
        window.location.href = 'emploi-temps.html';
    }
}
```

---

## 🧪 Tests

### **Tester la Connexion**

1. **Démarrer le backend**
   ```bash
   cd backend
   python run.py
   ```

2. **Ouvrir `login.html` dans le navigateur**

3. **Tester chaque rôle**
   
   **Admin :**
   ```
   Email: admin@univ.fr
   Password: password123
   → Devrait rediriger vers dashboard.html
   ```
   
   **Professeur :**
   ```
   Email: prof@univ.fr
   Password: password123
   → Devrait rediriger vers gestion.html
   ```
   
   **Étudiant :**
   ```
   Email: etudiant@univ.fr
   Password: password123
   → Devrait rediriger vers emploi-temps.html
   ```

### **Vérifier dans la Console**

Ouvrez la console du navigateur (F12), vous devriez voir :
```
✅ Connexion réussie en tant que: admin
```

---

## 🔒 Sécurité

### **Avantages de cette Approche**

✅ **Plus sûr** : L'utilisateur ne peut pas "choisir" un rôle différent  
✅ **Plus simple** : Moins de risque d'erreur (oublier de sélectionner le rôle)  
✅ **Meilleure UX** : Interface plus propre et intuitive  
✅ **Backend autoritaire** : Le rôle vient de la base de données, pas du client  

### **Comment c'est Sécurisé**

```javascript
// ❌ AVANT - L'utilisateur pouvait mentir
fetch('/api/auth/login', {
    body: {
        email: 'etudiant@univ.fr',
        password: 'etudiant123',
        role: 'admin'  // ← Mentir sur son rôle !
    }
});

// ✅ APRÈS - Le backend détecte le vrai rôle
fetch('/api/auth/login', {
    body: {
        email: 'etudiant@univ.fr',
        password: 'etudiant123'
        // Le backend va chercher le rôle dans la DB
    }
});
// Résultat: Rôle = 'student' (depuis la DB)
```

---

## 🎨 Interface Avant/Après

### **Avant**
```
┌─────────────────────────────┐
│  Email: [____________]      │
│  Password: [__________]     │
│                             │
│  Type de compte:            │
│  ○ Étudiant                 │
│  ○ Professeur               │
│  ○ Administrateur           │
│                             │
│  [Se connecter]             │
└─────────────────────────────┘
```

### **Après** ✨
```
┌─────────────────────────────┐
│  Email: [____________]      │
│  Password: [__________]     │
│                             │
│  [Se connecter]             │
└─────────────────────────────┘
```

**Plus simple, plus rapide !**

---

## 🔧 Mode Fallback (Sans Backend)

Si le backend n'est pas disponible, le système fonctionne encore en mode local :

```javascript
// auth.js - loginFallback()
try {
    // Tenter la connexion API
    const result = await fetch('http://localhost:5000/api/auth/login', ...);
} catch (error) {
    // Backend indisponible → Mode fallback
    return this.loginFallback(email, password);
}

// Détection locale du rôle
loginFallback(email, password) {
    const credentials = {
        'admin@univ.fr': { password: 'admin123', role: 'admin' },
        'prof@univ.fr': { password: 'prof123', role: 'professor' },
        'etudiant@univ.fr': { password: 'etudiant123', role: 'student' }
    };
    
    const userCreds = credentials[email];
    if (userCreds && userCreds.password === password) {
        // Détecte le rôle localement
        return { success: true, role: userCreds.role };
    }
}
```

---

## ✨ Avantages

✅ **UX améliorée** - Moins d'étapes pour se connecter  
✅ **Moins d'erreurs** - Impossible de se tromper de rôle  
✅ **Plus sûr** - Le rôle vient du serveur, pas du client  
✅ **Code plus propre** - Logique simplifiée  
✅ **Fallback** - Fonctionne même sans backend  

---

## 🚀 Prochaines Étapes

1. ✅ Tester la connexion avec chaque rôle
2. ✅ Vérifier que les redirections fonctionnent
3. ✅ S'assurer que le backend est démarré
4. ⏭️ Profiter de l'interface simplifiée !

---

## 📞 Comptes de Test

| Rôle | Email | Mot de passe | Page de redirection |
|------|-------|--------------|---------------------|
| **Admin** | admin@univ.fr | password123 | dashboard.html |
| **Professeur** | prof@univ.fr | password123 | gestion.html |
| **Étudiant** | etudiant@univ.fr | password123 | emploi-temps.html |

---

**C'est maintenant plus simple et plus intuitif !** 🎉

