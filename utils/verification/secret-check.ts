/**
 * Secret Check Utility
 * 
 * Helper functions to check for the availability of secrets/environment variables
 */

/**
 * Check if the specified secrets are available in the environment
 * @param keys Array of secret keys to check
 * @returns Object with each key mapped to a boolean indicating availability
 */
export async function check_secrets(keys: string[]) {
  try {
    // Check environment variables
    return keys.reduce((acc, key) => {
      acc[key] = !!process.env[key];
      return acc;
    }, {} as Record<string, boolean>);
  } catch (error) {
    console.error('Error checking secrets:', error);
    return keys.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as Record<string, boolean>);
  }
}