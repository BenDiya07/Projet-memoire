"""
Application Flask principale - Gestion des Cours Universitaires
Backend API pour SQLite en développement et PostgreSQL en production
"""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from sqlalchemy import text
from config import get_config
from models import db
import os
import logging

def create_app(config_name=None):
    """Factory pour créer l'application Flask"""
    
    app = Flask(__name__)
    
    # Configuration
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app_config = get_config(config_name)
    app.config.from_object(app_config)
    app_config.init_app(app)
    if app.config['SQLALCHEMY_DATABASE_URI'].startswith('sqlite:'):
        os.makedirs(app.instance_path, exist_ok=True)
    
    # Initialiser les extensions
    db.init_app(app)
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    jwt = JWTManager(app)
    
    # Gestionnaires d'erreurs JWT
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'Token expiré',
            'error': 'token_expired'
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Token invalide',
            'error': 'invalid_token'
        }), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Token manquant',
            'error': 'authorization_required'
        }), 401
    
    # Enregistrer les blueprints
    from routes.auth import auth_bp
    from routes.courses import courses_bp
    from routes.suggestions import suggestions_bp
    from routes.stats import stats_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(courses_bp)
    app.register_blueprint(suggestions_bp)
    app.register_blueprint(stats_bp)
    
    # Route racine
    @app.route('/')
    def index():
        return jsonify({
            'message': 'API Gestion des Cours Universitaires',
            'version': '1.0.0',
            'status': 'running',
            'endpoints': {
                'auth': '/api/auth',
                'courses': '/api/courses',
                'suggestions': '/api/suggestions'
            }
        }), 200
    
    # Route de santé
    @app.route('/health')
    def health():
        """Vérification de l'état du serveur"""
        try:
            # Vérifier la connexion à la base de données
            db.session.execute(text('SELECT 1'))
            db_status = 'connected'
        except Exception:
            app.logger.exception('Vérification de la base de données échouée')
            db.session.rollback()
            db_status = 'unavailable'
        
        return jsonify({
            'status': 'healthy' if db_status == 'connected' else 'degraded',
            'database': db_status,
            'environment': os.getenv('FLASK_ENV', 'development')
        }), 200 if db_status == 'connected' else 503
    
    # Gestionnaire d'erreurs global
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Ressource non trouvée'
        }), 404
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'success': False,
            'message': 'Requête invalide: ' + str(error)
        }), 400
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Erreur interne du serveur'
        }), 500
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        app.logger.error(f'Erreur non gérée: {str(error)}')
        return jsonify({
            'success': False,
            'message': 'Une erreur est survenue'
        }), 500
    
    # Commandes CLI
    @app.cli.command()
    def init_db():
        """Initialiser la base de données"""
        print("Initialisation de la base de données...")
        db.create_all()
        print("✅ Base de données initialisée!")
    
    @app.cli.command()
    def seed_db():
        """Peupler la base de données avec des données de test"""
        from models import Role, User, Room, Equipment
        import bcrypt
        
        print("Ajout des données de test...")
        
        # Rôles
        if Role.query.count() == 0:
            roles = [
                Role(name='admin', description='Administrateur système'),
                Role(name='professor', description='Professeur'),
                Role(name='student', description='Étudiant')
            ]
            for role in roles:
                db.session.add(role)
            print("✓ Rôles ajoutés")
        
        # Utilisateurs de test
        if User.query.count() == 0:
            password_hash = bcrypt.hashpw(b'password123', bcrypt.gensalt()).decode('utf-8')
            roles = {role.name: role.id for role in Role.query.all()}
            
            users = [
                User(
                    email='admin@univ.fr',
                    password_hash=password_hash,
                    first_name='Admin',
                    last_name='Principal',
                    role_id=roles.get('admin')
                ),
                User(
                    email='prof@univ.fr',
                    password_hash=password_hash,
                    first_name='Jean',
                    last_name='Martin',
                    role_id=roles.get('professor')
                ),
                User(
                    email='etudiant@univ.fr',
                    password_hash=password_hash,
                    first_name='Sophie',
                    last_name='Laurent',
                    student_id='2024001',
                    role_id=roles.get('student')
                )
            ]
            for user in users:
                db.session.add(user)
            print("✓ Utilisateurs de test ajoutés")
        
        # Équipements
        if Equipment.query.count() == 0:
            equipment_list = [
                Equipment(name='Projecteur', description='Projecteur vidéo HD'),
                Equipment(name='Ordinateurs', description='Ordinateurs pour étudiants'),
                Equipment(name='Tableau blanc', description='Tableau blanc interactif'),
                Equipment(name='Microphone', description='Système de sonorisation'),
                Equipment(name='WiFi', description='Connexion WiFi haut débit')
            ]
            for eq in equipment_list:
                db.session.add(eq)
            print("✓ Équipements ajoutés")
        
        db.session.commit()
        print("✅ Données de test ajoutées avec succès!")
        print("\n📝 Comptes de test:")
        print("   Admin:      admin@univ.fr / password123")
        print("   Professeur: prof@univ.fr / password123")
        print("   Étudiant:   etudiant@univ.fr / password123")
    
    return app

# Point d'entrée pour le développement
if __name__ == '__main__':
    app = create_app()
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5001)),
        debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    )
