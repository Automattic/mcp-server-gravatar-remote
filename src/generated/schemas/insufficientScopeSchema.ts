/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import { errorSchema } from './errorSchema.js'
import { z } from 'zod'

export const insufficientScopeSchema = z.lazy(() => errorSchema).describe('An error response from the API.')