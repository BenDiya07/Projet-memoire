#!/usr/bin/env python3
"""
Script pour afficher les tables de la base de donnÃ©es university
"""

import psycopg2
from getpass import getpass

def show_tables():
    """Afficher toutes les tables et leur contenu"""
    
    # Configuration
    print("ðŸ”Œ Connexion Ã  PostgreSQL...")
    password = getpass("Mot de passe PostgreSQL: ")
    
    try:
        # Connexion
        conn = psycopg2.connect(
            host='localhost',
            port='5432',
            user='postgres',
            password=password,
            database='university'
        )
        
        cursor = conn.cursor()
        print("âœ… ConnectÃ© Ã  la base 'university'\n")
        
        # Lister toutes les tables
        print("=" * 70)
        print("ðŸ“‹ TABLES DISPONIBLES")
        print("=" * 70)
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        
        if not tables:
            print("âŒ Aucune table trouvÃ©e!")
            return
        
        for i, (table_name,) in enumerate(tables, 1):
            print(f"{i:2d}. {table_name}")
        
        print(f"\nâœ… Total: {len(tables)} table(s)\n")
        
        # Afficher le dÃ©tail de chaque table
        print("=" * 70)
        print("ðŸ“Š DÃ‰TAILS DES TABLES")
        print("=" * 70)
        
        for (table_name,) in tables:
            print(f"\nðŸ”¹ Table: {table_name}")
            print("-" * 70)
            
            # Nombre de lignes
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"   Nombre de lignes: {count}")
            
            # Colonnes
            cursor.execute(f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' 
                ORDER BY ordinal_position
            """)
            
            columns = cursor.fetchall()
            print(f"   Colonnes ({len(columns)}):")
            for col_name, col_type in columns:
                print(f"      â€¢ {col_name} ({col_type})")
        
        # Afficher les vues
        print("\n" + "=" * 70)
        print("ðŸ‘ï¸  VUES SQL")
        print("=" * 70)
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        
        views = cursor.fetchall()
        
        if views:
            for i, (view_name,) in enumerate(views, 1):
                print(f"{i}. {view_name}")
            print(f"\nâœ… Total: {len(views)} vue(s)")
        else:
            print("Aucune vue trouvÃ©e")
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 70)
        print("âœ¨ TerminÃ©!")
        print("=" * 70)
        
    except psycopg2.Error as e:
        print(f"âŒ Erreur PostgreSQL: {e}")
    except Exception as e:
        print(f"âŒ Erreur: {e}")

if __name__ == "__main__":
    show_tables()

