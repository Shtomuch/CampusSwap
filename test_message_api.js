// Тест SendMessageCommand через API
const testMessageAPI = async () => {
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
    
    // Тест відправки повідомлення через API
    const messageData = {
      receiverId: 'b6ce1662-7309-4d30-b1ba-313eb649fa5c', // Існуючий користувач
      content: 'Test message from API at ' + new Date().toLocaleTimeString()
    };
    
    console.log('📤 Sending message via API...');
    console.log('Message data:', messageData);
    
    const apiResponse = await fetch('http://localhost:5001/api/test/message', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });
    
    console.log('Response status:', apiResponse.status);
    const responseText = await apiResponse.text();
    console.log('Response text:', responseText);
    
    if (apiResponse.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ API message sent:', result);
    } else {
      console.log('❌ API message failed:', apiResponse.status, responseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testMessageAPI();
