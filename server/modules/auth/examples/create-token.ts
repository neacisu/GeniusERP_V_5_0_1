import { jwtService } from '../index';

// Create a token with our JwtService singleton for consistent secret
const payload = {
  id: 'user-123',
  username: 'testuser',
  role: 'admin',
  roles: ['admin', 'user']
};

const token = jwtService.sign(payload);

// Simple endpoint to get a token for testing
export function getDevToken() {
  return token;
}