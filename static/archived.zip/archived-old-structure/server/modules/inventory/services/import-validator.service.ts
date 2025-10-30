/**
 * Import Validator Service
 * 
 * Acest serviciu se ocupă de validarea datelor de import pentru produse și categorii.
 * Procesul de import este împărțit în două etape:
 * 1. Validarea datelor (verifică formatul și completitudinea datelor)
 * 2. Importul efectiv (inserare/actualizare în baza de date)
 */

import { auditService } from '../../../modules/audit/services/audit.service.instance';
import { v4 as uuidv4 } from 'uuid';
import { 
  ProductImportRow, 
  ProductImportRowSchema, 
  ImportValidationReport, 
  ImportOptions,
  ImportResult
} from '../types/import-validation';
import { generateUniqueEAN13 } from '../utils/barcode-generator';
import { inventoryProducts } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';

export class ImportValidatorService {
  private db: any;
  private auditService: any;
  
  constructor(db: any, auditService: any) {
    this.db = db;
    this.auditService = auditService;
  }
  
  /**
   * Validează datele de import pentru produse
   * Verifică formatul și obligativitatea câmpurilor
   * 
   * @param data - Date de import sub formă de array de obiecte
   * @returns Raport de validare
   */
  async validateProductImport(data: any[]): Promise<ImportValidationReport> {
    const report: ImportValidationReport = {
      isValid: true,
      totalRows: data.length,
      validRows: 0,
      invalidRows: 0,
      errors: [],
      validData: [],
    };
    
    if (!Array.isArray(data) || data.length === 0) {
      report.isValid = false;
      report.errors.push({
        row: 0,
        errors: ['Fișierul de import nu conține date valide sau este gol'],
      });
      return report;
    }
    
    // Procesează fiecare rând de date
    for (let i = 0; i < data.length; i++) {
      const rowNumber = i + 1; // Pentru afișarea în raport (indexat de la 1)
      const row = data[i];
      
      try {
        // Validează datele folosind schema Zod
        const result = ProductImportRowSchema.safeParse(row);
        
        if (result.success) {
          report.validRows++;
          report.validData.push(result.data);
        } else {
          report.invalidRows++;
          report.errors.push({
            row: rowNumber,
            errors: result.error.issues.map((err: any) => 
              `${err.path.join('.')}: ${err.message}`
            ),
          });
          report.isValid = false;
        }
      } catch (error) {
        report.invalidRows++;
        report.errors.push({
          row: rowNumber,
          errors: [`Eroare la procesarea rândului: ${(error as any)?.message || 'Eroare necunoscută'}`],
        });
        report.isValid = false;
      }
    }
    
    return report;
  }
  
  /**
   * Verifică dacă există un cod de bare în baza de date
   * 
   * @param barcode - Codul de bare de verificat
   * @returns true dacă există, false în caz contrar
   */
  async barcodeExists(barcode: string): Promise<boolean> {
    const result = await this.db.query(
      this.db.client
        .select({ id: inventoryProducts.id })
        .from(inventoryProducts)
        .where(eq(inventoryProducts.barcode, barcode))
        .limit(1)
    );
    
    return result.length > 0;
  }
  
  /**
   * Verifică dacă există un produs cu același SKU
   * 
   * @param sku - SKU-ul de verificat
   * @param companyId - ID-ul companiei
   * @returns Produsul găsit sau null
   */
  async getProductBySku(sku: string, companyId: string): Promise<any | null> {
    // Note: inventoryProducts schema doesn't have companyId field
    // TODO: Add companyId to schema if multi-company support is needed
    const products = await this.db.query(
      this.db.client
        .select()
        .from(inventoryProducts)
        .where(eq(inventoryProducts.sku, sku))
        .limit(1)
    );
    
    return products.length > 0 ? products[0] : null;
  }
  
  /**
   * Verifică dacă există un produs cu același nume
   * 
   * @param name - Numele produsului de verificat
   * @param companyId - ID-ul companiei
   * @returns Produsul găsit sau null
   */
  async getProductByName(name: string, companyId: string): Promise<any | null> {
    // Note: inventoryProducts schema doesn't have companyId field
    // TODO: Add companyId to schema if multi-company support is needed
    const products = await this.db.query(
      this.db.client
        .select()
        .from(inventoryProducts)
        .where(eq(inventoryProducts.name, name))
        .limit(1)
    );
    
    return products.length > 0 ? products[0] : null;
  }
  
  /**
   * Importă produse în baza de date
   * Procesează datele validate anterior
   * 
   * @param validatedData - Date validate
   * @param options - Opțiuni de import
   * @returns Rezultatul importului
   */
  async importProducts(validatedData: ProductImportRow[], options: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      message: 'Import finalizat cu succes',
      report: {
        processedRows: validatedData.length,
        createdRows: 0,
        updatedRows: 0,
        skippedRows: 0,
        errors: [],
      }
    };
    
