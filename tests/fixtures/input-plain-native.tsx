import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { KjunProvider, KjunInput, KjunTextarea } from '@kjun-ui/native';
import { demoFont, demoPalettes } from '../../shared/demo-colors';

function Page() {
  const [title, setTitle] = useState('3분기 여행 계획'), [empty, setEmpty] = useState(''), [note, setNote] = useState('아침에 다녀옴.'), [draft, setDraft] = useState('보낼 글');
  return <View style={{ padding: 24, width: 480 }}>
    <Text testID="guide">작업 공간 / 여행</Text>
    <KjunInput variant="plain" ariaLabel="제목" value={title} onChangeText={setTitle} />
    <KjunInput variant="plain" ariaLabel="빈 제목" value={empty} onChangeText={setEmpty} errorMessage="제목을 입력해 주세요." />
    <KjunInput variant="plain" ariaLabel="잠긴 제목" value="잠긴 제목" disabled />
    <KjunInput variant="plain" ariaLabel="검색" prefixIcon="search" clearable value={title} onChangeText={setTitle} />
    <KjunTextarea variant="plain" ariaLabel="본문" value={note} onChangeText={setNote} />
    <KjunTextarea variant="plain" ariaLabel="보낼 글" value={draft} onChangeText={setDraft} showCount maxLength={100} submitLabel="보내기" onSubmit={() => {}} />
    <KjunInput ariaLabel="기본" value={title} onChangeText={setTitle} />
  </View>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider colors={demoPalettes.default} fontFamily={demoFont}><Page /></KjunProvider>);
