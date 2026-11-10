import { useState } from 'react';
import type { ListLeadingSize } from '@kjun-ui/react';

export function ListLeadingCases({ K, native = false }: { K: any; native?: boolean }) {
  const [clicks, setClicks] = useState(0), [checked, setChecked] = useState(false), [styled, setStyled] = useState(true);
  const press = { [native ? 'onPress' : 'onClick']: () => setClicks(value => value + 1) };
  const sizes: ListLeadingSize[] = ['xs', 'sm', 'md', 'lg'];
  const iconColor = '#2456a8', iconBackground = '#e0eafa';
  const custom = { icon: 'bell', iconColor, iconBackground };
  return <div style={{ padding: 16, width: '100%', maxWidth: 400, boxSizing: 'border-box' }}>
    <button onClick={() => setStyled(value => !value)}>Change icon options</button>
    <K.KjunListSection title="Leading examples">
      <K.KjunListRow title="Legacy icon" icon="bell" />
      <K.KjunListRow title="Color only" icon="bell" iconColor={iconColor} />
      <K.KjunListRow title="Background default" icon="bell" iconBackground={iconBackground} />
      {sizes.map(leadingSize => <K.KjunListRow key={leadingSize} title={`Circle ${leadingSize}`} icon="bell" leadingSize={leadingSize} iconColor={iconColor} iconBackground={iconBackground} />)}
      <K.KjunListRow title="Sized plain" icon="bell" leadingSize="lg" />
      <K.KjunListRow title="Danger default" icon="trash" destructive />
      <K.KjunListRow title="Danger override" icon="trash" destructive iconColor={iconColor} iconBackground={iconBackground} />
      <K.KjunListRow title="Custom default" {...custom} leading={<K.KjunAvatar name="A" size="sm" />} />
      <K.KjunListRow title="Custom xs" {...custom} leadingSize="xs" leading={<K.KjunAvatar name="A" size="xs" />} />
      <K.KjunListRow title="Custom lg" {...custom} leadingSize="lg" description="Custom content keeps its size." leading={<K.KjunAvatar name="A" size="sm" />} />
      <K.KjunListRow title="No leading" leadingSize="lg" iconColor={iconColor} iconBackground={iconBackground} />
      <K.KjunListRow title="Long description" icon="bell" leadingSize="lg" iconBackground={iconBackground} description={'설명이 여러 줄로 이어져도 큰 원형 배경은 잘리지 않고 제목 가까이에 놓입니다. '.repeat(4)} />
      <K.KjunListRow title="Dynamic icon" icon="bell" leadingSize={styled ? 'lg' : undefined} iconColor={styled ? iconColor : undefined} iconBackground={styled ? iconBackground : undefined} />
      <K.KjunListRow title="Circle action" icon="bell" leadingSize="xs" iconBackground={iconBackground} chevron {...press} />
      <K.KjunListRow title="Disabled circle" icon="bell" leadingSize="lg" iconColor={iconColor} iconBackground={iconBackground} disabled {...press} />
      <K.KjunListRow title="Circle switch" icon="bell" iconBackground={iconBackground} checked={checked} onCheckedChange={setChecked} />
      <K.KjunListRow title="Nested parent" icon="bell" leadingSize="lg">
        <K.KjunListSection ariaLabel="Nested rows"><K.KjunListRow title="Nested default" icon="bell" /></K.KjunListSection>
      </K.KjunListRow>
    </K.KjunListSection>
    <K.KjunListSection title="Mixed leading">
      <K.KjunListRow title="Mixed avatar" leading={<K.KjunAvatar name="A" size="sm" />} />
      <K.KjunListRow title="Mixed icon" icon="bell" />
      <K.KjunListRow title="Mixed end" icon="lock" />
    </K.KjunListSection>
    <K.KjunListSection title="Icons only">
      <K.KjunListRow title="Only icon" icon="bell" />
      <K.KjunListRow title="Only end" icon="lock" />
    </K.KjunListSection>
    <output data-testid="leading-state">{JSON.stringify({ clicks, checked })}</output>
  </div>;
}
