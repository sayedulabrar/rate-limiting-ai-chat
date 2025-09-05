const RateLimitService = require('../services/rateLimitService');

module.exports = async (req, res, next) => {
    try {
        const ip = req.ip;
        let identifier = `ip_${ip}`;
        let tier = 'guest';

        if (req.user) {
            identifier = `user_${req.user.id}`;
            tier = req.user.tier;
        }

        const limit = await RateLimitService.getTierLimit(tier);
        const usage = await RateLimitService.getRateLimit(identifier);

        if (usage.request_count >= limit) {
            if (tier === 'guest') {
                return res.status(429).json({
                    error: 'Rate limit exceeded. Please sign up or log in to continue.',
                });
            }
            return res.status(429).json({
                error: `Rate limit exceeded. ${tier} users are limited to ${limit} requests per hour.`,
            });
        }

        await RateLimitService.incrementUsage(identifier);
        req.rateLimit = { identifier, usage, limit };
        next();
    } catch (error) {
        console.error('Rate limit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};