/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import { avatarSchema } from '../avatarSchema.js'
import { errorSchema } from '../errorSchema.js'
import { ratingSchema } from '../ratingSchema.js'
import { z } from 'zod'

export const updateAvatarPathParamsSchema = z.object({
  imageHash: z.string().describe('The hash of the avatar to update.'),
})

/**
 * @description Avatar updated successfully
 */
export const updateAvatar200Schema = z.lazy(() => avatarSchema).describe('An avatar that the user has already uploaded to their Gravatar account.')

/**
 * @description Not Authorized
 */
export const updateAvatar401Schema = z.lazy(() => errorSchema).describe('An error response from the API.')

/**
 * @description Insufficient Scope
 */
export const updateAvatar403Schema = z.lazy(() => errorSchema).describe('An error response from the API.')

/**
 * @description Avatar not found
 */
export const updateAvatar404Schema = z.unknown()

export const updateAvatarMutationRequestSchema = z
  .object({
    rating: z
      .lazy(() => ratingSchema)
      .describe('Rating associated with the image.')
      .optional(),
    alt_text: z.string().describe('Alternative text description of the image.').optional(),
  })
  .describe('The avatar data to update. Partial updates are supported, so only the provided fields will be updated.')

export const updateAvatarMutationResponseSchema = z.lazy(() => updateAvatar200Schema)