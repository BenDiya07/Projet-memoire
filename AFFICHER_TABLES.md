# 📊 Guide Complet - Afficher les Tables PostgreSQL

## 🎯 Plusieurs Méthodes Au Choix

---

## ✨ **Méthode 1 : pgAdmin (RECOMMANDÉ - Interface Graphique)**

### **Étapes :**

1. **Ouvrir pgAdmin 4**
   - Cherchez "pgAdmin" dans le menu Démarrer Windows
   - Ou tapez `pgAdmin` dans la barre de recherche

2. **Se connecter**
   - Clic sur `Servers` dans le panneau de gauche
   - Clic sur `PostgreSQL 14` (ou votre version)
   - Entrez votre mot de passe maître

3. **Naviguer vers la base university**
   ```
   Servers
   └─ PostgreSQL 14
      └─ Databases
         └─ university
            └─ Schemas
               └─ public
                  └─ Tables  ← ICI !
   ```

4. **Voir les tables**
   - Toutes les tables apparaissent dans la liste !
   - **Clic droit** sur une table → **View/Edit Data** → **All Rows**

5. **Voir le contenu d'une table**
   - Sélectionnez une table
   - Onglet en haut : **Columns** (voir les colonnes)
   - **Clic droit** → **View/Edit Data** → **All Rows** (voir les données)

---

## 💻 **Méthode 2 : SQL Shell (psql)**

### **Étapes :**

1. **Ouvrir SQL Shell (psql)**
   - Cherchez "SQL Shell" dans le menu Démarrer
   - Ou cherchez "psql"

2. **Se connecter**
   ```
   Server [localhost]: [Entrée]
   Database [postgres]: university  ← IMPORTANT !
   Port [5432]: [Entrée]
   Username [postgres]: [Entrée]
   Password: [VOTRE_MOT_DE_PASSE]
   ```

3. **Lister toutes les tables**
   ```sql
   \dt
   ```

   **Résultat attendu :**
   ```
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
   ```

4. **Voir la structure d'une table**
   ```sql
   \d users
   ```

5. **Voir les données d'une table**
   ```sql
   SELECT * FROM users;
   SELECT * FROM courses;
   SELECT * FROM rooms;
   ```

6. **Compter les lignes**
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM courses;
   ```

7. **Voir toutes les vues**
   ```sql
   \dv
   ```

8. **Quitter psql**
   ```sql
   \q
   ```

---

## 🐍 **Méthode 3 : Script Python**

### **Option A : Script Interactif**

```bash
cd database
python show_tables.py
```

Entrez votre mot de passe et vous verrez :
- Liste de toutes les tables
- Nombre de lignes par table
- Colonnes de chaque table
- Liste des vues SQL

### **Option B : Script Rapide**

Créez un fichier `quick_check.py` :

```python
import psycopg2

conn = psycopg2.connect(
    host='localhost',
    user='postgres',
    password='VOTRE_MOT_DE_PASSE',  # ← Mettez votre mot de passe
    database='university'
)

cursor = conn.cursor()

# Lister les tables
cursor.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
""")

print("Tables :")
for (table,) in cursor.fetchall():
    cursor.execute(f"SELECT COUNT(*) FROM {table}")
    count = cursor.fetchone()[0]
    print(f"  • {table}: {count} ligne(s)")

cursor.close()
conn.close()
```

Puis exécutez :
```bash
python quick_check.py
```

---

## 🌐 **Méthode 4 : Via le Backend Flask**

### **Créer un endpoint de debug**

Dans `backend/app.py`, ajoutez cette route :

```python
@app.route('/debug/tables')
def debug_tables():
    """Afficher toutes les tables"""
    from sqlalchemy import inspect
    
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    
    result = {}
    for table_name in tables:
        # Compter les lignes
        count = db.session.execute(f"SELECT COUNT(*) FROM {table_name}").scalar()
        result[table_name] = {
            'rows': count,
            'columns': [col['name'] for col in inspector.get_columns(table_name)]
        }
    
    return jsonify({
        'success': True,
        'tables': result,
        'total_tables': len(tables)
    })
```

Puis :
```bash
cd backend
python run.py
```

Ouvrir dans le navigateur :
```
http://localhost:5000/debug/tables
```

---

## 📋 **Commandes SQL Utiles**

### **Lister les tables**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### **Détails d'une table**
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';
```

### **Compter les lignes de toutes les tables**
```sql
SELECT 
    schemaname,
    tablename,
    n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY tablename;
```

### **Taille des tables**
```sql
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### **Voir les index**
```sql
SELECT 
    tablename, 
    indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

### **Voir les vues**
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
```

---

## 🎯 **Quelle Méthode Choisir ?**

| Méthode | Facilité | Visuel | Détails |
|---------|----------|--------|---------|
| **pgAdmin** | ⭐⭐⭐⭐⭐ | ✅ Interface graphique | Recommandé pour débutants |
| **SQL Shell** | ⭐⭐⭐ | ❌ Ligne de commande | Rapide et puissant |
| **Python Script** | ⭐⭐⭐⭐ | ✅ Output formaté | Automatisable |
| **Backend Flask** | ⭐⭐⭐⭐ | ✅ API JSON | Pour développeurs |

---

## ✅ **Résultat Attendu**

Vous devriez voir **14 tables** :

1. ✅ **users** - Utilisateurs (admin, professeurs, étudiants)
2. ✅ **roles** - Rôles du système
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

**+ 4 Vues SQL :**
- v_complete_schedule
- v_pending_suggestions
- v_dashboard_stats
- v_active_conflicts

---

## 🔍 **Vérification Rapide**

### **Dans SQL Shell (psql) :**

```sql
-- Se connecter
\c university

-- Compter les tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Devrait retourner : 14 (ou plus)

-- Voir un résumé
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') AS tables,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') AS views,
    (SELECT COUNT(*) FROM users) AS users;
```

---

## 💡 **Conseils**

- **Pour débuter** : Utilisez **pgAdmin** (interface graphique simple)
- **Pour apprendre SQL** : Utilisez **SQL Shell** (psql)
- **Pour automatiser** : Utilisez les **scripts Python**
- **Pour l'API** : Utilisez le **backend Flask**

---

## 🆘 **Si Vous Ne Voyez Aucune Table**

```sql
-- Vérifier que vous êtes bien connecté à 'university'
SELECT current_database();

-- Vérifier le schéma
SELECT current_schema();

-- Lister TOUTES les tables (tous schémas)
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
```

---

**Quelle méthode préférez-vous ? Je peux vous guider étape par étape !** 😊

