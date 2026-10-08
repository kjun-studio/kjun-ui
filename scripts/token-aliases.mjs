// Compatibility/readback paths are not independent geometry inputs. Their
// references are enforced so an accepted edit cannot silently miss consumers.
export const readbackAliases = {
  ...Object.fromEntries(['xs', 'sm', 'md', 'lg', 'xl'].map(size => ['button.fontSizes.' + size, 'button.typography.' + size + '.fontSizePx'])),
  'button.radius': 'button.radii.md',
  'button.contentGap': 'button.contentGaps.md',
  'button.weight': 'typography.control.fontWeight',
  'button.formActionRadius': 'button.radii.sm',
  ...Object.fromEntries(['sm', 'md', 'lg'].map(size => ['input.' + size + '.placeholderSize', 'input.' + size + '.fontSize'])),
  ...Object.fromEntries(['sm', 'md', 'lg'].map(size => ['extensions.compound.' + size, 'input.' + size + '.height'])),
  'extensions.compound.radius': 'input.md.radius',
  'extensions.navigation.minimumHeight': 'extensions.topNavigation.minimumHeight',
  'extensions.navigation.gap': 'extensions.topNavigation.gap',
  'extensions.navigation.paddingY': 'extensions.topNavigation.paddingY',
  'extensions.navigation.descriptionGap': 'extensions.topNavigation.descriptionGap',
  ...Object.fromEntries(['itemGap', 'itemPaddingX', 'itemPaddingY', 'badgePaddingX', 'badgeRadius'].map(key => ['extensions.navigation.' + key, 'extensions.bottomNavigation.' + key])),
};

export function validateReadbackAliases(source) {
  for (const [path, target] of Object.entries(readbackAliases)) {
    const value = path.split('.').reduce((v, key) => v?.[key], source);
    if (value?.$ref !== target || Object.keys(value).length !== 1)
      throw Error(`Readback token ${path} must reference ${target}; edit the canonical role instead.`);
  }
}
