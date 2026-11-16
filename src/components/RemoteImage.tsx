'use client';

interface RemoteImageProps {
  src: string;
  alt: string;
  lazy?: boolean;
  /** Called when the picture cannot be loaded, so the parent can remove its frame. */
  onFailed: () => void;
}

/**
 * The only place in the project that uses a plain <img>. Photos live on another
 * website and the site is a static export, so next/image (which needs a server
 * to resize pictures) cannot be used. The lint rule is switched off for this one
 * line only.
 */
export function RemoteImage({ src, alt, lazy = false, onFailed }: RemoteImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={lazy ? 'lazy' : undefined}
      onError={onFailed}
      // If the picture failed before React was listening (during page load), onError never fires. Check once here.
      ref={(img) => {
        if (img && img.complete && img.naturalWidth === 0 && img.currentSrc !== '') onFailed();
      }}
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}
