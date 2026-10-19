import { createElement, useState } from 'react';
import { Text, View } from 'react-native';
import { initial as visualInitial, renderCases as visualCases } from './visual-contract-cases';
// Other fixture families pass their own cases; the adapter stays the same.
export function VisualCases({ K, native=false, initial=visualInitial, renderCases=visualCases }: { K:any; native?:boolean; initial?:any; renderCases?:(h:any,state:any,set:(key:string,value:any)=>void)=>any }) {
  const [state,setState] = useState(initial);
  const h = (name:string, props:any, children?:any, slots?:any):any => {
    if(name==='Section') return <section key={props.id} data-testid={props.id} style={{marginBottom:24,...props.style}}>{children}</section>;
    if(name==='Box') return native ? <View key={props.testId} testID={props.testId} style={props.style}/> : <div key={props.testId} data-testid={props.testId} style={props.style}/>;
    if(name==='Output') return <output key={props.id} data-testid={props.id} style={{display:"block",overflowWrap:"anywhere",fontSize:12}}>{children}</output>;
    if(name==='Text') return native ? <Text>{children}</Text> : <p style={{margin:0}}>{children}</p>;
    if(name==='Label') return native ? <Text>{children}</Text> : <label htmlFor={props.for}>{children}</label>;
    const adapted = native && props.onClick ? {...props,onPress:props.onClick,onClick:undefined} : props;
    return createElement(K[name],{...adapted,...slots},children);
  };
  return <main style={{padding:16,maxWidth:800}}>{renderCases(h,state,(key,value)=>setState(s=>({...s,[key]:value})))}</main>;
}
