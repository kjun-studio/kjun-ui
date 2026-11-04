async (page) => {
  const results = [];
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  const folder = '/workspace/output/playwright/kpi-radius-audit-20261104';
  for (const platform of ['native']) {
    for (const [name, width, query] of [
      ['desktop', 1000, ''], ['mobile-grid', 390, ''],
      ['mobile-summary', 390, '?summary=1'], ['mobile-small', 390, '?small=1'],
      ['desktop-static', 1000, '?click=0'], ['desktop-flat', 1000, '?flat=1'],
    ]) {
      await page.setViewportSize({ width, height: 500 });
      await page.goto('http://127.0.0.1:4197/' + platform + query);
      await page.getByText('Metric D', { exact: true }).waitFor();
      const items = platform === 'native'
        ? page.locator('#kpi-audit > div > *')
        : page.locator('.kjun-kpi-row__item');
      const styles = await items.evaluateAll(nodes => nodes.map(node => {
        const s = getComputedStyle(node);
        return { text: node.textContent, radius: s.borderRadius, left: s.borderLeftWidth, top: s.borderTopWidth, border: s.borderLeftColor, background: s.backgroundColor };
      }));
      results.push({ platform, name, width, styles });
      if (['desktop', 'mobile-grid'].includes(name)) {
        await page.locator('#kpi-audit').screenshot({ path: folder + '/' + platform + '-' + name + '-before.png' });
        await items.evaluateAll(nodes => nodes.forEach(node => node.style.borderRadius = '0px'));
        await page.locator('#kpi-audit').screenshot({ path: folder + '/' + platform + '-' + name + '-radius-zero.png' });
      }
    }
  }
  return { results, errors };
}
