import { useEffect, useState } from 'react';
import accessible from '@kjun/icons/icons/accessible';
import alien from '@kjun/icons/icons/alien';
import rocket from '@kjun/icons/icons/rocket';
import { appColors } from './style-values';
export function RegistryCases({ K, native = false }: { K: any; native?: boolean }) {
  const [changed, setChanged] = useState(false), [removed, setRemoved] = useState(false);
  const [modal, setModal] = useState(false), [drawer, setDrawer] = useState(false);
  const colors = native ? { colors: appColors } : {};
  const registration = removed ? {} : { accessible, alien: changed ? rocket : alien, custom: alien, heart: alien, x: alien, 'info-circle': alien };
  useEffect(() => { Object.assign(window, { updateIcons: (change: boolean, remove = false) => { setChanged(change); setRemoved(remove); } }); }, []);
  const icon = (id: string, name: string, filled = false) => <div data-testid={id}><K.DsIcon name={name} size={24} filled={filled} /></div>;
  function Feedback() {
    const feedback = K.useKjunFeedback();
    return <button onClick={() => feedback.toast.info('등록된 피드백 아이콘', { duration: 0 })}>피드백 표시</button>;
  }
  return <>
    <K.KjunProvider {...colors} icons={registration}><K.KjunFeedbackProvider>
      <div data-testid="colored-node"><K.DsIcon name="accessible" size={24} color="#b61dd8" /></div>{icon('extra', 'alien')}{icon('extra-filled', 'alien', true)}{icon('unknown', 'missing')}{icon('fallback', 'search', true)}
      <div data-testid="prefix"><K.DsButton prefixIcon="alien">내부 아이콘</K.DsButton></div>
      <K.KjunProvider {...colors} icons={{ custom: { outline: rocket.outline } }}>
        {icon('nested-outline', 'custom')}{icon('nested-filled', 'custom', true)}{icon('nested-inherit', 'alien')}
      </K.KjunProvider>
      <button onClick={() => setModal(true)}>모달 표시</button><button onClick={() => setDrawer(true)}>드로어 표시</button><Feedback />
      <K.DsModal open={modal} title="아이콘 모달" onOpenChange={setModal}>{icon('modal-icon', 'alien')}</K.DsModal>
      <K.DsDrawer open={drawer} title="아이콘 드로어" onOpenChange={setDrawer}>{icon('drawer-icon', 'alien')}</K.DsDrawer>
    </K.KjunFeedbackProvider></K.KjunProvider>
    <K.KjunProvider {...colors}>{icon('isolated', 'alien')}{icon('default-heart', 'heart', true)}</K.KjunProvider>
  </>;
}
