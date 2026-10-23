import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// React Native (0.86+) defines a global HTMLElement for its own host elements. They pass `instanceof HTMLElement`
// but have no matches, closest or querySelector, so layer focus code must check for the methods it calls.
async function load(entry) {
  const output = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node',
    define: { 'process.env.NODE_ENV': '"production"' } });
  return import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));
}

function withGlobalHTMLElement(Element, run) {
  const previous = globalThis.HTMLElement;
  globalThis.HTMLElement = Element;
  try { return run(); } finally {
    if (previous === undefined) delete globalThis.HTMLElement; else globalThis.HTMLElement = previous;
  }
}

class NativeElement { isConnected = true; focus() {} }

test('layer focus helpers accept React Native host elements that look like HTMLElement', async () => {
  const { focusTrigger, isRestorableFocus } = await load('shared/package-runtime/use-layer.tsx');
  withGlobalHTMLElement(NativeElement, () => {
    const trigger = new NativeElement();
    assert.equal(focusTrigger(trigger), trigger);
    assert.equal(isRestorableFocus(trigger), true);
  });
});

test('layer focus helpers keep the DOM behaviour for web elements', async () => {
  const { focusTrigger, isRestorableFocus } = await load('shared/package-runtime/use-layer.tsx');
  class WebElement {
    constructor(own = false, inert = false) { this.own = own; this.inert = inert; this.isConnected = true; }
    matches() { return this.own; }
    querySelector() { return this.child ?? null; }
    closest(selector) { return selector === '[inert]' && this.inert ? this : null; }
    focus() {}
  }
  withGlobalHTMLElement(WebElement, () => {
    const wrapper = new WebElement(), button = new WebElement(true);
    wrapper.child = button;
    assert.equal(focusTrigger(wrapper), button);
    assert.equal(focusTrigger(button), button);
    assert.equal(isRestorableFocus(new WebElement(true, true)), false);
    assert.equal(isRestorableFocus(button), true);
  });
});
