/**
 * Utilitar pentru procesarea și normalizarea datelor ANAF
 * Asigură conversia corectă a datelor pentru a fi salvate în baza de date
 */

import { AnafCompanyData } from "../services/anaf.service";
import { safeIsoString, nowIsoString } from "./date-utils";

/**
 * Convertește datele ANAF în formatul necesar pentru inserarea în baza de date
 * Garantează că toate câmpurile de tip dată sunt convertite corect
 * 
 * @param company Datele companiei de la ANAF API
 * @param userId ID-ul utilizatorului care a făcut cererea
 * @param companyId ID-ul companiei utilizatorului
 * @returns Un obiect normalizat gata pentru inserare în baza de date
 */
export const normalizeAnafData = (company: AnafCompanyData, userId: string, companyId: string): Record<string, any> => {
  const cui = company.date_generale.cui;
  
  // Tratăm cazul când perioade_TVA poate fi un array sau un obiect direct
  let perioadeArray: any[] = [];
  const perioadeTva = company.inregistrare_scop_Tva?.perioade_TVA;
  
  if (perioadeTva) {
    if (Array.isArray(perioadeTva)) {
      perioadeArray = perioadeTva;
    } else {
      // Dacă nu e array, îl tratăm ca un singur obiect și îl punem într-un array
      perioadeArray = [perioadeTva];
    }
  }
  
  // Obiect normalizat pentru baza de date
  const anafData = {
    cui: cui,
    companyId: companyId, // Legătura cu entitatea care a făcut cererea
    dataInterogare: nowIsoString(), // Folosim funcția din utils pentru data curentă
    
    // Date generale
    denumire: company.date_generale?.denumire || null,
    adresa: company.date_generale?.adresa || null,
    nrRegCom: company.date_generale?.nrRegCom || null,
    telefon: company.date_generale?.telefon || null,
    fax: company.date_generale?.fax || null,
    codPostal: company.date_generale?.codPostal || null,
    act: company.date_generale?.act || null,
    stareInregistrare: company.date_generale?.stare_inregistrare || null,
    
    // Date registru
    dataInregistrare: safeIsoString(company.date_generale?.data_inregistrare),
    dataRadiere: safeIsoString(company.stare_inactiv?.dataRadiere),
    dataPublicare: safeIsoString(company.stare_inactiv?.dataPublicare),
    dataInactivare: safeIsoString(company.stare_inactiv?.dataInactivare),
    dataReactivare: safeIsoString(company.stare_inactiv?.dataReactivare),
    
    // Date TVA
    statusTva: company.inregistrare_scop_Tva?.scpTVA || false,
    dataStartTva: safeIsoString(perioadeArray.length > 0 ? perioadeArray[0].data_inceput_ScpTVA : null),
    dataEndTva: safeIsoString(perioadeArray.length > 0 ? perioadeArray[0].data_sfarsit_ScpTVA : null),
    dataAnulareTva: safeIsoString(perioadeArray.length > 0 ? perioadeArray[0].data_anul_imp_ScpTVA : null),
    
    // Date TVA la încasare
    statusTvaIncasare: company.inregistrare_RTVAI?.statusTvaIncasare || false,
    dataInceputTvaIncasare: safeIsoString(company.inregistrare_RTVAI?.dataInceputTvaInc),
    dataAnulareTvaIncasare: safeIsoString(company.inregistrare_RTVAI?.dataSfarsitTvaInc),
    dataPanaLaTvaIncasare: safeIsoString(company.inregistrare_RTVAI?.dataActualizareTvaInc),
    
    // Date Split TVA
    statusSplitTva: company.inregistrare_SplitTVA?.statusSplitTVA || false,
    dataInceputSplitTva: safeIsoString(company.inregistrare_SplitTVA?.dataInceputSplitTVA),
    dataAnulareSplitTva: safeIsoString(company.inregistrare_SplitTVA?.dataAnulareSplitTVA),
    dataInregistrareTvaSplit: safeIsoString(company.inregistrare_SplitTVA?.dataInceputSplitTVA),
    dataRadiereTvaSplit: safeIsoString(company.inregistrare_SplitTVA?.dataAnulareSplitTVA),
    
    // Date insolvență
    statusInactivi: company.stare_inactiv?.statusInactivi || false,
    dataInceputInactivitate: safeIsoString(company.stare_inactiv?.dataInactivare),
    dataPublicareInactivitate: safeIsoString(company.stare_inactiv?.dataPublicare),
    dataRadiereInactivitate: safeIsoString(company.stare_inactiv?.dataReactivare),
    statusInsolventa: false, // Nu există în API-ul ANAF actual
    dataInceputInsolventa: null,
    dataInchidereInsolventa: null,
    
    // Alte informații
    codCaen: company.date_generale?.cod_CAEN || null,
    iban: company.date_generale?.iban || null,
    statusRoEFactura: company.date_generale?.statusRO_e_Factura || false,
    organFiscalCompetent: company.date_generale?.organFiscalCompetent || null,
    formaJuridica: company.date_generale?.forma_juridica || null,
    formaOrganizare: company.date_generale?.forma_organizare || null,
    
    // Metadate despre înregistrare
    createdBy: userId,
    updatedBy: userId,
    // Folosim nowIsoString pentru a avea consistență în formatul datei
    createdAt: nowIsoString(),
    updatedAt: nowIsoString()
  };
  
  // Returnăm datele normalizate
  return anafData;
};