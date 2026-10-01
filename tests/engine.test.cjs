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
const invalid=E.clone(E.defaults);invalid.levels[4].transforms=E.transforms.slice(0,3);
assert(E.validate(invalid).length>0);invalid.levels[4].count=0;assert.equal(E.validate(invalid).length,0);
const disabled=E.clone(E.defaults);disabled.levels[5].enabled=false;assert.equal(E.buildPlan(disabled).length,5);
const used=[];for(let i=0;i<3;i++){const chosen=E.selectQuestion(1,E.defaults.levels[0],used,()=>.2);used.push(E.signature(chosen));}assert.equal(new Set(used).size,3);
assert.deepEqual(E.graphRange(q),{min:-1.5,max:1.5,step:.5});
assert.deepEqual(E.defaults.levels.map(l=>l.seconds),[30,40,50,60,80,100]);
const badTime=E.clone(E.defaults);badTime.levels[0].seconds=15;assert(E.validate(badTime).length>0);
const oldSettings=E.clone(E.defaults);oldSettings.passScore=60;oldSettings.levels.forEach(l=>delete l.seconds);const migrated=E.normalizeSettings(oldSettings);assert.equal(E.validate(migrated).length,0);assert.equal('passScore' in migrated,false);
console.log('通過：'+tested+' 種題型、滿分參考圖、振幅／難度、漏畫扣分、墨水恢復與設定驗證。');
