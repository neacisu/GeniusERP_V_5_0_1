/**
 * Global teardown pentru Mocha
 */

module.exports = async function() {
  console.log('🧹 Mocha Global Teardown: Curățare mediu de testare...');
  
  // Aici poți adăuga:
  // - Închidere conexiuni database
  // - Oprire servere mock
  // - Ștergere date temporare
  
  console.log('✅ Mocha Global Teardown: Complet');
};

