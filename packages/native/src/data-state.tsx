import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { KjunSpinnerGlyph } from "./spinner-glyph";
import { emptyGeometry } from "../../../shared/package-runtime/empty-geometry";
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
import { useLoadingReveal } from "../../../shared/package-runtime/use-loading-reveal";
import { DataStateContentContext } from "./data-state-context";
import { IconBase, KjunButton } from "./button";
import {
KjunAlert,
KjunEmpty,
KjunSkeleton,
type KjunSkeletonProps,
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
    // Loading, error and empty share one minimum height per size (content centred), so switching does not jump.
    minHeight = tokens.extensions.state.minimumHeights[size],
    revealed = useLoadingReveal(state.initialLoading, loadingDelay);
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
            <KjunSpinnerGlyph size={tokens.extensions.spinner.sizes.xs} stroke={tokens.extensions.spinner.strokeWidths.xs} color={colors.brand} />
            <KText style={{ ...typeStyle('caption'), color: colors.textTertiary, flexShrink: 1, minWidth: 0 }}>
              {refreshingText}
            </KText>
          </View>
        )}
      </View>
      {state.initialLoading ? (
        <View
          accessibilityLabel={revealed ? loadingText : undefined}
          aria-hidden={revealed ? undefined : true}
          importantForAccessibility={revealed ? undefined : "no-hide-descendants"}
          style={{ ...(loadingPadding === "none" ? { paddingVertical: 0 } : { paddingVertical: padding, minHeight, justifyContent: "center" as const }), opacity: revealed ? undefined : 0 }}
        >
          {loadingContent ||
            (skeleton ? (
              <View style={{ gap: tokens.dimension.value12 }}>
                {Array.from({ length: skeletonCount }, (_, i) => (
                  <KjunSkeleton key={i} type={skeletonType} />
                ))}
              </View>
            ) : (
              <View style={{ alignItems: "center", gap: tokens.dimension.value12 }}>
                <KjunSpinnerGlyph size={tokens.extensions.spinner.sizes.md} stroke={tokens.extensions.spinner.strokeWidths.md} color={colors.brand} />
                <KText style={{ ...typeStyle("body"), color: colors.textSecondary, textAlign: "center", maxWidth: "100%" }}>{loadingText}</KText>
              </View>
            ))}
        </View>
      ) : blockingError ? (
        <DataStateContentContext.Provider value="message">
        <View style={{ paddingVertical: padding, minHeight, justifyContent: "center" }}>
          {errorContent || (
            <KjunAlert type="danger" title={m.errorTitle} actions={onRetry && (
              <KjunButton variant="secondary" onPress={onRetry}>
                {retryText}
              </KjunButton>
            )}>
              {/* The alert's own body type applies, like any other KjunAlert. */}
              {query.error}
            </KjunAlert>
          )}
        </View>
        </DataStateContentContext.Provider>
      ) : empty ? (
        <DataStateContentContext.Provider value="empty">
        <View style={{ paddingVertical: padding, minHeight, justifyContent: "center" }}>
          {emptyContent || (
            <KjunEmpty text={emptyText} icon={emptyIcon}>
              {!!emptyActionText && (
                <KjunButton onPress={onEmptyAction}>{emptyActionText}</KjunButton>
              )}
            </KjunEmpty>
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
        <KjunAlert type="warning" size="sm" actions={onRetry && (
          <KjunButton variant="secondary" onPress={onRetry}>
            {retryText}
          </KjunButton>
        )}>
          {m.refreshError(String(visibleRefreshError))}
        </KjunAlert>
        </View>
        </DataStateContentContext.Provider>
      )}
    </View>
  );
}
type BoundarySize = "sm" | "md" | "lg";
/** The default fallback: KjunEmpty's hierarchy inside DataState's padding and minimum height, so both read as one family. */
function BoundaryFallback({ title, size, onRetry }: { title?: string; size: BoundarySize; onRetry: () => void }) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles();
  const compact = size === "sm", g = emptyGeometry(compact ? "sm" : "md");
  return (
    <DataStateContentContext.Provider value="empty">
    <View style={{ paddingVertical: tokens.extensions.state.padding[size], minHeight: tokens.extensions.state.minimumHeights[size], justifyContent: "center" }}>
      <KjunEmpty
        icon={<IconBase name="alert-circle" size={g.iconSize} color={colors.danger} strokeWidth={g.iconStroke} />}
        size={compact ? "sm" : "md"}
        headingLevel={3}
        text={title || m.somethingWentWrong}
        description={m.retryHint}
      >
        {/* Secondary like DataState's retry. It resets the boundary rather than reloading the page. */}
        <KjunButton variant="secondary" size={compact ? "sm" : "md"} onPress={onRetry}>
          {m.retry}
        </KjunButton>
      </KjunEmpty>
    </View>
    </DataStateContentContext.Provider>
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
