# Token Manager Example Scripts

This directory contains example scripts that demonstrate how to use the token manager in different scenarios.

## Available Examples

- **token-demo.js** - Complete demonstration of token generation, verification, and usage
- **validator-demo.js** - Advanced token validation including role and permission checking

## Running an Example

To run an example through the token manager CLI:

```
node ../../token-manager.js run examples/token-demo
node ../../token-manager.js run examples/validator-demo
```

Or run the script directly:

```
./token-demo.js
./validator-demo.js
```

## Example Usage Scenarios

### Basic Token Management

The `token-demo.js` script demonstrates:
- Checking environment variables
- Generating tokens with custom fields
- Verifying tokens
- Using tokens with API requests

### Advanced Token Validation

The `validator-demo.js` script demonstrates:
- Role-based access control validation
- Permission checking
- Expiration status with warning thresholds
- Complete token validation
- Integration with specialized tokens (HR tokens)