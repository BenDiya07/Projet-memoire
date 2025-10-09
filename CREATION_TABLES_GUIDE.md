# 🗄️ Guide de Création des Tables PostgreSQL

## 🎯 Deux Méthodes au Choix

---

## ✨ **Méthode 1 : Script Python Automatique (RECOMMANDÉ)**

### **Avantages :**
- ✅ Tout automatique
- ✅ Crée la base de données
- ✅ Crée toutes les tables
- ✅ Insère les données de test
- ✅ Vérifie que tout fonctionne

### **Étapes :**

#### 1️⃣ Ouvrir un terminal (CMD ou PowerShell)

**Touches :** `Windows + R` → taper `cmd` → `Entrée`

#### 2️⃣ Aller dans le dossier du projet

```bash
cd "F:\CODING\Nouveau dossier (2)\database"
```

#### 3️⃣ Lancer le script

```bash
python setup_database.py
```

#### 4️⃣ Suivre les instructions

Le script va vous demander :

```
📋 Configuration de la connexion PostgreSQL
(Appuyez sur Entrée pour utiliser la valeur par défaut)

Host [localhost]: 
```
→ **Appuyez sur Entrée**

```
Port [5432]: 
```
→ **Appuyez sur Entrée**

```
Utilisateur [postgres]: 
```
→ **Appuyez sur Entrée**

```
Nom de la base [gestion_cours_db]: 
```
→ **Appuyez sur Entrée**

