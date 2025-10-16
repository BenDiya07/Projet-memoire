"""
Application Flask principale - Gestion des Cours Universitaires
Backend API pour PostgreSQL
"""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import get_config
from models import db
import os

def create_app(config_name=None):
    """Factory pour créer l'application Flask"""
    
    app = Flask(__name__)
    
    # Configuration
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    config = get_config()
    app.config.from_object(config)
    config.init_app(app)
    
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
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(courses_bp)
    app.register_blueprint(suggestions_bp)
    
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
            db.session.execute('SELECT 1')
            db_status = 'connected'
        except Exception as e:
            db_status = f'error: {str(e)}'
        
        return jsonify({
            'status': 'healthy',
            'database': db_status,
            'environment': os.getenv('FLASK_ENV', 'development')
        }), 200
    
    # Gestionnaire d'erreurs global
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Ressource non trouvée'
        }), 404
    
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
        print("Initialisation de la base de donnees...")
        db.create_all()
        print("[OK] Base de donnees initialisee!")
    
    @app.cli.command()
    def seed_db():
        """Peupler la base de données avec des données de test"""
        from models import Role, User, Room, Equipment
        import bcrypt
        
        print("Ajout des données de test...")
        
        # Rôles
        if Role.query.count() == 0:
            roles = [
                Role(name='admin', description='Administrateur systeme'),
                Role(name='professor', description='Professeur'),
                Role(name='student', description='Etudiant')
            ]
            for role in roles:
                db.session.add(role)
            print("[OK] Roles ajoutes")
        
        # Utilisateurs de test
        if User.query.count() == 0:
            password_hash = bcrypt.hashpw(b'password123', bcrypt.gensalt()).decode('utf-8')
            
            users = [
                User(
                    email='admin@univ.fr',
                    password_hash=password_hash,
                    first_name='Admin',
                    last_name='Principal',
                    role_id=1
                ),
                User(
                    email='prof@univ.fr',
                    password_hash=password_hash,
                    first_name='Jean',
                    last_name='Martin',
                    role_id=2
                ),
                User(
                    email='etudiant@univ.fr',
                    password_hash=password_hash,
                    first_name='Sophie',
                    last_name='Laurent',
                    student_id='2024001',
                    role_id=3
                )
            ]
            for user in users:
                db.session.add(user)
            print("[OK] Utilisateurs de test ajoutes")
        
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
            print("[OK] Equipements ajoutes")
        
        db.session.commit()
        print("[OK] Donnees de test ajoutees avec succes!")
        print("\nComptes de test:")
        print("   Admin:      admin@univ.fr / password123")
        print("   Professeur: prof@univ.fr / password123")
        print("   Etudiant:   etudiant@univ.fr / password123")
    
    return app

# Point d'entrée pour le développement
if __name__ == '__main__':
    app = create_app()
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    )

