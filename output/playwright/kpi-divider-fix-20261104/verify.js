async (page) => {
  const results = [], failures = [], errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const folder = '/workspace/output/playwright/kpi-divider-fix-20261104';
  const modes = [['grid', ''], ['summary', '?summary=1'], ['small', '?small=1'], ['flat', '?flat=1']];
  for (const platform of ['react', 'vue3', 'native']) {
    for (const width of [1000, 390, 320]) {
      const cases = width === 1000 ? [...modes, ['static', '?click=0'], ['loading', '?loading=1']]
        : [...modes, ['odd', '?odd=1'], ['hero-first', '?hero=1']];
      for (const [mode, query] of cases) {
        const name = `${platform}-${width}-${mode}`;
        const check = (ok, message) => { if (!ok) failures.push(`${name}: ${message}`); };
        await page.setViewportSize({ width, height: 650 });
        await page.mouse.move(0, 0);
        await page.goto(`http://127.0.0.1:4197/${platform}${query}`);
        await page.getByText('Metric B', { exact: true }).waitFor();
        const items = platform === 'native' ? page.locator('#kpi-audit > div > *') : page.locator('.kjun-kpi-row__item');
        const styles = await items.evaluateAll((nodes, native) => nodes.map(node => {
          const s = getComputedStyle(node);
          const decoration = native ? [...node.children].find(child => getComputedStyle(child).position === 'absolute') : null;
          const d = native ? decoration && getComputedStyle(decoration) : getComputedStyle(node, '::before');
          return {
            radius: s.borderRadius, left: s.borderLeftWidth, top: s.borderTopWidth, borderColor: s.borderLeftColor,
            divider: d && { radius: d.borderRadius, left: d.borderLeftWidth, top: d.borderTopWidth, color: d.borderLeftColor, events: d.pointerEvents },
            width: node.getBoundingClientRect().width,
          };
        }), platform === 'native');
        check(styles.length === (mode === 'odd' ? 3 : 4), 'item count');
        for (const s of styles) {
          check(s.radius === (mode === 'static' ? '0px' : '8px'), 'click target radius');
          check(s.borderColor === 'rgba(0, 0, 0, 0)', 'rounded target must not paint the divider');
          if (s.left !== '0px' || s.top !== '0px') {
            check(s.divider?.radius === '0px', 'divider must be straight');
            check(s.divider?.left === s.left && s.divider?.top === s.top, 'divider occupies original border space');
            check(s.divider?.events === 'none', 'divider must not intercept input');
            check(s.divider?.color === 'rgb(222, 222, 222)', 'divider keeps project border color');
          }
        }
        if (mode === 'summary' && width < 768) check(styles.every(s => s.left === '0px' && s.top === '0px'), 'summary has no dividers');
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'horizontal page overflow');
        if (['grid', 'summary', 'small', 'flat'].includes(mode)) {
          await page.locator('#kpi-audit').screenshot({ path: `${folder}/${name}.png` });
        }
        if (mode === 'loading') {
          const box = await items.nth(1).boundingBox();
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          check(await page.evaluate(() => window.kpiClicks.length === 0), 'loading click blocked');
        } else if (mode !== 'static') {
          const button = page.getByRole('button', { name: /Metric B/ });
          await button.click({ position: { x: 1, y: 12 } });
          await button.press('Enter');
          await button.press('Space');
          check(await page.evaluate(() => JSON.stringify(window.kpiClicks) === '[1,1,1]'), 'pointer/Enter/Space events');
          await page.keyboard.press('Tab');
          await page.keyboard.press('Shift+Tab');
          const focus = await button.evaluate(node => ({ focused: node === document.activeElement, outline: getComputedStyle(node).outlineStyle, radius: getComputedStyle(node).borderRadius }));
          check(focus.focused && focus.outline === 'solid' && focus.radius === '8px', 'keyboard focus ring retained');
          if (mode === 'grid' && width === 390) await page.locator('#kpi-audit').screenshot({ path: `${folder}/${platform}-mobile-focus.png` });
          if (platform !== 'native') {
            await button.hover();
            await page.waitForFunction(node => getComputedStyle(node).backgroundColor === 'rgb(235, 235, 235)', await button.elementHandle());
            check(await button.evaluate(node => getComputedStyle(node).backgroundColor === 'rgb(235, 235, 235)'), 'hover background retained');
          }
        }
        results.push({ name, styles });
      }
    }
  }
  return { cases: results.length, failures, errors, results };
}
