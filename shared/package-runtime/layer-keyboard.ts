import { isComposingKey } from '@kjun/tokens';
import type { LayerEntry, LayerState } from './layer-state';

/** Editors consume Escape first; only the layer present at keydown may dismiss. */
export function installLayerKeyboard(document: Document, state: LayerState, keyupFallback = false) {
  type EscapePress = { event: KeyboardEvent; owner: LayerEntry; handled: boolean; ignored: boolean };
  const owners = new WeakMap<KeyboardEvent, EscapePress>();
  const keyups = new WeakMap<KeyboardEvent, EscapePress | undefined>();
  let composing = false, pending: EscapePress | undefined;
  const startComposition = () => { composing = true; };
  const endComposition = () => { composing = false; };
  const captureKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    const top = state.top();
    pending = undefined;
    if (!top) return;
    pending = { event, owner: top, handled: false, ignored: event.repeat || composing || isComposingKey(event) };
    owners.set(event, pending);
    // Do not let overlay libraries interpret composition or auto-repeat as dismissal.
    if (pending.ignored) event.stopImmediatePropagation();
  };
  const dismiss = (press: EscapePress) => {
    // A child handler may already have closed or replaced this layer synchronously.
    if (state.entries.get(press.owner.id) === press.owner) state.requestClose(press.owner.id);
  };
  const keydown = (event: KeyboardEvent) => {
    const press = owners.get(event);
    if (!press) return;
    press.handled = true;
    event.stopImmediatePropagation();
    if (event.defaultPrevented) return;
    event.preventDefault();
    dismiss(press);
  };
  const captureKeyup = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    if (pending || state.top()) keyups.set(event, pending);
    pending = undefined;
  };
  const keyup = (event: KeyboardEvent) => {
    // Let the editor finish its keyup first, then prevent RN Web's second dismissal.
    if (!keyups.has(event)) return;
    event.stopImmediatePropagation();
    const press = keyups.get(event);
    // RN Web TextInput stops every keydown. Its unconsumed Escape can dismiss on
    // keyup, after the editor has handled both events, using the original owner.
    if (keyupFallback && press && !press.handled && !press.ignored &&
        !press.event.defaultPrevented && !event.defaultPrevented) {
      event.preventDefault();
      dismiss(press);
    }
  };
  document.addEventListener('compositionstart', startComposition, true);
  document.addEventListener('compositionend', endComposition, true);
  document.addEventListener('blur', endComposition, true);
  document.addEventListener('keydown', captureKeydown, true);
  document.addEventListener('keydown', keydown);
  document.addEventListener('keyup', captureKeyup, true);
  document.addEventListener('keyup', keyup);
  return () => {
    document.removeEventListener('compositionstart', startComposition, true);
    document.removeEventListener('compositionend', endComposition, true);
    document.removeEventListener('blur', endComposition, true);
    document.removeEventListener('keydown', captureKeydown, true);
    document.removeEventListener('keydown', keydown);
    document.removeEventListener('keyup', captureKeyup, true);
    document.removeEventListener('keyup', keyup);
  };
}
