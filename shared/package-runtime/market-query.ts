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

/** The footer count: the app's total, else the paged total, else the rows shown, so a list never reads "0" over its rows. */
export function marketTotal(totalCount: number | null | undefined, pagination: { total: number } | null | undefined, rowCount: number) {
  return totalCount ?? pagination?.total ?? rowCount;
}

/** selectedKey marks the row the rest of the screen shows (a chart or detail beside the list); null or undefined marks none. */
export function isSelectedMarketRow(rowKeyValue: unknown, selectedKey: unknown) {
  return selectedKey != null && rowKeyValue === selectedKey;
}
