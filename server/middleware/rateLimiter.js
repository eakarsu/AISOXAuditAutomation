const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';
const generalMax = parseInt(process.env.GENERAL_RATE_LIMIT_MAX, 10) || (isProduction ? 500 : 5000);
const aiMax = parseInt(process.env.AI_RATE_LIMIT_MAX, 10) || (isProduction ? 100 : 1000);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: generalMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: `Too many requests. Limit: ${generalMax} per 15 minutes.` }
});

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: aiMax,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    if (req.user) return 'user:' + (req.user.id || req.user.userId);
    // Normalize IPv6 to avoid bypass
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    return ip.replace(/^::ffff:/, '');
  },
  message: { error: `Too many AI requests. Limit: ${aiMax} per hour.` }
});

module.exports = { generalLimiter, aiRateLimiter };
