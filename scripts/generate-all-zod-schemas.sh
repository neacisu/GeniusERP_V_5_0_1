#!/bin/bash
#
# Generare Zod schemas pentru TOATE tabelele noi create
#

cd /var/www/GeniusERP/libs/shared/src/schema

echo "Generez Zod schemas pentru tabele noi..."

# Core
cat >> core.schema.ts << 'ZODEOF'

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertRoleSchema = createInsertSchema(roles);
export const selectRoleSchema = createSelectSchema(roles);
export const insertPermissionSchema = createInsertSchema(permissions);
export const selectPermissionSchema = createSelectSchema(permissions);

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;
ZODEOF

echo "✅ Core Zod schemas generated"

# Inventory
cat >> inventory.schema.ts << 'ZODEOF'

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const insertInventoryCategorySchema = createInsertSchema(inventory_categories);
export const insertInventoryProductSchema = createInsertSchema(inventory_products);
export const insertInventoryStockSchema = createInsertSchema(inventory_stock);
export const insertInventoryStockMovementSchema = createInsertSchema(inventory_stock_movements);

export type InventoryCategory = typeof inventory_categories.$inferSelect;
export type InventoryProduct = typeof inventory_products.$inferSelect;
export type InventoryStock = typeof inventory_stock.$inferSelect;
export type InventoryStockMovement = typeof inventory_stock_movements.$inferSelect;
ZODEOF

echo "✅ Inventory Zod schemas generated"

# Invoicing
cat >> invoicing.schema.ts << 'ZODEOF'

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const insertInvoiceSchema = createInsertSchema(invoices);
export const insertInvoiceDetailsSchema = createInsertSchema(invoice_details);
export const insertInvoicePaymentSchema = createInsertSchema(invoice_payments);

export type Invoice = typeof invoices.$inferSelect;
export type InvoiceDetails = typeof invoice_details.$inferSelect;
export type InvoicePayment = typeof invoice_payments.$inferSelect;
ZODEOF

echo "✅ Invoicing Zod schemas generated"

# Purchasing
cat >> purchasing.schema.ts << 'ZODEOF'

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const insertPurchaseOrderSchema = createInsertSchema(purchase_orders);
export const insertNirDocumentSchema = createInsertSchema(nir_documents);

export type PurchaseOrder = typeof purchase_orders.$inferSelect;
export type NirDocument = typeof nir_documents.$inferSelect;
ZODEOF

echo "✅ Purchasing Zod schemas generated"

# Transfer
cat >> transfer.schema.ts << 'ZODEOF'

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const insertTransferDocumentSchema = createInsertSchema(transfer_documents);
export const insertStockReservationSchema = createInsertSchema(stock_reservations);

export type TransferDocument = typeof transfer_documents.$inferSelect;
export type StockReservation = typeof stock_reservations.$inferSelect;
ZODEOF

echo "✅ Transfer Zod schemas generated"

# Settings
cat >> settings-extended.schema.ts << 'ZODEOF'

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const insertSettingsGlobalSchema = createInsertSchema(settings_global);
export const insertFeatureToggleSchema = createInsertSchema(settings_feature_toggles);
export const insertUIThemeSchema = createInsertSchema(settings_ui_themes);
export const insertUserPreferencesSchema = createInsertSchema(settings_user_preferences);

export type SettingsGlobal = typeof settings_global.$inferSelect;
export type FeatureToggle = typeof settings_feature_toggles.$inferSelect;
export type UITheme = typeof settings_ui_themes.$inferSelect;
export type UserPreferences = typeof settings_user_preferences.$inferSelect;
ZODEOF

echo "✅ Settings Zod schemas generated"

# Documents
cat >> documents-extended.schema.ts << 'ZODEOF'

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const insertDocumentSchema = createInsertSchema(documents);
export const insertDocumentVersionSchema = createInsertSchema(document_versions);
export const insertFxRateSchema = createInsertSchema(fx_rates);

export type Document = typeof documents.$inferSelect;
export type DocumentVersion = typeof document_versions.$inferSelect;
export type FxRate = typeof fx_rates.$inferSelect;
ZODEOF

echo "✅ Documents Zod schemas generated"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ ZOD SCHEMAS GENERATED FOR ALL NEW TABLES!          ║"
echo "╚══════════════════════════════════════════════════════════╝"

