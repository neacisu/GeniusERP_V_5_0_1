# GeniusERP v5.1.0 - AI Coding Agent Instructions

## Project Overview

**GeniusERP** is a comprehensive ERP system for Romanian businesses with ANAF integration, built using a **modular monolith** architecture with TypeScript/Express backend and React/Vite frontend.

### Critical Context
- **Package Manager: pnpm ONLY** - This project uses pnpm@10.19.0 (NOT npm or yarn). All commands must use `pnpm` prefix.
- **Node.js: v22.21.0 LTS** - Minimum required: Node.js >=22.0.0
- **Romanian accounting compliance** is paramount - VAT rates, chart of accounts (Class 1-8), and ANAF integrations follow Romanian standards
- Database uses **PostgreSQL 17** (local Docker) with **Drizzle ORM**
- **Redis Cloud** for caching and BullMQ job queues
- Full monitoring stack: Prometheus, Grafana, Loki/Promtail, Sentry, Falco, Wazuh

### Package Manager Enforcement

⚠️ **IMPORTANT**: This project is configured to ONLY work with pnpm:
- `package.json` has `"packageManager": "pnpm@10.19.0"`
- npm/yarn are blocked via preinstall hook
- VS Code is configured to use pnpm for all operations
- See `PNPM.md` for detailed guide

✅ **Correct commands:**
```bash
pnpm install           # Install dependencies
pnpm add <package>     # Add package
pnpm run dev           # Run dev server
```

❌ **Will fail:**
```bash
npm install   # ❌ Blocked
yarn install  # ❌ Blocked
```

## Architecture Patterns

### 1. Modular Monolith Structure

Each module follows this structure (see `server/modules/{module}/`):
```
module/
├── routes/        # Express routes using AuthGuard.protect()
├── services/      # Business logic as singleton classes
├── controllers/   # Request handlers (optional, some modules inline in routes)
├── schema/        # Drizzle schema definitions
└── types/         # TypeScript interfaces
```

**Module initialization**: All modules register in `server/modules/index.ts` via `initializeModules()` - check this file to understand load order and dependencies.

### 2. Database Access Pattern

**Always use the centralized Drizzle instance:**
```typescript
import { getDrizzle } from '@/common/drizzle';
const db = getDrizzle();

// Query pattern
const results = await db.select().from(table).where(eq(table.column, value));
```

**Schema location**: 
- Shared schemas: `shared/schema/` and `shared/schema.ts` (main export point)
- Module-specific: `server/modules/{module}/schema/`
- **DO NOT create duplicate schemas** - always check `shared/schema.ts` first

### 3. Authentication & Authorization

**Standard auth pattern** (post-standardization):
```typescript
import { AuthGuard } from '@/common/auth/auth-guard';
import { JwtAuthMode } from '@/common/constants';

// Protected route
router.get('/resource', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  roleGuard(['admin', 'accountant']), // optional role check
  handler
);
```

**DO NOT use** deprecated `authGuard.requireAuth()` - it was removed in standardization.

**User context**: Authenticated routes populate `req.user` with:
```typescript
{
  id: string;
  username: string;
  role: string;        // primary role (legacy)
  roles: string[];     // all roles (use this for RBAC)
}
```

**TypeScript Strict Mode Compliance:**

This project uses `noPropertyAccessFromIndexSignature: true` in `tsconfig.json`. This means:

❌ **WRONG - Will cause TS4111 errors:**
```typescript
const companyId = req.user.companyId;        // Error if companyId is optional
const value = req.params.companyId;          // Error - params is index signature
const query = req.query.fiscalYear;          // Error - query is index signature
```

✅ **CORRECT - Use bracket notation for optional properties and index signatures:**
```typescript
// For optional properties from JwtPayload
const companyId = req.user?.['companyId'];

// For req.params (always index signature)
const companyId = req.params['companyId'];

// For req.query (always index signature)
const fiscalYear = req.query['fiscalYear'];

// For req.body properties that might be optional
const value = req.body['optionalProperty'];
```

**When to use bracket notation:**
1. All `req.params.*` access
2. All `req.query.*` access
3. Optional properties from `JwtPayload` (companyId, email, etc.)
4. Any property that TypeScript flags with TS4111 error

### 4. API Route Standards

**URL pattern**: `/api/{module}/{resource}` (NO `/api/v1/` prefix)

Examples:
- ✅ `/api/accounting/journal-entries`
- ✅ `/api/invoices/create`
- ❌ `/api/v1/accounting/...` (deprecated)

### 5. Rate Limiting

Import from `server/middlewares/rate-limit.middleware.ts`:
```typescript
import { 
  accountingReadRateLimiter,    // GET requests (100/min)
  accountingHeavyRateLimiter,   // POST/PUT (20/min)
  invoiceCreateRateLimiter,     // Invoice creation (10/min)
  paymentRecordRateLimiter,     // Payment recording (30/min)
  exportRateLimiter,            // File exports (5/min)
  authRateLimiter               // Auth endpoints (5/min)
} from '@/middlewares/rate-limit.middleware';
```

