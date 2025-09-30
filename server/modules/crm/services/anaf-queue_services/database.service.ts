/**
 * AnafDatabaseService - Serviciu pentru stocarea datelor ANAF
 * 
 * Gestionează interacțiunile cu baza de date pentru datele companiilor obținute de la ANAF
 */

import { getDrizzleInstance } from '../../../../common/drizzle/db';
import { anafCompanyData as anaf_company_data } from '../../../crm/schema/crm.schema';
import { AnafCompanyData } from '../anaf.service';
import { SQL, and, eq, sql } from 'drizzle-orm';

// Get database instance 
const db = getDrizzleInstance();

export class AnafDatabaseService {
  
  /**
   * Obține datele unei companii după CUI
   * 
   * @param cui CUI-ul companiei
   * @returns Datele companiei din API-ul ANAF sau null dacă nu există
   */
  async getCompanyData(cui: string): Promise<AnafCompanyData | null> {
    try {
      // Normalizăm CUI-ul pentru interogare (eliminăm prefixul RO și păstrăm doar cifrele)
      const normalizedCui = typeof cui === 'string' 
        ? cui.replace(/^RO/i, '').replace(/[^0-9]/g, '')
        : String(cui).replace(/^RO/i, '').replace(/[^0-9]/g, '');
      
      console.log(`[AnafDatabaseService] 🔍 Căutare date în DB pentru CUI ${normalizedCui}`);
      
      // Interogăm tabela anaf_company_data
      const result = await db.select()
        .from(anaf_company_data)
        .where(eq(anaf_company_data.cui, normalizedCui))
        .limit(1);
      
      if (result.length > 0) {
        const companyData = result[0];
        console.log(`[AnafDatabaseService] ✅ Date găsite în DB pentru CUI ${normalizedCui}`);
        
        // Verificăm dacă avem un răspuns RAW salvat
        if (companyData.rawResponse) {
          try {
            const parsedData = typeof companyData.rawResponse === 'string'
              ? JSON.parse(companyData.rawResponse)
              : companyData.rawResponse;
            
            console.log(`[AnafDatabaseService] ✅ Returnare date din DB pentru CUI ${normalizedCui}`);
            return parsedData as AnafCompanyData;
          } catch (error) {
            console.error(`[AnafDatabaseService] Eroare la parsarea datelor pentru CUI ${normalizedCui}:`, error);
            return null;
          }
        } else {
          console.error(`[AnafDatabaseService] Lipsă câmp rawResponse pentru CUI ${normalizedCui}`);
        }
      } else {
        console.log(`[AnafDatabaseService] ❌ Nu s-au găsit date în DB pentru CUI ${normalizedCui}`);
      }
      
      return null;
    } catch (error) {
      console.error(`[AnafDatabaseService] Eroare la obținerea datelor pentru CUI ${cui}:`, error);
      return null;
    }
  }
  
