import rateLimit from "express-rate-limit";

export const safeLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 3000, // generous limit
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        type: "rate-limit",
        severity: "low",
        message: "Too many requests. Please wait a few seconds before trying again.",
    },
});

export const normalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 2000, // restrict abusive edits or repeated updates
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        type: "rate-limit",
        severity: "medium",
        message: "Too many changes too quickly. Slow down a bit.",
    },
});

export const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // very strict
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        // Optional: Log the IP or trigger internal alert/ban mechanism here
        res.status(429).json({
            status: 429,
            type: "rate-limit",
            severity: "high",
            message: "Suspicious activity detected. You’ve been temporarily blocked.",
        });
    },
});
