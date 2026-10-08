// Only the documentation layout inside the preview changes. Packed components keep their styles.
export function styleMotionPreview(document: Document, scenario: string) {
  document.documentElement.dataset.motionExample = scenario;
  const style = document.createElement('style');
  style.textContent = `
    html, body { background: transparent; }
    .catalog-root { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: transparent; }
    .catalog-root > * { width: 100%; max-width: 400px; }
    .catalog-example { width: 100%; margin: 0; }
    .catalog-example > output:empty { display: none; }
    .catalog-group { justify-content: center; }
    html[data-motion-example="motion-modal"] .catalog-stack,
    html[data-motion-example="motion-drawer"] .catalog-stack,
    html[data-motion-example="motion-number"] .catalog-stack { align-items: center; }
    [data-testid="DsModal"] > div, [data-testid="DsDrawer"] > div,
    [data-testid="GuideMotionNumber"] > div { align-items: center; }
    [data-testid="GuideMotionToast"] > div { justify-content: center; }
    /* Tabs are narrower than the example column; size to them so the list sits on the stage centre. */
    html[data-motion-example="motion-tabs"] .catalog-root > * { width: auto; }
    html[data-motion-example="motion-accordion"] .catalog-root { align-items: flex-start; padding-top: 96px; }
    html[data-motion-example="motion-toast"] .catalog-root { align-items: flex-end; padding-bottom: 28px; }
    @media (max-width: 400px) { .catalog-root { padding-inline: 16px; } }
    /* Native feedback is positioned inside its provider, so give that preview a full screen. */
    .catalog-root:has([data-testid="GuideMotionToast"]) { padding: 0; }
    .catalog-render:has([data-testid="GuideMotionToast"]) > div { min-height: 100vh; }
    .catalog-render:has([data-testid="GuideMotionToast"]) > div > div { flex: 1; justify-content: flex-end; padding: 28px 16px; }
  `;
  document.head.appendChild(style);
}

type PreviewClock = { rate: number; realBase: number; virtualBase: number; now: () => number; realNow: () => number };
type ClockWindow = Window & typeof globalThis & { __kjunClock?: PreviewClock };

// Slow motion for every preview runtime: CSS and WAAPI follow playbackRate, while
// scripted motion (React Native Web Animated, number interpolation) reads the scaled clock.
export function setPreviewClock(win: Window, rate: number) {
  const view = win as ClockWindow;
  if (!view.__kjunClock) {
    if (rate === 1) return;
    const realNow = view.performance.now.bind(view.performance), realDate = view.Date.now.bind(view.Date);
    const raf = view.requestAnimationFrame.bind(view), animate = view.Element.prototype.animate;
    const offset = realDate() - realNow();
    const clock: PreviewClock = { rate: 1, realBase: realNow(), virtualBase: realNow(), realNow,
      now: () => clock.virtualBase + (realNow() - clock.realBase) * clock.rate };
    view.performance.now = clock.now;
    view.Date.now = () => Math.round(clock.now() + offset);
    view.requestAnimationFrame = callback => raf(() => callback(clock.now()));
    view.Element.prototype.animate = function (this: Element, ...args: Parameters<Element["animate"]>) {
      const animation = animate.apply(this, args); animation.playbackRate = clock.rate; return animation;
    };
    const follow = () => { for (const animation of view.document.getAnimations()) animation.playbackRate = clock.rate; };
    view.document.addEventListener('transitionrun', follow, true);
    view.document.addEventListener('animationstart', follow, true);
    view.__kjunClock = clock;
  }
  const clock = view.__kjunClock;
  clock.virtualBase = clock.now(); clock.realBase = clock.realNow(); clock.rate = rate;
  for (const animation of view.document.getAnimations()) animation.playbackRate = rate;
}
