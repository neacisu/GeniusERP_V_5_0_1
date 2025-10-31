/**
 * Case Converter Utility
 * 
 * Transformă obiecte între snake_case (DB/Backend) și camelCase (Frontend)
 * 
 * Folosit pentru:
 * - API responses: snake_case → camelCase
 * - API requests: camelCase → snake_case
 * - Consistency între layers
 * 
 * IMPORTANT: Această transformare se aplică DOAR la level-ul API controller,
 * NU în services/DB queries (care folosesc snake_case nativ)
 */

/**
 * Convertește string de la snake_case la camelCase
 * @param str String în snake_case
 * @returns String în camelCase
 * 
 * @example
 * snakeToCamel('fiscal_year_start_month') // → 'fiscalYearStartMonth'
 * snakeToCamel('company_id') // → 'companyId'
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convertește string de la camelCase la snake_case
 * @param str String în camelCase
 * @returns String în snake_case
 * 
 * @example
 * camelToSnake('fiscalYearStartMonth') // → 'fiscal_year_start_month'
 * camelToSnake('companyId') // → 'company_id'
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convertește obiect de la snake_case la camelCase (shallow)
 * @param obj Obiect cu keys în snake_case
 * @returns Obiect cu keys în camelCase
 */
export function objectSnakeToCamel<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => objectSnakeToCamel(item)) as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = snakeToCamel(key);
      
      // Recursively convert nested objects and arrays
      if (value && typeof value === 'object') {
        result[camelKey] = objectSnakeToCamel(value);
      } else {
        result[camelKey] = value;
      }
    }
    
    return result as T;
  }

  // Primitive value - return as-is
  return obj;
}

/**
 * Convertește obiect de la camelCase la snake_case (shallow)
 * @param obj Obiect cu keys în camelCase
 * @returns Obiect cu keys în snake_case
 */
export function objectCamelToSnake<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => objectCamelToSnake(item)) as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = camelToSnake(key);
      
      // Recursively convert nested objects and arrays
      if (value && typeof value === 'object') {
        result[snakeKey] = objectCamelToSnake(value);
      } else {
        result[snakeKey] = value;
      }
    }
    
    return result as T;
  }

  // Primitive value - return as-is
  return obj;
}

/**
 * Convertește obiect de la snake_case la camelCase (deep - cu nested objects)
 * @param obj Obiect cu keys în snake_case (poate include nested objects)
 * @returns Obiect cu keys în camelCase
 */
export function deepSnakeToCamel<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepSnakeToCamel(item)) as T;
  }

  if (typeof obj === 'object') {
    // Handle Date objects - keep as-is
    if (obj instanceof Date) {
      return obj as T;
    }

    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = snakeToCamel(key);
      result[camelKey] = deepSnakeToCamel(value);
    }
    
    return result as T;
  }

  // Primitive value - return as-is
  return obj;
}

/**
 * Convertește obiect de la camelCase la snake_case (deep - cu nested objects)
 * @param obj Obiect cu keys în camelCase (poate include nested objects)
 * @returns Obiect cu keys în snake_case
 */
export function deepCamelToSnake<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepCamelToSnake(item)) as T;
  }

  if (typeof obj === 'object') {
    // Handle Date objects - keep as-is
    if (obj instanceof Date) {
      return obj as T;
    }

    const result: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = camelToSnake(key);
      result[snakeKey] = deepCamelToSnake(value);
    }
    
    return result as T;
  }

  // Primitive value - return as-is
  return obj;
}

