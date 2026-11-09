"""
Routes pour la gestion des cours
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, Course, CourseSchedule, Room, User, StudentEnrollment, AuditLog
from sqlalchemy import or_, and_
from datetime import datetime, time
from auth_utils import get_current_user_id

courses_bp = Blueprint('courses', __name__, url_prefix='/api/courses')

# ============================================
# HELPER: Vérifier les permissions admin/prof
# ============================================
def require_role(allowed_roles):
    """Décorateur pour vérifier les rôles"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get('role')
            
            if user_role not in allowed_roles:
                return jsonify({
                    'success': False,
                    'message': 'Accès refusé'
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
# DÉTAILS D'UN COURS
# ============================================
@courses_bp.route('/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course(course_id):
    """Obtenir les détails d'un cours"""
    try:
        course = Course.query.get(course_id)
        
        if not course:
            return jsonify({
                'success': False,
                'message': 'Cours non trouvé'
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
# CRÉER UN COURS (Admin seulement)
# ============================================
@courses_bp.route('', methods=['POST'])
@jwt_required()
def create_course():
    """Créer un nouveau cours"""
    try:
        # Vérifier les permissions
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'Accès refusé'
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
        
        # Vérifier si le code de cours existe déjà
        existing = Course.query.filter_by(course_code=data['course_code']).first()
        if existing:
            return jsonify({
                'success': False,
                'message': 'Un cours avec ce code existe déjà'
            }), 409
        
        # Créer le cours
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
        current_user_id = get_current_user_id()
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
            'message': 'Cours créé avec succès',
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
        # Vérifier les permissions
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'Accès refusé'
            }), 403
        
        course = Course.query.get(course_id)
        
        if not course:
            return jsonify({
                'success': False,
                'message': 'Cours non trouvé'
            }), 404
        
        data = request.get_json()
        old_values = course.to_dict()
        
        # Mettre à jour les champs
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
        current_user_id = get_current_user_id()
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
            'message': 'Cours modifié avec succès',
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
        # Vérifier les permissions
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({
                'success': False,
                'message': 'Accès refusé'
            }), 403
        
        course = Course.query.get(course_id)
        
        if not course:
            return jsonify({
                'success': False,
                'message': 'Cours non trouvé'
            }), 404
        
        old_values = course.to_dict()
        
        # Log d'audit avant suppression
        current_user_id = get_current_user_id()
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
            'message': 'Cours supprimé avec succès'
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
        user_id = get_current_user_id()
        user_role = claims.get('role')
        
        # Query de base avec joins
        query = db.session.query(CourseSchedule).join(Course)
        
        # Filtrer selon le rôle
        if user_role == 'student':
            # Étudiants: seulement leurs cours
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
# INSCRIRE UN ÉTUDIANT À UN COURS
# ============================================
@courses_bp.route('/<int:course_id>/enroll', methods=['POST'])
@jwt_required()
def enroll_student(course_id):
    """Inscrire un étudiant à un cours"""
    try:
        user_id = get_current_user_id()
        claims = get_jwt()
        user_role = claims.get('role')
        
        # Les étudiants peuvent s'inscrire eux-mêmes
        # Les admins peuvent inscrire n'importe qui
        data = request.get_json()
        student_id = data.get('student_id', user_id)
        
        if user_role == 'student' and student_id != user_id:
            return jsonify({
                'success': False,
                'message': 'Vous ne pouvez inscrire que vous-même'
            }), 403
        
        # Vérifier si le cours existe
        course = Course.query.get(course_id)
        if not course:
            return jsonify({
                'success': False,
                'message': 'Cours non trouvé'
            }), 404
        
        # Vérifier si déjà inscrit
        existing = StudentEnrollment.query.filter_by(
            student_id=student_id,
            course_id=course_id
        ).first()
        
        if existing:
            return jsonify({
                'success': False,
                'message': 'Déjà inscrit à ce cours'
            }), 409
        
        # Vérifier la capacité
        if course.enrolled_students >= course.max_students:
            return jsonify({
                'success': False,
                'message': 'Cours complet'
            }), 400
        
        # Créer l'inscription
        enrollment = StudentEnrollment(
            student_id=student_id,
            course_id=course_id,
            status='enrolled'
        )
        
        db.session.add(enrollment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Inscription réussie',
            'enrollment': enrollment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# MES COURS (pour étudiant)
# ============================================
@courses_bp.route('/my-courses', methods=['GET'])
@jwt_required()
def get_my_courses():
    """Obtenir les cours de l'étudiant connecté"""
    try:
        user_id = get_current_user_id()
        claims = get_jwt()
        user_role = claims.get('role')
        
        if user_role == 'student':
            # Cours auxquels l'étudiant est inscrit
            enrollments = StudentEnrollment.query.filter_by(
                student_id=user_id,
                status='enrolled'
            ).all()
            
            courses = [enrollment.to_dict(include_student=False, include_course=True)
                      for enrollment in enrollments]
            
        elif user_role == 'professor':
            # Cours enseignés par le professeur
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

# ============================================
# LISTE DES SALLES
# ============================================
@courses_bp.route('/rooms', methods=['GET'])
@jwt_required()
def get_rooms():
    """Obtenir la liste des salles disponibles"""
    try:
        rooms = Room.query.all()
        return jsonify({
            'success': True,
            'rooms': [room.to_dict() for room in rooms]
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# CRÉER UN HORAIRE (Admin seulement)
# ============================================
@courses_bp.route('/schedules', methods=['POST'])
@jwt_required()
def create_schedule():
    """Ajouter un créneau horaire à un cours"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Accès refusé'}), 403
            
        data = request.get_json()
        
        # Conversion des chaînes en objets time/date
        start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        
        new_schedule = CourseSchedule(
            course_id=data['course_id'],
            room_id=data['room_id'],
            day_of_week=data['day_of_week'],
            start_time=start_time,
            end_time=end_time,
            duration_hours=data.get('duration_hours'),
            frequency=data.get('frequency', 'weekly')
        )
        
        db.session.add(new_schedule)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Horaire ajouté avec succès',
            'schedule': new_schedule.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500

# ============================================
# MODIFIER UN CRÉNEAU HORAIRE (Admin seulement)
# ============================================
@courses_bp.route('/schedules/<int:schedule_id>', methods=['PUT'])
@jwt_required()
def update_schedule(schedule_id):
    """Modifier un créneau horaire d'un cours"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Accès refusé'}), 403

        schedule = CourseSchedule.query.get(schedule_id)
        if not schedule:
            return jsonify({'success': False, 'message': 'Horaire non trouvé'}), 404

        data = request.get_json()

        if 'course_id' in data:
            schedule.course_id = data['course_id']
        if 'room_id' in data:
            schedule.room_id = data['room_id']
        if 'day_of_week' in data:
            schedule.day_of_week = data['day_of_week']
        if 'start_time' in data:
            schedule.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        if 'end_time' in data:
            schedule.end_time = datetime.strptime(data['end_time'], '%H:%M').time()
        if 'duration_hours' in data:
            schedule.duration_hours = data['duration_hours']
        if 'frequency' in data:
            schedule.frequency = data.get('frequency', 'weekly')

        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Horaire modifié avec succès',
            'schedule': schedule.to_dict(include_room=True)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500
