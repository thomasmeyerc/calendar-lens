export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
export const GOOGLE_CALENDAR_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

/**
 * Validates that the Google Client ID looks like a valid OAuth client ID.
 * Format: <digits>-<alphanum>.apps.googleusercontent.com
 */
export function isValidClientId(clientId: string): boolean {
  return /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(clientId);
}

export function isConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID) && isValidClientId(GOOGLE_CLIENT_ID);
}

export function getConfigError(): string | null {
  if (!GOOGLE_CLIENT_ID) {
    return 'VITE_GOOGLE_CLIENT_ID is not set. Add it to your .env file or set it as a GitHub repository variable.';
  }
  if (!isValidClientId(GOOGLE_CLIENT_ID)) {
    return `VITE_GOOGLE_CLIENT_ID has an invalid format. Expected format: <number>-<id>.apps.googleusercontent.com`;
  }
  return null;
}
