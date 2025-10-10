-- ============================================
-- SCHÉMA POSTGRESQL - GESTION COURS UNIVERSITAIRES
-- Base de données pour déploiement local puis AWS RDS
-- ============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: ROLES
-- Description: Définit les rôles des utilisateurs
-- ============================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL CHECK (name IN ('admin', 'professor', 'student')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: USERS
-- Description: Stocke les informations des utilisateurs
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) UNIQUE,
    role_id INTEGER REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- ============================================
-- TABLE: ROOMS
-- Description: Salles de cours disponibles
-- ============================================
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(50) UNIQUE NOT NULL,
    building VARCHAR(100),
    room_type VARCHAR(50) CHECK (room_type IN ('amphitheatre', 'classroom', 'lab', 'computer_lab', 'conference')),
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    floor INTEGER,
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: EQUIPMENT
-- Description: Types d'équipements disponibles
-- ============================================
CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: ROOM_EQUIPMENT
-- Description: Équipements présents dans chaque salle
-- ============================================
CREATE TABLE room_equipment (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    is_functional BOOLEAN DEFAULT true,
    UNIQUE(room_id, equipment_id)
);

-- ============================================
-- TABLE: COURSES
-- Description: Cours disponibles
-- ============================================
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(50) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INTEGER CHECK (credits > 0),
    professor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'conflict', 'pending')),
    max_students INTEGER CHECK (max_students > 0),
    enrolled_students INTEGER DEFAULT 0 CHECK (enrolled_students >= 0),
    semester VARCHAR(50),
    year INTEGER CHECK (year >= 2020),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT enrolled_check CHECK (enrolled_students <= max_students)
);

-- ============================================
-- TABLE: COURSE_SCHEDULES
-- Description: Planning des cours (horaires)
-- ============================================
CREATE TABLE course_schedules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours DECIMAL(3,1) CHECK (duration_hours > 0),
    frequency VARCHAR(50) DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'once')),
    effective_date DATE,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT time_check CHECK (end_time > start_time)
);

-- ============================================
-- TABLE: STUDENT_ENROLLMENTS
-- Description: Inscriptions des étudiants aux cours
-- ============================================
CREATE TABLE student_enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade DECIMAL(5,2) CHECK (grade >= 0 AND grade <= 100),
    status VARCHAR(50) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- ============================================
-- TABLE: COURSE_SUGGESTIONS
-- Description: Suggestions de cours par les professeurs
-- ============================================
CREATE TABLE course_suggestions (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    professor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50),
    description TEXT,
    preferred_day VARCHAR(20) CHECK (preferred_day IN ('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche')),
    preferred_time TIME,
    duration_hours DECIMAL(3,1) CHECK (duration_hours > 0),
    frequency VARCHAR(50) CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'once')),
    room_type VARCHAR(50),
    required_capacity INTEGER CHECK (required_capacity > 0),
    required_equipment TEXT[], -- Array d'équipements
    justification TEXT NOT NULL,
    target_audience TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    approved_course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: CONFLICTS
-- Description: Détection et gestion des conflits
-- ============================================
CREATE TABLE conflicts (
    id SERIAL PRIMARY KEY,
    conflict_type VARCHAR(50) NOT NULL CHECK (conflict_type IN ('room', 'professor', 'time', 'capacity')),
    course_schedule_id_1 INTEGER REFERENCES course_schedules(id) ON DELETE CASCADE,
    course_schedule_id_2 INTEGER REFERENCES course_schedules(id) ON DELETE CASCADE,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'acknowledged', 'resolved', 'ignored')),
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: AUDIT_LOGS
-- Description: Journal d'audit pour traçabilité
-- ============================================
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: NOTIFICATIONS
-- Description: Notifications pour les utilisateurs
-- ============================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('info', 'warning', 'error', 'success', 'suggestion')),
    is_read BOOLEAN DEFAULT false,
    related_entity VARCHAR(100),
    related_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES pour optimisation des requêtes
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_active ON users(is_active);

