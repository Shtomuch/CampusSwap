// Тест чату з авторизацією
const testChatAuth = async () => {
  try {
    // Логін
    const loginData = {
      email: 'testuser@example.com',
      password: 'Test123!'
    };
    
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    if (!loginResponse.ok) {
      throw new Error('Login failed: ' + loginResponse.status);
    }
    
    const loginResult = await loginResponse.json();
    console.log('✅ Login successful');
    
    const token = loginResult.AccessToken;
    
    // Тест SignalR negotiation з токеном
    const signalrResponse = await fetch('http://localhost:5001/hubs/chat/negotiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    });
    
    if (signalrResponse.ok) {
      const signalrData = await signalrResponse.json();
      console.log('✅ SignalR negotiation successful:', signalrData);
    } else {
      console.log('❌ SignalR negotiation failed:', signalrResponse.status);
    }
    
    // Тест отримання розмов
    const conversationsResponse = await fetch('http://localhost:5001/api/chat/conversations', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    
    if (conversationsResponse.ok) {
      const conversationsData = await conversationsResponse.json();
      console.log('✅ Conversations:', conversationsData);
    } else {
      console.log('❌ Conversations failed:', conversationsResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Chat test failed:', error);
  }
};

testChatAuth();
