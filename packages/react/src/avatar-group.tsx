import { forwardRef, type CSSProperties, type MouseEvent, type Ref } from "react";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { avatarGroupModel } from "../../../shared/package-runtime/avatar-group";
import { KjunAvatar, type KjunAvatarProps } from "./media";

/** One person in a group: the KjunAvatar props the group does not decide, plus a stable key. */
export type KjunAvatarGroupItem = Omit<KjunAvatarProps, "size" | "shape" | "decorative" | "alt"> & { key: string };
export interface KjunAvatarGroupProps {
  /** The people shown, front first. */
  items: KjunAvatarGroupItem[];
  /** Most avatars drawn (default 4); the rest fold into a "+N" chip that is not counted here. */
  max?: number;
  /** The whole headcount when the server sends only a few avatars (default items.length). */
  total?: number;
  size?: KjunAvatarProps["size"];
  /** Circles overlap; squares sit apart with no ring. */
  shape?: KjunAvatarProps["shape"];
  /** The one name the group is read by, e.g. "참여자 128명"; defaults to the headcount. */
  ariaLabel?: string;
  /** The colour behind the group, for the ring that cuts each circle out of its neighbour (default the surface colour). */
  ringColor?: CSSProperties["color"];
  /** Makes the whole group one button (onClick), for example to open the full list. */
  pressable?: boolean;
  /** Blocks a pressable group and dims it. */
  disabled?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: CSSProperties;
  id?: string;
  /** Points at text that says more about the group, e.g. who is still invited. */
  "aria-describedby"?: string;
}

/**
 * Overlapping avatars with a "+N" chip, read as one name. Each avatar is wrapped so the group owns overlap, order and ring.
 * The ref reaches the root: the button when pressable, else the div.
 */
export const KjunAvatarGroup = forwardRef<HTMLElement, KjunAvatarGroupProps>(function KjunAvatarGroup({ items, max, total, size = "md", shape = "circle", ariaLabel, ringColor, pressable = false, disabled = false, onClick, className, style, id, "aria-describedby": describedBy }, ref) {
  const m = useKjunMessages();
  const { visible, overflowText, totalCount } = avatarGroupModel({ count: items.length, max, total });
  const label = ariaLabel ?? m.avatarGroupCount(totalCount);
  const rootStyle = ringColor === undefined ? style : { ...style, ["--_kjun-avatar-group-ring" as string]: ringColor };
  const content = <>
    {items.slice(0, visible).map(({ key, ...item }, index) => <span key={key} className="kjun-avatar-group-item" aria-hidden="true" style={{ zIndex: visible + 1 - index }}>
      <KjunAvatar {...item} size={size} shape={shape} decorative />
    </span>)}
    {overflowText && <span className="kjun-avatar-group-item kjun-avatar-group-overflow" aria-hidden="true" data-digits={overflowText.length - 1} style={{ zIndex: 0 }}>{overflowText}</span>}
  </>;
  const classes = className ? `kjun-avatar-group ${className}` : "kjun-avatar-group";
  return pressable
    ? <button ref={ref as Ref<HTMLButtonElement>} id={id} aria-describedby={describedBy} type="button" className={classes} data-pressable="" data-size={size} data-shape={shape} aria-label={label} disabled={disabled} onClick={onClick} style={rootStyle}>{content}</button>
    : <div ref={ref as Ref<HTMLDivElement>} id={id} aria-describedby={describedBy} className={classes} role="img" data-size={size} data-shape={shape} aria-label={label} style={rootStyle}>{content}</div>;
});
