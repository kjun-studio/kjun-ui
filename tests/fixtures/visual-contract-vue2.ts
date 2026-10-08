import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { initial, renderCases } from './visual-contract-cases';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
new Vue({
  data:()=>({...initial}),
  render(create) {
    const h = (name:string,props:any,children?:any,slots?:any):any => {
      if(name==='Section') return create('section',{key:props.id,attrs:{'data-testid':props.id},style:{marginBottom:'24px',...props.style,width:typeof props.style?.width==='number'?`${props.style.width}px`:props.style?.width}},[children]);
      if(name==='Output') return create('output',{attrs:{'data-testid':props.id},style:{display:'block',overflowWrap:'anywhere',fontSize:'12px'}},[children]);
      if(name==='Text') return create('p',{style:{margin:0}},[children]);
      const on:any={}, passed:any={...props};
      for(const [key,event] of Object.entries({onClick:'click',onValueChange:'input',onOpenChange:'input',onRetry:'retry',onConfirm:'confirm',onNavigate:'navigate'})) {
        if(passed[key]) {on[event]=passed[key];delete passed[key];}
      }
      if(name==='DsPopover') {passed.value=passed.open;delete passed.open;}
      const nodes=Array.isArray(children)?children:children==null?[]:[children];
      const named=Object.entries(slots||{}).map(([slot,node])=>create('template',{slot},[node as any]));
      return create((K as any)[name],{props:passed,on},[...nodes,...named]);
    };
    return create(K.KjunProvider,[create('main',{style:{padding:'16px',maxWidth:'800px'}},renderCases(h,Object.fromEntries(Object.keys(initial).map(key=>[key,(this as any)[key]])) as typeof initial,(key,value)=>{(this as any)[key]=value;}))]);
  },
}).$mount('#root');
