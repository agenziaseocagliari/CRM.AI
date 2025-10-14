import { RRule, rrulestr } from 'rrule';

export interface RecurrenceSettings {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc.
  endDate?: string | null;
  count?: number | null; // Alternative to endDate
}

// Convert our format to RRULE format
export function createRRule(
  startDate: Date,
  settings: RecurrenceSettings
): RRule {
  const freq = {
    daily: RRule.DAILY,
    weekly: RRule.WEEKLY,
    monthly: RRule.MONTHLY,
  }[settings.frequency];

  const options: any = {
    freq,
    interval: settings.interval,
    dtstart: startDate,
  };

  // Add days of week for weekly recurrence
  if (settings.frequency === 'weekly' && settings.daysOfWeek?.length) {
    options.byweekday = settings.daysOfWeek.map(d =>
      [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA][d]
    );
  }

  // Add end condition
  if (settings.endDate) {
    options.until = new Date(settings.endDate);
  } else if (settings.count) {
    options.count = settings.count;
  } else {
    // Default: 52 occurrences (1 year weekly, etc.)
    options.count = 52;
  }

  return new RRule(options);
}

// Generate recurring instances for display
export function generateRecurringInstances(
  baseEvent: any,
  rrule: RRule,
  rangeStart: Date,
  rangeEnd: Date
): any[] {
  const occurrences = rrule.between(rangeStart, rangeEnd, true);

  return occurrences.map((date, index) => ({
    ...baseEvent,
    id: `${baseEvent.id}_${index}`, // Unique ID for each instance
    start_time: date.toISOString(),
    end_time: new Date(
      date.getTime() + (new Date(baseEvent.end_time).getTime() - new Date(baseEvent.start_time).getTime())
    ).toISOString(),
    is_recurring: true,
    recurrence_id: baseEvent.id, // Link to parent
    occurrence_date: date.toISOString(), // Original date of this occurrence
  }));
}

// Parse RRULE string from database
export function parseRRule(rruleString: string): RRule {
  return rrulestr(rruleString);
}

// Convert RRULE to human readable text (Italian)
export function rruleToText(rrule: RRule): string {
  const text = rrule.toText();

  // Translate to Italian
  const translations: Record<string, string> = {
    'every day': 'ogni giorno',
    'every week': 'ogni settimana',
    'every month': 'ogni mese',
    'on Monday': 'il lunedì',
    'on Tuesday': 'il martedì',
    'on Wednesday': 'il mercoledì',
    'on Thursday': 'il giovedì',
    'on Friday': 'il venerdì',
    'on Saturday': 'il sabato',
    'on Sunday': 'la domenica',
    'until': 'fino al',
    'daily': 'giornaliero',
    'weekly': 'settimanale',
    'monthly': 'mensile',
  };

  let translated = text;
  Object.entries(translations).forEach(([en, it]) => {
    translated = translated.replace(new RegExp(en, 'gi'), it);
  });

  return translated.charAt(0).toUpperCase() + translated.slice(1);
}

// Convert EventModal form data to RecurrenceSettings
export function eventDataToRecurrenceSettings(eventData: any): RecurrenceSettings | null {
  if (!eventData.is_recurring) return null;

  return {
    frequency: eventData.recurrence_frequency,
    interval: eventData.recurrence_interval || 1,
    daysOfWeek: eventData.recurrence_days || [],
    endDate: eventData.recurrence_end_date || null,
    count: null, // We use endDate for now
  };
}

// Generate RRULE string from event data (for database storage)
export function generateRRuleFromEventData(eventData: any): string | null {
  const settings = eventDataToRecurrenceSettings(eventData);
  if (!settings) return null;

  const startDate = new Date(eventData.start_time);
  const rrule = createRRule(startDate, settings);
  return rrule.toString();
}