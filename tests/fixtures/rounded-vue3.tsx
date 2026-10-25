import { createApp, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// Same sections and DOM as rounded-cases.tsx (React/Native).
const tip = ref<string | null>(null);
const anchored = ref(false), point = ref({ x: 80, y: 1500 });
const followed = ref(false), palette = ref(false);
let live: { x: number; y: number } | null = { x: 600, y: 1500 };
createApp(() => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', width: '420px' }}>
  <div data-testid="cards"><K.KjunProvider>
    <K.KjunCard radius="xl" title="XL card"><K.KjunText>XL body</K.KjunText></K.KjunCard>
    <K.KjunCard radius="lg" title="LG card"><K.KjunText>LG body</K.KjunText></K.KjunCard>
  </K.KjunProvider></div>
  <div data-testid="lists"><K.KjunProvider>
    <K.KjunText>Lists start</K.KjunText>
    <K.KjunListSection title="Rounded" radius="xl">
      <K.KjunListRow title="First row" onClick={() => {}} />
      <K.KjunListRow title="Second row" />
    </K.KjunListSection>
    <K.KjunListSection title="Square">
      <K.KjunListRow title="Square row" onClick={() => {}} />
    </K.KjunListSection>
  </K.KjunProvider></div>
  <div data-testid="tooltips" style={{ paddingTop: '120px' }}><K.KjunProvider>
    <K.KjunButton onClick={() => { tip.value = 'path'; }}>show path</K.KjunButton>
    <K.KjunButton onClick={() => { tip.value = 'title'; }}>show title</K.KjunButton>
    <K.KjunButton onClick={() => { tip.value = 'empty'; }}>show empty</K.KjunButton>
    <K.KjunTooltip open={tip.value === 'path'} title="File path" content='/Users/me/projects/kjun/packages/react/src/components/very-long-file-name.tsx' width="sm" align="center"><K.KjunButton>Path trigger</K.KjunButton></K.KjunTooltip>
    <K.KjunTooltip open={tip.value === 'title'} title="Only title"><K.KjunButton>Title trigger</K.KjunButton></K.KjunTooltip>
    <K.KjunTooltip open={tip.value === 'empty'}><K.KjunButton>Empty trigger</K.KjunButton></K.KjunTooltip>
  </K.KjunProvider></div>
  <div data-testid="anchor"><K.KjunProvider>
    <K.KjunButton onClick={() => { anchored.value = true; }}>open anchored</K.KjunButton>
    <K.KjunButton onClick={() => { followed.value = true; }}>open followed</K.KjunButton>
    <K.KjunPopover open={anchored.value} onUpdate:open={(v: boolean) => { anchored.value = v; }} manualTrigger modal={false} ariaLabel="Suggestions" anchorRect={point.value}>
      {{ trigger: () => <div><textarea aria-label="Editor" /><button type="button" onClick={() => { point.value = { ...point.value, x: point.value.x + 200 }; }}>move anchor</button></div>,
         default: () => <K.KjunText>Suggestion list</K.KjunText> }}
    </K.KjunPopover>
    <K.KjunPopover open={followed.value} onUpdate:open={(v: boolean) => { followed.value = v; }} manualTrigger modal={false} ariaLabel="Followed" anchorRect={() => live}>
      {{ trigger: () => <button type="button" onClick={() => { live = null; }}>lose anchor</button>,
         default: () => <K.KjunText>Followed list</K.KjunText> }}
    </K.KjunPopover>
    <K.KjunButton onClick={() => { palette.value = true; }}>open palette</K.KjunButton>
    <K.KjunPopover open={palette.value} onUpdate:open={(v: boolean) => { palette.value = v; }} focusOnOpen ariaLabel="Palette" anchorRect={{ x: 300, y: 1500 }}>
      {{ default: () => <K.KjunText>Palette body</K.KjunText> }}
    </K.KjunPopover>
    <K.KjunPopover ariaLabel="Toggle palette" anchorRect={{ x: 500, y: 1500 }}>
      {{ trigger: () => <K.KjunButton>palette trigger</K.KjunButton>, default: () => <K.KjunText>Toggle body</K.KjunText> }}
    </K.KjunPopover>
  </K.KjunProvider></div>
  <div data-testid="filters">
    <K.KjunProvider>
      <K.KjunFilterGroup ariaLabel="Default filters" modelValue="all" options={[{ value: 'all', label: 'All' }, { value: 'up', label: 'Up' }]} />
    </K.KjunProvider>
    <div style={{ '--kjun-filter-selected-bg': 'rgb(10, 20, 200)', '--kjun-filter-selected-text': 'rgb(250, 250, 10)' }}>
      <K.KjunProvider>
        <K.KjunFilterGroup ariaLabel="Brand filters" modelValue="all" options={[{ value: 'all', label: 'Every' }, { value: 'up', label: 'Rising' }]} />
      </K.KjunProvider>
    </div>
  </div>
</div>).mount('#root');
