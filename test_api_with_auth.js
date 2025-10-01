// Тест API з авторизацією
const testAPIWithAuth = async () => {
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
    
    // Тест отримання користувача
    const userResponse = await fetch('http://localhost:5001/api/users/me', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ User data:', userData);
    } else {
      console.log('❌ User failed:', userResponse.status);
    }
    
    // Тест отримання оголошень
    const listingsResponse = await fetch('http://localhost:5001/api/listings/my', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    
    if (listingsResponse.ok) {
      const listingsData = await listingsResponse.json();
      console.log('✅ My listings:', listingsData);
    } else {
      console.log('❌ My listings failed:', listingsResponse.status);
    }
    
    // Тест отримання замовлень
    const ordersResponse = await fetch('http://localhost:5001/api/orders', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    
    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json();
      console.log('✅ Orders:', ordersData);
    } else {
      console.log('❌ Orders failed:', ordersResponse.status);
    }
    
    // Тест отримання сповіщень
    const notificationsResponse = await fetch('http://localhost:5001/api/notifications/unread-counts', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    
    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json();
      console.log('✅ Notifications:', notificationsData);
    } else {
      console.log('❌ Notifications failed:', notificationsResponse.status);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
};

testAPIWithAuth();
