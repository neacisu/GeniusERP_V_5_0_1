/**
 * Type definitions for General Journal PDF Service
 * Tipuri pentru generarea PDF-ului Registrului Jurnal conform OMFP 2634/2015
 */

/**
 * Lățimi coloane pentru tabelul PDF
 * Conform layout A4 landscape (842pt width, minus 60pt margins = 782pt)
 */
export interface ColumnWidths {
  nr: number;           // Nr. crt.
  data: number;         // Data înregistrării
  docType: number;      // Felul documentului
  docNo: number;        // Numărul documentului
  docDate: number;      // Data documentului
  explanations: number; // Explicația operațiunii
  accountDr: number;    // Cont debit
  accountCr: number;    // Cont credit
  amount: number;       // Suma (lei)
  total_amount?: number; // optional snake_case
}

/**
 * Date pentru un rând în tabelul PDF
 */
export interface TableRowData {
  nr: string;           // Nr. crt.
  data: string;         // Data înregistrării (formatată)
  docType: string;      // Tip document (etichetă citibilă)
  docNo: string;        // Nr. document
  docDate: string;      // Data document (formatată)
  explanations: string; // Descriere operațiune
  accountDr: string;    // Cont debit
  accountCr: string;    // Cont credit
  amount: string;       // Sumă formatată
  total_amount?: string; // optional snake_case
}

/**
 * Opțiuni de aliniere text în PDF
 */
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

/**
 * Structură pentru header tabel
 */
export interface TableHeader {
  text: string;
  width: number;
}

/**
 * Structură pentru valori în rând tabel
 */
export interface TableValue {
  text: string | undefined;
  width: number;
  align: TextAlign;
}
