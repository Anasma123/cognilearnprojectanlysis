-- ==============================================================================
-- COGNILEARN CLEAN SEED DATA
-- Default Admin: username: admin | email: admin@cognilearn.org | password: 123
-- ==============================================================================

-- 1. MASTER COLLEGES
INSERT INTO public.colleges (id, name, code, address, contact_person, contact_phone, contact_email) VALUES
('11111111-1111-1111-1111-111111111111', 'MES College of Engineering & Technology', 'MES-CET', 'Kunnukara, Aluva, Ernakulam, Kerala 683578', 'Dr. K. Abdul Rahman (HOD CSE)', '+91 94471 23456', 'hodcse@mescet.ac.in'),
('22222222-2222-2222-2222-222222222222', 'MES Arts & Science College', 'MES-ASC', 'Perillalam, Malappuram, Kerala 676505', 'Prof. M. K. Faisal', '+91 98460 65432', 'faisal@mesasc.ac.in')
ON CONFLICT (id) DO NOTHING;

-- 2. MASTER COURSES
INSERT INTO public.courses (id, college_id, name, code, department, duration_years) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'B.Tech Computer Science & Engineering', 'BTECH-CSE', 'Computer Science & Engineering', 4),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'B.Tech Information Technology', 'BTECH-IT', 'Information Technology', 4),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Master of Computer Applications', 'MCA', 'Computer Applications', 2)
ON CONFLICT (id) DO NOTHING;

-- 3. ACADEMIC BATCH
INSERT INTO public.academic_batches (id, name, start_year, end_year, is_active) VALUES
('99999999-9999-9999-9999-999999999999', '2024-2025 Final Year Projects', 2024, 2025, true)
ON CONFLICT (id) DO NOTHING;

-- 4. SYSTEM ADMINISTRATOR PROFILE
INSERT INTO public.profiles (id, email, full_name, role, phone, avatar_url, college_id) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@cognilearn.org', 'System Administrator', 'admin', '+91 98470 11223', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- 5. INITIAL AUDIT LOG
INSERT INTO public.activity_logs (user_id, user_name, action, entity_type, description) VALUES
('00000000-0000-0000-0000-000000000001', 'System Administrator', 'SYSTEM_INITIALIZED', 'system', 'Clean database initialized. Ready for student and group enrollment.')
ON CONFLICT (id) DO NOTHING;
