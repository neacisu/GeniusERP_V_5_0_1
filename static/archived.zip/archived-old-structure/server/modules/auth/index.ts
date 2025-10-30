import { Express, Router } from "express";
import session from "express-session";
import { setupAuthRoutes } from "./routes/auth.routes";
import { authGuard, adminGuard, roleGuard, optionalAuth } from "./middleware/auth.middleware";
import { authService, JWT_SECRET, JWT_EXPIRES_IN } from "./services/auth.service";
import jwtService, { JwtService } from "./services/jwt.service";
import { AuthGuard } from "./guards/auth.guard";
import { JwtAuthMode, UserRole } from "./types";
import { setupProtectedRoutes } from "./examples/protected-routes";

export function initAuthModule(app: Express, sessionStore: session.Store) {
  const router = Router();
  const authRouter = setupAuthRoutes(router, sessionStore);
  app.use("/api/auth", authRouter);
  
  // Add example protected routes to demonstrate AuthGuard usage
  if (process.env.NODE_ENV !== 'production') {
    const exampleRoutes = setupProtectedRoutes();
    app.use("/api/examples", exampleRoutes);
    console.log('🔐 AuthGuard example routes registered at /api/examples');
    console.log('Try: /api/examples/protected with Authorization header');
  }
  
  return router;
}

export {
  // Legacy middleware exports
  authGuard,
  adminGuard,
  roleGuard,
  optionalAuth,
  authService,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  
  // Class exports
  AuthGuard,
  JwtService,
  
  // Enums
  JwtAuthMode,
  UserRole,
  
  // Singleton exports
  jwtService
};