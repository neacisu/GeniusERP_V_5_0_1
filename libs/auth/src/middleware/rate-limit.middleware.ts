/**
 * Auth Rate Limiting Middleware
 * 
 * DEPRECATED: This file is kept for backwards compatibility.
 * Please use the centralized rate limiting from server/middlewares/rate-limit.middleware.ts
 */

import { authRateLimiter } from "@api/middlewares/rate-limit.middleware";

// Export the auth rate limiter for backwards compatibility
export const authLimiter = authRateLimiter;
