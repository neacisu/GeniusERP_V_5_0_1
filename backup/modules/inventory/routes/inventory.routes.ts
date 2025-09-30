import { Router, Request, Response, NextFunction } from "express";
import { InventoryService } from "../services/inventory.service";
import authGuard from "../../auth/guards/auth.guard";
import { UserRole } from "../../auth/types";

export function setupInventoryRoutes() {
  const router = Router();
  const inventoryService = new InventoryService(null as any);

  // Global auth middleware for all inventory routes
  router.use(authGuard.requireAuth());

  // Warehouses - Read operations
  router.get("/warehouses", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }
      const warehouses = await inventoryService.getWarehouses(req.user.companyId, req.query.franchiseId as string);
      res.json(warehouses);
    } catch (error) {
      next(error);
    }
  });

  router.get("/warehouses/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const warehouse = await inventoryService.getWarehouse(req.params.id);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.json(warehouse);
    } catch (error) {
      next(error);
    }
  });

  // Warehouses - Write operations (require elevated privileges)
  router.post(
    "/warehouses", 
    authGuard.requireRoles([UserRole.INVENTORY_MANAGER, UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.companyId) {
          return res.status(400).json({ message: "Company ID is required" });
        }
        req.body.companyId = req.user.companyId;
        const warehouse = await inventoryService.createWarehouse(req.body);
        res.status(201).json(warehouse);
      } catch (error) {
        next(error);
      }
    }
  );

  router.put(
    "/warehouses/:id",
    authGuard.requireRoles([UserRole.INVENTORY_MANAGER, UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const warehouse = await inventoryService.updateWarehouse(req.params.id, req.body);
        res.json(warehouse);
      } catch (error) {
        next(error);
      }
    }
  );

  // Stock operations
  router.get("/stock/warehouse/:warehouseId", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }
      const stock = await inventoryService.getWarehouseStock(req.params.warehouseId, req.user.companyId);
      res.json(stock);
    } catch (error) {
      next(error);
    }
  });

  router.get("/stock/product/:productId", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }
      const stock = await inventoryService.getProductStock(
        req.params.productId, 
        req.user.companyId,
        req.query.warehouseId as string
      );
      res.json(stock);
    } catch (error) {
      next(error);
    }
  });

  // Stock reservations (require elevated privileges)
  router.post(
    "/stock/reserve",
    authGuard.requireRoles([UserRole.INVENTORY_MANAGER, UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { productId, warehouseId, quantity } = req.body;
        if (!productId || !warehouseId || quantity === undefined) {
          return res.status(400).json({ message: "Missing required fields: productId, warehouseId, quantity" });
        }
        const stock = await inventoryService.reserveStock(productId, warehouseId, quantity);
        res.json(stock);
      } catch (error) {
        next(error);
      }
    }
  );

  // Currency conversion (authenticated but no special role required)
  router.post("/convert-currency", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount, fromCurrency, toCurrency, date } = req.body;
      if (!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({ message: "Missing required fields: amount, fromCurrency, toCurrency" });
      }
      const convertedAmount = await inventoryService.convertCurrency(
        amount,
        fromCurrency,
        toCurrency,
        date ? new Date(date) : undefined
      );
      res.json({
        original: { amount, currency: fromCurrency },
        converted: { amount: convertedAmount, currency: toCurrency },
        conversionDate: date || new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}