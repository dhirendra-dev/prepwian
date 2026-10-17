import { supabase } from "@/integrations/supabase/client";

import type {
  CreateCalendarEventInput,
  CreateCalendarReminderInput,
  CreateSmartCalendarInput,
  SmartCalendar,
  SmartCalendarEvent,
  SmartCalendarReminder,
  UpdateCalendarEventInput,
  UpdateSmartCalendarInput,
} from "../types";

/*
 * The generated Supabase Database type may not contain the newly
 * created calendar tables until the project types are regenerated.
 * Keeping the client access behind this API makes that transition easy.
 */
const db = supabase as any;

/* ============================================================
 * MAPPERS
 * ============================================================ */

function mapCalendar(row: any): SmartCalendar {
  return {
    id: row.id,
    userId: row.user_id,

    name: row.name,
    description: row.description ?? null,

    color: row.color ?? "#6366f1",

    calendarType: row.calendar_type,

    isVisible: Boolean(row.is_visible),
    isDefault: Boolean(row.is_default),

    externalProvider: row.external_provider ?? null,
    externalCalendarId: row.external_calendar_id ?? null,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEvent(row: any): SmartCalendarEvent {
  return {
    id: row.id,

    calendarId: row.calendar_id,
    userId: row.user_id,

    title: row.title,
    description: row.description ?? null,

    location: row.location ?? null,

    eventType: row.event_type,

    subject: row.subject ?? null,

    startAt: row.start_at,
    endAt: row.end_at,

    allDay: Boolean(row.all_day),

    timezone: row.timezone ?? "Asia/Kolkata",

    color: row.color ?? null,

    examName: row.exam_name ?? null,
    examOrganization: row.exam_organization ?? null,
    examMode: row.exam_mode ?? null,
    examLevel: row.exam_level ?? null,

    recurrenceRule: row.recurrence_rule ?? null,
    recurrenceUntil: row.recurrence_until ?? null,

    externalProvider: row.external_provider ?? null,
    externalEventId: row.external_event_id ?? null,
    externalEtag: row.external_etag ?? null,

    syncStatus: row.sync_status ?? "local",

    lastSyncedAt: row.last_synced_at ?? null,
    syncError: row.sync_error ?? null,

    isDeleted: Boolean(row.is_deleted),

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReminder(
  row: any,
): SmartCalendarReminder {
  return {
    id: row.id,

    eventId: row.event_id,
    userId: row.user_id,

    minutesBefore: row.minutes_before,

    reminderType: row.reminder_type,

    isEnabled: Boolean(row.is_enabled),

    createdAt: row.created_at,
  };
}

/* ============================================================
 * AUTH
 * ============================================================ */

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(
      "You must be signed in to use the calendar.",
    );
  }

  return user.id;
}

/* ============================================================
 * CALENDARS
 * ============================================================ */

export async function ensureDefaultSmartCalendar(): Promise<SmartCalendar> {
  const { data, error } = await db.rpc(
    "ensure_default_smart_calendar",
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Unable to create the default calendar.",
    );
  }

  return mapCalendar(data);
}

export async function createSmartCalendar(
  input: CreateSmartCalendarInput,
): Promise<SmartCalendar> {
  const userId = await requireUserId();

  /*
   * If this calendar becomes the default calendar,
   * remove the default flag from existing calendars first.
   */
  if (input.isDefault) {
    await db
      .from("smart_calendars")
      .update({
        is_default: false,
      })
      .eq("user_id", userId);
  }

  const { data, error } = await db
    .from("smart_calendars")
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description ?? null,
      color: input.color ?? "#6366f1",
      calendar_type:
        input.calendarType ?? "personal",
      is_default: input.isDefault ?? false,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapCalendar(data);
}

export async function getSmartCalendars(): Promise<
  SmartCalendar[]
> {
  const userId = await requireUserId();

  const { data, error } = await db
    .from("smart_calendars")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", {
      ascending: false,
    })
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapCalendar);
}

export async function getSmartCalendar(
  calendarId: string,
): Promise<SmartCalendar> {
  const userId = await requireUserId();

  const { data, error } = await db
    .from("smart_calendars")
    .select("*")
    .eq("id", calendarId)
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  return mapCalendar(data);
}

export async function updateSmartCalendar(
  calendarId: string,
  input: UpdateSmartCalendarInput,
): Promise<SmartCalendar> {
  const userId = await requireUserId();

  if (input.isDefault) {
    await db
      .from("smart_calendars")
      .update({
        is_default: false,
      })
      .eq("user_id", userId)
      .neq("id", calendarId);
  }

  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) {
    payload.name = input.name;
  }

  if (input.description !== undefined) {
    payload.description = input.description;
  }

  if (input.color !== undefined) {
    payload.color = input.color;
  }

  if (input.calendarType !== undefined) {
    payload.calendar_type = input.calendarType;
  }

  if (input.isVisible !== undefined) {
    payload.is_visible = input.isVisible;
  }

  if (input.isDefault !== undefined) {
    payload.is_default = input.isDefault;
  }

  const { data, error } = await db
    .from("smart_calendars")
    .update(payload)
    .eq("id", calendarId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapCalendar(data);
}

