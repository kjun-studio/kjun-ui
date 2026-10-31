import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { textareaBounds, textareaCount, textareaMaxRows } from "../../../shared/package-runtime/textarea";
import { growTextarea } from "../../../shared/package-runtime/textarea-grow";
import { defineComponent, mergeProps, nextTick, onBeforeUnmount, onMounted, ref, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { KjunButton } from "./button";
import { useKjunField, useKjunId } from "./input";
import { css } from "./runtime/style";

const kjunTextareaProps = {
  modelValue: { type: String, default: "" },
  size: { type: String as PropType<InputSize>, default: "md" },
  error: { type: Boolean, default: false },
  /** Manual resizing; the field already grows with its text (default "none"). */
  resize: { type: String as PropType<"none" | "vertical" | "horizontal" | "both">, default: "none" },
  rows: { type: Number, default: 3 },
  /** The field grows with its text from rows up to maxRows, then scrolls (default 6; rows keeps it fixed). */
  maxRows: { type: Number, default: textareaMaxRows },
  maxLength: { type: Number, default: undefined },
  /** Shows the character count inside the field, as "length/maxLength" when maxLength is set. */
  showCount: { type: Boolean, default: false },
  /** Composer: shows a submit button at the end of the bar inside the field, named by this label. */
  submitLabel: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  id: { type: String, default: undefined },
  required: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
} as const;
export type KjunTextareaProps = ExtractPublicPropTypes<typeof kjunTextareaProps>;
/** v-model; other attributes reach the <textarea>. Slot `actions`: composer controls at the start of the bar.
 * Event: submit(value) from the submit button or Ctrl/⌘+Enter while there is text within maxLength. */
const KjunTextareaComponent = defineComponent({
  name: "KjunTextarea",
  inheritAttrs: false,
  props: kjunTextareaProps,
  emits: { "update:modelValue": (_value: string) => true, submit: (_value: string) => true },
  slots: Object as SlotsType<{ actions?: () => VNodeChild }>,
  setup(props, { attrs, emit, expose, slots }) {
    const field = useKjunField();
    const countId = useKjunId("kjun-count-");
    const textarea = ref<HTMLTextAreaElement | null>(null);
    expose({ focus: () => textarea.value?.focus(), el: textarea });
    const footer = () => props.showCount || !!slots.actions || props.submitLabel != null;
    const bounds = () => textareaBounds(props.size, props.rows, props.maxRows, footer());
    const grow = () => { const [minimum, maximum] = bounds(); if (maximum > minimum) growTextarea(textarea.value, minimum, maximum); };
    // Growth follows the text and the width it wraps in.
    watch(() => [props.modelValue, props.size, props.rows, props.maxRows, footer()], () => nextTick(grow), { flush: "post" });
    let observer: ResizeObserver | undefined;
    onMounted(() => {
      grow();
      if (typeof ResizeObserver === "undefined" || !textarea.value) return;
      let width = textarea.value.clientWidth;
      observer = new ResizeObserver(() => { const node = textarea.value; if (node && node.clientWidth !== width) { width = node.clientWidth; grow(); } });
      observer.observe(textarea.value);
    });
    onBeforeUnmount(() => observer?.disconnect());
    return () => {
      const spec = tokens.input[props.size], owner = field.value, hasFooter = footer();
      const [minimum, maximum] = bounds(), grows = maximum > minimum;
      const count = textareaCount(props.modelValue, props.maxLength);
      const invalid = props.error || !!owner?.error || count.over;
      const canSubmit = props.submitLabel != null && !props.disabled && !props.readOnly && !!props.modelValue.trim() && !count.over;
      const element = (
        <textarea {...mergeProps(attrs, {
          onInput: (event: Event) => emit("update:modelValue", (event.target as HTMLTextAreaElement).value),
          onKeydown: (event: KeyboardEvent) => {
            if (!event.defaultPrevented && canSubmit && event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.isComposing) { event.preventDefault(); emit("submit", props.modelValue); }
          },
        })}
          disabled={props.disabled} readonly={props.readOnly}
          ref={textarea}
          id={props.id || owner?.id}
          value={props.modelValue}
          rows={props.rows}
          maxlength={props.maxLength}
          required={props.required ?? owner?.required}
          aria-label={props.ariaLabel || (attrs["aria-label"] as string | undefined)}
          aria-labelledby={(attrs["aria-labelledby"] as string | undefined) || owner?.labelId}
          aria-describedby={mergeIds(attrs["aria-describedby"] as string | undefined, owner?.describedBy, props.showCount ? countId : undefined)}
          aria-invalid={invalid ? "true" : undefined}
          data-grow={grows || undefined}
          class={["kjun-input kjun-textarea", attrs.class]}
          style={[css({
            fontSize: spec.fontSize / 16 + "rem",
            lineHeight: spec.lineHeight / 16 + "rem",
            // With a footer the wrapper carries the border, so the text keeps the field's own inset.
            padding: hasFooter
              ? `${spec.textareaPaddingY}px ${spec.padding}px ${tokens.extensions.textarea.footerTextGap}px`
              : `${spec.textareaPaddingY}px ${spec.padding - tokens.border.controlWidth}px`,
            minHeight: minimum,
            ...(grows ? { height: minimum } : {}),
            borderRadius: hasFooter ? 0 : spec.radius,
            resize: props.resize,
          }), attrs.style as never]} />
      );
      if (!hasFooter) return element;
      return (
        <div class="kjun-textarea-field" data-invalid={invalid || undefined} data-disabled={props.disabled || undefined} data-readonly={props.readOnly || undefined} style={css({ borderRadius: spec.radius })}>
          {element}
          <div class="kjun-textarea-footer">
            {slots.actions?.()}
            {props.showCount && <span id={countId} class="kjun-textarea-count" data-over={count.over || undefined}>{count.text}</span>}
            {props.submitLabel != null && <KjunButton class="kjun-textarea-submit" size="sm" prefixIcon="arrow-up" ariaLabel={props.submitLabel} disabled={!canSubmit} onClick={() => emit("submit", props.modelValue)} />}
          </div>
        </div>
      );
    };
  },
});

// Preserve props/events while making the existing expose() contract visible to template refs.
export const KjunTextarea = KjunTextareaComponent as typeof KjunTextareaComponent & {
  new(): InstanceType<typeof KjunTextareaComponent> & { focus(): void; el: HTMLTextAreaElement | null };
};
