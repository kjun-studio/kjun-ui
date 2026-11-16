import { forwardRef, type HTMLAttributes, type KeyboardEvent, type MouseEvent } from "react";

export interface KjunPressableProps extends HTMLAttributes<HTMLDivElement> {
  /** The name read by screen readers; needed when the content has no text of its own. */
  ariaLabel?: string;
  /** Blocks presses and dims the content. */
  disabled?: boolean;
  /** "overlay" (default) lays a tint over the content on hover and press, which shows on photos as well as on text; "none" leaves the content to show its own. */
  pressEffect?: "overlay" | "none";
  /** Draws the keyboard focus ring inside the area, for one that reaches the screen edge or sits in a clipping parent. */
  focusRingInset?: boolean;
}
/**
 * An area that presses, with no shape of its own: for content that is not a button, a card or a list row
 * (a map preview, a photo tile). The app gives the shape through className or style; KJUN supplies the press layer,
 * the focus ring, the button role and the disabled state. Do not put buttons or links inside.
 */
export const KjunPressable = forwardRef<HTMLDivElement, KjunPressableProps>(function KjunPressable(
  { ariaLabel, disabled = false, pressEffect = "overlay", focusRingInset = false, className, children, onClick, onKeyDown, onKeyUp, ...props }, ref) {
  // Like a native button: Enter presses once on keydown (a held key does not repeat), Space presses on release.
  return <div role="button" {...props} ref={ref} tabIndex={disabled ? -1 : props.tabIndex ?? 0}
    className={className ? "kjun-pressable " + className : "kjun-pressable"} aria-label={ariaLabel ?? props["aria-label"]} aria-disabled={disabled || undefined}
    data-press-effect={pressEffect === "none" ? "none" : undefined} data-focus-inset={focusRingInset ? "" : undefined}
    onClick={(event: MouseEvent<HTMLDivElement>) => { if (!disabled) onClick?.(event); }}
    onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled || event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      if (event.key === "Enter" && !event.repeat) event.currentTarget.click();
    }}
    onKeyUp={(event: KeyboardEvent<HTMLDivElement>) => {
      onKeyUp?.(event);
      if (event.defaultPrevented || disabled || event.target !== event.currentTarget || event.key !== " ") return;
      event.preventDefault();
      event.currentTarget.click();
    }}>{children}</div>;
});
