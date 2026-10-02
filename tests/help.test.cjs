const assert=require('node:assert/strict'),E=require('../engine.js');
const q={kind:'base',type:'sin',a:1,b:1,h:0,d:0,star:1};
for(let i=0;i<8;i++){
 const b=E.helpBounds(i);assert(Math.abs(b.max-b.min-Math.PI/2)<1e-12);
 assert.equal(E.isHelpX((b.min+b.max)/2,[i]),true);
}
const selected=[];for(let i=0;i<8;i++)selected.push(E.nextHelpInterval(selected,()=>.5));
assert.equal(new Set(selected).size,8);assert.equal(E.nextHelpInterval(selected),null);
for(const indices of [[0],[3],[7],[0,3,7],[2,3,4]]){
 for(const direction of [1,-1]){
  const line=[[{x:direction*E.XMIN,y:-.7},{x:direction*E.XMAX,y:.7}]],clipped=E.clipStrokes(line,indices);
  assert(clipped.length>0);
  for(const i of indices){const b=E.helpBounds(i);assert.equal(E.intersections(clipped,(b.min+b.max)/2).length,0);}
  for(const path of clipped){for(const p of path)assert.equal(E.isHelpX(p.x,indices),false);for(let j=1;j<path.length;j++)assert.equal(E.isHelpX((path[j-1].x+path[j].x)/2,indices),false);}
 }
}
assert.equal(E.clipStrokes([[{x:0,y:-1},{x:0,y:1}]],[4]).length,0);
assert.equal(E.clipStrokes([[{x:0,y:0}]],[3]).length,0);
assert.equal(E.clipStrokes([[{x:-3,y:0}]],[4]).length,1);
for(const question of [q,{...q,type:'tan',a:4,b:2,h:Math.PI/2,d:-2,star:5},{kind:'sum',a:Math.SQRT2,c:-Math.SQRT2,star:6}]){
 const full=E.targetPaths(question);
 for(let n=0;n<=3;n++){
  const help=[0,3,7].slice(0,n),result=E.score(question,E.clipStrokes(full,help),help);
  assert.equal(result.score,[100,80,64,51][n]);assert(Math.abs(result.rawScore-100)<1e-8);
  for(const path of E.helpPaths(question,help))for(const p of path){assert(E.isHelpX(p.x,help));assert(Number.isFinite(p.y));}
 }
}
assert.equal(E.score(q,[],[0]).score,10);assert.equal(E.score(q,[],[0,1,2]).score,19);
assert.equal(E.score(q,[],[0,0]).helpCount,1);
// Verify rounding happens after the multiplier: this case differs from rounding first.
let found=false;for(let offset=.13;offset<.9;offset+=.0005){
 const paths=E.targetPaths(q).map(path=>path.map(p=>({x:p.x,y:p.y+offset}))),r=E.score(q,paths,[0]);
 assert.equal(r.score,Math.round(r.rawScore*.8));
 if(r.score!==Math.round(Math.round(r.rawScore)*.8)){found=true;break;}
}assert(found);
for(const max of [0,1,2,3]){const s=E.clone(E.defaults);s.helpCards=max;assert.equal(E.validate(s).length,0);}
const bad=E.clone(E.defaults);bad.helpCards=4;assert(E.validate(bad).length>0);
const legacy=E.clone(E.defaults);delete legacy.helpCards;assert.equal(E.normalizeSettings(legacy).helpCards,3);
console.log('通過：求救區間不重複、線段裁切與邊界鎖定、三類函數揭示、倍率與最後四捨五入、設定移轉。');
