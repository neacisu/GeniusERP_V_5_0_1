# Token Management

This directory contains token-related utilities and generated tokens for testing and development.

## Structure:
- **scripts/** - Token generation and verification scripts
  - **specialized/** - Specialized token generators for specific modules
  - **examples/** - Example scripts demonstrating token manager usage
  - **legacy/** - Older token generation scripts (maintained for compatibility)
- **verify/** - Utilities for verifying tokens and environment
- **generated/** - Generated tokens used by tests and examples
  - **archive/** - Older or redundant tokens maintained for reference
- **secure-store/** - Encrypted token storage (these files should not be committed)

## Token Manager CLI

The new `token-manager.js` provides a centralized CLI for all token operations. It uses the JWT secret from Replit secrets and admin user UUID to generate and verify tokens. It also includes secure token storage with encryption capabilities.

### Usage Examples:

Generate a new admin token:
```
node utils/tokens/token-manager.js generate --type admin --output utils/tokens/generated/admin-token.txt
```

Generate a custom token with specific roles:
```
node utils/tokens/token-manager.js generate --type user --roles user,sales,crm --output utils/tokens/generated/custom-token.txt
```

Verify a token:
```
node utils/tokens/token-manager.js verify --file utils/tokens/generated/admin-token.txt
```

Check token-related environment variables:
```
node utils/tokens/token-manager.js check-env
```

List all available token scripts:
```
node utils/tokens/token-manager.js list-scripts
```

List all generated tokens with their status:
```
node utils/tokens/token-manager.js list-tokens
```

Run a specific token script:
```
node utils/tokens/token-manager.js run generate-comms-token
```

Run an example:
```
node utils/tokens/token-manager.js run examples/token-demo
```

### CLI Help:

For full usage instructions, run:
```
node utils/tokens/token-manager.js --help
```

## Programmatic Usage

The token manager can also be imported and used programmatically in your code:

```javascript
import { generateToken, verifyToken } from './utils/tokens/token-manager.js';
import secretChecker from './utils/tokens/verify/secret-check.js';

// Generate a token
const result = await generateToken({
  type: 'admin',
  roles: ['admin', 'user'],
  expiresIn: '1h'
});

// Verify a token
const verification = await verifyToken(result.token);
```

## Legacy Usage:
The unified `token-generator.js` is still available for backward compatibility but is being phased out in favor of the new token manager.

For specialized token needs that aren't yet integrated with the token manager, use the scripts in the `specialized/` directory.

