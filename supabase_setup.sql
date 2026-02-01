-- COMPLETE PROFILES TABLE SCHEMA FOR NPVN
-- This includes EVERY field from the Unified Intake Form
-- Run this in Supabase SQL Editor

-- Drop existing table if you want to recreate (CAUTION: This deletes all data!)
-- DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE IF NOT EXISTS profiles (
    -- ============================================
    -- CORE IDENTITY & ACCOUNT
    -- ============================================
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'CLIENT', 'VOLUNTEER', 'CLIENT_VOLUNTEER', 'ADMIN', 'COORDINATOR'
    
    -- Onboarding & Account Status
    onboarding_step INTEGER DEFAULT 1,
    email_verified BOOLEAN DEFAULT FALSE,
    intake_date DATE,
    just_finished_onboarding BOOLEAN DEFAULT FALSE,
    
    -- ============================================
    -- STEP 1: PERSONAL PROFILE & CONTACT BASICS
    -- ============================================
    preferred_name TEXT,
    dob DATE,
    gender TEXT,
    address TEXT DEFAULT 'North Plains, OR 97133',
    avatar_url TEXT,
    
    -- ============================================
    -- STEP 2: DEMOGRAPHICS (HUD COMPLIANCE)
    -- ============================================
    ethnicity TEXT, -- 'Hispanic/Latino', 'Not Hispanic/Latino'
    race TEXT, -- 'American Indian or Alaska Native', 'Asian', 'Black or African American', etc.
    veteran_status BOOLEAN,
    marital_status TEXT, -- 'Single', 'Married', 'Widowed', 'Divorced'
    preferred_language TEXT, -- 'English', 'Spanish', or custom text
    
    -- ============================================
    -- STEP 3: HOUSEHOLD & INCOME (HUD COMPLIANCE)
    -- ============================================
    household_type TEXT, -- 'Single Adult', 'Couple', 'Family with Children', 'Multi-generational'
    household_size INTEGER,
    has_minors BOOLEAN DEFAULT FALSE,
    has_seniors BOOLEAN DEFAULT FALSE,
    
    -- Income Information
    income_range TEXT, -- '0-30k', '30k-50k', '50k-80k', '80k+'
    income_sources TEXT[], -- Array: ['Wages', 'Social Security', 'SSI', 'SSDI', 'Pension', 'Unemployment', 'None']
    non_cash_benefits TEXT[], -- Array: ['SNAP', 'WIC', 'TANF', 'VA Benefits', 'Housing Voucher']
    
    -- ============================================
    -- STEP 4: DISABILITY & ACCESSIBILITY
    -- ============================================
    disability_status BOOLEAN,
    disability_type TEXT, -- Only if disability_status = true
    affects_independence BOOLEAN, -- Only if disability_status = true
    
    -- Functional Accessibility Needs
    accessibility_hearing TEXT, -- 'Yes', 'No', 'Unknown'
    accessibility_vision TEXT, -- 'Yes', 'No', 'Unknown'
    accessibility_mobility TEXT, -- 'None', 'Walker', 'Wheelchair', 'Stairs difficult'
    accessibility_notes TEXT,
    
    -- ============================================
    -- STEP 5: CONTACT & PERSONAL INFO
    -- ============================================
    phone TEXT,
    preferred_contact_method TEXT, -- 'Call', 'Text', 'Email'
    
    -- Emergency Contact
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    
    -- Personal Information
    pets TEXT, -- Description of pets at home
    hobbies TEXT[], -- Array of hobbies/interests
    languages TEXT[], -- Array: ['English', 'Spanish', 'French', 'Sign Language', 'Other']
    is_driver BOOLEAN DEFAULT FALSE,
    
    -- ============================================
    -- STEP 6: WAIVER & COMPLIANCE
    -- ============================================
    signature TEXT,
    waiver_accepted_date DATE,
    
    -- ============================================
    -- VOLUNTEER-SPECIFIC FIELDS
    -- ============================================
    total_hours NUMERIC DEFAULT 0,
    badges TEXT[], -- Array of badge IDs
    new_badges TEXT[], -- Badges not yet acknowledged
    background_check_status TEXT DEFAULT 'NOT_STARTED', -- 'PENDING', 'APPROVED', 'REJECTED', 'NOT_STARTED'
    training_complete BOOLEAN DEFAULT FALSE,
    
    -- ============================================
    -- ADMIN & SYSTEM FIELDS
    -- ============================================
    admin_notes TEXT,
    last_active_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- ============================================
    -- FLEXIBLE STORAGE (for future expansion)
    -- ============================================
    metadata JSONB DEFAULT '{}'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_onboarding_step_idx ON profiles(onboarding_step);
CREATE INDEX IF NOT EXISTS profiles_background_check_status_idx ON profiles(background_check_status);
CREATE INDEX IF NOT EXISTS profiles_intake_date_idx ON profiles(intake_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if recreating
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Note: Admin policies removed to prevent infinite recursion
-- Admins should use service role key or manage via Supabase dashboard

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- Drop existing views first to avoid column name conflicts
DROP VIEW IF EXISTS profiles_summary;
DROP VIEW IF EXISTS profiles_hud_data;

-- Summary view for admin reporting
CREATE VIEW profiles_summary AS
SELECT 
    id,
    email,
    full_name,
    preferred_name,
    role,
    onboarding_step,
    intake_date,
    background_check_status,
    training_complete,
    total_hours,
    created_at,
    last_active_date
FROM profiles;

-- HUD reporting view - ALL intake form fields
CREATE VIEW profiles_hud_data AS
SELECT 
    -- Core Identity
    id,
    full_name,
    preferred_name,
    email,
    phone,
    address,
    dob,
    gender,
    intake_date,
    
    -- Demographics (HUD Required)
    ethnicity,
    race,
    veteran_status,
    marital_status,
    preferred_language,
    
    -- Household & Income (HUD Required)
    household_type,
    household_size,
    has_minors,
    has_seniors,
    income_range,
    income_sources,
    non_cash_benefits,
    
    -- Disability & Accessibility (HUD Required)
    disability_status,
    disability_type,
    affects_independence,
    accessibility_hearing,
    accessibility_vision,
    accessibility_mobility,
    accessibility_notes,
    
    -- Contact & Personal
    preferred_contact_method,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_relation,
    pets,
    hobbies,
    languages,
    is_driver,
    
    -- Compliance
    signature,
    waiver_accepted_date,
    
    -- System
    created_at,
    updated_at
FROM profiles
WHERE role IN ('CLIENT', 'CLIENT_VOLUNTEER');

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE profiles IS 'Complete user profiles - includes ALL fields from unified intake form';
COMMENT ON COLUMN profiles.income_sources IS 'Array of income sources: Wages, Social Security, SSI, SSDI, Pension, Unemployment, None';
COMMENT ON COLUMN profiles.non_cash_benefits IS 'Array of benefits: SNAP, WIC, TANF, VA Benefits, Housing Voucher';
COMMENT ON COLUMN profiles.languages IS 'Array of languages spoken: English, Spanish, French, Sign Language, Other';
COMMENT ON COLUMN profiles.hobbies IS 'Array of hobbies/interests as comma-separated values';
