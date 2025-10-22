import { DrizzleService } from '../common/drizzle';
import { users, roles, userRoles } from "../../libs/shared/src/schema";
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { seedDefaultCompany } from './seedDefaultCompany';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Hash a password with a salt
 */
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Seed a default admin user in the database if none exists
 */
async function seedDefaultAdmin() {
  try {
    // First ensure we have a company and admin role
    await seedDefaultCompany();
    
    const drizzleService = new DrizzleService();
    
    console.log('Checking if admin user exists...');
    
    // Check if we already have a user with the admin role
    const existingAdmins = await drizzleService.query(async (db: any) => {
      // Get admin role
      const [adminRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, 'Admin'));
        
      if (!adminRole) {
        console.log('Admin role not found. Make sure company was created first.');
        return [];
      }
      
      // Find users with admin role
      return await db
        .select({
          user: users,
        })
        .from(userRoles)
        .innerJoin(users, eq(userRoles.userId, users.id))
        .where(eq(userRoles.roleId, adminRole.id));
    });
    
    if (existingAdmins.length > 0) {
      console.log('Admin user already exists. Skipping seeding.');
      return;
    }
    
    console.log('No admin users found. Creating default admin...');
    
    // Create a default admin user
    await drizzleService.query(async (db: any) => {
      // Get admin role and company
      const [adminRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, 'Admin'));
        
      if (!adminRole) {
        throw new Error('Admin role not found. Make sure company was created first.');
      }
      
      // Create admin user
      const hashedPassword = await hashPassword('admin');
      const [adminUser] = await db.insert(users).values({
        id: uuidv4(),
        username: 'admin',
        email: 'admin@geniuserp.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin', // User-level role (not RBAC)
        companyId: adminRole.companyId,
      }).returning();
      
      console.log('Default admin user created:', adminUser.username);
      
      // Assign admin role to the user
      await db.insert(userRoles).values({
        userId: adminUser.id,
        roleId: adminRole.id,
      });
      
      console.log('Admin role assigned to admin user');
      
      return adminUser;
    });
    
  } catch (error) {
    console.error('Failed to seed default admin:', error);
    throw error;
  }
}

// Run the seeder if this is the main module
// Using import.meta.url check for ES modules
if (import.meta.url === import.meta.resolve('./seedDefaultAdmin.ts')) {
  seedDefaultAdmin()
    .then(() => {
      console.log('Default admin seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed default admin:', error);
      process.exit(1);
    });
}

export { seedDefaultAdmin };