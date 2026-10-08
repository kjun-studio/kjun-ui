import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { KjunProvider, DsButton, DsInput, DsCard, DsAnimatedNumber, DsKpiHero, DsKpiRow, DsBadge, DsPagination, DsMarketCards, DsModal, DsDrawer, DsSelect, DsCombobox, DsTextarea, DsSearchInput, DsDatePicker, DsQuantityStepper, DsTimePicker } from '@kjun-ui/react';
import { palette, cssPalette, demoDomainColors, demoFont, summaryItems, marketProps } from './typography-values';
cssPalette();
function App() {
 const [changed,setChanged] = useState(false), [value,setValue]=useState(''), [open,setOpen]=useState(false), [drawer,setDrawer]=useState(false);
 Object.assign(window,{ updateTokenPalette:()=>{cssPalette(true);setChanged(true);} });
 return <KjunProvider ><div style={{padding:16,minWidth:0}}>
  <div data-testid="body"><DsAnimatedNumber value="본문 ABC 가나다" animated={false}/></div>
  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{(['xs','sm','md','lg','xl'] as const).map(size=><DsButton key={size} size={size}>버튼 {size}</DsButton>)}</div>
  <div>{(['primary','danger','success','warning'] as const).map(variant=><DsButton key={variant} variant={variant}>색상 {variant}</DsButton>)}</div>
  {(['sm','md','lg'] as const).map(size=><DsInput key={size} size={size} value={value} onChange={event => setValue(event.target.value)} ariaLabel={'입력 '+size} placeholder="내용을 입력하세요" />)}
  <div data-testid="card"><DsCard title="카드 제목" elevation="raised"><DsAnimatedNumber value="카드 본문" animated={false}/></DsCard></div>
  <div data-testid="hero"><DsKpiHero label="자산" value={1234567890} prefix="₩" animated={false}/></div>
  <div data-testid="hero-small"><DsKpiHero size="sm" label="보조 자산" value={23456} suffix="USD" animated={false}/></div>
  <div data-testid="hero-delta"><DsKpiHero label="증감 지표" value={6789} prefix="EUR" deltaAbsolute={1234} deltaPercent={2.5} animated={false} secondary={[{label:"보조 금액",value:2345,suffix:"JPY"}]} /></div>
  <div data-testid="row"><DsKpiRow mobileSummary={false} items={[{label:'주요 지표',value:12345,desc:'긴 한국어 설명과 English supplementary information'}]} /></div>
  <div data-testid="row-summary"><DsKpiRow items={summaryItems} /></div>
  <div data-testid="row-small"><DsKpiRow size="sm" items={[{label:'작은 지표',value:9876,suffix:'EUR'}]} /></div>

  {(['sm','md','lg'] as const).map(size => <div key={'fields-'+size} data-testid={'fields-'+size} style={{display:'grid',gap:12,marginTop:12}}>
    <DsSelect size={size} value="a" options={[{value:'a',label:'선택 값'},{value:'b',label:'다른 옵션'}]} ariaLabel={'선택 '+size}/>
    <DsCombobox size={size} value="a" options={[{value:'a',label:'검색 값'}]} ariaLabel={'자동완성 '+size}/>
    <DsTextarea value="" size={size} placeholder="여러 줄 입력" ariaLabel={'여러 줄 '+size}/>
    <DsSearchInput value="" size={size} placeholder="검색" ariaLabel={'검색 '+size}/>
    <DsDatePicker size={size} value="2026-09-16" ariaLabel={'날짜 '+size}/>
    <DsDatePicker size={size} value="" placeholder="미정" ariaLabel={'빈 날짜 '+size}/>
    <DsQuantityStepper size={size} value={2} ariaLabel={'수량 '+size}/>
    <DsTimePicker size={size} value="12:30" ariaLabel={'시간 '+size}/>
  </div>)}

  <div data-testid="narrow" style={{width:240,maxWidth:'100%',marginTop:16}}>
    <DsKpiHero label="긴 한국어와 English supplementary KPI information" value={123456789012345} suffix="US dollars" animated={false} secondary={[{label:'보조 지표의 전체 이름을 두 줄 이상 읽을 수 있어야 합니다',value:1234,desc:'상세 설명 supplementary information'}]} />
    <DsBadge>길이가 긴 상태 설명과 supplementary badge information</DsBadge>
    <DsKpiRow mobileSummary={false} items={[{label:'텍스트형 값',valueKind:'text',value:'긴 한국어와 English description that must remain fully readable in a narrow container',desc:'설명 전체 표시'}]}/>
  </div>
  <div data-testid="pagination"><DsPagination currentPage={1} totalPages={3} showSizeSelector /></div>
  <div data-testid="market-cards"><DsMarketCards {...marketProps} /></div>
  <DsBadge size="xs">작은 배지</DsBadge>
  <DsButton onClick={()=>setOpen(true)}>열기</DsButton>
  <DsButton onClick={()=>setDrawer(true)}>서랍 열기</DsButton>
  <DsDrawer open={drawer} onOpenChange={setDrawer} title="토큰 서랍"><DsButton>서랍 버튼</DsButton></DsDrawer>
  <DsModal open={open} onOpenChange={setOpen} title="토큰 모달"><DsButton>모달 버튼</DsButton></DsModal>
 </div></KjunProvider>;
}
createRoot(document.getElementById('root')!).render(<App/>);
