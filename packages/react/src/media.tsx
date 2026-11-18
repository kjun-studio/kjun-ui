import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
export type KjunImageShape = "square" | "rounded" | "circle";
export interface KjunImageProps {
  src?: string; alt: string; decorative?: boolean;
  /** Width ÷ height; "auto" lets the loaded image set the height (a missing or failed image stays square). */
  aspectRatio?: number | "auto";
  fit?: "cover" | "contain";
  /** square (default), rounded corners, or a circle. */
  shape?: KjunImageShape;
  fallback?: ReactNode; lazy?: boolean; onLoad?: () => void; onError?: () => void;
}
export function KjunImage({ src, alt, decorative = false, aspectRatio = 1, fit = "cover", shape = "square", fallback, lazy = true, onLoad, onError }: KjunImageProps) {
  const current = useRef({ src, version: 0 });
  if (current.current.src !== src) current.current = { src, version: current.current.version + 1 };
  const version = current.current.version;
  const [result, setResult] = useState({ version, state: "loading" });
  const state = result.version === version ? result.state : "loading";
  const failed = !src || state === "error";
  const auto = aspectRatio === "auto";
  const settle = (next: "loaded" | "error") => {
    if (current.current.version !== version) return;
    setResult(previous => previous.version === version && previous.state === next ? previous : { version, state: next });
    if (next === "loaded") onLoad?.(); else onError?.();
  };
  // An image the browser finished before React attached its handlers (server-rendered pages) sends no load event.
  const settled = useRef(-1);
  const seen = (img: HTMLImageElement | null) => {
    if (!img || !img.complete || settled.current === version) return;
    settled.current = version;
    queueMicrotask(() => settle(img.naturalWidth > 0 ? "loaded" : "error"));
  };
  const load = (next: "loaded" | "error") => { if (settled.current === version) return; settled.current = version; settle(next); };
  // A text fallback is drawn as a caption under the photo icon (only the icon when the image is narrow).
  const textual = typeof fallback === "string" || typeof fallback === "number";
  return <span className="kjun-image" style={{ aspectRatio: auto ? (failed ? 1 : undefined) : aspectRatio > 0 ? aspectRatio : 1 }} data-state={failed ? "error" : state}
    data-shape={shape === "square" ? undefined : shape} data-ratio={auto ? "auto" : undefined} data-fallback={failed && textual ? "text" : undefined}>
    {!failed && <img key={version} ref={seen} src={src} alt={decorative ? "" : alt} loading={lazy ? "lazy" : "eager"} style={{ objectFit: fit }} onLoad={() => load("loaded")} onError={() => load("error")} />}
    {failed && <span className="kjun-image-fallback" data-text={textual ? "" : undefined} role={decorative ? undefined : "img"} aria-label={decorative ? undefined : alt} aria-hidden={decorative || undefined}>
      {textual ? <><KjunIcon name="photo" size={tokens.extensions.image.fallbackIconSize} /><span className="kjun-image-fallback-text">{fallback}</span></>
        : fallback ?? <KjunIcon name="photo" size={tokens.extensions.image.fallbackIconSize} />}
    </span>}
  </span>;
}
export interface KjunAvatarProps { src?: string; name?: string; alt?: string; decorative?: boolean; size?: "xs" | "sm" | "md" | "lg" | "xl"; shape?: "circle" | "square"; color?: CSSProperties["color"]; textColor?: CSSProperties["color"]; fallback?: ReactNode; onLoad?: () => void; onError?: () => void }
export function KjunAvatar({ src, name = "", alt, decorative = false, size = "md", shape = "circle", color, textColor, fallback, onLoad, onError }: KjunAvatarProps) {
  const m = useKjunMessages();
  return <span className="kjun-avatar" data-shape={shape} data-size={size} style={{ width: tokens.extensions.avatar[size], height: tokens.extensions.avatar[size], ["--_kjun-avatar-color" as string]: color, ["--_kjun-avatar-text-color" as string]: textColor }}><KjunImage src={src} alt={alt || name || m.user} decorative={decorative} fallback={/* A span, so the image does not treat initials as a text caption. */ <span>{fallback ?? (Array.from(name.trim())[0] || <KjunIcon name="user" size={tokens.extensions.avatar.fallbackIconSizes[size]} />)}</span>} onLoad={onLoad} onError={onError} /></span>;
}
