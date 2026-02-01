-- ============================================
-- ADDITIONAL TABLES FOR ADMIN DASHBOARD
-- ============================================

-- ============================================
-- REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS requests (
    -- Core Identity
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Client Information
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_language TEXT DEFAULT 'English',
    client_phone TEXT,
    client_email TEXT,
    
    -- Request Details
    category TEXT NOT NULL, -- 'RIDE', 'SHOPPING', 'HOME_HELP', 'SOCIAL', 'TECHNOLOGY', 'GROUP_EVENT'
    subcategory TEXT,
    description TEXT,
    
    -- Scheduling
    date DATE NOT NULL,
    time_window TEXT,
    appointment_time TEXT,
    pickup_time TEXT,
    return_time TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern TEXT, -- 'WEEKLY', 'BIWEEKLY', 'MONTHLY'
    is_flexible BOOLEAN DEFAULT FALSE,
    flex_start_date DATE,
    flex_end_date DATE,
    flex_times TEXT,
    
    -- Location
    location TEXT,
    pickup_address TEXT,
    destination_address TEXT,
    geozone TEXT, -- 'North Plains - Central', 'Glencoe High School Area', 'Pumpkin Ridge Area'
    
    -- Volunteer Assignment
    volunteer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    volunteer_name TEXT,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED'
    
    -- Completion & Feedback
    completed_date TIMESTAMPTZ,
    hours_logged NUMERIC DEFAULT 0,
    client_rating INTEGER, -- 1-5
    volunteer_rating INTEGER, -- 1-5
    client_survey_completed BOOLEAN DEFAULT FALSE,
    volunteer_survey_completed BOOLEAN DEFAULT FALSE,
    client_feedback TEXT,
    volunteer_feedback TEXT,
    
    -- Safety & Admin
    safety_alert BOOLEAN DEFAULT FALSE,
    alert_resolved BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    matched_date TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for requests
CREATE INDEX IF NOT EXISTS requests_client_id_idx ON requests(client_id);
CREATE INDEX IF NOT EXISTS requests_volunteer_id_idx ON requests(volunteer_id);
CREATE INDEX IF NOT EXISTS requests_status_idx ON requests(status);
CREATE INDEX IF NOT EXISTS requests_category_idx ON requests(category);
CREATE INDEX IF NOT EXISTS requests_date_idx ON requests(date);
CREATE INDEX IF NOT EXISTS requests_created_at_idx ON requests(created_at);

-- RLS for requests
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own requests" ON requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON requests;
DROP POLICY IF EXISTS "Users can update own requests" ON requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON requests;
DROP POLICY IF EXISTS "Admins can manage all requests" ON requests;

-- Clients can view their own requests
CREATE POLICY "Users can view own requests"
    ON requests FOR SELECT
    USING (
        auth.uid() = client_id OR 
        auth.uid() = volunteer_id
    );

-- Clients can create requests
CREATE POLICY "Users can insert own requests"
    ON requests FOR INSERT
    WITH CHECK (auth.uid() = client_id);

-- Users can update their own requests
CREATE POLICY "Users can update own requests"
    ON requests FOR UPDATE
    USING (
        auth.uid() = client_id OR 
        auth.uid() = volunteer_id
    );

-- Admins can view all (simplified - no recursion)
CREATE POLICY "Admins can view all requests"
    ON requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'COORDINATOR')
        )
    );

-- Admins can manage all
CREATE POLICY "Admins can manage all requests"
    ON requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'COORDINATOR')
        )
    );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_requests_updated_at ON requests;
CREATE TRIGGER update_requests_updated_at
    BEFORE UPDATE ON requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAFETY REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS safety_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reporter Information
    reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reporter_name TEXT,
    reporter_role TEXT,
    
    -- Related Request
    related_request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
    
    -- Report Details
    report_type TEXT NOT NULL, -- 'INCIDENT', 'CONCERN', 'FEEDBACK', 'COMPLAINT'
    severity TEXT DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- People Involved
    involved_client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    involved_volunteer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Status & Resolution
    status TEXT DEFAULT 'OPEN', -- 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'
    priority TEXT DEFAULT 'NORMAL', -- 'LOW', 'NORMAL', 'HIGH', 'URGENT'
    
    -- Admin Actions
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    admin_notes TEXT,
    resolution_notes TEXT,
    action_taken TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Metadata
    attachments TEXT[], -- URLs to uploaded files
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for safety_reports
CREATE INDEX IF NOT EXISTS safety_reports_reporter_id_idx ON safety_reports(reporter_id);
CREATE INDEX IF NOT EXISTS safety_reports_status_idx ON safety_reports(status);
CREATE INDEX IF NOT EXISTS safety_reports_severity_idx ON safety_reports(severity);
CREATE INDEX IF NOT EXISTS safety_reports_created_at_idx ON safety_reports(created_at);

-- RLS for safety_reports
ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own safety reports" ON safety_reports;
DROP POLICY IF EXISTS "Users can create safety reports" ON safety_reports;
DROP POLICY IF EXISTS "Admins can view all safety reports" ON safety_reports;
DROP POLICY IF EXISTS "Admins can manage safety reports" ON safety_reports;

CREATE POLICY "Users can view own safety reports"
    ON safety_reports FOR SELECT
    USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create safety reports"
    ON safety_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all safety reports"
    ON safety_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'COORDINATOR')
        )
    );

CREATE POLICY "Admins can manage safety reports"
    ON safety_reports FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'COORDINATOR')
        )
    );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_safety_reports_updated_at ON safety_reports;
