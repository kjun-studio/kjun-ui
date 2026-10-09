# @kjun-ui/native

Shared KJUN UI geometry, state and interaction contracts. Your app supplies colors and fonts.

Wrap the app in `<KjunProvider colors={appColors} fontFamily={appFont}>`. `colors` must supply the 27 core roles in `KjunColors<ColorValue>`; Component roles are optional and fall back to app-supplied roles. The app maps its existing tokens and owns mode changes. Missing Provider/colors produce an error. `useKjunStyles()` reads the nearest values. Nested Providers inherit the parent font unless overridden; the root uses the system font when omitted. Load custom fonts in the app.

No CSS import is needed. Native Web is a preview; iOS/Android device verification has not been performed.

Browser bundlers use the `browser` export and require React DOM matching React. This preview keeps Modal·Drawer content mounted during interrupted exits while their browser windows are reordered. The device entry has no React DOM dependency and retains the platform Modal host; browser results do not certify device window behavior.

Project color and font setup: https://ui.kjun.dev/styling.

Install: `npm install @kjun-ui/native @kjun-ui/tokens @kjun-ui/icons`

## Card composition

Card uses `surface` for its background/foreground roles, `padding` for section insets, `bodyPadding` for an independent body inset, and `radius` for none/sm/md/lg corners. `border`, `elevation` and `dividers` are independent. Use `bodyPadding="none"` to embed a table while retaining header/footer insets. `headerActions` works without a title and alongside a custom `header`. The `media` area clips only its own top corners. Native uses the supplied glass background; Web also applies backdrop blur.

## Tab panel state

`DsTabPane` children mount with their parent tabs and stay mounted when another tab is selected. Hidden panels are excluded from layout, keyboard navigation and accessibility navigation. Removing a pane or unmounting the tabs disposes its children. Effects and timers continue while a pane is hidden; use the controlled tab value to manage active requests or subscriptions. This contract is shared across React, Vue 2 and Native. Native browser tests do not certify device behavior.

Disabled tabs block selection and auxiliary menu callbacks. Disabling or removing a tab during a press cancels its pending auxiliary action.

## Icons

Install the local `@kjun-ui/icons` tarball together with this package and `@kjun-ui/tokens`.
Tabler 3.48.0 includes 5,166 outline and 1,054 filled icons. The existing 153 outline
names and heart/star filled shapes remain available by default. Additional icons
require an explicit import and Provider registration; `DsIcon`, `prefixIcon` and
`suffixIcon` use the same registry.

```tsx
import rocket from '@kjun-ui/icons/icons/rocket';
const projectIcons = { rocket };
<KjunProvider colors={appColors} icons={projectIcons}>
  <DsIcon name="rocket" />
  <DsButton prefixIcon="rocket">시작</DsButton>
</KjunProvider>
```

Registries merge by name and shape: defaults, parent Provider, then current Provider.
Prop changes update descendants, including layers, without global registration.
A missing filled shape uses the registered outline; unknown names use `help-circle`.
Import `@kjun-ui/icons/all` only when intentionally registering the complete set.
