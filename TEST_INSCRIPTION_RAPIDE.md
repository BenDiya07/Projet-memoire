# 🚀 TEST RAPIDE - Inscription

## ✅ Problème Résolu !

**Le formulaire d'inscription appelle maintenant l'API backend correctement.**

---

## 🎯 Test en 3 Étapes

### **Étape 1 : Démarrer le Backend**

```bash
cd backend
python run.py
```

✅ **Devrait afficher :**
```
🌐 Serveur démarré sur http://localhost:5500
📊 Base de données: university
```

---

### **Étape 2 : Vérifier le Backend**

**Ouvrez dans le navigateur :**
```
http://localhost:5500/health
```

✅ **Devrait afficher :**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-..."
}
```

---

### **Étape 3 : S'Inscrire**

1. **Ouvrir `login.html`** (clic droit → Open with Live Server)

2. **Cliquer sur l'onglet "Inscription"**

3. **Remplir le formulaire :**
   ```
   Prénom : Jean
   Nom : Dupont
   Email : jean.dupont@test.fr
   Mot de passe : test1234
   Confirmer : test1234
   Numéro étudiant : 2024001
   Type : Étudiant
   ☑ J'accepte les conditions
   ```

4. **Cliquer "S'inscrire"**

✅ **Devrait afficher :**
```
✅ Inscription réussie !

Nom: Jean Dupont
Email: jean.dupont@test.fr
Rôle: student
Numéro étudiant: 2024001

Vous pouvez maintenant vous connecter.
```

---

## 🔍 Console du Navigateur (F12)

Vous devriez voir :

```
📝 Données d'inscription: {firstName: "Jean", lastName: "Dupont", ...}
✅ Inscription réussie via API: {id: 1, email: "jean.dupont@test.fr", ...}
📊 Résultat de l'inscription: {success: true, ...}
```

---

## ❌ Problèmes Possibles

### **"Inscription en cours..." reste bloqué**

**Vérifier :**
1. Backend est démarré ? → `cd backend && python run.py`
2. Port correct ? → `http://localhost:5500/health`
3. Console navigateur (F12) → Messages d'erreur ?

### **"database connection error"**

**Créer le fichier `.env` :**

```bash
cd backend
echo DB_NAME=university > .env
echo DB_USER=postgres >> .env
echo DB_PASSWORD=VOTRE_MOT_DE_PASSE >> .env
echo DB_HOST=localhost >> .env
echo DB_PORT=5432 >> .env
echo SECRET_KEY=dev-secret-key-change-in-production >> .env
echo JWT_SECRET_KEY=jwt-secret-key-change-in-production >> .env
```

**Remplacez `VOTRE_MOT_DE_PASSE` par votre mot de passe PostgreSQL !**

### **"Un compte avec cet email existe déjà"**

**Utiliser un autre email ou supprimer l'utilisateur :**

```sql
-- Dans psql :
\c university
DELETE FROM users WHERE email = 'jean.dupont@test.fr';
```

---

## ✅ Flux de l'Inscription

```
Formulaire
   ↓
Validation JavaScript
   ↓
POST http://localhost:5500/api/auth/register
   ↓
Backend vérifie l'email
   ↓
Hash du mot de passe (bcrypt)
   ↓
Insert dans PostgreSQL
   ↓
Réponse JSON {success: true}
   ↓
Message de succès
   ↓
Bascule vers l'onglet Connexion
```

---

## 🎉 Test Réussi ?

**Si l'inscription fonctionne, vous pouvez maintenant :**

1. **Se connecter** avec le compte créé
2. **Vérifier dans pgAdmin** que l'utilisateur est dans la table `users`
3. **Tester d'autres inscriptions** avec différents rôles

---

**L'inscription est maintenant 100% fonctionnelle !** ✅

