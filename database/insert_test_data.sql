-- Insert roles
INSERT INTO roles (name, description) VALUES
    ('admin', 'Administrateur systeme'),
    ('professor', 'Professeur'),
    ('student', 'Etudiant')
ON CONFLICT (name) DO NOTHING;

-- Insert users with bcrypt hashed passwords
-- Password for all accounts: "password123"
-- Bcrypt hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqRfNmRqWe

INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_active) VALUES
    ('admin@univ.fr', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqRfNmRqWe', 'Admin', 'Principal', 
     (SELECT id FROM roles WHERE name = 'admin'), true),
    ('prof@univ.fr', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqRfNmRqWe', 'Jean', 'Martin', 
     (SELECT id FROM roles WHERE name = 'professor'), true),
    ('etudiant@univ.fr', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqRfNmRqWe', 'Sophie', 'Laurent', 
     (SELECT id FROM roles WHERE name = 'student'), true)
ON CONFLICT (email) DO NOTHING;

-- Update student_id for student
UPDATE users 
SET student_id = '2024001' 
WHERE email = 'etudiant@univ.fr';