Apply to routes before handler, after auth.

### 6. Logging Pattern

**Backend** (Winston + Loki):
```typescript
import { createModuleLogger } from '@/common/logger/loki-logger';
const logger = createModuleLogger('module-name');

logger.info('Message', { context: { key: 'value' } });
logger.error('Error message', { error, userId: req.user?.id });
```

**Frontend** (console-based with Sentry):
```typescript
import { createLogger } from '@/utils/logger/logger';
const logger = createLogger('component-name');

logger.info('User action', { context: { action: 'click' } });
```

### 7. Async Processing with BullMQ

For heavy operations (reports, exports, batch processing):
```typescript
// In service
import { accountingQueueService } from './accounting-queue.service';

const job = await accountingQueueService.queueGenerateReport({
  companyId,
  params
});

return { jobId: job.id, message: 'Report generation queued' };
```

Check `server/modules/accounting/services/accounting-queue.service.ts` for reference.

### 8. Caching Pattern (Redis)

For expensive queries:
```typescript
import { accountingCacheService } from './accounting-cache.service';

// Try cache first
const cached = await accountingCacheService.getCachedReport(cacheKey);
if (cached) return cached;

// Compute and cache
const data = await expensiveOperation();
await accountingCacheService.setCachedReport(cacheKey, data, ttl);
```

**Invalidate on mutations** - always clear relevant cache keys after POST/PUT/DELETE.

### 9. Error Handling

**Backend** - use Sentry integration:
```typescript
import * as Sentry from '@sentry/node';

try {
  // operation
} catch (error) {
  logger.error('Operation failed', { error, context });
  Sentry.captureException(error, { tags: { module: 'accounting' } });
  res.status(500).json({ message: 'Internal server error' });
}
```

**Frontend** - React Error Boundaries wrap routes (see `client/src/App.tsx`).

## Key Development Workflows

### Running the Application

**Development** (Docker):
```bash
./docker-dev.sh start   # Start all services
./docker-dev.sh logs    # View logs
./docker-dev.sh stop    # Stop services
```

**Local** (without Docker):
```bash
pnpm run dev             # Start dev server (Vite + Express)
pnpm run build           # Production build
pnpm run start           # Run production build
```

### Database Operations

```bash
# Push schema changes (no migrations)
pnpm run db:push

# Generate migrations (manual)
pnpx drizzle-kit generate

# Studio (GUI)
pnpx drizzle-kit studio
```

**Migration philosophy**: This project uses `db:push` for rapid development. Manual migrations in `migrations/` for production.

### Code Quality

```bash
pnpm run lint            # ESLint check
pnpm run lint:fix        # Auto-fix issues
pnpm run check           # TypeScript check
```

### Security Scanning

```bash
pnpm run scan:vulnerabilities  # Trivy filesystem scan
pnpm run scan:image           # Trivy Docker image scan
```

## Romanian Accounting Specifics

### Chart of Accounts (Plan de Conturi)

- **Class 1-3**: Assets & Liabilities
- **Class 4**: Third parties (4111 Clients, 4011 Suppliers)
- **Class 6**: Expenses
- **Class 7**: Revenue (707 Sales, 4427 VAT Collected)
- **Class 8**: Special accounts

See `server/modules/accounting/services/sales-journal.service.ts` for `SALES_ACCOUNTS` constants.

### VAT Handling

Standard rate: **19%**. Cash VAT (TVA la încasare) supported.
```typescript
import { VATCategory, determineVATCategory } from '@/modules/accounting/types/vat-categories';
```

### ANAF Integration

See `server/modules/integrations/services/`:
- `anaf.service.ts` - Company validation (CUI lookup)
- `e-factura.service.ts` - E-invoicing (RO E-Invoice system)
- `bnr-exchange-rate.service.ts` - BNR exchange rates (EUR/USD/GBP)

Endpoints require `ANAF_API_URL` and `ANAF_API_VERSION` env vars.

## Frontend Patterns

### Routing (Wouter)

Order matters! Define specific routes before wildcards:
```tsx
<ProtectedRoute path="/admin/users/new" component={NewUserPage} />
<ProtectedRoute path="/admin/users/:id/edit" component={EditUserPage} />
<ProtectedRoute path="/admin/users" component={UsersPage} />
```

### Data Fetching (TanStack Query v5)

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-helpers';

