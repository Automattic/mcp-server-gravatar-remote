/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import type { Avatar } from '../Avatar.js'
import type { Error } from '../Error.js'

export type UploadAvatarQueryParams = {
  /**
   * @description The SHA256 hash of email. If provided, the uploaded image will be selected as the avatar for this email.
   * @type string | undefined
   */
  selected_email_hash?: string
  /**
   * @description Determines if the uploaded image should be set as the avatar for the email. If not passed, the image is only selected as the email\'s avatar if no previous avatar has been set. Accepts \'1\'/\'true\' to always set the avatar or \'0\'/\'false\' to never set the avatar.
   * @default null
   * @type boolean,null | undefined
   */
  select_avatar?: boolean | null
}

/**
 * @description Avatar uploaded successfully
 */
export type UploadAvatar200 = Avatar

/**
 * @description Invalid request
 */
export type UploadAvatar400 = Error

/**
 * @description Not Authorized
 */
export type UploadAvatar401 = Error

/**
 * @description Insufficient Scope
 */
export type UploadAvatar403 = Error

export type UploadAvatarMutationRequest = {
  /**
   * @description The avatar image file
   * @type string, binary
   */
  image: Blob
}

export type UploadAvatarMutationResponse = UploadAvatar200

export type UploadAvatarMutation = {
  Response: UploadAvatar200
  Request: UploadAvatarMutationRequest
  QueryParams: UploadAvatarQueryParams
  Errors: UploadAvatar400 | UploadAvatar401 | UploadAvatar403
}