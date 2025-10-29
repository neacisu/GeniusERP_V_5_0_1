/**
 * Admin Roles API
 * Acest fișier conține un set simplu de endpoint-uri API directe pentru roluri,
 * pentru a evita problemele cu rutele existente.
 */

import express, { Request, Response } from 'express';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { JwtAuthMode } from './modules/auth/constants/auth-mode.enum';

const router = express.Router();

// Inițializare conexiune directă la baza de date
const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}
const client = postgres(connectionString);
const db = drizzle(client);

// Endpoint simplu care returnează toate rolurile din sistem
router.get('/api/all-roles', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req: Request, res: Response) => {
  try {
    console.log('Fetching all roles directly...');
    
    // Execută un SQL direct pentru a obține toate rolurile
    const result = await db.execute(
      `SELECT * FROM roles ORDER BY name`
    );
    
    console.log(`Found ${result.length} roles directly.`);
    
    // Returnează rezultatele ca JSON
    res.json({
      success: true,
      message: 'Roles fetched successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in direct roles API:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching roles',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;