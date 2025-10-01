// Тест "Мої оголошення"
const testMyListings = async () => {
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
    
    // Тест отримання "Мої оголошення"
    const listingsResponse = await fetch('http://localhost:5001/api/listings/my', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    
    if (listingsResponse.ok) {
      const listingsData = await listingsResponse.json();
      console.log('✅ My listings:', listingsData);
      console.log('Count:', listingsData.length);
    } else {
      console.log('❌ My listings failed:', listingsResponse.status);
    }
    
    // Тест створення оголошення
    const createListingData = {
      title: 'Test Listing',
      description: 'This is a test listing',
      price: 100,
      currency: 'UAH',
      category: 'Textbooks',
      condition: 'Good',
      location: 'Kyiv',
      isNegotiable: true
    };
    
    const createResponse = await fetch('http://localhost:5001/api/listings', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createListingData)
    });
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Listing created:', createResult);
      
      // Тест отримання "Мої оголошення" після створення
      const listingsResponse2 = await fetch('http://localhost:5001/api/listings/my', {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      
      if (listingsResponse2.ok) {
        const listingsData2 = await listingsResponse2.json();
        console.log('✅ My listings after creation:', listingsData2);
        console.log('Count after creation:', listingsData2.length);
      }
    } else {
      console.log('❌ Create listing failed:', createResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testMyListings();
