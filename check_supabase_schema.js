/**
 * Diagnostic Script - Run this in browser console to check Supabase table schema
 * 
 * Instructions:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Press Enter
 * 4. Share the output with me
 */

import { supabase } from './services/supabase';

async function checkProfilesTable() {
    console.log('🔍 Checking profiles table schema...');

    // Try to select with minimal columns
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error querying profiles table:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
        });
    } else {
        console.log('✅ Profiles table exists!');
        console.log('📊 Sample data (if any):', data);

        if (data && data.length > 0) {
            console.log('📋 Available columns:', Object.keys(data[0]));
        } else {
            console.log('ℹ️ Table is empty, trying to get column info...');
        }
    }

    // Try a test insert to see what columns are expected
    console.log('\n🧪 Testing minimal insert...');
    const testProfile = {
        id: '00000000-0000-0000-0000-000000000000', // Fake UUID
        email: 'test@test.com',
        full_name: 'Test User',
        role: 'CLIENT',
        onboarding_step: 1
    };

    const { error: insertError } = await supabase
        .from('profiles')
        .insert([testProfile]);

    if (insertError) {
        console.error('❌ Test insert failed:', insertError);
        console.log('💡 This tells us what columns are required/missing');
    } else {
        console.log('✅ Test insert succeeded (will be rolled back)');
        // Clean up test data
        await supabase.from('profiles').delete().eq('id', '00000000-0000-0000-0000-000000000000');
    }
}

checkProfilesTable();
