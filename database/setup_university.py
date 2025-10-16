#!/usr/bin/env python3
"""
Script de configuration pour utiliser la base de donnees university existante
"""

import psycopg2
from psycopg2 import sql
import os
import sys
from getpass import getpass

def execute_sql_file(conn, filepath):
    """Executer un fichier SQL"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        cursor = conn.cursor()
        cursor.execute(sql_content)
        conn.commit()
        cursor.close()
        return True
        
    except Exception as e:
        print(f"[ERREUR] lors de l'execution de {filepath}: {e}")
        conn.rollback()
        return False

def setup_university_db():
    """Configuration de la base university"""
    print("=" * 60)
    print("CONFIGURATION BASE UNIVERSITY - MODE EXISTANT")
    print("=" * 60)
    
    # Configuration
    host = input("\nHost [localhost]: ").strip() or 'localhost'
    port = input("Port [5432]: ").strip() or '5432'
    user = input("Utilisateur [postgres]: ").strip() or 'postgres'
    db_name = input("Nom de la base [university]: ").strip() or 'university'
    password = getpass("Mot de passe PostgreSQL: ")
    
    if not password:
        print("[ERREUR] Le mot de passe est requis!")
        sys.exit(1)
    
    try:
        # Se connecter au serveur PostgreSQL
        print(f"\nConnexion a PostgreSQL sur {host}:{port}...")
        conn_postgres = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database='postgres'
        )
        conn_postgres.autocommit = True
        cursor = conn_postgres.cursor()
        
        # Verifier si la base existe
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (db_name,)
        )
        exists = cursor.fetchone()
        
        if not exists:
            print(f"\n[ERREUR] La base '{db_name}' n'existe pas!")
            print("Veuillez la creer d'abord avec:")
            print(f"  CREATE DATABASE {db_name};")
            cursor.close()
            conn_postgres.close()
            sys.exit(1)
        
        print(f"[OK] Base '{db_name}' trouvee")
        cursor.close()
        conn_postgres.close()
        
        # Se connecter a la base university
        print(f"\nConnexion a la base '{db_name}'...")
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=db_name
        )
        
        print("[OK] Connecte a la base 'university'")
        
        # Verifier les tables existantes
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        table_count = cursor.fetchone()[0]
        
        if table_count == 0:
            print(f"\n[INFO] Aucune table trouvee dans '{db_name}'")
            print("Chargement du schema...")
            
            # Executer schema.sql
            schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
            if os.path.exists(schema_path):
                print(f"\n[1] Execution de schema.sql...")
                if execute_sql_file(conn, schema_path):
                    print("    [OK] Schema cree")
                else:
                    print("    [ERREUR] Echec du schema")
                    sys.exit(1)
            else:
                print(f"[ERREUR] Fichier non trouve: {schema_path}")
                sys.exit(1)
        else:
            print(f"\n[INFO] {table_count} table(s) trouvee(s)")
        
        # Verifier les donnees
        cursor.execute("SELECT COUNT(*) FROM roles")
        role_count = cursor.fetchone()[0]
        
        if role_count == 0:
            print("\n[INFO] Aucune donnee trouvee")
            print("Chargement des donnees initiales...")
            
            # Executer init_db.sql
            init_path = os.path.join(os.path.dirname(__file__), 'init_db.sql')
            if os.path.exists(init_path):
                print(f"\n[2] Execution de init_db.sql...")
                if execute_sql_file(conn, init_path):
                    print("    [OK] Donnees initiales chargees")
                else:
                    print("    [ERREUR] Echec du chargement des donnees")
            else:
                print(f"[ATTENTION] Fichier non trouve: {init_path}")
        else:
            print(f"\n[INFO] {role_count} role(s) deja present(s)")
        
        # Afficher le resume
        print("\n" + "=" * 60)
        print("RESUME")
        print("=" * 60)
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        tables = cursor.fetchall()
        
        print(f"\nTables ({len(tables)}):")
        for (table_name,) in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"  - {table_name}: {count} ligne(s)")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 60)
        print("[OK] Configuration terminee!")
        print("=" * 60)
        
    except psycopg2.Error as e:
        print(f"\n[ERREUR] PostgreSQL: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERREUR] {e}")
        sys.exit(1)

if __name__ == "__main__":
    setup_university_db()
