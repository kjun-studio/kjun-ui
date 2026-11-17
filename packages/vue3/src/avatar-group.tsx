import { useKjunMessages } from "./runtime/messages";
import { type ExtractPublicPropTypes, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { css } from "./runtime/style";
import { avatarGroupModel } from "../../../shared/package-runtime/avatar-group";
import { KjunAvatar } from "./media";

/** One person in a group: the KjunAvatar props the group does not decide, plus a stable key. */
export interface KjunAvatarGroupItem { key: string; src?: string; name?: string; color?: string; textColor?: string }

const kjunAvatarGroupProps = {
  /** The people shown, front first. */
  items: { type: Array as PropType<KjunAvatarGroupItem[]>, required: true },
  /** Most avatars drawn (default 4); the rest fold into a "+N" chip that is not counted here. */
  max: { type: Number, default: undefined },
  /** The whole headcount when the server sends only a few avatars (default items.length). */
  total: { type: Number, default: undefined },
  size: { type: String as PropType<"xs" | "sm" | "md" | "lg" | "xl">, default: "md" },
  /** Circles overlap; squares sit apart with no ring. */
  shape: { type: String as PropType<"circle" | "square">, default: "circle" },
  /** The one name the group is read by, e.g. "참여자 128명"; defaults to the headcount. */
  ariaLabel: { type: String, default: undefined },
  /** The colour behind the group, for the ring that cuts each circle out of its neighbour (default the surface colour). */
  ringColor: { type: String, default: undefined },
  /** Makes the whole group one button (click), for example to open the full list. */
  pressable: { type: Boolean, default: false },
  /** Blocks a pressable group and dims it. */
  disabled: { type: Boolean, default: false },
} as const;
export type KjunAvatarGroupProps = ExtractPublicPropTypes<typeof kjunAvatarGroupProps>;

/** Overlapping avatars with a "+N" chip, read as one name. Each avatar is wrapped so the group owns overlap, order and ring. */
export const KjunAvatarGroup = defineComponent({
  name: "KjunAvatarGroup",
  props: kjunAvatarGroupProps,
  emits: { click: (_event: MouseEvent) => true },
  setup(props, { emit }) {
    const m = useKjunMessages();
    return () => {
      const { visible, overflowText, totalCount } = avatarGroupModel({ count: props.items.length, max: props.max, total: props.total });
      const label = props.ariaLabel ?? m.value.avatarGroupCount(totalCount);
      const style = props.ringColor === undefined ? undefined : css({ "--_kjun-avatar-group-ring": props.ringColor });
      const content = [
        ...props.items.slice(0, visible).map(({ key, ...item }, index) =>
          <span key={key} class="kjun-avatar-group-item" aria-hidden="true" style={{ zIndex: visible + 1 - index }}>
            <KjunAvatar {...item} size={props.size} shape={props.shape} decorative />
          </span>),
        overflowText ? <span key="overflow" class="kjun-avatar-group-item kjun-avatar-group-overflow" aria-hidden="true" data-digits={overflowText.length - 1} style={{ zIndex: 0 }}>{overflowText}</span> : null,
      ];
      return props.pressable
        ? <button type="button" class="kjun-avatar-group" data-pressable="" data-size={props.size} data-shape={props.shape} aria-label={label}
            disabled={props.disabled} onClick={(event: MouseEvent) => emit("click", event)} style={style}>{content}</button>
        : <div class="kjun-avatar-group" role="img" data-size={props.size} data-shape={props.shape} aria-label={label} style={style}>{content}</div>;
    };
  },
});
