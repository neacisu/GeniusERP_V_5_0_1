import axios from 'axios';
import jwt from 'jsonwebtoken';

// Create a token
const token = jwt.sign(
  {
    id: 'test-user-id',
    companyId: 'test-company-id',
    email: 'test@example.com',
    username: 'testuser',
    role: 'admin',
    permissions: ['employee.create', 'employee.update', 'employee.read']
  },
  'geniuserp_auth_jwt_secret',
  { expiresIn: '1h' }
);

// Make a direct API call to create an employee
async function createEmployee() {
  try {
    const response = await axios.post(
      'http://localhost:5000/api/hr/employees/simple',
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        position: 'Manager',
        salary: 6000,
        hireDate: new Date().toISOString()
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response error data:', error.response.data);
    }
  }
}

createEmployee();