-- Courses
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_professor ON courses(professor_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_semester_year ON courses(semester, year);

-- Course Schedules
CREATE INDEX idx_schedules_course ON course_schedules(course_id);
CREATE INDEX idx_schedules_room ON course_schedules(room_id);
CREATE INDEX idx_schedules_day ON course_schedules(day_of_week);
CREATE INDEX idx_schedules_time ON course_schedules(start_time, end_time);
CREATE INDEX idx_schedules_day_time ON course_schedules(day_of_week, start_time);

-- Student Enrollments
CREATE INDEX idx_enrollments_student ON student_enrollments(student_id);
CREATE INDEX idx_enrollments_course ON student_enrollments(course_id);
CREATE INDEX idx_enrollments_status ON student_enrollments(status);

-- Course Suggestions
CREATE INDEX idx_suggestions_professor ON course_suggestions(professor_id);
CREATE INDEX idx_suggestions_status ON course_suggestions(status);
CREATE INDEX idx_suggestions_reviewed ON course_suggestions(reviewed_by);

-- Conflicts
CREATE INDEX idx_conflicts_schedule1 ON conflicts(course_schedule_id_1);
CREATE INDEX idx_conflicts_schedule2 ON conflicts(course_schedule_id_2);
CREATE INDEX idx_conflicts_status ON conflicts(status);
CREATE INDEX idx_conflicts_type ON conflicts(conflict_type);

-- Audit Logs
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ============================================
-- FONCTIONS & TRIGGERS
-- ============================================

-- Fonction: Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Appliquer update_updated_at sur toutes les tables pertinentes
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON course_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON student_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON course_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conflicts_updated_at BEFORE UPDATE ON conflicts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction: Mettre à jour le nombre d'étudiants inscrits
CREATE OR REPLACE FUNCTION update_enrolled_students_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'enrolled' THEN
        UPDATE courses 
        SET enrolled_students = enrolled_students + 1 
        WHERE id = NEW.course_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'enrolled' THEN
        UPDATE courses 
        SET enrolled_students = enrolled_students - 1 
        WHERE id = OLD.course_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'enrolled' AND NEW.status != 'enrolled' THEN
            UPDATE courses 
            SET enrolled_students = enrolled_students - 1 
            WHERE id = OLD.course_id;
        ELSIF OLD.status != 'enrolled' AND NEW.status = 'enrolled' THEN
            UPDATE courses 
            SET enrolled_students = enrolled_students + 1 
            WHERE id = NEW.course_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_enrollment_count
AFTER INSERT OR UPDATE OR DELETE ON student_enrollments
FOR EACH ROW EXECUTE FUNCTION update_enrolled_students_count();

-- Fonction: Détection automatique de conflits
CREATE OR REPLACE FUNCTION detect_schedule_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    conflict_count INTEGER;
    conflict_schedule RECORD;
BEGIN
    -- Vérifier les conflits de salle
    FOR conflict_schedule IN
        SELECT cs.* FROM course_schedules cs
        WHERE cs.id != NEW.id
        AND cs.room_id = NEW.room_id
        AND cs.day_of_week = NEW.day_of_week
        AND (
            (NEW.start_time BETWEEN cs.start_time AND cs.end_time) OR
            (NEW.end_time BETWEEN cs.start_time AND cs.end_time) OR
            (cs.start_time BETWEEN NEW.start_time AND NEW.end_time)
        )
    LOOP
        INSERT INTO conflicts (conflict_type, course_schedule_id_1, course_schedule_id_2, description, severity)
        VALUES (
            'room',
            NEW.id,
            conflict_schedule.id,
            'Conflit de salle détecté',
            'high'
        )
        ON CONFLICT DO NOTHING;
        
        -- Marquer les cours en conflit
        UPDATE courses SET status = 'conflict' WHERE id = NEW.course_id;
        UPDATE courses SET status = 'conflict' WHERE id = conflict_schedule.course_id;
    END LOOP;
    
    -- Vérifier les conflits de professeur
    FOR conflict_schedule IN
        SELECT cs.* FROM course_schedules cs
        JOIN courses c1 ON cs.course_id = c1.id
        JOIN courses c2 ON NEW.course_id = c2.id
        WHERE cs.id != NEW.id
        AND c1.professor_id = c2.professor_id
        AND c1.professor_id IS NOT NULL
        AND cs.day_of_week = NEW.day_of_week
        AND (
            (NEW.start_time BETWEEN cs.start_time AND cs.end_time) OR
            (NEW.end_time BETWEEN cs.start_time AND cs.end_time) OR
            (cs.start_time BETWEEN NEW.start_time AND NEW.end_time)
        )
    LOOP
        INSERT INTO conflicts (conflict_type, course_schedule_id_1, course_schedule_id_2, description, severity)
        VALUES (
            'professor',
            NEW.id,
            conflict_schedule.id,
            'Conflit de professeur détecté',
            'high'
        )
        ON CONFLICT DO NOTHING;
        
        -- Marquer les cours en conflit
        UPDATE courses SET status = 'conflict' WHERE id = NEW.course_id;
        UPDATE courses SET status = 'conflict' WHERE id = conflict_schedule.course_id;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER detect_conflicts_trigger
AFTER INSERT OR UPDATE ON course_schedules
FOR EACH ROW EXECUTE FUNCTION detect_schedule_conflicts();

-- Fonction: Créer une notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id INTEGER,
    p_title VARCHAR(255),
    p_message TEXT,
    p_type VARCHAR(50),
    p_related_entity VARCHAR(100) DEFAULT NULL,
    p_related_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    notification_id INTEGER;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, related_entity, related_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_related_entity, p_related_id)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VUES pour requêtes fréquentes
