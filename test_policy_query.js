// Test della nuova query per PolicyDetail
// Da eseguire nella console del browser

const testPolicyDetailQuery = async () => {
  console.log('🧪 Testing new PolicyDetail query...');
  
  try {
    const { data, error } = await supabase
      .from('insurance_policies')
      .select(`
        *,
        contacts!contact_id(id, name, email, phone, company),
        profiles!created_by(id, full_name)
      `)
      .limit(1)
      .single();
      
    console.log('✅ Query result:', { data, error });
    
    if (data) {
      console.log('📋 Policy structure:');
      console.log('- Policy ID:', data.id);
      console.log('- Policy Number:', data.policy_number);
      console.log('- Contact:', data.contacts);
      console.log('- Creator:', data.profiles);
    }
    
    return { data, error };
  } catch (err) {
    console.error('❌ Test failed:', err);
    return { data: null, error: err };
  }
};

// Esegui il test
testPolicyDetailQuery();