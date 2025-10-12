# Server Controllers (Legacy)

This directory previously contained controller files but they have been moved to the modular structure.

## Current Structure:

Controllers are now organized by module in `server/modules/[module-name]/controllers/`:

- **Analytics**: `server/modules/analytics/controllers/`
  - `analytics.controller.ts`
  - `predictive.controller.ts`
  - `business-intelligence.controller.ts`

- **Other modules**: Follow the same pattern `server/modules/[module]/controllers/`

## Rationale:

The modular structure provides:
- Better organization and separation of concerns
- Easier to locate and maintain related functionality
- Clearer dependencies between modules
- Consistent project architecture

## Note:

Old temporary/backup files (`.tmp`, `.updated`) have been removed. 
All active controllers are in their respective module directories.
