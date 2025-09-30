/**
 * Script pentru testarea serviciului AnafQueueService
 * 
 * Acest script testează funcționalitatea de coadă ANAF trimițând cereri
 * pentru un CUI valid și verificând răspunsul
 */

const axios = require('axios');

// Generăm un token de administator
function generateAdminToken() {
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'secret';
  
  const adminPayload = {
    id: '00000000-0000-0000-0000-000000000000',
    role: 'admin',
    companyId: '00000000-0000-0000-0000-000000000000',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 oră
  };
  
  return jwt.sign(adminPayload, secret);
}

// CUI-uri valide pentru test
const validCUIs = [
  '45905018', // Un CUI valid
  '14399840', // Alt CUI valid
  'RO1234567', // Cu prefix RO
  '1234567' // Fără prefix RO
];

// Testează ruta pentru un singur CUI
async function testSingleCompany() {
  const token = generateAdminToken();
  
  try {
    console.log('Testare interogare pentru un singur CUI...');
    
    const response = await axios.get(`http://localhost:5000/api/crm/company/${validCUIs[0]}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Răspuns primit cu succes pentru un singur CUI:');
    console.log(`Status: ${response.status}`);
    console.log(`Nume companie: ${response.data.date_generale.denumire}`);
    console.log(`CUI: ${response.data.date_generale.cui}`);
    console.log(`TVA: ${response.data.inregistrare_scop_Tva?.scpTVA ? 'Da' : 'Nu'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Eroare la interogarea unui singur CUI:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Răspuns:', error.response.data);
    }
    return false;
  }
}

// Testează ruta batch pentru mai multe CUI-uri
async function testBatchCompanies() {
  const token = generateAdminToken();
  
  try {
    console.log('Testare interogare batch pentru mai multe CUI-uri...');
    
    const response = await axios.post('http://localhost:5000/api/crm/companies/batch', {
      cuiList: validCUIs
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Răspuns batch primit cu succes:');
    console.log(`Status: ${response.status}`);
    console.log(`Găsite: ${response.data.found.length}`);
    console.log(`Negăsite: ${response.data.notFound.length}`);
    
    if (response.data.found.length > 0) {
      console.log('Prima companie găsită:');
      console.log(`Nume: ${response.data.found[0].date_generale.denumire}`);
      console.log(`CUI: ${response.data.found[0].date_generale.cui}`);
    }
    
    if (response.data.notFound.length > 0) {
      console.log('CUI-uri negăsite:', response.data.notFound);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Eroare la interogarea batch:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Răspuns:', error.response.data);
    }
    return false;
  }
}

// Rulează ambele teste în secvență
async function runTests() {
  console.log('🚀 Începe testarea serviciului AnafQueueService');
  
  // Test pentru un singur CUI
  const singleResult = await testSingleCompany();
  
  // Așteptăm puțin între teste
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test pentru batch de CUI-uri
  const batchResult = await testBatchCompanies();
  
  console.log('\n📊 Rezultate test:');
  console.log(`Test singur CUI: ${singleResult ? '✅ SUCCES' : '❌ EȘUAT'}`);
  console.log(`Test batch CUI-uri: ${batchResult ? '✅ SUCCES' : '❌ EȘUAT'}`);
  
  if (singleResult && batchResult) {
    console.log('\n🎉 Toate testele au trecut cu succes! Serviciul AnafQueueService funcționează corect.');
  } else {
    console.log('\n⚠️ Unele teste au eșuat. Verificați logurile pentru detalii.');
  }
}

// Rulăm testele
runTests();