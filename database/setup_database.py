#!/usr/bin/env python3
"""
Script de configuration de la base de donnees PostgreSQL
Pour developpement local et preparation AWS RDS
"""

import psycopg2
from psycopg2 import sql
import os
import sys
from getpass import getpass

def create_database(host, port, admin_user, admin_password, db_name):
    """Creer la base de donnees si elle n'existe pas"""
    try:
        # Connexion au serveur PostgreSQL (base postgres par defaut)
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=admin_user,
            password=admin_password,
            database='postgres'
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Verifier si la base existe
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (db_name,)
        )
        exists = cursor.fetchone()
        
        if not exists:
            print(f"Creation de la base de donnees '{db_name}'...")
            cursor.execute(
                sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name))
            )
            print(f"[OK] Base de donnees '{db_name}' creee avec succes!")
        else:
            print(f"[INFO] La base de donnees '{db_name}' existe deja.")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.Error as e:
        print(f"[ERREUR] lors de la creation de la base de donnees: {e}")
        return False

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

def setup_database():
    """Configuration complete de la base de donnees"""
    print("=" * 60)
    print("CONFIGURATION BASE DE DONNEES POSTGRESQL")
    print("Developpement Local + Preparation AWS RDS")
    print("=" * 60)
    
    # Configuration
    print("\nConfiguration de la connexion PostgreSQL:")
    host = input("Host [localhost]: ").strip() or 'localhost'
    port = input("Port [5432]: ").strip() or '5432'
    admin_user = input("Utilisateur admin [postgres]: ").strip() or 'postgres'
    admin_password = getpass("Mot de passe admin: ")
    db_name = input("Nom de la base [gestion_cours_db]: ").strip() or 'gestion_cours_db'
    
    if not admin_password:
        print("[ERREUR] Le mot de passe est requis!")
        sys.exit(1)
    
    # Etape 1: Creer la base de donnees
    print("\n" + "=" * 60)
    print("ETAPE 1: CREATION DE LA BASE DE DONNEES")
    print("=" * 60)
    
    if not create_database(host, port, admin_user, admin_password, db_name):
        sys.exit(1)
    
    # Etape 2: Creer le schema
    print("\n" + "=" * 60)
    print("ETAPE 2: CREATION DU SCHEMA")
    print("=" * 60)
    
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=admin_user,
            password=admin_password,
            database=db_name
        )
        
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
        
        if os.path.exists(schema_path):
            print(f"\nExecution de schema.sql...")
        if execute_sql_file(conn, schema_path):
                print("[OK] Schema cree avec succes!")
            else:
                print("[ERREUR] Echec de la creation du schema")
                conn.close()
                sys.exit(1)
        else:
            print(f"[ERREUR] Fichier schema.sql non trouve: {schema_path}")
            conn.close()
            sys.exit(1)
        
        # Etape 3: Inserer les donnees initiales
        print("\n" + "=" * 60)
        print("ETAPE 3: DONNEES INITIALES")
        print("=" * 60)
        
            init_path = os.path.join(os.path.dirname(__file__), 'init_db.sql')
        
        if os.path.exists(init_path):
            print(f"\nExecution de init_db.sql...")
            if execute_sql_file(conn, init_path):
                print("[OK] Donnees initiales inserees avec succes!")
            else:
                print("[ATTENTION] Echec de l'insertion des donnees initiales")
            else:
            print(f"[INFO] Fichier init_db.sql non trouve: {init_path}")
        
        # Afficher le resume
        print("\n" + "=" * 60)
        print("RESUME DE LA CONFIGURATION")
        print("=" * 60)
        
        cursor = conn.cursor()
        
        # Compter les tables
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        table_count = cursor.fetchone()[0]
        print(f"\nTables creees: {table_count}")
        
        # Compter les roles
        cursor.execute("SELECT COUNT(*) FROM roles")
        role_count = cursor.fetchone()[0]
        print(f"Roles: {role_count}")
        
        # Compter les utilisateurs
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"Utilisateurs: {user_count}")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 60)
        print("[OK] CONFIGURATION TERMINEE!")
        print("=" * 60)
        print(f"\nBase de donnees: {db_name}")
        print(f"Host: {host}:{port}")
        print(f"Utilisateur: {admin_user}")
        
        print("\nVous pouvez maintenant:")
        print("1. Demarrer le backend Flask")
        print("2. Tester l'API avec les comptes de demonstration")
        print("3. Creer de nouveaux utilisateurs via l'inscription")
        
    except psycopg2.Error as e:
        print(f"\n[ERREUR] PostgreSQL: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERREUR] {e}")
        sys.exit(1)

if __name__ == "__main__":
    setup_database()
