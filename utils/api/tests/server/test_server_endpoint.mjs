import axios from "axios";

console.log("Testăm direct serviciile server-ului pentru CUI 15193236");

async function testServerEndpoint() {
  try {
    // Obținem un token valid de la server prin autentificare
    console.log("\n🔑 Obținem un token de autentificare...");
    
    const loginResponse = await axios.post("http://localhost:5000/api/auth/login", {
      username: "admin_test",
      password: "password123"  // presupunem o parolă standard pentru test
    });
    
    console.log("Status autentificare:", loginResponse.status);
    
    if (!loginResponse.data || !loginResponse.data.token) {
      console.log("Răspuns de autentificare:", loginResponse.data);
      throw new Error("Nu am primit token în răspunsul de autentificare");
    }
    
    const token = loginResponse.data.token;
    console.log("Token obținut:", token.substring(0, 20) + "...");
    
    // Testăm endpoint-ul de companie
    console.log("\n🔍 Testăm endpoint-ul /api/crm/company/15193236");
    
    const companyResponse = await axios.get("http://localhost:5000/api/crm/company/15193236", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    console.log("Status răspuns:", companyResponse.status);
    console.log("Date company:", JSON.stringify(companyResponse.data, null, 2));
    
  } catch (error) {
    console.error("\n❌ Eroare:", error.message);
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

testServerEndpoint().catch(console.error);

