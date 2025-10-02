import { Router } from "express";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { JwtAuthMode } from "../../auth/constants/auth-mode.enum";
import { getDrizzle } from "../../../common/drizzle";

export function setupFinancialReportsRoutes() {
  const router = Router();
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
  
  router.get("/financial-reports", async (req: any, res) => {
    const db = getDrizzle();
    const companyId = req.user?.companyId;
    
    const sales = await db.$client`SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE company_id = ${companyId} AND type = 'INVOICE'`;
    const purchases = await db.$client`SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE company_id = ${companyId} AND type = 'PURCHASE'`;
    
    res.json([
      { id: '1', name: 'Vânzări', value: Number(sales[0]?.total || 0), type: 'income' },
      { id: '2', name: 'Achiziții', value: Number(purchases[0]?.total || 0), type: 'expense' }
    ]);
  });
  
  router.get("/financial-indicators", async (req: any, res) => {
    const db = getDrizzle();
    const companyId = req.user?.companyId;
    
    const sales = await db.$client`SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE company_id = ${companyId} AND type = 'INVOICE'`;
    const purchases = await db.$client`SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE company_id = ${companyId} AND type = 'PURCHASE'`;
    const cashBalance = await db.$client`SELECT COALESCE(current_balance, 0) as balance FROM cash_registers WHERE company_id = ${companyId} LIMIT 1`;
    const bankBalance = await db.$client`SELECT COALESCE(current_balance, 0) as balance FROM bank_accounts WHERE company_id = ${companyId} LIMIT 1`;
    
    res.json({
      totalRevenue: Number(sales[0]?.total || 0),
      totalExpenses: Number(purchases[0]?.total || 0),
      profit: Number(sales[0]?.total || 0) - Number(purchases[0]?.total || 0),
      cashBalance: Number(cashBalance[0]?.balance || 0),
      bankBalance: Number(bankBalance[0]?.balance || 0)
    });
  });
  
  return router;
}
