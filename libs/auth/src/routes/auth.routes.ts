import { Router } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import session from "express-session";
import { authService, JWT_SECRET } from "../services/auth.service";
import { AuthGuard } from "../guards/auth.guard";
import { JwtAuthMode, UserRole } from "../types";
import { DrizzleService } from "@common/drizzle";
import { users, User as SelectUser } from "../../../shared/src/schema";
import { authRateLimiter } from "../../../middlewares/rate-limit.middleware";
import { log } from "../../../vite";

export function setupAuthRoutes(app: Router, sessionStore: session.Store) {
  const router = Router();
  const drizzleService = new DrizzleService();

  // Set up session with security best practices
  // SESSION_SECRET is validated at startup by env-validation.ts
  const sessionSettings: session.SessionOptions = {
    secret: String(process.env.SESSION_SECRET),  // Validated at startup, safe to convert
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: 'lax', // CSRF protection
      domain: process.env.COOKIE_DOMAIN || undefined
    },
    name: 'geniuserp.sid', // Custom session name (don't reveal tech stack)
    proxy: process.env.NODE_ENV === "production" // Trust proxy in production
  };

  // Configure Passport strategies
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await authService.getUserByUsername(username);
        if (!user || !(await authService.comparePasswords(password, user.password))) {
          return done(null, false, { message: "Nume de utilizator sau parolă incorecte" });
        } else {
          // Transform SelectUser to AuthUser by adding roles array
          const authUser = { ...user, roles: [user.role] };
          return done(null, authUser);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: String(JWT_SECRET)  // Convert to string for passport-jwt
      },
      async (payload: { id: string }, done: (error: Error | null, user?: unknown | false) => void) => {
        try {
          const user = await authService.getUserById(payload.id);
          if (!user) {
            return done(null, false);
          }
          // Transform SelectUser to AuthUser by adding roles array
          const authUser = { ...user, roles: [user.role] };
          return done(null, authUser);
        } catch (error) {
          return done(error instanceof Error ? error : new Error('Unknown error'));
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await authService.getUserById(id);
      // Transform SelectUser to AuthUser by adding roles array
      const authUser = user ? { ...user, roles: [user.role] } : null;
      done(null, authUser);
    } catch (error) {
      done(error, null);
    }
  });

  // Use session middleware
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Register route - with rate limiting
  router.post("/register", authRateLimiter, async (req, res, next) => {
    try {
      const user = await authService.registerUser(req.body);

      // Return the user with token without using req.login
      res.status(201).json({ ...user, token: user.token });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration error';
      if (message === "Numele de utilizator există deja") {
        return res.status(400).json({ message });
      }
      next(error);
    }
  });

  // Login route - with rate limiting
  router.post("/login", authRateLimiter, (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: unknown, info?: { message?: string }) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Autentificare eșuată" });
      }
      
      // Generate token and return user without using req.login
      // Passport LocalStrategy returns SelectUser from our getUserByUsername
      const token = authService.generateToken(user as SelectUser);
      return res.status(200).json({ ...user, token });
    })(req, res, next);
  });

  // Logout route
  router.post("/logout", (req, res) => {
    // Simply return success since we're using token-based auth
    res.status(200).json({ message: 'Logout successful' });
  });

  // Refresh token route
  router.post("/refresh", async (req, res, _next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Token required for refresh' });
      }
      
      // Verify the current token (even if expired, we can still decode it)
      const user = await authService.verifyToken(token);
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      // Generate a new token
      const newToken = authService.generateToken(user);
      
      log(`Token refreshed successfully for user: ${user.id}`, 'auth-routes');
      res.json({ 
        token: newToken,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          companyId: user.companyId
        }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AuthRoutes] Token refresh error:', message);
      res.status(401).json({ error: 'Token refresh failed' });
    }
  });

  // Get current user route
  router.get("/user", 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    (req, res) => {
      res.json(req.user);
    }
  );

  // Admin routes
  router.get("/users", 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard([UserRole.ADMIN]),
    async (req, res) => {
      try {
        // Use DrizzleService to get all users through query method
        const usersData = await drizzleService.query(async (db) => {
          return await db.select().from(users);
        });
        res.json(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
      }
    }
  );

  // Test endpoints - ONLY in development
  // These are security-sensitive and should NEVER be exposed in production
  if (process.env.NODE_ENV !== 'production') {
    // Test token generation endpoint
    router.get('/test-token/:userId', async (req, res) => {
      try {
        const user = await authService.getUserById(req.params.userId);
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Generate token using the standard JWT secret
        const token = authService.generateToken(user);
        
        return res.status(200).json({ token });
      } catch (error) {
        console.error('Error in test token endpoint:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
    
    // Test JWT verification endpoint
    router.get('/verify-token', AuthGuard.protect(JwtAuthMode.REQUIRED), (req, res) => {
      // If we got here, the token was verified successfully by the middleware
      return res.status(200).json({ 
        message: 'Token verified successfully',
        user: req.user 
      });
    });
    
    log('⚠️  Test auth endpoints enabled (development only)', 'auth-routes');
  }
  
  // Authentication verification endpoint
  router.get('/verify', AuthGuard.protect(JwtAuthMode.REQUIRED), (req, res) => {
    // This endpoint verifies authentication and provides user role information
    const roles = req.user?.roles || [];
    
    // Return authenticated user details
    return res.status(200).json({
      message: 'Authentication Verification Endpoint',
      user: req.user,
      isAdmin: req.user?.role === 'admin' || roles.includes('admin'),
      timestamp: new Date().toISOString(),
      note: 'This endpoint verifies authentication and returns user details'
    });
  });

  return router;
}