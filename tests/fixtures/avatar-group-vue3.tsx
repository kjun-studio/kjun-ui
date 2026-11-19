import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';

applyDemoColors('default');
const people = ['김하늘', '이서준', '박지우', '최민서', '정도윤'].map((name, i) => ({ key: 'p' + i, name }));
const Page = defineComponent({ setup() {
  const presses = ref(0), press = () => { presses.value++; };
  const errors = ref(0);
  return () => <div style={{ padding: '24px', width: '420px', display: 'grid', gap: '16px', justifyItems: 'start' }}>
    <div data-testid="five"><K.KjunAvatarGroup items={people} max={4} ariaLabel="참여자 5명" /></div>
    <div data-testid="total"><K.KjunAvatarGroup items={people.slice(0, 3)} max={3} total={128} /></div>
    <div data-testid="square"><K.KjunAvatarGroup items={people.slice(0, 4)} shape="square" ariaLabel="팀 4명" /></div>
    <div data-testid="press"><K.KjunAvatarGroup items={people.slice(0, 3)} total={9} pressable onClick={press} ariaLabel="참여자 목록 열기" /></div>
    <div data-testid="disabled"><K.KjunAvatarGroup items={people.slice(0, 2)} pressable disabled onClick={press} ariaLabel="잠긴 목록" /></div>
    <div data-testid="ring" style={{ background: '#E6F1FB', padding: '12px' }}><K.KjunAvatarGroup items={people.slice(0, 3)} ringColor="#E6F1FB" ariaLabel="색 바탕" /></div>
    <div data-testid="rtl" dir="rtl"><K.KjunAvatarGroup items={people.slice(0, 3)} total={5} ariaLabel="오른쪽부터" /></div>
    <div data-testid="empty"><K.KjunAvatarGroup items={[]} total={4} /></div>
    <div data-testid="broken"><K.KjunAvatarGroup items={[{ key: 'x', name: '한결', src: '/missing-avatar.png' }, people[1]]} ariaLabel="깨진 이미지" /></div>
    <div data-testid="fallback"><K.KjunAvatarGroup items={[{ key: 'f', src: '/missing-avatar.png', fallback: '★', onError: () => { errors.value++; } }, people[1]]} ariaLabel="대체 표시" /></div>
    <div data-testid="errors">{errors.value}</div>
    <div data-testid="presses">{presses.value}</div>
  </div>;
} });
createApp(() => <K.KjunProvider><Page /></K.KjunProvider>).mount('#root');
