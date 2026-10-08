import { typeStyle } from "./typography";
import {
tokens,
advanceQueryDisplay,
initialQueryDisplay,
queryDisplayStatus,
type QueryDisplayProps,
} from "@kjun-ui/tokens";
import { Component,useState,type ErrorInfo,type ReactNode } from "react";
import { Platform,View,type ViewStyle } from "react-native";
import { DataStateContentContext } from "./data-state-context";
import { DsButton } from "./button";
import {
DsAlert,
DsEmpty,
DsSkeleton,
DsSpinner,
type DsSkeletonProps,
} from "./display";
import { KText,content } from "./internal";
import { useKjunStyles } from "./provider";
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
  const { colors } = useKjunStyles();
  return (
    <View
      style={{ position: "relative" }}
      accessibilityState={{ busy: !!query.loading || refreshing }}
    >
      <View>
        {(refreshing || state.queryRefreshing) && (
          <View
            accessibilityRole="alert"
            style={{
              alignSelf: "flex-end",
              maxWidth: "100%",
              marginBottom: tokens.dimension.value12,
              flexDirection: "row",
              alignItems: "center",
              gap: tokens.dimension.value6,
              paddingVertical: tokens.dimension.value4,
              paddingHorizontal: tokens.dimension.value8,
              borderRadius: tokens.radius.radius12,
              backgroundColor: colors.surface,
            }}
          >
            <DsSpinner size="xs" />
            <KText style={{ ...typeStyle('caption'), color: colors.textTertiary, flexShrink: 1, minWidth: 0 }}>
              {refreshingText}
            </KText>
          </View>
        )}
      </View>
      {state.initialLoading ? (
        <View
          accessibilityLabel={loadingText}
          style={{ paddingVertical: loadingPadding === "none" ? 0 : padding }}
        >
          {loadingContent ||
            (skeleton ? (
              <View style={{ gap: tokens.dimension.value12 }}>
                {Array.from({ length: skeletonCount }, (_, i) => (
                  <DsSkeleton key={i} type={skeletonType} />
                ))}
              </View>
            ) : (
              <View style={{ alignItems: "center", gap: tokens.dimension.value12 }}>
                <DsSpinner size="md" />
                <KText style={{ ...typeStyle("body"), color: colors.textSecondary, textAlign: "center", maxWidth: "100%" }}>{loadingText}</KText>
              </View>
            ))}
        </View>
      ) : blockingError ? (
        <DataStateContentContext.Provider value="message">
        <View style={{ paddingVertical: padding }}>
          {errorContent || (
            <DsAlert type="danger" title="오류 발생" actions={onRetry && (
              <DsButton variant="secondary" onPress={onRetry}>
                {retryText}
              </DsButton>
            )}>
              {/* The alert's own body type applies, like any other DsAlert. */}
              {query.error}
            </DsAlert>
          )}
        </View>
        </DataStateContentContext.Provider>
      ) : empty ? (
        <DataStateContentContext.Provider value="empty">
        <View style={{ paddingVertical: padding }}>
          {emptyContent || (
            <DsEmpty text={emptyText} icon={emptyIcon}>
              {emptyActionText && (
                <DsButton onPress={onEmptyAction}>{emptyActionText}</DsButton>
              )}
            </DsEmpty>
          )}
        </View>
        </DataStateContentContext.Provider>
      ) : null}
      {(!concealed || (preserveContent && state.hasQueryResult)) && (
        <View
          key="content"
          accessibilityElementsHidden={concealed}
          importantForAccessibility={concealed ? "no-hide-descendants" : "auto"}
          pointerEvents={concealed ? "none" : "auto"}
          style={
            concealed
              ? {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  opacity: 0,
                  ...(Platform.OS === "web"
                    ? ({ visibility: "hidden" } as ViewStyle)
                    : {}),
                }
              : { opacity: query.loading && !state.usesQueryState ? tokens.states.opacity.pending : 1 }
          }
        >
          {content(children)}
        </View>
      )}
      {visibleRefreshError && !state.initialLoading && (
        <DataStateContentContext.Provider value="message">
        <View style={{ marginTop: tokens.dimension.value12 }}>
        {/* Retry sits in the actions slot like the blocking error; the sm alert sizes the button. */}
        <DsAlert type="warning" size="sm" actions={onRetry && (
          <DsButton variant="secondary" onPress={onRetry}>
            {retryText}
          </DsButton>
        )}>
          {`${visibleRefreshError} · 이전 조회 결과를 표시하고 있습니다.`}
        </DsAlert>
        </View>
        </DataStateContentContext.Provider>
      )}
    </View>
  );
}
function BoundaryDescription() {
  const { colors } = useKjunStyles();
  return <KText style={{ ...typeStyle({ ...tokens.typography.caption, fontSizePx: tokens.extensions.state.descriptionSize }), color:colors.textSecondary, textAlign:"center" }}>다시 시도하면 문제가 해결될 수 있습니다.</KText>;
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
          <View
            style={{
              alignItems: "center",
              paddingVertical: tokens.dimension.value64,
              paddingHorizontal: tokens.dimension.value24,
              gap: tokens.dimension.value16,
            }}
          >
            <View style={{ gap:tokens.dimension.value8, alignItems:"center" }}>
            <KText style={{ ...typeStyle({ ...tokens.typography.sectionTitle, fontSizePx: tokens.extensions.state.titleSize }), textAlign:"center" }}>
              {this.props.fallbackMessage || "문제가 발생했습니다"}
            </KText>
            <BoundaryDescription />
            </View>
            {/* DsButton hugs the start edge by default; the fallback centers it with its text.
                It resets the boundary rather than reloading the page, like DataState's retry. */}
            <DsButton
              style={{ alignSelf: "center" }}
              onPress={() => {
                this.setState({ error: false });
                this.props.onReset?.();
              }}
            >
              다시 시도
            </DsButton>
          </View>
        )
      : this.props.children;
  }
}
