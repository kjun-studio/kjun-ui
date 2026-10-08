// Token dimensions are checked independently of their JavaScript representation.
// The same number cannot stand for a length, duration, weight and opacity.
export function tokenKind(path) {
  const parts = path.split('.'), name = parts.at(-1);
  if (parts[0] === 'motion') return name.startsWith('ease') ? 'easing' : 'duration';
  if (name === 'loadingMinimum') return 'duration';
  if (parts[0] === 'layers') return 'layer';
  if (path.startsWith('states.opacity.')) return 'opacity';
  if (/^(fontWeight|weight|titleWeight)$/.test(name)) return 'fontWeight';
  if (name === 'letterSpacingEm') return 'tracking';
  if (name === 'inset' && isShadow(path)) return 'boolean';
  if (name === 'colorRole') return 'colorRole';
  return 'length';
}

const isShadow = path => path.startsWith('shadowScale.') || /^elevation\.|\.elevation(?:\.|$)/.test(path);
const at = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);

// Follow the complete author reference path, including aliases of composite
// objects. CSS units belong to the original value, not the last alias spelling.
export function tokenCssUnit(source, path, trail = []) {
  if (trail.includes(path)) throw Error('Cyclic token reference: ' + [...trail, path].join(' → '));
  const parts = path.split('.');
  let value = source;
  for (let index = 0; index <= parts.length; index++) {
    if (value && typeof value === 'object' && '$ref' in value) {
      const target = [value.$ref, ...parts.slice(index)].join('.');
      return tokenCssUnit(source, target, [...trail, path]);
    }
    if (index < parts.length) value = value?.[parts[index]];
  }
  if (value === undefined) throw Error('Unknown token reference: ' + path);
  if (/^typography\.[^.]+\.(?:fontSizePx|lineHeightPx)$/.test(path)) return 'rem';
  const kind = tokenKind(path);
  if (kind === 'duration') return 'ms';
  if (kind === 'tracking') return 'em';
  return kind === 'length' ? 'px' : '';
}

function contract(value, path) {
  if (Array.isArray(value)) return isShadow(path) ? 'shadow' : 'array';
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, contract(value[key], path + '.' + key)]));
  return tokenKind(path);
}

export function validateTypedReferences(source, resolved) {
  function visit(value, path = []) {
    if (!value || typeof value !== 'object') return;
    if ('$ref' in value) {
      const name = path.join('.');
      if (typeof value.$ref !== 'string' || Object.keys(value).length !== 1)
        throw Error('Invalid token reference syntax: ' + name);
      const expected = contract(at(resolved, name), name);
      const actual = contract(at(resolved, value.$ref), value.$ref);
      if (JSON.stringify(expected) !== JSON.stringify(actual))
        throw Error(`Token kind mismatch: ${name} (${JSON.stringify(expected)}) → ${value.$ref} (${JSON.stringify(actual)})`);
      return;
    }
    for (const [key, child] of Object.entries(value)) visit(child, [...path, key]);
  }
  visit(source);
}

export function validateShadows(data) {
  const expected = ['offsetX', 'offsetY', 'blurRadius', 'spreadDistance', 'inset', 'colorRole'].sort().join();
  function layers(value, name) {
    if (!Array.isArray(value)) throw Error('Invalid shadow layers: ' + name);
    for (const [index, layer] of value.entries()) {
      if (!layer || typeof layer !== 'object' || Object.keys(layer).sort().join() !== expected ||
          !data.colorRoles.includes(layer.colorRole) ||
          !['offsetX', 'offsetY', 'blurRadius', 'spreadDistance'].every(key => Number.isFinite(layer[key])) ||
          layer.blurRadius < 0 || typeof layer.inset !== 'boolean')
        throw Error('Invalid shadow geometry: ' + name + '.' + index);
    }
  }
  for (const [name, value] of Object.entries(data.shadowScale)) layers(value, 'shadowScale.' + name);
  for (const [name, value] of Object.entries(data.elevation)) layers(value, 'elevation.' + name);
  // Validate resolved component shadows too, including inline definitions and aliases.
  function components(value, path = []) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    for (const [key, child] of Object.entries(value)) {
      const name = [...path, key].join('.');
      if (key === 'elevation') {
        if (Array.isArray(child)) layers(child, name);
        else if (child && typeof child === 'object') for (const [variant, shadow] of Object.entries(child)) layers(shadow, name + '.' + variant);
        else throw Error('Invalid component elevation: ' + name);
      } else components(child, [...path, key]);
    }
  }
  for (const name of ['button', 'input', 'modal', 'card', 'table', 'extensions']) components(data[name], [name]);
}

