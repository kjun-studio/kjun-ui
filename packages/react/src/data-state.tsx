import { KjunMessageContext } from "../../../shared/package-runtime/messages-context";
import type { KjunMessageScope } from "../../../shared/package-runtime/messages";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
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
KjunSpinner,
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
    revealed = useLoadingReveal(state.initialLoading, loadingDelay);
  return (
    <div className="kjun-data-state" aria-busy={!!query.loading || refreshing}>
      <div className="kjun-data-status-slot">
        {(refreshing || state.queryRefreshing) && (
          <div className="kjun-data-status" role="status">
            <KjunSpinner size="xs" />
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
          style={{ paddingBlock: loadingPadding === "none" ? 0 : padding, visibility: revealed ? undefined : "hidden" }}
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
                <KjunSpinner size="md" />
                <p>{loadingText}</p>
              </div>
            ))}
        </div>
      ) : blockingError ? (
        <div className="kjun-data-error kjun-state-actions" style={{ paddingBlock: padding }}>
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
        <div className="kjun-data-empty kjun-state-actions" style={{ paddingBlock: padding }}>
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
export interface KjunErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  onReset?: () => void;
}
export class KjunErrorBoundary extends Component<
  KjunErrorBoundaryProps,
  { error: boolean }
> {
  static contextType = KjunMessageContext;
  declare context: KjunMessageScope;
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }
  render() {
    return this.state.error
      ? this.props.fallback || (
          <div className="kjun-error-fallback">
            <h3>{this.props.fallbackMessage || this.context.messages.somethingWentWrong}</h3>
            <p>{this.context.messages.retryHint}</p>
            <KjunButton
              onClick={() => {
                this.setState({ error: false });
                this.props.onReset?.();
              }}
            >
              {/* It resets the boundary rather than reloading the page, like DataState's retry. */}
              {this.context.messages.retry}
            </KjunButton>
          </div>
        )
      : this.props.children;
  }
}
