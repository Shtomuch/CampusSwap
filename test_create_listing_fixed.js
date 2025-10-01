// Тест створення оголошення з правильним форматом
const testCreateListingFixed = async () => {
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
    
    // Тест створення оголошення з правильним форматом
    const createListingData = {
      title: 'Test Listing',
      description: 'This is a test listing',
      price: 100,
      category: 0, // Textbooks = 0
      condition: 'Good',
      location: 'Kyiv',
      isNegotiable: true,
      imageUrls: []
    };
    
    console.log('Creating listing with data:', createListingData);
    
    const createResponse = await fetch('http://localhost:5001/api/listings', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createListingData)
    });
    
    console.log('Create response status:', createResponse.status);
    
    const responseText = await createResponse.text();
    console.log('Create response text:', responseText);
    
    if (createResponse.ok) {
      const createResult = JSON.parse(responseText);
      console.log('✅ Listing created:', createResult);
      
      // Тест отримання "Мої оголошення" після створення
      const listingsResponse = await fetch('http://localhost:5001/api/listings/my', {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      
      if (listingsResponse.ok) {
        const listingsData = await listingsResponse.json();
        console.log('✅ My listings after creation:', listingsData);
        console.log('Count after creation:', listingsData.length);
      }
    } else {
      console.log('❌ Create listing failed:', createResponse.status, responseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testCreateListingFixed();
