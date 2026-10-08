import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFeedbackController} from '../packages/tokens/dist/index.js';
test('feedback requests are FIFO, typed on cancellation, and stale settlements cannot affect the next request',async()=>{
 const c=createFeedbackController();const first=c.api.confirm('first'),second=c.api.prompt({title:'second'}),third=c.api.confirm('third');
 const firstId=c.getSnapshot().current.id;assert.equal(c.getSnapshot().current.options.message,'first');
 c.settle(true);assert.equal(await first,true);assert.equal(c.getSnapshot().current.kind,'prompt');
 c.settle(false,undefined,firstId);assert.equal(c.getSnapshot().current.kind,'prompt');
 c.settle('answer');assert.equal(await second,'answer');c.settle(false);assert.equal(await third,false);assert.equal(c.getSnapshot().current,null);
});
test('disposing a scope settles every pending request and releases toast timers',async()=>{
 const c=createFeedbackController();const promises=[c.api.confirm('a'),c.api.prompt('b'),c.api.confirm('c')];
 c.api.toast.success('message',{duration:10000});c.dispose();assert.deepEqual(await Promise.all(promises),[false,null,false]);assert.deepEqual(c.getSnapshot(),{current:null,toasts:[]});
 assert.equal(await c.api.confirm('after unmount'),false);assert.equal(await c.api.prompt('after unmount'),null);
});
test('feedback controllers remain independent and a rejected confirmation advances the queue',async()=>{
 const a=createFeedbackController(),b=createFeedbackController();const promise=a.api.confirm('async');const rejected=assert.rejects(promise,/failed/);const next=a.api.prompt('next');b.api.toast.info('other',{duration:0});
 a.settle(false,new Error('failed'));await rejected;assert.equal(a.getSnapshot().current.kind,'prompt');a.dispose();assert.equal(await next,null);assert.equal(b.getSnapshot().toasts.length,1);b.dispose();
});
test('toast dismissal and persistence respect duration zero',async()=>{
 const c=createFeedbackController();const id=c.api.toast.success('persistent',{duration:0});c.api.toast.info('brief',{duration:1});await new Promise(resolve=>setTimeout(resolve,20));assert.deepEqual(c.getSnapshot().toasts.map(t=>t.id),[id]);c.api.toast.dismiss(id);assert.equal(c.getSnapshot().toasts.length,0);c.dispose();
});
test('toast defaults, capacity and hover pause follow upstream behavior',async()=>{
 const c=createFeedbackController();c.api.toast.info('info');c.api.toast.error('error');c.api.toast.warning('warning');
 assert.deepEqual(c.getSnapshot().toasts.map(t=>t.duration),[3000,5000,4000]);
 for(let i=0;i<5;i++)c.api.toast.info(String(i),{duration:0});assert.equal(c.getSnapshot().toasts.length,5);assert.equal(c.getSnapshot().toasts[0].message,'0');
 c.api.toast.clearAll();const id=c.api.toast.info('pause',{duration:40});c.pauseToast(id);await new Promise(resolve=>setTimeout(resolve,65));assert.equal(c.getSnapshot().toasts.length,1);c.resumeToast(id);await new Promise(resolve=>setTimeout(resolve,65));assert.equal(c.getSnapshot().toasts.length,0);c.dispose();
});
test('toast resumes only when every interaction owner releases its pause',()=>{
 const c=createFeedbackController();
 const id=c.api.toast.info('message',{duration:60000});
 const hover=Symbol('hover'),focus=Symbol('focus'),otherView=Symbol('focus');
 const paused=()=>c.getSnapshot().toasts[0].paused;
 c.pauseToast(id,focus);c.pauseToast(id,hover);c.resumeToast(id,hover);
 assert.equal(paused(),true,'leaving hover must preserve keyboard focus');
 c.resumeToast(id,'unknown');assert.equal(paused(),true);
 c.pauseToast(id,otherView);c.resumeToast(id,focus);
 assert.equal(paused(),true,'unmounting one view cannot release another view');
 c.pauseToast(id,otherView);c.resumeToast(id,otherView);
 assert.equal(paused(),false,'repeated focus events do not require extra releases');
 c.pauseToast(id,hover);c.api.toast.dismiss(id);c.resumeToast(id,hover);
 assert.deepEqual(c.getSnapshot().toasts,[]);
 c.dispose();
});
