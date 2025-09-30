# API Tests Directory

This directory contains organized test files for various API endpoints, modules, and components.

## Module Categories:

- **accounting/** - Tests for accounting module and ledger functionality
- **admin/** - Tests for admin module, roles, and user management
- **analytics/** - Tests for analytics, BI, and predictive functionality
- **anaf/** - Tests for Romanian tax authority (ANAF) integrations
- **auth/** - Tests for authentication, tokens, and authorization
- **bpm/** - Tests for business process management module
- **collaboration/** - Tests for collaboration and task management
- **communications/** - Tests for communications module
- **crm/** - Tests for customer relationship management module
- **document/** - Tests for document management and versioning
- **hr/** - Tests for human resources module
- **integrations/** - Tests for various third-party integrations
- **inventory/** - Tests for inventory management
- **invoicing/** - Tests for invoice management
- **marketing/** - Tests for marketing module
- **pandadoc/** - Tests for PandaDoc integration
- **sales/** - Tests for sales module
- **server/** - Tests for server functionality
- **settings/** - Tests for settings module
- **stripe/** - Tests for Stripe payment integration
- **utils/** - Utility tests and general API tests

## Running Tests:

Most tests can be run individually or as part of a test suite. Tests typically require authentication tokens, which can be generated using the token generation scripts in the `utils/tokens/scripts` directory.

## Test Naming Convention:

- `test-[component]-[functionality].js` - Regular component tests
- `test-[component]-direct.js` - Direct tests bypassing API
- `debug-[component].js` - Debugging scripts for specific components