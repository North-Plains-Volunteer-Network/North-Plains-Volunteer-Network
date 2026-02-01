-- Create a secure function to look up email by phone number
-- SECURITY DEFINER allows this function to bypass RLS, running as the creator (admin)
CREATE OR REPLACE FUNCTION get_email_by_phone(phone_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Normalize phone input if needed, or query directly
    -- Adjust query based on how exactly phone numbers are stored (e.g., with/without dashes)
    SELECT email INTO user_email
    FROM profiles
    WHERE phone = phone_input
    LIMIT 1;
    
    RETURN user_email;
END;
$$;

-- Grant execute permission to everyone (since unauthenticated users need to call it)
GRANT EXECUTE ON FUNCTION get_email_by_phone(TEXT) TO anon, authenticated, service_role;
