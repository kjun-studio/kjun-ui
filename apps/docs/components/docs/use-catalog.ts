"use client";
import { useEffect, useId, useRef, useState } from 'react';
import { exampleDefinition, presetConfig, type Settings, type Values } from '../../../../shared/example-registry';
import type { PaletteName, PlatformName } from '../../../../shared/demo-config';
import type { ExampleSources } from '../../../../shared/example-code';
import { useDocsPlatform } from './docs-platform';
// Defined in vite.config.ts: 15000 by default, raised for docs test builds.
declare const __KJUN_PREVIEW_READY_MS__: number;
export interface PreviewSnapshot { settings: Settings; values: Values; height: number }
export interface PreviewEvent { id: number; name: string; phase: string; value: unknown }
export function useCatalog(name: string, platform: PlatformName, initialPalette: PaletteName, overrides: Settings = {}, initialValues: Values = {}, compact = false, adaptive = false) {
  const session = useId(), frame = useRef<HTMLIFrameElement>(null);
  const definition = exampleDefinition(name);
  const { selectPlatform } = useDocsPlatform();
  const [appliedPlatform, setAppliedPlatform] = useState(platform);
  const [preset, setPreset] = useState('default');
  // The iframe first renders its default config at reset 0. Remount once when
  // the document config arrives so scenario initialValues always take effect.
  const [config, setConfig] = useState(() => ({ ...presetConfig(name), settings: { ...definition.defaults, ...overrides }, values: initialValues, palette: initialPalette, compact, adaptive, reset: 1, revision: 1 }));
  const [snapshot, setSnapshot] = useState<PreviewSnapshot>({ settings: config.settings, values: config.values, height: adaptive ? 176 : definition.minHeight });
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false), [reload, setReload] = useState(0);
  const [events, setEvents] = useState<PreviewEvent[]>([]), [sources, setSources] = useState<ExampleSources | null>(null);
  const [narrow, setNarrow] = useState(false), [wide, setWide] = useState(false);
  const current = useRef({ config, snapshot, platform, ready });
  current.current = { config, snapshot, platform, ready };
  const post = (type: string, data: object = {}) => frame.current?.contentWindow?.postMessage({ type, ...data }, location.origin);
  const send = () => post('kjun:catalog-configure', { config: { ...current.current.config, session } });
  // Adjust the local example before React commits a different platform to the screen.
  if (appliedPlatform !== platform) { setAppliedPlatform(platform); reset(); }
  useEffect(() => {
    const controller = new AbortController();
    fetch('/previews/sources/' + encodeURIComponent(name) + '.json', { signal: controller.signal }).then(response => {
      if (!response.ok) throw Error('예제 소스를 불러오지 못했습니다.');
      return response.json() as Promise<ExampleSources>;
    }).then(setSources).catch(() => {});
    return () => controller.abort();
  }, [name, reload]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (data?.component !== name || data.session !== session || data.platform !== current.current.platform || data.revision !== current.current.config.revision) return;
      if (data.type === 'kjun:catalog-snapshot') {
        if (!compact && data.values?.open && !current.current.snapshot.values.open) frame.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
        setSnapshot({ settings: data.settings, values: data.values, height: data.height }); setReady(true); setFailed(false);
      }
      if (data.type === 'kjun:catalog-height') setSnapshot(value => ({ ...value, height: data.height }));
      if (data.type === 'kjun:catalog-event') {
        if (['confirm', 'prompt'].includes(data.event.name) && data.event.phase === '호출') frame.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
        setEvents(items => [...items, data.event].slice(-100));
      }
      if (data.type === 'kjun:catalog-error') { setReady(false); setFailed(true); }
      if (data.type === 'kjun:catalog-escape') expand(false);

    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [name, session]);
  useEffect(() => {
    setReady(false); setFailed(false);
    send();
    const interval = setInterval(() => { if (current.current.ready) clearInterval(interval); else post('kjun:catalog-request-ready'); }, 300);
    const timer = setTimeout(() => { clearInterval(interval); setReady(value => { if (!value) setFailed(true); return value; }); }, __KJUN_PREVIEW_READY_MS__);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [config.revision, platform, reload, wide]);
  function changeSettings(key: string, value: string | number | boolean) {
    setConfig(previous => {
      const settings = { ...previous.settings, [key]: value };
      let values = current.current.snapshot.values, reset = previous.reset;
      if (['DsSlider', 'DsRangeSlider', 'DsTimePicker', 'DsQuantityStepper'].includes(name) && ['decimal', 'precision', 'minuteStep', 'secondStep', 'bounded', 'negative'].includes(key)) { values = {}; reset++; }
      if (name === 'GuideAppScreen' && key === 'keyboardVisible') { values = { ...values, keyboard: value }; reset++; }
      if (key === 'multiple') { values = { ...values, select: value ? [] : null, selectOpen: false }; reset++; }
      if (key === 'queryState') { values = {}; reset++; }
      const localKey = name === 'GuideAssetList' && key === 'status' ? 'status' : name === 'GuideSettingsForm' && key === 'validation' ? 'invalid' : null;
      if (localKey) { values = Object.fromEntries(Object.entries(values).filter(([key]) => key !== localKey)); reset++; }
      return { ...previous, settings, values, reset, revision: previous.revision + 1 };
    });
  }
  function restart(settings: Settings, values: Values, palette = current.current.config.palette) {
    const previous = current.current.config;
    setReady(false); setFailed(false); setEvents([]);
    setSnapshot({ settings, values, height: adaptive ? 176 : definition.minHeight });
    setConfig({ ...previous, settings, values, palette, reset: previous.reset + 1, revision: previous.revision + 1 });
  }
  function reset(nextPreset = preset) {
    const next = presetConfig(name, nextPreset);
    setPreset(nextPreset); setNarrow(next.narrow);
    restart({ ...next.settings, ...overrides }, { ...next.values, ...initialValues });
  }
  function expand(value: boolean) {
    setConfig(previous => ({ ...previous, values: current.current.snapshot.values, reset: previous.reset + 1, revision: previous.revision + 1 }));
    setWide(value);
  }
  return { session, frame, definition, platform, preset, config, snapshot, ready, failed, reload, sources, events,
    presetSettings: { ...presetConfig(name, preset).settings, ...overrides },
    narrow, wide, setNarrow, expand, send, reset, changeSettings,
    interact: (action: string) => post("kjun:catalog-interact", { action, component: name, platform, session, revision: current.current.config.revision }),
    clearEvents: () => setEvents([]), retry: () => { setConfig(previous => ({ ...previous, values: current.current.snapshot.values, reset: previous.reset + 1, revision: previous.revision + 1 })); setReload(value => value + 1); },
    palette: (palette: PaletteName) => setConfig(previous => ({ ...previous, palette, revision: previous.revision + 1 })),
    configure: (nextPlatform: PlatformName, settings: Settings, palette: PaletteName) => {
      setAppliedPlatform(nextPlatform); selectPlatform(nextPlatform);
      restart(settings, {}, palette);
    },
  };
}
