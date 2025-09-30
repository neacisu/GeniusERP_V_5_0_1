/**
 * Check COR Statistics Script
 */

import jwt from 'jsonwebtoken';
import axios from 'axios';

async function getStats() {
  const jwtSecret = process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8';
  const token = jwt.sign(
    { userId: 'admin-user-id', roles: ['admin', 'hr_admin'], email: 'admin@test.com', companyId: 'system' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  try {
    const response = await axios.get('http://localhost:5000/api/hr/cor/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data && response.data.success) {
      const stats = response.data.data;
      console.log('Current COR Statistics:');
      console.log('-----------------------');
      console.log(`Major Groups: ${stats.majorGroups}`);
      console.log(`Submajor Groups: ${stats.submajorGroups}`);
      console.log(`Minor Groups: ${stats.minorGroups}`);
      console.log(`Subminor Groups: ${stats.subminorGroups}`);
      console.log(`Occupations: ${stats.occupations}`);
      console.log(`Completion: ${((stats.occupations / 4547) * 100).toFixed(2)}%`);
      console.log(`Remaining: ${4547 - stats.occupations}`);
    } else {
      console.log('Failed to get statistics:', response.data);
    }
  } catch (error) {
    console.error('Error fetching stats:', error.message);
  }
}

getStats();