export async function deleteSmartCalendar(
  calendarId: string,
): Promise<void> {
  const userId = await requireUserId();

  const { error } = await db
    .from("smart_calendars")
    .delete()
    .eq("id", calendarId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

/* ============================================================
 * EVENTS
 * ============================================================ */

export async function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<SmartCalendarEvent> {
  const userId = await requireUserId();

  const { data, error } = await db
    .from("smart_calendar_events")
    .insert({
      calendar_id: input.calendarId,
      user_id: userId,

      title: input.title,
      description: input.description ?? null,

      location: input.location ?? null,

      event_type:
        input.eventType ?? "event",

      subject: input.subject ?? null,

      start_at: input.startAt,
      end_at: input.endAt,

      all_day: input.allDay ?? false,

      timezone:
        input.timezone ?? "Asia/Kolkata",

      color: input.color ?? null,

      exam_name: input.examName ?? null,
      exam_organization:
        input.examOrganization ?? null,
      exam_mode: input.examMode ?? null,
      exam_level:
        input.examLevel ?? null,

      recurrence_rule:
        input.recurrenceRule ?? null,

      recurrence_until:
        input.recurrenceUntil ?? null,

      sync_status: "local",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapEvent(data);
}

export async function getCalendarEvents(
  options: {
    calendarIds?: string[];
    startAt?: string;
    endAt?: string;
    eventTypes?: string[];
    includeDeleted?: boolean;
  } = {},
): Promise<SmartCalendarEvent[]> {
  const userId = await requireUserId();

  let query = db
    .from("smart_calendar_events")
    .select("*")
    .eq("user_id", userId);

  if (options.calendarIds?.length) {
    query = query.in(
      "calendar_id",
      options.calendarIds,
    );
  }

  if (options.startAt) {
    query = query.gte(
      "end_at",
      options.startAt,
    );
  }

  if (options.endAt) {
    query = query.lte(
      "start_at",
      options.endAt,
    );
  }

  if (options.eventTypes?.length) {
    query = query.in(
      "event_type",
      options.eventTypes,
    );
  }

  if (!options.includeDeleted) {
    query = query.eq(
      "is_deleted",
      false,
    );
  }

  const { data, error } = await query
    .order("start_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapEvent);
}

export async function getCalendarEvent(
  eventId: string,
): Promise<SmartCalendarEvent> {
  const userId = await requireUserId();

  const { data, error } = await db
    .from("smart_calendar_events")
    .select("*")
    .eq("id", eventId)
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  return mapEvent(data);
}

export async function updateCalendarEvent(
  eventId: string,
  input: UpdateCalendarEventInput,
): Promise<SmartCalendarEvent> {
  const userId = await requireUserId();

  const payload: Record<string, unknown> = {};

  if (input.title !== undefined) {
    payload.title = input.title;
  }

  if (input.description !== undefined) {
    payload.description =
      input.description;
  }

  if (input.location !== undefined) {
    payload.location = input.location;
  }

  if (input.eventType !== undefined) {
    payload.event_type =
      input.eventType;
  }

  if (input.subject !== undefined) {
    payload.subject = input.subject;
  }

  if (input.startAt !== undefined) {
    payload.start_at = input.startAt;
  }

  if (input.endAt !== undefined) {
    payload.end_at = input.endAt;
  }

  if (input.allDay !== undefined) {
    payload.all_day = input.allDay;
  }

  if (input.timezone !== undefined) {
    payload.timezone = input.timezone;
  }

  if (input.color !== undefined) {
    payload.color = input.color;
  }

  if (input.examName !== undefined) {
    payload.exam_name = input.examName;
  }

  if (input.examOrganization !== undefined) {
    payload.exam_organization =
      input.examOrganization;
  }

  if (input.examMode !== undefined) {
    payload.exam_mode =
      input.examMode;
  }

  if (input.examLevel !== undefined) {
    payload.exam_level =
      input.examLevel;
  }

  if (input.recurrenceRule !== undefined) {
    payload.recurrence_rule =
      input.recurrenceRule;
  }

  if (input.recurrenceUntil !== undefined) {
    payload.recurrence_until =
      input.recurrenceUntil;
  }

  if (input.isDeleted !== undefined) {
    payload.is_deleted =
      input.isDeleted;
  }

  const { data, error } = await db
    .from("smart_calendar_events")
    .update(payload)
    .eq("id", eventId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as SmartCalendarEvent;
}