// KJUN-owned utility vocabulary. Historical snapshots are never a build input.
// Semantic utilities also cover nested variants, e.g. px-badge-padding-xs-x.
function geometryUtilities(tokens) {
  const spacing = {}, borderRadius = {};
  const kebab = value => value.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
  function visit(value, path) {
    if (typeof value === 'number') {
      const name = path.map(kebab).join('-');
      if (path.some(key => /radius|radii/i.test(key))) borderRadius[name] = value + 'px';
      else if (!path.some(key => /typography|font|lineHeight|weight/i.test(key))) spacing[name] = value + 'px';
    } else if (value && typeof value === 'object' && !Array.isArray(value))
      for (const [key, child] of Object.entries(value)) visit(child, [...path, key]);
  }
  for (const [key, value] of Object.entries(tokens.extensions)) visit(value, [key]);
  visit(tokens.card, ['card']); visit(tokens.modal, ['modal']); visit(tokens.table, ['table']);
  visit(tokens.button.heights, ['button', 'heights']);
  return { spacing, borderRadius };
}
export function createVueStyleTheme(tokens, utilities) {
  const geometry = geometryUtilities(tokens);
  const colors = { ...utilities.colors, white: "var(--text-inverse)", transparent: "transparent", current: "currentColor" };
  return {
    screens: { pagination: tokens.responsive.pagination + 'px', 'pagination-wide': tokens.responsive.paginationWide + 'px' },
    boxShadow: { none: "none", focus: "0 0 0 var(--_kjun-state-focus-ring-width) var(--focus-ring)", ...Object.fromEntries(Object.keys(tokens.elevation).map(key => ["elevation-" + key, `var(--_kjun-elevation-${key})`])) },
    colors,
    fontWeight: { normal: "var(--_kjun-type-body-weight)", medium: "var(--_kjun-type-label-weight)", semibold: "var(--_kjun-type-control-weight)", bold: "var(--_kjun-type-number-lg-weight)" },
    extend: {
      ...utilities,
      colors,
      opacity: { disabled: 'var(--_kjun-state-opacity-disabled)', 'disabled-strong': 'var(--_kjun-state-opacity-disabled-strong)', pending: 'var(--_kjun-state-opacity-pending)' },
      ringWidth: { 2: 'var(--_kjun-state-focus-width)' },
      ringOffsetWidth: { 2: 'var(--_kjun-state-focus-offset)', 3: 'var(--_kjun-state-focus-choice-offset)' },
      borderWidth: { DEFAULT: 'var(--_kjun-border-default-width)', 2: 'var(--_kjun-border-control-width)' },
      fontFamily: { sans: ["var(--kjun-font)"], mono: ["var(--font-numeric)"] },
      spacing: { ...Object.fromEntries(Object.entries(tokens.dimension).map(([name, value]) => [String(Number(name.slice(5)) / 4), value + "px"])), ...geometry.spacing },
      borderRadius: {
        ...geometry.borderRadius,
        ...Object.fromEntries(Object.entries({ none: 'radius0', sm: 'radius4', DEFAULT: 'radius6', md: 'radius6', lg: 'radius8', xl: 'radius12', '2xl': 'radius16', '3xl': 'radius20', badge: 'radius6', full: 'radius9999' }).map(([key, role]) => [key, tokens.radius[role] + 'px'])),
        badge: tokens.extensions.badge.radius + 'px',
        card: tokens.card.radii.md + 'px', 'card-lg': tokens.card.radii.lg + 'px',
        button: tokens.button.radius + 'px', input: tokens.input.md.radius + 'px',
      },
      fontSize: Object.fromEntries(Object.entries({ xs: 'caption', sm: 'body', base: 'input', lg: 'numberLg', xl: 'numberLg', '2xl': 'displaySm', '3xl': 'displayMd', '4xl': 'displayLg' }).map(([key,role]) => [key, [tokens.typography[role].fontSizePx / 16 + 'rem', { lineHeight: tokens.typography[role].lineHeightPx / 16 + 'rem', letterSpacing: tokens.typography[role].letterSpacingEm + 'em' }]])),
      zIndex: Object.fromEntries(Object.entries(tokens.layers.page).map(([key, value]) => [key.replace(/[A-Z]/g, c => "-" + c.toLowerCase()), String(value)])),
      // Utility transitions (transition-colors etc.) default to the semantic control role.
      transitionDuration: { DEFAULT: "var(--motion-control)" },
      transitionTimingFunction: { DEFAULT: "var(--ease-out)" },
    },
  };
}
