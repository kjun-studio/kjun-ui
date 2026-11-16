// KjunBottomActionBar variant="floating": a capsule over a photo grid, as a selection bar.
// ?plain drops the description, ?long gives one that does not fit, ?docked shows the default band.
const query = new URLSearchParams(location.search);
export const barMode = query.has('plain') ? 'plain' : query.has('long') ? 'long' : query.has('docked') ? 'docked' : 'floating';
export const barDescription = barMode === 'plain' ? undefined : barMode === 'long' ? '사진 128장과 동영상 12개를 선택했습니다. 모음에 담거나 삭제할 수 있습니다.' : '3장 선택';
export function FloatingBarCases({ K, native = false }: { K: any; native?: boolean }) {
  const press = native ? { onPress: () => undefined } : { onClick: () => undefined };
  return <div data-testid="screen" style={{ width: 360, height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: '#CFE4F7' }}>
    <K.KjunBottomActionBar description={barDescription} safeArea={false} variant={barMode === 'docked' ? 'docked' : 'floating'}>
      <K.KjunButton variant="secondary" {...press}>모음에 담기</K.KjunButton>
      <K.KjunButton variant="danger" {...press}>삭제</K.KjunButton>
    </K.KjunBottomActionBar>
  </div>;
}