CREATE TRIGGER update_safety_reports_updated_at
    BEFORE UPDATE ON safety_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMUNICATION LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipient Information
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_name TEXT,
    recipient_email TEXT,
    recipient_phone TEXT,
    recipient_role TEXT,
    
    -- Communication Details
    type TEXT NOT NULL, -- 'EMAIL', 'SMS', 'CALENDAR', 'PUSH'
    channel TEXT, -- 'SYSTEM', 'MANUAL', 'AUTOMATED'
    purpose TEXT, -- 'MATCH_NOTIFICATION', 'REMINDER', 'SURVEY', 'BADGE', 'ANNOUNCEMENT'
    
    -- Content
    subject TEXT,
    body TEXT,
    template_id TEXT,
    
    -- Related Entities
    related_request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
    related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Delivery Status
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'DELIVERED', 'OPENED', 'FAILED', 'BOUNCED'
    delivery_provider TEXT, -- 'SENDGRID', 'TWILIO', 'SUPABASE', 'INTERNAL'
    
    -- Engagement Tracking
    opened BOOLEAN DEFAULT FALSE,
    clicked BOOLEAN DEFAULT FALSE,
    replied BOOLEAN DEFAULT FALSE,
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for communication_logs
CREATE INDEX IF NOT EXISTS communication_logs_recipient_id_idx ON communication_logs(recipient_id);
CREATE INDEX IF NOT EXISTS communication_logs_type_idx ON communication_logs(type);
CREATE INDEX IF NOT EXISTS communication_logs_status_idx ON communication_logs(status);
CREATE INDEX IF NOT EXISTS communication_logs_created_at_idx ON communication_logs(created_at);
CREATE INDEX IF NOT EXISTS communication_logs_purpose_idx ON communication_logs(purpose);

-- RLS for communication_logs
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own communications" ON communication_logs;
DROP POLICY IF EXISTS "Admins can view all communications" ON communication_logs;
DROP POLICY IF EXISTS "Admins can manage communications" ON communication_logs;

CREATE POLICY "Users can view own communications"
    ON communication_logs FOR SELECT
    USING (auth.uid() = recipient_id);

CREATE POLICY "Admins can view all communications"
    ON communication_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'COORDINATOR')
        )
    );

CREATE POLICY "Admins can manage communications"
    ON communication_logs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'COORDINATOR')
        )
    );

-- ============================================
-- TRAINING PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS training_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Video Completion
    platform_tutorial_watched BOOLEAN DEFAULT FALSE,
    platform_tutorial_date TIMESTAMPTZ,
    platform_tutorial_duration INTEGER, -- seconds watched
    
    safety_training_watched BOOLEAN DEFAULT FALSE,
    safety_training_date TIMESTAMPTZ,
    safety_training_duration INTEGER,
    
    -- Quiz/Assessment (future)
    platform_quiz_score INTEGER,
    platform_quiz_passed BOOLEAN DEFAULT FALSE,
    safety_quiz_score INTEGER,
    safety_quiz_passed BOOLEAN DEFAULT FALSE,
    
    -- Overall Progress
    training_complete BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for training_progress
CREATE INDEX IF NOT EXISTS training_progress_user_id_idx ON training_progress(user_id);
CREATE INDEX IF NOT EXISTS training_progress_complete_idx ON training_progress(training_complete);

-- RLS for training_progress
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own training progress" ON training_progress;
DROP POLICY IF EXISTS "Users can update own training progress" ON training_progress;
DROP POLICY IF EXISTS "Admins can view all training progress" ON training_progress;

CREATE POLICY "Users can view own training progress"
    ON training_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own training progress"
    ON training_progress FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all training progress"
    ON training_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'COORDINATOR')
        )
    );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_training_progress_updated_at ON training_progress;
CREATE TRIGGER update_training_progress_updated_at
    BEFORE UPDATE ON training_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VOLUNTEER HOURS LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS volunteer_hours_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Volunteer Information
    volunteer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    volunteer_name TEXT,
    
    -- Request Information
    request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
    request_category TEXT,
    
    -- Hours Details
    hours NUMERIC NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for volunteer_hours_log
CREATE INDEX IF NOT EXISTS volunteer_hours_log_volunteer_id_idx ON volunteer_hours_log(volunteer_id);
CREATE INDEX IF NOT EXISTS volunteer_hours_log_request_id_idx ON volunteer_hours_log(request_id);
CREATE INDEX IF NOT EXISTS volunteer_hours_log_date_idx ON volunteer_hours_log(date);

-- RLS for volunteer_hours_log
ALTER TABLE volunteer_hours_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Volunteers can view own hours" ON volunteer_hours_log;
DROP POLICY IF EXISTS "Admins can view all hours" ON volunteer_hours_log;
DROP POLICY IF EXISTS "Admins can manage hours" ON volunteer_hours_log;

CREATE POLICY "Volunteers can view own hours"
    ON volunteer_hours_log FOR SELECT
    USING (auth.uid() = volunteer_id);

CREATE POLICY "Admins can view all hours"
    ON volunteer_hours_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'COORDINATOR')
        )
    );

CREATE POLICY "Admins can manage hours"
    ON volunteer_hours_log FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'COORDINATOR')
        )
    );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_volunteer_hours_log_updated_at ON volunteer_hours_log;
CREATE TRIGGER update_volunteer_hours_log_updated_at
    BEFORE UPDATE ON volunteer_hours_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE requests IS 'Service requests from clients to volunteers';
COMMENT ON TABLE safety_reports IS 'Safety incidents, concerns, and feedback reports';
COMMENT ON TABLE communication_logs IS 'Log of all communications sent (email, SMS, calendar)';
COMMENT ON TABLE training_progress IS 'Training video completion and quiz scores for volunteers';
COMMENT ON TABLE volunteer_hours_log IS 'Detailed log of volunteer hours for verification and reporting';
