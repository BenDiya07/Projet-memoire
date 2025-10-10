-- ============================================
-- SCRIPT D'INITIALISATION DE LA BASE DE DONNÉES
-- Avec données de test pour développement local
-- ============================================

-- Note: Ce script doit être exécuté APRÈS schema.sql

-- ============================================
-- UTILISATEURS DE DÉMONSTRATION
-- ============================================

-- Mot de passe pour tous les comptes de démo: "password123"
-- Hash bcrypt de "password123": $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqRfNmRqWe

-- Admin
INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_active) VALUES
    ('admin@univ.fr', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqRfNmRqWe', 'Admin', 'Principal', 
     (SELECT id FROM roles WHERE name = 'admin'), true);

-- Professeurs
INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_active) VALUES
    ('prof@univ.fr', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqRfNmRqWe', 'Jean', 'Martin', 
     (SELECT id FROM roles WHERE name = 'professor'), true),
    ('dubois@univ.fr', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqRfNmRqWe', 'Marie', 'Dubois', 
     (SELECT id FROM roles WHERE name = 'professor'), true),
    ('leroy@univ.fr', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqRfNmRqWe', 'Pierre', 'Leroy', 
     (SELECT id FROM roles WHERE name = 'professor'), true);

-- Étudiants
INSERT INTO users (email, password_hash, first_name, last_name, student_id, role_id, is_active) VALUES
    ('etudiant@univ.fr', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqRfNmRqWe', 'Sophie', 'Laurent', '2024001',
     (SELECT id FROM roles WHERE name = 'student'), true),
    ('jean.dupont@univ.fr', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqRfNmRqWe', 'Jean', 'Dupont', '2024002',
     (SELECT id FROM roles WHERE name = 'student'), true),
    ('alice.martin@univ.fr', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqRfNmRqWe', 'Alice', 'Martin', '2024003',
     (SELECT id FROM roles WHERE name = 'student'), true);

-- ============================================
-- SALLES
-- ============================================

INSERT INTO rooms (room_number, building, room_type, capacity, floor, is_available) VALUES
    ('A101', 'Bâtiment A', 'amphitheatre', 100, 1, true),
    ('A102', 'Bâtiment A', 'classroom', 30, 1, true),
    ('B205', 'Bâtiment B', 'classroom', 25, 2, true),
    ('B206', 'Bâtiment B', 'lab', 20, 2, true),
    ('C301', 'Bâtiment C', 'computer_lab', 30, 3, true),
    ('C302', 'Bâtiment C', 'computer_lab', 25, 3, true),
    ('D401', 'Bâtiment D', 'amphitheatre', 150, 4, true),
    ('E101', 'Bâtiment E', 'conference', 50, 1, true);

-- ============================================
-- ÉQUIPEMENTS DES SALLES
-- ============================================

-- A101 (Amphithéâtre)
INSERT INTO room_equipment (room_id, equipment_id, quantity) VALUES
    ((SELECT id FROM rooms WHERE room_number = 'A101'), (SELECT id FROM equipment WHERE name = 'Projecteur'), 1),
    ((SELECT id FROM rooms WHERE room_number = 'A101'), (SELECT id FROM equipment WHERE name = 'Microphone'), 2),
    ((SELECT id FROM rooms WHERE room_number = 'A101'), (SELECT id FROM equipment WHERE name = 'WiFi'), 1);

-- B205 (Salle de classe)
INSERT INTO room_equipment (room_id, equipment_id, quantity) VALUES
    ((SELECT id FROM rooms WHERE room_number = 'B205'), (SELECT id FROM equipment WHERE name = 'Projecteur'), 1),
    ((SELECT id FROM rooms WHERE room_number = 'B205'), (SELECT id FROM equipment WHERE name = 'Tableau blanc'), 1),
    ((SELECT id FROM rooms WHERE room_number = 'B205'), (SELECT id FROM equipment WHERE name = 'WiFi'), 1);

