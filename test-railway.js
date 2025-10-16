// Railway Service Test
const testRailway = async () => {
  try {
    console.log('🔍 Testing Railway endpoint...');
    const response = await fetch(
      'https://datapizza-production.railway.app/health',
      {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      }
    );
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
    return { success: true, status: response.status, body: text };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
};

// Execute test
testRailway();
