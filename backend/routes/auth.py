"""
Routes d'authentification
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt
)
from datetime import datetime
import bcrypt
from models import db, User, Role, AuditLog
from sqlalchemy.exc import IntegrityError, OperationalError
from auth_utils import get_current_user_id

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# ============================================
# INSCRIPTION
# ============================================
@auth_bp.route('/register', methods=['POST'])
def register():
    """Inscription d'un nouvel utilisateur"""
    try:
        data = request.get_json(silent=True) or {}
        if not isinstance(data, dict):
            return jsonify({
                'success': False,
                'message': 'Données d’inscription invalides'
            }), 400
        
        # Validation des champs requis
        required_fields = ['email', 'password', 'firstName', 'lastName']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'message': f'Champs manquants: {", ".join(missing_fields)}'
            }), 400

        if not all(isinstance(data[field], str) for field in ('email', 'firstName', 'lastName')):
            return jsonify({
                'success': False,
                'message': 'Les informations fournies sont invalides'
            }), 400

        email = data['email'].strip().lower()
        first_name = data['firstName'].strip()
        last_name = data['lastName'].strip()
        password = data['password']
        if not email or not first_name or not last_name or not isinstance(password, str) or len(password) < 6:
            return jsonify({
                'success': False,
                'message': 'Les informations fournies sont invalides'
            }), 400
        
        # L’inscription publique ne peut créer que des comptes étudiants.
        if data.get('role') not in (None, 'student'):
            return jsonify({
                'success': False,
                'message': 'Seule la création de comptes étudiants est autorisée'
            }), 403

        # Vérifier si l'email existe déjà
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({
                'success': False,
                'message': 'Un compte avec cet email existe déjà'
            }), 409

        role = Role.query.filter_by(name='student').first()
        if not role:
            return jsonify({
                'success': False,
                'message': 'Rôle étudiant introuvable'
            }), 500
        
        # Hasher le mot de passe
        password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')
        
        # Créer le nouvel utilisateur
        new_user = User(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            student_id=data.get('studentId'),
            role_id=role.id,
            is_active=True
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        # Log d'audit
        audit_log = AuditLog(
            user_id=new_user.id,
            action='USER_REGISTER',
            table_name='users',
            record_id=new_user.id,
            new_values={'email': new_user.email, 'role': role.name},
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Inscription réussie',
            'user': new_user.to_dict()
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Erreur lors de l\'inscription (données en conflit)'
        }), 409
    except OperationalError:
        db.session.rollback()
        current_app.logger.exception('Base de données indisponible pendant l’inscription')
        return jsonify({
            'success': False,
            'message': 'Le service d’authentification est temporairement indisponible'
        }), 503
    except Exception:
        db.session.rollback()
        current_app.logger.exception('Erreur lors de la création du compte')
        return jsonify({
            'success': False,
            'message': 'Une erreur est survenue pendant la création du compte'
        }), 500

# ============================================
# CONNEXION
# ============================================
@auth_bp.route('/login', methods=['POST'])
def login():
    """Connexion d'un utilisateur - Détection automatique du rôle"""
    try:
        data = request.get_json()
        
        # Validation
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email et mot de passe requis'
            }), 400
        
        # Rechercher l'utilisateur par email uniquement
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Identifiants invalides'
            }), 401
        
        # Vérifier le mot de passe
        if not bcrypt.checkpw(data['password'].encode('utf-8'), 
                              user.password_hash.encode('utf-8')):
            return jsonify({
                'success': False,
                'message': 'Identifiants invalides'
            }), 401
        
        # Vérifier si le compte est actif
        if not user.is_active:
            return jsonify({
                'success': False,
                'message': 'Compte désactivé'
            }), 403
        
        # Mettre à jour last_login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Créer les tokens JWT
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'email': user.email,
                'role': user.role.name
            }
        )
        
        refresh_token = create_refresh_token(identity=str(user.id))
        
        # Log d'audit
        audit_log = AuditLog(
            user_id=user.id,
            action='USER_LOGIN',
            table_name='users',
            record_id=user.id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Connexion réussie',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
        
    except OperationalError:
        db.session.rollback()
        current_app.logger.exception('Base de données indisponible pendant la connexion')
        return jsonify({
            'success': False,
            'message': 'Le service d’authentification est temporairement indisponible'
        }), 503
    except Exception:
        db.session.rollback()
        current_app.logger.exception('Erreur lors de la connexion')
        return jsonify({
            'success': False,
            'message': 'Une erreur est survenue pendant la connexion'
        }), 500

# ============================================
# RAFRAÎCHIR LE TOKEN
# ============================================
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Rafraîchir le token d'accès"""
    try:
        current_user_id = get_current_user_id()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({
                'success': False,
                'message': 'Utilisateur invalide ou inactif'
            }), 401
        
        # Créer un nouveau token d'accès
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'email': user.email,
                'role': user.role.name
            }
        )
        
        return jsonify({
            'success': True,
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur lors du rafraîchissement: {str(e)}'
        }), 500

