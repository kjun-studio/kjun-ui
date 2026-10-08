import Vue from 'vue';
import { KjunProvider, DsCard, DsButton, DsAlert, DsIconToggle, DsCopyButton } from '@kjun-ui/vue2';
import { applyCardPalette, longCardTitle, type CardPaletteMode } from './card-review-values';
applyCardPalette();
new Vue({
  data:()=>({active:false,actions:0}),
  created(){ Object.assign(window,{setCardPalette:(mode:CardPaletteMode)=>applyCardPalette(mode)}); },
  render(h){
    const box=(id:string,child:any)=>h('div',{attrs:{'data-testid':id}},[child]);
    return h(KjunProvider,[h('div',{style:{padding:'16px',minWidth:0}},[
      box('responsive-card',h(DsCard,{props:{padding:'lg',title:'반응형 제목'}},'반응형 본문')),
      box('primary-card',h(DsCard,{props:{surface:'brand',title:'강조 제목',subtitle:'강조 설명'}},['강조 본문',h('span',{slot:'footer'},'강조 하단')])),
      box('nested-card',h(DsCard,{props:{surface:'brand'}},[h(DsCard,{props:{title:'내부 제목'}},'내부 본문')])),
      box('glass-card',h(DsCard,{props:{surface:'glass',title:'유리 제목',subtitle:'유리 설명'}},'유리 본문')),
      h('div',{attrs:{'data-testid':'narrow-card'},style:{width:'240px',maxWidth:'100%'}},[h(DsCard,{props:{title:longCardTitle}},[
        h(DsButton,{slot:'header-actions',props:{size:'sm'},on:{click:()=>{this.actions++;}}},'상세 보기'),'긴 카드 본문'])]),
      h('span',{attrs:{'data-testid':'card-actions'}},String(this.actions)),
      ...['sm','md','lg'].map(size=>box('alert-'+size,h(DsAlert,{props:{size,title:'알림 제목',closable:true}},'알림 설명'))),
      ...['xs','sm','md','lg','xl'].map(size=>box('icon-'+size,h(DsIconToggle,{props:{size,activeIcon:'heart',ariaLabel:'아이콘 '+size,active:this.active},on:{toggle:()=>{this.active=!this.active;}}}))),
      ...['xs','sm','md'].map(size=>box('copy-'+size,h(DsCopyButton,{props:{value:'복사 값',size,ariaLabel:'복사 '+size,copyText:async()=>{}}}))),
    ])]);
  },
}).$mount('#root');
