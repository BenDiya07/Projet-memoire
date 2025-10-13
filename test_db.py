#!/usr/bin/env python3
"""Script de diagnostic de la base de donnees"""

import sys
import os

# Ajouter le dossier backend au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import create_app
from models import db, Role, User

def test_database():
    """Tester la connexion a la base de donnees"""
    print("\n" + "="*60)
    print("DIAGNOSTIC BASE DE DONNEES")
    print("="*60 + "\n")
    
    app = create_app()
    
    with app.app_context():
        try:
            # Test 1: Connexion
            print("[1] Test de connexion...")
            db.session.execute('SELECT 1')
            print("    [OK] Connexion reussie\n")
            
            # Test 2: Tables existantes
            print("[2] Verification des tables...")
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"    Tables trouvees: {len(tables)}")
            for table in sorted(tables):
                print(f"    - {table}")
            print()
            
            # Test 3: Roles
            print("[3] Verification des roles...")
            roles = Role.query.all()
            print(f"    Roles trouves: {len(roles)}")
            for role in roles:
                print(f"    - {role.name}: {role.description}")
            print()
            
            # Test 4: Utilisateurs
            print("[4] Verification des utilisateurs...")
            users = User.query.all()
            print(f"    Utilisateurs trouves: {len(users)}")
            for user in users:
                role_name = user.role.name if user.role else "Aucun"
                print(f"    - {user.email} ({role_name})")
            print()
            
            # Test 5: Utilisateur admin
            print("[5] Recherche utilisateur admin@univ.fr...")
            admin = User.query.filter_by(email='admin@univ.fr').first()
            if admin:
                print(f"    [OK] Trouve: {admin.first_name} {admin.last_name}")
                print(f"    Role: {admin.role.name if admin.role else 'Aucun'}")
                print(f"    Hash du mot de passe: {admin.password_hash[:50]}...")
            else:
                print("    [ERREUR] Utilisateur admin non trouve")
            print()
            
            print("="*60)
            print("DIAGNOSTIC TERMINE")
            print("="*60 + "\n")
            
        except Exception as e:
            print(f"\n[ERREUR] {type(e).__name__}: {str(e)}\n")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    test_database()

