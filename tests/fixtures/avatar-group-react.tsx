import { createRoot } from 'react-dom/client';
import { useEffect, useRef, useState } from 'react';
import { KjunProvider, KjunAvatarGroup } from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';

applyDemoColors('default');
const people = ['김하늘', '이서준', '박지우', '최민서', '정도윤'].map((name, i) => ({ key: 'p' + i, name }));
function Page() {
  const [presses, setPresses] = useState(0);
  const press = () => setPresses(count => count + 1);
  const [errors, setErrors] = useState(0), root = useRef<HTMLElement>(null), [rootTag, setRootTag] = useState('');
  useEffect(() => { setRootTag(root.current?.tagName ?? ''); }, []);
  return <div style={{ padding: 24, width: 420, display: 'grid', gap: 16, justifyItems: 'start' }}>
    <div data-testid="five"><KjunAvatarGroup items={people} max={4} ariaLabel="참여자 5명" /></div>
    <div data-testid="total"><KjunAvatarGroup items={people.slice(0, 3)} max={3} total={128} /></div>
    <div data-testid="square"><KjunAvatarGroup items={people.slice(0, 4)} shape="square" ariaLabel="팀 4명" /></div>
    <div data-testid="press"><KjunAvatarGroup items={people.slice(0, 3)} total={9} pressable onClick={press} ariaLabel="참여자 목록 열기" /></div>
    <div data-testid="disabled"><KjunAvatarGroup items={people.slice(0, 2)} pressable disabled onClick={press} ariaLabel="잠긴 목록" /></div>
    <div data-testid="ring" style={{ background: '#E6F1FB', padding: 12 }}><KjunAvatarGroup items={people.slice(0, 3)} ringColor="#E6F1FB" ariaLabel="색 바탕" /></div>
    <div data-testid="rtl" dir="rtl"><KjunAvatarGroup items={people.slice(0, 3)} total={5} ariaLabel="오른쪽부터" /></div>
    <div data-testid="empty"><KjunAvatarGroup items={[]} total={4} /></div>
    <div data-testid="broken"><KjunAvatarGroup items={[{ key: 'x', name: '한결', src: '/missing-avatar.png' }, people[1]]} ariaLabel="깨진 이미지" /></div>
    <div data-testid="fallback"><KjunAvatarGroup items={[{ key: 'f', src: '/missing-avatar.png', fallback: '★', onError: () => setErrors(count => count + 1) }, people[1]]} ariaLabel="대체 표시" /></div>
    <div data-testid="described"><KjunAvatarGroup ref={root} id="team" aria-describedby="team-note" items={people.slice(0, 2)} ariaLabel="팀 2명" /><span id="team-note">초대 1명 대기</span></div>
    <div data-testid="root-tag">{rootTag}</div>
    <div data-testid="errors">{errors}</div>
    <div data-testid="presses">{presses}</div>
  </div>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider><Page /></KjunProvider>);
