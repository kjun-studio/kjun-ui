import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
export async function servePreviews() {
  const publicRoot = resolve("apps/docs/public");
  const server = createServer(async (request, response) => {
    try {
      const path = resolve(
        publicRoot,
        "." + decodeURIComponent(new URL(request.url, "http://local").pathname),
      );
      if (!path.startsWith(publicRoot + sep)) {
        response.writeHead(403).end();
        return;
      }
      const body = await readFile(path),
        mime = {
          ".html": "text/html",
          ".js": "text/javascript",
          ".json": "application/json",
          ".css": "text/css",
          ".woff2": "font/woff2",
          ".woff": "font/woff",
          ".png": "image/png",
        };
      response
        .writeHead(200, { "Content-Type": mime[extname(path)] || "application/octet-stream" })
        .end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((done) => server.close(done)),
  };
}
export async function configureFigure(page, name, spec, presetConfig) {
  const preset = presetConfig(name);
  await page.evaluate(
    (config) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          window.removeEventListener("message", receive);
          reject(Error("Preview did not apply figure settings."));
        }, 12000);
        function receive(event) {
          if (
            event.source !== window ||
            event.data?.component !== config.component ||
            event.data?.revision !== config.revision
          )
            return;
          if (event.data.type === "kjun:catalog-snapshot") {
            clearTimeout(timer);
            window.removeEventListener("message", receive);
            resolve(true);
          }
          if (event.data.type === "kjun:catalog-error") {
            clearTimeout(timer);
            window.removeEventListener("message", receive);
            reject(Error(event.data.message));
          }
        }
        window.addEventListener("message", receive);
        window.postMessage({ type: "kjun:catalog-configure", config }, location.origin);
      }),
    {
      ...preset,
      component: name,
      settings: { ...preset.settings, ...spec.settings },
      values: spec.values || {},
      palette: "default",
      session: "",
      revision: 2,
      reset: 1,
      compact: true,
    },
  );
  if (spec.action) {
    const [kind, ...rest] = spec.action.split(":");
    if (kind === "hover") {
      await page.keyboard.press("Tab");
      await page.getByRole("button", { name: rest.join(":"), exact: true }).focus();
      await page.getByRole("tooltip").waitFor();
    } else if (kind === "click-label")
      await page.getByLabel(rest.join(":"), { exact: true }).last().click();
    else if (kind === "search") {
      const input = page.getByLabel("자산 검색", { exact: true }).last();
      await input.fill(rest.join(":"));
      await page.locator('[role="option"], [role="radio"]').first().waitFor();
    } else await page.getByRole("button", { name: spec.action, exact: true }).click();
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(spec.action ? 450 : 60);
}
export async function partBox(page, part) {
  let locator = part.target.startsWith("text=")
    ? page.getByText(part.target.slice(5), { exact: true })
    : page.locator(part.target.replace(/^thumb=/, ""));
  const candidates = await locator.all();
  for (const candidate of candidates) {
    if (!(await candidate.isVisible())) continue;
    const box = part.target.startsWith("thumb=") ? await candidate.evaluate(element => {
      const visualThumb = element.closest(".kjun-slider-thumb") || (element.getAttribute("role") === "slider" ? element.firstElementChild : null);
      const rect = (visualThumb || element).getBoundingClientRect();
      if (visualThumb || element.tagName !== "INPUT") return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      // Vue uses the real browser range thumb (20px from extensions.css).
      const ratio = (Number(element.value) - Number(element.min)) / (Number(element.max) - Number(element.min));
      return { x: rect.x + (rect.width - 20) * ratio, y: rect.y + (rect.height - 20) / 2, width: 20, height: 20 };
    }) : await candidate.boundingBox();
    if (box && box.width > 0 && box.height > 0) return box;
  }
  throw Error(`Anatomy target not visible: ${part.label} (${part.target})`);
}
