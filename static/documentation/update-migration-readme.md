# Product Tables Consolidation

This document describes the consolidation of product-related tables in the system.

## Changes Made

1. Removed `crm_products` table completely
2. Modified `crm_deal_products` table to reference `inventory_products` instead
3. Updated migration scripts to reflect these changes

## Current Table Structure

- `inventory_products`: Main table containing all product information (59 records)
- `crm_deal_products`: Junction table linking deals to products from the inventory table (0 records currently)

## Migration Script Changes

The `direct-crm-migration.ts` file has been updated to reflect these changes:
- Removed the creation of the `crm_products` table
- Modified `crm_deal_products` to reference `inventory_products` instead

## Benefits

1. **Simplified Data Model**: All product data is now in a single table
2. **Reduced Duplication**: No need to maintain product data in multiple places
3. **Improved Data Integrity**: Single source of truth for product information
4. **Better Integration**: Inventory and CRM systems now share the same product data

## Technical Implementation

A dedicated migration script (`consolidate-product-tables.ts`) was created and executed to:
1. Drop the foreign key constraint between `crm_deal_products` and `crm_products`
2. Add a new foreign key constraint to link `crm_deal_products` to `inventory_products`
3. Drop the now-unused `crm_products` table