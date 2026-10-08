# @kjun-ui/icons

Tabler 3.48.0 icon data for KJUN React, Vue 2 and React Native. MIT licensed.
Includes 5,166 outline icons and 1,054 filled variants. No framework dependency,
network request or automatic global registration.

```tsx
import rocket from '@kjun-ui/icons/icons/rocket';
import { KjunProvider, DsIcon, DsButton } from '@kjun-ui/react';

const icons = { rocket };
<KjunProvider icons={icons}>
  <DsIcon name="rocket" />
  <DsButton prefixIcon="rocket">시작</DsButton>
</KjunProvider>;
```

Use the same `icons` prop on Native's `KjunProvider` (alongside project colors),
or `:icons="icons"` in Vue 2. Each definition has `outline` and optional `filled`
nodes. Child providers inherit parent registrations and override each variant.
Registrations are scoped to the provider and update when its prop changes.

- `@kjun-ui/icons`: types and `tablerVersion`, without icon data.
- `@kjun-ui/icons/icons/<official-name>`: default export for one icon family.
- `@kjun-ui/icons/defaults`: `defaultIcons`, and compatible `icons` / `filledIcons`
  maps for the existing 153 outline names and heart/star filled variants.
- `@kjun-ui/icons/metadata`: `iconMetadata` without SVG data.
- `@kjun-ui/icons/all`: `allIcons` for explicitly registering the entire library.

Only import `/all` when its bundle size is acceptable. Ordinary components use
the defaults plus registered icons. A missing filled variant falls back to its
outline; an unregistered name falls back to `help-circle`.

All paths ship ESM, CJS and type declarations. Sources are generated from the
pinned official `@tabler/icons` package; build verifies its source hashes and
the npm lock integrity. `dist/Tabler-LICENSE` retains the upstream MIT license.
