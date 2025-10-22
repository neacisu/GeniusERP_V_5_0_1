/**
 * Users Module Entry Point
 * 
 * This file exports the users module and initializes it when requested.
 */

import { Express, Router } from "express";
import { usersModule } from "./users.module";
import { UserService } from "./services/user.service";

export function initUserModule(app: Express): Router {
  return usersModule.initRoutes(app);
}

// Export singleton instance of UserService
export const userService = UserService.getInstance();