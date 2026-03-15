import type { EventCategory } from '../types/calendar';

const KEYWORDS: Record<EventCategory, string[]> = {
  meeting: [
    'meeting', 'sync', 'standup', 'stand-up', 'retro', 'sprint',
    'review', 'call', 'zoom', 'teams', 'huddle', 'scrum', '1:1', '1-1',
    'one on one', 'check-in', 'check in', 'interview', 'debrief',
    'kickoff', 'kick-off', 'workshop', 'brainstorm', 'planning', 'demo',
    'all hands',
  ],
  focus: [
    'focus', 'deep work', 'coding', 'code', 'development', 'design',
    'write', 'writing', 'research', 'study', 'build', 'implement',
    'review code', 'code review', 'hack',
  ],
  social: [
    'lunch', 'coffee', 'happy hour', 'social', 'team event',
    'team outing', 'celebration', 'birthday', 'party', 'dinner',
    'drinks', 'outing', 'fun', 'game',
  ],
  admin: [
    'admin', 'email', 'expense', 'expenses', 'timesheet', 'hr',
    'payroll', 'onboarding', 'training', 'compliance', 'report',
    'filing', 'errand', 'appointment', 'dentist', 'doctor',
  ],
  other: [],
};

export function categorize(
  summary: string,
  description = '',
  icsCategories: string[] = [],
): EventCategory {
  // Check explicit ICS categories first
  if (icsCategories.length > 0) {
    const cat = icsCategories[0]!.toLowerCase();
    for (const [key, words] of Object.entries(KEYWORDS)) {
      if (key === 'other') continue;
      if (words.some(w => cat.includes(w))) return key as EventCategory;
    }
  }

  const text = `${summary} ${description}`.toLowerCase();
  for (const [key, words] of Object.entries(KEYWORDS)) {
    if (key === 'other') continue;
    if (words.some(w => text.includes(w))) return key as EventCategory;
  }
  return 'other';
}
