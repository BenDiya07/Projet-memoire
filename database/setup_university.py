#!/usr/bin/env python3
"""
Script de configuration pour utiliser la base de données university existante
"""

import psycopg2
from psycopg2 import sql
import os
import sys
from getpass import getpass

def execute_sql_file(conn, filepath):
    """Exécuter un fichier SQL"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        cursor = conn.cursor()
        cursor.execute(sql_content)
        conn.commit()
        cursor.close()
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de l'exécution de {filepath}: {e}")
        conn.rollback()
        return False

def setup_university_db():
    """Configuration de la base university"""
    print("=" * 60)
    print("🎓 CONFIGURATION BASE UNIVERSITY - MODE EXISTANT")
    print("=" * 60)
    
    # Configuration
    host = input("\nHost [localhost]: ").strip() or 'localhost'
    port = input("Port [5432]: ").strip() or '5432'
    user = input("Utilisateur [postgres]: ").strip() or 'postgres'
    db_name = input("Nom de la base [university]: ").strip() or 'university'
    password = getpass("Mot de passe PostgreSQL: ")
    
    if not password:
        print("❌ Le mot de passe est requis!")
        sys.exit(1)
    
    try:
        # Se connecter au serveur PostgreSQL
        print(f"\n🔌 Connexion à PostgreSQL sur {host}:{port}...")
        conn_postgres = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database='postgres'
        )
        conn_postgres.autocommit = True
        cursor = conn_postgres.cursor()
        
        # Vérifier si la base existe
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (db_name,)
        )
        exists = cursor.fetchone()
        
        if not exists:
            print(f"📦 Création de la base de données '{db_name}'...")
            cursor.execute(
                sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name))
            )
            print(f"✅ Base de données '{db_name}' créée!")
        else:
            print(f"ℹ️  La base de données '{db_name}' existe déjà.")
        
        cursor.close()
        conn_postgres.close()
        
        # Se connecter à la base university
        print(f"\n🔌 Connexion à la base '{db_name}'...")
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=db_name
        )
        
        print("✅ Connexion établie!")
        
        # Exécuter le schéma de base si nécessaire
        script_dir = os.path.dirname(os.path.abspath(__file__))
        university_sql = os.path.join(script_dir, 'university.sql')
        
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
        table_count = cursor.fetchone()[0]
        cursor.close()
        
        if table_count == 0:
            print("\n📋 Création des tables de base (university.sql)...")
            if execute_sql_file(conn, university_sql):
                print("✅ Tables de base créées!")
            else:
                print("❌ Erreur lors de la création des tables de base")
                return False
        else:
            print(f"\nℹ️  {table_count} table(s) déjà présente(s)")
        
        # Ajouter les améliorations
        print("\n🚀 Ajout des améliorations (nouvelles tables, triggers, vues)...")
        complete_schema = os.path.join(script_dir, 'create_complete_schema.sql')
        
        if execute_sql_file(conn, complete_schema):
            print("✅ Améliorations appliquées avec succès!")
        else:
            print("⚠️  Certaines améliorations n'ont pas pu être appliquées")
        
        # Afficher un résumé
        print("\n📊 RÉSUMÉ DE LA BASE DE DONNÉES:")
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM Users")
        print(f"   👥 Utilisateurs: {cursor.fetchone()[0]}")
        
        try:
            cursor.execute("SELECT COUNT(*) FROM Courses")
            print(f"   📚 Cours: {cursor.fetchone()[0]}")
        except:
            print(f"   📚 Cours: 0")
        
        try:
            cursor.execute("SELECT COUNT(*) FROM Rooms")
            print(f"   🏫 Salles: {cursor.fetchone()[0]}")
        except:
            print(f"   🏫 Salles: 0")
        
        try:
            cursor.execute("SELECT COUNT(*) FROM Course_Suggestions WHERE status = 'pending'")
            print(f"   💡 Suggestions en attente: {cursor.fetchone()[0]}")
        except:
            print(f"   💡 Suggestions en attente: 0")
        
        cursor.close()
        conn.close()
        
        print("\n✨ Configuration terminée avec succès!")
        print("\n📝 COMPTES DE TEST:")
        print("   Admin:      admin@univ.fr / password123")
        print("   Professeur: prof@univ.fr / password123")
        print("   Étudiant:   etudiant@univ.fr / password123")
        print("\n🚀 Vous pouvez maintenant démarrer le backend:")
        print("   cd backend")
        print("   python run.py")
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Erreur PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    success = setup_university_db()
    sys.exit(0 if success else 1)

