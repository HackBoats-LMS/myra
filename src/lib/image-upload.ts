// Server-side image validation: sniff magic bytes (never trust the client's
// reported MIME type or file extension) and return a canonical mime/ext pair.
export function detectImageType(buf: Uint8Array): { mime: string; ext: string } | null {
  if (!buf || buf.length < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }
  // GIF: "GIF8" (GIF87a / GIF89a)
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    return { mime: "image/gif", ext: "gif" };
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  return null;
}

// Process an uploaded raster image with Sharp: high-quality upscale when the
// source is small, downscale when it is oversized, then re-encode to WebP for
// a smaller, faster-loading file. Animated GIFs are returned untouched to
// preserve their animation. Returns the processed buffer and canonical format.
export async function processImageToWebP(
  bytes: Uint8Array,
  detected: { mime: string; ext: string }
): Promise<{ data: Buffer; mime: string; ext: string }> {
  const sharp = (await import("sharp")).default;

  // Skip animated GIFs — re-encoding would flatten the animation.
  if (detected.ext === "gif") {
    const gifMeta = await sharp(Buffer.from(bytes), { animated: true }).metadata();
    if ((gifMeta.pages ?? 1) > 1) {
      return { data: Buffer.from(bytes), mime: detected.mime, ext: detected.ext };
    }
  }

  const MIN_DIM = 800; // upscale anything with a short side smaller than this
  const MAX_DIM = 2000; // downscale anything larger than this
  const UPSCALE_TARGET = 1200; // short-side target for small sources
  const WEBP_QUALITY = 85;

  let instance = sharp(Buffer.from(bytes), { animated: false });
  const meta = await instance.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  // Decompression-bomb guard: reject images whose decoded pixel count or
  // single dimension would exhaust memory when fully decoded. Anything the
  // resize below would produce is well within this cap, so legitimate photos
  // pass while a huge-dimension bomb is refused outright.
  const MAX_DIMENSION = 8000;
  const MAX_PIXELS = 25_000_000; // ~25 MP
  if (width > MAX_DIMENSION || height > MAX_DIMENSION || width * height > MAX_PIXELS) {
    throw new Error("Image is too large to process. Please upload a smaller image.");
  }

  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const upscaled = shortSide > 0 && shortSide < MIN_DIM;
  // Resize by the dimension that corresponds to the condition (short side for
  // upscale, long side for downscale) so portrait images are handled correctly.
  const portrait = height > width;

  if (upscaled) {
    // Enlarge the short side to a usable size (lanczos3, high quality).
    instance = portrait
      ? instance.resize({ height: UPSCALE_TARGET, withoutEnlargement: false })
      : instance.resize({ width: UPSCALE_TARGET, withoutEnlargement: false });
  } else if (longSide > MAX_DIM) {
    // Shrink the long side to keep files small and fast.
    instance = portrait
      ? instance.resize({ height: MAX_DIM, withoutEnlargement: true })
      : instance.resize({ width: MAX_DIM, withoutEnlargement: true });
  }

  // Unsharp mask to restore perceived sharpness lost during interpolation.
  // Stronger pass for upscaled small sources, a light pass for everything else.
  if (upscaled) {
    instance = instance.sharpen({ sigma: 2.5, m1: 1.5, m2: 0.75, x1: 2, y2: 20, y3: 10 });
  } else {
    instance = instance.sharpen({ sigma: 1 });
  }

  const data = await instance.webp({ quality: WEBP_QUALITY }).toBuffer();
  return { data, mime: "image/webp", ext: "webp" };
}