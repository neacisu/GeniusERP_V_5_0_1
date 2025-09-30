# Token Scripts Directory

This directory contains various token-related scripts including token generators, examples, and specialized scripts.

## Directory Structure

- **examples/** - Example scripts demonstrating token manager usage
- **specialized/** - Domain-specific token generators for different modules
- **legacy/** - Older scripts maintained for backward compatibility

## Main Scripts

The following scripts are part of the core token generation system:

- **create-token.js** - Basic token creator (prefer using token-manager.js)
- **generate-token.js** - Token generator with standard options
- **token-generator.js** - Original token generator (being phased out)

## Usage

While these scripts can be run directly, it's recommended to use the unified token manager CLI:

```
node ../token-manager.js [command] [options]
```

This provides a standardized interface for all token operations.

## Development

When adding new token scripts:

1. Place general-purpose scripts directly in this directory
2. Place module-specific scripts in the `specialized/` directory
3. Place demonstration scripts in the `examples/` directory
4. Add legacy scripts that need to be maintained in the `legacy/` directory

All new scripts should use the functions exported by `token-manager.js` instead of implementing their own token generation logic.