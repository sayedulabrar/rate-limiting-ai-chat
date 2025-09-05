const axios = require('axios');
const sqlite3 = require('sqlite3').verbose;

async function testPremium() {
    console.log('=== Testing Premium Tier (10 requests/hour) ===\n');

    const baseUrl = 'http://localhost:3000';
    const user = {
        username: `testpremium${Date.now()}`, // Unique username
        email: `testpremium${Date.now()}@example.com`, // Unique email
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

    // Step 2: Upgrade to premium (manually update tier in database)
    console.log('\nStep 2: Upgrading user to premium tier');
    const db = new sqlite3.Database(config.DATABASE_PATH);
    try {
        await new Promise((resolve, reject) => {
            db.run('UPDATE users SET tier = ? WHERE email = ?', ['premium', user.email], (err) => {
                if (err) reject(err);
                resolve();
            });
        });
        console.log('User upgraded to premium tier');
    } catch (error) {
        console.error('Failed to upgrade user:', error);
        db.close();
        return;
    }
    db.close();

    // Step 3: Login to get updated JWT with premium tier
    console.log('\nStep 3: Logging in user:', user.email);
    try {
        const loginResponse = await axios.post(`${baseUrl}/api/login`, { email: user.email, password: user.password });
        console.log(`Login: Status ${loginResponse.status} - Response: ${JSON.stringify(loginResponse.data)}`);
        token = loginResponse.data.token; // Update token with premium tier
    } catch (error) {
        console.error(`Login failed - Status: ${error.response?.status || 'N/A'}, Error: ${error.response?.data?.error || error.message}`);
        return;
    }

    // Step 4: Make 12 requests to hit the rate limit (10 req/hour)
    console.log('\nStep 4: Making AI requests to /api/ai/chat');
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    const data = { prompt: 'Hello, AI!' };

    for (let i = 1; i <= 12; i++) {
        console.log(`Request ${i}: Sending POST to ${baseUrl}/api/ai/chat`);
        try {
            const response = await axios.post(`${baseUrl}/api/ai/chat`, data, config);
            console.log(`Request ${i}: Status ${response.status} - Response: ${response.data}`);
        } catch (error) {
            console.error(`Request ${i}: Failed - Status: ${error.response?.status || 'N/A'}, Error: ${error.response?.data?.error || error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }

    console.log('\n=== Premium Tier Test Completed ===');
}

testPremium().catch(err => console.error('Test failed:', err));