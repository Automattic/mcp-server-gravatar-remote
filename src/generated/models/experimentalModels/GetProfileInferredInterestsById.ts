/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import type { Error } from '../Error.js'
import type { Interest } from '../Interest.js'

export type GetProfileInferredInterestsByIdPathParams = {
  /**
   * @description This can either be an SHA256 hash of an email address or profile URL slug.
   * @type string
   */
  profileIdentifier: string
}

/**
 * @description Successful response
 */
export type GetProfileInferredInterestsById200 = Interest[]

/**
 * @description Profile not found
 */
export type GetProfileInferredInterestsById404 = unknown

/**
 * @description Rate Limit Exceeded
 */
export type GetProfileInferredInterestsById429 = Error

/**
 * @description Internal server error
 */
export type GetProfileInferredInterestsById500 = unknown

export type GetProfileInferredInterestsByIdQueryResponse = GetProfileInferredInterestsById200

export type GetProfileInferredInterestsByIdQuery = {
  Response: GetProfileInferredInterestsById200
  PathParams: GetProfileInferredInterestsByIdPathParams
  Errors: GetProfileInferredInterestsById404 | GetProfileInferredInterestsById429 | GetProfileInferredInterestsById500
}