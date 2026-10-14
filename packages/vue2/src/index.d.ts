// Generated from the compiled Vue component contracts by scripts/api.mjs.
export type { KjunIconDefinition, KjunIconRegistry } from "@kjun-ui/icons";
import type { VueConstructor, CreateElement, VNode } from "vue";
export type { ShadowLayer, ElevationRole, CardElevation, TableSort, KjunColors, KjunDomainColors, ColorRole, DomainColorRole, ButtonSize, InputSize, ButtonVariant, KjunFeedback, ConfirmOptions, PromptOptions, ToastOptions } from "@kjun-ui/tokens";
export interface KjunAccordionProps {
  "formatters"?: Record<string, any>;
  "multiple"?: boolean;
  "tone"?: "card" | "muted";
}
export const KjunAccordion: VueConstructor;
export interface KjunAccordionItemProps {
  "formatters"?: Record<string, any>;
  "title"?: string;
  "defaultOpen"?: boolean;
  "disabled"?: boolean;
}
export const KjunAccordionItem: VueConstructor;
export interface KjunAlertProps {
  "formatters"?: Record<string, any>;
  "type"?: "success" | "warning" | "danger" | "info" | "error";
  "variant"?: string | null;
  "size"?: "sm" | "md" | "lg";
  "title"?: string;
  "closable"?: boolean;
}
export const KjunAlert: VueConstructor;
export interface KjunAnimatedNumberProps {
  "formatters"?: Record<string, any>;
  "value": number | string;
  "decimals"?: number;
  "prefix"?: string;
  "suffix"?: string;
  "animated"?: boolean;
  "fromPrevious"?: boolean;
  "formatter"?: ((...args: any[]) => any) | null;
}
export const KjunAnimatedNumber: VueConstructor;
export interface KjunAvatarProps {
  "src"?: string;
  "name"?: string;
  "alt"?: string;
  "decorative"?: boolean;
  "size"?: "sm" | "md" | "lg";
  "shape"?: "circle" | "square";
}
export const KjunAvatar: VueConstructor;
export interface KjunBadgeProps {
  "formatters"?: Record<string, any>;
  "variant"?: "default" | "secondary" | "primary" | "success" | "warning" | "danger" | "info" | "price-up" | "price-down";
  "size"?: "xs" | "sm" | "md" | "lg" | "xl";
  "dot"?: boolean;
}
export const KjunBadge: VueConstructor;
export interface KjunBottomActionBarProps {
  "description"?: string;
  "safeAreaBottom"?: number;
  "keyboardVisible"?: boolean;
  "hideOnKeyboard"?: boolean;
}
export const KjunBottomActionBar: VueConstructor;
export interface KjunBottomNavigationProps {
  "items": Array<{
    key: string;
    label: string;
    href: string;
    icon?: string;
    badge?: string | number;
    disabled?: boolean;
}>;
  "value": string;
  "ariaLabel"?: string;
  "safeAreaBottom"?: number;
  "keyboardVisible"?: boolean;
  "hideOnKeyboard"?: boolean;
}
export const KjunBottomNavigation: VueConstructor;
export interface KjunBreadcrumbProps {
  "formatters"?: Record<string, any>;
  "items": any[];
}
export const KjunBreadcrumb: VueConstructor;
export interface KjunButtonProps {
  "formatters"?: Record<string, any>;
  "variant"?: "primary" | "secondary" | "ghost" | "danger" | "danger-ghost" | "success" | "warning";
  "size"?: "xs" | "sm" | "md" | "lg" | "xl";
  "htmlType"?: string;
  "disabled"?: boolean;
  "loading"?: boolean;
  "block"?: boolean;
  "prefixIcon"?: string | null;
  "suffixIcon"?: string | null;
  "prefixIconFilled"?: boolean;
  "suffixIconFilled"?: boolean;
  "ariaLabel"?: string | null;
  "spinOnLoading"?: boolean | null;
}
export const KjunButton: VueConstructor;
export interface KjunButtonGroupProps {
  "formatters"?: Record<string, any>;
  "value"?: string | number | null;
  "options": any[];
  "size"?: "xs" | "sm" | "md" | "lg" | "xl";
  "variant"?: "primary" | "secondary" | "ghost";
  "disabled"?: boolean;
  "fullWidth"?: boolean;
  "ariaLabel"?: string | null;
}
export const KjunButtonGroup: VueConstructor;
export interface KjunCardProps {
  "formatters"?: Record<string, any>;
  "title"?: string;
  "subtitle"?: string;
  "padding"?: "none" | "sm" | "md" | "lg";
  "bodyPadding"?: "none" | "sm" | "md" | "lg";
  "radius"?: "none" | "sm" | "md" | "lg";
  "surface"?: "default" | "muted" | "accent" | "success" | "warning" | "danger" | "subtle" | "brand" | "glass";
  "elevation"?: "flat" | "raised";
  "border"?: boolean;
  "dividers"?: boolean;
}
export const KjunCard: VueConstructor;
export interface KjunChartSkeletonProps {
  "formatters"?: Record<string, any>;
  "loadingText"?: string;
  "kind"?: "grid" | "line" | "bar" | "donut" | "candle" | "matrix";
  "height"?: string | number;
}
export const KjunChartSkeleton: VueConstructor;
export interface KjunCheckboxProps {
  "formatters"?: Record<string, any>;
  "value"?: boolean | any[];
  "val"?: string | number | boolean | Record<string, any> | null;
  "label"?: string;
  "disabled"?: boolean;
  "size"?: "sm" | "md" | "lg";
}
export const KjunCheckbox: VueConstructor;
export interface KjunChipProps {
  "label": string;
  "icon"?: string;
  "removable"?: boolean;
  "disabled"?: boolean;
  "size"?: "sm" | "md" | "lg";
  "removeLabel"?: string;
}
export const KjunChip: VueConstructor;
export interface KjunCollectionMarkProps {
  "formatters"?: Record<string, any>;
  "kind": "favorite" | "interest";
  "active"?: boolean;
  "size"?: "sm" | "md" | "lg";
}
export const KjunCollectionMark: VueConstructor;
export interface KjunComboboxProps {
  "error"?: boolean;
  "ariaLabel"?: string;
  "formatters"?: Record<string, any>;
  "value"?: string | number | null;
  "options"?: any[];
  "placeholder"?: string;
  "labelKey"?: string;
  "valueKey"?: string;
  "filterFn"?: ((...args: any[]) => any) | null;
  "size"?: "sm" | "md" | "lg";
  "disabled"?: boolean;
  "clearable"?: boolean;
  "emptyText"?: string;
}
export const KjunCombobox: VueConstructor;
export interface KjunCopyButtonProps {
  "formatters"?: Record<string, any>;
  "ariaLabel"?: string;
  "copyText"?: ((...args: any[]) => any) | null;
  "value": string;
  "text"?: string | null;
  "successText"?: string;
  "inline"?: boolean;
  "size"?: "xs" | "sm" | "md";
  "disabled"?: boolean;
}
export const KjunCopyButton: VueConstructor;
export interface KjunDataStateProps {
  "queryKey"?: string | number | null;
  "resultKey"?: string | number;
  "loading"?: boolean;
  "error"?: string | null;
  "hasLoadedOnce"?: boolean;
  "formatters"?: Record<string, any>;
  "preserveContent"?: boolean;
  "refreshing"?: boolean;
  "refreshError"?: string | null;
  "refreshingText"?: string;
  "loadingPadding"?: "default" | "none";
  "empty"?: boolean;
  "emptyText"?: string;
  "emptyIcon"?: string;
  "emptyActionText"?: string | null;
  "loadingText"?: string;
  "retryText"?: string;
  "size"?: "sm" | "md" | "lg";
  "skeleton"?: boolean;
  "skeletonType"?: "text" | "card" | "table" | "stat" | "chart" | "block";
  "skeletonCount"?: number;
}
export const KjunDataState: VueConstructor;
export interface KjunDatePickerProps {
  "error"?: boolean;
  "ariaLabel"?: string;
  "formatters"?: Record<string, any>;
  "value"?: string;
  "placeholder"?: string;
  "min"?: string | null;
  "max"?: string | null;
  "size"?: "sm" | "md" | "lg";
  "disabled"?: boolean;
}
export const KjunDatePicker: VueConstructor;
export interface KjunDeviationProps {
  "formatters"?: Record<string, any>;
  "value"?: number | null;
  "variant"?: "pill" | "badge" | "text";
  "signalThreshold"?: number;
  "decimals"?: number;
}
export const KjunDeviation: VueConstructor;
export interface KjunDrawerProps {
  "formatters"?: Record<string, any>;
  "value"?: boolean;
  "title"?: string;
  "position"?: "left" | "right" | "top" | "bottom";
  "width"?: string;
  "closable"?: boolean;
  "closeOnOverlay"?: boolean;
  "closeOnEsc"?: boolean;
  "noPadding"?: boolean;
}
export const KjunDrawer: VueConstructor;
export interface KjunDropdownProps {
  "formatters"?: Record<string, any>;
  "disabled"?: boolean;
  "menuId"?: string;
  "triggerId"?: string;
  "menuClass"?: string | any[] | Record<string, any>;
  "placement"?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
}
export const KjunDropdown: VueConstructor;
export interface KjunDropdownDividerProps {
  "formatters"?: Record<string, any>;
}
export const KjunDropdownDivider: VueConstructor;
export interface KjunDropdownItemProps {
  "formatters"?: Record<string, any>;
  "variant"?: "default" | "danger";
  "icon"?: string | null;
  "disabled"?: boolean;
  "selected"?: boolean | null;
}
export const KjunDropdownItem: VueConstructor;
export interface KjunEmptyProps {
  "formatters"?: Record<string, any>;
  "text"?: string;
  "description"?: string;
  "icon"?: string;
}
export const KjunEmpty: VueConstructor;
export interface KjunErrorBoundaryProps {
  "formatters"?: Record<string, any>;
  "fallbackMessage"?: string;
}
export const KjunErrorBoundary: VueConstructor;
export interface KjunExecutionStatusBadgeProps {
  "formatters"?: Record<string, any>;
  "status"?: string | null;
  "label"?: string;
  "size"?: "xs" | "sm" | "md" | "lg" | "xl";
}
export const KjunExecutionStatusBadge: VueConstructor;
export interface KjunExternalLinkProps {
  "formatters"?: Record<string, any>;
  "href"?: string;
  "mode"?: "icon" | "text";
  "label"?: string;
}
export const KjunExternalLink: VueConstructor;
export interface KjunFeedbackProviderProps {

}
export const KjunFeedbackProvider: VueConstructor;
export interface KjunFilterGroupProps {
  "formatters"?: Record<string, any>;
  "value"?: string | number | any[] | null;
  "options": any[];
  "multiple"?: boolean;
  "size"?: "xs" | "sm" | "md" | "lg" | "xl";
  "disabled"?: boolean;
  "scroll"?: boolean;
  "ariaLabel"?: string | null;
}
export const KjunFilterGroup: VueConstructor;
export interface KjunFormActionsProps {
  "formatters"?: Record<string, any>;
  "confirmText"?: string;
  "cancelText"?: string;
  "size"?: "sm" | "md" | "lg";
  "loading"?: boolean;
  "confirmDisabled"?: boolean;
  "cancelDisabled"?: boolean;
  "showConfirm"?: boolean;
  "showCancel"?: boolean;
  "variant"?: "primary" | "danger" | "success";
  "cancelVariant"?: "ghost" | "secondary";
}
export const KjunFormActions: VueConstructor;
export interface KjunFormGroupProps {
  "formatters"?: Record<string, any>;
  "label"?: string;
  "id"?: string | null;
  "required"?: boolean;
  "error"?: string;
  "hint"?: string;
}
export const KjunFormGroup: VueConstructor;
export interface KjunFormSkeletonProps {
  "formatters"?: Record<string, any>;
  "fields"?: any[];
  "columns"?: number;
  "multiline"?: boolean;
  "size"?: "sm" | "md" | "lg";
}
export const KjunFormSkeleton: VueConstructor;
export interface KjunFreshnessProps {
  "formatters"?: Record<string, any>;
  "stale"?: boolean;
  "source"?: string | null;
  "fetchedAt"?: string | null;
}
export const KjunFreshness: VueConstructor;
export interface KjunHeatmapCellProps {
  "formatters"?: Record<string, any>;
  "value"?: number;
  "min"?: number;
  "max"?: number;
  "mode"?: string;
  "color"?: string;
}
export const KjunHeatmapCell: VueConstructor;
export interface KjunIconProps {
  "formatters"?: Record<string, any>;
  "name": string;
  "size"?: string | number | null;
  "spin"?: boolean;
  "filled"?: boolean;
}
export const KjunIcon: VueConstructor;
export interface KjunIconToggleProps {
  "formatters"?: Record<string, any>;
  "active"?: boolean;
  "activeIcon": string;
  "inactiveIcon"?: string | null;
  "activeColorClass"?: string;
  "inactiveColorClass"?: string;
  "size"?: "xs" | "sm" | "md" | "lg" | "xl";
  "disabled"?: boolean;
  "loading"?: boolean;
  "ariaLabel": string;
  "tooltip"?: string | null;
  "tooltipPlacement"?: "top" | "bottom" | "left" | "right";
  "tooltipDelay"?: number;
}
export const KjunIconToggle: VueConstructor;
export interface KjunImageProps {
  "src"?: string;
  "alt": string;
  "decorative"?: boolean;
  "aspectRatio"?: number;
  "fit"?: "cover" | "contain";
  "lazy"?: boolean;
}
export const KjunImage: VueConstructor;
export interface KjunInputProps {
  "error"?: boolean;
  "ariaLabel"?: string | null;
  "formatters"?: Record<string, any>;
  "value"?: string | number;
  "type"?: string;
  "placeholder"?: string;
  "size"?: "sm" | "md" | "lg";
  "disabled"?: boolean;
  "readonly"?: boolean;
  "required"?: boolean;
  "errorMessage"?: string | null;
  "clearable"?: boolean;
  "prefixIcon"?: string | null;
  "suffixIcon"?: string | null;
  "min"?: number | string | null;
  "max"?: number | string | null;
  "step"?: number | string | null;
  "inputmode"?: "none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url" | null;
  "autocomplete"?: string | null;
}
export const KjunInput: VueConstructor;
export interface KjunKpiHeroProps {
  "formatters"?: Record<string, any>;
  "loading"?: boolean;
  "formatter"?: ((...args: any[]) => any) | null;
  "deltaFormatter"?: ((...args: any[]) => any) | null;
  "label": string;
  "value": number | string;
  "prefix"?: string;
  "suffix"?: string;
  "decimals"?: number;
  "deltaAbsolute"?: number | null;
  "deltaPercent"?: number | null;
  "deltaDescription"?: string;
  "secondary"?: any[];
  "animated"?: boolean;
  "size"?: "md" | "sm";
}
export const KjunKpiHero: VueConstructor;
export interface KjunKpiRowProps {
  "formatters"?: Record<string, any>;
  "loading"?: boolean;
  "items": any[];
  "size"?: "md" | "sm";
  "mobileSummary"?: boolean;
}
export const KjunKpiRow: VueConstructor;
export interface KjunListRowProps {
  "title": string;
  "description"?: string;
  "href"?: string;
  "disabled"?: boolean;
}
export const KjunListRow: VueConstructor;
export interface KjunListSectionProps {
  "title"?: string;
  "description"?: string;
  "ariaLabel"?: string;
}
export const KjunListSection: VueConstructor;
export interface KjunListSkeletonProps {
  "formatters"?: Record<string, any>;
  "rows"?: number;
  "variant"?: "market" | "compact" | "notification";
  "avatar"?: boolean;
  "avatarSize"?: string;
  "quote"?: boolean;
}
export const KjunListSkeleton: VueConstructor;
export interface KjunMarketCardsProps {
  "queryKey"?: string | number | null;
  "resultKey"?: string | number;
  "loading"?: boolean;
  "error"?: string | null;
  "hasLoadedOnce"?: boolean;
  "formatters"?: Record<string, any>;
  "rows"?: any[];
  "columns": any[];
  "rowKey"?: string;
  "metricConfig": Record<string, any>;
  "excludeKeys"?: any[];
  "storageNamespace": string;
  "interestKeys"?: unknown;
  "favoriteKeys"?: unknown;
  "sortKey"?: string | null;
  "sortOrder"?: string;
  "emitSortOnMount"?: boolean;
  "pagination"?: Record<string, any> | null;
  "currency"?: string;
  "primaryLabel"?: (...args: any[]) => any;
  "subMeta"?: (...args: any[]) => any;
  "changeMetricKey"?: string;
  "priceMetricKeys"?: any[];
  "metricLoading"?: (...args: any[]) => any;
  "emptyMessage"?: string;
  "emptySubMessage"?: string;
  "showFooter"?: boolean;
  "calculatedAt"?: string | null;
  "footerNote"?: string;
  "totalCount"?: number;
  "unitLabel"?: string;
}
export const KjunMarketCards: VueConstructor;
export interface KjunMarketListPanelProps {
  "formatters"?: Record<string, any>;
}
export const KjunMarketListPanel: VueConstructor;
export interface KjunMarketSimpleListProps {
  "queryKey"?: string | number | null;
  "resultKey"?: string | number;
  "loading"?: boolean;
  "error"?: string | null;
  "hasLoadedOnce"?: boolean;
  "formatters"?: Record<string, any>;
  "rows"?: any[];
  "rowKey"?: string;
  "interestKeys"?: unknown;
  "favoriteKeys"?: unknown;
  "pagination"?: Record<string, any> | null;
  "primaryLabel"?: (...args: any[]) => any;
  "subMeta"?: (...args: any[]) => any;
  "priceValue": (...args: any[]) => any;
  "changeValue": (...args: any[]) => any;
  "changeLoading"?: (...args: any[]) => any;
  "priceFormatter": (...args: any[]) => any;
  "closingPrice"?: boolean;
  "emptyMessage"?: string;
  "emptySubMessage"?: string;
  "showFooter"?: boolean;
  "calculatedAt"?: string | null;
  "footerNote"?: string;
  "totalCount"?: number;
  "unitLabel"?: string;
}
export const KjunMarketSimpleList: VueConstructor;
export interface KjunMarketTableProps {
  "queryKey"?: string | number | null;
  "resultKey"?: string | number;
  "loading"?: boolean;
  "error"?: string | null;
  "hasLoadedOnce"?: boolean;
  "formatters"?: Record<string, any>;
  "rows"?: any[];
  "columns": any[];
  "rowKey"?: string;
  "cellLoading"?: (...args: any[]) => any;
  "showActions"?: boolean;
  "interestKeys"?: unknown;
  "favoriteKeys"?: unknown;
  "togglingInterest"?: string | number | null;
  "togglingFavorite"?: string | number | null;
  "sortKey"?: string | null;
  "sortOrder"?: string;
  "pagination"?: Record<string, any> | null;
  "priceFormatter"?: ((...args: any[]) => any) | null;
  "currency"?: string;
  "embedded"?: boolean;
  "emptyMessage"?: string;
  "emptySubMessage"?: string;
  "showFooter"?: boolean;
  "calculatedAt"?: string | null;
  "footerNote"?: string;
  "totalCount"?: number;
  "unitLabel"?: string;
}
export const KjunMarketTable: VueConstructor;
export interface KjunMarketTableSkeletonProps {
  "formatters"?: Record<string, any>;
  "columns"?: any[];
  "rows"?: number;
  "showActions"?: boolean;
  "alignClass"?: ((...args: any[]) => any) | null;
  "widthClass"?: ((...args: any[]) => any) | null;
}
export const KjunMarketTableSkeleton: VueConstructor;
export interface KjunMenuButtonProps {
  "formatters"?: Record<string, any>;
  "label"?: string;
  "size"?: "xs" | "sm" | "md" | "lg" | "xl";
  "variant"?: string;
  "compact"?: boolean;
  "disabled"?: boolean;
  "loading"?: boolean;
  "tooltip"?: string;
  "tooltipPlacement"?: "top" | "bottom" | "left" | "right";
  "tooltipDelay"?: number;
  "ariaLabel"?: string;
  "placement"?: string;
}
export const KjunMenuButton: VueConstructor;
export interface KjunModalProps {
  "formatters"?: Record<string, any>;
  "footerSize"?: string;
  "value"?: boolean;
  "title"?: string;
  "ariaLabel"?: string;
  "size"?: "sm" | "md" | "lg" | "xl" | "full";
  "closable"?: boolean;
  "closeOnOverlay"?: boolean;
  "closeOnEsc"?: boolean;
  "showHeader"?: boolean;
  "showFooter"?: boolean;
  "showConfirmButton"?: boolean;
  "showCancelButton"?: boolean;
  "confirmText"?: string;
  "cancelText"?: string;
  "confirmDisabled"?: boolean;
  "loading"?: boolean;
  "noPadding"?: boolean;
  "height"?: string;
  "confirmVariant"?: "primary" | "danger" | "success";
}
export const KjunModal: VueConstructor;
export interface KjunPaginationProps {
  "formatters"?: Record<string, any>;
  "currentPage"?: number | null;
  "page"?: number | null;
  "totalPages": number;
  "totalRows"?: number;
  "pageSize"?: number;
  "pageSizeOptions"?: any[];
  "siblingCount"?: number;
  "showInfo"?: boolean;
  "showSizeSelector"?: boolean;
  "showFirstLast"?: boolean;
}
export const KjunPagination: VueConstructor;
export interface KjunPopoverProps {
  "formatters"?: Record<string, any>;
  "noPadding"?: boolean;
  "value"?: boolean;
  "manualTrigger"?: boolean;
  "matchTriggerWidth"?: boolean;
  "maxHeight"?: string;
  "flip"?: boolean;
  "focusOnOpen"?: boolean;
  "ariaLabel"?: string;
  "placement"?: "top" | "bottom" | "left" | "right";
}
export const KjunPopover: VueConstructor;
export interface KjunPriceCellProps {
  "formatters"?: Record<string, any>;
  "value"?: number | null;
  "formatter"?: ((...args: any[]) => any) | null;
  "stale"?: boolean;
  "showFreshness"?: boolean;
  "source"?: string | null;
  "fetchedAt"?: string | null;
  "flashClass"?: string;
  "fromPrevious"?: boolean;
}
export const KjunPriceCell: VueConstructor;
export interface KjunProgressProps {
  "formatters"?: Record<string, any>;
  "value"?: number;
  "max"?: number;
  "size"?: "sm" | "md" | "lg";
  "variant"?: "primary" | "success" | "warning" | "danger" | "info";
  "showLabel"?: boolean;
  "label"?: string;
}
export const KjunProgress: VueConstructor;
export interface KjunProgressCellProps {
  "formatters"?: Record<string, any>;
  "value"?: number;
  "max"?: number;
  "showLabel"?: boolean;
  "color"?: "auto" | "brand" | "success" | "danger" | "warning" | "custom";
  "customColor"?: string;
  "height"?: number;
}
export const KjunProgressCell: VueConstructor;
export interface KjunProviderProps {
  "icons"?: import('@kjun-ui/icons').KjunIconRegistry | null;
  "formatters"?: Record<string, (...values: any[]) => string>;
  "renderIdentity"?: ((h: CreateElement, props: Record<string, unknown>, slots: Record<string, VNode[] | undefined>) => VNode | null | undefined) | null;
}
export const KjunProvider: VueConstructor;
export interface KjunQuantityStepperProps {
  "error"?: boolean;
  "ariaLabel"?: string;
  "block"?: boolean;
  "value": number;
  "min"?: number;
  "max"?: number;
  "step"?: number;
  "precision"?: number;
  "disabled"?: boolean;
  "size"?: "sm" | "md" | "lg";
  "id"?: string;
}
export const KjunQuantityStepper: VueConstructor;
export interface KjunRadioProps {
  "formatters"?: Record<string, any>;
  "value"?: string | number | boolean | null;
  "val"?: string | number | boolean | null;
  "label"?: string;
  "disabled"?: boolean;
  "name"?: string;
}
export const KjunRadio: VueConstructor;
export interface KjunRadioGroupProps {
  "formatters"?: Record<string, any>;
  "disabled"?: boolean;
  "ariaLabel"?: string;
  "value"?: string | number | boolean | null;
  "options"?: any[];
  "direction"?: "horizontal" | "vertical";
}
export const KjunRadioGroup: VueConstructor;
export interface KjunRangeSliderProps {
  "min"?: number;
  "max"?: number;
  "step"?: number;
  "disabled"?: boolean;
  "label"?: string;
  "ariaLabel"?: string;
  "value": [
    number,
    number
];
  "thumbLabels"?: [
    string,
    string
];
}
export const KjunRangeSlider: VueConstructor;
export interface KjunRefreshButtonProps {
  "formatters"?: Record<string, any>;
  "targetName"?: string;
  "mode"?: "icon" | "text";
  "text"?: string;
  "loading"?: boolean;
  "disabled"?: boolean;
  "block"?: boolean;
  "size"?: "xs" | "sm" | "md" | "lg" | "xl";
  "variant"?: "ghost" | "secondary";
  "spinOnLoading"?: boolean;
  "ariaLabel"?: string;
  "tooltip"?: string | null;
  "tooltipPlacement"?: "top" | "bottom" | "left" | "right";
  "tooltipDelay"?: number;
}
export const KjunRefreshButton: VueConstructor;
export interface KjunScrollFadeProps {
  "formatters"?: Record<string, any>;
}
export const KjunScrollFade: VueConstructor;
export interface KjunSearchInputProps {
  "error"?: boolean;
  "ariaLabel"?: string;
  "formatters"?: Record<string, any>;
  "value"?: string;
  "placeholder"?: string;
  "disabled"?: boolean;
  "clearable"?: boolean;
  "debounce"?: number;
  "size"?: "sm" | "md" | "lg";
  "loadOptions"?: ((query: string, context: {
    signal: AbortSignal;
}) => Promise<Record<string, unknown>[]>) | null;
  "itemKey"?: string;
  "labelField"?: string;
  "minChars"?: number;
  "emptyText"?: string;
  "errorText"?: string;
}
export const KjunSearchInput: VueConstructor;
export interface KjunSelectProps {
  "error"?: boolean;
  "ariaLabel"?: string;
  "formatters"?: Record<string, any>;
  "value"?: string | number | any[] | null;
  "options"?: any[];
  "placeholder"?: string;
  "labelKey"?: string;
  "valueKey"?: string;
  "size"?: "sm" | "md" | "lg";
  "disabled"?: boolean;
  "searchable"?: boolean;
  "open"?: boolean;
  "loading"?: boolean;
  "searchPlaceholder"?: string;
  "optionPageSize"?: number;
  "clearable"?: boolean;
  "multiple"?: boolean;
}
export const KjunSelect: VueConstructor;
export interface KjunSignedValueProps {
  "formatters"?: Record<string, any>;
  "value"?: number | string | null;
  "format"?: "number" | "percent";
  "isRaw"?: boolean;
  "decimals"?: number;
  "prefix"?: string;
  "suffix"?: string;
  "showSign"?: boolean;
  "tone"?: "plain" | "pill";
  "loading"?: boolean;
  "stale"?: boolean;
  "showFreshness"?: boolean;
  "formatter"?: ((...args: any[]) => any) | null;
}
export const KjunSignedValue: VueConstructor;
export interface KjunSkeletonProps {
  "formatters"?: Record<string, any>;
  "type"?: "text" | "avatar" | "card" | "table" | "chart" | "stat" | "block";
  "rows"?: number;
  "columns"?: number;
  "height"?: string | null;
  "width"?: string | null;
  "animated"?: boolean;
  "rounded"?: boolean;
}
export const KjunSkeleton: VueConstructor;
export interface KjunSliderProps {
  "min"?: number;
  "max"?: number;
  "step"?: number;
  "disabled"?: boolean;
  "label"?: string;
  "ariaLabel"?: string;
  "value": number;
}
export const KjunSlider: VueConstructor;
export interface KjunSparklineProps {
  "formatters"?: Record<string, any>;
  "data"?: any[];
  "width"?: number;
  "height"?: number;
  "color"?: string | null;
  "semantic"?: "price" | "status";
  "fill"?: boolean;
  "strokeWidth"?: number;
  "stretch"?: boolean;
}
export const KjunSparkline: VueConstructor;
export interface KjunSpinnerProps {
  "formatters"?: Record<string, any>;
  "size"?: "xs" | "sm" | "md" | "lg" | "xl";
  "text"?: string;
}
export const KjunSpinner: VueConstructor;
export interface KjunSwitchProps {
  "formatters"?: Record<string, any>;
  "value"?: boolean;
  "label"?: string;
  "disabled"?: boolean;
  "size"?: "sm" | "md" | "lg";
  "ariaLabel"?: string | null;
}
export const KjunSwitch: VueConstructor;
export interface KjunTabPaneProps {
  "formatters"?: Record<string, any>;
  "name": string;
  "label": string;
  "icon"?: string | null;
  "badge"?: string | number | null;
  "disabled"?: boolean;
}
export const KjunTabPane: VueConstructor;
export interface KjunTableProps {
  "selectable"?: boolean;
  "selected"?: any[];
  "sort"?: import('@kjun-ui/tokens').TableSort | null;
  "sortMode"?: "client" | "server";
  "queryKey"?: string | number | null;
  "resultKey"?: string | number;
  "loading"?: boolean;
  "error"?: string | null;
  "hasLoadedOnce"?: boolean;
  "formatters"?: Record<string, (value: unknown, row: Record<string, unknown>) => string>;
  "skeletonRows"?: number;
  "columns": any[];
  "data"?: any[];
  "rowKey"?: string;
  "emptyText"?: string;
  "sortable"?: boolean;
  "hoverable"?: boolean;
  "searchable"?: boolean;
  "searchPlaceholder"?: string;
  "stickyHeader"?: boolean;
  "maxHeight"?: number | string | null;
  "pagination"?: Record<string, any> | null;
  "compact"?: boolean;
  "striped"?: boolean;
  "ariaLabel"?: string | null;
  "responsive"?: "card" | "compact" | "none" | null;
  "mobileColumns"?: any[];
  "cardTitle"?: string | null;
  "cardSubtitle"?: string | null;
  "cardSections"?: any[];
  "expandable"?: boolean;
  "expandedRows"?: any[];
  "expandSingle"?: boolean;
  "rowClass"?: ((...args: any[]) => any) | string | null;
}
export const KjunTable: VueConstructor;
export interface KjunTabsProps {
  "formatters"?: Record<string, any>;
  "ariaLabel"?: string;
  "value"?: string;
  "items"?: any[];
  "density"?: "comfortable" | "compact";
  "variant"?: "underline" | "pills";
}
export const KjunTabs: VueConstructor;
export interface KjunTextareaProps {
  "error"?: boolean;
  "ariaLabel"?: string;
  "formatters"?: Record<string, any>;
  "size"?: "sm" | "md" | "lg";
  "value"?: string;
  "placeholder"?: string;
  "rows"?: number | string;
  "disabled"?: boolean;
  "readonly"?: boolean;
  "resize"?: "none" | "vertical" | "horizontal" | "both";
}
export const KjunTextarea: VueConstructor;
export interface KjunTimePickerProps {
  "error"?: boolean;
  "ariaLabel"?: string;
  "value"?: string | null;
  "precision"?: "minute" | "second";
  "min"?: string;
  "max"?: string;
  "minuteStep"?: number;
  "secondStep"?: number;
  "disabled"?: boolean;
  "clearable"?: boolean;
  "size"?: "sm" | "md" | "lg";
}
export const KjunTimePicker: VueConstructor;
export interface KjunTooltipProps {
  "formatters"?: Record<string, any>;
  "content"?: string;
  "placement"?: "top" | "bottom" | "left" | "right";
  "delay"?: number;
}
export const KjunTooltip: VueConstructor;
export interface KjunTopNavigationProps {
  "title": string;
  "description"?: string;
  "safeAreaTop"?: number;
}
export const KjunTopNavigation: VueConstructor;
declare const plugin: { install(Vue: VueConstructor): void };
export default plugin;
