import { z } from "zod";

/**
 * Zod schema for Profile output
 * Generated from OpenAPI specification
 */
export const profileOutputSchema = z.object({
  userId: z.number().optional(),
  userLogin: z.string().optional(),
  hash: z.string(),
  displayName: z.string(),
  profileUrl: z.string().url(),
  avatarUrl: z.string().url(),
  avatarAltText: z.string(),
  location: z.string(),
  description: z.string(),
  jobTitle: z.string(),
  company: z.string(),
  verifiedAccounts: z.array(z.unknown()),
  pronunciation: z.string(),
  pronouns: z.string(),
  timezone: z.string().optional(),
  languages: z.array(z.unknown()).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isOrganization: z.boolean().optional(),
  headerImage: z.string().optional(),
  backgroundColor: z.string().optional(),
  links: z.array(z.unknown()).optional(),
  interests: z.array(z.unknown()).optional(),
  payments: z.object({
    links: z.array(z.unknown()),
    cryptoWallets: z.array(z.unknown())
  }).optional(),
  contactInfo: z.object({
    homePhone: z.string().optional(),
    workPhone: z.string().optional(),
    cellPhone: z.string().optional(),
    email: z.string().email().optional(),
    contactForm: z.string().url().optional(),
    calendar: z.string().url().optional()
  }).optional(),
  gallery: z.array(z.unknown()).optional(),
  numberVerifiedAccounts: z.number().optional(),
  lastProfileEdit: z.string().datetime().nullable().optional(),
  registrationDate: z.string().datetime().nullable().optional(),
  sectionVisibility: z.object({
    hiddenContactInfo: z.boolean().optional(),
    hiddenLinks: z.boolean().optional(),
    hiddenInterests: z.boolean().optional(),
    hiddenWallet: z.boolean().optional(),
    hiddenPhotos: z.boolean().optional(),
    hiddenVerifiedAccounts: z.boolean().optional()
  }).optional()
});

export type ProfileOutputSchemaType = z.infer<typeof profileOutputSchema>;
