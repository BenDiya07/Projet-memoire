# 📁 Dossier Database

## Contenu

### `schema.sql`
Schéma complet de la base de données PostgreSQL avec :
- Définition de toutes les tables
- Contraintes d'intégrité
- Index pour performance
- Triggers pour logique automatique
- Vues SQL pour requêtes complexes

### `init_db.sql`
Données initiales pour le développement :
- Comptes de test (admin, professeur, étudiant)
- Exemples de cours
- Salles et équipements
- Suggestions de test

### `setup_database.py`
Script Python interactif pour :
- Créer la base de données
- Exécuter le schéma
- Insérer les données de test
- Vérifier l'installation

## Utilisation

```bash
# Installation complète
python setup_database.py

# Ou manuellement avec psql
psql -U postgres
CREATE DATABASE gestion_cours_db;
\c gestion_cours_db
\i schema.sql
\i init_db.sql
```

## Structure des Tables

### Core
- `users` - Utilisateurs du système
- `roles` - Rôles (admin, professor, student)

### Cours
- `courses` - Cours disponibles
- `course_schedules` - Planning/horaires
- `student_enrollments` - Inscriptions

### Gestion
- `rooms` - Salles de cours
- `equipment` - Équipements disponibles
- `room_equipment` - Équipements par salle

### Suggestions
- `course_suggestions` - Suggestions de cours
- `conflicts` - Détection de conflits

### Système
- `notifications` - Notifications utilisateurs
- `audit_logs` - Journal d'audit

## Notes

- Toutes les tables ont des timestamps (created_at, updated_at)
- Les triggers mettent à jour automatiquement updated_at
- Les conflits sont détectés automatiquement
- Les contraintes garantissent l'intégrité des données

