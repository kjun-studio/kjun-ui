import Vue from 'vue';
import * as api from '@kjun-ui/vue2';
import { cssPalette } from './typography-values';
import { longGeometryText } from './geometry-review-common';
cssPalette();
const Cases = Vue.extend({
  inject:['kjunFeedback'],
  data:()=>({drawer:false,modal:false,long:false,removed:false,events:0}),
  mounted(){Object.assign(window,{geometryLong:()=>this.long=true,geometryToast:()=> (this as any).kjunFeedback.toast.info(this.long?longGeometryText:'검사 항목',{title:'검사 토스트',duration:0,action:{label:'토스트 실행',onClick:()=>this.events++}})});},
  render(h){
    const label=this.long?longGeometryText:'검사 항목';const event=()=>this.events++;
    const box=(id:string,child:any,narrow=false)=>h('div',{key:id,attrs:{'data-testid':id},style:{display:'flex',flexDirection:'column',alignItems:['badge','chip','removable'].includes(id)?'flex-start':'stretch',marginBottom:'16px',width:narrow?'240px':undefined,maxWidth:'100%',minWidth:0}},[child]);
    const button=(name:string,action:()=>void)=>h('button',{on:{click:action}},name);
    const items=[{label,value:this.long?'12345678901234567890':12345,desc:label,badge:{text:label,variant:'info'},clickable:true,mobileSecondary:false},{label,value:678,desc:label,mobileSecondary:false}];
    return h('div',{style:{padding:'16px',minWidth:0}},[
      box('badge',h(api.DsBadge,{props:{size:'xs'}},label)),box('chip',h(api.DsChip,{props:{size:'lg',label}})),
      box('removable',!this.removed&&h(api.DsChip,{props:{removable:true,label,removeLabel:'칩 삭제'},on:{remove:()=>{this.removed=true;event();}}})),
      box('navigation',h(api.DsTopNavigation,{props:{title:label,description:label}})),
      box('list',h(api.DsListSection,{props:{title:label,description:label}},[h(api.DsListRow,{props:{title:label,description:label},on:{click:event}})])),
      box('actionbar',h(api.DsBottomActionBar,{props:{description:label,safeAreaBottom:7}},[button('하단 실행',event)])),
      box('card',h(api.DsCard,{props:{title:label,subtitle:label,dividers:true}},[label,h('span',{slot:'footer'},label)]),true),
      box('hero',h(api.DsKpiHero,{props:{label,value:this.long?'12345678901234567890':12345,prefix:this.long?'대한민국원InternationalCurrencyDenominationKoreanWon':'KRW',suffix:this.long?'원/장기정산통화단위':'원',secondary:[{label,value:987,desc:label,prefix:this.long?'미국달러InternationalSettlementCurrencyUnit':undefined,suffix:this.long?'정산 단위':undefined}],animated:false}})),
      box('hero-sm',h(api.DsKpiHero,{props:{size:'sm',label,value:123,secondary:[{label,value:987,desc:label,prefix:this.long?'미국달러InternationalSettlementCurrencyUnit':undefined,suffix:this.long?'정산 단위':undefined}],animated:false}}),true),
      box('row',h(api.DsKpiRow,{props:{items,mobileSummary:false},on:{'item-click':event}})),
      box('row-sm',h(api.DsKpiRow,{props:{items,size:'sm'},on:{'item-click':event}}),true),
      box('row-summary',h(api.DsKpiRow,{props:{items,mobileSummary:true},on:{'item-click':event}})),
      box('alert',h(api.DsAlert,{props:{size:'md',title:label}},label)),
      box('skeleton',h(api.DsSkeleton,{props:{type:'card',animated:false}}),true),
      box('table',h(api.DsTable,{props:{data:[{id:1,name:label,amount:123}],columns:[{key:'name',label:'이름'},{key:'amount',label:'값'}],responsive:'card',cardTitle:'name'},on:{'row-click':event}}),true),
      button('패널 열기',()=>this.drawer=true),button('대화상자 열기',()=>this.modal=true),
      h(api.DsDrawer,{props:{value:this.drawer,position:'bottom',title:'검사 패널'},on:{input:(v:boolean)=>this.drawer=v}},[label,h('span',{slot:'footer'},label)]),
      h(api.DsModal,{props:{value:this.modal,title:'검사 대화상자',showFooter:true},on:{input:(v:boolean)=>this.modal=v}},label),
      h('output',{attrs:{'data-testid':'events'}},String(this.events)),
    ]);
  },
});
new Vue({render:h=>h(api.KjunProvider,[h(api.KjunFeedbackProvider,[h(Cases)])])}).$mount('#root');