-- C301 (Salle informatique)
INSERT INTO room_equipment (room_id, equipment_id, quantity) VALUES
    ((SELECT id FROM rooms WHERE room_number = 'C301'), (SELECT id FROM equipment WHERE name = 'Ordinateurs'), 30),
    ((SELECT id FROM rooms WHERE room_number = 'C301'), (SELECT id FROM equipment WHERE name = 'Projecteur'), 1),
    ((SELECT id FROM rooms WHERE room_number = 'C301'), (SELECT id FROM equipment WHERE name = 'WiFi'), 1);

-- ============================================
-- COURS
-- ============================================

INSERT INTO courses (course_code, course_name, description, credits, professor_id, status, max_students, semester, year) VALUES
    ('MATH-301', 'Mathématiques Avancées', 'Algèbre linéaire et calcul différentiel', 6,
     (SELECT id FROM users WHERE email = 'prof@univ.fr'), 'active', 30, 'Printemps', 2024),
    
    ('PHYS-401', 'Physique Quantique', 'Introduction à la mécanique quantique', 6,
     (SELECT id FROM users WHERE email = 'dubois@univ.fr'), 'active', 25, 'Printemps', 2024),
    
    ('INFO-302', 'Algorithmes Avancés', 'Structures de données et complexité algorithmique', 6,
     (SELECT id FROM users WHERE email = 'leroy@univ.fr'), 'active', 30, 'Printemps', 2024),
    
    ('MATH-201', 'Statistiques', 'Probabilités et statistiques appliquées', 4,
     (SELECT id FROM users WHERE email = 'prof@univ.fr'), 'active', 35, 'Printemps', 2024),
    
    ('INFO-101', 'Introduction à la Programmation', 'Bases de la programmation en Python', 4,
     (SELECT id FROM users WHERE email = 'leroy@univ.fr'), 'active', 40, 'Printemps', 2024);

-- ============================================
-- PLANNING DES COURS
-- ============================================

-- MATH-301 - Lundi 09:00-11:00
INSERT INTO course_schedules (course_id, room_id, day_of_week, start_time, end_time, duration_hours, frequency, effective_date) VALUES
    ((SELECT id FROM courses WHERE course_code = 'MATH-301'),
     (SELECT id FROM rooms WHERE room_number = 'A101'),
     'Lundi', '09:00', '11:00', 2.0, 'weekly', '2024-01-15');

-- PHYS-401 - Mardi 14:00-15:30
INSERT INTO course_schedules (course_id, room_id, day_of_week, start_time, end_time, duration_hours, frequency, effective_date) VALUES
    ((SELECT id FROM courses WHERE course_code = 'PHYS-401'),
     (SELECT id FROM rooms WHERE room_number = 'B205'),
     'Mardi', '14:00', '15:30', 1.5, 'weekly', '2024-01-16');

-- INFO-302 - Mercredi 10:30-12:30
INSERT INTO course_schedules (course_id, room_id, day_of_week, start_time, end_time, duration_hours, frequency, effective_date) VALUES
    ((SELECT id FROM courses WHERE course_code = 'INFO-302'),
     (SELECT id FROM rooms WHERE room_number = 'C301'),
     'Mercredi', '10:30', '12:30', 2.0, 'weekly', '2024-01-17');

-- MATH-201 - Jeudi 08:00-10:00
INSERT INTO course_schedules (course_id, room_id, day_of_week, start_time, end_time, duration_hours, frequency, effective_date) VALUES
    ((SELECT id FROM courses WHERE course_code = 'MATH-201'),
     (SELECT id FROM rooms WHERE room_number = 'B205'),
     'Jeudi', '08:00', '10:00', 2.0, 'weekly', '2024-01-18');

-- INFO-101 - Vendredi 13:00-15:00
INSERT INTO course_schedules (course_id, room_id, day_of_week, start_time, end_time, duration_hours, frequency, effective_date) VALUES
    ((SELECT id FROM courses WHERE course_code = 'INFO-101'),
     (SELECT id FROM rooms WHERE room_number = 'C301'),
     'Vendredi', '13:00', '15:00', 2.0, 'weekly', '2024-01-19');

-- ============================================
-- INSCRIPTIONS DES ÉTUDIANTS
-- ============================================