  /**
   * Salvează datele unei companii
   * 
   * @param cui CUI-ul companiei
   * @param data Datele companiei
   * @returns true dacă operațiunea a reușit, false altfel
   */
  async saveCompanyData(cui: string, data: AnafCompanyData): Promise<boolean> {
    try {
      // Normalizăm CUI-ul pentru a ne asigura că nu avem caracterele RO și alte non-numerice
      const normalizedCui = typeof cui === 'string' 
        ? cui.replace(/^RO/i, '').replace(/[^0-9]/g, '')
        : String(cui).replace(/^RO/i, '').replace(/[^0-9]/g, '');
      
      // Extragem datele necesare din obiectul ANAF
      const companyData = data.date_generale || {};
      const inactivStatus = data.stare_inactiv || {};
      const rTvaiData = data.inregistrare_RTVAI || {};
      const sediuSocialData = data.adresa_sediu_social || {};
      const splitTvaData = data.inregistrare_SplitTVA || {};
      const scopTva = data.inregistrare_scop_Tva || {};
      const domFiscalData = data.adresa_domiciliu_fiscal || {};
      
      // Verificăm existența și corectitudinea datelor extrase
      const denumire = companyData.denumire;
      const adresa = companyData.adresa;
      const nrRegCom = companyData.nrRegCom;
      
      if (!denumire) {
        console.warn(`[AnafDatabaseService] ⚠️ Lipsă denumire în datele ANAF pentru CUI ${normalizedCui}`);
      }

      // Datele pentru perioade TVA
      let perioade_tva = [];
      if (scopTva.perioade_TVA && Array.isArray(scopTva.perioade_TVA)) {
        perioade_tva = scopTva.perioade_TVA;
      }
      
      // Extragem date specifice din obiect - perioade și mesaje TVA
      let data_inceput_scp_tva = null;
      let data_sfarsit_scp_tva = null;
      let data_anul_imp_scp_tva = null;
      let mesaj_scp_tva = null;
      
      if (scopTva.perioade_TVA && Array.isArray(scopTva.perioade_TVA) && scopTva.perioade_TVA.length > 0) {
        const lastPeriod = scopTva.perioade_TVA[0]; // Presupunem că prima perioadă e cea mai recentă
        data_inceput_scp_tva = lastPeriod.data_inceput_ScpTVA || null;
        data_sfarsit_scp_tva = lastPeriod.data_sfarsit_ScpTVA || null;
        data_anul_imp_scp_tva = lastPeriod.data_anul_imp_ScpTVA || null;
        mesaj_scp_tva = lastPeriod.mesaj_ScpTVA || null;
      }
      
      console.log(`[AnafDatabaseService] 🔄 Salvare date ANAF pentru CUI ${normalizedCui} (${denumire || 'fără denumire'})`);
      
      // Convertim datele în formatul potrivit
      const currentDate = new Date().toISOString();
      
      // Salvăm direct cu SQL folosind INSERT cu ON CONFLICT UPDATE
      // Această abordare este echivalentă cu UPSERT și va actualiza dacă există, altfel inserează
      await db.execute(sql`
        INSERT INTO anaf_company_data (
          cui, 
          data_interogare,
          denumire,
          adresa, 
          nr_reg_com,
          telefon, 
          fax, 
          cod_postal,
          act,
          stare_inregistrare,
          data_inregistrare,
          cod_caen,
          iban,
          status_ro_e_factura,
          organ_fiscal_competent,
          forma_de_proprietate,
          forma_organizare,
          forma_juridica,
          
          /* Date TVA */
          scp_tva,
          data_inceput_scp_tva,
          data_sfarsit_scp_tva,
          data_anul_imp_scp_tva,
          mesaj_scp_tva,
          
          /* Date TVA la încasare */
          data_inceput_tva_inc,
          data_sfarsit_tva_inc,
          data_actualizare_tva_inc,
          data_publicare_tva_inc,
          tip_act_tva_inc,
          status_tva_incasare,
          
          /* Date inactive */
          data_inactivare,
          data_reactivare,
          data_publicare,
          data_radiere,
          status_inactivi,
          
          /* Date split TVA */
          data_inceput_split_tva,
          data_anulare_split_tva,
          status_split_tva,
          
          /* Date sediu social */
          ss_denumire_strada,
          ss_numar_strada,
          ss_denumire_localitate,
          ss_cod_localitate,
          ss_denumire_judet,
          ss_cod_judet,
          ss_cod_judet_auto,
          ss_tara,
          ss_detalii_adresa,
          ss_cod_postal,
          
          /* Date domiciliu fiscal */
          df_denumire_strada,
          df_numar_strada,
          df_denumire_localitate,
          df_cod_localitate,
          df_denumire_judet,
          df_cod_judet,
          df_cod_judet_auto,
          df_tara,
          df_detalii_adresa,
          df_cod_postal,
          
          /* Date sistem */
          perioade_tva,
          raw_response,
          created_at,
          updated_at,
          last_checked_at,
          is_updated_from_anaf
        ) VALUES (
          ${normalizedCui},
          ${currentDate}::date,
          ${denumire || null},
          ${adresa || null},
          ${nrRegCom || null},
          ${companyData.telefon || null},
          ${companyData.fax || null},
          ${companyData.codPostal || null},
          ${companyData.act || null},
          ${companyData.stare_inregistrare || null},
          ${companyData.data_inregistrare || null},
          ${companyData.cod_CAEN || null},
          ${companyData.iban || null},
          ${companyData.statusRO_e_Factura || false},
          ${companyData.organFiscalCompetent || null},
          ${companyData.forma_de_proprietate || null},
          ${companyData.forma_organizare || null},
          ${companyData.forma_juridica || null},
          
          /* Date TVA */
          ${(scopTva.scpTVA === true)},
          ${data_inceput_scp_tva}::date,
          ${data_sfarsit_scp_tva}::date,
          ${data_anul_imp_scp_tva}::date,
          ${mesaj_scp_tva},
          
          /* Date TVA la încasare */
          ${rTvaiData.dataInceputTvaInc || null}::date,
          ${rTvaiData.dataSfarsitTvaInc || null}::date,
          ${rTvaiData.dataActualizareTvaInc || null}::date,
          ${rTvaiData.dataPublicareTvaInc || null}::date,
          ${rTvaiData.tipActTvaInc || null},
          ${(rTvaiData.statusTvaIncasare === true)},
          
          /* Date inactive */
          ${inactivStatus.dataInactivare || null}::date,
          ${inactivStatus.dataReactivare || null}::date,
          ${inactivStatus.dataPublicare || null}::date,
          ${inactivStatus.dataRadiere || null}::date,
          ${(inactivStatus.statusInactivi === true)},
          
          /* Date split TVA */
          ${splitTvaData.dataInceputSplitTVA || null}::date,
          ${splitTvaData.dataAnulareSplitTVA || null}::date,
          ${(splitTvaData.statusSplitTVA === true)},
          
          /* Date sediu social */
          ${sediuSocialData.sdenumire_Strada || null},
          ${sediuSocialData.snumar_Strada || null},
          ${sediuSocialData.sdenumire_Localitate || null},
          ${sediuSocialData.scod_Localitate || null},
          ${sediuSocialData.sdenumire_Judet || null},
          ${sediuSocialData.scod_Judet || null},
          ${sediuSocialData.scod_JudetAuto || null},
          ${sediuSocialData.stara || null},
          ${sediuSocialData.sdetalii_Adresa || null},
          ${sediuSocialData.scod_Postal || null},
          
          /* Date domiciliu fiscal */
          ${domFiscalData.ddenumire_Strada || null},
          ${domFiscalData.dnumar_Strada || null},
          ${domFiscalData.ddenumire_Localitate || null},
          ${domFiscalData.dcod_Localitate || null},
          ${domFiscalData.ddenumire_Judet || null},
          ${domFiscalData.dcod_Judet || null},
          ${domFiscalData.dcod_JudetAuto || null},
          ${domFiscalData.dtara || null},
          ${domFiscalData.ddetalii_Adresa || null},
          ${domFiscalData.dcod_Postal || null},
          
          /* Date sistem */
          ${JSON.stringify(perioade_tva)}::jsonb,
          ${JSON.stringify(data)}::jsonb,
          ${currentDate}::timestamptz,
          ${currentDate}::timestamptz,
          ${currentDate}::timestamptz,
          true
        )
        ON CONFLICT (cui) DO UPDATE SET
          data_interogare = ${currentDate}::date,
          denumire = ${denumire || null},
          adresa = ${adresa || null},
          nr_reg_com = ${nrRegCom || null},
          telefon = ${companyData.telefon || null},
          fax = ${companyData.fax || null},
          cod_postal = ${companyData.codPostal || null},
          act = ${companyData.act || null},
          stare_inregistrare = ${companyData.stare_inregistrare || null},
          data_inregistrare = ${companyData.data_inregistrare || null},
          cod_caen = ${companyData.cod_CAEN || null},
          iban = ${companyData.iban || null},
          status_ro_e_factura = ${companyData.statusRO_e_Factura || false},
          organ_fiscal_competent = ${companyData.organFiscalCompetent || null},
          forma_de_proprietate = ${companyData.forma_de_proprietate || null},
          forma_organizare = ${companyData.forma_organizare || null},
          forma_juridica = ${companyData.forma_juridica || null},
          
          /* Date TVA */
          scp_tva = ${(scopTva.scpTVA === true)},
          data_inceput_scp_tva = ${data_inceput_scp_tva}::date,
          data_sfarsit_scp_tva = ${data_sfarsit_scp_tva}::date,
          data_anul_imp_scp_tva = ${data_anul_imp_scp_tva}::date,
          mesaj_scp_tva = ${mesaj_scp_tva},
          
          /* Date TVA la încasare */
          data_inceput_tva_inc = ${rTvaiData.dataInceputTvaInc || null}::date,
          data_sfarsit_tva_inc = ${rTvaiData.dataSfarsitTvaInc || null}::date,
          data_actualizare_tva_inc = ${rTvaiData.dataActualizareTvaInc || null}::date,
          data_publicare_tva_inc = ${rTvaiData.dataPublicareTvaInc || null}::date,
          tip_act_tva_inc = ${rTvaiData.tipActTvaInc || null},
          status_tva_incasare = ${(rTvaiData.statusTvaIncasare === true)},
          
          /* Date inactive */
          data_inactivare = ${inactivStatus.dataInactivare || null}::date,
          data_reactivare = ${inactivStatus.dataReactivare || null}::date,
          data_publicare = ${inactivStatus.dataPublicare || null}::date,
          data_radiere = ${inactivStatus.dataRadiere || null}::date,
          status_inactivi = ${(inactivStatus.statusInactivi === true)},
          
          /* Date split TVA */
          data_inceput_split_tva = ${splitTvaData.dataInceputSplitTVA || null}::date,
          data_anulare_split_tva = ${splitTvaData.dataAnulareSplitTVA || null}::date,
          status_split_tva = ${(splitTvaData.statusSplitTVA === true)},
          
          /* Date sediu social */
          ss_denumire_strada = ${sediuSocialData.sdenumire_Strada || null},
          ss_numar_strada = ${sediuSocialData.snumar_Strada || null},
          ss_denumire_localitate = ${sediuSocialData.sdenumire_Localitate || null},
          ss_cod_localitate = ${sediuSocialData.scod_Localitate || null},
          ss_denumire_judet = ${sediuSocialData.sdenumire_Judet || null},
          ss_cod_judet = ${sediuSocialData.scod_Judet || null},
          ss_cod_judet_auto = ${sediuSocialData.scod_JudetAuto || null},
          ss_tara = ${sediuSocialData.stara || null},
          ss_detalii_adresa = ${sediuSocialData.sdetalii_Adresa || null},
          ss_cod_postal = ${sediuSocialData.scod_Postal || null},
          
          /* Date domiciliu fiscal */
          df_denumire_strada = ${domFiscalData.ddenumire_Strada || null},
          df_numar_strada = ${domFiscalData.dnumar_Strada || null},
          df_denumire_localitate = ${domFiscalData.ddenumire_Localitate || null},
          df_cod_localitate = ${domFiscalData.dcod_Localitate || null},
          df_denumire_judet = ${domFiscalData.ddenumire_Judet || null},
          df_cod_judet = ${domFiscalData.dcod_Judet || null},
          df_cod_judet_auto = ${domFiscalData.dcod_JudetAuto || null},
          df_tara = ${domFiscalData.dtara || null},
          df_detalii_adresa = ${domFiscalData.ddetalii_Adresa || null},
          df_cod_postal = ${domFiscalData.dcod_Postal || null},
          
          /* Date sistem */
          perioade_tva = ${JSON.stringify(perioade_tva)}::jsonb,
          raw_response = ${JSON.stringify(data)}::jsonb,
          updated_at = ${currentDate}::timestamptz,
          last_checked_at = ${currentDate}::timestamptz,
          is_updated_from_anaf = true
      `);
      
      console.log(`[AnafDatabaseService] ✅ Date salvate cu succes pentru CUI ${cui}`);
      return true;
    } catch (error) {
      console.error(`[AnafDatabaseService] Eroare la salvarea datelor pentru CUI ${cui}:`, error);
      return false;
    }
  }
}