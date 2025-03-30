import { z } from 'zod';

// Profile schema using Zod for runtime validation
export const EmbeddingTypeEnum = z.enum(['intro_draft', 'intro_sought', 'reason_to_introduce']);
export type EmbeddingType = z.infer<typeof EmbeddingTypeEnum>;

export const EmbeddingSchema = z.object({
  id: z.string().uuid(),
  type: EmbeddingTypeEnum,
  content: z.string(),
  is_edited_by_admin: z.boolean(),
  last_edited_at: z.date().optional(),
});

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  location: z.string(),
  referral_source: z.string(),
  current_plan: z.string(),
  startup_name: z.string(),
  cofounders_context: z.string(),
  startup_differentiator: z.string(),
  startup_validation: z.string(),
  skillset: z.string(),
  additional_interests: z.string(),
  inspiring_companies: z.string(),
  email: z.string().email(),
  phone: z.string(),
  linkedin: z.string().url(),
  credibility_score: z.number(),
  submitted_at: z.date(),
  last_scraped_at: z.date().optional(),
  embeddings: z.array(EmbeddingSchema),
  intros_sought: z.array(z.string()),
  reasons_to_connect: z.array(z.string()),
});

// Types derived from the schemas
export type Embedding = z.infer<typeof EmbeddingSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileWithEmbeddings = Profile; 