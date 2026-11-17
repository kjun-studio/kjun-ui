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
          aria-label={revealed ? loadingText : undefined}
          aria-hidden={revealed ? undefined : true}
          style={{ ...(loadingPadding === "none" ? { paddingBlock: 0 } : { paddingBlock: padding, minHeight }), visibility: revealed ? undefined : "hidden" }}
        >
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
        <div className="kjun-data-error kjun-state-actions" style={{ paddingBlock: padding, minHeight }}>
          {errorContent || (
            <KjunAlert type="danger" title={m.errorTitle} actions={onRetry && (
              <KjunButton variant="secondary" onClick={onRetry}>
                {retryText}
              </KjunButton>
            )}>
              {/* The alert's own body type applies, like any other KjunAlert. */}
              {query.error}
            </KjunAlert>
          )}
        </div>
      ) : empty ? (
        <div className="kjun-data-empty kjun-state-actions" style={{ paddingBlock: padding, minHeight }}>
          {emptyContent || (
            <KjunEmpty text={emptyText} icon={emptyIcon}>
              {emptyActionText && (
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
/** The default fallback: KjunEmpty's hierarchy inside DataState's padding and minimum height, so both read as one family. */
function BoundaryFallback({ title, size, onRetry }: { title?: string; size: BoundarySize; onRetry: () => void }) {
  const m = useKjunMessages();
  const compact = size === "sm";
  return (
    <div
      className="kjun-error-fallback kjun-state-actions"
      data-size={size}
      style={{ paddingBlock: tokens.extensions.state.padding[size], minHeight: tokens.extensions.state.minimumHeights[size] }}
    >
      <KjunEmpty icon="alert-circle" size={compact ? "sm" : "md"} headingLevel={3} text={title || m.somethingWentWrong} description={m.retryHint}>
        {/* Secondary like DataState's retry. It resets the boundary rather than reloading the page. */}
        <KjunButton variant="secondary" size={compact ? "sm" : "md"} onClick={onRetry}>
          {m.retry}
        </KjunButton>
      </KjunEmpty>
    </div>
  );
}
export interface KjunErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  /** The default fallback's padding and minimum height, like KjunDataState: md for pages and panels, sm for cards, lg for full pages. */
  size?: "sm" | "md" | "lg";
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  onReset?: () => void;
}
export class KjunErrorBoundary extends Component<
  KjunErrorBoundaryProps,
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }
  reset = () => {
    this.setState({ error: false });
    this.props.onReset?.();
  };
  render() {
    return this.state.error
      ? this.props.fallback || <BoundaryFallback title={this.props.fallbackMessage} size={this.props.size ?? "md"} onRetry={this.reset} />
      : this.props.children;
  }
}
