import { useKjunMessages } from "./runtime/messages";
import { spinnerGlyph } from "./spinner-glyph";
import { getCurrentInstance, onErrorCaptured, shallowRef, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens, advanceQueryDisplay, initialQueryDisplay, queryDisplayStatus, type QueryDisplayProps, type QueryDisplayState } from "@kjun-ui/tokens";
import { KjunButton } from "./button";
import { KjunAlert, KjunEmpty, KjunSkeleton, type KjunSkeletonProps } from "./display";
import { useLoadingReveal } from "./runtime/loading-reveal";
import { hasContent } from "./runtime/slots";
import { css } from "./runtime/style";

type StateSize = "sm" | "md" | "lg";
/**
 * A failure with nothing else to show: KjunEmpty's hierarchy with a danger icon and a secondary retry.
 * DataState's blocking error and the boundary share it; their wrappers announce it (role alert), as the content it replaced is gone.
 */
function stateError(o: { size: StateSize; title: string; description?: string | null; retryText: string; onRetry?: () => void; headingLevel?: false | 3 }) {
  const compact = o.size === "sm";
  return (
    <KjunEmpty icon="alert-circle" size={compact ? "sm" : "md"} headingLevel={o.headingLevel ?? false} text={o.title} description={o.description ?? undefined}>
      {o.onRetry && <KjunButton variant="secondary" size={compact ? "sm" : "md"} onClick={() => o.onRetry?.()}>{o.retryText}</KjunButton>}
    </KjunEmpty>
  );
}

/** Tracks which query the shown result belongs to; advances synchronously inside render like React's derived state. */
export function useQueryDisplay(query: () => QueryDisplayProps) {
  let state: QueryDisplayState | undefined;
  return () => {
    const props = query();
    if (!state) state = initialQueryDisplay(props);
    else if (state.queryKey !== (props.queryKey ?? null) || state.resultKey !== props.resultKey || state.loading !== !!props.loading)
      state = advanceQueryDisplay(state, props);
    return queryDisplayStatus(state, props);
  };
}

