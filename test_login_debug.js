// Тест логіну з детальним логуванням
const testLoginDebug = async () => {
  try {
    const loginData = {
      email: 'testuser@example.com',
      password: 'Test123!'
    };
    
    console.log('Sending login request...');
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Login successful:', result);
      console.log('AccessToken:', result.AccessToken);
      console.log('RefreshToken:', result.RefreshToken);
    } else {
      console.log('❌ Login failed:', response.status, responseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testLoginDebug();
