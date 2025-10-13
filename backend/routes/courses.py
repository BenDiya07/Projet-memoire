"""
Routes pour la gestion des cours
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import db, Course, CourseSchedule, Room, User, StudentEnrollment, AuditLog
from sqlalchemy import or_, and_
from datetime import datetime, time

courses_bp = Blueprint('courses', __name__, url_prefix='/api/courses')

# ============================================
# HELPER: VÃ©rifier les permissions admin/prof
# ============================================
def require_role(allowed_roles):
    """DÃ©corateur pour vÃ©rifier les rÃ´les"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role')
            
            if user_role not in allowed_roles:
                return jsonify({
                    'success': False,
                    'message': 'AccÃ¨s refusÃ©'
                }), 403
            
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

# ============================================
# LISTE DES COURS
# ============================================
@courses_bp.route('', methods=['GET'])
@jwt_required()
def get_courses():
    """Obtenir la liste des cours"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Filtres
        status = request.args.get('status')
        professor_id = request.args.get('professor_id', type=int)
        semester = request.args.get('semester')
        year = request.args.get('year', type=int)
        search = request.args.get('search')
        
        # Query de base
        query = Course.query
        
        # Appliquer les filtres
        if status:
            query = query.filter_by(status=status)
        if professor_id:
            query = query.filter_by(professor_id=professor_id)
        if semester:
            query = query.filter_by(semester=semester)
        if year:
            query = query.filter_by(year=year)
        if search:
            query = query.filter(
                or_(
                    Course.course_name.ilike(f'%{search}%'),
                    Course.course_code.ilike(f'%{search}%')
                )
            )
        
        # Pagination
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        courses = [course.to_dict(include_professor=True, include_schedules=True) 
                  for course in pagination.items]
        
        return jsonify({
            'success': True,
            'courses': courses,
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
# DÃ‰TAILS D'UN COURS
# ============================================
@courses_bp.route('/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course(course_id):
    """Obtenir les dÃ©tails d'un cours"""
    try:
        course = Course.query.get(course_id)
        
        if not course:
            return jsonify({
                'success': False,
                'message': 'Cours non trouvÃ©'
            }), 404
        
        return jsonify({
            'success': True,
            'course': course.to_dict(include_professor=True, include_schedules=True)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# CRÃ‰ER UN COURS (Admin seulement)
# ============================================
@courses_bp.route('', methods=['POST'])
@jwt_required()
def create_course():
    """CrÃ©er un nouveau cours"""
    try:
        # VÃ©rifier les permissions
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'AccÃ¨s refusÃ©'
            }), 403
        
        data = request.get_json()
        
        # Validation
        required_fields = ['course_code', 'course_name', 'professor_id', 'max_students']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'message': f'Champs manquants: {", ".join(missing_fields)}'
            }), 400
        
        # VÃ©rifier si le code de cours existe dÃ©jÃ 
        existing = Course.query.filter_by(course_code=data['course_code']).first()
        if existing:
            return jsonify({
                'success': False,
                'message': 'Un cours avec ce code existe dÃ©jÃ '
            }), 409
        
        # CrÃ©er le cours
        new_course = Course(
            course_code=data['course_code'],
            course_name=data['course_name'],
            description=data.get('description'),
            credits=data.get('credits'),
            professor_id=data['professor_id'],
            status=data.get('status', 'active'),
            max_students=data['max_students'],
            semester=data.get('semester'),
            year=data.get('year')
        )
        
        db.session.add(new_course)
        db.session.commit()
        
        # Log d'audit
        current_user_id = get_jwt_identity()
        audit_log = AuditLog(
            user_id=current_user_id,
            action='COURSE_CREATE',
            table_name='courses',
            record_id=new_course.id,
            new_values=new_course.to_dict(),
            ip_address=request.remote_addr
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Cours crÃ©Ã© avec succÃ¨s',
            'course': new_course.to_dict(include_professor=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# MODIFIER UN COURS (Admin seulement)
# ============================================
@courses_bp.route('/<int:course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    """Modifier un cours"""
    try:
        # VÃ©rifier les permissions
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'AccÃ¨s refusÃ©'
            }), 403
        
        course = Course.query.get(course_id)
        
        if not course:
            return jsonify({
                'success': False,
                'message': 'Cours non trouvÃ©'
            }), 404
        
        data = request.get_json()
        old_values = course.to_dict()
        
        # Mettre Ã  jour les champs
        if 'course_name' in data:
            course.course_name = data['course_name']
        if 'description' in data:
            course.description = data['description']
        if 'credits' in data:
            course.credits = data['credits']
        if 'professor_id' in data:
            course.professor_id = data['professor_id']
        if 'status' in data:
            course.status = data['status']
        if 'max_students' in data:
            course.max_students = data['max_students']
        if 'semester' in data:
            course.semester = data['semester']
        if 'year' in data:
            course.year = data['year']
        
        db.session.commit()
        
        # Log d'audit
        current_user_id = get_jwt_identity()
        audit_log = AuditLog(
            user_id=current_user_id,
            action='COURSE_UPDATE',
            table_name='courses',
            record_id=course.id,
            old_values=old_values,
            new_values=course.to_dict(),
            ip_address=request.remote_addr
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Cours modifiÃ© avec succÃ¨s',
            'course': course.to_dict(include_professor=True, include_schedules=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# SUPPRIMER UN COURS (Admin seulement)
# ============================================
@courses_bp.route('/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    """Supprimer un cours"""
    try:
        # VÃ©rifier les permissions
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'AccÃ¨s refusÃ©'
            }), 403
        
        course = Course.query.get(course_id)
        
        if not course:
            return jsonify({
                'success': False,
                'message': 'Cours non trouvÃ©'
            }), 404
        
        old_values = course.to_dict()
        
        # Log d'audit avant suppression
        current_user_id = get_jwt_identity()
        audit_log = AuditLog(
            user_id=current_user_id,
            action='COURSE_DELETE',
            table_name='courses',
            record_id=course.id,
            old_values=old_values,
            ip_address=request.remote_addr
        )
        db.session.add(audit_log)
        
        db.session.delete(course)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Cours supprimÃ© avec succÃ¨s'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# EMPLOI DU TEMPS COMPLET
# ============================================
@courses_bp.route('/schedule', methods=['GET'])
@jwt_required()
def get_schedule():
    """Obtenir l'emploi du temps complet"""
    try:
        claims = get_jwt()
        user_id = get_jwt_identity()
        user_role = claims.get('role')
        
        # Query de base avec joins
        query = db.session.query(CourseSchedule).join(Course)
        
        # Filtrer selon le rÃ´le
        if user_role == 'student':
            # Ã‰tudiants: seulement leurs cours
            query = query.join(StudentEnrollment).filter(
                StudentEnrollment.student_id == user_id,
                StudentEnrollment.status == 'enrolled'
            )
        elif user_role == 'professor':
            # Professeurs: seulement leurs cours
            query = query.filter(Course.professor_id == user_id)
        
        schedules = query.all()
        
        schedule_data = [schedule.to_dict(include_course=True, include_room=True) 
                        for schedule in schedules]
        
        return jsonify({
            'success': True,
            'schedules': schedule_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# INSCRIRE UN Ã‰TUDIANT Ã€ UN COURS
# ============================================
@courses_bp.route('/<int:course_id>/enroll', methods=['POST'])
@jwt_required()
def enroll_student(course_id):
    """Inscrire un Ã©tudiant Ã  un cours"""
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role')
        
        # Les Ã©tudiants peuvent s'inscrire eux-mÃªmes
        # Les admins peuvent inscrire n'importe qui
        data = request.get_json()
        student_id = data.get('student_id', user_id)
        
        if user_role == 'student' and student_id != user_id:
            return jsonify({
                'success': False,
                'message': 'Vous ne pouvez inscrire que vous-mÃªme'
            }), 403
        
        # VÃ©rifier si le cours existe
        course = Course.query.get(course_id)
        if not course:
            return jsonify({
                'success': False,
                'message': 'Cours non trouvÃ©'
            }), 404
        
        # VÃ©rifier si dÃ©jÃ  inscrit
        existing = StudentEnrollment.query.filter_by(
            student_id=student_id,
            course_id=course_id
        ).first()
        
        if existing:
            return jsonify({
                'success': False,
                'message': 'DÃ©jÃ  inscrit Ã  ce cours'
            }), 409
        
        # VÃ©rifier la capacitÃ©
        if course.enrolled_students >= course.max_students:
            return jsonify({
                'success': False,
                'message': 'Cours complet'
            }), 400
        
        # CrÃ©er l'inscription
        enrollment = StudentEnrollment(
            student_id=student_id,
            course_id=course_id,
            status='enrolled'
        )
        
        db.session.add(enrollment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Inscription rÃ©ussie',
            'enrollment': enrollment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# MES COURS (pour Ã©tudiant)
# ============================================
@courses_bp.route('/my-courses', methods=['GET'])
@jwt_required()
def get_my_courses():
    """Obtenir les cours de l'Ã©tudiant connectÃ©"""
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role')
        
        if user_role == 'student':
            # Cours auxquels l'Ã©tudiant est inscrit
            enrollments = StudentEnrollment.query.filter_by(
                student_id=user_id,
                status='enrolled'
            ).all()
            
            courses = [enrollment.to_dict(include_student=False, include_course=True)
                      for enrollment in enrollments]
            
        elif user_role == 'professor':
            # Cours enseignÃ©s par le professeur
            courses_taught = Course.query.filter_by(professor_id=user_id).all()
            courses = [course.to_dict(include_professor=False, include_schedules=True)
                      for course in courses_taught]
        
        else:
            # Admin: tous les cours
            all_courses = Course.query.all()
            courses = [course.to_dict(include_professor=True, include_schedules=True)
                      for course in all_courses]
        
        return jsonify({
            'success': True,
            'courses': courses
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

