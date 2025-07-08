import { z } from "zod";

/**
 * Zod schema for Profile output
 * Generated from OpenAPI specification
 */
export const profileOutputSchema = z.object({
  userId: z.number().describe("The unique user ID. NOTE: This is only provided in OAuth2 authenticated requests.").optional(),
  userLogin: z.string().describe("The user's login name. NOTE: This is only provided in OAuth2 authenticated requests.").optional(),
  hash: z.string().describe("The SHA256 hash of the user's primary email address."),
  displayName: z.string().describe("The user's display name. This is the name that is displayed on their profile."),
  profileUrl: z.string().url().describe("The full URL for the user's profile."),
  avatarUrl: z.string().url().describe("The URL for the user's avatar image if it has been set."),
  avatarAltText: z.string().describe("The alt text for the user's avatar image if it has been set."),
  location: z.string().describe("The user's location."),
  description: z.string().describe("The about section on a user's profile."),
  jobTitle: z.string().describe("The user's job title."),
  company: z.string().describe("The user's current company's name."),
  verifiedAccounts: z.array(z.unknown()).describe("A list of verified accounts the user has added to their profile. This is limited to a max of 4 in unauthenticated requests."),
  pronunciation: z.string().describe("The phonetic pronunciation of the user's name."),
  pronouns: z.string().describe("The pronouns the user uses."),
  timezone: z.string().describe("The timezone the user has. This is only provided in authenticated API requests.").optional(),
  languages: z.array(z.unknown()).describe("The languages the user knows. This is only provided in authenticated API requests.").optional(),
  firstName: z.string().describe("User's first name. This is only provided in authenticated API requests.").optional(),
  lastName: z.string().describe("User's last name. This is only provided in authenticated API requests.").optional(),
  isOrganization: z.boolean().describe("Whether user is an organization. This is only provided in authenticated API requests.").optional(),
  headerImage: z.string().describe("The header image used in the main profile card.").optional(),
  backgroundColor: z.string().describe("The profile background color.").optional(),
  links: z.array(z.unknown()).describe("A list of links the user has added to their profile. This is only provided in authenticated API requests.").optional(),
  interests: z.array(z.unknown()).describe("A list of interests the user has added to their profile. This is only provided in authenticated API requests.").optional(),
  payments: z.object({
    links: z.array(z.unknown()).describe("A list of payment URLs the user has added to their profile."),
    cryptoWallets: z.array(z.unknown()).describe("A list of crypto currencies the user accepts.")
  }).describe("The user's public payment information. This is only provided in authenticated API requests.").optional(),
  contactInfo: z.object({
    homePhone: z.string().describe("The user's home phone number.").optional(),
    workPhone: z.string().describe("The user's work phone number.").optional(),
    cellPhone: z.string().describe("The user's cell phone number.").optional(),
    email: z.string().email().describe("The user's email address as provided on the contact section of the profile. Might differ from their account emails.").optional(),
    contactForm: z.string().url().describe("The URL to the user's contact form.").optional(),
    calendar: z.string().url().describe("The URL to the user's calendar.").optional()
  }).describe("The user's contact information. This is only available if the user has chosen to make it public. This is only provided in authenticated API requests.").optional(),
  gallery: z.array(z.unknown()).describe("Additional images a user has uploaded. This is only provided in authenticated API requests.").optional(),
  numberVerifiedAccounts: z.number().describe("The number of verified accounts the user has added to their profile. This count includes verified accounts the user is hiding from their profile. This is only provided in authenticated API requests.").optional(),
  lastProfileEdit: z.string().datetime().nullable().describe("The date and time (UTC) the user last edited their profile. This is only provided in authenticated API requests.").optional(),
  registrationDate: z.string().datetime().nullable().describe("The date the user registered their account. This is only provided in authenticated API requests.").optional(),
  sectionVisibility: z.object({
    hiddenContactInfo: z.boolean().describe("Whether the user's contact info section is hidden.").optional(),
    hiddenLinks: z.boolean().describe("Whether the user's links section is hidden.").optional(),
    hiddenInterests: z.boolean().describe("Whether the user's interests section is hidden.").optional(),
    hiddenWallet: z.boolean().describe("Whether the user's wallet section is hidden.").optional(),
    hiddenPhotos: z.boolean().describe("Whether the user's photo gallery section is hidden.").optional(),
    hiddenVerifiedAccounts: z.boolean().describe("Whether the user's verified accounts section is hidden.").optional()
  }).describe("The visibility of the user's profile sections.").optional()
});

export type ProfileOutputSchemaType = z.infer<typeof profileOutputSchema>;
