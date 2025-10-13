/**
 * Custom Cypress commands pentru GeniusERP
 */

/// <reference types="cypress" />

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });
});

// API request with auth
Cypress.Commands.add('apiRequest', (method: string, url: string, body?: Record<string, unknown>) => {
  const token = window.localStorage.getItem('authToken');
  
  return cy.request({
    method: method as Cypress.HttpMethod,
    url: `${Cypress.env('apiUrl')}${url}`,
    body,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    failOnStatusCode: false,
  });
});

// Wait for API call
Cypress.Commands.add('waitForApi', (alias: string, timeout: number = 10000) => {
  cy.wait(alias, { timeout });
});

// Intercept and wait
Cypress.Commands.add('interceptAndWait', (method: string, url: string, alias: string) => {
  cy.intercept(method, url).as(alias);
});

// Check toast message
Cypress.Commands.add('checkToast', (message: string) => {
  cy.get('[role="alert"]', { timeout: 10000 })
    .should('be.visible')
    .and('contain', message);
});

// Declare types for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      apiRequest(method: string, url: string, body?: Record<string, unknown>): Chainable<Response<unknown>>;
      waitForApi(alias: string, timeout?: number): Chainable<unknown>;
      interceptAndWait(method: string, url: string, alias: string): Chainable<void>;
      checkToast(message: string): Chainable<void>;
    }
  }
}

export {};
