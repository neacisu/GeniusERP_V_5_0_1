import { Router, Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { storage } from "../../../storage";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { UserRole } from "../../auth/types";
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';

export function setupUserRoutes() {
  const router = Router();
  const userService = new UserService(storage);
  
  // Get all users - admin only
  router.get("/", 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard([UserRole.ADMIN]),
    async (req, res, next) => {
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
    async (req, res, next) => {
    try {
      // Users can only view their own profile unless they are admins
      if (req.params.id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const user = await userService.getUser(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
    async (req, res, next) => {
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
    async (req, res, next) => {
    try {
      // Users can only update their own profile unless they are admins
      if (req.params.id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Non-admins cannot change their role
      if (req.params.id === req.user.id && req.user.role !== "admin" && req.body.role) {
        delete req.body.role;
      }
      
      const user = await userService.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  });
  
  // Role Management
  
  // Get all roles
  router.get("/roles/all", 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req, res, next) => {
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
    async (req, res, next) => {
    try {
      // Users can only view their own roles unless they are admins
      if (req.params.id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const roles = await userService.getUserRoles(req.params.id);
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
      await userService.assignRoleToUser(req.params.id, req.params.roleId);
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
      await userService.removeRoleFromUser(req.params.id, req.params.roleId);
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
    async (req, res, next) => {
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
      const permissions = await userService.getRolePermissions(req.params.id);
      res.json(permissions);
    } catch (error) {
      next(error);
    }
  });
  
  return router;
}