-- ============================================

-- Vue: Emploi du temps complet avec détails
CREATE OR REPLACE VIEW v_complete_schedule AS
SELECT 
    cs.id AS schedule_id,
    c.id AS course_id,
    c.course_code,
    c.course_name,
    c.credits,
    cs.day_of_week,
    cs.start_time,
    cs.end_time,
    cs.duration_hours,
    cs.frequency,
    r.room_number,
    r.building,
    r.capacity AS room_capacity,
    u.first_name || ' ' || u.last_name AS professor_name,
    u.email AS professor_email,
    c.enrolled_students,
    c.max_students,
    c.status AS course_status,
    c.semester,
    c.year
FROM course_schedules cs
JOIN courses c ON cs.course_id = c.id
LEFT JOIN rooms r ON cs.room_id = r.id
LEFT JOIN users u ON c.professor_id = u.id
ORDER BY cs.day_of_week, cs.start_time;

-- Vue: Suggestions en attente pour le dashboard
CREATE OR REPLACE VIEW v_pending_suggestions AS
SELECT 
    cs.id,
    cs.uuid,
    cs.course_name,
    cs.course_code,
    cs.preferred_day AS day,
    cs.preferred_time AS time,
    cs.duration_hours AS duration,
    cs.frequency,
    cs.room_type,
    cs.required_capacity AS capacity,
    cs.justification,
    cs.status,
    u.first_name || ' ' || u.last_name AS professor,
    cs.created_at AS date
FROM course_suggestions cs
JOIN users u ON cs.professor_id = u.id
WHERE cs.status = 'pending'
ORDER BY cs.created_at DESC;

-- Vue: Statistiques pour le dashboard
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM courses WHERE status = 'active') AS total_courses,
    (SELECT COUNT(*) FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'professor')) AS total_professors,
    (SELECT COUNT(*) FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'student')) AS total_students,
    (SELECT COUNT(*) FROM course_suggestions WHERE status = 'pending') AS pending_suggestions,
    (SELECT COUNT(*) FROM conflicts WHERE status = 'unresolved') AS unresolved_conflicts,
    (SELECT COUNT(*) FROM rooms WHERE is_available = true) AS available_rooms;

-- Vue: Conflits actifs avec détails
CREATE OR REPLACE VIEW v_active_conflicts AS
SELECT 
    conf.id,
    conf.conflict_type,
    conf.severity,
    conf.status,
    c1.course_name AS course1_name,
    c1.course_code AS course1_code,
    c2.course_name AS course2_name,
    c2.course_code AS course2_code,
    cs1.day_of_week,
    cs1.start_time,
    cs1.end_time,
    r.room_number,
    conf.description,
    conf.created_at
FROM conflicts conf
JOIN course_schedules cs1 ON conf.course_schedule_id_1 = cs1.id
JOIN course_schedules cs2 ON conf.course_schedule_id_2 = cs2.id
JOIN courses c1 ON cs1.course_id = c1.id
JOIN courses c2 ON cs2.course_id = c2.id
LEFT JOIN rooms r ON cs1.room_id = r.id
WHERE conf.status = 'unresolved'
ORDER BY conf.severity DESC, conf.created_at DESC;

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Insertion des rôles
INSERT INTO roles (name, description) VALUES
    ('admin', 'Administrateur système avec tous les droits'),
    ('professor', 'Professeur pouvant gérer ses cours et faire des suggestions'),
    ('student', 'Étudiant pouvant consulter son emploi du temps');

-- Insertion des équipements
INSERT INTO equipment (name, description) VALUES
    ('Projecteur', 'Projecteur vidéo HD'),
    ('Ordinateurs', 'Ordinateurs pour étudiants'),
    ('Tableau blanc', 'Tableau blanc interactif'),
    ('Microphone', 'Système de sonorisation'),
    ('Caméra', 'Caméra pour enregistrement'),
    ('WiFi', 'Connexion WiFi haut débit');

-- ============================================
-- COMMENTAIRES sur les tables
-- ============================================

COMMENT ON TABLE users IS 'Table des utilisateurs (admin, professeurs, étudiants)';
COMMENT ON TABLE courses IS 'Table des cours disponibles';
COMMENT ON TABLE course_schedules IS 'Planning et horaires des cours';
COMMENT ON TABLE course_suggestions IS 'Suggestions de nouveaux cours par les professeurs';
COMMENT ON TABLE conflicts IS 'Détection et gestion des conflits de planning';
COMMENT ON TABLE audit_logs IS 'Journal d''audit pour la traçabilité';
COMMENT ON TABLE rooms IS 'Salles de cours disponibles';
COMMENT ON TABLE student_enrollments IS 'Inscriptions des étudiants aux cours';

-- ============================================
-- FIN DU SCHÉMA
-- ============================================

