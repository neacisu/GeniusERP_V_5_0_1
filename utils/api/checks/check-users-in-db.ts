/**
 * Check Users in Database
 * 
 * This script checks the users table in the database to see what users exist
 * and their roles.
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

// Get database URL from environment or use default
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

async function checkUsersInDatabase() {
  console.log('Checking users in database...\n');
  
  const sql = postgres(DATABASE_URL);
  
  try {
    // Query for users using raw SQL query
    const users = await sql`SELECT * FROM users`;
    
    if (users.length === 0) {
      console.log('No users found in the database');
    } else {
      console.log(`Found ${users.length} users in the database:`);
      
      // Print user details
      users.forEach((user: any, index: number) => {
        console.log(`\nUser #${index + 1}:`);
        console.log(`ID: ${user.id}`);
        console.log(`Username: ${user.username}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Roles: ${user.roles ? JSON.stringify(user.roles) : 'N/A'}`);
        console.log(`Company ID: ${user.companyId || 'None'}`);
        console.log(`Created At: ${user.createdAt}`);
      });
    }
  } catch (error: any) {
    console.error('Error querying users:', error.message);
    
    // If table doesn't exist, print helpful message
    if (error.message.includes('relation "users" does not exist')) {
      console.log('\nThe users table does not exist in the database.');
      console.log('This might happen if:');
      console.log('1. The migration hasn\'t been run yet');
      console.log('2. The table name is different from "users"');
      console.log('3. You\'re connected to the wrong database');
    }
  } finally {
    await sql.end();
  }
}

// Execute function
checkUsersInDatabase().catch(console.error);