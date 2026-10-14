# @kjun-ui/vue3

Shared KJUN UI geometry, state and interaction contracts for Vue 3. Your app supplies colors and fonts.

Import `@kjun-ui/vue3/styles.css` and your project color mapping stylesheet. Define the 27 `coreColorRoles` as `--kjun-*` variables and `--kjun-font` from existing app tokens at `:root` or on `<KjunProvider>`. The Provider supplies a `.kjun-scope` styling boundary; it has no `theme` prop or palette.

Import only the components you use, for example `import { KjunProvider, KjunButton } from '@kjun-ui/vue3'`, or register all of them with `import Kjun from '@kjun-ui/vue3/plugin'; app.use(Kjun)`. If the app already registered a component under a `Kjun*` name (or its kebab-case form), KJUN warns before replacing it; `app.use(Kjun, { skipExisting: true })` keeps the app's component.

Components follow the React package's API in Vue form: values use `v-model`, open state uses `v-model:open`, callbacks are events and render props are slots.

Install: `npm install @kjun-ui/vue3 @kjun-ui/tokens @kjun-ui/icons`