export function validateChoiceGeometry(data) {
  if (data.native.minimumTouchTarget <= 0 || data.extensions.choice.minimumHeight <= 0)
    throw Error('Invalid choice minimum target');
  for (const size of ['sm', 'md', 'lg']) {
    const { checkbox, switch: toggle } = data.extensions;
    if (checkbox.sizes[size] <= 0 || checkbox.iconSizes[size] <= 0 ||
        checkbox.iconSizes[size] > checkbox.sizes[size] - 2 * data.border.controlWidth ||
        toggle.widths[size] < toggle.heights[size] || toggle.heights[size] <= 2 * toggle.padding)
      throw Error('Invalid choice geometry: ' + size);
  }
}

/** Check relationships that a valid numeric type alone cannot express. */
export function validateTokenRelationships(data) {
  const positive = (value, path) => {
    if (!Number.isFinite(value) || value <= 0) throw Error('Expected positive dimension: ' + path);
  };
  function dimensions(value, path) {
    if (typeof value === 'number' && /width|height|size/i.test(path)) positive(value, path);
    else if (value && typeof value === 'object' && !Array.isArray(value))
      for (const [key, child] of Object.entries(value)) dimensions(child, path + '.' + key);
  }
  for (const group of ['button', 'input', 'modal', 'table', 'extensions', 'iconSizes']) dimensions(data[group], group);
  for (const key of ['track', 'thumb']) positive(data.extensions.slider[key], 'extensions.slider.' + key);
  for (const [size, height] of Object.entries(data.button.heights)) {
    positive(height, 'button.heights.' + size);
    positive(data.button.iconSizes[size], 'button.iconSizes.' + size);
    if (height < Math.max(data.button.typography[size].lineHeightPx, data.button.iconSizes[size]))
      throw Error('Button content exceeds height: ' + size);
    // Labelled buttons never read narrower than tall, and the icon side only tightens the regular inset.
    if (data.button.minWidths[size] < height) throw Error('Button minimum width below height: ' + size);
    if (data.button.iconSidePaddingX[size] > data.button.paddingX[size])
      throw Error('Button icon-side padding exceeds padding: ' + size);
  }
  for (const [size, height] of Object.entries(data.buttonGroup.heights)) {
    if (height - 2 * data.buttonGroup.padding[size] < Math.max(data.button.typography[size].lineHeightPx, data.extensions.selection.iconSize))
      throw Error('ButtonGroup content exceeds inner height: ' + size);
  }
  for (const [size, input] of Object.entries(data.input)) {
    positive(input.height, 'input.' + size + '.height');
    if (input.height < Math.max(input.lineHeight, input.iconSize) + 2 * data.border.controlWidth)
      throw Error('Input content exceeds inner height: ' + size);
  }
  for (const [size, width] of Object.entries(data.modal.widths)) positive(width, 'modal.widths.' + size);
  const { chip, toast, radio } = data.extensions;
  for (const size of ['sm', 'md', 'lg', 'removeSize', 'nativeRemoveSize']) positive(chip[size], 'extensions.chip.' + size);
  if (chip.nativeRemoveSize < Math.max(chip.removeSize, data.native.minimumTouchTarget))
    throw Error('Native Chip removal target is smaller than its control or minimum touch target');
  for (const key of ['minWidth', 'maxWidth', 'closeSize', 'progressHeight']) positive(toast[key], 'extensions.toast.' + key);
  if (toast.minWidth > toast.maxWidth) throw Error('Toast minWidth exceeds maxWidth');
  positive(radio.dot, 'extensions.radio.dot');
  if (radio.dot > radio.size - 2 * radio.borderWidth) throw Error('Radio dot exceeds inner size');
  const { content, sticky, navigation } = data.layers.page;
  if (!(content < sticky && sticky < navigation))
    throw Error('Page layer order must be content < sticky < navigation');
  const { compact, medium, wide } = data.breakpoints;
  if (!(compact < medium && medium < wide))
    throw Error('Breakpoint order must be compact < medium < wide');
}
