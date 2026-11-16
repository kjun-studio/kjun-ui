import { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FlatList, ScrollView, Text, View } from 'react-native';
import * as K from '@kjun-ui/native';
import { applyDemoColors, demoDomainPalettes, demoFont, demoPalettes } from '../../shared/demo-colors';

applyDemoColors('default');
const rows = Array.from({ length: 300 }, (_, index) => '사진 ' + (index + 1));
const row = (name: string) => <View key={name} style={{ height: 48, justifyContent: 'center' }}><Text>{name}</Text></View>;
// The app's own scroller in the drawer body: a virtual list, or a ScrollView whose ref and scroll events the app uses.
function App() {
  const mode = new URLSearchParams(location.search).get('mode') ?? 'list';
  const [offset, setOffset] = useState(0);
  const scroller = useRef<ScrollView>(null);
  useLayoutEffect(() => { Object.assign(window, { scrollDrawer: (y: number) => scroller.current?.scrollTo({ y, animated: false }) }); }, []);
  return <K.KjunProvider colors={demoPalettes.default} domainColors={demoDomainPalettes.default} fontFamily={demoFont}>
    <K.KjunDrawer open onOpenChange={() => {}} position="bottom" title="사진 고르기" footer={<Text testID="offset">{offset}</Text>}
      renderScrollView={mode === 'list'
        ? props => <FlatList {...props} testID="app-scroller" data={rows} keyExtractor={name => name} renderItem={({ item }) => row(item)} initialNumToRender={12} windowSize={3} />
        : props => <ScrollView {...props} ref={scroller} testID="app-scroller" scrollEventThrottle={16} onScroll={event => setOffset(Math.round(event.nativeEvent.contentOffset.y))} />}>
      {mode === 'list' ? null : rows.slice(0, 60).map(row)}
    </K.KjunDrawer>
  </K.KjunProvider>;
}
createRoot(document.getElementById('root')!).render(<App />);
