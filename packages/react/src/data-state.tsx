import { tokens,
advanceQueryDisplay,
initialQueryDisplay,
queryDisplayStatus,
type QueryDisplayProps,
} from "@kjun/tokens";
import { Component,useState,type ErrorInfo,type ReactNode } from "react";
import { DsButton } from "./button";
import {
DsAlert,
DsEmpty,
DsSkeleton,
DsSpinner,
type DsSkeletonProps,
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
export interface DsDataStateProps extends QueryDisplayProps {
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
  retryText?: string;
  size?: "sm" | "md" | "lg";
  skeleton?: boolean;
  skeletonType?: DsSkeletonProps["type"];
  skeletonCount?: number;
  children?: ReactNode;
  loadingContent?: ReactNode;
  emptyContent?: ReactNode;
  errorContent?: ReactNode;
  onRetry?: () => void;
  onEmptyAction?: () => void;
}
export function DsDataState({
  preserveContent = false,
  refreshing = false,
  refreshError,
  refreshingText = "갱신 중...",
  loadingPadding = "default",
  empty = false,
  emptyText = "데이터가 없습니다",
  emptyIcon,
  emptyActionText,
  loadingText = "로딩 중...",
  retryText = "다시 시도",
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
}: DsDataStateProps) {
  const state = useQueryDisplay(query),
    blockingError =
      query.error && !(state.usesQueryState && state.hasCurrentResult),
    visibleRefreshError =
      refreshError ||
      (state.usesQueryState && state.hasCurrentResult ? query.error : null),
    concealed = state.initialLoading || !!blockingError || empty,
    padding = tokens.extensions.state.padding[size];
  return (
    <div className="kjun-data-state" aria-busy={!!query.loading || refreshing}>
      <div>
        {(refreshing || state.queryRefreshing) && (
          <div className="kjun-data-status" role="status">
            <DsSpinner size="xs" />
            <span>{refreshingText}</span>
          </div>
        )}
      </div>
      {state.initialLoading ? (
        <div
          role="status"
          aria-label={loadingText}
          style={{ paddingBlock: loadingPadding === "none" ? 0 : padding }}
        >
          {loadingContent ||
            (skeleton ? (
              <div style={{ display: "grid", gap: tokens.dimension.value12 }}>
                {Array.from({ length: skeletonCount }, (_, i) => (
                  <DsSkeleton key={i} type={skeletonType} />
                ))}
              </div>
            ) : (
              <div className="kjun-data-loading">
                <DsSpinner size="md" />
                <p>{loadingText}</p>
              </div>
            ))}
        </div>
      ) : blockingError ? (
        <div className="kjun-state-actions" style={{ paddingBlock: padding }}>
          {errorContent || (
            <DsAlert type="danger" title="오류 발생" actions={onRetry && (
              <DsButton variant="secondary" onClick={onRetry}>
                {retryText}
              </DsButton>
            )}>
              {/* The alert's own body type applies, like any other DsAlert. */}
              {query.error}
            </DsAlert>
          )}
        </div>
      ) : empty ? (
        <div className="kjun-data-empty kjun-state-actions" style={{ paddingBlock: padding }}>
          {emptyContent || (
            <DsEmpty text={emptyText} icon={emptyIcon}>
              {emptyActionText && (
                <DsButton onClick={onEmptyAction}>{emptyActionText}</DsButton>
              )}
            </DsEmpty>
          )}
        </div>
      ) : null}
      {(!concealed || (preserveContent && state.hasQueryResult)) && (
        <div
          key="content"
          className={concealed ? "kjun-data-concealed" : undefined}
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
        <DsAlert type="warning" size="sm" actions={onRetry && (
          <DsButton variant="secondary" onClick={onRetry}>
            {retryText}
          </DsButton>
        )}>
          {visibleRefreshError} · 이전 조회 결과를 표시하고 있습니다.
        </DsAlert>
        </div>
      )}
    </div>
  );
}
export interface DsErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  onReset?: () => void;
}
export class DsErrorBoundary extends Component<
  DsErrorBoundaryProps,
  { error: boolean }
> {
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
            <h3>{this.props.fallbackMessage || "문제가 발생했습니다"}</h3>
            <p>다시 시도하면 문제가 해결될 수 있습니다.</p>
            <DsButton
              onClick={() => {
                this.setState({ error: false });
                this.props.onReset?.();
              }}
            >
              {/* It resets the boundary rather than reloading the page, like DataState's retry. */}
              다시 시도
            </DsButton>
          </div>
        )
      : this.props.children;
  }
}
