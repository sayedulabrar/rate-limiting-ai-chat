const axios = require('axios');

async function testGuest() {
    console.log('=== Testing Guest Tier (3 requests/hour) ===\n');

    const url = 'http://localhost:3000/api/ai/chat';
    const config = {
        headers: { 'Content-Type': 'application/json' },
    };
    const data = { prompt: 'Hello, AI!' };

    // Make 5 requests to hit the rate limit (3 req/hour)
    for (let i = 1; i <= 5; i++) {
        console.log(`Request ${i}: Sending POST to ${url}`);
        try {
            const response = await axios.post(url, data, config);
            console.log(`Request ${i}: Status ${response.status} - Response: ${response.data}`);
        } catch (error) {
            console.error(`Request ${i}: Failed - Status: ${error.response?.status || 'N/A'}, Error: ${error.response?.data?.error || error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }

    console.log('\n=== Guest Test Completed ===');
}

testGuest().catch(err => console.error('Test failed:', err));