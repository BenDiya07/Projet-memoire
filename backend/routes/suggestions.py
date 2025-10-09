"""
Routes pour la gestion des suggestions de cours
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, CourseSuggestion, User, Course, Notification, AuditLog
from datetime import datetime

suggestions_bp = Blueprint('suggestions', __name__, url_prefix='/api/suggestions')

# ============================================
# LISTE DES SUGGESTIONS
# ============================================
@suggestions_bp.route('', methods=['GET'])
@jwt_required()
def get_suggestions():
    """Obtenir la liste des suggestions"""
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role')
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        
        # Query de base
        query = CourseSuggestion.query
        
        # Filtrer selon le rôle
        if user_role == 'professor':
            # Professeurs: seulement leurs suggestions
            query = query.filter_by(professor_id=user_id)
        elif user_role != 'admin':
            # Autres rôles: accès refusé
            return jsonify({
                'success': False,
                'message': 'Accès refusé'
            }), 403
        
        # Filtrer par statut si spécifié
        if status:
            query = query.filter_by(status=status)
        
        # Pagination
        pagination = query.order_by(CourseSuggestion.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        suggestions = [suggestion.to_dict(include_professor=True) 
                      for suggestion in pagination.items]
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# DÉTAILS D'UNE SUGGESTION
# ============================================
@suggestions_bp.route('/<int:suggestion_id>', methods=['GET'])
@jwt_required()
def get_suggestion(suggestion_id):
    """Obtenir les détails d'une suggestion"""
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role')
        
        suggestion = CourseSuggestion.query.get(suggestion_id)
        
        if not suggestion:
            return jsonify({
                'success': False,
                'message': 'Suggestion non trouvée'
            }), 404
        
        # Vérifier les permissions
        if user_role == 'professor' and suggestion.professor_id != user_id:
            return jsonify({
                'success': False,
                'message': 'Accès refusé'
            }), 403
        
        return jsonify({
            'success': True,
            'suggestion': suggestion.to_dict(include_professor=True)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# CRÉER UNE SUGGESTION (Professeur)
# ============================================
@suggestions_bp.route('', methods=['POST'])
@jwt_required()
def create_suggestion():
    """Créer une nouvelle suggestion de cours"""
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role')
        
        # Seuls les professeurs et admins peuvent suggérer
        if user_role not in ['professor', 'admin']:
            return jsonify({
                'success': False,
                'message': 'Accès refusé'
            }), 403
        
        data = request.get_json()
        
        # Validation des champs requis
        required_fields = ['course_name', 'justification']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'message': f'Champs manquants: {", ".join(missing_fields)}'
            }), 400
        
        # Convertir l'heure si fournie
        preferred_time = None
        if data.get('preferred_time') or data.get('preferredTime'):
            time_str = data.get('preferred_time') or data.get('preferredTime')
            try:
                # Format "HH:MM"
                preferred_time = datetime.strptime(time_str, '%H:%M').time()
            except:
                preferred_time = None
        
        # Créer la suggestion
        new_suggestion = CourseSuggestion(
            professor_id=user_id,
            course_name=data.get('course_name') or data.get('courseName'),
            course_code=data.get('course_code') or data.get('courseCode'),
            description=data.get('description'),
            preferred_day=data.get('preferred_day') or data.get('preferredDay'),
            preferred_time=preferred_time,
            duration_hours=data.get('duration_hours') or data.get('duration'),
            frequency=data.get('frequency'),
            room_type=data.get('room_type') or data.get('roomType'),
            required_capacity=data.get('required_capacity') or data.get('capacity'),
            required_equipment=data.get('required_equipment') or data.get('equipment', []),
            justification=data.get('justification'),
            target_audience=data.get('target_audience') or data.get('targetAudience'),
            status='pending'
        )
        
        db.session.add(new_suggestion)
        db.session.commit()
        
        # Créer une notification pour les admins
        admins = User.query.join(User.role).filter_by(name='admin').all()
        for admin in admins:
            notification = Notification(
                user_id=admin.id,
                title='Nouvelle suggestion de cours',
                message=f"Le professeur a suggéré un nouveau cours: {new_suggestion.course_name}",
                type='suggestion',
                related_entity='course_suggestion',
                related_id=new_suggestion.id
            )
            db.session.add(notification)
        
        # Log d'audit
        audit_log = AuditLog(
            user_id=user_id,
            action='SUGGESTION_CREATE',
            table_name='course_suggestions',
            record_id=new_suggestion.id,
            new_values=new_suggestion.to_dict(),
            ip_address=request.remote_addr
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Suggestion créée avec succès',
            'suggestion': new_suggestion.to_dict(include_professor=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# APPROUVER UNE SUGGESTION (Admin seulement)
# ============================================
@suggestions_bp.route('/<int:suggestion_id>/approve', methods=['POST'])
@jwt_required()
def approve_suggestion(suggestion_id):
    """Approuver une suggestion et créer le cours"""
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role')
        
        # Seuls les admins peuvent approuver
        if user_role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Accès refusé'
            }), 403
        
        suggestion = CourseSuggestion.query.get(suggestion_id)
        
        if not suggestion:
            return jsonify({
                'success': False,
                'message': 'Suggestion non trouvée'
            }), 404
        
        if suggestion.status != 'pending':
            return jsonify({
                'success': False,
                'message': 'Cette suggestion a déjà été traitée'
            }), 400
        
        # Créer le cours à partir de la suggestion
        data = request.get_json() or {}
        
        new_course = Course(
            course_code=suggestion.course_code or f"AUTO-{suggestion.id}",
            course_name=suggestion.course_name,
            description=suggestion.description,
            credits=data.get('credits', 6),
            professor_id=suggestion.professor_id,
            status='active',
            max_students=suggestion.required_capacity or 30,
            semester=data.get('semester', 'Printemps'),
            year=data.get('year', datetime.now().year)
        )
        
        db.session.add(new_course)
        db.session.flush()  # Pour obtenir l'ID du cours
        
        # Mettre à jour la suggestion
        suggestion.status = 'approved'
        suggestion.reviewed_by = user_id
        suggestion.reviewed_at = datetime.utcnow()
        suggestion.approved_course_id = new_course.id
        
        # Créer une notification pour le professeur
        notification = Notification(
            user_id=suggestion.professor_id,
            title='Suggestion approuvée',
            message=f"Votre suggestion '{suggestion.course_name}' a été approuvée!",
            type='success',
            related_entity='course',
            related_id=new_course.id
        )
        db.session.add(notification)
        
        # Log d'audit
        audit_log = AuditLog(
            user_id=user_id,
            action='SUGGESTION_APPROVE',
            table_name='course_suggestions',
            record_id=suggestion.id,
            new_values={'course_id': new_course.id, 'status': 'approved'},
            ip_address=request.remote_addr
        )
        db.session.add(audit_log)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Suggestion approuvée et cours créé',
            'suggestion': suggestion.to_dict(include_professor=True),
            'course': new_course.to_dict(include_professor=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# REJETER UNE SUGGESTION (Admin seulement)
# ============================================
@suggestions_bp.route('/<int:suggestion_id>/reject', methods=['POST'])
@jwt_required()
def reject_suggestion(suggestion_id):
    """Rejeter une suggestion"""
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role')
        
        # Seuls les admins peuvent rejeter
        if user_role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Accès refusé'
            }), 403
        
        suggestion = CourseSuggestion.query.get(suggestion_id)
        
        if not suggestion:
            return jsonify({
                'success': False,
                'message': 'Suggestion non trouvée'
            }), 404
        
        if suggestion.status != 'pending':
            return jsonify({
                'success': False,
                'message': 'Cette suggestion a déjà été traitée'
            }), 400
        
        data = request.get_json()
        reason = data.get('reason', 'Non spécifié')
        
        # Mettre à jour la suggestion
        suggestion.status = 'rejected'
        suggestion.reviewed_by = user_id
        suggestion.reviewed_at = datetime.utcnow()
        suggestion.rejection_reason = reason
        
        # Créer une notification pour le professeur
        notification = Notification(
            user_id=suggestion.professor_id,
            title='Suggestion rejetée',
            message=f"Votre suggestion '{suggestion.course_name}' a été rejetée. Raison: {reason}",
            type='warning',
            related_entity='course_suggestion',
            related_id=suggestion.id
        )
        db.session.add(notification)
        
        # Log d'audit
        audit_log = AuditLog(
            user_id=user_id,
            action='SUGGESTION_REJECT',
            table_name='course_suggestions',
            record_id=suggestion.id,
            new_values={'status': 'rejected', 'reason': reason},
            ip_address=request.remote_addr
        )
        db.session.add(audit_log)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Suggestion rejetée',
            'suggestion': suggestion.to_dict(include_professor=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# STATISTIQUES DES SUGGESTIONS
# ============================================
@suggestions_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_suggestions_stats():
    """Obtenir les statistiques des suggestions"""
    try:
        claims = get_jwt()
        user_role = claims.get('role')
        
        if user_role != 'admin':
            return jsonify({
                'success': False,
                'message': 'Accès refusé'
            }), 403
        
        pending = CourseSuggestion.query.filter_by(status='pending').count()
        approved = CourseSuggestion.query.filter_by(status='approved').count()
        rejected = CourseSuggestion.query.filter_by(status='rejected').count()
        total = CourseSuggestion.query.count()
        
        return jsonify({
            'success': True,
            'stats': {
                'total': total,
                'pending': pending,
                'approved': approved,
                'rejected': rejected
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

