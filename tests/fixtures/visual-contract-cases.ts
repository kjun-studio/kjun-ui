// Shared consumer composition; each adapter below renders only packed public components.
export const initial = { quantity:2, time:'09:30:15', tab:'activity', open:false, retry:0, destination:'home', radio:'a', menuOpen:false, pick:'', focusOpen:false, targetGone:false, returnOn:false, headerOpen:false, nmOpen:false, typed:'', sortReset:false, sortClicks:0, tsel:[] as any[], tipOpen:false };
export function renderCases(h: (name:string, props:any, children?:any, slots?:any) => any, state:typeof initial, set:(key:string,value:any)=>void) {
  const query = new URLSearchParams(location.search), size = query.get('size') || 'md';
  const section = (id:string, children:any, style={}) => h('Section', { id, style }, children);
  const button = (text:string, fn=()=>{}) => h('KjunButton', { onClick:fn }, text);
  const time = (precision='second') => h('KjunTimePicker', { size, value:state.time, precision, onValueChange:(v:any)=>set('time',v), ariaLabel:'알림 시각' });
  const card = (dividers:boolean) => h('KjunCard', { title:'프로젝트', subtitle:'팀의 문서와 활동', border:true, dividers, padding:query.has('no-inset') ? 'none' : 'md' }, h('Text', {}, '문서와 활동을 한곳에서 관리합니다.'), { footer:button('프로젝트 보기') });
  return [
    section('quantity', h('KjunQuantityStepper', { size, value:state.quantity, onValueChange:(v:number)=>set('quantity',v), max:10, ariaLabel:'수량' })),
    section('quantity-block', h('KjunQuantityStepper', { size, block:true, value:state.quantity, onValueChange:(v:number)=>set('quantity',v), max:10, ariaLabel:'전체 폭 수량' })),
    section('time', time()),
    section('ordinary', h('KjunSelect', { value:'a', options:[{label:'기본 입력',value:'a'}], ariaLabel:'일반 선택', size:'md' })),
    section('popover', h('KjunPopover', { open:state.open, onOpenChange:(v:boolean)=>set('open',v), manualTrigger:true, matchTriggerWidth:query.has('match-width'), focusOnOpen:true, ariaLabel:'상세 정보', noPadding:query.has('no-padding') }, [h('Text',{},query.has('long')?'긴 내용을 확인하기 위한 문장입니다. '.repeat(25):'팝오버 내용'),button('팝오버 실행',()=>set('retry',state.retry+1))], { trigger:button('팝오버 열기',()=>set('open',!state.open)) })),
    section('tabs',h('KjunTabs',{ value:state.tab, onValueChange:(v:string)=>set('tab',v), items:[{name:'activity',label:'활동',badge:3},{name:'files',label:'파일'},{name:'disabled',label:'비활성',disabled:true}], variant:query.has('pills')?'pills':'underline' })),
    section('card',card(false)), section('card-dividers',card(true)),
    section('error',h('KjunDataState',{ error:'목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', onRetry:()=>set('retry',state.retry+1) })),
    section('refresh-error',h('KjunDataState',{ queryKey:'a',resultKey:'a',hasLoadedOnce:true,error:'갱신 실패',onRetry:()=>set('retry',state.retry+1) },h('Text',{},'유지한 데이터'))),
    section('chart',h('KjunChartSkeleton',{ kind:query.get('kind') || 'frame', height:180, loadingText:query.has('no-text')?'':undefined, skeleton:!query.has('spinner'), loadingDelay:Number(query.get('delay') || 0), rows:query.has('rows')?Number(query.get('rows')):undefined, columns:query.has('columns')?Number(query.get('columns')):undefined }),query.has('chart-width')?{width:Number(query.get('chart-width'))}:query.has('chart-shrink')?{display:'inline-block'}:{}),
    section('bar',h('KjunBottomActionBar',{ description:'변경한 내용을 모든 기기에 적용합니다.',safeAreaBottom:34 },h('KjunFormActions',{confirmText:'변경 사항 저장',onConfirm:()=>set('retry',state.retry+1)})),query.has('narrow-bar')?{width:360}:{}),
    section('navigation',h('KjunBottomNavigation',{value:state.destination,items:[{key:'home',label:'홈',href:'#home',icon:'home'},{key:'activity',label:'활동',href:'#activity',icon:'list'}],onNavigate:(key:string,e:any)=>{e.preventDefault();set('destination',key);}})),
    section('radio-vertical',h('KjunRadioGroup',{ direction:'vertical', value:state.radio, onValueChange:(v:any)=>set('radio',v), ariaLabel:'세로 선택', options:['a','b','c','d','e','f'].map(v=>({label:'항목 '+v,value:v})) }),{display:'grid',gridTemplateRows:'96px',height:96,overflow:'auto'}),
    section('refresh-text',h('KjunRefreshButton',{ mode:'text', text:'다시 불러오기', targetName:'주문', onRefresh:()=>set('retry',state.retry+1) })),
    section('table-format',h('KjunTable',{ columns:[{key:'rate',label:'비율',format:'percent'}], data:[{rate:0.25}] })),
    section('loading-state',h('KjunDataState',{ queryKey:'a', loading:true },h('Text',{},'로딩 뒤 본문'))),
    section('popover-menu',h('KjunPopover',{ open:state.menuOpen, onOpenChange:(v:boolean)=>set('menuOpen',v), manualTrigger:true, ariaLabel:'메뉴 팝오버' },h('KjunDropdown',{},h('KjunDropdownItem',{ onClick:()=>set('pick','하위 항목') },'하위 항목'),{ trigger:button('하위 메뉴') }),{ trigger:button('메뉴 묶음 열기',()=>set('menuOpen',!state.menuOpen)) })),
    section('popover-return',[h('KjunPopover',{ open:state.focusOpen, onOpenChange:(v:boolean)=>set('focusOpen',v), manualTrigger:true, ariaLabel:'초점 팝오버',
      returnFocus:query.has('late-return') && !state.returnOn ? undefined : ()=>document.querySelector<HTMLElement>('[data-testid="focus-target"] button') },
      [h('Text',{},'초점 팝오버 내용'),button('대상 지우고 닫기',()=>{ set('focusOpen',false); setTimeout(()=>set('targetGone',true),0); })],
      { trigger:button('초점 시험 열기',()=>set('focusOpen',!state.focusOpen)) }),button('복귀 켜기',()=>set('returnOn',true))]),
    state.targetGone ? null : section('focus-target',button('초점 받을 버튼')),
    section('popover-header',h('KjunPopover',{ open:state.headerOpen, onOpenChange:(v:boolean)=>set('headerOpen',v), manualTrigger:true, maxHeight:200, noPadding:query.has('header-no-padding') },
      Array.from({length:20},(_,i)=>h('Text',{},'필터 항목 '+(i+1))),
      { header:h('Text',{},'주문 필터'), trigger:button('머리글 시험 열기',()=>set('headerOpen',!state.headerOpen)) })),
    section('popover-nonmodal',[h('KjunPopover',{ open:state.nmOpen, onOpenChange:(v:boolean)=>set('nmOpen',v), manualTrigger:true, modal:false, ariaLabel:'비모달 시험' },
      [button('비모달 첫 버튼'),h('KjunDropdown',{},h('KjunDropdownItem',{ onClick:()=>set('pick','비모달 항목') },'비모달 항목'),{ trigger:button('비모달 메뉴') }),button('비모달 끝 버튼')],
      { trigger:button('비모달 열기',()=>set('nmOpen',!state.nmOpen)) }),button('트리거 다음 버튼')]),
    section('nonmodal-outside',[h('KjunInput',{ value:state.typed, onValueChange:(v:string)=>set('typed',v), ariaLabel:'바깥 입력' }),h('Text',{},'빈 영역 문단')]),
    section('menu-selection',h('KjunDropdown',{},[h('KjunDropdownItem',{ selected:true },'최신순'),h('KjunDropdownItem',{ selected:false },'이름순'),
      h('KjunDropdownItem',{ onClick:()=>{ set('sortReset',true); set('sortClicks',state.sortClicks+1); } },'정렬 초기화')],{ trigger:button('정렬 메뉴') })),
    section('table-select',h('KjunTable',{ selectable:true, selected:state.tsel, onSelectionChange:(v:any[])=>set('tsel',v), columns:[{key:'name',label:'이름'}], data:[{id:1,name:'선택 행'}] })),
    section('button-wrap',[h('KjunButton',{ wrap:true },'아주 긴 라벨이 있는 버튼이 좁은 칸에서 줄바꿈되는지 확인'),h('KjunButton',{ wrap:true },'짧은 줄바꿈'),h('KjunButton',{},'짧은 기준')],{width:160}),
    section('alert-live',[h('KjunAlert',{ type:'warning', live:'assertive', title:'경고 즉시' }),h('KjunAlert',{ type:'info', live:'off', title:'조용한 안내' }),h('KjunAlert',{ type:'warning', title:'기본 경고' })]),
    section('tooltip-controlled',[h('KjunTooltip',{ open:state.tipOpen, onOpenChange:(v:boolean)=>{ if(!query.has('tip-frozen')) set('tipOpen',v); }, content:'제어 툴팁 내용' },button('제어 툴팁 대상')),button('툴팁 열기',()=>set('tipOpen',true))]),
    section('tooltip-outside',h('KjunTooltip',{ content:'바깥 도움말' },button('도움말 버튼'))),
    h('Output',{id:'state'},JSON.stringify(state)),
  ];
}
