async (page) => {
  const results = [];
  for (const platform of ['react', 'vue3']) {
    for (const width of [1000, 390, 320]) {
      const cases = [['grid', ''], ['summary', '?summary=1'], ['small', '?small=1'], ['flat', '?flat=1']];
      if (width < 1000) cases.push(['odd', '?odd=1'], ['hero-first', '?hero=1']);
      for (const [mode, query] of cases) {
        await page.setViewportSize({ width, height: 650 });
        await page.mouse.move(0, 0);
        await page.goto(`http://127.0.0.1:4197/${platform}${query}`);
        const button = page.getByRole('button', { name: /Metric B/ });
        await button.hover();
        await page.waitForFunction(node => getComputedStyle(node).backgroundColor === 'rgb(235, 235, 235)', await button.elementHandle());
        const style = await button.evaluate(node => ({ radius: getComputedStyle(node).borderRadius, color: getComputedStyle(node).backgroundColor, dividerRadius: getComputedStyle(node, '::before').borderRadius }));
        if (style.radius !== '8px' || style.dividerRadius !== '0px') throw Error('Hover geometry: ' + JSON.stringify(style));
        results.push({ name: `${platform}-${width}-${mode}`, ...style });
        if (width === 390 && mode === 'grid') await page.locator('#kpi-audit').screenshot({ path: `/workspace/output/playwright/kpi-divider-fix-20261104/${platform}-mobile-hover.png` });
      }
    }
  }
  return { cases: results.length, results };
}
