(function(root){
'use strict';
const PI=Math.PI, XMIN=-2*PI,XMAX=2*PI,YMAX=6;
const transforms=['horizontalShift','horizontalScale','verticalScale','verticalShift'];
const timeDefaults=[30,40,50,60,80,100];
const defaults={theme:'light',gridColor:'#dce5f0',gridWidth:1,seatMin:1,seatMax:30,levels:Array.from({length:6},(_,i)=>({count:1,seconds:timeDefaults[i],types:['sin','cos','tan'],transforms:[...transforms],enabled:true}))};
const clone=x=>JSON.parse(JSON.stringify(x));
function normalizeSettings(saved){
 const s={...clone(defaults),...saved};
 s.levels=defaults.levels.map((level,i)=>({...clone(level),...(saved?.levels?.[i]||{})}));
 delete s.passScore;return s;
}
function graphRange(q){
 if(!q)return {min:-6,max:6,step:1};
 const amplitude=q.kind==='sum'?Math.hypot(q.a,q.c):Math.abs(q.a),center=q.d||0;
 const half=q.type==='tan'?Math.max(2,amplitude*2):amplitude;
 const pad=q.type==='tan'?.5:Math.max(.5,Math.ceil(amplitude*.25*2)/2);
 let min=Math.floor((Math.min(0,center-half)-pad)*2)/2;
 let max=Math.ceil((Math.max(0,center+half)+pad)*2)/2;
 const step=max-min<=5?.5:1;
 if(step===1){min=Math.floor(min);max=Math.ceil(max);}
 return {min,max,step};
}
function combinations(a,n){if(n===0)return [[]];if(a.length<n)return [];return a.flatMap((v,i)=>combinations(a.slice(i+1),n-1).map(c=>[v,...c]));}
function frac(a,b){return '<span class="frac"><span>'+a+'</span><span>'+b+'</span></span>';}
function phase(h){let k=Math.round(Math.abs(h)/PI*2);return k===1?frac('π','2'):k===2?'π':k===3?frac('3π','2'):'2π';}
function formula(q){
if(q.kind==='sum'){const term=(v,t)=>{let a=Math.abs(v),c=Math.abs(a-1)<1e-8?'':Math.abs(a-Math.sqrt(2))<1e-8?'√2':Math.abs(a-2*Math.sqrt(2))<1e-8?'2√2':String(a);return c+t+' x';};return 'f(x) = '+(q.a<0?'−':'')+term(q.a,'sin')+(q.c<0?' − ':' + ')+term(q.c,'cos');}
let inner=q.b===1?'x':q.b===2?'2x':frac('x','2');
if(q.h){const base='x'+(q.h>0?' − ':' + ')+phase(q.h);inner=q.b===1?base:q.b===2?'2('+base+')':frac(base,'2');}
return 'f(x) = '+(q.a===1?'':q.a)+q.type+'('+inner+')'+(q.d?(q.d>0?' + ':' − ')+Math.abs(q.d):'');
}
function evaluate(q,x){if(q.kind==='sum')return q.a*Math.sin(x)+q.c*Math.cos(x);const u=q.b*(x-q.h);if(q.type==='tan'&&Math.abs(Math.cos(u))<1e-9)return NaN;return q.a*Math[q.type](u)+q.d;}
function questionPool(star,level){
if(star===6){const pairs=[[1,1],[Math.sqrt(2),Math.sqrt(2)],[2,2],[2*Math.sqrt(2),2*Math.sqrt(2)]];return pairs.flatMap(([a,c])=>[1,-1].flatMap(s=>[1,-1].map(t=>({kind:'sum',a:a*s,c:c*t,star}))));}
return level.types.flatMap(type=>combinations(level.transforms,star-1).flatMap(chosen=>{
let list=[{kind:'base',type,a:1,b:1,h:0,d:0,star}];
for(const key of chosen){let vals=key==='horizontalShift'?[-PI,-PI/2,PI/2,PI]:key==='horizontalScale'?[.5,2]:key==='verticalScale'?[2,3,4]:[-2,-1,1,2];const field={horizontalShift:'h',horizontalScale:'b',verticalScale:'a',verticalShift:'d'}[key];list=list.flatMap(q=>vals.map(v=>({...q,[field]:v})));}return list;
}));
}
function signature(q){return [q.kind,q.type,q.a,q.b,q.h,q.d,q.c].join('|');}
function selectQuestion(star,level,avoid=[],rng=Math.random){const pool=questionPool(star,level),filtered=pool.filter(q=>!avoid.includes(signature(q))),choices=filtered.length?filtered:pool;if(!choices.length)throw Error('沒有可用題目');return {...choices[Math.floor(rng()*choices.length)]};}
function validate(s){
 let errors=[];
 if(!Number.isInteger(s.seatMin)||!Number.isInteger(s.seatMax)||s.seatMin<1||s.seatMax>99||s.seatMax<s.seatMin)errors.push('座號範圍需介於 1～99，終點不可小於起點。');
 let total=0;
 for(let i=0;i<6;i++){
  let l=s.levels[i];
  if(!Number.isInteger(l.count)||l.count<0||l.count>20)errors.push((i+1)+' 星題數需為 0～20。');
  if(!Number.isInteger(l.seconds)||l.seconds<10||l.seconds>300||l.seconds%10!==0)errors.push((i+1)+' 星限時需為 10～300 秒，且是 10 的倍數。');
  if(i===5&&!l.enabled)continue;total+=l.count;
  if(l.count>0&&i<5){
   if(!l.types.length)errors.push((i+1)+' 星請至少選一種函數。');
   if(i>0&&l.transforms.length<i)errors.push((i+1)+' 星需要至少勾選 '+i+' 種變化；若不使用請將題數設為 0。');
  }
 }
 if(total===0)errors.push('至少需開啟一個星等並設定題數。');return errors;
}
function buildPlan(s){return s.levels.flatMap((l,i)=>i===5&&!l.enabled?[]:Array.from({length:l.count},()=>i+1));}
function mergeYs(ys,tolerance=.16){let a=ys.filter(Number.isFinite).sort((a,b)=>a-b),out=[];for(let y of a){if(!out.length||y-out[out.length-1]>tolerance)out.push(y);else out[out.length-1]=(out[out.length-1]+y)/2;}return out;}
function intersections(strokes,x,tolerance=.16){let ys=[];for(let stroke of strokes){if(stroke.length===1&&Math.abs(stroke[0].x-x)<.018)ys.push(stroke[0].y);for(let i=1;i<stroke.length;i++){let a=stroke[i-1],b=stroke[i];if(x<Math.min(a.x,b.x)-1e-9||x>Math.max(a.x,b.x)+1e-9)continue;if(Math.abs(b.x-a.x)<1e-9){ys.push(a.y,b.y,(a.y+b.y)/2);}else ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}}return mergeYs(ys,tolerance);}
function sampleXs(){return Array.from({length:40},(_,i)=>XMIN+(i+.5)*(XMAX-XMIN)/40);}
function score(q,strokes){
 let points=[],sum=0,visible=0,covered=0,range=graphRange(q);
 for(let x of sampleXs()){
  let target=evaluate(q,x);
  if(!Number.isFinite(target)||target<range.min-1e-8||target>range.max+1e-8){points.push({x,target,excluded:true});continue;}
  visible++;let ys=intersections(strokes,x,.16*(range.max-range.min)/12),value=0;
  if(ys.length){covered++;value=ys.reduce((s,y)=>s+Math.max(0,1-Math.max(0,Math.abs(y-target)-.12)/.8),0)/ys.length;value/=Math.sqrt(ys.length);}
  sum+=value;points.push({x,target,ys,value,excluded:false});
 }
 return {score:visible?Math.round(100*sum/visible):0,coverage:visible?Math.round(100*covered/visible):0,visible,covered,points};
}
function length(strokes,range={min:-6,max:6}){
 let result=0;for(let s of strokes)for(let i=1;i<s.length;i++)result+=Math.hypot((s[i].x-s[i-1].x)/(XMAX-XMIN)*600,(s[i].y-s[i-1].y)/(range.max-range.min)*500);return result;
}
function targetPaths(q,n=1200){
 let paths=[],path=[],range=graphRange(q);
 for(let i=0;i<=n;i++){
  let x=XMIN+(XMAX-XMIN)*i/n,y=evaluate(q,x);
  const visible=Number.isFinite(y)&&y>=range.min-1e-8&&y<=range.max+1e-8;
  if(!visible||(path.length&&Math.abs(path[path.length-1].y-y)>(range.max-range.min)/4)){if(path.length>1)paths.push(path);path=[];}
  if(visible)path.push({x,y});
 }
 if(path.length>1)paths.push(path);return paths;
}
function inkBudget(q){return Math.max(1300,length(targetPaths(q),graphRange(q))*1.75+400);}
function tooManyYs(strokes,range={min:-6,max:6}){
const unit=(range.max-range.min)/12;
// Exact x intersections on a narrow lattice; also test vertical segment x positions.
const n=512,bins=Array.from({length:n+1},()=>[]);
for(let s of strokes)for(let i=1;i<s.length;i++){const a=s[i-1],b=s[i],lo=Math.max(0,Math.ceil((Math.min(a.x,b.x)-XMIN)/(XMAX-XMIN)*n)),hi=Math.min(n,Math.floor((Math.max(a.x,b.x)-XMIN)/(XMAX-XMIN)*n));if(Math.abs(b.x-a.x)<.0001){const k=Math.round((a.x-XMIN)/(XMAX-XMIN)*n);if(k>=0&&k<=n){let steps=Math.max(1,Math.ceil(Math.abs(b.y-a.y)/(.2*unit)));for(let j=0;j<=steps;j++)bins[k].push(a.y+(b.y-a.y)*j/steps);}}else for(let k=lo;k<=hi;k++){let x=XMIN+k/n*(XMAX-XMIN);bins[k].push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}}
return bins.some(ys=>mergeYs(ys,.18*unit).length>6);
}
function erase(strokes,center,radius,range={min:-6,max:6}){let out=[];for(let stroke of strokes){let path=[];for(let p of stroke){if(Math.hypot((p.x-center.x)/(XMAX-XMIN)*600,(p.y-center.y)/(range.max-range.min)*500)<=radius){if(path.length>1)out.push(path);path=[];}else path.push(p);}if(path.length>1)out.push(path);}return out;}
const api={PI,XMIN,XMAX,YMAX,transforms,defaults,timeDefaults,clone,normalizeSettings,graphRange,formula,evaluate,questionPool,signature,selectQuestion,validate,buildPlan,score,intersections,sampleXs,length,targetPaths,inkBudget,tooManyYs,erase};root.TrigEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
