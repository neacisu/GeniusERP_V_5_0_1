import { Router } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import session from "express-session";
import { storage } from "../../../storage";
import { authService, JWT_SECRET } from "../services/auth.service";
import authGuard from "../guards/auth.guard";
import { JwtAuthMode, UserRole } from "../types";

export function setupAuthRoutes(app: Router, sessionStore: session.Store) {
  const router = Router();

  // Set up session
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "default_geniuserp_session_secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === "production",
      httpOnly: true
    }
  };

  // Configure Passport strategies
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await authService.comparePasswords(password, user.password))) {
          return done(null, false, { message: "Nume de utilizator sau parolă incorecte" });
        } else {
          return done(null, user);
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
        secretOrKey: process.env.JWT_SECRET || JWT_SECRET
      },
      async (payload, done) => {
        try {
          const user = await storage.getUser(payload.id);
          if (!user) {
            return done(null, false);
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Use session middleware
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Register route
  router.post("/register", async (req, res, next) => {
    try {
      const user = await authService.registerUser(req.body);

      // Return the user with token without using req.login
      res.status(201).json({ ...user, token: user.token });
    } catch (error: any) {
      if (error.message === "Numele de utilizator există deja") {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  });

  // Login route
  router.post("/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Autentificare eșuată" });
      }
      
      // Generate token and return user without using req.login
      const token = authService.generateToken(user);
      return res.status(200).json({ ...user, token });
    })(req, res, next);
  });

  // Logout route
  router.post("/logout", (req, res) => {
    // Simply return success since we're using token-based auth
    res.status(200).json({ message: 'Logout successful' });
  });

  // Get current user route
  router.get("/user", 
    authGuard.requireAuth(),
    (req, res) => {
      res.json(req.user);
    }
  );

  // Admin routes
  router.get("/users", 
    authGuard.requireAuth(),
    authGuard.requireRoles([UserRole.ADMIN]),
    async (req, res) => {
      try {
        const users = await storage.getUsers();
        res.json(users);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
      }
    }
  );

  // Test token generation endpoint
  router.get('/test-token/:userId', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      
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
  router.get('/verify-token', authGuard.requireAuth(), (req, res) => {
    // If we got here, the token was verified successfully by the middleware
    return res.status(200).json({ 
      message: 'Token verified successfully',
      user: req.user 
    });
  });
  
  // Authentication verification endpoint
  router.get('/verify', authGuard.requireAuth(), (req, res) => {
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