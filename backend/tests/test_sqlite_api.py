import bcrypt
import pytest

from app import create_app
from models import Course, CourseSuggestion, Role, User, db


@pytest.fixture
def client():
    app = create_app('testing')
    app.config.update(
        TESTING=True,
        JWT_SECRET_KEY='test-secret-key-that-is-at-least-32-bytes-long',
    )
    with app.app_context():
        db.create_all()
        student_role = Role(name='student', description='Étudiant')
        professor_role = Role(name='professor', description='Professeur')
        db.session.add_all([student_role, professor_role])
        db.session.flush()
        password_hash = bcrypt.hashpw(
            b'password123', bcrypt.gensalt()
        ).decode('utf-8')
        db.session.add_all([
            User(
                email='student@example.test',
                password_hash=password_hash,
                first_name='Test',
                last_name='Student',
                role=student_role,
            ),
            User(
                email='professor@example.test',
                password_hash=password_hash,
                first_name='Test',
                last_name='Professor',
                role=professor_role,
            ),
        ])
        db.session.commit()
        yield app.test_client()
        db.drop_all()


def test_health_reports_sqlite_connection(client):
    response = client.get('/health')

    assert response.status_code == 200
    assert response.json['status'] == 'healthy'
    assert response.json['database'] == 'connected'


def test_student_can_log_in_and_read_course_list(client):
    response = client.post('/api/auth/login', json={
        'email': 'student@example.test',
        'password': 'password123',
    })

    assert response.status_code == 200
    token = response.json['access_token']
    courses_response = client.get(
        '/api/courses',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert courses_response.status_code == 200, courses_response.get_json()
    assert courses_response.json['courses'] == []


def test_suggestions_support_sqlite_json_equipment(client):
    with client.application.app_context():
        professor = User.query.filter_by(email='professor@example.test').one()
        suggestion = CourseSuggestion(
            professor_id=professor.id,
            course_name='Cours de test',
            course_code='TEST-101',
            required_equipment=['Projecteur', 'WiFi'],
            justification='Vérifier la compatibilité SQLite.',
        )
        db.session.add(suggestion)
        db.session.commit()

        assert suggestion.to_dict()['required_equipment'] == ['Projecteur', 'WiFi']
        assert Course.query.count() == 0
