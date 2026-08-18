const REVIEW_IMAGES_BUCKET = "review-images";

function toObjectPath(bucket: string, value: string): string {
  const marker = `${bucket}/`;
  const idx = value.indexOf(marker);
  if (idx !== -1) {
    return value.slice(idx + marker.length);
  }
  return value;
}

/** Upload a file to a (private) Supabase storage bucket and return its storable path + short-lived preview URL. */
export async function uploadImageObject(
  bucket: string,
  file: File,
  mime: string,
  ext: string
): Promise<{ path: string; previewUrl: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error("Storage is not configured.");
  }

  const fileName = `${crypto.randomUUID()}.${ext}`;
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${fileName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": mime,
    },
    body: file,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to upload: ${err}`);
  }

  const path = `${bucket}/${fileName}`;
  const previewUrl = await createSignedObjectUrl(bucket, path);
  return { path, previewUrl };
}

/** Generate a short-lived signed URL for a private object (path or full URL). Falls back to the input. */
export async function createSignedObjectUrl(bucket: string, value: string): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return value;
  }
  const objectPath = toObjectPath(bucket, value);
  try {
    const res = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/${bucket}/${objectPath}?expiresIn=3600`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" },
        body: "{}",
      }
    );
    if (!res.ok) return value;
    const data = (await res.json()) as { signedURL?: string; error?: string };
    if (!data.signedURL) return value;
    return `${supabaseUrl}/storage/v1/object/sign/${data.signedURL}`;
  } catch {
    return value;
  }
}

export async function createSignedObjectUrls(bucket: string, values: string[]): Promise<string[]> {
  return Promise.all(values.map((v) => createSignedObjectUrl(bucket, v)));
}

/** Permanently delete stored objects (paths or full URLs) from a bucket. Best-effort; resolves silently on failure. */
export async function deleteImageObjects(bucket: string, values: string[]): Promise<void> {
  if (values.length === 0) return;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return;

  const objectPaths = values.map((v) => toObjectPath(bucket, v));
  await Promise.allSettled(
    objectPaths.map((path) =>
      fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${serviceRoleKey}` },
      })
    )
  );
}

export { REVIEW_IMAGES_BUCKET };