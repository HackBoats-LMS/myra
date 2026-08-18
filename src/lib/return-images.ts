import { createSignedObjectUrl, createSignedObjectUrls } from "@/lib/storage/image-storage";

const RETURN_IMAGES_BUCKET = "return-images";

/**
 * Generate a short-lived signed URL for a private return image.
 * The `return-images` bucket is private; images are only readable via signed URLs.
 */
export function createReturnImageSignedUrl(value: string): Promise<string> {
  return createSignedObjectUrl(RETURN_IMAGES_BUCKET, value);
}

export function createReturnImageSignedUrls(values: string[]): Promise<string[]> {
  return createSignedObjectUrls(RETURN_IMAGES_BUCKET, values);
}