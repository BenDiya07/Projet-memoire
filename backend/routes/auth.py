"""
Routes d'authentification
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from datetime import datetime
import bcrypt
from models import db, User, Role, AuditLog
from sqlalchemy.exc import IntegrityError

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# ============================================
# INSCRIPTION
# ============================================
@auth_bp.route('/register', methods=['POST'])
def register():
    """Inscription d'un nouvel utilisateur"""
    try:
        data = request.get_json()
        
        # Validation des champs requis
        required_fields = ['email', 'password', 'firstName', 'lastName', 'role']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'message': f'Champs manquants: {", ".join(missing_fields)}'
            }), 400
        
        # VÃ©rifier si l'email existe dÃ©jÃ 
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({
                'success': False,
                'message': 'Un compte avec cet email existe dÃ©jÃ '
            }), 409
        
        # VÃ©rifier si le rÃ´le existe
        role = Role.query.filter_by(name=data['role']).first()
        if not role:
            return jsonify({
                'success': False,
                'message': f'RÃ´le invalide: {data["role"]}'
            }), 400
        
        # Hasher le mot de passe
        password_hash = bcrypt.hashpw(
            data['password'].encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')
        
        # CrÃ©er le nouvel utilisateur
        new_user = User(
            email=data['email'],
            password_hash=password_hash,
            first_name=data['firstName'],
            last_name=data['lastName'],
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
            'message': 'Inscription rÃ©ussie',
            'user': new_user.to_dict()
        }), 201
        
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Erreur lors de l\'inscription (donnÃ©es en conflit)'
        }), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur lors de l\'inscription: {str(e)}'
        }), 500

# ============================================
# CONNEXION
# ============================================
@auth_bp.route('/login', methods=['POST'])
def login():
    """Connexion d'un utilisateur - DÃ©tection automatique du rÃ´le"""
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
        
        # VÃ©rifier le mot de passe
        if not bcrypt.checkpw(data['password'].encode('utf-8'), 
                              user.password_hash.encode('utf-8')):
            return jsonify({
                'success': False,
                'message': 'Identifiants invalides'
            }), 401
        
        # VÃ©rifier si le compte est actif
        if not user.is_active:
            return jsonify({
                'success': False,
                'message': 'Compte dÃ©sactivÃ©'
            }), 403
        
        # Mettre Ã  jour last_login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # CrÃ©er les tokens JWT
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                'email': user.email,
                'role': user.role.name
            }
        )
        
        refresh_token = create_refresh_token(identity=user.id)
        
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
            'message': 'Connexion rÃ©ussie',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur lors de la connexion: {str(e)}'
        }), 500

# ============================================
# RAFRAÃŽCHIR LE TOKEN
# ============================================
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """RafraÃ®chir le token d'accÃ¨s"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({
                'success': False,
                'message': 'Utilisateur invalide ou inactif'
            }), 401
        
        # CrÃ©er un nouveau token d'accÃ¨s
        access_token = create_access_token(
            identity=user.id,
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
            'message': f'Erreur lors du rafraÃ®chissement: {str(e)}'
        }), 500

# ============================================
# PROFIL UTILISATEUR
# ============================================
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Obtenir les informations de l'utilisateur connectÃ©"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Utilisateur non trouvÃ©'
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
# DÃ‰CONNEXION (cÃ´tÃ© client principalement)
# ============================================
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """DÃ©connexion (invalider le token cÃ´tÃ© client)"""
    try:
        current_user_id = get_jwt_identity()
        
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
            'message': 'DÃ©connexion rÃ©ussie'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur lors de la dÃ©connexion: {str(e)}'
        }), 500

# ============================================
# VÃ‰RIFICATION DU TOKEN
# ============================================
@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """VÃ©rifier si le token est valide"""
    try:
        current_user_id = get_jwt_identity()
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
# LISTE DES RÃ”LES DISPONIBLES
# ============================================
@auth_bp.route('/roles', methods=['GET'])
def get_roles():
    """Obtenir la liste des rÃ´les disponibles"""
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

