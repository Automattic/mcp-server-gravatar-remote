/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import { errorSchema } from '../errorSchema.js'
import { profileSchema } from '../profileSchema.js'
import { z } from 'zod'

/**
 * @description Successful response
 */
export const getProfile200Schema = z.lazy(() => profileSchema).describe("A user's profile information.")

/**
 * @description Not Authorized
 */
export const getProfile401Schema = z.lazy(() => errorSchema).describe('An error response from the API.')

/**
 * @description Insufficient Scope
 */
export const getProfile403Schema = z.lazy(() => errorSchema).describe('An error response from the API.')

/**
 * @description Profile is disabled
 */
export const getProfile404Schema = z.lazy(() => errorSchema).describe('An error response from the API.')

export const getProfileQueryResponseSchema = z.lazy(() => getProfile200Schema)