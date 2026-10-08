// Generated from the compiled Vue component contracts by scripts/api.mjs.
export type { KjunIconDefinition, KjunIconRegistry } from "@kjun-ui/icons";
import type { VueConstructor, CreateElement, VNode } from "vue";
export type { ShadowLayer, ElevationRole, CardElevation, TableSort, KjunColors, KjunDomainColors, ColorRole, DomainColorRole, ButtonSize, InputSize, ButtonVariant, KjunFeedback, ConfirmOptions, PromptOptions, ToastOptions } from "@kjun-ui/tokens";
export interface DsAccordionProps {
  "formatters"?: Record<string, any>;
  "multiple"?: boolean;
  "tone"?: "card" | "muted";
}
export const DsAccordion: VueConstructor;
export interface DsAccordionItemProps {
  "formatters"?: Record<string, any>;
  "title"?: string;
  "defaultOpen"?: boolean;
  "disabled"?: boolean;
}
export const DsAccordionItem: VueConstructor;
export interface DsAlertProps {
  "formatters"?: Record<string, any>;
  "type"?: "success" | "warning" | "danger" | "info" | "error";
  "variant"?: string | null;
  "size"?: "sm" | "md" | "lg";
  "title"?: string;
  "closable"?: boolean;
}
export const DsAlert: VueConstructor;
export interface DsAnimatedNumberProps {
  "formatters"?: Record<string, any>;
  "value": number | string;
  "decimals"?: number;
  "prefix"?: string;
  "suffix"?: string;
  "animated"?: boolean;
  "fromPrevious"?: boolean;
  "formatter"?: ((...args: any[]) => any) | null;
}
export const DsAnimatedNumber: VueConstructor;
export interface DsAvatarProps {
  "src"?: string;
  "name"?: string;
  "alt"?: string;
  "decorative"?: boolean;
  "size"?: "sm" | "md" | "lg";
  "shape"?: "circle" | "square";
}
export const DsAvatar: VueConstructor;
export interface DsBadgeProps {
  "formatters"?: Record<string, any>;
  "variant"?: "default" | "secondary" | "primary" | "success" | "warning" | "danger" | "info" | "price-up" | "price-down";
  "size"?: "xs" | "sm" | "md" | "lg" | "xl";
  "dot"?: boolean;
}
export const DsBadge: VueConstructor;
export interface DsBottomActionBarProps {
  "description"?: string;
  "safeAreaBottom"?: number;
  "keyboardVisible"?: boolean;
  "hideOnKeyboard"?: boolean;
}
export const DsBottomActionBar: VueConstructor;
export interface DsBottomNavigationProps {
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
export const DsBottomNavigation: VueConstructor;
export interface DsBreadcrumbProps {
  "formatters"?: Record<string, any>;
  "items": any[];
}
export const DsBreadcrumb: VueConstructor;
export interface DsButtonProps {
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
export const DsButton: VueConstructor;
export interface DsButtonGroupProps {
  "formatters"?: Record<string, any>;
  "value"?: string | number | null;
  "options": any[];
  "size"?: "xs" | "sm" | "md" | "lg" | "xl";
  "variant"?: "primary" | "secondary" | "ghost";
  "disabled"?: boolean;
  "fullWidth"?: boolean;
  "ariaLabel"?: string | null;
}
export const DsButtonGroup: VueConstructor;
export interface DsCardProps {
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
export const DsCard: VueConstructor;
export interface DsChartSkeletonProps {
  "formatters"?: Record<string, any>;
  "loadingText"?: string;
  "kind"?: "grid" | "line" | "bar" | "donut" | "candle" | "matrix";
  "height"?: string | number;
}
export const DsChartSkeleton: VueConstructor;
export interface DsCheckboxProps {
  "formatters"?: Record<string, any>;
  "value"?: boolean | any[];
  "val"?: string | number | boolean | Record<string, any> | null;
  "label"?: string;
  "disabled"?: boolean;
  "size"?: "sm" | "md" | "lg";
}
export const DsCheckbox: VueConstructor;
export interface DsChipProps {
  "label": string;
  "icon"?: string;
  "removable"?: boolean;
  "disabled"?: boolean;
  "size"?: "sm" | "md" | "lg";
  "removeLabel"?: string;
}
export const DsChip: VueConstructor;
export interface DsCollectionMarkProps {
  "formatters"?: Record<string, any>;
  "kind": "favorite" | "interest";
  "active"?: boolean;
  "size"?: "sm" | "md" | "lg";
}
export const DsCollectionMark: VueConstructor;
export interface DsComboboxProps {
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
export const DsCombobox: VueConstructor;
export interface DsCopyButtonProps {
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
export const DsCopyButton: VueConstructor;
export interface DsDataStateProps {
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
export const DsDataState: VueConstructor;
export interface DsDatePickerProps {
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
export const DsDatePicker: VueConstructor;
export interface DsDeviationProps {
  "formatters"?: Record<string, any>;
  "value"?: number | null;
  "variant"?: "pill" | "badge" | "text";
  "signalThreshold"?: number;
  "decimals"?: number;
}
export const DsDeviation: VueConstructor;
export interface DsDrawerProps {
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
export const DsDrawer: VueConstructor;
export interface DsDropdownProps {
  "formatters"?: Record<string, any>;
  "disabled"?: boolean;
  "menuId"?: string;
  "triggerId"?: string;
  "menuClass"?: string | any[] | Record<string, any>;
  "placement"?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
}
export const DsDropdown: VueConstructor;
export interface DsDropdownDividerProps {
  "formatters"?: Record<string, any>;
}
export const DsDropdownDivider: VueConstructor;
export interface DsDropdownItemProps {
  "formatters"?: Record<string, any>;
  "variant"?: "default" | "danger";
  "icon"?: string | null;
  "disabled"?: boolean;
  "selected"?: boolean | null;
}
export const DsDropdownItem: VueConstructor;
export interface DsEmptyProps {
  "formatters"?: Record<string, any>;
  "text"?: string;
  "description"?: string;
  "icon"?: string;
}
export const DsEmpty: VueConstructor;
export interface DsErrorBoundaryProps {
  "formatters"?: Record<string, any>;
  "fallbackMessage"?: string;
}
export const DsErrorBoundary: VueConstructor;
export interface DsExecutionStatusBadgeProps {
  "formatters"?: Record<string, any>;
  "status"?: string | null;
  "label"?: string;
  "size"?: "xs" | "sm" | "md" | "lg" | "xl";
}
export const DsExecutionStatusBadge: VueConstructor;
export interface DsExternalLinkProps {
  "formatters"?: Record<string, any>;
  "href"?: string;
  "mode"?: "icon" | "text";
  "label"?: string;
}
export const DsExternalLink: VueConstructor;
export interface DsFilterGroupProps {
  "formatters"?: Record<string, any>;
  "value"?: string | number | any[] | null;
  "options": any[];
  "multiple"?: boolean;
  "size"?: "xs" | "sm" | "md" | "lg" | "xl";
  "disabled"?: boolean;
  "scroll"?: boolean;
  "ariaLabel"?: string | null;
}
export const DsFilterGroup: VueConstructor;
export interface DsFormActionsProps {
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
export const DsFormActions: VueConstructor;
export interface DsFormGroupProps {
  "formatters"?: Record<string, any>;
  "label"?: string;
  "id"?: string | null;
  "required"?: boolean;
  "error"?: string;
  "hint"?: string;
}
export const DsFormGroup: VueConstructor;
export interface DsFormSkeletonProps {
  "formatters"?: Record<string, any>;
  "fields"?: any[];
  "columns"?: number;
  "multiline"?: boolean;
  "size"?: "sm" | "md" | "lg";
}
export const DsFormSkeleton: VueConstructor;
export interface DsFreshnessProps {
  "formatters"?: Record<string, any>;
  "stale"?: boolean;
  "source"?: string | null;
  "fetchedAt"?: string | null;
}
export const DsFreshness: VueConstructor;
export interface DsHeatmapCellProps {
  "formatters"?: Record<string, any>;
  "value"?: number;
  "min"?: number;
  "max"?: number;
  "mode"?: string;
  "color"?: string;
}
export const DsHeatmapCell: VueConstructor;
export interface DsIconProps {
  "formatters"?: Record<string, any>;
  "name": string;
  "size"?: string | number | null;
  "spin"?: boolean;
  "filled"?: boolean;
}
export const DsIcon: VueConstructor;
export interface DsIconToggleProps {
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
export const DsIconToggle: VueConstructor;
export interface DsImageProps {
  "src"?: string;
  "alt": string;
  "decorative"?: boolean;
  "aspectRatio"?: number;
  "fit"?: "cover" | "contain";
  "lazy"?: boolean;
}
export const DsImage: VueConstructor;
export interface DsInputProps {
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
export const DsInput: VueConstructor;
export interface DsKpiHeroProps {
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
export const DsKpiHero: VueConstructor;
export interface DsKpiRowProps {
  "formatters"?: Record<string, any>;
  "loading"?: boolean;
  "items": any[];
  "size"?: "md" | "sm";
  "mobileSummary"?: boolean;
}
export const DsKpiRow: VueConstructor;
export interface DsListRowProps {
  "title": string;
  "description"?: string;
  "href"?: string;
  "disabled"?: boolean;
}
export const DsListRow: VueConstructor;
export interface DsListSectionProps {
  "title"?: string;
  "description"?: string;
  "ariaLabel"?: string;
}
export const DsListSection: VueConstructor;
export interface DsListSkeletonProps {
  "formatters"?: Record<string, any>;
  "rows"?: number;
  "variant"?: "market" | "compact" | "notification";
  "avatar"?: boolean;
  "avatarSize"?: string;
  "quote"?: boolean;
}
export const DsListSkeleton: VueConstructor;
export interface DsMarketCardsProps {
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
export const DsMarketCards: VueConstructor;
export interface DsMarketListPanelProps {
  "formatters"?: Record<string, any>;
}
export const DsMarketListPanel: VueConstructor;
export interface DsMarketSimpleListProps {
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
export const DsMarketSimpleList: VueConstructor;
export interface DsMarketTableProps {
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
export const DsMarketTable: VueConstructor;
export interface DsMarketTableSkeletonProps {
  "formatters"?: Record<string, any>;
  "columns"?: any[];
  "rows"?: number;
  "showActions"?: boolean;
  "alignClass"?: ((...args: any[]) => any) | null;
  "widthClass"?: ((...args: any[]) => any) | null;
}
export const DsMarketTableSkeleton: VueConstructor;
export interface DsMenuButtonProps {
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
export const DsMenuButton: VueConstructor;
export interface DsModalProps {
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
export const DsModal: VueConstructor;
export interface DsPaginationProps {
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
export const DsPagination: VueConstructor;
export interface DsPopoverProps {
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
export const DsPopover: VueConstructor;
export interface DsPriceCellProps {
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
export const DsPriceCell: VueConstructor;
export interface DsProgressProps {
  "formatters"?: Record<string, any>;
  "value"?: number;
  "max"?: number;
  "size"?: "sm" | "md" | "lg";
  "variant"?: "primary" | "success" | "warning" | "danger" | "info";
  "showLabel"?: boolean;
  "label"?: string;
}
export const DsProgress: VueConstructor;
export interface DsProgressCellProps {
  "formatters"?: Record<string, any>;
  "value"?: number;
  "max"?: number;
  "showLabel"?: boolean;
  "color"?: "auto" | "brand" | "success" | "danger" | "warning" | "custom";
  "customColor"?: string;
  "height"?: number;
}
export const DsProgressCell: VueConstructor;
export interface DsQuantityStepperProps {
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
export const DsQuantityStepper: VueConstructor;
export interface DsRadioProps {
  "formatters"?: Record<string, any>;
  "value"?: string | number | boolean | null;
  "val"?: string | number | boolean | null;
  "label"?: string;
  "disabled"?: boolean;
  "name"?: string;
}
export const DsRadio: VueConstructor;
export interface DsRadioGroupProps {
  "formatters"?: Record<string, any>;
  "disabled"?: boolean;
  "ariaLabel"?: string;
  "value"?: string | number | boolean | null;
  "options"?: any[];
  "direction"?: "horizontal" | "vertical";
}
export const DsRadioGroup: VueConstructor;
export interface DsRangeSliderProps {
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
export const DsRangeSlider: VueConstructor;
export interface DsRefreshButtonProps {
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
export const DsRefreshButton: VueConstructor;
export interface DsScrollFadeProps {
  "formatters"?: Record<string, any>;
}
export const DsScrollFade: VueConstructor;
export interface DsSearchInputProps {
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
export const DsSearchInput: VueConstructor;
export interface DsSelectProps {
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
export const DsSelect: VueConstructor;
export interface DsSignedValueProps {
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
export const DsSignedValue: VueConstructor;
export interface DsSkeletonProps {
  "formatters"?: Record<string, any>;
  "type"?: "text" | "avatar" | "card" | "table" | "chart" | "stat" | "block";
  "rows"?: number;
  "columns"?: number;
  "height"?: string | null;
  "width"?: string | null;
  "animated"?: boolean;
  "rounded"?: boolean;
}
export const DsSkeleton: VueConstructor;
export interface DsSliderProps {
  "min"?: number;
  "max"?: number;
  "step"?: number;
  "disabled"?: boolean;
  "label"?: string;
  "ariaLabel"?: string;
  "value": number;
}
export const DsSlider: VueConstructor;
export interface DsSparklineProps {
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
export const DsSparkline: VueConstructor;
export interface DsSpinnerProps {
  "formatters"?: Record<string, any>;
  "size"?: "xs" | "sm" | "md" | "lg" | "xl";
  "text"?: string;
}
export const DsSpinner: VueConstructor;
export interface DsSwitchProps {
  "formatters"?: Record<string, any>;
  "value"?: boolean;
  "label"?: string;
  "disabled"?: boolean;
  "size"?: "sm" | "md" | "lg";
  "ariaLabel"?: string | null;
}
export const DsSwitch: VueConstructor;
export interface DsTabPaneProps {
  "formatters"?: Record<string, any>;
  "name": string;
  "label": string;
  "icon"?: string | null;
  "badge"?: string | number | null;
  "disabled"?: boolean;
}
export const DsTabPane: VueConstructor;
export interface DsTableProps {
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
export const DsTable: VueConstructor;
export interface DsTabsProps {
  "formatters"?: Record<string, any>;
  "ariaLabel"?: string;
  "value"?: string;
  "items"?: any[];
  "density"?: "comfortable" | "compact";
  "variant"?: "underline" | "pills";
}
export const DsTabs: VueConstructor;
export interface DsTextareaProps {
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
export const DsTextarea: VueConstructor;
export interface DsTimePickerProps {
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
export const DsTimePicker: VueConstructor;
export interface DsTooltipProps {
  "formatters"?: Record<string, any>;
  "content"?: string;
  "placement"?: "top" | "bottom" | "left" | "right";
  "delay"?: number;
}
export const DsTooltip: VueConstructor;
export interface DsTopNavigationProps {
  "title": string;
  "description"?: string;
  "safeAreaTop"?: number;
}
export const DsTopNavigation: VueConstructor;
export interface KjunFeedbackProviderProps {

}
export const KjunFeedbackProvider: VueConstructor;
export interface KjunProviderProps {
  "icons"?: import('@kjun-ui/icons').KjunIconRegistry | null;
  "formatters"?: Record<string, (...values: any[]) => string>;
  "renderIdentity"?: ((h: CreateElement, props: Record<string, unknown>, slots: Record<string, VNode[] | undefined>) => VNode | null | undefined) | null;
}
export const KjunProvider: VueConstructor;
declare const plugin: { install(Vue: VueConstructor): void };
export default plugin;
