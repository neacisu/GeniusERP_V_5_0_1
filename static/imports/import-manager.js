/**
 * Import Manager Utility
 * 
 * This utility provides a centralized way to manage different data imports
 * including COR occupations, test data, and other imports.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Default configuration
const config = {
  baseUrl: process.env.SERVER_URL || 'http://localhost:5000',
  dataDir: path.join(__dirname),
  progressDir: path.join(__dirname, 'progress'),
  batchSize: 50,
  tokenGenerator: null // Will be assigned if token generator is available
};

// Make sure progress directory exists
if (!fs.existsSync(config.progressDir)) {
  fs.mkdirSync(config.progressDir, { recursive: true });
}

/**
 * Import manager for handling different data imports
 */
class ImportManager {
  /**
   * Create a new import manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.config = { ...config, ...options };
    this.token = null;
    this.progressFile = null;
    this.progress = {
      total: 0,
      imported: 0,
      failed: 0,
      remaining: [],
      lastBatch: null,
      startTime: null,
      endTime: null
    };
    
    // Try to load token generator if available
    try {
      const tokenGenerator = require('../utils/token-generator');
      this.config.tokenGenerator = tokenGenerator;
    } catch (error) {
      console.log('Token generator not available, using manual token setting');
    }
  }

  /**
   * Set the authorization token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
    return this;
  }

  /**
   * Generate a token using the token generator
   * @param {Object} options - Token generation options
   */
  generateToken(options = {}) {
    if (!this.config.tokenGenerator) {
      throw new Error('Token generator is not available');
    }
    
    this.token = this.config.tokenGenerator.generateToken(options);
    return this;
  }

  /**
   * Load token from file
   * @param {string} tokenFile - Path to token file
   */
  loadToken(tokenFile) {
    try {
      this.token = fs.readFileSync(tokenFile, 'utf8').trim();
      return this;
    } catch (error) {
      console.error(`Error loading token from ${tokenFile}:`, error.message);
      throw error;
    }
  }

  /**
   * Set the progress file to track import progress
   * @param {string} progressFile - Path to progress file
   */
  setProgressFile(progressFile) {
    this.progressFile = path.join(this.config.progressDir, progressFile);
    return this;
  }

  /**
   * Load progress from the progress file
   */
  loadProgress() {
    if (!this.progressFile) {
      throw new Error('Progress file not set');
    }
    
    try {
      if (fs.existsSync(this.progressFile)) {
        this.progress = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
        console.log(`Loaded progress: ${this.progress.imported}/${this.progress.total} items imported`);
      }
      return this;
    } catch (error) {
      console.error(`Error loading progress from ${this.progressFile}:`, error.message);
      throw error;
    }
  }

