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
import { shadowLayers } from "../../../shared/package-runtime/elevation";
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
    // Loading, error and empty share one minimum height per size (content centred), so switching does not jump.
    minHeight = tokens.extensions.state.minimumHeights[size],
    revealed = useLoadingReveal(state.initialLoading, loadingDelay);
  const { colors } = useKjunStyles();
  return (
    <View
      style={{ position: "relative" }}
      accessibilityState={{ busy: !!query.loading || refreshing }}
    >
      {/* The refresh pill floats over the content's top centre, so a refresh never moves the content. */}
      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1, alignItems: "center", paddingHorizontal: tokens.dimension.value12 }}>
        {(refreshing || state.queryRefreshing) && (
          <View
            // Polite like the Web role="status"; Android announces only with an explicit live region.
            accessible
            role="status"
            accessibilityLiveRegion="polite"
            accessibilityLabel={refreshingText}
            style={{
              maxWidth: "100%",
              marginTop: tokens.dimension.value12,
              flexDirection: "row",
              alignItems: "center",
              gap: tokens.dimension.value6,
              paddingVertical: tokens.dimension.value4,
              paddingHorizontal: tokens.dimension.value8,
              borderRadius: tokens.radius.radius12,
              backgroundColor: colors.surface,
              // A floating layer: its own outline and a lifted shadow keep it apart from a surface of the same colour.
              borderWidth: tokens.border.defaultWidth,
              borderColor: colors.border,
              boxShadow: shadowLayers(tokens.elevation.lifted, colors),
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
          {...(revealed
            ? { accessible: true, role: "status" as const, accessibilityLabel: loadingText, accessibilityLiveRegion: "polite" as const }
            : {})}
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
        <DataStateContentContext.Provider value={errorContent ? "message" : "empty"}>
        <View {...(errorContent ? {} : stateErrorRole)} style={{ paddingVertical: padding, minHeight, justifyContent: "center" }}>
          {errorContent || (
            // The same form as the boundary's fallback: a failed first load has nothing to show, like a render error.
            <StateError size={size} title={m.errorTitle} description={query.error} retryText={retryText} onRetry={onRetry} />
          )}
        </View>
        </DataStateContentContext.Provider>
      ) : empty ? (
        <DataStateContentContext.Provider value="empty">
        <View style={{ paddingVertical: padding, minHeight, justifyContent: "center" }}>
          {emptyContent || (
            // A small state draws the small empty, like the boundary's fallback.
            <KjunEmpty text={emptyText} description={emptyDescription} icon={emptyIcon} size={size === "sm" ? "sm" : "md"}>
              {/* Like retry, the action appears only when the app handles it. */}
              {!!emptyActionText && !!onEmptyAction && (
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
// The content it replaced is gone, so the failure is announced at once.
const stateErrorRole = { role: "alert" as const, accessibilityLiveRegion: "assertive" as const };
/**
 * A failure with nothing else to show: KjunEmpty's hierarchy with a danger icon and a secondary retry.
 * DataState's blocking error and the boundary share it; their wrappers announce it.
 */
function StateError({ size, title, description, retryText, onRetry, headingLevel = false }: {
  size: BoundarySize; title: string; description?: ReactNode; retryText: string; onRetry?: () => void; headingLevel?: false | 3;
}) {
  const { colors } = useKjunStyles();
  const compact = size === "sm", g = emptyGeometry(compact ? "sm" : "md");
  return (
    <KjunEmpty
      icon={<IconBase name="alert-circle" size={g.iconSize} color={colors.danger} strokeWidth={g.iconStroke} />}
      size={compact ? "sm" : "md"}
      headingLevel={headingLevel}
      text={title}
      description={description}
    >
      {onRetry && (
        <KjunButton variant="secondary" size={compact ? "sm" : "md"} onPress={onRetry}>
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
    <DataStateContentContext.Provider value="empty">
    <View
      {...stateErrorRole}
      style={{ paddingVertical: tokens.extensions.state.padding[size], minHeight: tokens.extensions.state.minimumHeights[size], justifyContent: "center" }}
    >
      {/* Retry resets the boundary rather than reloading the page. */}
      <StateError size={size} headingLevel={3} title={title || m.somethingWentWrong} description={m.retryHint} retryText={m.retry} onRetry={onRetry} />
    </View>
    </DataStateContentContext.Provider>
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
