import { Router } from "express";
import { UserService } from "../services/user.service";
import { AuthGuard } from "@geniuserp/auth";
import { UserRole } from "@geniuserp/auth";
import { JwtAuthMode } from '@geniuserp/auth';

export function setupUserRoutes() {
  const router = Router();
  // UserService now uses DrizzleService by default
  const userService = new UserService();
  
  // Get all users - admin only
  router.get("/", 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard([UserRole.ADMIN]),
    async (_req, res, next): Promise<void> => {
    try {
      const users = await userService.getUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });
  
  // Get user by ID
  router.get("/:id", 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req, res, next): Promise<void> => {
    try {
      // Users can only view their own profile unless they are admins
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      
      const userRoles = req.user.roles || (req.user.role ? [req.user.role] : []);
      const isAdmin = userRoles.includes("admin") || userRoles.includes("ADMIN");
      
      if (req.params['id'] !== req.user.id && !isAdmin) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }
      
      const user = await userService.getUser(req.params['id']);
      
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  });
  
  // Create user - admin only  
  router.post("/",
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard([UserRole.ADMIN]),
    async (req, res, next): Promise<void> => {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  });
  
  // Update user
  router.put("/:id", 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req, res, next): Promise<void> => {
    try {
      // Users can only update their own profile unless they are admins
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      
      const userRoles = req.user.roles || (req.user.role ? [req.user.role] : []);
      const isAdmin = userRoles.includes("admin") || userRoles.includes("ADMIN");
      
      if (req.params['id'] !== req.user.id && !isAdmin) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }
      
      // Non-admins cannot change their role
      if (req.params['id'] === req.user.id && !isAdmin && req.body.role) {
        delete req.body.role;
      }
      
      const user = await userService.updateUser(req.params['id'], req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  });
  
  // Role Management
  
  // Get all roles
  router.get("/roles/all", 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (_req, res, next): Promise<void> => {
    try {
      const roles = await userService.getRoles();
      res.json(roles);
    } catch (error) {
      next(error);
    }
  });
  
  // Get user's roles
  router.get("/:id/roles", 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req, res, next): Promise<void> => {
    try {
      // Users can only view their own roles unless they are admins
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      
      const userRoles = req.user.roles || (req.user.role ? [req.user.role] : []);
      const isAdmin = userRoles.includes("admin") || userRoles.includes("ADMIN");
      
      if (req.params['id'] !== req.user.id && !isAdmin) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }
      
      const roles = await userService.getUserRoles(req.params['id']);
      res.json(roles);
    } catch (error) {
      next(error);
    }
  });
  
  // Assign role to user - admin only
  router.post("/:id/roles/:roleId",
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(['admin']),
    async (req, res, next) => {
    try {
      await userService.assignRoleToUser(req.params['id'], req.params['roleId']);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
  
  // Remove role from user - admin only
  router.delete("/:id/roles/:roleId", 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(['admin']),
    async (req, res, next) => {
    try {
      await userService.removeRoleFromUser(req.params['id'], req.params['roleId']);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });
  
  // Permission Management
  
  // Get all permissions
  router.get("/permissions/all", 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(['admin']),
    async (_req, res, next) => {
    try {
      const permissions = await userService.getPermissions();
      res.json(permissions);
    } catch (error) {
      next(error);
    }
  });
  
  // Get role permissions
  router.get("/roles/:id/permissions", 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req, res, next) => {
    try {
      const permissions = await userService.getRolePermissions(req.params['id']);
      res.json(permissions);
    } catch (error) {
      next(error);
    }
  });
  
  return router;
}