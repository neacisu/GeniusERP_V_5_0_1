import { Router } from "express";
import { CashRegisterService } from "../services";
import { authGuard, roleGuard } from "../../auth/middleware/auth.middleware";
import { cashRegisterService } from "..";

/**
 * Setup routes for the Romanian Cash Register (Registru de Casă)
 * Routes for managing cash transactions, receipts and payments
 */
export function setupCashRegisterRoutes() {
  const router = Router();
  
  // Apply authentication middleware to all cash register routes
  router.use(authGuard);
  
  /**
   * Get all cash registers
   */
  router.get("/registers", async (req, res, next) => {
    try {
      const companyId = req.user.companyId;
      const registers = await cashRegisterService.getCashRegisters(companyId);
      res.json(registers);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Get cash register by ID
   */
  router.get("/registers/:id", async (req, res, next) => {
    try {
      const register = await cashRegisterService.getCashRegister(req.params.id);
      
      if (!register || register.companyId !== req.user.companyId) {
        return res.status(404).json({ message: "Cash register not found" });
      }
      
      res.json(register);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Create new cash register
   * Requires accountant or admin role
   */
  router.post("/registers", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const registerData = req.body;
      
      // Add company ID
      registerData.companyId = req.user.companyId;
      
      const registerId = await cashRegisterService.createCashRegister(registerData);
      const register = await cashRegisterService.getCashRegister(registerId);
      
      res.status(201).json(register);
    } catch (error: any) {
      if (error.message.includes("validation")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Update cash register
   * Requires accountant or admin role
   */
  router.put("/registers/:id", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const registerId = req.params.id;
      const companyId = req.user.companyId;
      const registerData = req.body;
      
      // Check if register exists and belongs to company
      const existingRegister = await cashRegisterService.getCashRegister(registerId);
      if (!existingRegister || existingRegister.companyId !== companyId) {
        return res.status(404).json({ message: "Cash register not found" });
      }
      
      await cashRegisterService.updateCashRegister(registerId, registerData);
      const updatedRegister = await cashRegisterService.getCashRegister(registerId);
      
      res.json(updatedRegister);
    } catch (error: any) {
      if (error.message.includes("validation")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Create cash receipt (Chitanță)
   * Requires accountant or admin role
   */
  router.post("/receipts", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const receiptData = req.body;
      
      // Add company ID and user ID
      receiptData.companyId = req.user.companyId;
      receiptData.userId = req.user.id;
      
      const entryId = await cashRegisterService.createCashReceipt(receiptData);
      
      // Get the created entry with all details
      const entry = await cashRegisterService.getCashTransaction(entryId, req.user.companyId);
      
      res.status(201).json(entry);
    } catch (error: any) {
      if (error.message.includes("validation") || error.message.includes("not found")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Create cash payment (Dispoziție de Plată)
   * Requires accountant or admin role
   */
  router.post("/payments", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const paymentData = req.body;
      
      // Add company ID and user ID
      paymentData.companyId = req.user.companyId;
      paymentData.userId = req.user.id;
      
      const entryId = await cashRegisterService.createCashPayment(paymentData);
      
      // Get the created entry with all details
      const entry = await cashRegisterService.getCashTransaction(entryId, req.user.companyId);
      
      res.status(201).json(entry);
    } catch (error: any) {
      if (error.message.includes("validation") || error.message.includes("not found") || error.message.includes("insufficient")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Create cash transfer between registers
   * Requires accountant or admin role
   */
  router.post("/transfers", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const { 
        sourceCashRegisterId,
        targetCashRegisterId,
        date,
        amount,
        description,
        notes
      } = req.body;
      
      const companyId = req.user.companyId;
      const userId = req.user.id;
      
      const entryId = await cashRegisterService.createCashTransfer(
        companyId,
        sourceCashRegisterId,
        targetCashRegisterId,
        new Date(date),
        amount,
        description,
        userId,
        notes
      );
      
      const entry = await cashRegisterService.getCashTransaction(entryId, companyId);
      
      res.status(201).json(entry);
    } catch (error: any) {
      if (error.message.includes("validation") || error.message.includes("not found") || error.message.includes("insufficient")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Get all cash transactions for a register
   */
  router.get("/registers/:id/transactions", async (req, res, next) => {
    try {
      const registerId = req.params.id;
      const companyId = req.user.companyId;
      
      // Optional date filters
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      // Check if register exists and belongs to company
      const existingRegister = await cashRegisterService.getCashRegister(registerId);
      if (!existingRegister || existingRegister.companyId !== companyId) {
        return res.status(404).json({ message: "Cash register not found" });
      }
      
      const transactions = await cashRegisterService.getCashTransactions(
        companyId,
        registerId,
        startDate,
        endDate
      );
      
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Get cash register balance as of specific date
   */
  router.get("/registers/:id/balance", async (req, res, next) => {
    try {
      const registerId = req.params.id;
      const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : new Date();
      
      // Check if register exists and belongs to company
      const existingRegister = await cashRegisterService.getCashRegister(registerId);
      if (!existingRegister || existingRegister.companyId !== req.user.companyId) {
        return res.status(404).json({ message: "Cash register not found" });
      }
      
      const balance = await cashRegisterService.getCashRegisterBalanceAsOf(registerId, asOfDate);
      
      res.json({ balance });
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Create daily cash register balance
   * Requires accountant or admin role
   */
  router.post("/registers/:id/daily-balances", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const registerId = req.params.id;
      const companyId = req.user.companyId;
      const userId = req.user.id;
      const { date, notes } = req.body;
      
      // Check if register exists and belongs to company
      const existingRegister = await cashRegisterService.getCashRegister(registerId);
      if (!existingRegister || existingRegister.companyId !== companyId) {
        return res.status(404).json({ message: "Cash register not found" });
      }
      
      const balance = await cashRegisterService.createDailyBalance(
        companyId,
        registerId,
        new Date(date),
        notes,
        userId
      );
      
      res.status(201).json(balance);
    } catch (error: any) {
      if (error.message.includes("already exists") || error.message.includes("future date")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Approve daily cash register balance
   * Requires accountant or admin role
   */
  router.post("/daily-balances/:id/approve", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const balanceId = req.params.id;
      const userId = req.user.id;
      
      const balance = await cashRegisterService.approveDailyBalance(balanceId, userId);
      
      res.json(balance);
    } catch (error: any) {
      if (error.message.includes("not found") || error.message.includes("already approved")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Get cash register report
   */
  router.get("/reports/:registerId", async (req, res, next) => {
    try {
      const registerId = req.params.registerId;
      const companyId = req.user.companyId;
      const fiscalYear = parseInt(req.query.fiscalYear as string) || new Date().getFullYear();
      const fiscalMonth = parseInt(req.query.fiscalMonth as string) || new Date().getMonth() + 1;
      
      // Check if register exists and belongs to company
      const existingRegister = await cashRegisterService.getCashRegister(registerId);
      if (!existingRegister || existingRegister.companyId !== companyId) {
        return res.status(404).json({ message: "Cash register not found" });
      }
      
      const report = await cashRegisterService.generateCashRegisterReport(
        companyId,
        registerId,
        fiscalYear,
        fiscalMonth
      );
      
      res.json(report);
    } catch (error) {
      next(error);
    }
  });
  
  return router;
}