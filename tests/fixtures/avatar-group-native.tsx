import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { KjunProvider, KjunAvatarGroup } from '@kjun-ui/native';
import { demoFont, demoPalettes } from '../../shared/demo-colors';

const people = ['김하늘', '이서준', '박지우', '최민서', '정도윤'].map((name, i) => ({ key: 'p' + i, name }));
function Page() {
  const [presses, setPresses] = useState(0);
  const press = () => setPresses(count => count + 1);
  return <View style={{ padding: 24, width: 420, gap: 16, alignItems: 'flex-start' }}>
    <View testID="five"><KjunAvatarGroup items={people} max={4} ariaLabel="참여자 5명" /></View>
    <View testID="total"><KjunAvatarGroup items={people.slice(0, 3)} max={3} total={128} /></View>
    <View testID="small"><KjunAvatarGroup items={[...people.slice(0, 2), { key: "c", name: "색", color: "#E6F1FB" }]} max={3} total={128} size="xs" ariaLabel="작은 그룹" /></View>
    <View testID="square"><KjunAvatarGroup items={people.slice(0, 4)} shape="square" ariaLabel="팀 4명" /></View>
    <View testID="press"><KjunAvatarGroup items={people.slice(0, 3)} total={9} pressable onPress={press} ariaLabel="참여자 목록 열기" /></View>
    <View testID="disabled"><KjunAvatarGroup items={people.slice(0, 2)} pressable disabled onPress={press} ariaLabel="잠긴 목록" /></View>
    <View testID="ring" style={{ backgroundColor: '#E6F1FB', padding: 12 }}><KjunAvatarGroup items={people.slice(0, 3)} ringColor="#E6F1FB" ariaLabel="색 바탕" /></View>
    <View testID="empty"><KjunAvatarGroup items={[]} total={4} /></View>
    <View testID="broken"><KjunAvatarGroup items={[{ key: 'x', name: '한결', src: '/missing-avatar.png' }, people[1]]} ariaLabel="깨진 이미지" /></View>
    <Text testID="presses">{presses}</Text>
  </View>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider colors={demoPalettes.default} fontFamily={demoFont}><Page /></KjunProvider>);
