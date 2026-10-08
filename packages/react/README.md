# @kjun/react

Shared KJUN UI geometry, state and interaction contracts. Your app supplies colors and fonts.

Import `@kjun/react/styles.css` and your project color mapping stylesheet. Define the 21 `coreColorRoles` as `--kjun-*` variables and `--kjun-font` from existing app tokens at `:root` or on `<KjunProvider>`. Optional roles listed in `colorRoleFallbacks` fall back to app-supplied roles. The Provider supplies a `.kjun-scope` styling boundary; it has no `theme` prop or palette.

Missing core colors or `--kjun-font` fail at mount/update. Components using financial colors also check all 13 domain roles in their rendered scope. Font loading and color contrast remain the app's responsibility. Numeric displays, including Deviation badges, consume `--kjun-font-numeric` (falling back to the scope font); KpiRow text values consume the body font.

Nested Providers share window ordering and Escape handling. Their overlays render outside ancestor windows while retaining the nearest Provider's color roles, fonts and live project styling changes. Place the outermost Provider outside ancestors that transform/filter or clip fixed overlays. Without a Provider, modals portal to the body and inherit document-level variables.

Project color and font setup: http://127.0.0.1:4173/styling.

Pre-release local packages; not published to a registry.

## Card composition

Card uses `surface` for its background/foreground roles, `padding` for section insets, `bodyPadding` for an independent body inset, and `radius` for none/sm/md/lg corners. `border`, `elevation` and `dividers` are independent. Use `bodyPadding="none"` to embed a table while retaining header/footer insets. `headerActions` works without a title and alongside a custom `header`. The `media` area clips only its own top corners. Native uses the supplied glass background; Web also applies backdrop blur.

## Tab panel state

`DsTabPane` children mount with their parent tabs and stay mounted when another tab is selected. Hidden panels are excluded from layout, keyboard navigation and accessibility navigation. Removing a pane or unmounting the tabs disposes its children. Effects and timers continue while a pane is hidden; use the controlled tab value to manage active requests or subscriptions. This contract is shared across React, Vue 2 and Native. Native browser tests do not certify device behavior.

Disabled tabs block selection and auxiliary menu callbacks. Disabling or removing a tab during a press cancels its pending auxiliary action.

## Icons

Install the local `@kjun/icons` tarball together with this package and `@kjun/tokens`.
Tabler 3.48.0 includes 5,166 outline and 1,054 filled icons. The existing 153 outline
names and heart/star filled shapes remain available by default. Additional icons
require an explicit import and Provider registration; `DsIcon`, `prefixIcon` and
`suffixIcon` use the same registry.

```tsx
import rocket from '@kjun/icons/icons/rocket';
const projectIcons = { rocket };
<KjunProvider icons={projectIcons}>
  <DsIcon name="rocket" />
  <DsButton prefixIcon="rocket">시작</DsButton>
</KjunProvider>
```

Registries merge by name and shape: defaults, parent Provider, then current Provider.
Prop changes update descendants, including layers, without global registration.
A missing filled shape uses the registered outline; unknown names use `help-circle`.
Import `@kjun/icons/all` only when intentionally registering the complete set.
