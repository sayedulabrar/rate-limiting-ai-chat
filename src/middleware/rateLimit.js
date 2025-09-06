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

        const remaining = Math.max(limit - usage.request_count, 0);

        if (usage.request_count >= limit) {
            const message =
                tier === 'guest'
                    ? `Too many requests. Guest users can make ${limit} requests per hour. Please sign up or log in to continue.`
                    : `Too many requests. ${tier.charAt(0).toUpperCase() + tier.slice(1)} users can make ${limit} requests per hour.`;

            return res.status(429).json({
                success: false,
                error: message,
                remaining_requests: 0,
            });
        }

        await RateLimitService.incrementUsage(identifier);
        req.rateLimit = { identifier, usage, limit };
        next();
    } catch (error) {
        console.error('Rate limit error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            remaining_requests: 0,
        });
    }
};
