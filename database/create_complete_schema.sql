-- ============================================
-- SCHÉMA COMPLET - GESTION COURS UNIVERSITAIRES
-- Basé sur la structure existante + améliorations
-- ============================================

-- Se connecter à la base university
-- \c university

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- AMÉLIORATION DES TABLES EXISTANTES
-- ============================================

-- Ajouter des colonnes manquantes à Users si elles n'existent pas
DO $$ 
BEGIN
    -- Ajouter UUID si n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='uuid'
    ) THEN
        ALTER TABLE Users ADD COLUMN uuid UUID DEFAULT uuid_generate_v4() UNIQUE;
    END IF;
    
    -- Ajouter last_login si n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='last_login'
    ) THEN
        ALTER TABLE Users ADD COLUMN last_login TIMESTAMP;
    END IF;
END $$;

-- ============================================
-- NOUVELLES TABLES À AJOUTER
-- ============================================

-- Table des suggestions de cours
CREATE TABLE IF NOT EXISTS Course_Suggestions (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    professor_id INTEGER REFERENCES Professors(id) ON DELETE CASCADE,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50),
    description TEXT,
    preferred_day VARCHAR(20),
    preferred_time TIME,
    duration_hours DECIMAL(3,1),
    frequency VARCHAR(50),
    room_type VARCHAR(50),
    required_capacity INTEGER,
    required_equipment TEXT[],
    justification TEXT NOT NULL,
    target_audience TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    reviewed_by INTEGER REFERENCES Users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    approved_course_id INTEGER REFERENCES Courses(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des conflits
CREATE TABLE IF NOT EXISTS Conflicts (
    id SERIAL PRIMARY KEY,
    conflict_type VARCHAR(50) NOT NULL CHECK (conflict_type IN ('room', 'professor', 'time', 'capacity')),
    schedule_id_1 INTEGER REFERENCES Schedules(id) ON DELETE CASCADE,
    schedule_id_2 INTEGER REFERENCES Schedules(id) ON DELETE CASCADE,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'acknowledged', 'resolved', 'ignored')),
    resolved_by INTEGER REFERENCES Users(id),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS Notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('info', 'warning', 'error', 'success', 'suggestion')),
    is_read BOOLEAN DEFAULT false,
    related_entity VARCHAR(100),
    related_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table d'audit
CREATE TABLE IF NOT EXISTS Audit_Logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des équipements (si pas déjà dans Rooms)
CREATE TABLE IF NOT EXISTS Equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEX POUR PERFORMANCE
-- ============================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON Users(role);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON Users(student_id);

-- Courses
CREATE INDEX IF NOT EXISTS idx_courses_code ON Courses(course_code);
CREATE INDEX IF NOT EXISTS idx_courses_professor ON Courses(professor_id);

-- Schedules
CREATE INDEX IF NOT EXISTS idx_schedules_course ON Schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_schedules_room ON Schedules(room_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON Schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedules_time ON Schedules(start_time, end_time);

-- Enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON Enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON Enrollments(course_id);

-- Course_Suggestions
CREATE INDEX IF NOT EXISTS idx_suggestions_professor ON Course_Suggestions(professor_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON Course_Suggestions(status);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON Notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON Notifications(is_read);

-- ============================================
-- TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur Users
DROP TRIGGER IF EXISTS update_users_updated_at ON Users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON Users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Appliquer le trigger sur Course_Suggestions
DROP TRIGGER IF EXISTS update_suggestions_updated_at ON Course_Suggestions;
CREATE TRIGGER update_suggestions_updated_at 
    BEFORE UPDATE ON Course_Suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Appliquer le trigger sur Conflicts
DROP TRIGGER IF EXISTS update_conflicts_updated_at ON Conflicts;
CREATE TRIGGER update_conflicts_updated_at 
    BEFORE UPDATE ON Conflicts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue: Emploi du temps complet
CREATE OR REPLACE VIEW v_complete_schedule AS
SELECT 
    s.id AS schedule_id,
    c.id AS course_id,
    c.course_code,
    c.course_name,
    s.day_of_week,
    s.start_time,
    s.end_time,
    s.semester,
    s.academic_year,
    r.room_number,
    r.building,
    r.capacity,
    u.first_name || ' ' || u.last_name AS professor_name,
    u.email AS professor_email,
    s.is_active
FROM Schedules s
JOIN Courses c ON s.course_id = c.id
LEFT JOIN Rooms r ON s.room_id = r.id
LEFT JOIN Professors p ON c.professor_id = p.id
LEFT JOIN Users u ON p.user_id = u.id
WHERE s.is_active = true
ORDER BY s.day_of_week, s.start_time;

-- Vue: Suggestions en attente
CREATE OR REPLACE VIEW v_pending_suggestions AS
SELECT 
    cs.id,
    cs.uuid,
    cs.course_name,
    cs.course_code,
    cs.preferred_day,
    cs.preferred_time,
    cs.duration_hours,
    cs.justification,
    cs.status,
    u.first_name || ' ' || u.last_name AS professor_name,
    cs.created_at
FROM Course_Suggestions cs
LEFT JOIN Professors p ON cs.professor_id = p.id
LEFT JOIN Users u ON p.user_id = u.id
WHERE cs.status = 'pending'
ORDER BY cs.created_at DESC;

-- Vue: Statistiques du dashboard
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM Courses) AS total_courses,
    (SELECT COUNT(*) FROM Users WHERE role = 'professor') AS total_professors,
    (SELECT COUNT(*) FROM Users WHERE role = 'student') AS total_students,
    (SELECT COUNT(*) FROM Course_Suggestions WHERE status = 'pending') AS pending_suggestions,
    (SELECT COUNT(*) FROM Conflicts WHERE status = 'unresolved') AS unresolved_conflicts,
    (SELECT COUNT(*) FROM Rooms WHERE is_available = true) AS available_rooms;

-- ============================================
-- DONNÉES DE TEST (Si la base est vide)
-- ============================================

-- Insérer des équipements de base
INSERT INTO Equipment (name, description) 
VALUES 
    ('Projecteur', 'Projecteur vidéo HD'),
    ('Ordinateurs', 'Ordinateurs pour étudiants'),
    ('Tableau blanc', 'Tableau blanc interactif'),
    ('Microphone', 'Système de sonorisation'),
    ('WiFi', 'Connexion WiFi haut débit')
ON CONFLICT (name) DO NOTHING;

-- Créer des utilisateurs de test s'ils n'existent pas
INSERT INTO Users (first_name, last_name, email, password_hash, role, is_active)
VALUES
    ('Admin', 'Principal', 'admin@univ.fr', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqRfNmRqWe', 'admin', true),
    ('Jean', 'Martin', 'prof@univ.fr', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqRfNmRqWe', 'professor', true),
    ('Sophie', 'Laurent', 'etudiant@univ.fr', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqRfNmRqWe', 'student', true)
ON CONFLICT (email) DO NOTHING;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Schéma complété avec succès!';
    RAISE NOTICE 'Tables créées: Users, Professors, Students, Rooms, Courses, Schedules, Enrollments, Course_Suggestions, Conflicts, Notifications, Audit_Logs, Equipment';
    RAISE NOTICE 'Vues créées: v_complete_schedule, v_pending_suggestions, v_dashboard_stats';
    RAISE NOTICE 'Triggers créés pour mise à jour automatique';
END $$;

