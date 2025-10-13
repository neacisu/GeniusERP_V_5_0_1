/**
 * Support file pentru Cypress
 */

/// <reference types="cypress" />

// Import commands
import './cypress.commands';

// Global configuration
Cypress.on('uncaught:exception', (_err) => {
  // Return false to prevent the test from failing on uncaught exceptions
  // You can customize this to only catch specific errors
  return false;
});

// Before each test
beforeEach(() => {
  // Clear local storage and cookies
  cy.clearLocalStorage();
  cy.clearCookies();
});

// After each test - screenshot on failure
Cypress.Screenshot.defaults({
  screenshotOnRunFailure: true,
});

export {};
