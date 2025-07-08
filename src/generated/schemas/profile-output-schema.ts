import { z } from "zod";

/**
 * Zod schema for Profile output
 * Generated from OpenAPI specification
 */
export const profileOutputSchema = z.object({
  user_id: z.number().optional(),
  user_login: z.string().optional(),
  hash: z.string(),
  display_name: z.string(),
  profile_url: z.string().url(),
  avatar_url: z.string().url(),
  avatar_alt_text: z.string(),
  location: z.string(),
  description: z.string(),
  job_title: z.string(),
  company: z.string(),
  verified_accounts: z.array(z.unknown()),
  pronunciation: z.string(),
  pronouns: z.string(),
  timezone: z.string().optional(),
  languages: z.array(z.unknown()).optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  is_organization: z.boolean().optional(),
  header_image: z.string().optional(),
  background_color: z.string().optional(),
  links: z.array(z.unknown()).optional(),
  interests: z.array(z.unknown()).optional(),
  payments: z.object({
    links: z.array(z.unknown()),
    crypto_wallets: z.array(z.unknown())
  }).optional(),
  contact_info: z.object({
    home_phone: z.string().optional(),
    work_phone: z.string().optional(),
    cell_phone: z.string().optional(),
    email: z.string().email().optional(),
    contact_form: z.string().url().optional(),
    calendar: z.string().url().optional()
  }).optional(),
  gallery: z.array(z.unknown()).optional(),
  number_verified_accounts: z.number().optional(),
  last_profile_edit: z.string().datetime().nullable().optional(),
  registration_date: z.string().datetime().nullable().optional(),
  section_visibility: z.object({
    hidden_contact_info: z.boolean().optional(),
    hidden_links: z.boolean().optional(),
    hidden_interests: z.boolean().optional(),
    hidden_wallet: z.boolean().optional(),
    hidden_photos: z.boolean().optional(),
    hidden_verified_accounts: z.boolean().optional()
  }).optional()
});

export type ProfileOutputSchemaType = z.infer<typeof profileOutputSchema>;
