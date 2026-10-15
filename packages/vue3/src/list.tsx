import { defineComponent, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { useKjunId } from "./input";
import { hasContent } from "./runtime/slots";

const kjunListRowProps = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  href: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  /** Declared as a prop: a row is a button only when the app listens for clicks. */
  onClick: { type: Function as PropType<(event: MouseEvent) => void>, default: undefined },
} as const;
export type KjunListRowProps = ExtractPublicPropTypes<typeof kjunListRowProps>;
/** Slots: leading, trailing, actions. */
export const KjunListRow = defineComponent({
  name: "KjunListRow",
  props: kjunListRowProps,
  slots: Object as SlotsType<{
    leading?: () => VNodeChild;
    trailing?: () => VNodeChild;
    actions?: () => VNodeChild;
  }>,
  setup(props, { slots }) {
    return () => {
      const leading = slots.leading?.(), trailing = slots.trailing?.(), actions = slots.actions?.();
      const contents = <>
        {hasContent(leading) && <span class="kjun-list-leading">{leading}</span>}
        <span class="kjun-list-body"><span class="kjun-list-title">{props.title}</span>{props.description && <span class="kjun-list-description">{props.description}</span>}</span>
        {hasContent(trailing) && <span class="kjun-list-trailing">{trailing}</span>}
      </>;
      const main = props.href
        ? <a class="kjun-list-main" href={props.disabled ? undefined : props.href} aria-disabled={props.disabled || undefined}
            onClick={(event: MouseEvent) => { if (props.disabled) event.preventDefault(); else props.onClick?.(event); }}>{contents}</a>
        : props.onClick
          ? <button class="kjun-list-main" type="button" disabled={props.disabled} onClick={(event: MouseEvent) => props.onClick?.(event)}>{contents}</button>
          : <div class="kjun-list-main">{contents}</div>;
      // A disabled row disables its actions too, so the row never reads as partly available.
      return <li class="kjun-list-row">{main}{hasContent(actions) && <div class="kjun-list-actions" data-disabled={props.disabled || undefined} inert={props.disabled || undefined}>{actions}</div>}</li>;
    };
  },
});

const kjunListSectionProps = {
  title: { type: String, default: undefined },
  description: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
} as const;
export type KjunListSectionProps = ExtractPublicPropTypes<typeof kjunListSectionProps>;
/** Slots: default (KjunListRow items), actions. */
export const KjunListSection = defineComponent({
  name: "KjunListSection",
  props: kjunListSectionProps,
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    actions?: () => VNodeChild;
  }>,
  setup(props, { slots }) {
    const id = useKjunId("kjun-");
    return () => {
      const actions = slots.actions?.();
      return (
        <section class="kjun-list-section" aria-labelledby={props.title ? id : undefined} aria-label={props.title ? undefined : props.ariaLabel}>
          {(props.title || props.description || hasContent(actions)) && (
            <div class="kjun-list-heading"><div>{props.title && <h3 id={id}>{props.title}</h3>}{props.description && <p>{props.description}</p>}</div>{actions}</div>
          )}
          <ul class="kjun-list" aria-label={props.ariaLabel || props.title}>{slots.default?.()}</ul>
        </section>
      );
    };
  },
});
