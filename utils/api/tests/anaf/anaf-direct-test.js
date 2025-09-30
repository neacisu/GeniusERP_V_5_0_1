/**
 * Test direct pentru serviciul ANAF
 * Testează funcționalitatea de obținere date pentru CUI 15193236 direct din serviciu
 */

const axios = require('axios');

// Funcție pentru a testa direct API-ul ANAF
async function testAnafV8Api(cui) {
  console.log(`\n🔍 Testare directă API ANAF V8 pentru CUI: ${cui}`);
  try {
    const today = new Date().toISOString().split('T')[0];
    const ANAF_API_V8_URL = 'https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva';
    
    const requestData = [{
      cui: cui,
      data: today
    }];
    
    console.log("Request URL:", ANAF_API_V8_URL);
    console.log("Request data:", JSON.stringify(requestData, null, 2));
    
    const response = await axios.post(ANAF_API_V8_URL, requestData, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      timeout: 30000
    });
    
    console.log(`\n✅ API V8 Status: ${response.status}`);
    
    let responseData = response.data;
    if (typeof responseData === "string") {
      responseData = JSON.parse(responseData);
    }
    
    console.log("\nStructura răspuns:", Object.keys(responseData));
    
    if (responseData.found && responseData.found.length > 0) {
      console.log(`\n✅ Date găsite pentru CUI ${cui} în API V8`);
      console.log("Denumire:", responseData.found[0].date_generale.denumire);
      console.log("Nr. Reg. Com.:", responseData.found[0].date_generale.nrRegCom);
      return responseData.found[0];
    } else {
      console.log(`\n❌ Nu am găsit date pentru CUI ${cui} în API V8`);
      return null;
    }
  } catch (error) {
    console.error(`\n❌ Eroare la API V8 pentru CUI ${cui}:`, error.message);
    return null;
  }
}

// Funcție pentru a testa direct API-ul ANAF V9
async function testAnafV9Api(cui) {
  console.log(`\n🔍 Testare directă API ANAF V9 pentru CUI: ${cui}`);
  try {
    const today = new Date().toISOString().split('T')[0];
    const ANAF_API_V9_URL = 'https://webservicesp.anaf.ro/api/v9/ws/tva';
    
    const requestData = [{
      cui: cui,
      data: today
    }];
    
    console.log("Request URL:", ANAF_API_V9_URL);
    console.log("Request data:", JSON.stringify(requestData, null, 2));
    
    const response = await axios.post(ANAF_API_V9_URL, requestData, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      timeout: 30000
    });
    
    console.log(`\n✅ API V9 Status: ${response.status}`);
    
    let responseData = response.data;
    if (typeof responseData === "string") {
      responseData = JSON.parse(responseData);
    }
    
    console.log("\nStructura răspuns:", Object.keys(responseData));
    
    if (responseData.found && responseData.found.length > 0) {
      console.log(`\n✅ Date găsite pentru CUI ${cui} în API V9`);
      console.log("Denumire:", responseData.found[0].date_generale.denumire);
      console.log("Nr. Reg. Com.:", responseData.found[0].date_generale.nrRegCom);
      return responseData.found[0];
    } else {
      console.log(`\n❌ Nu am găsit date pentru CUI ${cui} în API V9`);
      return null;
    }
  } catch (error) {
    console.error(`\n❌ Eroare la API V9 pentru CUI ${cui}:`, error.message);
    return null;
  }
}

// Funcția principală de testare
async function testAnafForCui(cui) {
  console.log(`\n📊 Test complet pentru CUI: ${cui}`);
  
  // Test API V8
  const v8Result = await testAnafV8Api(cui);
  
  // Test API V9
  const v9Result = await testAnafV9Api(cui);
  
  // Comparare rezultate
  if (v8Result && v9Result) {
    console.log(`\n✅ Ambele API-uri au returnat date pentru CUI ${cui}`);
    console.log(`V8 Denumire: ${v8Result.date_generale.denumire}`);
    console.log(`V9 Denumire: ${v9Result.date_generale.denumire}`);
  } else if (v8Result) {
    console.log(`\n⚠️ Doar API V8 a returnat date pentru CUI ${cui}`);
  } else if (v9Result) {
    console.log(`\n⚠️ Doar API V9 a returnat date pentru CUI ${cui}`);
  } else {
    console.log(`\n❌ Niciun API nu a returnat date pentru CUI ${cui}`);
  }
}

// Rulăm testul cu CUI-ul specific
const testCui = '15193236';
testAnafForCui(testCui).catch(console.error);
