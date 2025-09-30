# Token Verification Utilities

This directory contains utilities for verifying tokens and checking the environment variables needed for token operations.

## Utilities

- **secret-check.js** - Check for the presence of token-related environment variables
- **token-validator.js** - Advanced token validation utilities (coming soon)

## Usage

These utilities are integrated with the main token-manager.js CLI. You can use them through the CLI commands:

```
node utils/tokens/token-manager.js check-env
```

## Integration

These utilities are also importable into other scripts:

```javascript
import secretChecker from './verify/secret-check.js';

// Check all token secrets
const { allPresent, results } = await secretChecker.checkTokenSecrets();
```