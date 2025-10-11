// Debug Environment Variables
console.log('🔍 DEBUG ENVIRONMENT VARIABLES');
console.log('=====================================');

console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY present:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('VITE_SUPABASE_ANON_KEY (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20));

// Test Supabase client
import { supabase } from '../lib/supabaseClient';

console.log('Supabase client created:', !!supabase);

// Test basic auth
console.log('Testing auth...');
const testAuth = async () => {
    try {
        const { data, error } = await supabase.auth.getSession();
        console.log('Auth session check:', { hasData: !!data, error: error?.message });
        
        // Test database connection
        const { data: testData, error: dbError } = await supabase
            .from('forms')
            .select('count')
            .limit(1);
            
        console.log('Database connection test:', { 
            hasData: !!testData, 
            error: dbError?.message,
            hint: dbError?.hint 
        });
        
    } catch (err) {
        console.error('Test failed:', err);
    }
};

testAuth();