/**
 * Standardized Testing Framework
 * 
 * This module provides a structured approach to testing various parts of the application
 * and replaces the numerous individual test files with a more organized system.
 */

const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { generateToken } = require('./token-generator');

// Default configuration
const config = {
  baseUrl: process.env.SERVER_URL || 'http://localhost:5000',
  tokenFile: './tokens/test-token.txt',
  verbose: true
};

/**
 * Test Suite - A collection of related tests
 */
class TestSuite {
  /**
   * Create a new test suite
   * @param {string} name - Name of the test suite
   * @param {Object} options - Configuration options
   */
  constructor(name, options = {}) {
    this.name = name;
    this.tests = [];
    this.beforeEach = null;
    this.afterEach = null;
    this.beforeAll = null;
    this.afterAll = null;
    this.config = { ...config, ...options };
    
    // Make sure tokens directory exists
    if (!fs.existsSync('./tokens')) {
      fs.mkdirSync('./tokens', { recursive: true });
    }
    
    // Results tracking
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0
    };
  }

  /**
   * Add a test to the suite
   * @param {string} name - Test name
   * @param {Function} testFn - Test function
   */
  test(name, testFn) {
    this.tests.push({ name, testFn, skip: false });
    return this; // Allow chaining
  }

  /**
   * Add a skipped test to the suite
   * @param {string} name - Test name
   * @param {Function} testFn - Test function
   */
  skip(name, testFn) {
    this.tests.push({ name, testFn, skip: true });
    return this; // Allow chaining
  }

  /**
   * Set function to run before each test
   * @param {Function} fn - Function to run
   */
  setBeforeEach(fn) {
    this.beforeEach = fn;
    return this;
  }

  /**
   * Set function to run after each test
   * @param {Function} fn - Function to run
   */
  setAfterEach(fn) {
    this.afterEach = fn;
    return this;
  }

  /**
   * Set function to run before all tests
   * @param {Function} fn - Function to run
   */
  setBeforeAll(fn) {
    this.beforeAll = fn;
    return this;
  }

  /**
   * Set function to run after all tests
   * @param {Function} fn - Function to run
   */
  setAfterAll(fn) {
    this.afterAll = fn;
    return this;
  }

  /**
   * Run all tests in the suite
   */
  async run() {
    console.log(`\n========================================`);
    console.log(`🧪 Running Test Suite: ${this.name}`);
    console.log(`========================================`);
    
    const startTime = Date.now();
    
    // Run before all hook
    if (this.beforeAll) {
      try {
        console.log('▶️ Running beforeAll hook...');
        await this.beforeAll();
      } catch (error) {
        console.error('❌ Error in beforeAll hook:', error);
        return false;
      }
    }
    
    // Run each test
    for (const test of this.tests) {
      this.results.total++;
      
      if (test.skip) {
        console.log(`\n⏩ SKIPPED: ${test.name}`);
        this.results.skipped++;
        continue;
      }
      
      console.log(`\n▶️ TEST: ${test.name}`);
      
      try {
        // Run before each hook
        if (this.beforeEach) {
          await this.beforeEach();
        }
        
        // Run the test
        await test.testFn();
        
        // Run after each hook
        if (this.afterEach) {
          await this.afterEach();
        }
        
        console.log(`✅ PASSED: ${test.name}`);
        this.results.passed++;
      } catch (error) {
        console.error(`❌ FAILED: ${test.name}`);
        console.error('Error:', error.message);
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
        this.results.failed++;
      }
    }
    
    // Run after all hook
    if (this.afterAll) {
      try {
        console.log('\n▶️ Running afterAll hook...');
        await this.afterAll();
      } catch (error) {
        console.error('❌ Error in afterAll hook:', error);
      }
    }
    
    // Print results
    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n========================================`);
    console.log(`📊 Test Results: ${this.name}`);
    console.log(`----------------------------------------`);
    console.log(`Total tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Skipped: ${this.results.skipped}`);
    console.log(`Duration: ${duration.toFixed(2)}s`);
    console.log(`========================================`);
    
    return this.results.failed === 0;
  }
}

/**
 * API Test Utilities
 */
class ApiTester {
  /**
   * Create a new API tester
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.config = { ...config, ...options };
    this.token = null;
  }

  /**
   * Set authorization token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
    return this;
  }

  /**
   * Load token from file
   * @param {string} tokenFile - Path to token file
   */
  loadToken(tokenFile = this.config.tokenFile) {
    try {
      this.token = fs.readFileSync(tokenFile, 'utf8').trim();
      return this;
    } catch (error) {
      console.error(`Error loading token from ${tokenFile}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate and set a new token
   * @param {Object} options - Token generation options
   */
  generateToken(options = {}) {
    this.token = generateToken({
      outputFile: this.config.tokenFile,
      ...options
    });
    return this;
  }

  /**
   * Make an API request
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} headers - Additional headers
   * @returns {Promise<Object>} Response data
   */
  async request(method, endpoint, data = null, headers = {}) {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const requestHeaders = {
      ...headers
    };
    
    // Add authorization if token is available
    if (this.token) {
      requestHeaders.Authorization = `Bearer ${this.token}`;
    }
    
    if (this.config.verbose) {
      console.log(`\n📡 ${method.toUpperCase()} ${url}`);
      if (data) console.log('Request data:', JSON.stringify(data, null, 2));
    }
    
    try {
      const response = await axios({
        method,
        url,
        data,
        headers: requestHeaders
      });
      
      if (this.config.verbose) {
        console.log(`✅ Status: ${response.status}`);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
      }
      
      return response.data;
    } catch (error) {
      if (this.config.verbose) {
        console.error(`❌ Error: ${error.message}`);
        if (error.response) {
          console.error(`Status: ${error.response.status}`);
          console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
      }
      throw error;
    }
  }

  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} headers - Additional headers
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint, headers = {}) {
    return this.request('get', endpoint, null, headers);
  }

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} headers - Additional headers
   * @returns {Promise<Object>} Response data
   */
  async post(endpoint, data, headers = {}) {
    return this.request('post', endpoint, data, headers);
  }

  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} headers - Additional headers
   * @returns {Promise<Object>} Response data
   */
  async put(endpoint, data, headers = {}) {
    return this.request('put', endpoint, data, headers);
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} headers - Additional headers
   * @returns {Promise<Object>} Response data
   */
  async delete(endpoint, headers = {}) {
    return this.request('delete', endpoint, null, headers);
  }
}

// Export utilities
module.exports = {
  TestSuite,
  ApiTester
};

// If run directly, show usage
if (require.main === module) {
  console.log('Test Framework Usage:');
  console.log('  const { TestSuite, ApiTester } = require("./utils/test-framework");');
  console.log('');
  console.log('  // Create a test suite');
  console.log('  const suite = new TestSuite("API Tests");');
  console.log('');
  console.log('  // Create an API tester');
  console.log('  const api = new ApiTester();');
  console.log('');
  console.log('  // Generate or load a token');
  console.log('  api.generateToken({ type: "admin" });');
  console.log('  // or');
  console.log('  api.loadToken("./tokens/admin-token.txt");');
  console.log('');
  console.log('  // Add tests');
  console.log('  suite.test("Get users", async () => {');
  console.log('    const data = await api.get("/api/users");');
  console.log('    if (!data.users) throw new Error("No users returned");');
  console.log('  });');
  console.log('');
  console.log('  // Run tests');
  console.log('  suite.run();');
}