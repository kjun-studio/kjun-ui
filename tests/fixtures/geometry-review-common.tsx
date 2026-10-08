import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { cssPalette, palette, demoDomainColors, demoFont } from './typography-values';
export const longGeometryText = '긴한국어설명과InternationalPortfolioPerformanceSummary2026';
export function mountGeometry(api: any, native: boolean) {
  cssPalette();
  function Cases() {
    const [drawer, setDrawer] = useState(false), [modal, setModal] = useState(false);
    const [long, setLong] = useState(false), [removed, setRemoved] = useState(false), [events, setEvents] = useState(0);
    const feedback = api.useKjunFeedback();
    const label = long ? longGeometryText : '검사 항목';
    const event = () => setEvents(v => v + 1);
    Object.assign(window, { geometryLong: () => setLong(true), geometryToast: () => feedback.toast.info(label, { title: '검사 토스트', duration: 0, action: { label: '토스트 실행', onClick: event } }) });
    const box = (id: string, child: any, narrow = false) => h('div', { key:id, 'data-testid': id, style: { display:'flex', flexDirection:'column', alignItems: ['badge','chip','removable'].includes(id)?'flex-start':'stretch', marginBottom:16, width: narrow ? 240 : undefined, maxWidth:'100%', minWidth:0 } }, child);
    const button = (name: string, action: () => void) => h('button', { onClick: action }, name);
    const items = [{ label, value: long ? '12345678901234567890' : 12345, desc:label, badge:{text:label,variant:'info'}, clickable:true, mobileSecondary:false }, {label, value:678, desc:label, mobileSecondary:false}];
    return h('div', {style:{padding:16, minWidth:0}}, [
      box('badge', h(api.DsBadge,{size:'xs'},label)), box('chip',h(api.DsChip,{size:'lg',label})),
      box('removable', !removed && h(api.DsChip,{removable:true,label,removeLabel:'칩 삭제',onRemove:()=>{setRemoved(true);event();}})),
      box('navigation',h(api.DsTopNavigation,{title:label,description:label})),
      box('list',h(api.DsListSection,{title:label,description:label},h(api.DsListRow,{title:label,description:label,[native?'onPress':'onClick']:event}))),
      box('actionbar',h(api.DsBottomActionBar,{description:label,safeAreaBottom:7},button('하단 실행',event))),
      box('card',h(api.DsCard,{title:label,subtitle:label,footer:label,dividers:true},label),true),
      box('hero',h(api.DsKpiHero,{label,value:long?'12345678901234567890':12345,prefix:long?'대한민국원InternationalCurrencyDenominationKoreanWon':'KRW',suffix:long?'원/장기정산통화단위':'원',secondary:[{label,value:987,desc:label,prefix:long?'미국달러InternationalSettlementCurrencyUnit':undefined,suffix:long?'정산 단위':undefined}],animated:false})),
      box('hero-sm',h(api.DsKpiHero,{size:'sm',label,value:123,secondary:[{label,value:987,desc:label,prefix:long?'미국달러InternationalSettlementCurrencyUnit':undefined,suffix:long?'정산 단위':undefined}],animated:false}),true),
      box('row',h(api.DsKpiRow,{items,mobileSummary:false,onItemClick:event})),
      box('row-sm',h(api.DsKpiRow,{items,size:'sm',onItemClick:event}),true),
      box('row-summary',h(api.DsKpiRow,{items,mobileSummary:true,onItemClick:event})),
      box('alert',h(api.DsAlert,{size:'md',title:label},label)),
      box('skeleton',h(api.DsSkeleton,{type:'card',animated:false}),true),
      box('table',h(api.DsTable,{data:[{id:1,name:label,amount:123}],columns:[{key:'name',label:'이름'},{key:'amount',label:'값'}],responsive:'card',cardTitle:'name',onRowClick:event}),true),
      button('패널 열기',()=>setDrawer(true)), button('대화상자 열기',()=>setModal(true)),
      h(api.DsDrawer,{open:drawer,onOpenChange:setDrawer,position:'bottom',title:'검사 패널',footer:label},label),
      h(api.DsModal,{open:modal,onOpenChange:setModal,title:'검사 대화상자',showFooter:true},label),
      h('output',{'data-testid':'events'},events),
    ]);
  }
  createRoot(document.getElementById('root')!).render(h(api.KjunProvider,native?{colors:palette(),domainColors:demoDomainColors,fontFamily:demoFont}:null,h(api.KjunFeedbackProvider,null,h(Cases))));
}
