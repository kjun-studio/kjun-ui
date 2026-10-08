import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { assertCurrentConsumer } from './package-state.mjs';
import { presentationFiles, fingerprintDirectory, pngSize } from './presentation-build.mjs';
import { preparePresentation } from './presentation-capture.mjs';
import { presentations, overviewScenes, capture, captureProfiles, captureFor } from '../previews/presentation/registry.mjs';
const root = resolve(import.meta.dirname, '..');
const publicRoot = resolve(root, 'apps/docs/public');
const directory = resolve(publicRoot, 'previews/thumbnails');
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const index = await json(resolve(root, 'apps/docs/lib/generated/discovery.json'));
const documents = index.documents.filter(document => document.component);
if (presentations.length !== documents.length || new Set(presentations.map(s => s.name)).size !== documents.length || documents.some(d => !presentations.some(s => s.name === d.component))) throw Error('Presentation definitions must cover each public component exactly once.');
if (new Set(documents.map(d => d.thumbnail)).size !== documents.length) throw Error('Each component must have its own thumbnail URL.');
const consumer = await assertCurrentConsumer();
const packages = consumer.manifest.filter(pkg => ['@kjun/react', '@kjun/tokens'].includes(pkg.name));
const built = await presentationFiles(root, consumer);
const sha = value => createHash('sha256').update(value).digest('hex');
const fingerprint = createHash('sha256');
for (const file of ['scripts/thumbnails.mjs', 'scripts/presentation-build.mjs', 'scripts/presentation-capture.mjs', 'shared/demo-colors.ts', 'apps/docs/public/brand/kjun-symbol.svg']) fingerprint.update(await readFile(resolve(root, file)));
await fingerprintDirectory(fingerprint, resolve(root, 'previews/presentation'));
await fingerprintDirectory(fingerprint, resolve(publicRoot, 'fonts'));
fingerprint.update(JSON.stringify({ packages, documents: documents.map(d => [d.component, d.id, d.thumbnail]), captureProfiles }));
for (const [name, bytes] of Object.entries(built)) fingerprint.update(name).update(bytes);
const digest = fingerprint.digest('hex');
const manifestPath = resolve(directory, 'manifest.json');
const previous = await json(manifestPath).catch(() => null);
const scenes = [
  ...documents.map(document => ({ ...presentations.find(s => s.name === document.component), id: document.id, group: 'images', url: document.thumbnail })),
  ...overviewScenes.map(scene => ({ ...scene, group: 'overviewImages', url: '/previews/overview/' + scene.id + '.png' })),
];
const dimensions = { width: capture.width * capture.deviceScaleFactor, height: capture.height * capture.deviceScaleFactor };
const conditions = scene => ({ url: scene.url, width: scene.width, prepare: scene.prepare || null, highlight: scene.highlight || null, layer: !!scene.layer, captureType: scene.captureType, capture: captureFor(scene) });
async function validCache() {
  if (previous?.fingerprint !== digest || Object.keys(previous.images || {}).length !== documents.length || Object.keys(previous.overviewImages || {}).length !== overviewScenes.length) return false;
  if (new Set(Object.values(previous.images)).size !== documents.length) return false;
  if (JSON.stringify(previous.capture) !== JSON.stringify(capture) || JSON.stringify(previous.dimensions) !== JSON.stringify(dimensions)) return false;
  if (Object.keys(previous.scenes || {}).length !== scenes.length || JSON.stringify(previous.captureProfiles) !== JSON.stringify(captureProfiles)) return false;
  for (const scene of scenes) {
    const evidence = previous.scenes[scene.name];
    if (!evidence || Object.entries(conditions(scene)).some(([key, value]) => JSON.stringify(evidence[key]) !== JSON.stringify(value))) return false;
    const expectedCapture = captureFor(scene), frame = evidence.geometry?.frame;
    const viewport = { width: scene.layer ? scene.width : expectedCapture.width, height: expectedCapture.height - (scene.layer ? 2 * expectedCapture.padding : 0) };
    if (JSON.stringify(evidence.geometry?.viewport) !== JSON.stringify(viewport) || !evidence.geometry?.boxes?.length || evidence.geometry.outside?.length !== 0 || evidence.geometry.clipped?.length !== 0) return false;
    if (scene.layer && (!frame || frame.left < expectedCapture.padding || frame.top < expectedCapture.padding || frame.left + frame.width > expectedCapture.width - expectedCapture.padding || frame.top + frame.height > expectedCapture.height - expectedCapture.padding)) return false;
    const bytes = await readFile(resolve(publicRoot, '.' + scene.url)).catch(() => null);
    if (!bytes || sha(bytes) !== previous[scene.group][scene.id] || JSON.stringify(pngSize(bytes)) !== JSON.stringify(dimensions)) return false;
  }
  for (const [name, bytes] of Object.entries(built)) {
    const actual = await readFile(resolve(publicRoot, 'previews', name)).catch(() => null);
    if (!actual?.equals(Buffer.from(bytes))) return false;
  }
  return true;
}
if (await validCache()) {
  console.log(`Packed React presentation images verified: ${documents.length} components + ${overviewScenes.length} overview scenes.`);
} else if (process.argv.includes('--check')) {
  throw Error('Presentation images are missing or stale. Run build:thumbnails.');
} else {
  await mkdir(directory, { recursive: true });
  await mkdir(resolve(publicRoot, 'previews/overview'), { recursive: true });
  for (const [name, bytes] of Object.entries(built)) await writeFile(resolve(publicRoot, 'previews', name), bytes);
  const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml' };
  const server = createServer(async (request, response) => {
    try {
      const path = resolve(publicRoot, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
      if (!path.startsWith(publicRoot + sep)) { response.writeHead(403).end(); return; }
      response.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' }).end(await readFile(path));
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const manifest = { fingerprint: digest, renderer: '@kjun/react', packages, capture, captureProfiles, dimensions, images: {}, overviewImages: {}, scenes: {} };
    for (const scene of scenes) {
      const capture = captureFor(scene);
      const context = await browser.newContext({ viewport: { width: capture.width, height: capture.height }, deviceScaleFactor: capture.deviceScaleFactor, reducedMotion: 'reduce', locale: 'ko-KR', timezoneId: 'Asia/Seoul' });
      try {
        const page = await context.newPage(), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
        await page.goto(`http://127.0.0.1:${server.address().port}/previews/presentation.html?scene=${encodeURIComponent(scene.name)}`);
        const geometry = await preparePresentation(page, scene);
        const bytes = await page.screenshot({ path: resolve(publicRoot, '.' + scene.url), animations: 'disabled' });
        if (errors.length) throw Error(scene.name + ': ' + errors.join('; '));
        if (JSON.stringify(pngSize(bytes)) !== JSON.stringify(dimensions)) throw Error('Invalid capture dimensions: ' + scene.name);
        manifest[scene.group][scene.id] = sha(bytes);
        manifest.scenes[scene.name] = { ...conditions(scene), geometry };
        if (Object.keys(manifest.scenes).length % 20 === 0) console.log(`Captured ${Object.keys(manifest.scenes).length}/${scenes.length} presentation scenes.`);
      } finally { await context.close(); }
    }
    if (new Set(Object.values(manifest.images)).size !== documents.length) throw Error('Representative component images must be distinct.');
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Generated ${documents.length} component thumbnails + ${overviewScenes.length} overview images from packed React.`);
  } finally {
    await browser?.close();
    await new Promise(done => server.close(done));
  }
}
