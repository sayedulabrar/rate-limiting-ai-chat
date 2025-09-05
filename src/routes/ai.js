const express = require('express');
const { google } = require('@ai-sdk/google');
const { streamText } = require('ai');
const rateLimit = require('../middleware/rateLimit');
const config = require('../config/app');


const router = express.Router();
const geminiFlash = google("gemini-1.5-flash", {
    apiKey: config.GEMINI_API_KEY,
});


router.post('/chat', rateLimit, async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const {textStream } = await streamText({
            model:geminiFlash,
            prompt,
        });

        for await (const text of textStream) {
            process.stdout.write(text);
        }

        return textStream;
    } catch (error) {
        console.error('AI request error:', error);
        res.status(500).json({ error: 'Failed to process AI request' });
    }
});

request.get('/status', async (req,res)=>{
    
})

module.exports = router;