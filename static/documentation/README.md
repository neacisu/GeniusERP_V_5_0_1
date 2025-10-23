# Romanian Accounting ERP System

A comprehensive Romanian accounting ERP system with modular Express backend architecture, designed for multi-company operations and subsidiaries.

## Project Overview

This ERP system is a complete financial management solution for Romanian businesses, featuring:

- **Secure Authentication**: JWT-based authentication with role-based access control
- **Romanian Chart of Accounts**: Full implementation of Romanian accounting standards (Classes 1-9)
- **Multi-Currency Invoicing**: Support for cross-currency transactions with BNR exchange rates
- **Audit Logging**: Comprehensive tracking of all system changes
- **Multi-Company Support**: Designed for parent companies, subsidiaries, and franchises
- **Role-Based Access Control**: Granular permissions management

## Architecture

The application follows a modular, domain-driven architecture:

```
/
├── server/                         # Express backend
│   ├── common/                     # Shared utilities
│   │   ├── middleware/             # Common middleware
│   │   ├── services/               # Global services registry
│   │   └── utils/                  # Utility functions
│   │
│   ├── modules/                    # Business domains
│   │   ├── auth/                   # Authentication module
│   │   │   ├── constants/          # Auth-related enums and constants
│   │   │   ├── guards/             # Auth middleware and guards
│   │   │   ├── services/           # JWT and auth services
│   │   │   └── types/              # Auth-related type definitions
│   │   │
│   │   ├── examples/               # Examples for testing auth
│   │   │
│   │   ├── accounting/             # Accounting module
│   │   │   ├── chart-of-accounts/  # Romanian CoA implementation
│   │   │   └── journal/            # Journal entries management
│   │   │
│   │   ├── invoicing/              # Invoicing module
│   │   │   ├── controllers/        # Invoice API controllers
│   │   │   ├── services/           # Invoice business logic
│   │   │   ├── types/              # Invoice-related types
│   │   │   └── validators/         # Invoice validation
│   │   │
│   │   └── integrations/           # External integrations
│   │       ├── bnr/                # National Bank of Romania integration
│   │       ├── services/           # Integration services
│   │       └── types/              # Integration-related types
│   │
│   └── index.ts                    # Main server entry point
│
├── shared/                         # Shared code between client & server
│   ├── schema.ts                   # Drizzle ORM database schema
│   └── types/                      # Shared type definitions
│
└── client/                         # React frontend
    └── src/                        # Client source code
```

## Module Structure

Each module follows a consistent structure:

```
modules/auth/
├── controllers/      # HTTP request handlers
├── routes/           # API endpoint definitions
├── services/         # Business logic
├── validators/       # Request validation
├── types/            # Module-specific types
└── schema/           # Drizzle ORM schemas
```

## Technology Stack

- **Backend**: Express, TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle
- **Authentication**: JWT (stateless)
- **Background Jobs**: BullMQ + Redis Cloud
- **Password Security**: bcrypt
- **Project Structure**: NX Monorepo

## Key Design Principles

1. **Modularity**: Each business domain is isolated as a separate module
2. **Single Responsibility**: Files limited to 100-150 LOC maximum
3. **Comprehensive Logging**: Every public function includes logging
4. **Error Handling**: Try/catch blocks with proper error logging
5. **Clean Architecture**: Services contain business logic, controllers handle HTTP, routes define endpoints
6. **Schema-First Design**: Drizzle ORM schemas define the data model

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis server

### Installation

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npm run db:push`
5. Start the development server: `npm run dev`

## Authentication Flow

The authentication system uses JWT tokens with role-based permissions:

1. User registers or logs in
2. System generates a JWT token containing user ID, username, and roles
3. Token is stored on the client (cookie or localStorage)
4. Protected routes verify the token and check permissions
5. Role-based middleware controls access to resources

## Deployment

The application can be deployed to any environment supporting Node.js, with:

- PostgreSQL database (Neon recommended)
- Redis instance (Redis Cloud recommended)