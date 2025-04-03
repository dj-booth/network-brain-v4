import { z } from 'zod';

export const ProfileNoteSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  content: z.string(),
  audio_url: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type ProfileNote = z.infer<typeof ProfileNoteSchema>; 