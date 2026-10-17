export type CalendarType =
  | "personal"
  | "study"
  | "exam"
  | "google";

export type CalendarEventType =
  | "event"
  | "study"
  | "lecture"
  | "test"
  | "exam"
  | "deadline"
  | "holiday"
  | "reminder"
  | "meeting"
  | "personal";

export type CalendarSyncStatus =
  | "local"
  | "synced"
  | "pending"
  | "error";

export type ReminderType =
  | "notification"
  | "email";

export type ExternalProvider =
  | "google"
  | null;

export interface SmartCalendar {
  id: string;
  userId: string;

  name: string;
  description: string | null;

  color: string;

  calendarType: CalendarType;

  isVisible: boolean;
  isDefault: boolean;

  externalProvider: ExternalProvider;
  externalCalendarId: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface SmartCalendarEvent {
  id: string;

  calendarId: string;
  userId: string;

  title: string;
  description: string | null;

  location: string | null;

  eventType: CalendarEventType;

  subject: string | null;

  startAt: string;
  endAt: string;

  allDay: boolean;

  timezone: string;

  color: string | null;

  /*
   * Examination information.
   */
  examName: string | null;
  examOrganization: string | null;
  examMode: string | null;
  examLevel: string | null;

  /*
   * Recurring event information.
   * Example:
   * RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR
   */
  recurrenceRule: string | null;
  recurrenceUntil: string | null;

  /*
   * Google Calendar information.
   */
  externalProvider: ExternalProvider;
  externalEventId: string | null;
  externalEtag: string | null;

  syncStatus: CalendarSyncStatus;

  lastSyncedAt: string | null;
  syncError: string | null;

  isDeleted: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface SmartCalendarReminder {
  id: string;

  eventId: string;
  userId: string;

  minutesBefore: number;

  reminderType: ReminderType;

  isEnabled: boolean;

  createdAt: string;
}

export interface GoogleCalendarConnection {
  id: string;

  userId: string;

  googleAccountEmail: string | null;
  googleUserId: string | null;

  isConnected: boolean;

  lastSyncAt: string | null;

  syncToken: string | null;

  connectionError: string | null;

  createdAt: string;
  updatedAt: string;
}

export type CalendarSyncOperation =
  | "import"
  | "export"
  | "update"
  | "delete"
  | "full_sync";

export type CalendarSyncLogStatus =
  | "started"
  | "success"
  | "error";

export interface SmartCalendarSyncLog {
  id: string;

  userId: string;

  provider: "google";

  operation: CalendarSyncOperation;

  status: CalendarSyncLogStatus;

  eventId: string | null;

  message: string | null;

  createdAt: string;
}

/* ============================================================
 * INPUT TYPES
 * ============================================================ */

export interface CreateSmartCalendarInput {
  name: string;
  description?: string | null;
  color?: string;
  calendarType?: CalendarType;
  isDefault?: boolean;
}

export interface UpdateSmartCalendarInput {
  name?: string;
  description?: string | null;
  color?: string;
  calendarType?: CalendarType;
  isVisible?: boolean;
  isDefault?: boolean;
}

export interface CreateCalendarEventInput {
  calendarId: string;

  title: string;
  description?: string | null;

  location?: string | null;

  eventType?: CalendarEventType;

  subject?: string | null;

  startAt: string;
  endAt: string;

  allDay?: boolean;

  timezone?: string;

  color?: string | null;

  examName?: string | null;
  examOrganization?: string | null;
  examMode?: string | null;
  examLevel?: string | null;

  recurrenceRule?: string | null;
  recurrenceUntil?: string | null;
}

export interface UpdateCalendarEventInput {
  title?: string;
  description?: string | null;

  location?: string | null;

  eventType?: CalendarEventType;

  subject?: string | null;

  startAt?: string;
  endAt?: string;

  allDay?: boolean;

  timezone?: string;

  color?: string | null;

  examName?: string | null;
  examOrganization?: string | null;
  examMode?: string | null;
  examLevel?: string | null;

  recurrenceRule?: string | null;
  recurrenceUntil?: string | null;

  isDeleted?: boolean;
}

export interface CreateCalendarReminderInput {
  eventId: string;

  minutesBefore?: number;

  reminderType?: ReminderType;

  isEnabled?: boolean;
}

/* ============================================================
 * GOOGLE CALENDAR TYPES
 * ============================================================ */

export interface GoogleCalendarSummary {
  id: string;

  summary: string;

  description?: string | null;

  timeZone?: string | null;

  backgroundColor?: string | null;

  foregroundColor?: string | null;

  primary?: boolean;

  selected?: boolean;
}

export interface GoogleCalendarEvent {
  id: string;

  summary?: string | null;

  description?: string | null;

  location?: string | null;

  status?: string | null;

  htmlLink?: string | null;

  etag?: string | null;

  created?: string | null;

  updated?: string | null;

  start?: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };

  end?: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };

  recurrence?: string[];

  recurringEventId?: string | null;
}

export interface GoogleCalendarSyncResult {
  imported: number;
  updated: number;
  deleted: number;
  skipped: number;

  calendars: number;

  errors: string[];
}

/* ============================================================
 * CALENDAR UI TYPES
 * ============================================================ */

export type CalendarView =
  | "month"
  | "week"
  | "day"
  | "agenda";

export type CalendarFilter =
  | "all"
  | "study"
  | "lecture"
  | "test"
  | "exam"
  | "deadline"
  | "holiday"
  | "personal";

export interface CalendarDateRange {
  start: Date;
  end: Date;
}

export interface CalendarFilters {
  eventType: CalendarFilter;
  calendarIds: string[];
  subjects: string[];
  showCompleted: boolean;
  showGoogleEvents: boolean;
  showExams: boolean;
}

export interface CalendarViewState {
  view: CalendarView;

  selectedDate: Date;

  dateRange: CalendarDateRange;

  searchQuery: string;

  filters: CalendarFilters;
}

/* ============================================================
 * EXAM TYPES
 * ============================================================ */

export interface ExamCalendarEventInput {
  calendarId: string;

  title: string;

  examName: string;

  organization?: string | null;

  examMode?: string | null;

  examLevel?: string | null;

  startAt: string;
  endAt: string;

  registrationDeadline?: string | null;

  admitCardDate?: string | null;

  resultDate?: string | null;

  officialUrl?: string | null;

  description?: string | null;
}

/* ============================================================
 * DASHBOARD / SUMMARY TYPES
 * ============================================================ */

export interface CalendarDaySummary {
  date: string;

  totalEvents: number;

  studyEvents: number;

  tests: number;

  exams: number;

  deadlines: number;

  completedEvents: number;
}

export interface UpcomingCalendarEvent {
  event: SmartCalendarEvent;

  daysUntil: number;

  hoursUntil: number;

  isToday: boolean;

  isTomorrow: boolean;
}

export interface CalendarStats {
  totalEvents: number;

  upcomingEvents: number;

  exams: number;

  tests: number;

  studySessions: number;

  deadlines: number;

  googleEvents: number;
}