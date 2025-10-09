// TODO: Install express-rate-limit package
// import rateLimit from 'express-rate-limit';

// Temporary placeholder until express-rate-limit is installed
const rateLimit = (options: any) => (req: any, res: any, next: any) => next();

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts
  message: 'Too many login attempts, please try again later'
});
