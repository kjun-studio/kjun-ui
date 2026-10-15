import { defineComponent, getCurrentInstance, onErrorCaptured, ref, type ExtractPublicPropTypes, type PropType } from "vue";
import { tokens, advanceQueryDisplay, initialQueryDisplay, queryDisplayStatus, type QueryDisplayProps, type QueryDisplayState } from "@kjun-ui/tokens";
import { KjunButton } from "./button";
import { KjunAlert, KjunEmpty, KjunSkeleton, KjunSpinner, type KjunSkeletonProps } from "./display";
import { hasContent } from "./runtime/slots";
import { css } from "./runtime/style";

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
  refreshingText: { type: String, default: "갱신 중..." },
  loadingPadding: { type: String as PropType<"default" | "none">, default: "default" },
  empty: { type: Boolean, default: false },
  emptyText: { type: String, default: "데이터가 없습니다" },
  emptyIcon: { type: String, default: undefined },
  emptyActionText: { type: String, default: undefined },
  loadingText: { type: String, default: "로딩 중..." },
  retryText: { type: String, default: "다시 시도" },
  size: { type: String as PropType<"sm" | "md" | "lg">, default: "md" },
  skeleton: { type: Boolean, default: false },
  skeletonType: { type: String as PropType<KjunSkeletonProps["type"]>, default: "text" },
  skeletonCount: { type: Number, default: 3 },
  /** Declared as a prop: the retry button appears only when the app listens. */
  onRetry: { type: Function as PropType<() => void>, default: undefined },
} as const;
export type KjunDataStateProps = ExtractPublicPropTypes<typeof kjunDataStateProps>;
/** Slots: default (content), loading, empty, error({ error, retry }). Events: retry, empty-action. */
export const KjunDataState = defineComponent({
  name: "KjunDataState",
  props: kjunDataStateProps,
  emits: { "empty-action": () => true },
  setup(props, { slots, emit }) {
    const status = useQueryDisplay(() => ({ queryKey: props.queryKey, resultKey: props.resultKey, loading: props.loading, error: props.error, hasLoadedOnce: props.hasLoadedOnce }));
    return () => {
      const state = status();
      const blockingError = props.error && !(state.usesQueryState && state.hasCurrentResult);
      const visibleRefreshError = props.refreshError || (state.usesQueryState && state.hasCurrentResult ? props.error : null);
      const concealed = state.initialLoading || !!blockingError || props.empty;
      const padding = tokens.extensions.state.padding[props.size];
      const retry = props.onRetry && <KjunButton variant="secondary" onClick={() => props.onRetry?.()}>{props.retryText}</KjunButton>;
      const loading = slots.loading?.(), empty = slots.empty?.(), error = slots.error?.({ error: props.error, retry: props.onRetry });
      return (
        <div class="kjun-data-state" aria-busy={props.loading || props.refreshing}>
          <div>
            {(props.refreshing || state.queryRefreshing) && (
              <div class="kjun-data-status" role="status"><KjunSpinner size="xs" /><span>{props.refreshingText}</span></div>
            )}
          </div>
          {state.initialLoading ? (
            <div role="status" aria-label={props.loadingText} style={css({ paddingBlock: props.loadingPadding === "none" ? 0 : padding })}>
              {hasContent(loading) ? loading : props.skeleton ? (
                <div style={css({ display: "grid", gap: tokens.dimension.value12 })}>
                  {Array.from({ length: props.skeletonCount }, (_, i) => <KjunSkeleton key={i} type={props.skeletonType} />)}
                </div>
              ) : (
                <div class="kjun-data-loading"><KjunSpinner size="md" /><p>{props.loadingText}</p></div>
              )}
            </div>
          ) : blockingError ? (
            <div class="kjun-state-actions" style={css({ paddingBlock: padding })}>
              {hasContent(error) ? error : (
                // The alert's own body type applies, like any other KjunAlert.
                <KjunAlert type="danger" title="오류 발생">{{ default: () => props.error, ...(retry ? { actions: () => retry } : {}) }}</KjunAlert>
              )}
            </div>
          ) : props.empty ? (
            <div class="kjun-data-empty kjun-state-actions" style={css({ paddingBlock: padding })}>
              {hasContent(empty) ? empty : (
                <KjunEmpty text={props.emptyText} icon={props.emptyIcon}>
                  {props.emptyActionText && <KjunButton onClick={() => emit("empty-action")}>{props.emptyActionText}</KjunButton>}
                </KjunEmpty>
              )}
            </div>
          ) : null}
          {(!concealed || (props.preserveContent && state.hasQueryResult)) && (
            <div key="content" class={concealed ? "kjun-data-concealed" : undefined} aria-hidden={concealed || undefined} inert={concealed || undefined}
              style={{ opacity: props.loading && !state.usesQueryState ? tokens.states.opacity.pending : undefined }}>
              {slots.default?.()}
            </div>
          )}
          {visibleRefreshError && !state.initialLoading && (
            <div class="kjun-data-warning kjun-state-actions">
              {/* Retry sits in the actions slot like the blocking error; the sm alert sizes the button. */}
              <KjunAlert type="warning" size="sm">{{ default: () => `${visibleRefreshError} · 이전 조회 결과를 표시하고 있습니다.`, ...(retry ? { actions: () => retry } : {}) }}</KjunAlert>
            </div>
          )}
        </div>
      );
    };
  },
});

const kjunErrorBoundaryProps = {
  fallbackMessage: { type: String, default: undefined },
} as const;
export type KjunErrorBoundaryProps = ExtractPublicPropTypes<typeof kjunErrorBoundaryProps>;
/**
 * Like React's error boundary, the nearest boundary handles a render error: it shows the fallback slot,
 * emits error, reports to the app's errorHandler (or the console, as Vue would) and stops outer boundaries.
 * Slots: default, fallback({ reset }). Events: error(error, info), reset.
 */
export const KjunErrorBoundary = defineComponent({
  name: "KjunErrorBoundary",
  props: kjunErrorBoundaryProps,
  emits: { error: (_error: unknown, _info: string) => true, reset: () => true },
  setup(props, { slots, emit }) {
    const failed = ref(false);
    const config = getCurrentInstance()!.appContext.config;
    onErrorCaptured((error, instance, info) => {
      failed.value = true;
      emit("error", error, info);
      if (config.errorHandler) config.errorHandler(error, instance, info);
      else console.error(error);
      return false;
    });
    const reset = () => { failed.value = false; emit("reset"); };
    return () => {
      if (!failed.value) return slots.default?.();
      const fallback = slots.fallback?.({ reset });
      return hasContent(fallback) ? fallback : (
        <div class="kjun-error-fallback">
          <h3>{props.fallbackMessage || "문제가 발생했습니다"}</h3>
          <p>다시 시도하면 문제가 해결될 수 있습니다.</p>
          {/* It resets the boundary rather than reloading the page, like DataState's retry. */}
          <KjunButton onClick={reset}>다시 시도</KjunButton>
        </div>
      );
    };
  },
});
