# Specialized Token Scripts

This directory contains specialized token generation scripts for different modules and use cases.

## Available Scripts

- **hr-tokens.js** - Generates tokens for HR module access with role-based permissions

## Usage

### HR Tokens

The HR token generator can create tokens with predefined roles and permissions for the HR module:

```
# Generate an HR admin token
node ../../token-manager.js run specialized/hr-tokens hr_admin

# Generate an HR manager token
node ../../token-manager.js run specialized/hr-tokens hr_manager

# Generate an HR specialist token
node ../../token-manager.js run specialized/hr-tokens hr_specialist

# Generate an HR viewer token
node ../../token-manager.js run specialized/hr-tokens hr_viewer

# Generate all HR role tokens
node ../../token-manager.js run specialized/hr-tokens all
```

Or run the script directly:

```
./hr-tokens.js hr_admin
```

### Programmatic Usage

The specialized token generators can also be imported and used programmatically:

```javascript
import { generateHrToken, HR_ROLES } from '../specialized/hr-tokens.js';

// Generate an HR manager token
const result = await generateHrToken(HR_ROLES.MANAGER, {
  expiresIn: '1d',
  departmentId: 'finance-hr',
  email: 'hr-manager@example.com'
});
```