import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { KjunSpinnerGlyph } from "./spinner-glyph";
import { tokens,
advanceQueryDisplay,
initialQueryDisplay,
queryDisplayStatus,
type QueryDisplayProps,
} from "@kjun-ui/tokens";
import { Component,useState,type ErrorInfo,type ReactNode } from "react";
import { useLoadingReveal } from "../../../shared/package-runtime/use-loading-reveal";
import { KjunButton } from "./button";
import {
KjunAlert,
KjunEmpty,
KjunSkeleton,
type KjunSkeletonProps,
} from "./display";
export function useQueryDisplay(props: QueryDisplayProps) {
  const [state, setState] = useState(() => initialQueryDisplay(props));
  let next = state;
  if (
    state.queryKey !== (props.queryKey ?? null) ||
    state.resultKey !== props.resultKey ||
    state.loading !== !!props.loading
  ) {
    next = advanceQueryDisplay(state, props);
    setState(next);
  }
  return queryDisplayStatus(next, props);
}
export interface KjunDataStateProps extends QueryDisplayProps {
  preserveContent?: boolean;
  refreshing?: boolean;
  refreshError?: string | null;
  refreshingText?: string;
  loadingPadding?: "default" | "none";
  empty?: boolean;
  emptyText?: string;
  /** Why it is empty and what to do next, under the title. */
  emptyDescription?: string;
  emptyIcon?: string;
  emptyActionText?: string;
  loadingText?: string;
  /** Milliseconds a first load must last before its loading display shows; the box keeps its space meanwhile. */
  loadingDelay?: number;
  retryText?: string;
  size?: "sm" | "md" | "lg";
  skeleton?: boolean;
  skeletonType?: KjunSkeletonProps["type"];
  skeletonCount?: number;
  children?: ReactNode;
  loadingContent?: ReactNode;
  emptyContent?: ReactNode;
  errorContent?: ReactNode;
  onRetry?: () => void;
  onEmptyAction?: () => void;
}
export function KjunDataState({
  preserveContent = false,
  refreshing = false,
  refreshError,
  refreshingText,
  loadingPadding = "default",
  empty = false,
  emptyText,
  emptyDescription,
  emptyIcon,
  emptyActionText,
  loadingText,
  loadingDelay = 0,
  retryText,
  size = "md",
  skeleton = false,
  skeletonType = "text",
  skeletonCount = 3,
  children,
  loadingContent,
  emptyContent,
  errorContent,
  onRetry,
  onEmptyAction,
  ...query
}: KjunDataStateProps) {
  const m = useKjunMessages();
  refreshingText ??= m.refreshing;
  emptyText ??= m.noData;
  loadingText ??= m.loadingEllipsis;
  retryText ??= m.retry;
  const state = useQueryDisplay(query),
    blockingError =
      query.error && !(state.usesQueryState && state.hasCurrentResult),
    visibleRefreshError =
      refreshError ||
      (state.usesQueryState && state.hasCurrentResult ? query.error : null),
    concealed = state.initialLoading || !!blockingError || empty,
    padding = tokens.extensions.state.padding[size],
    // Loading, error and empty share one minimum height per size, so switching between them does not jump.
    minHeight = tokens.extensions.state.minimumHeights[size],
    revealed = useLoadingReveal(state.initialLoading, loadingDelay);
  return (
    <div className="kjun-data-state" aria-busy={!!query.loading || refreshing}>
      <div className="kjun-data-status-slot">
        {(refreshing || state.queryRefreshing) && (
          <div className="kjun-data-status" role="status">
            <KjunSpinnerGlyph size={tokens.extensions.spinner.sizes.xs} stroke={tokens.extensions.spinner.strokeWidths.xs} />
            <span>{refreshingText}</span>
          </div>
        )}
      </div>
      {state.initialLoading ? (
        <div
          className="kjun-data-loading-block"
          role={revealed ? "status" : undefined}
          aria-hidden={revealed ? undefined : true}
          style={{ ...(loadingPadding === "none" ? { paddingBlock: 0 } : { paddingBlock: padding, minHeight }), visibility: revealed ? undefined : "hidden" }}
        >
          {/* A live region announces its content, not its name: the default spinner shows the words, the others carry them hidden. */}
          {(loadingContent || skeleton) && <span className="kjun-sr-only">{loadingText}</span>}
          {loadingContent ||
            (skeleton ? (
              <div style={{ display: "grid", gap: tokens.dimension.value12 }}>
                {Array.from({ length: skeletonCount }, (_, i) => (
                  <KjunSkeleton key={i} type={skeletonType} />
                ))}
              </div>
            ) : (
              <div className="kjun-data-loading">
                <KjunSpinnerGlyph size={tokens.extensions.spinner.sizes.md} stroke={tokens.extensions.spinner.strokeWidths.md} />
                <p>{loadingText}</p>
              </div>
            ))}
        </div>
      ) : blockingError ? (
        <div className="kjun-data-error kjun-state-actions" role={errorContent ? undefined : "alert"} style={{ paddingBlock: padding, minHeight }}>
          {errorContent || (
            // The same form as the boundary's fallback: a failed first load has nothing to show, like a render error.
            <StateError size={size} title={m.errorTitle} description={query.error} retryText={retryText} onRetry={onRetry} />
          )}
        </div>
      ) : empty ? (
        <div className="kjun-data-empty kjun-state-actions" style={{ paddingBlock: padding, minHeight }}>
          {emptyContent || (
            // A small state draws the small empty, like the boundary's fallback.
            <KjunEmpty text={emptyText} description={emptyDescription} icon={emptyIcon} size={size === "sm" ? "sm" : "md"}>
              {/* Like retry, the action appears only when the app handles it. */}
              {emptyActionText && onEmptyAction && (
                <KjunButton onClick={onEmptyAction}>{emptyActionText}</KjunButton>
              )}
            </KjunEmpty>
          )}
        </div>
      ) : null}
      {(!concealed || (preserveContent && state.hasQueryResult)) && (
        <div
          key="content"
          className={"kjun-data-content" + (concealed ? " kjun-data-concealed" : "")}
          aria-hidden={concealed || undefined}
          inert={concealed || undefined}
          style={{
            opacity: query.loading && !state.usesQueryState ? tokens.states.opacity.pending : undefined,
          }}
        >
          {children}
        </div>
      )}
      {visibleRefreshError && !state.initialLoading && (
        <div className="kjun-data-warning kjun-state-actions">
        {/* Retry sits in the actions slot like the blocking error; the sm alert sizes the button. */}
        <KjunAlert type="warning" size="sm" actions={onRetry && (
          <KjunButton variant="secondary" onClick={onRetry}>
            {retryText}
          </KjunButton>
        )}>
          {m.refreshError(String(visibleRefreshError))}
        </KjunAlert>
        </div>
      )}
    </div>
  );
}
type BoundarySize = "sm" | "md" | "lg";
/**
 * A failure with nothing else to show: KjunEmpty's hierarchy with a danger icon and a secondary retry.
 * DataState's blocking error and the boundary share it; their wrappers announce it (role alert), as the content it replaced is gone.
 */
