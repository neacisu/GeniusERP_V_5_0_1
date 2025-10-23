/**
 * Users Module
 * 
 * This module handles user management, authentication, and authorization.
 * It provides functionality for managing users, roles, and permissions.
 */

import { Express, Router } from "express";
import { DrizzleService } from "../../../apps/api/src/common/drizzle/drizzle.service";
import { UserService } from "./services/user.service";
import { UserController } from "./controllers/user.controller";
import { AuthGuard } from "../../auth/src/guards/auth.guard";
import { UserRole } from "../../auth/src/types";
import { JwtAuthMode } from '../../auth/src/constants/auth-mode.enum';

export class UsersModule {
  private userController: UserController;
  private drizzle: DrizzleService;

  constructor() {
    this.drizzle = new DrizzleService();
    this.userController = new UserController();
  }

  /**
   * Initialize the users module and set up routes
   * 
   * @param app Express application
   * @returns The router that was set up
   */
  initRoutes(app: Express): Router {
    const router = Router();

    // Get all users - admin only
    router.get("/",
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN]),
      this.userController.getUsers.bind(this.userController)
    );

    // Get user by ID
    router.get("/:id",
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.userController.getUserById.bind(this.userController)
    );

    // Create user - admin only
    router.post("/",
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN]),
      this.userController.createUser.bind(this.userController)
    );

    // Update user
    router.put("/:id",
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.userController.updateUser.bind(this.userController)
    );

    // Role Management

    // Get all roles
    router.get("/roles/all",
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.userController.getRoles.bind(this.userController)
    );

    // Get user's roles
    router.get("/:id/roles",
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.userController.getUserRoles.bind(this.userController)
    );

    // Assign role to user - admin only
    router.post("/:id/roles/:roleId",
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN]),
      this.userController.assignRoleToUser.bind(this.userController)
    );

    // Remove role from user - admin only
    router.delete("/:id/roles/:roleId",
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN]),
      this.userController.removeRoleFromUser.bind(this.userController)
    );

    // Permission Management

    // Get all permissions
    router.get("/permissions/all",
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN]),
      this.userController.getPermissions.bind(this.userController)
    );

    // Get role permissions
    router.get("/roles/:id/permissions",
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.userController.getRolePermissions.bind(this.userController)
    );

    app.use("/api/users", router);
    return router;
  }
}

// Export a singleton instance
export const usersModule = new UsersModule();