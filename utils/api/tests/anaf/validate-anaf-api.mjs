/**
 * Script de validare finală pentru API-ul ANAF
 * Testează direct API-ul ANAF V8 și V9 pentru CUI-ul 15193236
 */

import axios from 'axios';

// Funcție pentru testarea API-ului ANAF V8
async function testAnafV8(cui) {
  console.log(`\n🔄 Test API ANAF V8 pentru CUI ${cui}`);
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const url = 'https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva';
    
    const requestData = [{
      cui: cui,
      data: today
    }];
    
    console.log(`🔗 URL: ${url}`);
    console.log(`📦 Payload: ${JSON.stringify(requestData, null, 2)}`);
    
    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });
    
    console.log(`✅ Răspuns V8 statusCode: ${response.status}`);
    
    const responseData = response.data;
    
    // Verificăm dacă compania a fost găsită
    if (responseData.found && responseData.found.length > 0) {
      const company = responseData.found[0];
      console.log(`✅ Companie găsită în V8:`);
      console.log(`   Denumire: ${company.date_generale.denumire}`);
      console.log(`   CUI: ${company.date_generale.cui}`);
      console.log(`   Nr Reg Com: ${company.date_generale.nrRegCom}`);
      return true;
    } else {
      console.log(`❌ Compania nu a fost găsită în V8`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Eroare V8:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Funcție pentru testarea API-ului ANAF V9
async function testAnafV9(cui) {
  console.log(`\n🔄 Test API ANAF V9 pentru CUI ${cui}`);
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const url = 'https://webservicesp.anaf.ro/PlatitorTvaRest/api/v9/ws/tva';
    
    const requestData = [{
      cui: cui,
      data: today
    }];
    
    console.log(`🔗 URL: ${url}`);
    console.log(`📦 Payload: ${JSON.stringify(requestData, null, 2)}`);
    
    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });
    
    console.log(`✅ Răspuns V9 statusCode: ${response.status}`);
    
    const responseData = response.data;
    
    // Verificăm dacă compania a fost găsită
    if (responseData.found && responseData.found.length > 0) {
      const company = responseData.found[0];
      console.log(`✅ Companie găsită în V9:`);
      console.log(`   Denumire: ${company.date_generale.denumire}`);
      console.log(`   CUI: ${company.date_generale.cui}`);
      console.log(`   Nr Reg Com: ${company.date_generale.nrRegCom}`);
      return true;
    } else {
      console.log(`❌ Compania nu a fost găsită în V9`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Eroare V9:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Funcție care testează ambele API-uri și afișează concluziile
async function validateAnafApis() {
  console.log(`📋 VALIDARE FINALĂ API ANAF\n`);
  console.log(`Testăm dacă CUI-ul problematic 15193236 funcționează cu ambele versiuni de API\n`);
  
  const cui = '15193236';
  
  // Verificăm V8
  const v8Works = await testAnafV8(cui);
  
  // Verificăm V9
  const v9Works = await testAnafV9(cui);
  
  // Afișăm concluziile
  console.log(`\n🧪 REZULTATE FINALE:`);
  console.log(`API V8: ${v8Works ? '✅ FUNCȚIONEAZĂ' : '❌ NU FUNCȚIONEAZĂ'}`);
  console.log(`API V9: ${v9Works ? '✅ FUNCȚIONEAZĂ' : '❌ NU FUNCȚIONEAZĂ'}`);
  
  // Verificăm necesitatea fallback-ului
  if (v8Works && !v9Works) {
    console.log(`\n🔄 CONCLUZIE: Strategia noastră de fallback este necesară și corectă!`);
    console.log(`CUI-ul 15193236 funcționează doar cu API-ul V8, deci fallback-ul de la V9 la V8 este esențial.`);
    console.log(`Eliminarea tratamentului special hardcodat și înlocuirea cu strategia universală de fallback este soluția optimă.`);
  } else if (v8Works && v9Works) {
    console.log(`\n🔄 CONCLUZIE: Ambele API-uri funcționează. Strategia de fallback este o măsură de siguranță.`);
  } else if (!v8Works && !v9Works) {
    console.log(`\n⚠️ CONCLUZIE: Niciun API nu funcționează pentru acest CUI. Poate fi o problemă temporară.`);
  } else { // !v8Works && v9Works
    console.log(`\n⚠️ CONCLUZIE: Interesant! API-ul V9 funcționează, dar V8 nu. Acest caz nu era așteptat.`);
  }
}

// Rulăm validarea
validateAnafApis().catch(console.error);
