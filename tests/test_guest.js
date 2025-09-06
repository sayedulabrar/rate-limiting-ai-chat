const axios = require('axios');

async function testGuest() {
    console.log('=== Testing Guest Tier (3 requests/hour) ===\n');

    const baseUrl = 'http://localhost:3000';
    const config = {
        headers: { 'Content-Type': 'application/json' }
    };
    const data = { prompt: 'What is the capital of Bangladesh?' };

    // Make 5 requests to hit the rate limit (3 req/hour)
    for (let i = 1; i <= 4; i++) {
        console.log(`Request ${i}: Sending POST to ${baseUrl}/api/ai/chat`);
        try {
            const response = await axios.post(`${baseUrl}/api/ai/chat`, data, config);
            console.log(`Request ${i}: Status ${response.status} - Response: ${JSON.stringify(response.data)}`);
        } catch (error) {
            console.error(`Request ${i}: Failed - Status: ${error.response?.status || 'N/A'}, Error: ${error.response?.data?.error || error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
    }

    console.log('\n=== Guest Test Completed ===');
}

testGuest().catch(err => console.error('Test failed:', err));