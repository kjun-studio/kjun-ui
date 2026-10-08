import Vue from 'vue';
import Kjun, { KjunProvider, DsButton, DsInput, DsCard, DsAnimatedNumber, DsKpiHero, DsKpiRow, DsBadge, DsPagination, DsMarketCards, DsModal, DsDrawer, DsSelect, DsCombobox, DsTextarea, DsSearchInput, DsDatePicker, DsQuantityStepper, DsTimePicker } from '@kjun/vue2';
import { cssPalette, summaryItems, marketProps } from './typography-values';
cssPalette(); Vue.use(Kjun);
new Vue({
  data:()=>({value:'',open:false,drawer:false}),
  created(){ Object.assign(window,{updateTokenPalette:()=>cssPalette(true)}); },
  render(h){
    const box=(id:string,child:any)=>h('div',{attrs:{'data-testid':id}},[child]);
    return h(KjunProvider,[h('div',{style:{padding:'16px',minWidth:0}},[
      box('body',h(DsAnimatedNumber,{props:{value:'본문 ABC 가나다',animated:false}})),
      h('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap'}},['xs','sm','md','lg','xl'].map(size=>h(DsButton,{props:{size}},'버튼 '+size))),
      ...['primary','danger','success','warning'].map(variant=>h(DsButton,{props:{variant}},'색상 '+variant)),
      ...['sm','md','lg'].map(size=>h(DsInput,{props:{size,value:this.value,ariaLabel:'입력 '+size,placeholder:'내용을 입력하세요'},on:{input:(v:string)=>{this.value=v;}}})),
      box('card',h(DsCard,{props:{title:'카드 제목',elevation:'raised'}},[h(DsAnimatedNumber,{props:{value:'카드 본문',animated:false}})])),
      box('hero',h(DsKpiHero,{props:{label:'자산',value:1234567890,prefix:'₩',animated:false}})),
      box('hero-small',h(DsKpiHero,{props:{size:'sm',label:'보조 자산',value:23456,suffix:'USD',animated:false}})),
      box('hero-delta',h(DsKpiHero,{props:{label:'증감 지표',value:6789,prefix:'EUR',deltaAbsolute:1234,deltaPercent:2.5,animated:false,secondary:[{label:'보조 금액',value:2345,suffix:'JPY'}]}})),
      box('row',h(DsKpiRow,{props:{mobileSummary:false,items:[{label:'주요 지표',value:12345,desc:'긴 한국어 설명과 English supplementary information'}]}})),
      box('row-summary',h(DsKpiRow,{props:{items:summaryItems}})),
      box('row-small',h(DsKpiRow,{props:{size:'sm',items:[{label:'작은 지표',value:9876,suffix:'EUR'}]}})),

      ...['sm','md','lg'].map(size => box('fields-'+size,h('div',{style:{display:'grid',gap:'12px',marginTop:'12px'}},[
        h(DsSelect,{props:{size,value:'a',options:[{value:'a',label:'선택 값'},{value:'b',label:'다른 옵션'}],ariaLabel:'선택 '+size}}),
        h(DsCombobox,{props:{size,value:'a',options:[{value:'a',label:'검색 값'}],ariaLabel:'자동완성 '+size}}),
        h(DsTextarea,{props:{size,placeholder:'여러 줄 입력',ariaLabel:'여러 줄 '+size}}),
        h(DsSearchInput,{props:{size,placeholder:'검색',ariaLabel:'검색 '+size}}),
        h(DsDatePicker,{props:{size,value:'2026-09-16',ariaLabel:'날짜 '+size}}),
        h(DsDatePicker,{props:{size,value:'',placeholder:'미정',ariaLabel:'빈 날짜 '+size}}),
        h(DsQuantityStepper,{props:{size,value:2,ariaLabel:'수량 '+size}}),
        h(DsTimePicker,{props:{size,value:'12:30',ariaLabel:'시간 '+size}}),
      ]))),

      box('narrow',h('div',{style:{width:'240px',maxWidth:'100%',marginTop:'16px'}},[
        h(DsKpiHero,{props:{label:'긴 한국어와 English supplementary KPI information',value:123456789012345,suffix:'US dollars',animated:false,secondary:[{label:'보조 지표의 전체 이름을 두 줄 이상 읽을 수 있어야 합니다',value:1234,desc:'상세 설명 supplementary information'}]}}),
        h(DsBadge,'길이가 긴 상태 설명과 supplementary badge information'),
        h(DsKpiRow,{props:{mobileSummary:false,items:[{label:'텍스트형 값',valueKind:'text',value:'긴 한국어와 English description that must remain fully readable in a narrow container',desc:'설명 전체 표시'}]}}),
      ])),
      box('pagination',h(DsPagination,{props:{currentPage:1,totalPages:3,showSizeSelector:true}})),
      box('market-cards',h(DsMarketCards,{props:marketProps})),
      h(DsBadge,{props:{size:'xs'}},'작은 배지'),
      h(DsButton,{on:{click:()=>{this.open=true;}}},'열기'),
      h(DsButton,{on:{click:()=>{this.drawer=true;}}},'서랍 열기'),
      h(DsDrawer,{props:{value:this.drawer,title:'토큰 서랍'},on:{input:(v:boolean)=>{this.drawer=v;}}},[h(DsButton,'서랍 버튼')]),
      h(DsModal,{props:{value:this.open,title:'토큰 모달'},on:{input:(v:boolean)=>{this.open=v;}}},[h(DsButton,'모달 버튼')]),
    ])]);
  },
}).$mount('#root');
