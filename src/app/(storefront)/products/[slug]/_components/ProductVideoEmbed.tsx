function isSafeVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (/^(javascript|data|vbscript|blob):/i.test(parsed.protocol)) return false;
    return true;
  } catch {
    return false;
  }
}

function getVideoMimeType(url: string): string {
  const pathname = url.split('?')[0].split('#')[0].toLowerCase();
  if (pathname.endsWith('.webm')) return 'video/webm';
  return 'video/mp4';
}

export default function ProductVideoEmbed({ url }: { url: string }) {
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);

  if (youtubeMatch) {
    return (
      <div className="mt-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E] mb-2">Product Video</p>
        <div className="relative aspect-video overflow-hidden border border-[#7A0B2E]/20 bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
            className="absolute inset-0 w-full h-full"
            title="Product video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (!isSafeVideoUrl(url)) {
    return (
      <div className="mt-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E] mb-2">Product Video</p>
        <p className="text-sm text-gray-500">Invalid video URL.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E] mb-2">Product Video</p>
      <video controls className="w-full aspect-video border border-[#7A0B2E]/20 bg-black object-contain" crossOrigin="anonymous">
        <source src={url} type={getVideoMimeType(url)} />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
