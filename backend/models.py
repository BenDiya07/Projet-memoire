"""
Modèles SQLAlchemy pour la base de données PostgreSQL
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid

db = SQLAlchemy()

# ============================================
# MODÈLE: Role
# ============================================
class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    users = db.relationship('User', back_populates='role', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }

# ============================================
# MODÈLE: User
# ============================================
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    student_id = db.Column(db.String(50), unique=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    role = db.relationship('Role', back_populates='users')
    courses_taught = db.relationship('Course', back_populates='professor', lazy='dynamic')
    enrollments = db.relationship('StudentEnrollment', back_populates='student', lazy='dynamic')
    suggestions = db.relationship('CourseSuggestion', foreign_keys='CourseSuggestion.professor_id', 
                                  back_populates='professor', lazy='dynamic')
    notifications = db.relationship('Notification', back_populates='user', lazy='dynamic')
    
    def to_dict(self, include_role=True):
        data = {
            'id': self.id,
            'uuid': str(self.uuid),
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.first_name} {self.last_name}",
            'student_id': self.student_id,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_role and self.role:
            data['role'] = self.role.to_dict()
        
        return data

# ============================================
# MODÈLE: Room
# ============================================
class Room(db.Model):
    __tablename__ = 'rooms'
    
    id = db.Column(db.Integer, primary_key=True)
    room_number = db.Column(db.String(50), unique=True, nullable=False)
    building = db.Column(db.String(100))
    room_type = db.Column(db.String(50))
    capacity = db.Column(db.Integer, nullable=False)
    floor = db.Column(db.Integer)
    is_available = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    schedules = db.relationship('CourseSchedule', back_populates='room', lazy='dynamic')
    equipment = db.relationship('RoomEquipment', back_populates='room', lazy='dynamic')
    
    def to_dict(self, include_equipment=False):
        data = {
            'id': self.id,
            'room_number': self.room_number,
            'building': self.building,
            'room_type': self.room_type,
            'capacity': self.capacity,
            'floor': self.floor,
            'is_available': self.is_available,
            'notes': self.notes
        }
        
        if include_equipment:
            data['equipment'] = [eq.to_dict() for eq in self.equipment]
        
        return data

# ============================================
# MODÈLE: Equipment
# ============================================
class Equipment(db.Model):
    __tablename__ = 'equipment'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    rooms = db.relationship('RoomEquipment', back_populates='equipment', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }

# ============================================
# MODÈLE: RoomEquipment (Table d'association)
# ============================================
class RoomEquipment(db.Model):
    __tablename__ = 'room_equipment'
    
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=False)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    is_functional = db.Column(db.Boolean, default=True)
    
    # Relations
    room = db.relationship('Room', back_populates='equipment')
    equipment = db.relationship('Equipment', back_populates='rooms')
    
    def to_dict(self):
        return {
            'id': self.id,
            'equipment': self.equipment.to_dict() if self.equipment else None,
            'quantity': self.quantity,
            'is_functional': self.is_functional
        }

# ============================================
# MODÈLE: Course
# ============================================
class Course(db.Model):
    __tablename__ = 'courses'
    
    id = db.Column(db.Integer, primary_key=True)
    course_code = db.Column(db.String(50), unique=True, nullable=False)
    course_name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    credits = db.Column(db.Integer)
    professor_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(50), default='active')
    max_students = db.Column(db.Integer)
    enrolled_students = db.Column(db.Integer, default=0)
    semester = db.Column(db.String(50))
    year = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    professor = db.relationship('User', back_populates='courses_taught')
    schedules = db.relationship('CourseSchedule', back_populates='course', lazy='dynamic', cascade='all, delete-orphan')
    enrollments = db.relationship('StudentEnrollment', back_populates='course', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self, include_professor=True, include_schedules=False):
        data = {
            'id': self.id,
            'course_code': self.course_code,
            'course_name': self.course_name,
            'description': self.description,
            'credits': self.credits,
            'status': self.status,
            'max_students': self.max_students,
            'enrolled_students': self.enrolled_students,
            'semester': self.semester,
            'year': self.year,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_professor and self.professor:
            data['professor'] = {
                'id': self.professor.id,
                'name': f"{self.professor.first_name} {self.professor.last_name}",
                'email': self.professor.email
            }
        
        if include_schedules:
            data['schedules'] = [s.to_dict(include_room=True) for s in self.schedules]
        
        return data

# ============================================
# MODÈLE: CourseSchedule
# ============================================
class CourseSchedule(db.Model):
    __tablename__ = 'course_schedules'
    
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'))
    day_of_week = db.Column(db.String(20), nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    duration_hours = db.Column(db.Numeric(3, 1))
    frequency = db.Column(db.String(50), default='weekly')
    effective_date = db.Column(db.Date)
    expiry_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    course = db.relationship('Course', back_populates='schedules')
    room = db.relationship('Room', back_populates='schedules')
    
    def to_dict(self, include_course=False, include_room=False):
        data = {
            'id': self.id,
            'day_of_week': self.day_of_week,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'duration_hours': float(self.duration_hours) if self.duration_hours else None,
            'frequency': self.frequency,
            'effective_date': self.effective_date.isoformat() if self.effective_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None
        }
        
        if include_course and self.course:
            data['course'] = self.course.to_dict(include_professor=True, include_schedules=False)
        
        if include_room and self.room:
            data['room'] = self.room.to_dict()
        
        return data

# ============================================
# MODÈLE: StudentEnrollment
# ============================================
class StudentEnrollment(db.Model):
    __tablename__ = 'student_enrollments'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    enrollment_date = db.Column(db.DateTime, default=datetime.utcnow)
    grade = db.Column(db.Numeric(5, 2))
    status = db.Column(db.String(50), default='enrolled')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    student = db.relationship('User', back_populates='enrollments')
    course = db.relationship('Course', back_populates='enrollments')
    
    def to_dict(self, include_student=False, include_course=True):
        data = {
            'id': self.id,
            'enrollment_date': self.enrollment_date.isoformat() if self.enrollment_date else None,
            'grade': float(self.grade) if self.grade else None,
            'status': self.status
        }
        
        if include_student and self.student:
            data['student'] = self.student.to_dict(include_role=False)
        
        if include_course and self.course:
            data['course'] = self.course.to_dict(include_professor=True, include_schedules=True)
        
        return data

# ============================================
# MODÈLE: CourseSuggestion
# ============================================
class CourseSuggestion(db.Model):
    __tablename__ = 'course_suggestions'
    
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    professor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_name = db.Column(db.String(255), nullable=False)
    course_code = db.Column(db.String(50))
    description = db.Column(db.Text)
    preferred_day = db.Column(db.String(20))
    preferred_time = db.Column(db.Time)
    duration_hours = db.Column(db.Numeric(3, 1))
    frequency = db.Column(db.String(50))
    room_type = db.Column(db.String(50))
    required_capacity = db.Column(db.Integer)
    required_equipment = db.Column(ARRAY(db.String))
    justification = db.Column(db.Text, nullable=False)
    target_audience = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending')
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewed_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    approved_course_id = db.Column(db.Integer, db.ForeignKey('courses.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    professor = db.relationship('User', foreign_keys=[professor_id], back_populates='suggestions')
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])
    approved_course = db.relationship('Course', foreign_keys=[approved_course_id])
    
    def to_dict(self, include_professor=True):
        data = {
            'id': self.id,
            'uuid': str(self.uuid),
            'course_name': self.course_name,
            'course_code': self.course_code,
            'description': self.description,
            'preferred_day': self.preferred_day,
            'preferred_time': self.preferred_time.strftime('%H:%M') if self.preferred_time else None,
            'duration_hours': float(self.duration_hours) if self.duration_hours else None,
            'frequency': self.frequency,
            'room_type': self.room_type,
            'required_capacity': self.required_capacity,
            'required_equipment': self.required_equipment,
            'justification': self.justification,
            'target_audience': self.target_audience,
            'status': self.status,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'date': self.created_at.strftime('%d %B %Y') if self.created_at else None
        }
        
        if include_professor and self.professor:
            data['professor'] = f"{self.professor.first_name} {self.professor.last_name}"
            data['professor_email'] = self.professor.email
        
        # Renommer les champs pour correspondre au frontend
        data['day'] = data['preferred_day']
        data['time'] = data['preferred_time']
        data['duration'] = data['duration_hours']
        data['capacity'] = data['required_capacity']
        
        return data

# ============================================
# MODÈLE: Conflict
# ============================================
class Conflict(db.Model):
    __tablename__ = 'conflicts'
    
    id = db.Column(db.Integer, primary_key=True)
    conflict_type = db.Column(db.String(50), nullable=False)
    course_schedule_id_1 = db.Column(db.Integer, db.ForeignKey('course_schedules.id'))
    course_schedule_id_2 = db.Column(db.Integer, db.ForeignKey('course_schedules.id'))
    description = db.Column(db.Text)
    severity = db.Column(db.String(20), default='medium')
    status = db.Column(db.String(50), default='unresolved')
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    resolved_at = db.Column(db.DateTime)
    resolution_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'conflict_type': self.conflict_type,
            'description': self.description,
            'severity': self.severity,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# ============================================
# MODÈLE: AuditLog
# ============================================
class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(100), nullable=False)
    table_name = db.Column(db.String(100))
    record_id = db.Column(db.Integer)
    old_values = db.Column(db.JSON)
    new_values = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'table_name': self.table_name,
            'record_id': self.record_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# ============================================
# MODÈLE: Notification
# ============================================
class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50))
    is_read = db.Column(db.Boolean, default=False)
    related_entity = db.Column(db.String(100))
    related_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    user = db.relationship('User', back_populates='notifications')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

