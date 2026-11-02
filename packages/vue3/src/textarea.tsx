import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { textareaBounds, textareaCanSubmit, textareaCount, textareaGrows, textareaMaxRows, textareaPadding, textareaRemaining, textareaSubmitKey, type TextareaResize, type TextareaSubmitKey } from "../../../shared/package-runtime/textarea";
import { useKjunMessages } from "./runtime/messages";
import { hasContent } from "./runtime/slots";
import { growTextarea } from "../../../shared/package-runtime/textarea-grow";
import { defineComponent, getCurrentInstance, mergeProps, nextTick, onBeforeUnmount, onMounted, ref, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { KjunButton } from "./button";
import { useKjunField, useKjunId } from "./input";
import { css } from "./runtime/style";

const kjunTextareaProps = {
  modelValue: { type: String, default: "" },
  size: { type: String as PropType<InputSize>, default: "md" },
  error: { type: Boolean, default: false },
  /** Manual resizing (default "none"). A field the user can drag taller keeps that height instead of growing with its text. */
  resize: { type: String as PropType<TextareaResize>, default: "none" },
  rows: { type: Number, default: 3 },
  /** The field grows with its text from rows up to maxRows, then scrolls (default 6; rows keeps it fixed). */
  maxRows: { type: Number, default: textareaMaxRows },
  maxLength: { type: Number, default: undefined },
  /** Shows the character count inside the field, as "length/maxLength" when maxLength is set. */
  showCount: { type: Boolean, default: false },
  /** Composer: shows a submit button at the end of the bar inside the field, named by this label. */
  submitLabel: { type: String, default: undefined },
  /** "mod-enter" (default) sends on Ctrl/⌘+Enter; "enter" sends on Enter, and Shift+Enter starts a new line. */
  submitOn: { type: String as PropType<TextareaSubmitKey>, default: "mod-enter" },
  /** Sending: the submit button spins and the field ignores further sends until it ends. */
  submitting: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
  id: { type: String, default: undefined },
  required: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
} as const;
export type KjunTextareaProps = ExtractPublicPropTypes<typeof kjunTextareaProps>;
/** v-model; other attributes reach the <textarea>. Slot `actions`: composer controls at the start of the bar.
 * Event: submit(value) from the submit button or the submit key while there is text within maxLength and nothing is sending. */
const KjunTextareaComponent = defineComponent({
  name: "KjunTextarea",
  inheritAttrs: false,
  props: kjunTextareaProps,
  emits: { "update:modelValue": (_value: string) => true, submit: (_value: string) => true },
  slots: Object as SlotsType<{ actions?: () => VNodeChild }>,
  setup(props, { attrs, emit, expose, slots }) {
    const field = useKjunField(), m = useKjunMessages();
    // The submit key works whenever someone listens for submit, with or without the built-in button.
    const instance = getCurrentInstance();
    const countId = useKjunId("kjun-count-");
    const textarea = ref<HTMLTextAreaElement | null>(null);
    expose({ focus: () => textarea.value?.focus(), el: textarea });
    // An actions slot that renders nothing adds no bar.
    const footer = () => props.showCount || hasContent(slots.actions?.()) || props.submitLabel != null;
    const bounds = () => textareaBounds(props.size, props.rows, props.maxRows, footer());
    const grow = () => { const [minimum, maximum] = bounds(); if (textareaGrows(minimum, maximum, props.resize)) growTextarea(textarea.value, minimum, maximum); };
    // Growth follows the text and the width it wraps in.
    watch(() => [props.modelValue, props.size, props.rows, props.maxRows, footer()], () => nextTick(grow), { flush: "post" });
    let observer: ResizeObserver | undefined;
    onMounted(() => {
      grow();
      if (typeof ResizeObserver === "undefined" || !textarea.value) return;
      let width = textarea.value.clientWidth;
      observer = new ResizeObserver(() => { const node = textarea.value; if (node && node.clientWidth !== width) { width = node.clientWidth; grow(); } });
      observer.observe(textarea.value);
      // A web font that arrives late can rewrap the text without changing the width.
      document.fonts?.ready.then(() => { if (textarea.value?.isConnected) grow(); });
    });
    onBeforeUnmount(() => observer?.disconnect());
    return () => {
      const spec = tokens.input[props.size], owner = field.value, hasFooter = footer();
      const [minimum, maximum] = bounds(), grows = textareaGrows(minimum, maximum, props.resize);
      const count = textareaCount(props.modelValue, props.maxLength);
      const invalid = props.error || !!owner?.error || count.over;
      const canSubmit = textareaCanSubmit({ value: props.modelValue, maxLength: props.maxLength, disabled: props.disabled, readOnly: props.readOnly, submitting: props.submitting });
      const remaining = props.showCount ? textareaRemaining(props.modelValue, props.maxLength) : null;
      const padding = textareaPadding(props.size, hasFooter);
      const element = (
        <textarea {...mergeProps(attrs, {
          onInput: (event: Event) => emit("update:modelValue", (event.target as HTMLTextAreaElement).value),
          onKeydown: (event: KeyboardEvent) => {
            if (event.defaultPrevented || !(instance?.vnode.props?.onSubmit) || !textareaSubmitKey(event, props.submitOn)) return;
            // The send key never types a line break, even while there is nothing to send.
            event.preventDefault();
            if (canSubmit) emit("submit", props.modelValue);
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
          aria-busy={props.submitting || undefined}
          data-grow={grows || undefined}
          class={["kjun-input kjun-textarea", attrs.class]}
          style={[css({
            fontSize: spec.fontSize / 16 + "rem",
            lineHeight: spec.lineHeight / 16 + "rem",
            padding: `${padding.top}px ${padding.x}px ${padding.bottom}px`,
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
            {/* Near the limit, what is left is announced as it changes; the count itself is read only on focus. */}
            {props.showCount && <span class="kjun-sr-only" aria-live="polite">{remaining == null ? "" : m.value.charactersLeft(remaining)}</span>}
            {props.submitLabel != null && <KjunButton class="kjun-textarea-submit" size="sm" prefixIcon="arrow-up" ariaLabel={props.submitLabel} loading={props.submitting} disabled={!canSubmit && !props.submitting}
              onClick={() => { if (canSubmit) emit("submit", props.modelValue); }} />}
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