  /**
   * Save progress to the progress file
   */
  saveProgress() {
    if (!this.progressFile) {
      throw new Error('Progress file not set');
    }
    
    try {
      // Update timestamp
      this.progress.lastUpdated = new Date().toISOString();
      
      // Save progress
      fs.writeFileSync(this.progressFile, JSON.stringify(this.progress, null, 2));
      console.log(`Progress saved: ${this.progress.imported}/${this.progress.total} items imported`);
      return this;
    } catch (error) {
      console.error(`Error saving progress to ${this.progressFile}:`, error.message);
      throw error;
    }
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
    
    try {
      const response = await axios({
        method,
        url,
        data,
        headers: requestHeaders
      });
      
      return response.data;
    } catch (error) {
      console.error(`API Error (${method.toUpperCase()} ${url}):`, error.message);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Import a batch of items
   * @param {Array} items - Items to import
   * @param {string} endpoint - API endpoint for import
   * @param {Function} transformer - Function to transform items before import
   * @returns {Promise<Object>} Import result
   */
  async importBatch(items, endpoint, transformer = null) {
    // Transform items if transformer is provided
    const data = transformer ? items.map(transformer) : items;
    
    // Update progress
    this.progress.lastBatch = {
      time: new Date().toISOString(),
      count: items.length,
      firstItem: items[0]
    };
    
    // Send import request
    try {
      const result = await this.request('post', endpoint, { items: data });
      
      // Update progress
      this.progress.imported += items.length;
      this.progress.remaining = this.progress.remaining.slice(items.length);
      
      return result;
    } catch (error) {
      this.progress.failed += items.length;
      throw error;
    } finally {
      this.saveProgress();
    }
  }

  /**
   * Run the import process
   * @param {Array} items - All items to import
   * @param {string} endpoint - API endpoint for import
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import result
   */
  async runImport(items, endpoint, options = {}) {
    const {
      batchSize = this.config.batchSize,
      transformer = null,
      progressFile = 'import-progress.json'
    } = options;
    
    // Initialize progress
    this.setProgressFile(progressFile);
    
    // Initialize new progress if not loaded
    if (!this.progress.startTime) {
      this.progress = {
        total: items.length,
        imported: 0,
        failed: 0,
        remaining: [...items],
        lastBatch: null,
        startTime: new Date().toISOString(),
        endTime: null
      };
    }
    
    console.log(`Starting import of ${this.progress.remaining.length} remaining items (${this.progress.total} total)`);
    
    // Process batches
    while (this.progress.remaining.length > 0) {
      const batchItems = this.progress.remaining.slice(0, batchSize);
      
      console.log(`Importing batch of ${batchItems.length} items (${this.progress.imported}/${this.progress.total} completed)...`);
      
      try {
        await this.importBatch(batchItems, endpoint, transformer);
        
        // Log progress
        const percentComplete = ((this.progress.imported / this.progress.total) * 100).toFixed(2);
        console.log(`Batch imported successfully (${percentComplete}% complete)`);
        
      } catch (error) {
        console.error('Error importing batch:', error.message);
        
        // Retry with smaller batch if we have a large batch
        if (batchItems.length > 10) {
          console.log('Retrying with smaller batch size...');
          const smallerBatchSize = Math.max(1, Math.floor(batchItems.length / 2));
          
          this.config.batchSize = smallerBatchSize;
          continue;
        }
        
        // If batch size is already small, continue with next batch
        console.log('Skipping failed batch and continuing...');
        this.progress.remaining = this.progress.remaining.slice(batchItems.length);
        this.saveProgress();
      }
      
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Update completion status
    this.progress.endTime = new Date().toISOString();
    this.saveProgress();
    
    console.log(`Import completed: ${this.progress.imported}/${this.progress.total} items imported`);
    return this.progress;
  }
}

// Specialized COR import functionality
const corImporter = {
  /**
   * Create a COR importer
   * @returns {ImportManager} Configured import manager for COR
   */
  create() {
    return new ImportManager({
      batchSize: 50,
      progressDir: path.join(__dirname, 'cor', 'progress')
    }).setProgressFile('cor-import-progress.json');
  },
  
  /**
   * Load occupations from CSV file
   * @param {string} csvFile - Path to CSV file
   * @returns {Array} Parsed occupations
   */
  loadFromCsv(csvFile) {
    try {
      const csv = fs.readFileSync(csvFile, 'utf8');
      const lines = csv.split('\n').filter(line => line.trim());
      
      // Skip header row
      const occupations = lines.slice(1).map(line => {
        const [code, name, description] = line.split(',').map(field => field.trim());
        return { code, name, description };
      });
      
      console.log(`Loaded ${occupations.length} occupations from CSV`);
      return occupations;
    } catch (error) {
      console.error(`Error loading occupations from ${csvFile}:`, error.message);
      throw error;
    }
  },
  
  /**
   * Import occupations into the database
   * @param {Array} occupations - Occupations to import
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Import result
   */
  async importOccupations(occupations, token) {
    const importer = this.create();
    importer.setToken(token);
    
    return importer.runImport(occupations, '/api/hr/occupations/batch', {
      progressFile: 'cor-import-progress.json'
    });
  }
};

// Export utilities
module.exports = {
  ImportManager,
  corImporter
};

// If run directly, show usage
if (require.main === module) {
  console.log('Import Manager Usage:');
  console.log('  const { ImportManager, corImporter } = require("./imports/import-manager");');
  console.log('');
  console.log('  // Import COR occupations');
  console.log('  const occupations = corImporter.loadFromCsv("./data/occupations.csv");');
  console.log('  const token = "your-jwt-token";');
  console.log('  corImporter.importOccupations(occupations, token);');
}