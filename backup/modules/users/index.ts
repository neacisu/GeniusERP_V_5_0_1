import { Express, Router } from "express";
import { setupUserRoutes } from "./routes/user.routes";
import { UserService } from "./services/user.service";
import { storage } from "../../storage";

export function initUserModule(app: Express) {
  const userRoutes = setupUserRoutes();
  app.use("/api/users", userRoutes);
  return userRoutes;
}

export const userService = new UserService(storage);