const kjunDataStateProps = {
  queryKey: { type: [String, Number, null] as PropType<string | number | null>, default: undefined },
  resultKey: { type: [String, Number, null] as PropType<string | number | null>, default: undefined },
  loading: { type: Boolean, default: false },
  error: { type: String as PropType<string | null>, default: null },
  hasLoadedOnce: { type: Boolean, default: undefined },
  preserveContent: { type: Boolean, default: false },
  refreshing: { type: Boolean, default: false },
  refreshError: { type: String as PropType<string | null>, default: null },
  refreshingText: { type: String, default: undefined },
  loadingPadding: { type: String as PropType<"default" | "none">, default: "default" },
  empty: { type: Boolean, default: false },
  emptyText: { type: String, default: undefined },
  /** Why it is empty and what to do next, under the title. */
  emptyDescription: { type: String, default: undefined },
  emptyIcon: { type: String, default: undefined },
  emptyActionText: { type: String, default: undefined },
  loadingText: { type: String, default: undefined },
  /** Milliseconds a first load must last before its loading display shows; the box keeps its space meanwhile. */
  loadingDelay: { type: Number, default: 0 },
  retryText: { type: String, default: undefined },
  size: { type: String as PropType<"sm" | "md" | "lg">, default: "md" },
  skeleton: { type: Boolean, default: false },
  skeletonType: { type: String as PropType<KjunSkeletonProps["type"]>, default: "text" },
  skeletonCount: { type: Number, default: 3 },
  /** Declared as a prop: the retry button appears only when the app listens. */
  onRetry: { type: Function as PropType<() => void>, default: undefined },
  /** Declared as a prop like onRetry: the empty action appears only when the app listens. */
  onEmptyAction: { type: Function as PropType<() => void>, default: undefined },
} as const;
export type KjunDataStateProps = ExtractPublicPropTypes<typeof kjunDataStateProps>;
/** Slots: default (content), loading, empty, error({ error, retry }). Listeners (declared as props): retry, empty-action. */
export const KjunDataState = defineComponent({
  name: "KjunDataState",
  props: kjunDataStateProps,
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    loading?: () => VNodeChild;
    empty?: () => VNodeChild;
    error?: (scope: { error: string | null; retry: (() => void) | undefined }) => VNodeChild;
  }>,
  setup(props, { slots }) {
    const m = useKjunMessages();
    const status = useQueryDisplay(() => ({ queryKey: props.queryKey, resultKey: props.resultKey, loading: props.loading, error: props.error, hasLoadedOnce: props.hasLoadedOnce }));
    const revealed = useLoadingReveal(() => status().initialLoading, () => props.loadingDelay);
    return () => {
      const state = status();
      const blockingError = props.error && !(state.usesQueryState && state.hasCurrentResult);
      const visibleRefreshError = props.refreshError || (state.usesQueryState && state.hasCurrentResult ? props.error : null);
      const concealed = state.initialLoading || !!blockingError || props.empty;
      const padding = tokens.extensions.state.padding[props.size];
      // Loading, error and empty share one minimum height per size, so switching between them does not jump.
      const minHeight = tokens.extensions.state.minimumHeights[props.size];
      const retry = props.onRetry && <KjunButton variant="secondary" onClick={() => props.onRetry?.()}>{(props.retryText ?? m.value.retry)}</KjunButton>;
      const loading = slots.loading?.(), empty = slots.empty?.(), error = slots.error?.({ error: props.error, retry: props.onRetry });
      return (
        <div class="kjun-data-state" aria-busy={props.loading || props.refreshing}>
          <div class="kjun-data-status-slot">
            {(props.refreshing || state.queryRefreshing) && (
              <div class="kjun-data-status" role="status">{spinnerGlyph({ size: tokens.extensions.spinner.sizes.xs, stroke: tokens.extensions.spinner.strokeWidths.xs })}<span>{(props.refreshingText ?? m.value.refreshing)}</span></div>
            )}
          </div>
          {state.initialLoading ? (
            <div class="kjun-data-loading-block" role={revealed() ? "status" : undefined} aria-hidden={revealed() ? undefined : "true"}
              style={css({ ...(props.loadingPadding === "none" ? { paddingBlock: 0 } : { paddingBlock: padding, minHeight }), visibility: revealed() ? undefined : "hidden" })}>
              {/* A live region announces its content, not its name: the default spinner shows the words, the others carry them hidden. */}
              {(hasContent(loading) || props.skeleton) && <span class="kjun-sr-only">{props.loadingText ?? m.value.loadingEllipsis}</span>}
              {hasContent(loading) ? loading : props.skeleton ? (
                <div style={css({ display: "grid", gap: tokens.dimension.value12 })}>
                  {Array.from({ length: props.skeletonCount }, (_, i) => <KjunSkeleton key={i} type={props.skeletonType} />)}
                </div>
              ) : (
                <div class="kjun-data-loading">{spinnerGlyph({ size: tokens.extensions.spinner.sizes.md, stroke: tokens.extensions.spinner.strokeWidths.md })}<p>{(props.loadingText ?? m.value.loadingEllipsis)}</p></div>
              )}
            </div>
          ) : blockingError ? (
            <div class="kjun-data-error kjun-state-actions" role={hasContent(error) ? undefined : "alert"} style={css({ paddingBlock: padding, minHeight })}>
              {hasContent(error) ? error
                // The same form as the boundary's fallback: a failed first load has nothing to show, like a render error.
                : stateError({ size: props.size, title: m.value.errorTitle, description: props.error, retryText: props.retryText ?? m.value.retry, onRetry: props.onRetry })}
            </div>
          ) : props.empty ? (
            <div class="kjun-data-empty kjun-state-actions" style={css({ paddingBlock: padding, minHeight })}>
              {hasContent(empty) ? empty : (
                // A small state draws the small empty, like the boundary's fallback; the action appears only when the app listens, like retry.
                <KjunEmpty text={(props.emptyText ?? m.value.noData)} description={props.emptyDescription} icon={props.emptyIcon} size={props.size === "sm" ? "sm" : "md"}>
                  {props.emptyActionText && props.onEmptyAction && <KjunButton onClick={() => props.onEmptyAction?.()}>{props.emptyActionText}</KjunButton>}
                </KjunEmpty>
              )}
            </div>
          ) : null}
          {(!concealed || (props.preserveContent && state.hasQueryResult)) && (
            <div key="content" class={"kjun-data-content" + (concealed ? " kjun-data-concealed" : "")} aria-hidden={concealed || undefined} inert={concealed || undefined}
              style={{ opacity: props.loading && !state.usesQueryState ? tokens.states.opacity.pending : undefined }}>
              {slots.default?.()}
            </div>
          )}
          {visibleRefreshError && !state.initialLoading && (
            <div class="kjun-data-warning kjun-state-actions">
              {/* Retry sits in the actions slot like the blocking error; the sm alert sizes the button. */}
              <KjunAlert type="warning" size="sm">{{ default: () => m.value.refreshError(String(visibleRefreshError)), ...(retry ? { actions: () => retry } : {}) }}</KjunAlert>
            </div>
          )}
        </div>
      );
    };
  },
});