# ============================================
# PROFIL UTILISATEUR
# ============================================
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Obtenir les informations de l'utilisateur connecté"""
    try:
        current_user_id = get_current_user_id()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Utilisateur non trouvé'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# DÉCONNEXION (côté client principalement)
# ============================================
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Déconnexion (invalider le token côté client)"""
    try:
        current_user_id = get_current_user_id()
        
        # Log d'audit
        audit_log = AuditLog(
            user_id=current_user_id,
            action='USER_LOGOUT',
            table_name='users',
            record_id=current_user_id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Déconnexion réussie'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur lors de la déconnexion: {str(e)}'
        }), 500

# ============================================
# VÉRIFICATION DU TOKEN
# ============================================
@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """Vérifier si le token est valide"""
    try:
        current_user_id = get_current_user_id()
        claims = get_jwt()
        
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({
                'success': False,
                'valid': False,
                'message': 'Token invalide ou utilisateur inactif'
            }), 401
        
        return jsonify({
            'success': True,
            'valid': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'valid': False,
            'message': str(e)
        }), 401

# ============================================
# LISTE DES RÔLES DISPONIBLES
# ============================================
@auth_bp.route('/roles', methods=['GET'])
def get_roles():
    """Obtenir la liste des rôles disponibles"""
    try:
        roles = Role.query.all()
        return jsonify({
            'success': True,
            'roles': [role.to_dict() for role in roles]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# CREER UN PROFESSEUR (Admin seulement)
# ============================================
@auth_bp.route('/professors', methods=['POST'])
@jwt_required()
def create_professor():
    """Ajouter un nouveau professeur"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Accès refusé'}), 403

        data = request.get_json()
        required = ['firstName', 'lastName', 'email', 'password']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return jsonify({
                'success': False,
                'message': f'Champs manquants: {", ".join(missing)}'
            }), 400

        if User.query.filter_by(email=data['email']).first():
            return jsonify({
                'success': False,
                'message': 'Un compte avec cet email existe déjà'
            }), 409

        role = Role.query.filter_by(name='professor').first()
        if not role:
            return jsonify({
                'success': False,
                'message': 'Rôle professeur introuvable'
            }), 500

        password_hash = bcrypt.hashpw(
            data['password'].encode('utf-8'), bcrypt.gensalt()
        ).decode('utf-8')

        professor = User(
            email=data['email'],
            password_hash=password_hash,
            first_name=data['firstName'],
            last_name=data['lastName'],
            role_id=role.id,
            is_active=True
        )
        db.session.add(professor)
        db.session.commit()

        audit_log = AuditLog(
            user_id=get_current_user_id(),
            action='PROFESSOR_CREATE',
            table_name='users',
            record_id=professor.id,
            new_values={'email': professor.email},
            ip_address=request.remote_addr
        )
        db.session.add(audit_log)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Professeur créé avec succès',
            'professor': professor.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# CREER UNE SALLE (Admin seulement)
# ============================================
@auth_bp.route('/rooms', methods=['POST'])
@jwt_required()
def create_room():
    """Ajouter une nouvelle salle"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Accès refusé'}), 403

        from models import Room
        data = request.get_json()
        required = ['room_number', 'capacity']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return jsonify({
                'success': False,
                'message': f'Champs manquants: {", ".join(missing)}'
            }), 400

        if Room.query.filter_by(room_number=data['room_number']).first():
            return jsonify({
                'success': False,
                'message': 'Une salle avec ce numéro existe déjà'
            }), 409

        room = Room(
            room_number=data['room_number'],
            building=data.get('building', ''),
            room_type=data.get('room_type', 'classroom'),
            capacity=int(data['capacity']),
            floor=data.get('floor'),
            is_available=True,
            notes=data.get('notes', '')
        )
        db.session.add(room)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Salle créée avec succès',
            'room': room.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# LISTE DES UTILISATEURS
# ============================================
@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    """Obtenir la liste des utilisateurs avec filtrage par rôle"""
    try:
        role_name = request.args.get('role')
        
        query = User.query
        if role_name:
            query = query.join(Role).filter(Role.name == role_name)
        
        users = query.all()
        return jsonify({
            'success': True,
            'users': [user.to_dict() for user in users]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500
