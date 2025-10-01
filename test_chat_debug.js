// Тест чату для дебагу
const testChatDebug = async () => {
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
    
    // Тест створення користувача для чату
    const registerData = {
      email: 'chatuser@example.com',
      password: 'Test123!',
      firstName: 'Chat',
      lastName: 'User'
    };
    
    const registerResponse = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    });
    
    let recipientId = null;
    if (registerResponse.ok) {
      const registerResult = await registerResponse.json();
      recipientId = registerResult.User.Id;
      console.log('✅ Chat user created:', recipientId);
    } else {
      // Якщо користувач вже існує, використаємо існуючого
      recipientId = 'b6ce1662-7309-4d30-b1ba-313eb649fa5c';
      console.log('⚠️ Using existing user:', recipientId);
    }
    
    // Тест відправки повідомлення через API
    const messageData = {
      receiverId: recipientId,
      content: 'Test message from API at ' + new Date().toLocaleTimeString()
    };
    
    console.log('📤 Sending message via API...');
    console.log('Message data:', messageData);
    
    // Спочатку спробуємо через SendMessageCommand напряму
    const apiResponse = await fetch('http://localhost:5001/api/test-message', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });
    
    if (apiResponse.ok) {
      const result = await apiResponse.json();
      console.log('✅ API message sent:', result);
    } else {
      console.log('❌ API message failed:', apiResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testChatDebug();
