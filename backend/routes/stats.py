"""
Routes pour les statistiques du dashboard
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from models import (
    db, Course, CourseSchedule, Room, User, StudentEnrollment,
    CourseSuggestion, Conflict, Notification
)
from sqlalchemy import func
from datetime import datetime, timedelta

stats_bp = Blueprint('stats', __name__, url_prefix='/api/stats')


@stats_bp.route('', methods=['GET'])
@jwt_required()
def get_stats():
    """Statistiques globales pour le dashboard"""
    try:
        total_courses = Course.query.count()
        total_professors = User.query.join(User.role).filter_by(name='professor').count()
        total_rooms = Room.query.count()
        total_students = User.query.join(User.role).filter_by(name='student').count()

        pending_suggestions = CourseSuggestion.query.filter_by(status='pending').count()
        approved_suggestions = CourseSuggestion.query.filter_by(status='approved').count()
        rejected_suggestions = CourseSuggestion.query.filter_by(status='rejected').count()

        total_enrolled = StudentEnrollment.query.filter_by(status='enrolled').count()

        total_conflicts = Conflict.query.filter(
            Conflict.status == 'unresolved'
        ).count()

        return jsonify({
            'success': True,
            'stats': {
                'total_courses': total_courses,
                'total_professors': total_professors,
                'total_rooms': total_rooms,
                'total_students': total_students,
                'pending_suggestions': pending_suggestions,
                'approved_suggestions': approved_suggestions,
                'rejected_suggestions': rejected_suggestions,
                'total_enrolled': total_enrolled,
                'total_conflicts': total_conflicts
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500


@stats_bp.route('/schedule', methods=['GET'])
@jwt_required()
def get_schedule_stats():
    """Statistiques des cours par jour de la semaine"""
    try:
        days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
        day_counts = {}

        for day in days:
            count = CourseSchedule.query.filter(
                func.lower(CourseSchedule.day_of_week) == day.lower()
            ).count()
            day_counts[day] = count

        return jsonify({
            'success': True,
            'schedule_stats': {
                'days': days,
                'counts': [day_counts.get(d, 0) for d in days]
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500


@stats_bp.route('/room-occupation', methods=['GET'])
@jwt_required()
def get_room_occupation():
    """Taux d'occupation des salles"""
    try:
        total_rooms = Room.query.count()
        if total_rooms == 0:
            occupation_rate = 0
        else:
            occupied_today = db.session.query(
                func.count(func.distinct(CourseSchedule.room_id))
            ).filter(CourseSchedule.room_id.isnot(None)).scalar() or 0
            occupation_rate = round((occupied_today / total_rooms) * 100)

        return jsonify({
            'success': True,
            'room_occupation': {
                'rate': occupation_rate,
                'occupied': occupied_today if total_rooms > 0 else 0,
                'total': total_rooms
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500


@stats_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Notifications récentes de l'utilisateur"""
    try:
        user_id = get_jwt_identity()

        notifications = Notification.query.filter_by(
            user_id=user_id
        ).order_by(Notification.created_at.desc()).limit(10).all()

        return jsonify({
            'success': True,
            'notifications': [n.to_dict() for n in notifications]
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erreur: {str(e)}'
        }), 500
