#!/usr/bin/env python3
"""
Script pour démarrer le serveur Flask en développement
"""

from app import create_app
from models import db
import os

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        database_engine = db.engine.dialect.name
    
    port = int(os.getenv('PORT', 5001))  # ← Port 5001 pour éviter conflit avec Live Server (5500)
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    print("=" * 60)
    print("SERVEUR API - GESTION DES COURS UNIVERSITAIRES")
    print("=" * 60)
    print(f"\nServeur démarré sur http://localhost:{port}")
    print(f"Mode: {'DEBUG' if debug else 'DEVELOPPEMENT (debug désactivé)'}")
    print(f"Base de données: {database_engine}")
    print("\nEndpoints disponibles:")
    print("   - http://localhost:{}/health".format(port))
    print("   - http://localhost:{}/api/auth/login".format(port))
    print("   - http://localhost:{}/api/courses".format(port))
    print("   - http://localhost:{}/api/suggestions".format(port))
    print("\nAppuyez sur Ctrl+C pour arrêter le serveur\n")
    print("=" * 60)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
