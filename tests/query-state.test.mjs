import test from 'node:test';
import assert from 'node:assert/strict';
import {initialQueryDisplay,advanceQueryDisplay,queryDisplayStatus} from '../packages/tokens/dist/index.js';
test('query contract separates first load, changed conditions, refresh and retry',()=>{
 let props={queryKey:'a',resultKey:null,loading:true};let state=initialQueryDisplay(props);
 assert.equal(queryDisplayStatus(state,props).initialLoading,true);
 props={queryKey:'a',resultKey:'a',loading:false};state=advanceQueryDisplay(state,props);
 assert.equal(queryDisplayStatus(state,props).hasCurrentResult,true);
 props={...props,loading:true};state=advanceQueryDisplay(state,props);
 assert.equal(queryDisplayStatus(state,props).queryRefreshing,true);
 props={...props,loading:false,error:'failed'};state=advanceQueryDisplay(state,props);
 assert.equal(queryDisplayStatus(state,props).hasCurrentResult,true);
 props={queryKey:'b',resultKey:'a',loading:true};state=advanceQueryDisplay(state,props);
 assert.equal(queryDisplayStatus(state,props).hasCurrentResult,false);
 assert.equal(queryDisplayStatus(state,props).initialLoading,true);
 props={...props,loading:false,error:'failed'};state=advanceQueryDisplay(state,props);
 assert.equal(queryDisplayStatus(state,props).hasCurrentResult,false);
 props={queryKey:'b',resultKey:'b',loading:false};state=advanceQueryDisplay(state,props);
 assert.equal(queryDisplayStatus(state,props).hasCurrentResult,true);
});
test('explicit result key prevents a late result from becoming the current query',()=>{
 let props={queryKey:'new',resultKey:'old',loading:true};let state=initialQueryDisplay(props);
 props={...props,loading:false};state=advanceQueryDisplay(state,props);
 assert.equal(queryDisplayStatus(state,props).hasCurrentResult,false);
});
test('a cancelled or failed first request does not establish a successful result',()=>{
 let props={queryKey:'a',loading:true};let state=initialQueryDisplay(props);
 props={queryKey:'a',loading:false,error:'aborted'};state=advanceQueryDisplay(state,props);
 assert.equal(queryDisplayStatus(state,props).hasCurrentResult,false);
 props={queryKey:'a',loading:true};state=advanceQueryDisplay(state,props);
 props={queryKey:'a',loading:false};state=advanceQueryDisplay(state,props);
 assert.equal(queryDisplayStatus(state,props).hasCurrentResult,true);
});
