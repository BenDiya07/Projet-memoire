#!/usr/bin/env python3
"""
Script pour démarrer le serveur Flask en développement
"""

from app import create_app
import os

if __name__ == '__main__':
    app = create_app()
    
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    print("=" * 60)
    print("🎓 SERVEUR API - GESTION DES COURS UNIVERSITAIRES")
    print("=" * 60)
    print(f"\n🌐 Serveur démarré sur http://localhost:{port}")
    print(f"🔧 Mode: {'DEBUG' if debug else 'PRODUCTION'}")
    print(f"📊 Base de données: {os.getenv('DB_NAME', 'gestion_cours_db')}")
    print("\n📝 Endpoints disponibles:")
    print("   - http://localhost:{}/health".format(port))
    print("   - http://localhost:{}/api/auth/login".format(port))
    print("   - http://localhost:{}/api/courses".format(port))
    print("   - http://localhost:{}/api/suggestions".format(port))
    print("\n⚡ Appuyez sur Ctrl+C pour arrêter le serveur\n")
    print("=" * 60)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )

