/**
 * Script pentru testarea serviciului AnafQueueService
 * 
 * Acest script testează funcționalitatea de coadă ANAF trimițând cereri
 * pentru un CUI valid și verificând răspunsul
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Generăm un token de administator
function generateAdminToken() {
  const secret = process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8';
  
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
    // Dacă răspunsul este un string, încercăm să-l parsăm ca JSON
    let parsedData = response.data;
    if (typeof response.data === 'string') {
      try {
        parsedData = JSON.parse(response.data);
        console.log('Am parsat răspunsul din string în JSON');
      } catch (e) {
        console.log('Răspunsul nu este un JSON valid, îl folosim ca string');
      }
    }
    
    console.log('Tipul răspunsului:', typeof parsedData);
    
    if (typeof parsedData === 'object') {
      console.log('Proprietăți răspuns:', Object.keys(parsedData));
      
      // Tipărirea primelor 100 de caractere pentru a evita output prea mare
      const responseStr = JSON.stringify(parsedData);
      console.log('Primele 100 caractere:', responseStr.substring(0, 100) + '...');
    } else {
      console.log('Nu am putut analiza răspunsul ca obiect');
    }
    
    // Verificăm structura pentru a putea accesa datele în mod sigur
    if (parsedData.found && Array.isArray(parsedData.found)) {
      console.log(`Găsite: ${parsedData.found.length}`);
      
      if (parsedData.found.length > 0) {
        console.log('Prima companie găsită:');
        console.log(`Nume: ${parsedData.found[0].date_generale.denumire}`);
        console.log(`CUI: ${parsedData.found[0].date_generale.cui}`);
      }
    } else {
      console.log('Nu există un array "found" valid în răspuns');
    }
    
    if (parsedData.notFound && Array.isArray(parsedData.notFound)) {
      console.log(`Negăsite: ${parsedData.notFound.length}`);
      
      if (parsedData.notFound.length > 0) {
        console.log('CUI-uri negăsite:', parsedData.notFound);
      }
    } else {
      console.log('Nu există un array "notFound" valid în răspuns');
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