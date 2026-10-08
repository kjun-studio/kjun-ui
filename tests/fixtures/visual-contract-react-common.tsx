import { createElement, useState } from 'react';
import { Text } from 'react-native';
import { initial, renderCases } from './visual-contract-cases';
export function VisualCases({ K, native=false }: { K:any; native?:boolean }) {
  const [state,setState] = useState(initial);
  const h = (name:string, props:any, children?:any, slots?:any):any => {
    if(name==='Section') return <section key={props.id} data-testid={props.id} style={{marginBottom:24,...props.style}}>{children}</section>;
    if(name==='Output') return <output key={props.id} data-testid={props.id} style={{display:"block",overflowWrap:"anywhere",fontSize:12}}>{children}</output>;
    if(name==='Text') return native ? <Text>{children}</Text> : <p style={{margin:0}}>{children}</p>;
    const adapted = native && props.onClick ? {...props,onPress:props.onClick,onClick:undefined} : props;
    return createElement(K[name],{...adapted,...slots},children);
  };
  return <main style={{padding:16,maxWidth:800}}>{renderCases(h,state,(key,value)=>setState(s=>({...s,[key]:value})))}</main>;
}
