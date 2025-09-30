const fs = require('fs');
const path = require('path');

const hrModulePath = path.join(process.cwd(), 'server/modules/hr/hr.module.ts');
let content = fs.readFileSync(hrModulePath, 'utf8');

// Replace each instance of authGuard.requireAuth() with AuthGuard.protect(JwtAuthMode.REQUIRED)
content = content.replace(/authGuard\.requireAuth\(\)/g, 'AuthGuard.protect(JwtAuthMode.REQUIRED)');

fs.writeFileSync(hrModulePath, content);
console.log('HR module updated successfully');
