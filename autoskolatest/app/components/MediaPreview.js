const mediaPattern = /\.(avif|gif|jpe?g|png|svg|webp|mp4|webm|ogg)(\?.*)?$/i;
const videoPattern = /\.(mp4|webm|ogg)(\?.*)?$/i;
const imagePattern = /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i;

export function isMediaUrl(value) {
  return typeof value === "string" && mediaPattern.test(value.trim());
}

export default function MediaPreview({ url, alt, className = "" }) {
  if (!isMediaUrl(url)) {
    return null;
  }

  const src = url.trim();
  const classes = `max-h-80 w-full rounded-lg border border-border bg-muted object-contain ${className}`;

  if (videoPattern.test(src)) {
    return (
      <video className={classes} controls preload="metadata">
        <source src={src} />
        Video nelze přehrát.
      </video>
    );
  }

  if (imagePattern.test(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={classes} loading="lazy" />;
  }

  return null;
}
