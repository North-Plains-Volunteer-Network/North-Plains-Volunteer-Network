# Debugging Request Creation

## Issue

Requests submitted by users are not appearing in the Supabase `requests` table.

## Steps to Fix

### 1. Verify the `requests` table exists

1. Go to **Supabase Dashboard** → **Table Editor**
2. Look for a table called `requests`
3. **If it doesn't exist**, you need to create it

### 2. Create the `requests` table

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the entire contents of `supabase_admin_tables.sql`
3. Paste and click **Run**
4. Wait for "Success" message

### 3. Fix RLS Policies

1. Go to **SQL Editor** again
2. Run this SQL:

```sql
-- Fix RLS policy for requests table
DROP POLICY IF EXISTS "Users can insert own requests" ON requests;
DROP POLICY IF EXISTS "Users can view own requests" ON requests;
DROP POLICY IF EXISTS "Users can update own requests" ON requests;

-- Allow authenticated users to insert requests
CREATE POLICY "Users can insert own requests"
    ON requests FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Users can view their requests
CREATE POLICY "Users can view own requests"
    ON requests FOR SELECT
    TO authenticated
    USING (
        client_id = auth.uid() OR 
        volunteer_id = auth.uid()
    );

-- Users can update their requests
CREATE POLICY "Users can update own requests"
    ON requests FOR UPDATE
    TO authenticated
    USING (
        client_id = auth.uid() OR 
        volunteer_id = auth.uid()
    );
```

### 4. Test the Request Creation

1. **Refresh your browser** (Ctrl+Shift+R)
2. **Open Console** (F12)
3. **Submit a new request**
4. **Check the console** for:
   - ✅ "Request created successfully: [uuid]" = Working!
   - ❌ "Error creating request" = Still broken

### 5. Check the Error Details

If you see an error, expand it in the console to see:

- Error message
- Error code
- Details about what went wrong

## Common Errors

### "relation 'requests' does not exist"

**Fix:** Run `supabase_admin_tables.sql` to create the table

### "403 Forbidden" or "new row violates row-level security policy"

**Fix:** Run the RLS policy fix above

### "column 'xyz' does not exist"

**Fix:** The table schema doesn't match - re-run `supabase_admin_tables.sql`

## Verification

After fixing, check:

1. **Supabase** → **Table Editor** → **requests** → Should see your new request
2. **Browser Console** → Should see ✅ success message
3. **Dashboard** → Request should appear in your list
