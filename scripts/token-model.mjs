import { readFile } from 'node:fs/promises';
import { validateTypedReferences, validateShadows, validateChoiceGeometry, validateTokenRelationships, tokenCssUnit } from './token-validation.mjs';
import { validateReadbackAliases } from './token-aliases.mjs';

export const kebab = value => value.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
export const rem = value => value / 16 + 'rem';
export function mergeTokenDefinitions(...parts) {
  const result = {};
  function merge(target, source, path = []) {
    for (const [key, value] of Object.entries(source)) {
      if (!(key in target)) target[key] = structuredClone(value);
      else if (value && typeof value === 'object' && !Array.isArray(value) && !('$ref' in value) &&
        target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) && !('$ref' in target[key]))
        merge(target[key], value, [...path, key]);
      else throw Error('Duplicate token definition: ' + [...path, key].join('.'));
    }
  }
  for (const part of parts) merge(result, part);
  return result;
}
export async function readTokenDefinitions(root) {
  const read = async name => JSON.parse(await readFile(`${root}/packages/tokens/src/definitions/${name}.json`, 'utf8'));
  const [geometry, extensions, details, kpi, colors, typography, shadows, states, responsive, sizing] = await Promise.all(['geometry', 'geometry-extensions', 'geometry-details', 'geometry-kpi', 'colors', 'typography', 'shadows', 'states', 'responsive-motion', 'sizing'].map(read));
  return mergeTokenDefinitions(geometry, extensions, details, kpi, colors, { typography }, shadows, states, responsive, sizing);
}
// Keep existing flat bindings stable while supporting component variants and nested references.
export function extensionGeometryCss(data, definitions) {
  const lines = [];
  function visit(value, path) {
    if (typeof value === 'number') {
      const unit = tokenCssUnit(definitions, ['extensions', ...path].join('.'));
      lines.push(`  --extension-${path.map(kebab).join('-')}: ${unit === 'rem' ? rem(value) : value + unit};`);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) for (const [key, child] of Object.entries(value)) visit(child, [...path, key]);
  }
  visit(data.extensions, []);
  return lines.join('\n');
}
export function compileTokens(source) {
  if ('spacing' in source) throw Error('Retired spacing scale; use dimension.value* without compatibility aliases.');
  // Geometry roles must inherit a scale or another role. Widths, heights and
  // shadow layers have separate contracts; zero remains an explicit reset.
  function validateGeometry(value, path = []) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || '$ref' in value) return;
    for (const [key, child] of Object.entries(value)) {
      const role = [...path, key].join('.');
      const isGeometry = [...path, key].some(part => /padding|margin|gap|radius|radii|inset|offset/i.test(part));
      if (isGeometry && typeof child === 'number' && child !== 0)
        throw Error('Geometry role must reference a shared scale: ' + role);
      validateGeometry(child, [...path, key]);
    }
  }
  for (const group of ['button','buttonGroup','input','modal','card','table','extensions']) validateGeometry(source[group], [group]);
  // Layout roles are aliases only: each leaf names a scale or component role.
  function validateAliases(value, path) {
    if (value && typeof value === 'object' && !Array.isArray(value) && !('$ref' in value)) {
      for (const [key, child] of Object.entries(value)) validateAliases(child, path + '.' + key);
    } else if (!value || typeof value !== 'object' || !('$ref' in value)) throw Error('Layout role must reference a scale or component role: ' + path);
  }
  for (const group of ['space', 'shape']) validateAliases(source[group], group);
  for (const [name, value] of Object.entries(source.dimension)) {
    if (!/^value(?:0|[1-9]\d*)$/.test(name) || !Number.isFinite(value) || value !== Number(name.slice(5)))
      throw Error('Invalid dimension scale: dimension.' + name + '; keep named values fixed and change the consuming reference.');
  }
  for (const group of ['radius']) for (const [name, value] of Object.entries(source[group]))
    if (!Number.isFinite(value) || value < 0) throw Error('Invalid geometry scale: ' + group + '.' + name);
  const pathValue = (path, trail) => path.split('.').reduce((v, key) => {
    if (v && typeof v === 'object' && '$ref' in v) v = resolve(v, trail);
    return v?.[key];
  }, source);
  function resolve(value, trail = []) {
    if (value && typeof value === 'object' && '$ref' in value) {
      const path = value.$ref;
      if (trail.includes(path)) throw Error('Cyclic token reference: ' + [...trail, path].join(' → '));
      const target = pathValue(path, [...trail, path]);
      if (target === undefined) throw Error('Unknown token reference: ' + path);
      return resolve(target, [...trail, path]);
    }
    if (Array.isArray(value)) return value.map(v => resolve(v, trail));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,resolve(v,trail)]));
    return value;
  }
  const data = resolve(source);
  validateTypedReferences(source, data);
  validateReadbackAliases(source);
  validateShadows(data);
  const number = (value, path) => {
    if (!Number.isFinite(value) || (value < 0 && !path.endsWith('.letterSpacingEm') && path !== 'states.focus.insetOffset'))
      throw Error('Invalid numeric token: ' + path);
  };
  // References carry a value contract as well as a destination. Composite aliases
  // are explicit so a radius cannot accidentally resolve to a typography object.
  function validateReferences(value, path = []) {
    if (!value || typeof value !== 'object') return;
    if ('$ref' in value) {
      const name = path.join('.'), resolved = path.reduce((v, key) => v?.[key], data);
      if (/^(?:button|extensions\.chip)\.typography\.[^.]+$/.test(name)) {
        if (!resolved || Object.keys(resolved).sort().join() !== 'fontSizePx,fontWeight,letterSpacingEm,lineHeightPx')
          throw Error('Invalid typography reference: ' + name);
      } else if (name === 'buttonGroup.heights' || name === 'extensions.kpiRow.badgePadding') {
        const keys = name === 'buttonGroup.heights' ? ['xs','sm','md','lg','xl'] : ['x','y'];
        if (!resolved || Object.keys(resolved).sort().join() !== keys.sort().join()) throw Error('Invalid geometry reference: ' + name);
        for (const key of keys) number(resolved[key], name + '.' + key);
      } else if (/^elevation\.|\.elevation(?:\.[^.]+)?$/.test(name)) {
        if (!Array.isArray(resolved)) throw Error('Invalid elevation reference: ' + name);
      } else number(resolved, name);
      return;
    }
    for (const [key, child] of Object.entries(value)) validateReferences(child, [...path, key]);
  }
  validateReferences(source);
  function validateDimensions(value, path) {
    if (path === 'button.defaultSize' || path === 'button.variants' || /\.elevation(?:\.|$)/.test(path)) return;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [key, child] of Object.entries(value)) validateDimensions(child, path + '.' + key);
    } else number(value, path);
  }
  for (const group of ['button','buttonGroup','input','modal','card','table','native','extensions','layers','states','border','effects','breakpoints','responsive','motionDistance','iconSizes','space','shape']) validateDimensions(data[group], group);
  for (const group of ['breakpoints', 'responsive']) for (const [name, value] of Object.entries(data[group]))
    if (value <= 0) throw Error('Invalid responsive threshold: ' + group + '.' + name);
  validateChoiceGeometry(data);
  for (const [name, value] of Object.entries(data.states.opacity))
    if (value > 1) throw Error('Invalid opacity token: ' + name);
  for (const [name, value] of Object.entries(data.layers.page))
    if (!Number.isInteger(value)) throw Error('Invalid layer token: ' + name);
  for (const [key, value] of Object.entries(data.motion)) {
    if (key.startsWith('ease')) {
      const match = typeof value === 'string' && value.match(/^cubic-bezier\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/);
      if (!match || !match.slice(1).every(n => Number.isFinite(Number(n))) || ![Number(match[1]), Number(match[3])].every(n => n >= 0 && n <= 1)) throw Error('Invalid motion easing: ' + key);
    } else number(value, 'motion.' + key);
  }
  // A constant inset follows the same curve on the track and its selected item.
  data.buttonGroup.itemRadii = Object.fromEntries(Object.entries(data.buttonGroup.radii)
    .map(([size, radius]) => [size, Math.max(0, radius - data.buttonGroup.padding[size])]));
  for (const [role, t] of Object.entries(data.typography)) {
    if (Object.keys(t).sort().join() !== ['fontSizePx','lineHeightPx','fontWeight','letterSpacingEm'].sort().join() ||
        ![12,14,16,20,24,32,40].includes(t.fontSizePx) || ![16,20,24,28,32,40,48].includes(t.lineHeightPx) || t.lineHeightPx < t.fontSizePx ||
        ![400,500,600,700].includes(t.fontWeight) || !Number.isFinite(t.letterSpacingEm))
      throw Error('Invalid typography units or values: ' + role);
  }
  validateTokenRelationships(data);
  const fallbacks = Object.keys(data.colorRoleFallbacks);
  if (new Set(data.colorRoles).size !== data.colorRoles.length ||
      new Set([...data.coreColorRoles,...fallbacks]).size !== data.colorRoles.length ||
      data.colorRoles.some(r => data.coreColorRoles.includes(r) === fallbacks.includes(r)) ||
      [...data.coreColorRoles,...fallbacks].some(r => !data.colorRoles.includes(r)))
    throw Error('Every common color role must be either required or have one fallback.');
  for (const role of data.colorRoles) colorExpression(data, role);
  for (const [name, surface] of Object.entries(data.cardSurfaces)) {
    for (const key of ['background','border','text','description'])
      if (!data.colorRoles.includes(surface[key])) throw Error('Invalid card color role: ' + name + '.' + key);
    if (surface.gradientEnd !== undefined && !data.colorRoles.includes(surface.gradientEnd)) throw Error('Invalid card gradient role: ' + name);
  }
  for (const value of Object.values(data.roleBindings))
    if (value !== 'font') colorExpression(data, value);
  return data;
}
export function colorExpression(data, role, trail = []) {
  if (trail.includes(role)) throw Error('Cyclic color fallback: ' + [...trail,role].join(' → '));
  if (![...data.colorRoles,...data.domainColorRoles].includes(role)) throw Error('Unknown color role: ' + role);
  const fallback = data.colorRoleFallbacks[role];
  return `var(--kjun-${kebab(role)}${fallback ? ', ' + colorExpression(data, fallback, [...trail,role]) : ''})`;
}
export function shadowCss(layers) {
  return layers.map(s => `${s.inset ? 'inset ' : ''}${s.offsetX}px ${s.offsetY}px ${s.blurRadius}px ${s.spreadDistance}px var(--_kjun-color-${kebab(s.colorRole)})`).join(', ') || 'none';
}
export function typographyCss(data) {
  const lines = ['/* Generated from definitions/typography.json. */', '.kjun-scope {'];
  for (const [role,t] of Object.entries(data.typography)) {
    const key = '--_kjun-type-' + kebab(role);
    lines.push(`  ${key}-size: ${rem(t.fontSizePx)};`, `  ${key}-line: ${rem(t.lineHeightPx)};`, `  ${key}-weight: ${t.fontWeight};`, `  ${key}-tracking: ${t.letterSpacingEm}em;`);
  }
  lines.push('  font-size: var(--_kjun-type-body-size); line-height: var(--_kjun-type-body-line); font-weight: var(--_kjun-type-body-weight); letter-spacing: var(--_kjun-type-body-tracking);', '}');
  for (const role of Object.keys(data.typography)) {
    const key = '--_kjun-type-' + kebab(role);
    lines.push(`.kjun-scope .kjun-type-${kebab(role)} { font-size: var(${key}-size); line-height: var(${key}-line); font-weight: var(${key}-weight); letter-spacing: var(${key}-tracking);${/^(number|display)/.test(role) ? ' font-family: var(--font-numeric); font-variant-numeric: tabular-nums;' : ''} }`);
  }
  return lines.join('\n') + '\n';
}