const { data, isLoading } = useQuery({
  queryKey: ['invoices', companyId],
  queryFn: () => apiRequest<Invoice[]>('/api/invoices', { 
    params: { companyId } 
  }),
  gcTime: 5 * 60 * 1000, // NOT staleTime (v5 change)
});
```

**Note**: TanStack Query v5 uses `gcTime` instead of `cacheTime`.

### Path Aliases

```typescript
'@' -> 'client/src'
'@shared' -> 'shared'
'@assets' -> 'attached_assets'
```

## Environment Variables

**CRITICAL**: All secrets in `.env` (never hardcode). Use `.env.template` as reference.

Required:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL`, `REDIS_PASSWORD` - Redis Cloud
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`
- `ANAF_API_URL`, `ANAF_API_VERSION`
- `SENTRY_DSN`, `VITE_SENTRY_DSN`
- `OPENAI_API_KEY` (for AI features)

## Critical Investigation Protocol

**BEFORE making ANY changes, follow this mandatory investigation protocol:**

### Step 1: Verify the Problem is Real
- Check if it's an actual code issue or a TypeScript/ESLint configuration glitch
- Verify `tsconfig.json`, `tsconfig.base.json`, `eslint.config.js` settings
- Check for conflicting strict mode settings (`noPropertyAccessFromIndexSignature`, `strictNullChecks`, etc.)

### Step 2: Deep Database & Schema Verification
```bash
# Connect to Docker PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/geniuserp
PGDATABASE=geniuserp PGUSER=postgres PGPASSWORD=postgres PGHOST=postgres PGPORT=5432

# Verify tables, columns, types, constraints
# Check actual data structure vs schema definitions
```

**Schema Check Protocol:**
1. Verify `shared/schema.ts` - main schema export point
2. Check module-specific schemas in `server/modules/{module}/schema/`
3. Cross-reference with actual database tables
4. Ensure NO duplicate schema definitions exist

### Step 3: Application Logic Verification
- Trace the full execution flow for the problematic code
- Verify all function parameters and their types
- Check all variable declarations and their usage
- Validate business logic correctness

### Step 4: Drizzle ORM Enforcement
**CRITICAL RULE: NO RAW SQL STATEMENTS IN CODEBASE**

❌ **NEVER use:**
```typescript
db.execute(sql`SELECT * FROM ...`)
pool.query('SELECT * FROM ...')
client.query('INSERT INTO ...')
```

✅ **ALWAYS use Drizzle ORM:**
```typescript
import { getDrizzle } from '@/common/drizzle';
const db = getDrizzle();

// Queries
await db.select().from(table).where(eq(table.column, value));
await db.insert(table).values(data);
await db.update(table).set(data).where(eq(table.id, id));
await db.delete(table).where(eq(table.id, id));
```

### Step 5: Fix Implementation
- Apply fixes ONLY after completing Steps 1-4
- Update all functions to use Drizzle ORM exclusively
- Update all type definitions to match actual schema
- Ensure type safety with proper TypeScript types

### Step 6: Quality Verification
```bash
# MUST pass all checks before commit
pnpm run lint          # 0 errors required
pnpm run check         # 0 TypeScript errors required
```

### Step 7: Proper Commit & Push
```bash
git add <files>
git commit -m "type(scope): descriptive message

PROBLEMA IDENTIFICATĂ:
- Clear problem description

SOLUȚII APLICATE:
- Detailed solution steps

REZULTAT:
- What was achieved

Fixes: #issue or error codes"

git push origin NXBranch
```

## Common Pitfalls

1. **Schema duplication** - Always check `shared/schema.ts` before creating tables
2. **Auth pattern** - Use `AuthGuard.protect()`, not legacy `authGuard.requireAuth()`
3. **Route order** - Specific routes before wildcards in Wouter
4. **Drizzle instance** - Use `getDrizzle()`, not manual pool creation
5. **Logging** - Use `createModuleLogger()` for backend, `createLogger()` for frontend
6. **Rate limits** - Apply appropriate limiter based on operation cost
7. **Cache invalidation** - Clear cache after mutations
8. **Module load order** - Check `server/modules/index.ts` for dependencies
9. **Raw SQL usage** - NEVER use raw SQL, always use Drizzle ORM
10. **Assuming problems** - Always verify thoroughly before making changes

## Documentation References

- Main README: `README.md` (quick start, stack info)
- Auth system: `documentation/auth-readme.md`
- API standards: `documentation/api-standardization-report.md`
- Monitoring: `MONITORING-SECURITY-GUIDE.md`
- Migration guide: `MIGRATION_TO_LOCAL_DB.md`
- Detailed module docs: `documentation/` directory

## Testing Philosophy

**Current state**: Limited automated testing. Focus on:
- Manual testing via Docker stack
- Sentry error tracking (production)
- Prometheus metrics (performance)
- ESLint + TypeScript checks (quality)

When adding tests, follow patterns in `utils/testing/` directory.

---

**Version**: 5.1.0 | **Last Updated**: October 2025
