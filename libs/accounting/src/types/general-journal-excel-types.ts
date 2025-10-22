/**
 * General Journal Excel Export Types
 * 
 * Tipuri pentru export Excel Registru Jurnal conform OMFP 2634/2015
 * Include tipuri pentru biblioteca XLSX și structurile de date specifice
 */

/**
 * Interface pentru opțiunile de export Excel
 */
export interface ExcelExportOptions {
  companyId: string;
  companyName: string;
  startDate: Date;
  endDate: Date;
  journalTypes?: string[];
  includeReversals?: boolean;
  responsiblePersonName?: string;
  includeMetadata?: boolean; // Include foi suplimentare cu metadata
}

/**
 * Interface pentru datele de export (mapped din query results)
 */
export interface ExcelJournalEntry {
  rowNumber: number;
  journalNumber: string;
  entryDate: string;
  documentDate: string;
  documentType: string;
  documentNumber: string;
  description: string;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
  amount: number; // Total amount (max of debit/credit)
  journalType: string;
  entryId: string;
}

/**
 * XLSX Library Types
 * Definim interfețe pentru obiectele XLSX pentru type safety
 */

/**
 * XLSX Worksheet object
 */
export interface XLSXWorksheet {
  [key: string]: XLSXCell | XLSXColumnInfo[] | XLSXRange[] | string | undefined;
  '!ref'?: string;
  '!cols'?: XLSXColumnInfo[];
  '!rows'?: XLSXRowInfo[];
  '!merges'?: XLSXRange[];
}

/**
 * XLSX Cell object
 */
export interface XLSXCell {
  v?: string | number | boolean | Date;
  t?: 'b' | 'n' | 's' | 'd' | 'z' | 'e';
  f?: string;
  w?: string;
  s?: XLSXCellStyle;
}

/**
 * XLSX Cell Style
 */
export interface XLSXCellStyle {
  font?: {
    name?: string;
    sz?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: { rgb?: string };
  };
  fill?: {
    fgColor?: { rgb?: string };
    bgColor?: { rgb?: string };
    patternType?: string;
  };
  border?: {
    top?: XLSXBorder;
    bottom?: XLSXBorder;
    left?: XLSXBorder;
    right?: XLSXBorder;
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'middle' | 'bottom';
    wrapText?: boolean;
  };
  numFmt?: string;
}

/**
 * XLSX Border style
 */
export interface XLSXBorder {
  style?: 'thin' | 'medium' | 'thick' | 'double';
  color?: { rgb?: string };
}

/**
 * XLSX Column info (width in characters)
 */
export interface XLSXColumnInfo {
  wch?: number;  // width in characters
  wpx?: number;  // width in pixels
  hidden?: boolean;
}

/**
 * XLSX Row info
 */
export interface XLSXRowInfo {
  hpx?: number;  // height in pixels
  hpt?: number;  // height in points
  hidden?: boolean;
}

/**
 * XLSX Range (for merges)
 */
export interface XLSXRange {
  s: { r: number; c: number }; // start
  e: { r: number; c: number }; // end
}

/**
 * XLSX Workbook object
 */
export interface XLSXWorkbook {
  SheetNames: string[];
  Sheets: { [key: string]: XLSXWorksheet };
  Props?: XLSXProperties;
  Custprops?: { [key: string]: string };
}

/**
 * XLSX Workbook properties
 */
export interface XLSXProperties {
  Title?: string;
  Subject?: string;
  Author?: string;
  Manager?: string;
  Company?: string;
  Category?: string;
  Keywords?: string;
  Comments?: string;
  LastAuthor?: string;
  CreatedDate?: Date;
}

/**
 * XLSX Utils interface (methods we use from the library)
 */
export interface XLSXUtils {
  book_new(): XLSXWorkbook;
  book_append_sheet(workbook: XLSXWorkbook, worksheet: XLSXWorksheet, name: string): void;
  aoa_to_sheet(data: unknown[][]): XLSXWorksheet;
  json_to_sheet(data: unknown[]): XLSXWorksheet;
}

/**
 * XLSX Main interface (the library object)
 */
export interface XLSXLibrary {
  utils: XLSXUtils;
  writeFile(workbook: XLSXWorkbook, filename: string, options?: XLSXWriteOptions): void;
  write(workbook: XLSXWorkbook, options?: XLSXWriteOptions): string | ArrayBuffer;
  read(data: string | ArrayBuffer, options?: XLSXReadOptions): XLSXWorkbook;
  readFile(filename: string, options?: XLSXReadOptions): XLSXWorkbook;
}

/**
 * XLSX Write options
 */
export interface XLSXWriteOptions {
  type?: 'base64' | 'binary' | 'buffer' | 'file' | 'array' | 'string';
  bookType?: 'xlsx' | 'xlsm' | 'xlsb' | 'xls' | 'csv' | 'txt' | 'html';
  bookSST?: boolean;
  compression?: boolean;
}

/**
 * XLSX Read options
 */
export interface XLSXReadOptions {
  type?: 'base64' | 'binary' | 'buffer' | 'file' | 'array' | 'string';
  raw?: boolean;
  cellDates?: boolean;
  cellStyles?: boolean;
  sheetRows?: number;
}

/**
 * Summary data per journal type
 */
export interface JournalTypeSummary {
  count: number;
  totalDebit: number;
  totalCredit: number;
}

/**
 * Account summary data
 */
export interface AccountSummary {
  name: string;
  usageCount: number;
  totalDebit: number;
  totalCredit: number;
}
