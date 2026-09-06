"""
Configuration de l'application Flask
Support pour développement local et AWS RDS
"""

import os
from datetime import timedelta
from urllib.parse import quote_plus
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

class Config:
    """Configuration de base"""
    
    # Clé secrète pour les sessions et JWT
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Configuration JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # Configuration CORS
    CORS_HEADERS = 'Content-Type'
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    
    # Configuration SQLAlchemy
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv('SQL_ECHO', 'False').lower() == 'true'
    
    # Pagination
    ITEMS_PER_PAGE = int(os.getenv('ITEMS_PER_PAGE', 20))
    
    # Upload de fichiers
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max
    
    @staticmethod
    def init_app(app):
        """Initialisation de l'application"""
        pass

class DevelopmentConfig(Config):
    """Configuration pour le développement local"""
    
    DEBUG = True
    TESTING = False
    
    # Base de données PostgreSQL locale
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'university')  # ← Modifié pour utiliser 'university'
    DB_USER = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
    
    SQLALCHEMY_DATABASE_URI = (
        f'postgresql://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    )
    
    # Logging plus verbeux
    SQLALCHEMY_ECHO = True

class ProductionConfig(Config):
    """Configuration pour la production (AWS RDS)"""
    
    DEBUG = False
    TESTING = False
    
    # Base de données AWS RDS
    DB_HOST = os.getenv('RDS_HOSTNAME', 'localhost')
    DB_PORT = os.getenv('RDS_PORT', '5432')
    DB_NAME = os.getenv('RDS_DB_NAME', 'gestion_cours_db')
    DB_USER = os.getenv('RDS_USERNAME', 'postgres')
    DB_PASSWORD = os.getenv('RDS_PASSWORD', 'postgres')  # Valeur par défaut pour éviter l'erreur
    
    SQLALCHEMY_DATABASE_URI = (
        f'postgresql://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    )
    
    # SSL pour AWS RDS
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {
            'sslmode': 'require'
        }
    }
    
    @classmethod
    def init_app(cls, app):
        """Configuration spécifique à la production"""
        Config.init_app(app)
        
        # Log vers CloudWatch si disponible
        import logging
        from logging.handlers import SysLogHandler
        
        syslog_handler = SysLogHandler()
        syslog_handler.setLevel(logging.WARNING)
        app.logger.addHandler(syslog_handler)

class TestingConfig(Config):
    """Configuration pour les tests"""
    
    TESTING = True
    DEBUG = True
    
    # Base de données de test
    DB_HOST = os.getenv('TEST_DB_HOST', 'localhost')
    DB_PORT = os.getenv('TEST_DB_PORT', '5432')
    DB_NAME = os.getenv('TEST_DB_NAME', 'gestion_cours_test_db')
    DB_USER = os.getenv('TEST_DB_USER', 'postgres')
    DB_PASSWORD = os.getenv('TEST_DB_PASSWORD', 'postgres')
    
    SQLALCHEMY_DATABASE_URI = (
        f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    )
    
    # Désactiver la protection CSRF pour les tests
    WTF_CSRF_ENABLED = False

# Configuration disponibles
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Obtenir la configuration selon l'environnement"""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])

