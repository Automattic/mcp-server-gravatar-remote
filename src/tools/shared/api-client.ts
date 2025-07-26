// Re-export the generated clients for easy access
export { profilesClient } from "../../generated/clients/profilesClient/profilesClient.js";
export { avatarsClient } from "../../generated/clients/avatarsClient/avatarsClient.js";
export { experimentalClient } from "../../generated/clients/experimentalClient/experimentalClient.js";
export { qrCodeClient } from "../../generated/clients/qr-codeClient/qrCodeClient.js";

// Re-export specific operations
export { getProfileById } from "../../generated/clients/profilesClient/getProfileById.js";
export { getProfile } from "../../generated/clients/profilesClient/getProfile.js";
export { updateProfile } from "../../generated/clients/profilesClient/updateProfile.js";
export { associatedEmail } from "../../generated/clients/profilesClient/associatedEmail.js";
export { getAvatars } from "../../generated/clients/avatarsClient/getAvatars.js";
export { uploadAvatar } from "../../generated/clients/avatarsClient/uploadAvatar.js";
export { deleteAvatar } from "../../generated/clients/avatarsClient/deleteAvatar.js";
export { updateAvatar } from "../../generated/clients/avatarsClient/updateAvatar.js";
export { setEmailAvatar } from "../../generated/clients/avatarsClient/setEmailAvatar.js";
export { getProfileInferredInterestsById } from "../../generated/clients/experimentalClient/getProfileInferredInterestsById.js";
export { searchProfilesByVerifiedAccount } from "../../generated/clients/experimentalClient/searchProfilesByVerifiedAccount.js";
export { getVerifiedAccountServices } from "../../generated/clients/experimentalClient/getVerifiedAccountServices.js";
export { getQrCodeBySha256Hash } from "../../generated/clients/qr-codeClient/getQrCodeBySha256Hash.js";

// Utility functions to create API client options with proper auth
export function createApiKeyOptions(apiKey?: string) {
  const headers: Record<string, string> = {};

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return {
    headers,
    baseUrl: "https://api.gravatar.com/v3",
  };
}

export function createOAuthTokenOptions(accessToken: string) {
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    baseUrl: "https://api.gravatar.com/v3",
  };
}
