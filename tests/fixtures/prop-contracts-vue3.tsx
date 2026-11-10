import * as Vue from 'vue';
import { compile } from '@vue/compiler-dom';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';

const state = Vue.reactive({
  label: 'Favorite', referenced: 'Watch item', tooltip: undefined as string | undefined,
  disabled: false, loading: false, unnamed: false, invalid: false,
  input: null as string | number | null, textarea: null as string | null, date: null as string | null,
  events: [] as unknown[], warnings: [] as string[],
});
const template = `<KjunProvider><div style="padding:32px">
  <KjunIconToggle data-testid="attribute" :aria-label="label" active-icon="star" :tooltip="tooltip" :tooltip-delay="0"
    :disabled="disabled" :loading="loading" class="consumer-toggle" style="margin:2px" @toggle="events.push(['toggle'])" @click="events.push(['click'])" />
  <KjunIconToggle data-testid="alias" v-bind="{ ariaLabel: label }" active-icon="heart" :tooltip-delay="0" />
  <KjunIconToggle data-testid="reference" aria-labelledby="toggle-label" aria-label="Fallback" active-icon="star" :tooltip-delay="0" />
  <span id="toggle-label">{{ referenced }}</span>
  <KjunIconToggle v-if="unnamed" data-testid="unnamed" active-icon="star" />
  <div data-testid="input"><KjunInput :model-value="input" aria-label="Amount" clearable
    @update:model-value="input = $event; events.push(['input', $event])" /></div>
  <KjunTextarea :model-value="textarea" aria-label="Message" show-count :max-length="20" submit-label="Send"
    @update:model-value="textarea = $event; events.push(['textarea', $event])" @submit="events.push(['submit', $event])" />
  <form id="date-form"><KjunDatePicker :model-value="date" aria-label="Date" name="date" clearable
    min="2026-09-01" max="2026-09-30" @update:model-value="date = $event; events.push(['date', $event])"
    @change="events.push(['change', $event])" /></form>
  <KjunButton data-testid="validated" :variant="invalid ? 'invalid-variant' : 'secondary'">Validated</KjunButton>
  <output data-testid="state">{{ JSON.stringify({ input, textarea, date }) }}</output>
  <output data-testid="events">{{ JSON.stringify(events) }}</output>
</div></KjunProvider>`;
Object.assign(window, {
  configurePropContract: (next: object) => Object.assign(state, next),
  propContractWarnings: state.warnings,
  propContractValues: K.kjunPropValues,
});
applyDemoColors('default');
// Match Vue's full build: runtime-compiled templates need its proxy for JavaScript globals.
Vue.registerRuntimeCompiler((source, options) => {
  const render = new Function('Vue', compile(source as string, options).code)(Vue);
  render._rc = true;
  return render;
});
const app = Vue.createApp({ components: K, setup: () => state, template });
app.config.warnHandler = message => state.warnings.push(message);
app.mount('#root');
