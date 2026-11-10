import * as Vue from 'vue';
import { compile } from '@vue/compiler-dom';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';

// Compile a consumer template: optimized dynamic props expose transitions that a TSX-only fixture misses.
const template = `<KjunProvider>
  <div style="padding:32px">
    <div data-testid="implicit"><KjunDropdown :disabled="disabled">
      <template #trigger><KjunButton>Implicit trigger</KjunButton></template>
      <KjunDropdownItem>Action</KjunDropdownItem>
    </KjunDropdown></div>
    <div data-testid="explicit"><KjunDropdown :disabled="disabled">
      <template #trigger><KjunButton :disabled="disabled">Explicit trigger</KjunButton></template>
      <KjunDropdownItem>Action</KjunDropdownItem>
    </KjunDropdown></div>
    <div data-testid="wrapped"><KjunDropdown :disabled="disabled">
      <template #trigger><KjunTooltip content="Wrapped hint"><KjunButton :disabled="disabled">Wrapped trigger</KjunButton></KjunTooltip></template>
      <KjunDropdownItem>Action</KjunDropdownItem>
    </KjunDropdown></div>
    <div data-testid="own"><KjunDropdown :disabled="disabled">
      <template #trigger><KjunButton :disabled="ownDisabled" :aria-disabled="ownDisabled ? 'true' : undefined">Own disabled trigger</KjunButton></template>
      <KjunDropdownItem>Action</KjunDropdownItem>
    </KjunDropdown></div>
    <KjunButton @click="dialog = true">Open focus window</KjunButton>
    <KjunModal :open="dialog" @update:open="dialog = $event" title="Focus window">
      <button data-testid="before">Before menu</button>
      <KjunMenuButton v-if="official" label="Focus menu" tooltip="Menu hint">
        <KjunDropdownItem @click="actions++">Run action</KjunDropdownItem>
      </KjunMenuButton>
      <KjunDropdown v-else>
        <template #trigger><KjunTooltip content="Menu hint"><KjunButton>Focus menu</KjunButton></KjunTooltip></template>
        <KjunDropdownItem @click="actions++">Run action</KjunDropdownItem>
      </KjunDropdown>
      <button data-testid="after">After menu</button>
    </KjunModal>
    <KjunDropdown v-if="mounted">
      <template #trigger><KjunButton>Removal menu</KjunButton></template>
      <KjunDropdownItem @click="actions++; mounted = false">Remove menu</KjunDropdownItem>
    </KjunDropdown>
    <output data-testid="actions">{{ actions }}</output>
    <output data-testid="config" hidden>{{ JSON.stringify({ disabled, ownDisabled }) }}</output>
  </div>
</KjunProvider>`;
const state = Vue.reactive({ disabled: false, ownDisabled: true, dialog: false, official: false, mounted: true, actions: 0 });
Object.assign(window, { configureMenuRegression: (next: object) => Object.assign(state, next) });
applyDemoColors('default');
Vue.createApp({
  components: K,
  setup: () => state,
  render: new Function('Vue', compile(template).code)(Vue),
}).mount('#root');
