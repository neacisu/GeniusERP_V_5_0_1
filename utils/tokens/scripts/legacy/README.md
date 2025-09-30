# Legacy Token Scripts

This directory contains older token generation scripts that are maintained for backward compatibility.

## ⚠️ Deprecation Notice

These scripts are deprecated and will be phased out in future versions. Please use the new token manager CLI for all token operations:

```
node utils/tokens/token-manager.js [command] [options]
```

## Available Legacy Scripts

- **legacy-token-generator.js** - Legacy token generator with backward compatible interface

## Usage

### Legacy Token Generator

```
node legacy-token-generator.js --type admin --role user --expires 24h --output token.txt
```

Options:
- `--type` or `-t` - Token type (admin, user, etc.)
- `--role` or `-r` - User role
- `--userId` or `-u` - User ID
- `--email` or `-e` - User email
- `--expires` or `-x` - Expiration time (e.g. 24h, 7d)
- `--output` or `-o` - Output file path

### Programmatic Usage

The legacy generators can still be imported and used programmatically:

```javascript
import generateLegacyToken from './legacy-token-generator.js';

const result = await generateLegacyToken({
  type: 'admin',
  role: 'user',
  expiresIn: '24h',
  output: 'path/to/output.txt'
});
```

## Migration

To migrate from a legacy script to the new token manager:

1. Replace calls to `legacy-token-generator.js` with `token-manager.js generate`
2. Update parameters to match the new format:
   - `--role` becomes `--roles role1,role2`
   - Add `--permissions` for fine-grained access control

Example migration:
```
# Old
node legacy-token-generator.js --type admin --role user

# New
node ../../token-manager.js generate --type admin --roles user,admin
```