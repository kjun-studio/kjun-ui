import { tokens } from "@kjun/tokens";
import { setWindowLayerOpen } from '../layer-host.js';
const { easeOut: out, easeIn: into, easeEmphasized: emphasized, easeLinear: linear } = tokens.motion;

export function layerMotion(kind = 'popup') {
  const windowLayer = kind === 'modal' || kind === 'drawer';
  return {
    data() { return windowLayer ? { motionPresent: this.value } : {}; },
    created() { this._layerMotions = new Map(); this._layerFrames = new WeakMap(); },
    mounted() { if (windowLayer && this.value) this.syncWindowMotion(true); },
    watch: { value(open) { if (windowLayer) this.syncWindowMotion(open); } },
    beforeDestroy() { for (const cancel of this._layerMotions.values()) cancel(); },
    methods: {
      syncWindowMotion(open) {
        if (open) this.motionPresent = true;
        this.$nextTick(() => {
          if (this._isDestroyed || this.value !== open || !this.motionPresent) return;
          const el = this.$el;
          setWindowLayerOpen(el, open);
          if (open) {
            this.motionPrepare(el);
            this.runLayerMotion(el, true, () => {});
          } else this.motionLeave(el, () => {
            if (this.value || this._isDestroyed) return;
            this.motionPresent = false;
            this.releaseMotionLayer();
          });
        });
      },
      motionPrepare(el) { el.inert = false; el.removeAttribute('aria-hidden'); },
      motionCancel(el) { this._layerMotions.get(el)?.(); },
      motionEnter(el, done) {
        // Placement watchers measure the inserted panel in the same Vue tick.
        this.$nextTick(() => { if (!this._isDestroyed && !el.inert) this.runLayerMotion(el, true, done); });
      },
      motionLeave(el, done) { el.inert = true; el.setAttribute('aria-hidden', 'true'); this.runLayerMotion(el, false, done); },
      releaseMotionLayer() {
        if (this.value) return; // An interrupted exit belongs to the reopened window.
        this._kjunReturnTarget = null;
        this.focusTrap?.deactivate(false); this.scrollLock?.release();
      },
      runLayerMotion(el, open, done) {
        this.motionCancel(el);
        const saved = this._layerFrames.get(el);
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const large = kind === 'modal' || kind === 'drawer';
        const preset = kind === 'tooltip' ? 'tooltip' : kind === 'toast' ? 'toast' : large ? 'layer' : 'popup';
        const duration = tokens.motion[preset + (open ? 'Enter' : 'Exit')];
        const panel = large ? el.querySelector(kind === 'modal' ? '.ds-modal-container' : '.ds-drawer-panel') : el;
        // Opacity fades linearly on exit and ends before the movement, so the layer never stalls and then cuts.
        const fade = open ? (large ? tokens.motion.backdrop : duration) : (large ? tokens.motion.backdropExit : Math.min(duration, tokens.motion.fadeExit));
        // Drawer fades only its scrim; the edge panel stays opaque while it travels.
        const faded = (kind === 'drawer' && el.querySelector('.ds-drawer-scrim')) || el;
        const targets = [{ node: faded, property: 'opacity', from: saved?.opacity ?? (open ? '0' : getComputedStyle(faded).opacity), to: open ? '1' : '0', duration: fade, easing: open ? out : linear }];
        if (panel && kind !== 'tooltip') {
          const distance = tokens.motionDistance;
          let closed = kind === 'modal' ? `0 ${open ? distance.modalEnter : distance.modalExit}px` : kind === 'toast' ? `0 ${-distance.toast}px` : `0 ${-distance.popup}px`;
          if (kind === 'drawer') {
            closed = { left: '-100% 0', right: '100% 0', top: '0 -100%', bottom: '0 100%' }[this.position] || '100% 0';
          } else if (kind === 'popup') {
            closed = { top: `0 ${distance.popup}px`, bottom: `0 ${-distance.popup}px`, left: `${distance.popup}px 0`, right: `${-distance.popup}px 0` }[el.dataset.motionPlacement] || `0 ${-distance.popup}px`;
          }
          targets.push({ node: panel, property: 'translate', from: saved?.translate ?? (open ? closed : getComputedStyle(panel).translate), to: open ? '0 0' : closed, duration,
            easing: open ? (kind === 'drawer' ? emphasized : out) : into });
        }
        let disposed = false;
        const animations = [];
        const cleanup = () => { disposed = true; for (const animation of animations) animation.cancel(); media.removeEventListener('change', preference); this._layerMotions.delete(el); };
        const finish = () => { if (disposed) return; cleanup(); this._layerFrames.delete(el); done(); };
        const preference = () => { if (media.matches) finish(); };
        if (media.matches) { finish(); return; }
        for (const target of targets) animations.push(target.node.animate([
          { [target.property]: target.from }, { [target.property]: target.to },
        ], { duration: target.duration, easing: target.easing, fill: 'both' }));
        let remaining = animations.length;
        for (const animation of animations) animation.onfinish = () => { if (--remaining === 0) finish(); };
        this._layerMotions.set(el, () => {
          this._layerFrames.set(el, Object.fromEntries(targets.map(target => [target.property, getComputedStyle(target.node)[target.property]])));
          cleanup();
        });
        media.addEventListener('change', preference);
      },
    },
  };
}
