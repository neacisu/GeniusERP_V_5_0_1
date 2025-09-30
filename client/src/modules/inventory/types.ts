/**
 * Inventory Types
 * 
 * Define typurile utilizate în modulul de inventar pentru a asigura consistența
 * datelor între componente. Include tipuri pentru categorii, produse, unități
 * de măsură și alte entități legate de inventar.
 */

// Tipuri de gestiune
export enum GestiuneType {
  DEPOZIT = 'depozit',
  MAGAZIN = 'magazin',
  CUSTODIE = 'custodie',
  TRANSFER = 'transfer'
}

// Metode de evidență a stocului
export enum StockTrackingType {
  STANDARD = 'standard',
  FIFO = 'fifo',
  LIFO = 'lifo',
  CMP = 'cmp'  // Cost Mediu Ponderat
}

// Categorii de produse
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  children?: ProductCategory[];
}

// Unități de măsură
export interface InventoryUnit {
  id: string;
  name: string;
  abbreviation: string;
  createdAt: string;
  updatedAt: string;
}

// Produse
export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  categoryId?: string;
  unitId?: string;
  purchasePrice: string;  // Valoare decimală stocată ca string
  sellingPrice: string;   // Valoare decimală stocată ca string
  vatRate?: number;
  stockAlert?: string;    // Valoare decimală stocată ca string
  isActive: boolean;
  sku?: string;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
  // Relații
  category?: ProductCategory;
  unit?: InventoryUnit;
}

// Depozite (gestiuni)
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: GestiuneType;
  trackingType: StockTrackingType;
  location?: string;
  address?: string;
  responsible?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Stocuri
export interface StockItem {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: string;        // Valoare decimală stocată ca string
  reservedQuantity?: string; // Valoare decimală stocată ca string
  batchNo?: string;
  expiryDate?: string;
  purchasePrice?: string;  // Valoare decimală stocată ca string
  serialNumber?: string;
  createdAt: string;
  updatedAt: string;
  // Relații
  product?: Product;
  warehouse?: Warehouse;
}

// Documente NIR (Notă de Intrare-Recepție)
export interface NirDocument {
  id: string;
  number: string;
  date: string;
  supplierId: string;
  warehouseId: string;
  status: 'draft' | 'received' | 'cancelled';
  receivedBy: string;
  receivedDate?: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;
  // Relații
  items?: NirItem[];
  warehouse?: Warehouse;
}

// Elemente NIR
export interface NirItem {
  id: string;
  nirId: string;
  productId: string;
  quantity: string;      // Valoare decimală stocată ca string
  unitPrice: string;     // Valoare decimală stocată ca string
  totalValue: string;    // Valoare decimală stocată ca string
  batchNo?: string;
  expiryDate?: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;
  // Relații
  product?: Product;
}

// Transfer stoc între gestiuni
export interface StockTransfer {
  id: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  date: string;
  documentNumber?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  observations?: string;
  createdAt: string;
  updatedAt: string;
  // Relații
  items?: StockTransferItem[];
  sourceWarehouse?: Warehouse;
  destinationWarehouse?: Warehouse;
}

// Elemente transfer stoc
export interface StockTransferItem {
  id: string;
  transferId: string;
  productId: string;
  quantity: string;      // Valoare decimală stocată ca string
  batchNo?: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;
  // Relații
  product?: Product;
}