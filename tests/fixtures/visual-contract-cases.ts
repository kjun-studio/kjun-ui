// Shared consumer composition; each adapter below renders only packed public components.
export const initial = { quantity:2, time:'09:30:15', tab:'activity', open:false, retry:0, destination:'home' };
export function renderCases(h: (name:string, props:any, children?:any, slots?:any) => any, state:typeof initial, set:(key:string,value:any)=>void) {
  const query = new URLSearchParams(location.search), size = query.get('size') || 'md';
  const section = (id:string, children:any, style={}) => h('Section', { id, style }, children);
  const button = (text:string, fn=()=>{}) => h('DsButton', { onClick:fn }, text);
  const time = (precision='second') => h('DsTimePicker', { size, value:state.time, precision, onValueChange:(v:any)=>set('time',v), ariaLabel:'알림 시각' });
  const card = (dividers:boolean) => h('DsCard', { title:'프로젝트', subtitle:'팀의 문서와 활동', border:true, dividers, padding:query.has('no-inset') ? 'none' : 'md' }, h('Text', {}, '문서와 활동을 한곳에서 관리합니다.'), { footer:button('프로젝트 보기') });
  return [
    section('quantity', h('DsQuantityStepper', { size, value:state.quantity, onValueChange:(v:number)=>set('quantity',v), max:10, ariaLabel:'수량' })),
    section('quantity-block', h('DsQuantityStepper', { size, block:true, value:state.quantity, onValueChange:(v:number)=>set('quantity',v), max:10, ariaLabel:'전체 폭 수량' })),
    section('time', time()),
    section('ordinary', h('DsSelect', { value:'a', options:[{label:'기본 입력',value:'a'}], ariaLabel:'일반 선택', size:'md' })),
    section('popover', h('DsPopover', { open:state.open, onOpenChange:(v:boolean)=>set('open',v), manualTrigger:true, matchTriggerWidth:query.has('match-width'), focusOnOpen:true, ariaLabel:'상세 정보', noPadding:query.has('no-padding') }, [h('Text',{},query.has('long')?'긴 내용을 확인하기 위한 문장입니다. '.repeat(25):'팝오버 내용'),button('팝오버 실행',()=>set('retry',state.retry+1))], { trigger:button('팝오버 열기',()=>set('open',!state.open)) })),
    section('tabs',h('DsTabs',{ value:state.tab, onValueChange:(v:string)=>set('tab',v), items:[{name:'activity',label:'활동',badge:3},{name:'files',label:'파일'},{name:'disabled',label:'비활성',disabled:true}], variant:query.has('pills')?'pills':'underline' })),
    section('card',card(false)), section('card-dividers',card(true)),
    section('error',h('DsDataState',{ error:'목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', onRetry:()=>set('retry',state.retry+1) })),
    section('refresh-error',h('DsDataState',{ queryKey:'a',resultKey:'a',hasLoadedOnce:true,error:'갱신 실패',onRetry:()=>set('retry',state.retry+1) },h('Text',{},'유지한 데이터'))),
    section('chart',h('DsChartSkeleton',{ kind:query.get('kind') || 'line', height:180, loadingText:query.has('no-text')?'':undefined })),
    section('bar',h('DsBottomActionBar',{ description:'변경한 내용을 모든 기기에 적용합니다.',safeAreaBottom:34 },h('DsFormActions',{confirmText:'변경 사항 저장',onConfirm:()=>set('retry',state.retry+1)})),query.has('narrow-bar')?{width:360}:{}),
    section('navigation',h('DsBottomNavigation',{value:state.destination,items:[{key:'home',label:'홈',href:'#home',icon:'home'},{key:'activity',label:'활동',href:'#activity',icon:'list'}],onNavigate:(key:string,e:any)=>{e.preventDefault();set('destination',key);}})),
    h('Output',{id:'state'},JSON.stringify(state)),
  ];
}
