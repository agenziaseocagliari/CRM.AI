-- =====================================================
-- Super Admin 2FA (Two-Factor Authentication)
-- Phase 1: Foundation + Quick Win Enterprise (DO-2)
-- =====================================================

-- =====================================================
-- 1. User 2FA Settings Table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_2fa_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    method TEXT NOT NULL DEFAULT 'totp', -- 'totp', 'email', 'sms'
    secret TEXT, -- TOTP secret (encrypted)
    backup_codes TEXT[], -- Array of backup codes (hashed)
    phone_number TEXT, -- For SMS 2FA
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =====================================================
-- 2. 2FA Verification Attempts Table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_2fa_attempts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    attempt_type TEXT NOT NULL, -- 'login', 'verify', 'backup_code'
    success BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_2fa_attempts_user ON user_2fa_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_2fa_attempts_failed ON user_2fa_attempts(user_id, success, created_at DESC) WHERE success = false;

-- =====================================================
-- 3. Login Attempts Tracking Table
-- =====================================================
CREATE TABLE IF NOT EXISTS login_attempts (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    ip_address TEXT,
    user_agent TEXT,
    country_code TEXT,
    city TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user ON login_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_failed ON login_attempts(email, success, created_at DESC) WHERE success = false;

-- =====================================================
-- 4. Security Alerts Table
-- =====================================================
CREATE TABLE IF NOT EXISTS security_alerts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL, -- 'suspicious_login', 'too_many_failed_attempts', '2fa_disabled', 'new_device', 'unusual_location'
    severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    is_acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_user ON security_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_unacked ON security_alerts(is_acknowledged, severity, created_at DESC) WHERE is_acknowledged = false;

-- =====================================================
-- 5. Trusted Devices Table
-- =====================================================
CREATE TABLE IF NOT EXISTS trusted_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    device_name TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT,
    os TEXT,
    ip_address TEXT,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trusted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Device trust can expire
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices(user_id, is_active, last_used_at DESC);

-- =====================================================
-- 6. Enable Row Level Security
-- =====================================================
ALTER TABLE user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. RLS Policies
-- =====================================================

-- user_2fa_settings: Users can manage their own, super admins can view all
CREATE POLICY "Users can manage their own 2FA settings" ON user_2fa_settings
    FOR ALL
    TO public
    USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all 2FA settings" ON user_2fa_settings
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- user_2fa_attempts: Users can view their own, super admins can view all
CREATE POLICY "Users can view their own 2FA attempts" ON user_2fa_attempts
    FOR SELECT
    TO public
    USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all 2FA attempts" ON user_2fa_attempts
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- login_attempts: Super admins only (security data)
CREATE POLICY "Super admins can view all login attempts" ON login_attempts
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- security_alerts: Users see their own, super admins see all
CREATE POLICY "Users can view their own security alerts" ON security_alerts
    FOR SELECT
    TO public
    USING (user_id = auth.uid());

CREATE POLICY "Users can acknowledge their own alerts" ON security_alerts
    FOR UPDATE
    TO public
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can manage all security alerts" ON security_alerts
    FOR ALL
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- trusted_devices: Users can manage their own
CREATE POLICY "Users can manage their own trusted devices" ON trusted_devices
    FOR ALL
    TO public
    USING (user_id = auth.uid());

-- =====================================================
-- 8. Helper Functions
-- =====================================================

-- Function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
    p_email TEXT,
    p_user_id UUID,
    p_success BOOLEAN,
    p_failure_reason TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO login_attempts (
        email,
        user_id,
        success,
        failure_reason,
        ip_address,
        user_agent
    ) VALUES (
        p_email,
        p_user_id,
        p_success,
        p_failure_reason,
        p_ip_address,
        p_user_agent
    );
    
    -- Check for suspicious activity
    IF NOT p_success THEN
        DECLARE
            v_recent_failures INTEGER;
        BEGIN
            -- Count failures in last 15 minutes
            SELECT COUNT(*)
            INTO v_recent_failures
            FROM login_attempts
            WHERE email = p_email
            AND success = false
            AND created_at > NOW() - INTERVAL '15 minutes';
            
            -- Create alert if too many failures
            IF v_recent_failures >= 5 AND p_user_id IS NOT NULL THEN
                INSERT INTO security_alerts (
                    user_id,
                    alert_type,
                    severity,
                    title,
                    message,
                    metadata
                ) VALUES (
                    p_user_id,
                    'too_many_failed_attempts',
                    'high',
                    'Multiple Failed Login Attempts',
                    'There have been ' || v_recent_failures || ' failed login attempts in the last 15 minutes.',
                    jsonb_build_object(
                        'failure_count', v_recent_failures,
                        'ip_address', p_ip_address
                    )
                );
            END IF;
        END;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user requires 2FA
CREATE OR REPLACE FUNCTION requires_2fa(p_user_id UUID) RETURNS BOOLEAN AS $$
DECLARE
    v_is_enabled BOOLEAN;
    v_user_role TEXT;
BEGIN
    -- Check if user has 2FA enabled
    SELECT is_enabled INTO v_is_enabled
    FROM user_2fa_settings
    WHERE user_id = p_user_id;
    
    IF FOUND AND v_is_enabled THEN
        RETURN true;
    END IF;
    
    -- Check if user is super_admin (should have 2FA enforced)
    SELECT role INTO v_user_role
    FROM profiles
    WHERE id = p_user_id;
    
    -- Super admins should have 2FA (this can be enforced by policy)
    RETURN (v_user_role = 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes(p_user_id UUID) RETURNS TEXT[] AS $$
DECLARE
    v_codes TEXT[];
    v_code TEXT;
    i INTEGER;
BEGIN
    -- Generate 10 random backup codes
    FOR i IN 1..10 LOOP
        -- Generate 8-character alphanumeric code
        v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
        v_codes := array_append(v_codes, v_code);
    END LOOP;
    
    RETURN v_codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check failed login attempts
CREATE OR REPLACE FUNCTION get_failed_login_count(
    p_email TEXT,
    p_minutes INTEGER DEFAULT 15
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM login_attempts
    WHERE email = p_email
    AND success = false
    AND created_at > NOW() - (p_minutes || ' minutes')::INTERVAL;
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create security alert
CREATE OR REPLACE FUNCTION create_security_alert(
    p_user_id UUID,
    p_alert_type TEXT,
    p_severity TEXT,
    p_title TEXT,
    p_message TEXT,
    p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO security_alerts (
        user_id,
        alert_type,
        severity,
        title,
        message,
        metadata
    ) VALUES (
        p_user_id,
        p_alert_type,
        p_severity,
        p_title,
        p_message,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. Grant permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION record_login_attempt(TEXT, UUID, BOOLEAN, TEXT, TEXT, TEXT) TO public;
GRANT EXECUTE ON FUNCTION requires_2fa(UUID) TO public;
GRANT EXECUTE ON FUNCTION generate_backup_codes(UUID) TO public;
GRANT EXECUTE ON FUNCTION get_failed_login_count(TEXT, INTEGER) TO public;
GRANT EXECUTE ON FUNCTION create_security_alert(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO public;

-- =====================================================
-- 10. Comments for documentation
-- =====================================================
COMMENT ON TABLE user_2fa_settings IS 'User two-factor authentication settings';
COMMENT ON TABLE user_2fa_attempts IS 'Log of 2FA verification attempts';
COMMENT ON TABLE login_attempts IS 'Log of all login attempts (successful and failed)';
COMMENT ON TABLE security_alerts IS 'Security alerts for suspicious activities';
COMMENT ON TABLE trusted_devices IS 'User trusted devices that bypass 2FA';
COMMENT ON FUNCTION record_login_attempt IS 'Record a login attempt and create alerts for suspicious activity';
COMMENT ON FUNCTION requires_2fa IS 'Check if user is required to use 2FA';
COMMENT ON FUNCTION get_failed_login_count IS 'Get count of failed login attempts in time window';
