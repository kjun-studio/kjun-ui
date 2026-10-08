import { useRef, useState, type ReactNode } from "react";
import { tokens } from "@kjun-ui/tokens";
import { DsIcon } from "./button";
export interface DsImageProps { src?: string; alt: string; decorative?: boolean; aspectRatio?: number; fit?: "cover" | "contain"; fallback?: ReactNode; lazy?: boolean; onLoad?: () => void; onError?: () => void }
export function DsImage({ src, alt, decorative = false, aspectRatio = 1, fit = "cover", fallback, lazy = true, onLoad, onError }: DsImageProps) {
  const current = useRef({ src, version: 0 });
  if (current.current.src !== src) current.current = { src, version: current.current.version + 1 };
  const version = current.current.version;
  const [result, setResult] = useState({ version, state: "loading" });
  const state = result.version === version ? result.state : "loading";
  const failed = !src || state === "error";
  return <span className="kjun-image" style={{ aspectRatio: aspectRatio > 0 ? aspectRatio : 1 }} data-state={failed ? "error" : state}>
    {!failed && <img key={version} src={src} alt={decorative ? "" : alt} loading={lazy ? "lazy" : "eager"} style={{ objectFit: fit }} onLoad={() => { if (current.current.version !== version) return; setResult({ version, state: "loaded" }); onLoad?.(); }} onError={() => { if (current.current.version !== version) return; setResult({ version, state: "error" }); onError?.(); }} />}
    {failed && <span className="kjun-image-fallback" role={decorative ? undefined : "img"} aria-label={decorative ? undefined : alt} aria-hidden={decorative || undefined}>{fallback ?? <DsIcon name="image" size={tokens.extensions.image.fallbackIconSize} />}</span>}
  </span>;
}
export interface DsAvatarProps { src?: string; name?: string; alt?: string; decorative?: boolean; size?: "sm" | "md" | "lg"; shape?: "circle" | "square"; fallback?: ReactNode; onLoad?: () => void; onError?: () => void }
export function DsAvatar({ src, name = "", alt, decorative = false, size = "md", shape = "circle", fallback, onLoad, onError }: DsAvatarProps) {
  return <span className="kjun-avatar" data-shape={shape} data-size={size} style={{ width: tokens.extensions.avatar[size], height: tokens.extensions.avatar[size] }}><DsImage src={src} alt={alt || name || "사용자"} decorative={decorative} fallback={fallback ?? (Array.from(name.trim())[0] || <DsIcon name="user" size={tokens.extensions.avatar.fallbackIconSizes[size]} />)} onLoad={onLoad} onError={onError} /></span>;
}
