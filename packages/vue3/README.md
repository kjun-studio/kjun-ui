# @kjun-ui/vue3

Shared KJUN UI geometry, state and interaction contracts for Vue 3. Your app supplies colors and fonts.

Import `@kjun-ui/vue3/styles.css` and your project color mapping stylesheet. Define the 27 `coreColorRoles` as `--kjun-*` variables and `--kjun-font` from existing app tokens at `:root` or on `<KjunProvider>`. The Provider supplies a `.kjun-scope` styling boundary; it has no `theme` prop or palette.

Import only the components you use, for example `import { KjunProvider, KjunButton } from '@kjun-ui/vue3'`, or register all of them with `import Kjun from '@kjun-ui/vue3/plugin'; app.use(Kjun)`. If the app already registered a component under a `Kjun*` name (or its kebab-case form), KJUN warns before replacing it; `app.use(Kjun, { skipExisting: true })` keeps the app's component.

Components follow the React package's API in Vue form: values use `v-model`, open state uses `v-model:open`, callbacks are events and render props are slots.

`KjunIconToggle` accepts `aria-label`, `aria-labelledby` or the existing `ariaLabel` prop. Always provide an accessible name. Its default tooltip uses the label text; `tooltip=""` disables it, and an explicit `tooltip` supplies different help text. For `aria-labelledby`, the default hint reads the referenced elements' text; supply `tooltip` for labels composed of non-text content.

`KjunInput` accepts `string | number | null`; `KjunTextarea` and `KjunDatePicker` accept `string | null`. A parent `null` displays empty without emitting an update. Input's numeric `0` remains visible. Editing, date selection and clearing still emit strings (clearing emits `''`).

Use `kjunPropValues` for tooling that checks finite prop choices:

```ts
import { kjunPropValues } from '@kjun-ui/vue3';
kjunPropValues.KjunButton.size; // readonly ['xs', 'sm', 'md', 'lg', 'xl']
kjunPropValues.KjunInput.size;  // readonly ['sm', 'md', 'lg']
type ButtonSize = typeof kjunPropValues.KjunButton.size[number];
```

The frozen lists are generated from the Vue public prop types and also drive Vue's development prop validators. They cover finite string/number choices, including Boolean alternatives in mixed unions. Open-ended strings/numbers, Boolean-only props, nested object fields, functions and inherited HTML attributes are not enumerated. Omission and nullability follow each prop's type. Invalid choices warn in development; they are not coerced. Production builds do not run these validators. Bundlers should replace `process.env.NODE_ENV` as they do for Vue itself.

Install: `npm install @kjun-ui/vue3 @kjun-ui/tokens @kjun-ui/icons`
