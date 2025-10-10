/**
 * Base Drizzle Service
 * 
 * Provides the foundational functionality for all Drizzle services
 * with comprehensive error handling and logging.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { Logger } from '../../../../common/logger';
import { getDrizzleInstance } from '../../db';
import { SQL, sql } from 'drizzle-orm';

// Create a logger for database operations
const logger = new Logger('BaseDrizzleService');

/**
 * Base class for all Drizzle services that provides common functionality
 * Each module should extend this class with its specific needs
 */
export class BaseDrizzleService {
  /**
   * Execute a function with the Drizzle database instance
   * 
   * @param queryFn Function that receives the DB instance and returns a result
   * @returns Promise resolving to the result of queryFn
   */
  async query<T = any>(queryFn: (db: PostgresJsDatabase<any>) => Promise<T> | T, context?: string): Promise<T> {
    const ctx = context || 'query';
    try {
      const db = getDrizzleInstance();
      
      if (!db) {
        const error = new Error('Database instance is not initialized');
        logger.error(`[${ctx}] Failed to get database instance`, error);
        throw error;
      }
      
      logger.debug(`[${ctx}] Executing database query`);
      const result = await Promise.resolve(queryFn(db));
      return result;
    } catch (error) {
      logger.error(`[${ctx}] Error executing database query`, error);
      throw error;
    }
  }

  /**
   * Execute raw SQL directly
   * 
   * @param sqlQuery SQL query string or SQL tagged template
   * @param params Parameters for the query (only used with string queries)
   * @returns Query result of type T
   */
  async executeQuery<T = any>(sqlQuery: string | SQL<unknown>, params: any[] = []): Promise<T> {
    const ctx = 'executeQuery';
    try {
      const db = getDrizzleInstance();
      
      if (!db || !db.$client) {
        const error = new Error('Database client is not initialized');
        logger.error(`[${ctx}] ${error.message}`, error);
        throw error;
      }
      
      const truncatedSql = typeof sqlQuery === 'string' 
        ? `${sqlQuery.substring(0, 100)}${sqlQuery.length > 100 ? '...' : ''}` 
        : 'SQL object (not string)';
        
      logger.debug(`[${ctx}] Executing SQL: ${truncatedSql}`);
      if (params && params.length > 0) {
        logger.debug(`[${ctx}] With params: ${JSON.stringify(params)}`);
      }
      
      // Handle SQL objects and string queries differently
      let result;
      if (typeof sqlQuery === 'string') {
        result = await db.$client.unsafe(sqlQuery, params);
      } else {
        // For SQL template literals, use the direct query
        result = await db.execute(sqlQuery);
      }
      
      // Log result summary
      if (Array.isArray(result)) {
        logger.debug(`[${ctx}] Query returned ${result.length} rows`);
      } else {
        logger.debug(`[${ctx}] Query returned result of type ${typeof result}`);
      }
      
      // Cast the result to the generic type T
      return (result || []) as T;
    } catch (error) {
      logger.error(`[${ctx}] SQL query failed:`, error);
      
      const sqlString = typeof sqlQuery === 'string' 
        ? sqlQuery 
        : 'SQL object (not string)';
      
      logger.error(`[${ctx}] SQL: ${sqlString}`);
      logger.error(`[${ctx}] Params:`, params);
      throw error;
    }
  }

  /**
   * Start a database transaction
   * 
   * @param transactionFn Function that receives a transaction and returns a result
   * @returns Promise resolving to the result of transactionFn
   */
  async transaction<T = any>(
    transactionFn: (tx: PostgresJsDatabase<any>) => Promise<T>,
    context?: string
  ): Promise<T> {
    const ctx = context || 'transaction';
    try {
      const db = getDrizzleInstance();
      
      if (!db) {
        const error = new Error('Database instance is not initialized');
        logger.error(`[${ctx}] Failed to get database instance`, error);
        throw error;
      }
      
      logger.debug(`[${ctx}] Starting database transaction`);
      
      return await db.transaction(async (tx) => {
        try {
          const result = await transactionFn(tx);
          logger.debug(`[${ctx}] Transaction completed successfully`);
          return result;
        } catch (txError) {
          logger.error(`[${ctx}] Transaction failed, will be rolled back`, txError);
          throw txError;
        }
      });
    } catch (error) {
      logger.error(`[${ctx}] Error in transaction`, error);
      throw error;
    }
  }
  
  /**
   * Create a SQL condition from a string
   * Useful for creating dynamic WHERE clauses
   * 
   * @param condition SQL condition as string
   * @returns SQL fragment
   */
  sqlCondition(condition: string): SQL<unknown> {
    return sql.raw(condition);
  }
  
  /**
   * Builds a parameterized WHERE condition
   * 
   * @param conditions Object with key-value pairs for conditions
   * @returns SQL fragment
   */
  buildWhereCondition(conditions: Record<string, any>): SQL<unknown> {
    const conditionFragments: SQL<unknown>[] = [];
    
    Object.entries(conditions).forEach(([key, value]) => {
      if (value === null) {
        conditionFragments.push(sql`${sql.identifier(key)} IS NULL`);
      } else if (value === undefined) {
        // Skip undefined values
      } else if (Array.isArray(value)) {
        conditionFragments.push(sql`${sql.identifier(key)} IN (${value.join(', ')})`);
      } else {
        conditionFragments.push(sql`${sql.identifier(key)} = ${value}`);
      }
    });
    
    if (conditionFragments.length === 0) {
      return sql`TRUE`;
    }
    
    return sql.join(conditionFragments, sql` AND `);
  }
}