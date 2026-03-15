export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
export const GOOGLE_CALENDAR_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

export function isConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID);
}
