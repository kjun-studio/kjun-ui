import postcss from 'postcss';

// CSS variables cannot supply query thresholds. Resolve author-only token()
// expressions while packing, so shipped media/container queries are plain CSS.
export function responsiveCss(source, tokens) {
  const sheet = postcss.parse(source);
  sheet.walkAtRules(/^(?:media|container)$/, rule => {
    rule.params = rule.params.replace(/token\(([^)]+)\)/g, (_, path) => {
      const value = path.startsWith('responsive.') &&
        path.split('.').reduce((current, key) => current?.[key], tokens);
      if (!Number.isFinite(value) || value <= 0) throw Error('Invalid responsive CSS token: ' + path);
      return value + 'px';
    });
    if (rule.params.includes('token(')) throw Error('Invalid responsive query: ' + rule.params);
  });
  return sheet.toString();
}
