/**
 * Shared image utilities for avatar processing
 * Used by both avatar image API tools and avatar resources
 */

/**
 * Convert ArrayBuffer to base64 string without stack overflow
 * Handles large binary data by processing in chunks
 */
export function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);

  // Process in chunks to avoid "Maximum call stack size exceeded" error
  const CHUNK_SIZE = 8192;
  let binary = "";

  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.slice(i, i + CHUNK_SIZE);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }

  return btoa(binary);
}

/**
 * Detect MIME type from HTTP response headers
 */
export function detectMimeType(response: Response): string {
  const contentType = response.headers.get("content-type");

  // Validate it's an image MIME type
  if (contentType?.startsWith("image/")) {
    return contentType;
  }

  // Fallback to PNG for safety, since Gravatar defaults to returning PNG images
  return "image/png";
}

/**
 * Fetch image from URL and return base64 data with detected MIME type
 */
export async function fetchImageAsBase64(imageUrl: string): Promise<{
  base64Data: string;
  mimeType: string;
}> {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  // Detect MIME type from response headers
  const mimeType = detectMimeType(response);

  // Convert the response to base64
  const arrayBuffer = await response.arrayBuffer();
  const base64Data = arrayBufferToBase64(arrayBuffer);

  return {
    base64Data,
    mimeType,
  };
}
