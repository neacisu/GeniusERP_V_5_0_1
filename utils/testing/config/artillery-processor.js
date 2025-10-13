/**
 * Artillery processor pentru custom logic
 */

module.exports = {
  // Setup function - rulează o dată la început
  setupTest: (context, events, done) => {
    console.log('🚀 Artillery Test Setup');
    done();
  },
  
  // Before request hook
  beforeRequest: (requestParams, context, ee, next) => {
    // Adaugă correlation ID pentru tracking
    requestParams.headers['X-Correlation-ID'] = `artillery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return next();
  },
  
  // After response hook
  afterResponse: (requestParams, response, context, ee, next) => {
    // Log erori
    if (response.statusCode >= 400) {
      console.error(`❌ Error response: ${response.statusCode} - ${requestParams.url}`);
    }
    return next();
  },
  
  // Custom function pentru generare date random
  generateRandomEmail: (context, events, done) => {
    context.vars.randomEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
    return done();
  },
  
  // Custom function pentru generare token
  generateTestToken: (context, events, done) => {
    // Aici poți adăuga logica de generare token
    context.vars.testToken = 'test-token-' + Date.now();
    return done();
  },
};