```
Mot de passe PostgreSQL: 
```
→ **ENTREZ VOTRE MOT DE PASSE POSTGRES** (celui que vous avez défini lors de l'installation)

```
📊 Insérer les données de test? (O/n): 
```
→ **Tapez `O` puis Entrée**

#### 5️⃣ Résultat Attendu

Vous devriez voir :

```
============================================================
🎓 CONFIGURATION BASE DE DONNÉES - GESTION COURS UNIVERSITAIRES
============================================================

📦 Création de la base de données 'gestion_cours_db'...
✅ Base de données 'gestion_cours_db' créée avec succès!

🔌 Connexion à PostgreSQL sur localhost:5432...
✅ Connexion établie!

📋 Exécution du schéma (schema.sql)...
✅ Schéma créé avec succès!

📊 Insertion des données de test (init_db.sql)...
✅ Données de test insérées avec succès!

📊 RÉSUMÉ DE LA BASE DE DONNÉES:
   👥 Utilisateurs: 6
   📚 Cours: 5
   🏫 Salles: 8
   💡 Suggestions en attente: 2

✨ Configuration terminée avec succès!

📝 COMPTES DE TEST:
   Admin:      admin@univ.fr / password123
   Professeur: prof@univ.fr / password123
   Étudiant:   etudiant@univ.fr / password123

🎉 Tout est prêt! Vous pouvez maintenant démarrer l'application.
```

#### ✅ **C'EST FAIT !** 

Les tables sont créées et prêtes à l'emploi !

---

## 🔧 **Méthode 2 : Manuellement avec psql**

### **Si vous préférez contrôler chaque étape**

#### 1️⃣ Ouvrir psql (SQL Shell)

Chercher dans le menu Démarrer : **"SQL Shell (psql)"**

#### 2️⃣ Se connecter

```
Server [localhost]: 
```
→ **Appuyez sur Entrée**

```
Database [postgres]: 
```
→ **Appuyez sur Entrée**

```
Port [5432]: 
```
→ **Appuyez sur Entrée**

```
Username [postgres]: 
```
→ **Appuyez sur Entrée**

```
Password for user postgres: 
```
→ **ENTREZ VOTRE MOT DE PASSE**

#### 3️⃣ Créer la base de données

```sql
CREATE DATABASE gestion_cours_db;
```

Vous devriez voir :
```
CREATE DATABASE
```

#### 4️⃣ Se connecter à la nouvelle base

```sql
\c gestion_cours_db
```

Vous devriez voir :
```
You are now connected to database "gestion_cours_db" as user "postgres".
```

#### 5️⃣ Exécuter le schéma

```sql
\i 'F:/CODING/Nouveau dossier (2)/database/schema.sql'
```

Vous devriez voir défiler :
```
CREATE EXTENSION
CREATE TABLE
CREATE TABLE
CREATE TABLE
...
CREATE INDEX
CREATE INDEX
CREATE TRIGGER
...
```

#### 6️⃣ Insérer les données de test

```sql
\i 'F:/CODING/Nouveau dossier (2)/database/init_db.sql'
```

Vous devriez voir :
```
INSERT 0 3
INSERT 0 3
INSERT 0 3
...
```

#### 7️⃣ Vérifier que tout est créé

```sql
-- Voir toutes les tables
\dt

-- Compter les utilisateurs
SELECT COUNT(*) FROM users;

-- Compter les cours
SELECT COUNT(*) FROM courses;

-- Voir les rôles
SELECT * FROM roles;
```

#### 8️⃣ Quitter psql

```sql
\q
```

---

## 📊 **Tables Créées (14 au total)**

Voici ce qui sera créé :

### **Tables Principales**

1. ✅ **roles** - Rôles (admin, professor, student)
2. ✅ **users** - Utilisateurs du système
3. ✅ **courses** - Cours disponibles
4. ✅ **course_schedules** - Planning des cours
5. ✅ **student_enrollments** - Inscriptions étudiants
6. ✅ **course_suggestions** - Suggestions de cours
7. ✅ **rooms** - Salles de cours
8. ✅ **equipment** - Équipements disponibles
9. ✅ **room_equipment** - Équipements par salle
10. ✅ **conflicts** - Conflits détectés
11. ✅ **notifications** - Notifications utilisateurs
12. ✅ **audit_logs** - Journal d'audit

### **Vues SQL**

1. ✅ **v_complete_schedule** - Emploi du temps complet
2. ✅ **v_pending_suggestions** - Suggestions en attente
3. ✅ **v_dashboard_stats** - Statistiques dashboard
4. ✅ **v_active_conflicts** - Conflits actifs

### **Triggers**

- ✅ Mise à jour automatique de `updated_at`
- ✅ Comptage automatique des étudiants inscrits
- ✅ Détection automatique des conflits

### **Données de Test Insérées**

**Utilisateurs (6) :**
- 1 Admin : admin@univ.fr
- 3 Professeurs : prof@univ.fr, dubois@univ.fr, leroy@univ.fr
- 3 Étudiants : etudiant@univ.fr, jean.dupont@univ.fr, alice.martin@univ.fr

**Cours (5) :**
- MATH-301 : Mathématiques Avancées
- PHYS-401 : Physique Quantique
- INFO-302 : Algorithmes Avancés
- MATH-201 : Statistiques
- INFO-101 : Introduction à la Programmation

**Salles (8) :**
- A101, A102 (Bâtiment A)
- B205, B206 (Bâtiment B)
- C301, C302 (Bâtiment C)
- D401, E101

**Équipements (6) :**
- Projecteur
- Ordinateurs
- Tableau blanc
- Microphone
- Caméra
- WiFi

**Suggestions (2) :**
- Intelligence Artificielle (INFO-401)
- Astrophysique (PHYS-501)

---

## 🔍 **Vérifier que Tout Fonctionne**

### **Méthode Rapide : Via le Backend**

1. **Démarrer le serveur Flask**

```bash
cd "F:\CODING\Nouveau dossier (2)\backend"
python run.py
```

2. **Ouvrir dans le navigateur**

```
http://localhost:5000/health
```

Si vous voyez :
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "development"
}
```

✅ **LES TABLES SONT CRÉÉES ET FONCTIONNELLES !**

### **Méthode SQL : Vérification Manuelle**

```sql
-- Se connecter à psql
psql -U postgres -d gestion_cours_db

-- Lister toutes les tables
\dt

-- Résultat attendu :
               List of relations
 Schema |         Name          | Type  |  Owner
