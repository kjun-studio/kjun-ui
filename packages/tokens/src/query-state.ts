export interface QueryDisplayProps {queryKey?:string|number|null;resultKey?:string|number|null;loading?:boolean;error?:string|null;hasLoadedOnce?:boolean}
export interface QueryDisplayState {queryKey:string|number|null;resultKey:string|number|null|undefined;loading:boolean;pending:string|number|null;completed:string|number|null;hasResult:boolean}
export function initialQueryDisplay(props:QueryDisplayProps):QueryDisplayState {
 const key=props.queryKey??null;const supplied=props.resultKey!==undefined&&props.resultKey!==null;
 const loaded=key!==null&&!!props.hasLoadedOnce&&!props.loading&&!props.error;
 return {queryKey:key,resultKey:props.resultKey,loading:!!props.loading,pending:props.loading?key:null,completed:supplied?props.resultKey!:loaded?key:null,hasResult:supplied||loaded};
}
export function advanceQueryDisplay(previous:QueryDisplayState,props:QueryDisplayProps):QueryDisplayState {
 const state={...previous,queryKey:props.queryKey??null,resultKey:props.resultKey,loading:!!props.loading};
 if(state.resultKey!==previous.resultKey&&state.resultKey!=null){state.completed=state.resultKey;state.hasResult=true}
 if(state.queryKey!==null){
  if(state.loading)state.pending=state.queryKey;
  else if(previous.loading&&!props.error&&state.pending===state.queryKey){state.completed=state.queryKey;state.hasResult=true}
 }
 return state;
}
export function queryDisplayStatus(state:QueryDisplayState,props:QueryDisplayProps) {
 const usesQueryState=(props.queryKey??null)!==null;
 const hasCurrentResult=usesQueryState?props.resultKey!==undefined?props.resultKey===props.queryKey:state.hasResult&&state.completed===props.queryKey:!!props.hasLoadedOnce;
 return {usesQueryState,hasCurrentResult,hasQueryResult:state.hasResult,initialLoading:!!props.loading&&!hasCurrentResult,queryRefreshing:usesQueryState&&!!props.loading&&hasCurrentResult};
}
