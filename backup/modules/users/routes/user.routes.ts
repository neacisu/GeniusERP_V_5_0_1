import { Router, Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { storage } from "../../../storage";
import authGuard from "../../auth/guards/auth.guard";
import { UserRole, JwtAuthMode } from "../../auth/types";

export function setupUserRoutes() {
  const router = Router();
  const userService = new UserService(storage);
  
  // Get all users - admin only
  router.get("/", 
    authGuard.requireAuth(),
    authGuard.requireRoles([UserRole.ADMIN]),
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
    authGuard.requireAuth(),
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
    authGuard.requireAuth(),
    authGuard.requireRoles([UserRole.ADMIN]),
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
    authGuard.requireAuth(),
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
    authGuard.requireAuth(),
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
    authGuard.requireAuth(),
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
    authGuard.requireAuth(),
    authGuard.requireRoles(['admin']),
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
    authGuard.requireAuth(),
    authGuard.requireRoles(['admin']),
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
    authGuard.requireAuth(),
    authGuard.requireRoles(['admin']),
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
    authGuard.requireAuth(),
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