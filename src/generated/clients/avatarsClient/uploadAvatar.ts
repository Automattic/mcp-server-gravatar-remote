/**
 * Generated by Kubb (https://kubb.dev/).
 * Do not edit manually.
 */

import fetch from '@kubb/plugin-client/clients/axios'
import type {
  UploadAvatarMutationRequest,
  UploadAvatarMutationResponse,
  UploadAvatarQueryParams,
  UploadAvatar400,
  UploadAvatar401,
  UploadAvatar403,
} from '../../models/avatarsModels/UploadAvatar.js'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'

function getUploadAvatarUrl() {
  return `/me/avatars` as const
}

/**
 * @description Uploads a new avatar image for the authenticated user.
 * @summary Upload new avatar image
 * {@link /me/avatars}
 */
export async function uploadAvatar(
  data: UploadAvatarMutationRequest,
  params?: UploadAvatarQueryParams,
  config: Partial<RequestConfig<UploadAvatarMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = data
  const formData = new FormData()
  if (requestData) {
    Object.keys(requestData).forEach((key) => {
      const value = requestData[key as keyof typeof requestData]
      if (typeof value === 'string' || (value as unknown) instanceof Blob) {
        formData.append(key, value as unknown as string | Blob)
      }
    })
  }
  const res = await request<
    UploadAvatarMutationResponse,
    ResponseErrorConfig<UploadAvatar400 | UploadAvatar401 | UploadAvatar403>,
    UploadAvatarMutationRequest
  >({
    method: 'POST',
    url: getUploadAvatarUrl().toString(),
    params,
    data: formData,
    ...requestConfig,
    headers: { 'Content-Type': 'multipart/form-data', ...requestConfig.headers },
  })
  return res.data
}