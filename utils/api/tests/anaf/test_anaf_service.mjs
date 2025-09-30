import axios from "axios";

console.log("Test direct al AnafService pentru CUI 15193236");

async function testAnafService() {
  try {
    const cui = "15193236";
    console.log(`\n🔍 Testare obținere date pentru CUI: ${cui}`);
    
    // Prima încercare folosind API-ul V8 (implementarea noastră de fallback)
    console.log("\n🔄 Testăm direct API-ul ANAF V8...");
    try {
      const today = new Date().toISOString().split("T")[0];
      const ANAF_API_V8_URL = "https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva";
      
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
      console.log("Tip date răspuns:", typeof response.data);
      
      let responseData = response.data;
      if (typeof responseData === "string") {
        console.log("Răspunsul este string, îl parsăm ca JSON");
        responseData = JSON.parse(responseData);
      }
      
      console.log("\nStructura răspuns:", Object.keys(responseData));
      
      if (responseData.found && responseData.found.length > 0) {
        console.log(`\n✅ Date găsite pentru CUI ${cui} în API V8`);
        console.log("Denumire:", responseData.found[0].date_generale.denumire);
        console.log("Nr. Reg. Com.:", responseData.found[0].date_generale.nrRegCom);
      } else {
        console.log(`\n❌ Nu am găsit date pentru CUI ${cui} în API V8`);
        if (responseData.notFound && responseData.notFound.includes(cui)) {
          console.log("CUI-ul este în lista notFound!");
        }
      }
    } catch (v8Error) {
      console.error(`\n❌ Eroare la API V8 pentru CUI ${cui}:`, v8Error.message);
      if (v8Error.response) {
        console.log("Status:", v8Error.response.status);
        console.log("Data:", v8Error.response.data);
      }
    }
    
    // A doua încercare folosind API-ul V9
    console.log("\n\n🔄 Testăm direct API-ul ANAF V9...");
    try {
      const today = new Date().toISOString().split("T")[0];
      const ANAF_API_V9_URL = "https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva";
      
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
      console.log("Tip date răspuns:", typeof response.data);
      
      let responseData = response.data;
      if (typeof responseData === "string") {
        console.log("Răspunsul este string, îl parsăm ca JSON");
        responseData = JSON.parse(responseData);
      }
      
      console.log("\nStructura răspuns:", Object.keys(responseData));
      
      if (responseData.found && responseData.found.length > 0) {
        console.log(`\n✅ Date găsite pentru CUI ${cui} în API V9`);
        console.log("Denumire:", responseData.found[0].date_generale.denumire);
        console.log("Nr. Reg. Com.:", responseData.found[0].date_generale.nrRegCom);
      } else {
        console.log(`\n❌ Nu am găsit date pentru CUI ${cui} în API V9`);
        if (responseData.notFound && responseData.notFound.includes(cui)) {
          console.log("CUI-ul este în lista notFound!");
        }
      }
    } catch (v9Error) {
      console.error(`\n❌ Eroare la API V9 pentru CUI ${cui}:`, v9Error.message);
      if (v9Error.response) {
        console.log("Status:", v9Error.response.status);
        console.log("Data:", v9Error.response.data);
      }
    }
  } catch (error) {
    console.error("\n❌ Eroare generală:", error);
  }
}

testAnafService().catch(console.error);