--------+-----------------------+-------+----------
 public | audit_logs            | table | postgres
 public | conflicts             | table | postgres
 public | course_schedules      | table | postgres
 public | course_suggestions    | table | postgres
 public | courses               | table | postgres
 public | equipment             | table | postgres
 public | notifications         | table | postgres
 public | roles                 | table | postgres
 public | room_equipment        | table | postgres
 public | rooms                 | table | postgres
 public | student_enrollments   | table | postgres
 public | users                 | table | postgres

-- Compter les données
SELECT 
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM courses) AS courses,
    (SELECT COUNT(*) FROM rooms) AS rooms,
    (SELECT COUNT(*) FROM course_suggestions) AS suggestions;

-- Résultat attendu :
 users | courses | rooms | suggestions
-------+---------+-------+-------------
     6 |       5 |     8 |           2
```

---

## ❌ **En Cas de Problème**

### **Erreur : "could not connect to server"**

PostgreSQL n'est pas démarré.

**Solution Windows :**
1. `Windows + R`
2. Taper `services.msc`
3. Chercher "postgresql-x64-14" (ou votre version)
4. Clic droit → Démarrer

**Solution Ligne de commande :**
```bash
net start postgresql-x64-14
```

### **Erreur : "authentication failed"**

Mauvais mot de passe.

**Solution :**
- Vérifier le mot de passe que vous avez défini lors de l'installation de PostgreSQL
- Réessayer avec le bon mot de passe

### **Erreur : "database already exists"**

La base existe déjà.

**Solution Option 1 : Utiliser la base existante**
```sql
-- Se connecter
psql -U postgres

-- Se connecter à la base
\c gestion_cours_db

-- Vérifier les tables
\dt
```

**Solution Option 2 : Supprimer et recréer**
```sql
-- Se connecter
psql -U postgres

-- Supprimer la base
DROP DATABASE gestion_cours_db;

-- Recréer
CREATE DATABASE gestion_cours_db;

-- Relancer le script
\c gestion_cours_db
\i 'F:/CODING/Nouveau dossier (2)/database/schema.sql'
\i 'F:/CODING/Nouveau dossier (2)/database/init_db.sql'
```

### **Erreur : "python not found"**

Python n'est pas installé ou pas dans le PATH.

**Solution :**
1. Télécharger Python : https://www.python.org/downloads/
2. Installer en cochant "Add Python to PATH"
3. Redémarrer le terminal
4. Réessayer

---

## 📝 **Commandes Utiles**

### **Voir la structure d'une table**

```sql
-- Se connecter
psql -U postgres -d gestion_cours_db

-- Voir la structure
\d users
\d courses
\d course_schedules
```

### **Voir les données**

```sql
-- Tous les utilisateurs
SELECT * FROM users;

-- Tous les cours
SELECT * FROM courses;

-- Emploi du temps complet (vue)
SELECT * FROM v_complete_schedule;
```

### **Réinitialiser les données**

```sql
-- ATTENTION : Supprime tout !
DROP DATABASE gestion_cours_db;
CREATE DATABASE gestion_cours_db;
\c gestion_cours_db
\i 'F:/CODING/Nouveau dossier (2)/database/schema.sql'
\i 'F:/CODING/Nouveau dossier (2)/database/init_db.sql'
```

---

## 🎉 **Félicitations !**

Une fois les tables créées, vous pouvez :

1. ✅ **Démarrer le backend**
   ```bash
   cd backend
   python run.py
   ```

2. ✅ **Tester l'API**
   ```
   http://localhost:5000/health
   ```

3. ✅ **Utiliser l'application**
   - Ouvrir `login.html`
   - Se connecter avec un compte de test
   - Profiter du système !

---

## 📞 **Comptes de Test**

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@univ.fr | password123 |
| Professeur | prof@univ.fr | password123 |
| Étudiant | etudiant@univ.fr | password123 |

---

**Votre base de données est maintenant prête !** 🚀

