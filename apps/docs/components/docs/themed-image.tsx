'use client';
import { forwardRef, type ImgHTMLAttributes } from 'react';

/** build:thumbnails writes a `-dark.png` capture beside each light one; the document's color scheme picks the file. */
export const ThemedImage = forwardRef<HTMLImageElement, ImgHTMLAttributes<HTMLImageElement> & { src: string }>(
  function ThemedImage({ src, ...props }, ref) {
    return <picture className="themed-image">
      <source media="(prefers-color-scheme: dark)" srcSet={src.replace(/\.png$/, '-dark.png')} />
      <img ref={ref} src={src} width={1280} height={800} decoding="async" {...props} />
    </picture>;
  });
