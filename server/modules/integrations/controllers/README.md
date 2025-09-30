# Integrations Module Controllers

This directory contains controllers for the Integrations module, following the controller-based architecture pattern.

## Overview

The controllers in this directory handle business logic for various external integrations, separating it from the route definitions. This approach provides better organization, reusability, and testability.

## Controllers

- **IntegrationsController** (`integrations.controller.ts`): Core controller for managing integration configurations
- **ExchangeRateController** (`exchange-rate.controller.ts`): Handles currency exchange rates operations
- **AnafController** (`anaf.controller.ts`): Manages Romanian tax authority operations
- **EFacturaController** (`e-factura.controller.ts`): Handles Romanian e-Factura operations
- **PandaDocController** (`pandadoc.controller.ts`): Manages document signing operations via PandaDoc
- **StripeController** (`stripe.controller.ts`): Handles payment processing operations via Stripe

## Key Endpoints in IntegrationsController

- **createIntegration**: Creates a new integration configuration
- **getIntegration**: Retrieves integration details by ID
- **getIntegrationByProvider**: Retrieves integration details by provider type
- **listIntegrations**: Lists all integrations for a company
- **updateIntegration**: Updates an existing integration
- **updateIntegrationStatus**: Updates only the status of an integration
- **activateIntegration**: Activates an integration by checking configuration and setting status to ACTIVE
- **updateLastSyncedAt**: Updates the last sync timestamp
- **deleteIntegration**: Removes an integration

## Implementation Notes

1. Each controller is exported as both a class and a singleton instance
2. Controllers follow a consistent error handling approach
3. All controllers use proper audit logging via AuditService
4. Authentication and authorization are enforced at the route level

## Usage in Routes

To use these controllers in route files, import them and delegate request handling to the appropriate controller method:

```typescript
import { Router } from 'express';
import { exchangeRateController } from '../controllers';

const router = Router();

router.get('/exchange-rates', 
  (req, res, next) => exchangeRateController.getLatestRates(req, res).catch(next)
);

export default router;
```

## Best Practices

1. Keep controllers focused on business logic
2. Use appropriate error handling with try/catch blocks
3. Leverage the AuditService for proper activity logging
4. Validate input data before processing
5. Return consistent response structures

## Future Improvements

- Add detailed JSDoc comments for better code documentation
- Implement comprehensive unit tests for each controller
- Consider implementing request validation using a dedicated validation library
