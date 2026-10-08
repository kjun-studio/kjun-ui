import { loadIcon } from '../../shared/icon-data';
import type { KjunIconRegistry } from '@kjun-ui/icons';
import type { PaletteName } from "../../shared/demo-config";
import {
  exampleDefinition,
  presetConfig,
  validateSettings,
  type Settings,
  type Values,
} from "../../shared/example-registry";
import { plainValue, type ExampleObserver } from "./telemetry";
export interface CatalogConfig {
  component: string;
  compact?: boolean;
  adaptive?: boolean;
  palette: PaletteName;
  settings: Settings;
  values: Values;
  preset: string;
  revision: number;
  reset: number;
  session: string;
}
const params = new URLSearchParams(location.search);
const component = params.get("component") || "DsCard";
const platform = location.pathname.includes("native")
  ? "native"
  : location.pathname.includes("react")
    ? "react"
    : "vue2";
let config: CatalogConfig = {
  component,
  palette: "default",
  ...presetConfig(component === "all" ? "DsCard" : component),
  preset: "default",
  revision: 0,
  reset: 0,
  session: params.get("session") || "",
};
let renderer: (config: CatalogConfig) => void;
let sequence = 0;
const snapshots = new Map<string, any>(),
  observers = new Map<string, ExampleObserver>();
const send = (type: string, data: object = {}) =>
  window.parent.postMessage(
    { type, component, platform, session: config.session, revision: config.revision, ...data },
    location.origin,
  );
