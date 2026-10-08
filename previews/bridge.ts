import { applyDemoColors } from "../shared/demo-colors";
import { defaultConfig, parseConfig, type DemoConfig } from "../shared/demo-config";
export function connectDemo(render: (c: DemoConfig) => void) {
  const params = new URLSearchParams(location.search);
  const config = parseConfig({
    ...defaultConfig,
    component: params.get("component") || "button",
    palette: params.get("palette") || "default",
  });
  applyDemoColors(config.palette);
  render(config);
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    if (event.data?.type === "kjun:request-ready") {
      window.parent.postMessage({ type: "kjun:ready" }, location.origin);
      return;
    }
    if (event.data?.type !== "kjun:configure") return;
    try {
      const next = parseConfig(event.data.config);
      applyDemoColors(next.palette);
      render(next);
    } catch {
      window.parent.postMessage(
        { type: "kjun:error", message: "올바르지 않은 예제 설정입니다." },
        location.origin,
      );
    }
  });
  window.parent.postMessage({ type: "kjun:ready" }, location.origin);
}
