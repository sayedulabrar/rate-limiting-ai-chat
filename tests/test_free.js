const axios = require('axios');

async function testFree() {
    console.log('=== Testing Free Tier (8 requests/hour) ===\n');

    const baseUrl = 'http://localhost:3000';
    const user = {
        username: `testfree${Date.now()}`, // Unique username
        email: `testfree${Date.now()}@example.com`, // Unique email
        password: 'password123'
    };

    // Step 1: Signup
    console.log('Step 1: Signing up user:', user);
    let token;
    try {
        const signupResponse = await axios.post(`${baseUrl}/api/signup`, user);
        console.log(`Signup: Status ${signupResponse.status} - Response: ${JSON.stringify(signupResponse.data)}`);
        token = signupResponse.data.token;
    } catch (error) {
        console.error(`Signup failed - Status: ${error.response?.status || 'N/A'}, Error: ${error.response?.data?.error || error.message}`);
        return;
    }

    // Step 2: Login (optional, since signup provides token)
    console.log('\nStep 2: Logging in user:', user.email);
    try {
        const loginResponse = await axios.post(`${baseUrl}/api/login`, { email: user.email, password: user.password });
        console.log(`Login: Status ${loginResponse.status} - Response: ${JSON.stringify(loginResponse.data)}`);
        token = loginResponse.data.token; // Update token
    } catch (error) {
        console.error(`Login failed - Status: ${error.response?.status || 'N/A'}, Error: ${error.response?.data?.error || error.message}`);
        return;
    }

    // Step 3: Make 12 requests to hit the rate limit (10 req/hour)
    console.log('\nStep 3: Making AI requests to /api/ai/chat');
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    const data = { prompt: 'Hello, AI!' };

    for (let i = 1; i <= 10; i++) {
        console.log(`Request ${i}: Sending POST to ${baseUrl}/api/ai/chat`);
        try {
            const response = await axios.post(`${baseUrl}/api/ai/chat`, data, config);
            console.log(`Request ${i}: Status ${response.status} - Response: ${response.data}`);
        } catch (error) {
            console.error(`Request ${i}: Failed - Status: ${error.response?.status || 'N/A'}, Error: ${error.response?.data?.error || error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }

    console.log('\n=== Free Tier Test Completed ===');
}

testFree().catch(err => console.error('Test failed:', err));