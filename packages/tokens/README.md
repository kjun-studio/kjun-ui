# @kjun/tokens

Shared KJUN UI geometry, state and interaction contracts. Your app supplies colors and fonts.

Button corner radii for xs/sm/md/lg/xl are 8/10/12/14/16px (`button.radii`); `button.radius` aliases the md radius. Button Group keeps its separate 6/8/10/12/14px track radii, and Filter Group keeps 12px corners.

Exports `tokens`, `colorRoles`, `coreColorRoles`, `colorRoleFallbacks`, `ColorRole`, `KjunCoreColors`, `KjunColors<Color = string>`, `ResolvedKjunColors` and size/variant types. `KjunColors` requires 21 core roles and accepts optional component roles. `resolveKjunColors` resolves omitted roles using only app-supplied values, preserving native color objects. No product names, palettes, or font defaults are shipped. CSS uses `--kjun-*`; `styles.css` contains component styles and scoped aliases only.

`tokens.typography[role]` provides `fontSizePx`, `lineHeightPx`, `fontWeight`, and `letterSpacingEm`. Web apps can apply role classes such as `kjun-type-body` within `KjunProvider`.

Project color and font setup: http://127.0.0.1:4173/styling.

Pre-release local packages; not published to a registry.

Input fields use sm/md/lg heights of 32/40/48px and Button radii of 10/12/14px. Input text is 16px with a 24px line height. The default size is `md` (40px); use `lg` for a 48px form. Filled surfaces stay filled on focus and error. `input[size].clearSize`, `textareaPaddingY`, and `affixGap` are per-size geometry roles.

## Card composition

Card uses `surface` for its background/foreground roles, `padding` for section insets, `bodyPadding` for an independent body inset, and `radius` for none/sm/md/lg corners. `border`, `elevation` and `dividers` are independent. Use `bodyPadding="none"` to embed a table while retaining header/footer insets. `headerActions` works without a title and alongside a custom `header`. The `media` area clips only its own top corners. Native uses the supplied glass background; Web also applies backdrop blur.

## Dimension scale

`tokens.dimension.value2` … `value80` is the shared length scale for gaps, padding, widths and heights. Web uses CSS px; Native uses the same numbers in logical units. Numeric names are fixed: `value48` always means 48. Select another dimension from a component role when its geometry changes, e.g. `extensions.accordion.minimumHeight` references `dimension.value48`.

`tokens.spacing.space*` and its CSS bindings have been removed before the first release; no compatibility aliases are provided. Definitions and consumers use `dimension`. Vue numeric utility names retain their values. Radius remains a separate scale.

## Geometry and state roles

`extensions.form.itemGap` is 20px for normal form flow; Web flex/grid parents own their gap. Checkbox radii remain 5/6/7px and Switch inset remains 3px. `dimension.value80` serves large state messages. These are shared KJUN rules, not per-project overrides.

`states.opacity` defines disabled (0.5), disabledStrong (0.4 for filters and unavailable dates), pressed (0.8), and pending (0.55 for retained content during refresh). `states.focus` defines the 2px outline, 2px outer offset, 3px choice-control offset, -2px inset offset, and 3px shadow ring. `border.defaultWidth/controlWidth` define 1/2px strokes. Colors remain app-owned. `effects.glassBlur` is independent of spacing.

Author definitions live under `src/definitions`. References preserve length, duration, weight, opacity and layer kinds; all resolved shadow layers are validated. Generated files are not editing inputs.

Checkbox `sizes` / `iconSizes` and Switch `widths` / `heights` live under their `extensions` roles. Switch thumb size and travel derive from its track and padding. `native.minimumTouchTarget` also supplies existing Web touch-mode minimum targets; `extensions.choice.minimumHeight` preserves the desktop choice row height.

Selection labels use the size-specific Button typography, with `typography.label.fontWeight` for the unselected state. Selected labels and hidden width-measurement text share the same weight and tracking. Vue font-weight utilities resolve through typography roles. Empty title and description use Card title and caption typography, including weight and tracking.

MarketTable identity text uses `body` and `caption` on every platform. Its skeleton rows use the same line heights. Web typography keeps rem units through indirect and composite references, so root font changes scale both text and line height.

`responsive` contains component query thresholds backed by `breakpoints`. Modal, Drawer, Toast, pagination and KPI Hero default to 640px; KPI Row, Market, selection, two-column form skeletons and Table use 768px. BottomActionBar measures 448px of content width, excluding its insets. Vue Toast now shares the 640px threshold; Native form skeletons use one column below their threshold. Query operators preserve each component's boundary contract (`<` versus `<=`). Web source uses `token(responsive.role)` in queries; package builds replace it with plain CSS lengths. These are KJUN author contracts, not project theme overrides.

`motionDistance` defines positive displacement magnitudes: modalEnter=16, modalExit=8, popup=4 and toast=8. Direction is applied by the component. These lengths are independent of `motion` durations and spacing; reduced motion still suppresses interpolation.

Chip typography is defined by `extensions.chip.typography.sm/md/lg`, referencing caption/body/input on every platform. `removeSize` controls the Web removal button; `nativeRemoveSize` includes the Native minimum touch target. Toast defines `minWidth` (Web desktop), `maxWidth`, `closeSize` and `progressHeight`. Native and narrow Web Toast close controls retain their minimum touch targets.

Generation rejects empty control dimensions, button/input content that cannot fit, checkbox/radio icons larger than their inner boxes, undersized Native Chip removal targets and reversed Toast width limits. Page layers must satisfy content < sticky < navigation, and base breakpoints compact < medium < wide. Component thresholds remain independent. Zero padding/radius resets and zero motion durations remain valid.

`definitions/sizing.json` owns Spinner/Progress scales, component icon sizes, skeleton footprints, financial placeholders, menu/tooltip limits, Drawer width and close controls. Vue dimension utilities follow these roles, including Button heights; changing a spacing token no longer resizes Spinner or Progress. Native retains minimum touch targets. Web text-relative placeholders and Native logical-unit placeholders keep explicit platform contracts. SVG viewBox artwork, relative layout and measured values are not physical size tokens.

`scripts/size-token-audit.mjs` scans all authored package/runtime files for absolute dimensions in styles, JSX/Vue props, defaults, aliases, skeleton helpers and Vue utilities. Size roles must be positive; ButtonGroup content must fit inside its insets. Packed size tests and the token mutation experiment verify generated CSS utilities and rendered values.

`@kjun/tokens/icons` is a compatibility re-export of `icons` and `filledIcons` from
`@kjun/icons/defaults`, plus the shared `IconNode` type. Icon data is maintained in
`@kjun/icons`, pinned to Tabler 3.48.0. Install its local tarball alongside tokens.