const kjunErrorBoundaryProps = {
  fallbackMessage: { type: String, default: undefined },
  /** The default fallback's padding and minimum height, like KjunDataState: md for pages and panels, sm for cards, lg for full pages. */
  size: { type: String as PropType<"sm" | "md" | "lg">, default: "md" },
  /** A change in any of these values (a route, a query) resets a failed boundary, like pressing retry. */
  resetKeys: { type: Array as PropType<readonly unknown[]>, default: undefined },
} as const;
/** Event handler errors pass on, as React's boundary never sees them: "… event handler" in development, runtime-5/6 in production. */
const handlerError = (info: string) => /event handler$|#runtime-[56]$/.test(info);
export type KjunErrorBoundaryProps = ExtractPublicPropTypes<typeof kjunErrorBoundaryProps>;
/**
 * Like React's error boundary, the nearest boundary handles a render, setup, lifecycle or watcher error: it shows the
 * fallback slot, emits error, reports to the app's errorHandler (or the console, as Vue would) and stops outer boundaries.
 * Errors thrown in event handlers pass on untouched, as in React. Slots: default, fallback({ error, reset }). Events: error(error, info), reset.
 */
export const KjunErrorBoundary = defineComponent({
  name: "KjunErrorBoundary",
  props: kjunErrorBoundaryProps,
  emits: { error: (_error: unknown, _info: string) => true, reset: () => true },
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    fallback?: (scope: { error: Error; reset: () => void }) => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    const m = useKjunMessages();
    const failed = shallowRef<Error | null>(null);
    const config = getCurrentInstance()!.appContext.config;
    onErrorCaptured((error, instance, info) => {
      if (handlerError(info)) return;
      failed.value = error instanceof Error ? error : new Error(String(error));
      emit("error", error, info);
      if (config.errorHandler) config.errorHandler(error, instance, info);
      else console.error(error);
      return false;
    });
    const reset = () => { failed.value = null; emit("reset"); };
    // Only a boundary that was already showing its fallback resets when a key changes.
    watch(() => props.resetKeys, (next, previous) => {
      const a = previous ?? [], b = next ?? [];
      if (failed.value && (a.length !== b.length || a.some((value, i) => !Object.is(value, b[i])))) reset();
    });
    return () => {
      if (!failed.value) return slots.default?.();
      const fallback = slots.fallback?.({ error: failed.value, reset });
      if (hasContent(fallback)) return fallback;
      // The default fallback inside DataState's padding and minimum height, so both read as one family.
      return (
        // The content it replaced is gone, so the failure is announced at once.
        <div class="kjun-error-fallback kjun-state-actions" role="alert" data-size={props.size}
          style={css({ paddingBlock: tokens.extensions.state.padding[props.size], minHeight: tokens.extensions.state.minimumHeights[props.size] })}>
          {/* Retry resets the boundary rather than reloading the page. */}
          {stateError({ size: props.size, headingLevel: 3, title: props.fallbackMessage || m.value.somethingWentWrong, description: m.value.retryHint, retryText: m.value.retry, onRetry: reset })}
        </div>
      );
    };
  },
});
