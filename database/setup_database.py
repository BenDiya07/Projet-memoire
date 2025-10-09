#!/usr/bin/env python3
"""
Script de configuration de la base de données PostgreSQL
Pour développement local et préparation AWS RDS
"""

import psycopg2
from psycopg2 import sql
import os
import sys
from getpass import getpass

def create_database(host, port, admin_user, admin_password, db_name):
    """Créer la base de données si elle n'existe pas"""
    try:
        # Connexion au serveur PostgreSQL (base postgres par défaut)
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=admin_user,
            password=admin_password,
            database='postgres'
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
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
            print(f"✅ Base de données '{db_name}' créée avec succès!")
        else:
            print(f"ℹ️  La base de données '{db_name}' existe déjà.")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Erreur lors de la création de la base de données: {e}")
        return False

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

def setup_database(host, port, user, password, db_name, init_data=True):
    """Configuration complète de la base de données"""
    try:
        print(f"\n🔌 Connexion à PostgreSQL sur {host}:{port}...")
        conn = psycopg2.connect(
            host=host,
            port=5432,
            user=user,
            password=password,
            database=db_name
        )
        
        print("✅ Connexion établie!")
        
        # Exécuter le schéma
        print("\n📋 Exécution du schéma (schema.sql)...")
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
        if execute_sql_file(conn, schema_path):
            print("✅ Schéma créé avec succès!")
        else:
            print("❌ Échec de la création du schéma")
            return False
        
        # Exécuter les données initiales si demandé
        if init_data:
            print("\n📊 Insertion des données de test (init_db.sql)...")
            init_path = os.path.join(os.path.dirname(__file__), 'init_db.sql')
            if execute_sql_file(conn, init_path):
                print("✅ Données de test insérées avec succès!")
            else:
                print("❌ Échec de l'insertion des données de test")
                return False
        
        # Afficher un résumé
        print("\n📊 RÉSUMÉ DE LA BASE DE DONNÉES:")
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM users")
        print(f"   👥 Utilisateurs: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM courses")
        print(f"   📚 Cours: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM rooms")
        print(f"   🏫 Salles: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM course_suggestions WHERE status = 'pending'")
        print(f"   💡 Suggestions en attente: {cursor.fetchone()[0]}")
        
        cursor.close()
        conn.close()
        
        print("\n✨ Configuration terminée avec succès!")
        print("\n📝 COMPTES DE TEST:")
        print("   Admin:      admin@univ.fr / password123")
        print("   Professeur: prof@univ.fr / password123")
        print("   Étudiant:   etudiant@univ.fr / password123")
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Erreur PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def main():
    """Point d'entrée principal"""
    print("=" * 60)
    print("🎓 CONFIGURATION BASE DE DONNÉES - GESTION COURS UNIVERSITAIRES")
    print("=" * 60)
    
    # Configuration par défaut pour développement local
    default_config = {
        'host': 'localhost',
        'port': '5432',
        'user': 'postgres',
        'db_name': 'gestion_cours_db'
    }
    
    print("\n📋 Configuration de la connexion PostgreSQL")
    print("(Appuyez sur Entrée pour utiliser la valeur par défaut)\n")
    
    host = input(f"Host [{default_config['host']}]: ").strip() or default_config['host']
    port = input(f"Port [{default_config['port']}]: ").strip() or default_config['port']
    user = input(f"Utilisateur [{default_config['user']}]: ").strip() or default_config['user']
    db_name = input(f"Nom de la base [{default_config['db_name']}]: ").strip() or default_config['db_name']
    
    password = getpass("Mot de passe PostgreSQL: ")
    
    if not password:
        print("❌ Le mot de passe est requis!")
        sys.exit(1)
    
    # Créer la base de données
    if not create_database(host, port, user, password, db_name):
        sys.exit(1)
    
    # Demander si on veut les données de test
    init_data_choice = input("\n📊 Insérer les données de test? (O/n): ").strip().lower()
    init_data = init_data_choice != 'n'
    
    # Configurer la base de données
    if setup_database(host, port, user, password, db_name, init_data):
        print("\n🎉 Tout est prêt! Vous pouvez maintenant démarrer l'application.")
        sys.exit(0)
    else:
        print("\n❌ La configuration a échoué. Veuillez vérifier les erreurs ci-dessus.")
        sys.exit(1)

if __name__ == "__main__":
    main()

