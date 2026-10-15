import { createApp, defineComponent, h, provide, resolveComponent } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors, cssColorName, demoDomainPalettes } from '../../shared/demo-colors';
applyDemoColors('default');
// SignedValue draws price colors, which the app supplies like any other domain color.
for (const [role, value] of Object.entries(demoDomainPalettes.default)) document.documentElement.style.setProperty(cssColorName(role), value as string);

// An app that already uses names KJUN once shared: instance helpers, a global toast and provide keys.
const record = window as unknown as { warnings: string[]; errors: string[]; appToast: string[]; boundary: string[]; outer: string[]; escapes: number };
record.warnings = []; record.errors = []; record.appToast = []; record.boundary = []; record.outer = []; record.escapes = 0;
document.addEventListener('keydown', event => { if (event.key === 'Escape') record.escapes++; });

const AppScope = defineComponent((_, { slots }) => {
  for (const [key, value] of Object.entries({
    dropdown: { app: true }, radioGroup: { app: true, value: 'b', name: 'app' }, tabsContainer: { app: true }, tabs: { app: true },
    accordion: { app: true }, field: { app: true }, dsFormGroup: { app: true, inputId: 'app-input', hintId: 'app-hint', errorId: 'app-error' },
  })) provide(key, value);
  return () => <div>{slots.default?.()}</div>;
});
const Thrower = defineComponent(() => () => { throw new Error('child failed'); });
const subtree = () => [
  <K.KjunSignedValue value={0.12} />,
  <K.KjunAnimatedNumber value={1234} animated={false} />,
  <K.KjunRadio val="a" modelValue="a" label="라디오" />,
  <K.KjunInput modelValue="값" ariaLabel="입력" />,
];
const Root = defineComponent(() => () => (
  <K.KjunProvider><K.KjunFeedbackProvider>
    <div data-testid="reference">{subtree()}</div>
    <AppScope><div data-testid="app-scope">{subtree()}</div></AppScope>
    <div data-testid="app-button">{h(resolveComponent('DsButton'))}{h(resolveComponent('KjunButton'), null, { default: () => '저장' })}</div>
    <div data-testid="copy"><K.KjunCopyButton value="복사할 값" /></div>
    <div data-testid="boundary">
      {/* A page-level boundary around a widget-level one: only the nearest boundary takes the error. */}
      <K.KjunErrorBoundary onError={(error: unknown) => record.outer.push((error as Error).message)}>
        <p>바깥 콘텐츠</p>
        <K.KjunErrorBoundary onError={(error: unknown) => record.boundary.push((error as Error).message)}><Thrower /></K.KjunErrorBoundary>
      </K.KjunErrorBoundary>
    </div>
  </K.KjunFeedbackProvider></K.KjunProvider>
));
const app = createApp(Root);
app.config.warnHandler = message => { record.warnings.push(message); };
app.config.errorHandler = error => { record.errors.push(String((error as Error).message)); };
for (const name of ['Number', 'Percent', 'Date', 'RelativeTime', 'Price', 'KRW', 'BigKRW', 'Compact']) app.config.globalProperties['$format' + name] = () => 'APP';
app.config.globalProperties.$toast = { success: () => record.appToast.push('success'), error: () => record.appToast.push('error'), info: () => record.appToast.push('info') };
// The app keeps its own DsButton; installing KJUN's plugin neither warns nor replaces it.
app.component('DsButton', defineComponent(() => () => <button type="button">APP-DS</button>));
app.use(K.default);
app.mount('#root');
