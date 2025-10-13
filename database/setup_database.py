#!/usr/bin/env python3
"""
Script de configuration de la base de donnÃ©es PostgreSQL
Pour dÃ©veloppement local et prÃ©paration AWS RDS
"""

import psycopg2
from psycopg2 import sql
import os
import sys
from getpass import getpass

def create_database(host, port, admin_user, admin_password, db_name):
    """CrÃ©er la base de donnÃ©es si elle n'existe pas"""
    try:
        # Connexion au serveur PostgreSQL (base postgres par dÃ©faut)
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=admin_user,
            password=admin_password,
            database='postgres'
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
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
            print(f"âœ… Base de donnÃ©es '{db_name}' crÃ©Ã©e avec succÃ¨s!")
        else:
            print(f"â„¹ï¸  La base de donnÃ©es '{db_name}' existe dÃ©jÃ .")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.Error as e:
        print(f"âŒ Erreur lors de la crÃ©ation de la base de donnÃ©es: {e}")
        return False

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

def setup_database(host, port, user, password, db_name, init_data=True):
    """Configuration complÃ¨te de la base de donnÃ©es"""
    try:
        print(f"\nðŸ”Œ Connexion Ã  PostgreSQL sur {host}:{port}...")
        conn = psycopg2.connect(
            host=host,
            port=5432,
            user=user,
            password=password,
            database=db_name
        )
        
        print("âœ… Connexion Ã©tablie!")
        
        # ExÃ©cuter le schÃ©ma
        print("\nðŸ“‹ ExÃ©cution du schÃ©ma (schema.sql)...")
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
        if execute_sql_file(conn, schema_path):
            print("âœ… SchÃ©ma crÃ©Ã© avec succÃ¨s!")
        else:
            print("âŒ Ã‰chec de la crÃ©ation du schÃ©ma")
            return False
        
        # ExÃ©cuter les donnÃ©es initiales si demandÃ©
        if init_data:
            print("\nðŸ“Š Insertion des donnÃ©es de test (init_db.sql)...")
            init_path = os.path.join(os.path.dirname(__file__), 'init_db.sql')
            if execute_sql_file(conn, init_path):
                print("âœ… DonnÃ©es de test insÃ©rÃ©es avec succÃ¨s!")
            else:
                print("âŒ Ã‰chec de l'insertion des donnÃ©es de test")
                return False
        
        # Afficher un rÃ©sumÃ©
        print("\nðŸ“Š RÃ‰SUMÃ‰ DE LA BASE DE DONNÃ‰ES:")
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM users")
        print(f"   ðŸ‘¥ Utilisateurs: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM courses")
        print(f"   ðŸ“š Cours: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM rooms")
        print(f"   ðŸ« Salles: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM course_suggestions WHERE status = 'pending'")
        print(f"   ðŸ’¡ Suggestions en attente: {cursor.fetchone()[0]}")
        
        cursor.close()
        conn.close()
        
        print("\nâœ¨ Configuration terminÃ©e avec succÃ¨s!")
        print("\nðŸ“ COMPTES DE TEST:")
        print("   Admin:      admin@univ.fr / password123")
        print("   Professeur: prof@univ.fr / password123")
        print("   Ã‰tudiant:   etudiant@univ.fr / password123")
        
        return True
        
    except psycopg2.Error as e:
        print(f"âŒ Erreur PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"âŒ Erreur: {e}")
        return False

def main():
    """Point d'entrÃ©e principal"""
    print("=" * 60)
    print("ðŸŽ“ CONFIGURATION BASE DE DONNÃ‰ES - GESTION COURS UNIVERSITAIRES")
    print("=" * 60)
    
    # Configuration par dÃ©faut pour dÃ©veloppement local
    default_config = {
        'host': 'localhost',
        'port': '5432',
        'user': 'postgres',
        'db_name': 'gestion_cours_db'
    }
    
    print("\nðŸ“‹ Configuration de la connexion PostgreSQL")
    print("(Appuyez sur EntrÃ©e pour utiliser la valeur par dÃ©faut)\n")
    
    host = input(f"Host [{default_config['host']}]: ").strip() or default_config['host']
    port = input(f"Port [{default_config['port']}]: ").strip() or default_config['port']
    user = input(f"Utilisateur [{default_config['user']}]: ").strip() or default_config['user']
    db_name = input(f"Nom de la base [{default_config['db_name']}]: ").strip() or default_config['db_name']
    
    password = getpass("Mot de passe PostgreSQL: ")
    
    if not password:
        print("âŒ Le mot de passe est requis!")
        sys.exit(1)
    
    # CrÃ©er la base de donnÃ©es
    if not create_database(host, port, user, password, db_name):
        sys.exit(1)
    
    # Demander si on veut les donnÃ©es de test
    init_data_choice = input("\nðŸ“Š InsÃ©rer les donnÃ©es de test? (O/n): ").strip().lower()
    init_data = init_data_choice != 'n'
    
    # Configurer la base de donnÃ©es
    if setup_database(host, port, user, password, db_name, init_data):
        print("\nðŸŽ‰ Tout est prÃªt! Vous pouvez maintenant dÃ©marrer l'application.")
        sys.exit(0)
    else:
        print("\nâŒ La configuration a Ã©chouÃ©. Veuillez vÃ©rifier les erreurs ci-dessus.")
        sys.exit(1)

if __name__ == "__main__":
    main()

