# Enterprise Talent Intelligence and Financial Data Management Platform

An advanced enterprise talent intelligence and financial data management platform for Romanian businesses, specializing in intelligent ANAF data integration and comprehensive business insights.

## Project Structure

The project is organized into the following main directories:

### Application Code
- **client/** - Frontend code using React with TypeScript
- **server/** - Backend code using Express with TypeScript
  - **controllers/** - API controllers
  - **modules/** - Module-specific code
  - **services/** - Business logic services
- **shared/** - Shared code and types used by both frontend and backend

### Data and Schema
- **data/** - JSON and report data
  - **json/** - JSON configuration and data files
  - **reports/** - Text-based reports and logs
- **drizzle/** - Drizzle ORM configuration files
- **migrations/** - Database migrations
  - **cor/** - Romanian Occupational Classification (COR) migrations
  - **data-population/** - Data population scripts
  - **schema-updates/** - Schema update scripts
- **accounting-drizzle.config.ts** - Accounting module Drizzle configuration
- **drizzle.config.ts** - Main Drizzle configuration

### Development Resources
- **attached_assets/** - Documentation, references, and development resources
  - **accounting/** - Romanian accounting charts and standards
  - **accounting-docs/** - Accounting documentation
  - **cor-data/** - Romanian Occupational Classification data
  - **development-docs/** - Development and audit documentation
  - **step-instructions/** - Development step instructions
- **documentation/** - Project documentation
- **public/** - Static assets for the frontend
- **reports/** - Project reports
- **utils/api/tests/** - Test files for API endpoints and components

### Utilities
- **utils/** - Utility scripts
  - **api/** - API testing and verification tools
    - **checks/** - API functionality checks
    - **tests/** - API test utilities
  - **backup/** - Backup management utilities
  - **batch/** - Batch processing utilities
  - **build/** - Build scripts and installation utilities
  - **cleanup/** - Cleanup and maintenance scripts
  - **code-generators/** - Code generation utilities
  - **data-processing/** - Data processing scripts
  - **database/** - Database maintenance utilities
  - **imports/** - Data import utilities
  - **migration/** - Migration management utilities
  - **standardization/** - Code standardization utilities
  - **testing/** - Testing framework and utilities
  - **tokens/** - Token generation and management
    - **scripts/** - Token generation scripts
    - **generated/** - Generated token files
  - **verification/** - Verification scripts

## Running the Application

The application can be started using the workflow:

```bash
npm run dev
```

This starts both the backend server and frontend development server.

## Modules

The platform includes the following modules:

- **CRM** - Customer relationship management
- **HR** - Human resources management
- **Accounting** - Financial accounting
- **Inventory** - Inventory management
- **Invoicing** - Invoice generation and management
- **Analytics** - Business analytics and reporting
- **Documents** - Document management
- **Communications** - Communication tools

## Technologies

- Next.js with TypeScript for responsive web application
- Express.js backend
- Drizzle ORM for efficient data management
- PostgreSQL database with specialized financial data schema
- Redis for advanced state and queue management
- Axios for flexible API interactions
- Shadcn/ui for modern, accessible UI components
- React Query for efficient data fetching and state management