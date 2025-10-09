-- Database: university_management

-- DROP DATABASE IF EXISTS university_management;

CREATE DATABASE university_management
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'French_France.1252'
    LC_CTYPE = 'French_France.1252'
    LOCALE_PROVIDER = 'libc'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;


	--Tables principales

	--Utilisateurs(Users)

	CREATE TABLE Users(
		id SERIAL PRIMARY KEY,
		first_name VARCHAR(50) NOT NULL,
		last_name VARCHAR(50) NOT NULL,
		email VARCHAR(100) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		role VARCHAR(20) NOT NULL CHECK (role IN('admin', 'professor', 'student')),
		student_id VARCHAR(20) UNIQUE,
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

	);
	SELECT * FROM Users

	-- Professeurs(Professors)
	CREATE TABLE Professors(
	id SERIAL PRIMARY KEY,
	User_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
	departement VARCHAR(100),
	specialization VARCHAR(100),
	office_location VARCHAR(50),
	phone VARCHAR(20),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

	);
	SELECT * FROM Professors

	--Etudiants(Students)
	CREATE TABLE Students(
	id SERIAL PRIMARY KEY,
	User_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
	Student_number VARCHAR(20) UNIQUE NOT NULL,
	year_of_study INTEGER,
	major VARCHAR(100),
	creatde_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

	);
	SELECT * FROM Students

	--Salles(Rooms)
	CREATE TABLE Rooms(
	id SERIAL PRIMARY KEY,
	Room_number VARCHAR(20) UNIQUE NOT NULL,
	building VARCHAR(50),
	capacity INTEGER NOT NULL,
	Room_type VARCHAR(50) NOT NULL,
	equipment TEXT[],
	is_available BOOLEAN DEFAULT TRUE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

	);
	SELECT * FROM Rooms

	--Cours(Courses)
	CREATE TABLE Courses(
	id SERIAL PRIMARY KEY,
	Course_code VARCHAR(20) UNIQUE NOT NULL,
	Course_name VARCHAR(100) NOT NULL,
	description TEXT[],
	Professor_id INTEGER REFERENCES Professors(id),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

	);
	SELECT * FROM Courses

	--Planning des cours(Schedules)
	CREATE TABLE Schedules(
	id SERIAL PRIMARY KEY,
	Course_id INTEGER REFERENCES Courses(id) ON DELETE CASCADE,
	Room_id INTEGER REFERENCES Rooms(id),
	day_of_week VARCHAR(10) NOT NULL,
	start_time TIME NOT NULL,
	end_time TIME NOT NULL,
	semester VARCHAR(20),
	academic_year VARCHAR(10),
	is_active BOOLEAN DEFAULT TRUE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

	);
	SELECT * FROM Schedules

	--Insccriptions(Enrollments)
	CREATE TABLE Enrollments(
	id SERIAL PRIMARY KEY,
	Student_id INTEGER REFERENCES Students(id) ON DELETE CASCADE,
	Course_id INTEGER REFERENCES Courses(id) ON DELETE CASCADE,
	Enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	grade DECIMAL(3,2),
	status VARCHAR(20) DEFAULT 'Enrolled',
	UNIQUE(Student_id,Course_id)

	);
	SELECT * FROM Enrollments