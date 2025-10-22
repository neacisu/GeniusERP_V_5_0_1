/**
 * Company Utilities
 * 
 * Helper functions for company-related operations.
 */

import { Request } from 'express';
import { AppError } from '../errors/app-error';
import { DrizzleService } from '../drizzle/drizzle.service';
import { eq } from 'drizzle-orm';
import { users } from '@geniuserp/shared';

/**
 * Get the company ID from the authenticated user's request
 * 
 * @param req Express request object
 * @returns Company ID string
 * @throws AppError if user is not authenticated or no company is associated
 */
export async function getUserCompanyId(req: Request): Promise<string> {
  if (!req.user || !req.user.id) {
    throw new AppError('UNAUTHORIZED', 'Utilizator neautentificat', 401);
  }

  const userId = req.user.id;
  const drizzle = new DrizzleService();

  try {
    const userResults = await drizzle.query((db) => db.select({
      companyId: users.companyId
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1));

    if (userResults.length === 0) {
      throw new AppError('USER_NOT_FOUND', 'Utilizatorul nu a fost găsit', 404);
    }

    const { companyId } = userResults[0];

    if (!companyId) {
      throw new AppError('NO_COMPANY', 'Utilizatorul nu are o companie asociată', 400);
    }

    return companyId;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    console.error('Error getting user company ID:', error);
    throw new AppError('DATABASE_ERROR', 'Eroare la obținerea datelor companiei', 500);
  }
}