import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
export interface KjunImageProps { src?: string; alt: string; decorative?: boolean; aspectRatio?: number; fit?: "cover" | "contain"; fallback?: ReactNode; lazy?: boolean; onLoad?: () => void; onError?: () => void }
export function KjunImage({ src, alt, decorative = false, aspectRatio = 1, fit = "cover", fallback, lazy = true, onLoad, onError }: KjunImageProps) {
  const current = useRef({ src, version: 0 });
  if (current.current.src !== src) current.current = { src, version: current.current.version + 1 };
  const version = current.current.version;
  const [result, setResult] = useState({ version, state: "loading" });
  const state = result.version === version ? result.state : "loading";
  const failed = !src || state === "error";
  return <span className="kjun-image" style={{ aspectRatio: aspectRatio > 0 ? aspectRatio : 1 }} data-state={failed ? "error" : state}>
    {!failed && <img key={version} src={src} alt={decorative ? "" : alt} loading={lazy ? "lazy" : "eager"} style={{ objectFit: fit }} onLoad={() => { if (current.current.version !== version) return; setResult({ version, state: "loaded" }); onLoad?.(); }} onError={() => { if (current.current.version !== version) return; setResult({ version, state: "error" }); onError?.(); }} />}
    {failed && <span className="kjun-image-fallback" role={decorative ? undefined : "img"} aria-label={decorative ? undefined : alt} aria-hidden={decorative || undefined}>{fallback ?? <KjunIcon name="image" size={tokens.extensions.image.fallbackIconSize} />}</span>}
  </span>;
}
export interface KjunAvatarProps { src?: string; name?: string; alt?: string; decorative?: boolean; size?: "sm" | "md" | "lg"; shape?: "circle" | "square"; color?: CSSProperties["color"]; textColor?: CSSProperties["color"]; fallback?: ReactNode; onLoad?: () => void; onError?: () => void }
export function KjunAvatar({ src, name = "", alt, decorative = false, size = "md", shape = "circle", color, textColor, fallback, onLoad, onError }: KjunAvatarProps) {
  const m = useKjunMessages();
  return <span className="kjun-avatar" data-shape={shape} data-size={size} style={{ width: tokens.extensions.avatar[size], height: tokens.extensions.avatar[size], ["--_kjun-avatar-color" as string]: color, ["--_kjun-avatar-text-color" as string]: textColor }}><KjunImage src={src} alt={alt || name || m.user} decorative={decorative} fallback={fallback ?? (Array.from(name.trim())[0] || <KjunIcon name="user" size={tokens.extensions.avatar.fallbackIconSizes[size]} />)} onLoad={onLoad} onError={onError} /></span>;
}