    for (let i = 0; i < validatedData.length; i++) {
      const rowNumber = i + 1;
      const productData = validatedData[i];
      
      try {
        if (options.mode === 'create') {
          // Mod creare - inserează un produs nou
          await this.createProduct(productData, options, rowNumber, result);
        } else {
          // Mod actualizare - actualizează un produs existent
          await this.updateProduct(productData, options, rowNumber, result);
        }
      } catch (error) {
        result.report!.errors.push({
          row: rowNumber,
          errors: [`Eroare la procesarea rândului: ${(error as any)?.message || 'Eroare necunoscută'}`],
        });
      }
    }
    
    // Actualizează mesajul final
    result.message = `Import finalizat: ${result.report!.createdRows} produse create, ${result.report!.updatedRows} produse actualizate, ${result.report!.skippedRows} produse ignorate, ${result.report!.errors.length} erori`;
    result.success = result.report!.errors.length === 0;
    
    return result;
  }
  
  /**
   * Creează un produs nou în baza de date
   */
  private async createProduct(
    productData: ProductImportRow, 
    options: ImportOptions,
    rowNumber: number,
    result: ImportResult
  ): Promise<void> {
    // Verifică dacă produsul există deja (după SKU)
    const existingProduct = await this.getProductBySku(productData.sku, options.companyId);
    
    if (existingProduct) {
      result.report!.skippedRows++;
      result.report!.errors.push({
        row: rowNumber,
        errors: [`Produsul cu SKU ${productData.sku} există deja. Folosiți modul de actualizare pentru a-l modifica.`],
      });
      return;
    }
    
    // Generează un ID unic pentru noul produs
    const productId = uuidv4();
    
    // Generează un cod de bare unic
    let barcode = '';
    if (options.generateBarcodes) {
      barcode = await generateUniqueEAN13(
        options.companyId,
        productId,
        this.barcodeExists.bind(this)
      );
    }
    
    // Setează prețul de achiziție dacă nu este specificat
    const purchasePrice = productData.purchasePrice || productData.price * 0.8;
    
    // Folosim direct SKU ca identificator pentru produs
    // Nu mai este nevoie de un cod separat
    
    // Creează produsul în baza de date
    await this.db.query(
      this.db.client.insert(inventoryProducts).values({
        id: productId,
        companyId: options.companyId,
        name: productData.name,
        sku: productData.sku,
        description: productData.description || '',
        categoryId: productData.categoryId,
        unitId: productData.unitId,
        barcode: barcode,
        sellingPrice: productData.price,
        purchasePrice: purchasePrice,
        vatRate: productData.vatRate || 19,
        stockAlert: productData.stockAlert || 5,
        isActive: productData.isActive === undefined ? true : productData.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
    
    result.report!.createdRows++;
    
    // Înregistrează acțiunea în jurnalul de audit
    this.auditService.log({
      entityId: productId,
      entityType: 'inventoryProducts',
      action: 'create',
      userId: 'system',
      companyId: options.companyId,
      details: {
        method: 'import',
        importMode: options.mode,
      },
    });
  }
  
  /**
   * Actualizează un produs existent în baza de date
   */
  private async updateProduct(
    productData: ProductImportRow, 
    options: ImportOptions,
    rowNumber: number,
    result: ImportResult
  ): Promise<void> {
    let existingProduct;
    
    // Căutăm produsul după câmpul specificat în opțiunile de import
    if (options.matchField === 'name') {
      existingProduct = await this.getProductByName(productData.name, options.companyId);
    } else {
      // Default: sku
      existingProduct = await this.getProductBySku(productData.sku, options.companyId);
    }
    
    if (!existingProduct) {
      result.report!.skippedRows++;
      result.report!.errors.push({
        row: rowNumber,
        errors: [
          `Produsul cu ${options.matchField === 'name' ? 'numele' : 'SKU'} "${
            options.matchField === 'name' ? productData.name : productData.sku
          }" nu există. Folosiți modul de creare pentru a-l adăuga.`
        ],
      });
      return;
    }
    
    // Actualizează produsul în baza de date
    await this.db.query(
      this.db.client.update(inventoryProducts)
        .set({
          name: productData.name,
          sku: productData.sku,
          description: productData.description ?? existingProduct.description,
          categoryId: productData.categoryId ?? existingProduct.categoryId,
          unitId: productData.unitId ?? existingProduct.unitId,
          sellingPrice: productData.price,
          purchasePrice: productData.purchasePrice ?? existingProduct.purchasePrice,
          vatRate: productData.vatRate ?? existingProduct.vatRate,
          stockAlert: productData.stockAlert ?? existingProduct.stockAlert,
          isActive: productData.isActive ?? existingProduct.isActive,
          updatedAt: new Date(),
        })
        .where(eq(inventoryProducts.id, existingProduct.id))
    );
    
    result.report!.updatedRows++;
    
    // Înregistrează acțiunea în jurnalul de audit
    this.auditService.log({
      entityId: existingProduct.id,
      entityType: 'inventoryProducts',
      action: 'update',
      userId: 'system',
      companyId: options.companyId,
      details: {
        method: 'import',
        importMode: options.mode,
      },
    });
  }
}