// Last height the parent received, from either a snapshot or a height report.
let lastHeight = 0;
function previewHeight(name: string) {
  const root =
    document.querySelector(`[data-component="${name}"]`) || document.querySelector(".catalog-root");
  const definition = exampleDefinition(name);
  let minimum = definition.minHeight;
  if (config.compact || config.adaptive) {
    const openLayer = [
      ...document.querySelectorAll(
        '[role="dialog"], [role="menu"], [role="listbox"], [role="tooltip"], [role="combobox"][aria-expanded="true"], [aria-haspopup][aria-expanded="true"]',
      ),
    ].some(
      (node) =>
        node.getBoundingClientRect().height > 0 && getComputedStyle(node).visibility !== "hidden",
    );
    minimum =
      openLayer || name === "KjunFeedbackProvider" ? Math.max(400, definition.minHeight) : 80;
  }
  return Math.min(720, Math.max(minimum, (root?.getBoundingClientRect().height || 0) + 48));
}
export function exampleObserver(name: string): ExampleObserver {
  const key = name + ":" + config.reset + ":" + config.revision;
  if (observers.has(key)) return observers.get(key)!;
  const current = config;
  const observer = {
    snapshot(values: Values) {
      requestAnimationFrame(() => {
        if (current !== config) return;
        const height = previewHeight(name);
        // The parent now holds this height; later height reports compare against it, not a stale one.
        lastHeight = height;
        const snapshot = {
          values: plainValue(values),
          settings: settingsFor(name, config),
          height,
        };
        snapshots.set(name, snapshot);
        send("kjun:catalog-snapshot", snapshot);
        send("kjun:catalog-ready");
      });
    },
    event(event: string, phase: string, value: unknown) {
      if (current !== config) return;
      send("kjun:catalog-event", {
        event: { id: ++sequence, name: event, phase, value: plainValue(value) },
      });
    },
  };
  observers.set(key, observer);
  return observer;
}
export function settingsFor(name: string, current: CatalogConfig) {
  if (current.component !== "all") return current.settings;
  const defaults = presetConfig(name).settings;
  return {
    ...defaults,
    ...Object.fromEntries(Object.entries(current.settings).filter(([key]) => key in defaults)),
  };
}
export function connectCatalog(render: (config: CatalogConfig, icons: KjunIconRegistry) => void) {
  renderer = current => {
    if (current.component !== 'GuideIconSelection') { render(current, {}); return; }
    const name = String(current.settings.name);
    loadIcon(name).then(icon => {
      if (current === config) render(current, { [name]: icon });
    }).catch(error => {
      if (current === config) send('kjun:catalog-error', { message: String(error) });
    });
  };
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    const message = event.data;
    if (message?.type === "kjun:catalog-interact") {
      if (
        message.session !== config.session ||
        message.revision !== config.revision ||
        message.component !== component ||
        message.platform !== platform
      )
        return;
      if (
        ![
          "모달 열기",
          "패널 열기",
          "하단 패널 열기",
          "메뉴 열기",
          "작업 메뉴",
          "추가 정보",
          "첫 항목",
          "Toast 표시",
          "Confirm 요청",
          "Prompt 요청",
        ].includes(message.action)
      )
        return;
      const button = [...document.querySelectorAll<HTMLElement>('button, [role="button"]')].find(
        (node) => (node.getAttribute("aria-label") || node.textContent?.trim()) === message.action,
      );
      button?.click();
      return;
    }
    if (message?.type === "kjun:catalog-request-ready") {
      if (snapshots.has(component)) send("kjun:catalog-snapshot", snapshots.get(component));
      if (snapshots.size) send("kjun:catalog-ready");
    }
    if (message?.type === "kjun:catalog-copy") {
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          send("kjun:catalog-copy-result", {
            requestId: message.requestId,
            snapshot: snapshots.get(component),
          }),
        ),
      );
    }
    if (message?.type !== "kjun:catalog-configure") return;
    try {
      const next = message.config || {};
      if (next.session != null && next.session !== config.session) return;
      if (
        next.revision != null &&
        (!Number.isInteger(next.revision) || next.revision < config.revision)
      )
        return;
      const palette = next.palette ?? config.palette;
      if (!["default", "violet", "dark"].includes(palette)) throw Error("지원하지 않는 색상");
      const legacy = Object.fromEntries(
        ["disabled", "loading", "error"]
          .filter((key) => key in next && (component === "all" || key in config.settings))
          .map((key) => [key, next[key]]),
      );
      if (Object.values(legacy).some((value) => typeof value !== "boolean"))
        throw Error("잘못된 상태 값");
      const settings =
        component === "all"
          ? { ...config.settings, ...legacy }
          : validateSettings(component, next.settings ?? { ...config.settings, ...legacy });
      const values = next.values ?? config.values;
      if (!values || typeof values !== "object" || Array.isArray(values))
        throw Error("잘못된 초기 상태");
      if (next.reset != null && (!Number.isInteger(next.reset) || next.reset < 0))
        throw Error("잘못된 초기화 값");
      config = {
        ...config,
        compact: next.compact === true,
        adaptive: next.adaptive === true,
        settings,
        values,
        palette,
        revision: next.revision ?? config.revision + 1,
        reset: next.reset ?? config.reset,
      };
      observers.clear();
      snapshots.clear();
      renderer(config);
    } catch (error) {
      send("kjun:catalog-error", { message: String(error) });
    }
  });
  document.addEventListener("focusin", () => send("kjun:catalog-focus"));
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    const layer = [
      ...document.querySelectorAll(
        '[role="dialog"], [role="menu"], [role="listbox"], [role="tooltip"]',
      ),
    ].some((node) => node.getBoundingClientRect().height > 0);
    if (!layer) send("kjun:catalog-escape");
  });
  window.addEventListener("error", (event) =>
    send("kjun:catalog-error", { message: event.message }),
  );
  const reportHeight = () => {
    if (!snapshots.has(component)) return;
    const height = previewHeight(component);
    if (height !== lastHeight) {
      lastHeight = height;
      send("kjun:catalog-height", { height });
    }
  };
  new ResizeObserver(reportHeight).observe(document.body);
  // Portals and internally owned popups can change without resizing the body.
  new MutationObserver(reportHeight).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class", "hidden", "aria-expanded"],
  });
  // Embedded icon examples wait for the parent's selected name. Loading the
  // default example first would fetch an unrelated icon on every selection.
  if (component !== 'GuideIconSelection' || window.parent === window) renderer(config);
}
