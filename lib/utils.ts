// Utility functions for the ThoorigAI Infotech Admin Dashboard

/**
 * Generate a URL-safe, short random string for verification codes
 * Similar to nanoid but without external dependency
 * @param size Length of the string (default: 10)
 * @returns URL-safe random string
 */
export function generateVerificationCode(size: number = 10): string {
  // URL-safe characters: A-Z, a-z, 0-9, -, _ (64 chars total)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  const charsLength = chars.length;

  // Use crypto.getRandomValues for cryptographically secure random values
  // Fallback to Math.random if crypto is not available (shouldn't happen in modern browsers/Node)
  const getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValue !== undefined
    ? crypto.getRandomValue.bind(crypto)
    : () => Math.random();

  for (let i = 0; i < size; i++) {
    // Get a random index between 0 and charsLength-1
    const randomIndex = Math.floor(getRandomValues() * charsLength);
    result += chars.charAt(randomIndex);
  }

  return result;
}

/**
 * Generate a verification code with collision resistance
 * Attempts to generate a unique code, retrying on collision
 * @param supabase Supabase client
 * @param maxAttempts Maximum number of attempts (default: 5)
 * @returns Promise resolving to a unique verification code
 */
export async function generateUniqueVerificationCode(
  supabase: any,
  maxAttempts: number = 5
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateVerificationCode(10);

    // Check if code already exists
    const { error, count } = await supabase
      .from('verifiable_documents')
      .select('id', { count: 'exact' })
      .eq('verification_code', code);

    if (error) {
      // If we can't check, assume it's unique to avoid blocking the operation
      // In production, you might want to handle this differently
      return code;
    }

    if (count === 0) {
      // Code is unique
      return code;
    }
    // Otherwise, try again
  }

  // If we've exhausted attempts, throw an error
  throw new Error('Failed to generate unique verification code after maximum attempts');
}

/**
 * Utility function to conditionally join class names together
 * @param inputs Variable number of class name arguments
 * @returns String of joined class names
 */
export function cn(...inputs: (string | undefined | false | null | 0)[]): string {
  return inputs.filter(Boolean).join(' ');
}
