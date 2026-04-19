-- ============================================
-- LEADERBOARD APP - COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (students & teachers)
-- ============================================
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  roll_number TEXT UNIQUE,         -- for students only
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COURSES TABLE
-- ============================================
CREATE TABLE courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  semester TEXT,
  year INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENROLLMENTS TABLE
-- ============================================
CREATE TABLE enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- ============================================
-- WEIGHTAGE CONFIG TABLE
-- ============================================
CREATE TABLE weightage_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE UNIQUE,
  assignments DECIMAL(5,2) DEFAULT 10,
  quizzes DECIMAL(5,2) DEFAULT 10,
  mid_exam DECIMAL(5,2) DEFAULT 25,
  final_exam DECIMAL(5,2) DEFAULT 40,
  activities DECIMAL(5,2) DEFAULT 5,
  project DECIMAL(5,2) DEFAULT 5,
  viva DECIMAL(5,2) DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ASSESSMENT CATEGORIES
-- ============================================
CREATE TABLE assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('assignment', 'quiz', 'mid_exam', 'final_exam', 'activity', 'project', 'viva')),
  title TEXT NOT NULL,
  max_marks DECIMAL(6,2) NOT NULL,
  due_date DATE,
  description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MARKS TABLE
-- ============================================
CREATE TABLE marks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  obtained_marks DECIMAL(6,2),
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES users(id),
  UNIQUE(student_id, assessment_id)
);

-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ATTENDANCE TABLE
-- ============================================
CREATE TABLE attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id, date)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_marks_student ON marks(student_id);
CREATE INDEX idx_marks_course ON marks(course_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_assessments_course ON assessments(course_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);

-- ============================================
-- LEADERBOARD VIEW
-- ============================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.id AS student_id,
  u.full_name,
  u.roll_number,
  u.avatar_url,
  e.course_id,
  c.name AS course_name,
  c.code AS course_code,
  -- Calculate total weighted marks
  COALESCE(
    (
      -- Assignments
      CASE WHEN wc.assignments > 0 THEN
        (SELECT COALESCE(AVG(m.obtained_marks / a.max_marks * 100), 0)
         FROM marks m JOIN assessments a ON m.assessment_id = a.id
         WHERE m.student_id = u.id AND a.course_id = e.course_id AND a.category = 'assignment') * wc.assignments / 100
      ELSE 0 END
    ) +
    -- Quizzes
    CASE WHEN wc.quizzes > 0 THEN
      (SELECT COALESCE(AVG(m.obtained_marks / a.max_marks * 100), 0)
       FROM marks m JOIN assessments a ON m.assessment_id = a.id
       WHERE m.student_id = u.id AND a.course_id = e.course_id AND a.category = 'quiz') * wc.quizzes / 100
    ELSE 0 END +
    -- Mid Exam
    CASE WHEN wc.mid_exam > 0 THEN
      (SELECT COALESCE(AVG(m.obtained_marks / a.max_marks * 100), 0)
       FROM marks m JOIN assessments a ON m.assessment_id = a.id
       WHERE m.student_id = u.id AND a.course_id = e.course_id AND a.category = 'mid_exam') * wc.mid_exam / 100
    ELSE 0 END +
    -- Final Exam
    CASE WHEN wc.final_exam > 0 THEN
      (SELECT COALESCE(AVG(m.obtained_marks / a.max_marks * 100), 0)
       FROM marks m JOIN assessments a ON m.assessment_id = a.id
       WHERE m.student_id = u.id AND a.course_id = e.course_id AND a.category = 'final_exam') * wc.final_exam / 100
    ELSE 0 END +
    -- Activities
    CASE WHEN wc.activities > 0 THEN
      (SELECT COALESCE(AVG(m.obtained_marks / a.max_marks * 100), 0)
       FROM marks m JOIN assessments a ON m.assessment_id = a.id
       WHERE m.student_id = u.id AND a.course_id = e.course_id AND a.category = 'activity') * wc.activities / 100
    ELSE 0 END +
    -- Project
    CASE WHEN wc.project > 0 THEN
      (SELECT COALESCE(AVG(m.obtained_marks / a.max_marks * 100), 0)
       FROM marks m JOIN assessments a ON m.assessment_id = a.id
       WHERE m.student_id = u.id AND a.course_id = e.course_id AND a.category = 'project') * wc.project / 100
    ELSE 0 END +
    -- Viva
    CASE WHEN wc.viva > 0 THEN
      (SELECT COALESCE(AVG(m.obtained_marks / a.max_marks * 100), 0)
       FROM marks m JOIN assessments a ON m.assessment_id = a.id
       WHERE m.student_id = u.id AND a.course_id = e.course_id AND a.category = 'viva') * wc.viva / 100
    ELSE 0 END,
    0
  ) AS total_score,
  DENSE_RANK() OVER (
    PARTITION BY e.course_id
    ORDER BY COALESCE(
      (SELECT COALESCE(AVG(m.obtained_marks / a.max_marks * 100), 0)
       FROM marks m JOIN assessments a ON m.assessment_id = a.id
       WHERE m.student_id = u.id AND a.course_id = e.course_id) ,
      0
    ) DESC
  ) AS rank
FROM users u
JOIN enrollments e ON u.id = e.student_id
JOIN courses c ON e.course_id = c.id
LEFT JOIN weightage_config wc ON wc.course_id = e.course_id
WHERE u.role = 'student';

-- ============================================
-- SEED DATA (Demo)
-- ============================================
-- Insert demo teacher
INSERT INTO users (email, password_hash, full_name, role) VALUES
('teacher@demo.com', '$2a$10$demo_hash_replace_in_production', 'Prof. Ahmad Ali', 'teacher');

-- Note: Replace password_hash with proper bcrypt hash
-- Default demo password: 'teacher123'
