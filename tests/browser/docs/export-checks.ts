import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';

/** Serves artifacts/export-checks, the standalone consumer builds of copied example code. */
export async function exportsRoute(page: Page) {
  await page.route('**/previews/export-checks/**', async route => {
    const path = new URL(route.request().url()).pathname.split('/export-checks/')[1];
    await route.fulfill({ body: await readFile('artifacts/export-checks/' + path), contentType: path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html' });
  });
}
