const express = require('express');
const { google } = require('@ai-sdk/google');
const { streamText, StreamingTextResponse, generateText, } = require('ai');
const rateLimit = require('../middleware/rateLimit');
const config = require('../config/app');
const RateLimitService = require('../services/rateLimitService');

const router = express.Router();
const geminiFlash = google("gemini-1.5-flash", {
    apiKey: config.GEMINI_API_KEY,
});


router.post('/chat', rateLimit, async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ 
                success: false, 
                message: 'Prompt is required' 
            });
        }

        // AI response
        const { text } = await generateText({
            model: geminiFlash,
            prompt,
        });

        // Rate limit tracking
        const ip = req.ip;
        let identifier = `ip_${ip}`;
        let tier = 'guest';

        if (req.user) {
            identifier = `user_${req.user.id}`;
            tier = req.user.tier;
        }

        const limit = await RateLimitService.getTierLimit(tier);
        const usage = await RateLimitService.getRateLimit(identifier);
        const remaining = limit - usage.request_count;

        res.json({ 
            success: true, 
            message: text, 
            remaining_requests: remaining 
        });
    } catch (error) {
        console.error('AI request error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process AI request' 
        });
    }
});

module.exports = router;