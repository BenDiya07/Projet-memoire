"""Create the local SQLite database and add missing demo records."""

from datetime import time

import bcrypt

from app import create_app
from models import (
    Course,
    CourseSchedule,
    CourseSuggestion,
    Equipment,
    Room,
    Role,
    StudentEnrollment,
    User,
    db,
)


def seed_database():
    roles = {
        'admin': 'Administrateur système',
        'professor': 'Professeur',
        'student': 'Étudiant',
    }
    for name, description in roles.items():
        if not Role.query.filter_by(name=name).first():
            db.session.add(Role(name=name, description=description))
    db.session.flush()

    demo_users = [
        ('admin@univ.fr', 'Admin', 'Principal', None, 'admin'),
        ('prof@univ.fr', 'Jean', 'Martin', None, 'professor'),
        ('dubois@univ.fr', 'Marie', 'Dubois', None, 'professor'),
        ('leroy@univ.fr', 'Pierre', 'Leroy', None, 'professor'),
        ('etudiant@univ.fr', 'Sophie', 'Laurent', '2024001', 'student'),
        ('jean.dupont@univ.fr', 'Jean', 'Dupont', '2024002', 'student'),
        ('alice.martin@univ.fr', 'Alice', 'Martin', '2024003', 'student'),
    ]
    password_hash = None
    users = {}
    for email, first_name, last_name, student_id, role_name in demo_users:
        user = User.query.filter_by(email=email).first()
        if not user:
            if password_hash is None:
                password_hash = bcrypt.hashpw(
                    b'password123', bcrypt.gensalt()
                ).decode('utf-8')
            user = User(
                email=email,
                password_hash=password_hash,
                first_name=first_name,
                last_name=last_name,
                student_id=student_id,
                role=Role.query.filter_by(name=role_name).one(),
                is_active=True,
            )
            db.session.add(user)
        users[email] = user
    db.session.flush()

    equipment_names = {
        'Projecteur': 'Projecteur vidéo HD',
        'Ordinateurs': 'Ordinateurs pour étudiants',
        'Tableau blanc': 'Tableau blanc interactif',
        'Microphone': 'Système de sonorisation',
        'WiFi': 'Connexion WiFi haut débit',
    }
    for name, description in equipment_names.items():
        if not Equipment.query.filter_by(name=name).first():
            db.session.add(Equipment(name=name, description=description))

    room_data = [
        ('A101', 'Bâtiment A', 'amphitheatre', 100, 1),
        ('B205', 'Bâtiment B', 'classroom', 25, 2),
        ('C301', 'Bâtiment C', 'computer_lab', 30, 3),
    ]
    rooms = {}
    for number, building, room_type, capacity, floor in room_data:
        room = Room.query.filter_by(room_number=number).first()
        if not room:
            room = Room(
                room_number=number,
                building=building,
                room_type=room_type,
                capacity=capacity,
                floor=floor,
                is_available=True,
            )
            db.session.add(room)
        rooms[number] = room
    db.session.flush()

    course_data = [
        ('MATH-301', 'Mathématiques Avancées', users['prof@univ.fr'], 6, 30),
        ('PHYS-401', 'Physique Quantique', users['dubois@univ.fr'], 6, 25),
        ('INFO-302', 'Algorithmes Avancés', users['leroy@univ.fr'], 6, 30),
        ('INFO-101', 'Introduction à la Programmation', users['leroy@univ.fr'], 4, 40),
    ]
    courses = {}
    for code, name, professor, credits, capacity in course_data:
        course = Course.query.filter_by(course_code=code).first()
        if not course:
            course = Course(
                course_code=code,
                course_name=name,
                description=f'Cours de démonstration : {name}.',
                professor=professor,
                credits=credits,
                max_students=capacity,
                semester='Automne',
                year=2026,
                status='active',
            )
            db.session.add(course)
        courses[code] = course
    db.session.flush()

    schedule_data = [
        ('MATH-301', 'A101', 'Lundi', '09:00', '11:00'),
        ('PHYS-401', 'B205', 'Mardi', '14:00', '15:30'),
        ('INFO-302', 'C301', 'Mercredi', '10:30', '12:30'),
        ('INFO-101', 'C301', 'Vendredi', '13:00', '15:00'),
    ]
    for code, room_number, day, start, end in schedule_data:
        if not CourseSchedule.query.filter_by(
            course_id=courses[code].id,
            day_of_week=day,
            start_time=time.fromisoformat(start),
        ).first():
            db.session.add(CourseSchedule(
                course=courses[code],
                room=rooms[room_number],
                day_of_week=day,
                start_time=time.fromisoformat(start),
                end_time=time.fromisoformat(end),
                duration_hours=2 if end.endswith(':00') else 1.5,
                frequency='weekly',
            ))

    enrollments = [
        ('2024001', 'MATH-301'),
        ('2024001', 'INFO-302'),
        ('2024002', 'PHYS-401'),
        ('2024003', 'INFO-101'),
    ]
    for student_id, course_code in enrollments:
        student = User.query.filter_by(student_id=student_id).one()
        if not StudentEnrollment.query.filter_by(
            student_id=student.id,
            course_id=courses[course_code].id,
        ).first():
            db.session.add(StudentEnrollment(
                student=student,
                course=courses[course_code],
                status='enrolled',
            ))
            courses[course_code].enrolled_students = (
                courses[course_code].enrolled_students or 0
            ) + 1

    if not CourseSuggestion.query.filter_by(course_code='INFO-401').first():
        db.session.add(CourseSuggestion(
            professor=users['prof@univ.fr'],
            course_name='Intelligence Artificielle',
            course_code='INFO-401',
            description='Introduction à l’apprentissage automatique.',
            preferred_day='Jeudi',
            required_equipment=['Ordinateurs', 'Projecteur'],
            justification='Suggestion de démonstration pour tester le workflow.',
            target_audience='Étudiants de Master en Informatique',
            status='pending',
        ))

    db.session.commit()


def main():
    app = create_app('development')
    if not app.config['SQLALCHEMY_DATABASE_URI'].startswith('sqlite:'):
        raise RuntimeError(
            'L’initialisation locale exige une URL SQLite. '
            'Vérifiez DB_TYPE et DATABASE_URL dans backend/.env.'
        )

    with app.app_context():
        db.create_all()
        seed_database()
        print(f"Base SQLite prête : {app.config['SQLALCHEMY_DATABASE_URI']}")
        print(f"Utilisateurs : {User.query.count()}")
        print(f"Cours : {Course.query.count()}")
        print(f"Salles : {Room.query.count()}")
        print(f"Suggestions : {CourseSuggestion.query.count()}")
        print('Mot de passe des comptes de démonstration : password123')


if __name__ == '__main__':
    main()
