const assert=require('node:assert/strict');
const E=require('../engine.js');
let tested=0;
for(let star=1;star<=6;star++)for(const q of E.questionPool(star,E.defaults.levels[star-1])){
  const paths=E.targetPaths(q),range=E.graphRange(q);
  assert.equal(E.score(q,paths).score,100,'正確參考圖應得滿分：'+E.signature(q));
  assert.equal(E.tooManyYs(paths,range),false,'正確函數不可觸發多值限制');
  assert(E.length(paths,range)<E.inkBudget(q),'標準曲線需有足夠墨水');
  if(q.kind==='sum')assert(Math.hypot(q.a,q.c)<=4+1e-8);
  else assert.equal(Number(q.a!==1)+Number(q.b!==1)+Number(q.h!==0)+Number(q.d!==0),star-1);
  tested++;
}
const q={kind:'base',type:'sin',a:1,b:1,h:0,d:0,star:1};
assert.equal(E.sampleXs().length,40);
assert.equal(E.score(q,[]).score,0);
assert.equal(E.score(q,E.targetPaths(q).map(s=>s.filter(p=>p.x<=0))).score,50);
assert(E.score(q,[[{x:E.XMIN,y:0},{x:E.XMAX,y:0}]]).score<60);
const seven=Array.from({length:7},(_,i)=>[{x:-.2,y:(i-3)*.2},{x:.2,y:(i-3)*.2}]);
assert.equal(E.tooManyYs(seven),true);
assert.equal(E.tooManyYs(E.erase(seven,{x:0,y:0},22)),false);
const invalid=E.clone(E.defaults);invalid.levels[4].count=1;invalid.levels[4].transforms=E.transforms.slice(0,3);
assert(E.validate(invalid).length>0);invalid.levels[4].count=0;assert.equal(E.validate(invalid).length,0);
const disabled=E.clone(E.defaults);disabled.levels[5].enabled=false;assert.equal(E.buildPlan(disabled).length,3);
const used=[];for(let i=0;i<3;i++){const chosen=E.selectQuestion(1,E.defaults.levels[0],used,()=>.2);used.push(E.signature(chosen));}assert.equal(new Set(used).size,3);
assert.deepEqual(E.graphRange(q),{min:-1.5,max:1.5,step:.5});
assert.deepEqual(E.graphRange({kind:'sum',a:Math.SQRT2,c:Math.SQRT2}),{min:-2.5,max:2.5,step:.5});
assert.deepEqual(E.defaults.levels.map(l=>l.seconds),[40,60,80,100,100,120]);
assert.deepEqual(E.defaults.levels.map(l=>l.count),[1,1,1,0,0,1]);
assert.equal(E.defaults.theme,'dark');assert.equal(E.defaults.gridWidth,1.5);
const badTime=E.clone(E.defaults);badTime.levels[0].seconds=15;assert(E.validate(badTime).length>0);
const oldSettings=E.clone(E.defaults);oldSettings.passScore=60;oldSettings.levels.forEach(l=>delete l.seconds);const migrated=E.normalizeSettings(oldSettings);assert.equal(E.validate(migrated).length,0);assert.equal('passScore' in migrated,false);
const former=E.clone(E.defaults);delete former.version;former.theme='light';former.gridColor='#dce5f0';former.gridWidth=1;former.levels.forEach((l,i)=>{l.count=1;l.seconds=[30,40,50,60,80,100][i];});assert.deepEqual(E.normalizeSettings(former),E.defaults);
const custom=E.clone(former);custom.levels[0].count=3;custom.levels[1].seconds=150;custom.gridWidth=3;const upgraded=E.normalizeSettings(custom);assert.equal(upgraded.levels[0].count,3);assert.equal(upgraded.levels[1].seconds,150);assert.equal(upgraded.gridWidth,3);assert.deepEqual(E.normalizeSettings(upgraded),upgraded);
let seed=91;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
for(const range of [{min:-6,max:6},{min:-1.5,max:1.5},{min:-1,max:7}]){
 const strokes=[],tracker=E.createInkTracker([],range);
 for(let s=0;s<8;s++){
  const stroke=[{x:E.XMIN+rng()*4*Math.PI,y:range.min+rng()*(range.max-range.min)}];strokes.push(stroke);
  for(let i=1;i<30;i++){const previous=stroke.at(-1),next={x:i%4?E.XMIN+rng()*4*Math.PI:previous.x,y:range.min+rng()*(range.max-range.min)};stroke.push(next);tracker.addSegment(previous,next);}
  assert(Math.abs(tracker.length-E.length(strokes,range))<1e-8);assert.equal(tracker.tooMany,E.tooManyYs(strokes,range));
 }
 const rebuilt=E.createInkTracker(strokes,range);assert.equal(rebuilt.tooMany,tracker.tooMany);assert.equal(rebuilt.length,tracker.length);
}
const sweepLine=[Array.from({length:101},(_,i)=>({x:-2+i*.04,y:0}))];
const swept=E.eraseSweep(sweepLine,{x:-.5,y:0},{x:.5,y:0},22);assert.equal(swept.length,2);assert.equal(E.intersections(swept,0).length,0);assert.equal(E.intersections(swept,-1.5).length,1);
console.log('通過：'+tested+' 種題型、滿分參考圖、振幅／難度、漏畫扣分、墨水恢復與設定驗證。');
