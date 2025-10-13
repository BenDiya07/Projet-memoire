#!/usr/bin/env python3
"""
Script de configuration pour utiliser la base de donnÃ©es university existante
"""

import psycopg2
from psycopg2 import sql
import os
import sys
from getpass import getpass

def execute_sql_file(conn, filepath):
    """ExÃ©cuter un fichier SQL"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        cursor = conn.cursor()
        cursor.execute(sql_content)
        conn.commit()
        cursor.close()
        return True
        
    except Exception as e:
        print(f"âŒ Erreur lors de l'exÃ©cution de {filepath}: {e}")
        conn.rollback()
        return False

def setup_university_db():
    """Configuration de la base university"""
    print("=" * 60)
    print("ðŸŽ“ CONFIGURATION BASE UNIVERSITY - MODE EXISTANT")
    print("=" * 60)
    
    # Configuration
    host = input("\nHost [localhost]: ").strip() or 'localhost'
    port = input("Port [5432]: ").strip() or '5432'
    user = input("Utilisateur [postgres]: ").strip() or 'postgres'
    db_name = input("Nom de la base [university]: ").strip() or 'university'
    password = getpass("Mot de passe PostgreSQL: ")
    
    if not password:
        print("âŒ Le mot de passe est requis!")
        sys.exit(1)
    
    try:
        # Se connecter au serveur PostgreSQL
        print(f"\nðŸ”Œ Connexion Ã  PostgreSQL sur {host}:{port}...")
        conn_postgres = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database='postgres'
        )
        conn_postgres.autocommit = True
        cursor = conn_postgres.cursor()
        
        # VÃ©rifier si la base existe
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (db_name,)
        )
        exists = cursor.fetchone()
        
        if not exists:
            print(f"ðŸ“¦ CrÃ©ation de la base de donnÃ©es '{db_name}'...")
            cursor.execute(
                sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name))
            )
            print(f"âœ… Base de donnÃ©es '{db_name}' crÃ©Ã©e!")
        else:
            print(f"â„¹ï¸  La base de donnÃ©es '{db_name}' existe dÃ©jÃ .")
        
        cursor.close()
        conn_postgres.close()
        
        # Se connecter Ã  la base university
        print(f"\nðŸ”Œ Connexion Ã  la base '{db_name}'...")
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=db_name
        )
        
        print("âœ… Connexion Ã©tablie!")
        
        # ExÃ©cuter le schÃ©ma de base si nÃ©cessaire
        script_dir = os.path.dirname(os.path.abspath(__file__))
        university_sql = os.path.join(script_dir, 'university.sql')
        
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
        table_count = cursor.fetchone()[0]
        cursor.close()
        
        if table_count == 0:
            print("\nðŸ“‹ CrÃ©ation des tables de base (university.sql)...")
            if execute_sql_file(conn, university_sql):
                print("âœ… Tables de base crÃ©Ã©es!")
            else:
                print("âŒ Erreur lors de la crÃ©ation des tables de base")
                return False
        else:
            print(f"\nâ„¹ï¸  {table_count} table(s) dÃ©jÃ  prÃ©sente(s)")
        
        # Ajouter les amÃ©liorations
        print("\nðŸš€ Ajout des amÃ©liorations (nouvelles tables, triggers, vues)...")
        complete_schema = os.path.join(script_dir, 'create_complete_schema.sql')
        
        if execute_sql_file(conn, complete_schema):
            print("âœ… AmÃ©liorations appliquÃ©es avec succÃ¨s!")
        else:
            print("âš ï¸  Certaines amÃ©liorations n'ont pas pu Ãªtre appliquÃ©es")
        
        # Afficher un rÃ©sumÃ©
        print("\nðŸ“Š RÃ‰SUMÃ‰ DE LA BASE DE DONNÃ‰ES:")
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM Users")
        print(f"   ðŸ‘¥ Utilisateurs: {cursor.fetchone()[0]}")
        
        try:
            cursor.execute("SELECT COUNT(*) FROM Courses")
            print(f"   ðŸ“š Cours: {cursor.fetchone()[0]}")
        except:
            print(f"   ðŸ“š Cours: 0")
        
        try:
            cursor.execute("SELECT COUNT(*) FROM Rooms")
            print(f"   ðŸ« Salles: {cursor.fetchone()[0]}")
        except:
            print(f"   ðŸ« Salles: 0")
        
        try:
            cursor.execute("SELECT COUNT(*) FROM Course_Suggestions WHERE status = 'pending'")
            print(f"   ðŸ’¡ Suggestions en attente: {cursor.fetchone()[0]}")
        except:
            print(f"   ðŸ’¡ Suggestions en attente: 0")
        
        cursor.close()
        conn.close()
        
        print("\nâœ¨ Configuration terminÃ©e avec succÃ¨s!")
        print("\nðŸ“ COMPTES DE TEST:")
        print("   Admin:      admin@univ.fr / password123")
        print("   Professeur: prof@univ.fr / password123")
        print("   Ã‰tudiant:   etudiant@univ.fr / password123")
        print("\nðŸš€ Vous pouvez maintenant dÃ©marrer le backend:")
        print("   cd backend")
        print("   python run.py")
        
        return True
        
    except psycopg2.Error as e:
        print(f"âŒ Erreur PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"âŒ Erreur: {e}")
        return False

if __name__ == "__main__":
    success = setup_university_db()
    sys.exit(0 if success else 1)

