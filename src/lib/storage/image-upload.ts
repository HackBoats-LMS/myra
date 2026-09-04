// Server-side image validation: sniff magic bytes (never trust the client's
// reported MIME type or file extension) and return a canonical mime/ext pair.
export function detectImageType(buf: Uint8Array): { mime: string; ext: string } | null {
  return detectMediaType(buf);
}

export function detectMediaType(buf: Uint8Array): { mime: string; ext: string; type: "image" | "video" } | null {
  if (!buf || buf.length < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg", type: "image" };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png", type: "image" };
  }
  // GIF: "GIF8" (GIF87a / GIF89a)
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    return { mime: "image/gif", ext: "gif", type: "image" };
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp", type: "image" };
  }

  // WebM: 1A 45 DF A3
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return { mime: "video/webm", ext: "webm", type: "video" };
  }

  // MP4 / MOV: Scan first 64 bytes for "ftyp", "moov", or "mdat" box headers
  const sample = buf.subarray(0, Math.min(buf.length, 64));
  let headerStr = "";
  for (let i = 0; i < sample.length; i++) {
    headerStr += String.fromCharCode(sample[i]);
  }

  if (headerStr.includes("ftyp") || headerStr.includes("moov") || headerStr.includes("mdat")) {
    return { mime: "video/mp4", ext: "mp4", type: "video" };
  }

  return null;
}