function StateError({ size, title, description, retryText, onRetry, headingLevel = false }: {
  size: BoundarySize; title: string; description?: ReactNode; retryText: string; onRetry?: () => void; headingLevel?: false | 3;
}) {
  const compact = size === "sm";
  return (
    <KjunEmpty icon="alert-circle" size={compact ? "sm" : "md"} headingLevel={headingLevel} text={title} description={description}>
      {onRetry && (
        <KjunButton variant="secondary" size={compact ? "sm" : "md"} onClick={onRetry}>
          {retryText}
        </KjunButton>
      )}
    </KjunEmpty>
  );
}
/** The default fallback inside DataState's padding and minimum height, so both read as one family. */
function BoundaryFallback({ title, size, onRetry }: { title?: string; size: BoundarySize; onRetry: () => void }) {
  const m = useKjunMessages();
  return (
    <div
      className="kjun-error-fallback kjun-state-actions"
      role="alert"
      data-size={size}
      style={{ paddingBlock: tokens.extensions.state.padding[size], minHeight: tokens.extensions.state.minimumHeights[size] }}
    >
      {/* Retry resets the boundary rather than reloading the page. */}
      <StateError size={size} headingLevel={3} title={title || m.somethingWentWrong} description={m.retryHint} retryText={m.retry} onRetry={onRetry} />
    </div>
  );
}
export interface KjunErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  /** The default fallback's padding and minimum height, like KjunDataState: md for pages and panels, sm for cards, lg for full pages. */
  size?: "sm" | "md" | "lg";
  /** Replaces the default fallback; a function receives the caught error and reset, like Vue's fallback slot. */
  fallback?: ReactNode | ((props: KjunErrorFallbackProps) => ReactNode);
  /** A change in any of these values (a route, a query) resets a failed boundary, like pressing retry. */
  resetKeys?: readonly unknown[];
  onError?: (error: Error, info: ErrorInfo) => void;
  /** Called after the boundary resets, from retry, a fallback's reset or a resetKeys change. */
  onReset?: () => void;
}
export interface KjunErrorFallbackProps {
  error: Error;
  reset: () => void;
}
const changed = (a: readonly unknown[] = [], b: readonly unknown[] = []) =>
  a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
export class KjunErrorBoundary extends Component<
  KjunErrorBoundaryProps,
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }
  componentDidUpdate(previous: KjunErrorBoundaryProps, state: { error: Error | null }) {
    // Only a boundary that was already showing its fallback resets; the render that failed keeps it.
    if (this.state.error && state.error && changed(previous.resetKeys, this.props.resetKeys)) this.reset();
  }
  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };
  render() {
    const { error } = this.state, { fallback } = this.props;
    if (!error) return this.props.children;
    if (typeof fallback === "function") return fallback({ error, reset: this.reset });
    return fallback || <BoundaryFallback title={this.props.fallbackMessage} size={this.props.size ?? "md"} onRetry={this.reset} />;
  }
}