-- Étudiant 1 (Sophie Laurent) inscrit à 3 cours
INSERT INTO student_enrollments (student_id, course_id, status) VALUES
    ((SELECT id FROM users WHERE student_id = '2024001'), (SELECT id FROM courses WHERE course_code = 'MATH-301'), 'enrolled'),
    ((SELECT id FROM users WHERE student_id = '2024001'), (SELECT id FROM courses WHERE course_code = 'INFO-302'), 'enrolled'),
    ((SELECT id FROM users WHERE student_id = '2024001'), (SELECT id FROM courses WHERE course_code = 'INFO-101'), 'enrolled');

-- Étudiant 2 (Jean Dupont) inscrit à 2 cours
INSERT INTO student_enrollments (student_id, course_id, status) VALUES
    ((SELECT id FROM users WHERE student_id = '2024002'), (SELECT id FROM courses WHERE course_code = 'PHYS-401'), 'enrolled'),
    ((SELECT id FROM users WHERE student_id = '2024002'), (SELECT id FROM courses WHERE course_code = 'MATH-201'), 'enrolled');

-- Étudiant 3 (Alice Martin) inscrit à 2 cours
INSERT INTO student_enrollments (student_id, course_id, status) VALUES
    ((SELECT id FROM users WHERE student_id = '2024003'), (SELECT id FROM courses WHERE course_code = 'INFO-302'), 'enrolled'),
    ((SELECT id FROM users WHERE student_id = '2024003'), (SELECT id FROM courses WHERE course_code = 'INFO-101'), 'enrolled');

-- ============================================
-- SUGGESTIONS DE COURS (quelques exemples)
-- ============================================

INSERT INTO course_suggestions (
    professor_id, course_name, course_code, description,
    preferred_day, preferred_time, duration_hours, frequency,
    room_type, required_capacity, required_equipment,
    justification, target_audience, status
) VALUES
    ((SELECT id FROM users WHERE email = 'prof@univ.fr'),
     'Intelligence Artificielle', 'INFO-401', 'Introduction aux réseaux de neurones et apprentissage profond',
     'Lundi', '14:00', 2.0, 'weekly',
     'computer_lab', 25, ARRAY['Ordinateurs', 'Projecteur'],
     'La demande pour ce cours est très forte et il complète bien le cursus informatique actuel.',
     'Étudiants de Master en Informatique', 'pending'),
    
    ((SELECT id FROM users WHERE email = 'dubois@univ.fr'),
     'Astrophysique', 'PHYS-501', 'Étude des objets célestes et de l''univers',
     'Mercredi', '16:00', 2.0, 'weekly',
     'amphitheatre', 50, ARRAY['Projecteur', 'Microphone'],
     'Extension naturelle du programme de physique pour les étudiants avancés.',
     'Étudiants de Master en Physique', 'pending');

-- ============================================
-- NOTIFICATIONS INITIALES
-- ============================================

-- Notification pour l'admin
INSERT INTO notifications (user_id, title, message, type) VALUES
    ((SELECT id FROM users WHERE email = 'admin@univ.fr'),
     'Bienvenue sur le système',
     'Système de gestion des cours initialisé avec succès. Vous avez 2 suggestions en attente.',
     'info');

-- Notifications pour les professeurs
INSERT INTO notifications (user_id, title, message, type) VALUES
    ((SELECT id FROM users WHERE email = 'prof@univ.fr'),
     'Cours assignés',
     'Vous avez 2 cours assignés pour le semestre de printemps 2024.',
     'success');

-- ============================================
-- AUDIT LOG INITIAL
-- ============================================

INSERT INTO audit_logs (user_id, action, table_name, new_values) VALUES
    (NULL, 'SYSTEM_INIT', 'database', '{"action": "Database initialized with test data"}'),
    ((SELECT id FROM users WHERE email = 'admin@univ.fr'), 'USER_LOGIN', 'users', 
     '{"email": "admin@univ.fr", "timestamp": "' || CURRENT_TIMESTAMP || '"}');

-- ============================================
-- FIN DE L'INITIALISATION
-- ============================================

-- Afficher un résumé
SELECT 
    'Initialisation terminée!' AS status,
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM courses) AS total_courses,
    (SELECT COUNT(*) FROM rooms) AS total_rooms,
    (SELECT COUNT(*) FROM course_suggestions WHERE status = 'pending') AS pending_suggestions;

