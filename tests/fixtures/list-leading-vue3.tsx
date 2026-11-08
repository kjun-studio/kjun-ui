import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
const sizes: K.ListLeadingSize[] = ['xs', 'sm', 'md', 'lg'];
const iconColor = '#2456a8', iconBackground = '#e0eafa';
const state = reactive({ clicks: 0, checked: false, styled: true });
createApp(defineComponent(() => () => <K.KjunProvider>
  <div style={{ padding: '16px', width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}>
    <button onClick={() => { state.styled = !state.styled; }}>Change icon options</button>
    <K.KjunListSection title="Leading examples">{{ default: () => [
      <K.KjunListRow title="Legacy icon" icon="bell" />,
      <K.KjunListRow title="Color only" icon="bell" iconColor={iconColor} />,
      <K.KjunListRow title="Background default" icon="bell" iconBackground={iconBackground} />,
      ...sizes.map(leadingSize => <K.KjunListRow key={leadingSize} title={`Circle ${leadingSize}`} icon="bell" leadingSize={leadingSize} iconColor={iconColor} iconBackground={iconBackground} />),
      <K.KjunListRow title="Sized plain" icon="bell" leadingSize="lg" />,
      <K.KjunListRow title="Danger default" icon="trash" destructive />,
      <K.KjunListRow title="Danger override" icon="trash" destructive iconColor={iconColor} iconBackground={iconBackground} />,
      <K.KjunListRow title="Custom default" icon="bell" iconColor={iconColor} iconBackground={iconBackground}>{{ leading: () => <K.KjunAvatar name="A" size="sm" /> }}</K.KjunListRow>,
      <K.KjunListRow title="Custom xs" icon="bell" leadingSize="xs" iconColor={iconColor} iconBackground={iconBackground}>{{ leading: () => <K.KjunAvatar name="A" size="xs" /> }}</K.KjunListRow>,
      <K.KjunListRow title="Custom lg" icon="bell" leadingSize="lg" iconColor={iconColor} iconBackground={iconBackground} description="Custom content keeps its size.">{{ leading: () => <K.KjunAvatar name="A" size="sm" /> }}</K.KjunListRow>,
      <K.KjunListRow title="No leading" leadingSize="lg" iconColor={iconColor} iconBackground={iconBackground} />,
      <K.KjunListRow title="Long description" icon="bell" leadingSize="lg" iconBackground={iconBackground} description={'설명이 여러 줄로 이어져도 큰 원형 배경은 잘리지 않고 제목 가까이에 놓입니다. '.repeat(4)} />,
      <K.KjunListRow title="Dynamic icon" icon="bell" leadingSize={state.styled ? 'lg' : undefined} iconColor={state.styled ? iconColor : undefined} iconBackground={state.styled ? iconBackground : undefined} />,
      <K.KjunListRow title="Circle action" icon="bell" leadingSize="xs" iconBackground={iconBackground} chevron onClick={() => { state.clicks++; }} />,
      <K.KjunListRow title="Disabled circle" icon="bell" leadingSize="lg" iconColor={iconColor} iconBackground={iconBackground} disabled onClick={() => { state.clicks++; }} />,
      <K.KjunListRow title="Circle switch" icon="bell" iconBackground={iconBackground} checked={state.checked} onUpdate:checked={(value: boolean) => { state.checked = value; }} />,
      <K.KjunListRow title="Nested parent" icon="bell" leadingSize="lg">{{ default: () => <K.KjunListSection ariaLabel="Nested rows">{{ default: () => <K.KjunListRow title="Nested default" icon="bell" /> }}</K.KjunListSection> }}</K.KjunListRow>,
    ] }}</K.KjunListSection>
    <output data-testid="leading-state">{JSON.stringify({ clicks: state.clicks, checked: state.checked })}</output>
  </div>
</K.KjunProvider>)).mount('#root');
