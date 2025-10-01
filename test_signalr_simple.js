// Тест спрощеного SignalR чату
const signalR = require('@microsoft/signalr');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const testSignalRSimple = async () => {
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
    
    // Створюємо SignalR підключення
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5001/hubs/chat", {
        accessTokenFactory: () => token
      })
      .build();
    
    connection.onclose((error) => {
      console.log('Connection closed:', error);
    });
    
    // Слухаємо помилки
    connection.on("Error", (error) => {
      console.log('❌ SignalR Error:', error);
    });
    
    // Слухаємо підтвердження відправки
    connection.on("MessageSent", (message) => {
      console.log('✅ Message sent confirmation:', message);
    });
    
    // Підключаємося
    await connection.start();
    console.log('✅ Connected to SignalR hub');
    
    // Відправляємо повідомлення
    const recipientId = 'b6ce1662-7309-4d30-b1ba-313eb649fa5c';
    const message = 'Test SignalR message at ' + new Date().toLocaleTimeString();
    
    console.log('📤 Sending message via SignalR...');
    console.log('RecipientId:', recipientId);
    console.log('Message:', message);
    
    await connection.invoke("SendMessage", recipientId, message);
    console.log('✅ SendMessage invoked successfully');
    
    // Чекаємо трохи для отримання відповіді
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Закриваємо підключення
    await connection.stop();
    console.log('✅ Connection closed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testSignalRSimple();
