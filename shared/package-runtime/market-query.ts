import type { QueryDisplayProps } from "@kjun-ui/tokens";

/**
 * Market views refresh in place. Loading over rows already shown (hasLoadedOnce without a queryKey) keeps them at
 * full strength under the refreshing status, like a query refresh, instead of a dim that reads as disabled.
 * The first load still shows the skeleton.
 */
export function marketQueryState(props: QueryDisplayProps) {
  const reload = !!props.loading && (props.queryKey ?? null) === null && !!props.hasLoadedOnce;
  return { loading: !!props.loading && !reload, refreshing: reload };
}

/** The footer count, update time and pagination describe the shown rows, so a blocking error hides them with the rows. */
export function marketBlockingError(props: QueryDisplayProps, status: { usesQueryState: boolean; hasCurrentResult: boolean }) {
  return !!props.error && !(status.usesQueryState && status.hasCurrentResult);
}
