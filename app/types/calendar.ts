import { z } from 'zod';

// Community schema using Zod for runtime validation
export const CommunitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date()
});

// Event schema using Zod for runtime validation
export const EventSchema = z.object({
  id: z.string().uuid(),
  google_event_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  start_time: z.date(),
  end_time: z.date().nullable(),
  location: z.string().nullable(),
  organizer_email: z.string().email().nullable(),
  link: z.string().nullable(),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.string().nullable(),
  community_id: z.string().uuid().nullable(),
  created_at: z.date(),
  updated_at: z.date()
});

// Event Attendee schema using Zod for runtime validation
export const EventAttendeeSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  profile_id: z.string().uuid(),
  response_status: z.string().nullable(),
  is_organizer: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date()
});

// Types derived from the schemas
export type Community = z.infer<typeof CommunitySchema>;
export type Event = z.infer<typeof EventSchema>;
export type EventAttendee = z.infer<typeof EventAttendeeSchema>;

// Types for handling Google Calendar API responses
export type GoogleCalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
    organizer?: boolean;
  }>;
  recurrence?: string[];
  htmlLink?: string;
}; 