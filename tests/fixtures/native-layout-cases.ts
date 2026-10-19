// Native layout fixes (0.11.0) rendered on all three platforms through the visual-contract adapters.
export const initial = { qty:'3', group:'week', filter:'all', drawer:'', memo:'' };
export function renderCases(h: (name:string, props:any, children?:any, slots?:any) => any, state:typeof initial, set:(key:string,value:any)=>void) {
  const query = new URLSearchParams(location.search);
  const section = (id:string, children:any, style={}) => h('Section', { id, style }, children);
  const button = (text:string, fn=()=>{}) => h('KjunButton', { onClick:fn }, text);
  const groupOptions = [{label:'이번 주',value:'week',icon:''},{label:'지난 달 기록',value:'month'},{label:'올해 전체 보기',value:'year'}];
  const longBody = Array.from({ length:40 }, (_, i) => h('Text', {}, '본문 줄 ' + (i + 1)));
  const drawer = (position:string, extra:any = {}) => h('KjunDrawer', { open:state.drawer === position, onOpenChange:(v:boolean)=>set('drawer', v ? position : ''), position, title:'시트 ' + position, ...extra },
    query.has('short') ? h('Text', {}, '짧은 본문') : longBody, { footer:button('시트 확인') });
  return [
    section('empty-text', [
      h('KjunFormGroup', { label:'', hint:'' }, h('KjunInput', { value:state.qty, onValueChange:(v:string)=>set('qty',v), ariaLabel:'수량 입력', prefix:'약', suffix:'개', prefixIcon:'' })),
      h('KjunButton', { suffixIcon:'' }, '빈 아이콘 버튼'),
      h('KjunCard', { title:'', subtitle:'' }, h('Text', {}, '빈 제목 카드')),
      h('KjunChip', { label:'칩', icon:'' }),
      h('KjunButtonGroup', { value:state.group, onValueChange:(v:string)=>set('group',v), options:groupOptions, ariaLabel:'빈 아이콘 묶음' }),
    ]),
    section('segment-narrow', [
      h('KjunButtonGroup', { value:state.group, onValueChange:(v:string)=>set('group',v), options:groupOptions, ariaLabel:'좁은 기간', fullWidth:true }),
      h('KjunFilterGroup', { value:state.filter, onValueChange:(v:string)=>set('filter',v), options:[{label:'전체 항목',value:'all'},{label:'진행 중인 일',value:'doing'},{label:'완료한 일',value:'done'}], ariaLabel:'좁은 필터' }),
    ], { width:180 }),
    section('kpi-segments', h('KjunKpiRow', { items:[
      { label:'총 평가금액', value:12345678, suffix:'원', mobileSecondary:false },
      { label:'손익', value:1, mobileSecondary:true, valueSegments:[{ label:'누적 평가손익률', text:'+12.34%' }, { label:'올해 실현손익금액', text:'1,234,567원' }, { label:'배당 수익', text:'98,765원' }] },
    ] })),
    section('feedback-fill', h('KjunFeedbackProvider', {}, h('Box', { testId:'feedback-child', style:{ flex:1 } })), { height:120, display:'flex', flexDirection:'column' }),
    section('drawers', [
      button('아래 시트 열기', ()=>set('drawer','bottom')), button('위 시트 열기', ()=>set('drawer','top')), button('오른쪽 시트 열기', ()=>set('drawer','right')),
      drawer('bottom', { safeAreaTop:20, safeAreaBottom:34, ...(query.has('max') ? { maxHeight:300 } : {}) }),
      drawer('top', { safeAreaTop:20 }),
      drawer('right', { safeAreaTop:20, safeAreaBottom:34 }),
    ]),
  ];
}
