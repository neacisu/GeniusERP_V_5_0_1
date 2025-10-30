/**
 * Global type declarations for client-side code
 */

interface Html2PdfOptions {
  margin?: number | number[];
  filename?: string;
  image?: { type: string; quality: number };
  html2canvas?: { scale: number };
  jsPDF?: { unit: string; format: string; orientation: string };
}

interface Html2Pdf {
  (): Html2PdfInstance;
  from(element: HTMLElement): Html2PdfInstance;
  set(options: Html2PdfOptions): Html2PdfInstance;
  save(filename?: string): Promise<void>;
  output(type: string, options?: any): Promise<any>;
}

interface Html2PdfInstance {
  from(element: HTMLElement): Html2PdfInstance;
  set(options: Html2PdfOptions): Html2PdfInstance;
  save(filename?: string): Promise<void>;
  output(type: string, options?: any): Promise<any>;
}

interface Window {
  html2pdf?: Html2Pdf;
}
