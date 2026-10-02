(function(root){
'use strict';
const PI=Math.PI, XMIN=-2*PI,XMAX=2*PI,YMAX=6;
const transforms=['horizontalShift','horizontalScale','verticalScale','verticalShift'];
const timeDefaults=[40,60,80,100,100,120],countDefaults=[1,1,1,0,0,1];
const defaults={version:2,theme:'dark',gridColor:'#2a3b54',gridWidth:1.5,axisFontSize:16,axisLabelColor:'#a8b9cf',helpCards:3,seatMin:1,seatMax:30,levels:Array.from({length:6},(_,i)=>({count:countDefaults[i],seconds:timeDefaults[i],types:['sin','cos','tan'],transforms:[...transforms],enabled:true}))};
const clone=x=>JSON.parse(JSON.stringify(x));
function normalizeSettings(saved){
 const s={...clone(defaults),...saved};
 s.levels=defaults.levels.map((level,i)=>({...clone(level),...(saved?.levels?.[i]||{})}));
 // Upgrade former defaults once, keeping values that teachers customized.
 if(saved&&saved.version!==2){
  if(saved.theme==='light')s.theme='dark';
  if(saved.gridColor==='#dce5f0')s.gridColor='#2a3b54';
  if(saved.gridWidth===1)s.gridWidth=1.5;
  const formerTimes=[30,40,50,60,80,100];
  s.levels.forEach((level,i)=>{if(saved.levels?.[i]?.seconds===formerTimes[i])level.seconds=timeDefaults[i];});
  if(saved.levels?.every(level=>level.count===1))s.levels.forEach((level,i)=>level.count=countDefaults[i]);
 }
 s.version=2;
 if(!saved?.axisLabelColor)s.axisLabelColor=s.theme==='dark'?'#a8b9cf':'#65778c';
 delete s.passScore;return s;
}
function graphRange(q){
 if(!q)return {min:-6,max:6,step:1};
 const amplitude=q.kind==='sum'?Math.hypot(q.a,q.c):Math.abs(q.a),center=q.d||0;
 const half=q.type==='tan'?Math.max(2,amplitude*2):amplitude;
 const pad=q.type==='tan'?.5:Math.max(.5,Math.ceil(amplitude*.25*2-1e-9)/2);
 let min=Math.floor((Math.min(0,center-half)-pad)*2+1e-9)/2;
 let max=Math.ceil((Math.max(0,center+half)+pad)*2-1e-9)/2;
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
 if(!Number.isInteger(s.helpCards)||s.helpCards<0||s.helpCards>3)errors.push('每題求救卡需設定為 0～3 張。');
 if(!Number.isInteger(s.axisFontSize)||s.axisFontSize<10||s.axisFontSize>28)errors.push('座標標示文字大小需為 10～28 px 的整數。');
 if(!/^#[0-9a-f]{6}$/i.test(s.axisLabelColor))errors.push('請選擇有效的座標標示文字顏色。');
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
function helpBounds(index){return {min:XMIN+index*PI/2,max:XMIN+(index+1)*PI/2};}
function isHelpX(x,intervals=[]){return intervals.some(i=>{const b=helpBounds(i);return x>=b.min&&x<=b.max;});}
function nextHelpInterval(used=[],rng=Math.random){const available=Array.from({length:8},(_,i)=>i).filter(i=>!used.includes(i));return available.length?available[Math.min(available.length-1,Math.floor(rng()*available.length))]:null;}
function openSegments(a,b,intervals=[]){
 if(!intervals.length)return [[a,b]];
 const dx=b.x-a.x,dy=b.y-a.y;if(Math.abs(dx)<1e-12)return isHelpX(a.x,intervals)?[]:[[a,b]];
 const cuts=[0,1];for(const i of intervals){const bounds=helpBounds(i);for(const x of [bounds.min,bounds.max]){const t=(x-a.x)/dx;if(t>0&&t<1)cuts.push(t);}}
 cuts.sort((a,b)=>a-b);const out=[],point=t=>({x:a.x+dx*t,y:a.y+dy*t});
 for(let j=1;j<cuts.length;j++){
  let from=cuts[j-1],to=cuts[j];if(to-from<1e-12||isHelpX(a.x+dx*(from+to)/2,intervals))continue;
  // Leave a negligible gap at a closed locked boundary, preserving stroke direction.
  const pad=Math.min(1e-7/Math.abs(dx),(to-from)/4);
  if(isHelpX(point(from).x,intervals))from+=pad;if(isHelpX(point(to).x,intervals))to-=pad;
  out.push([point(from),point(to)]);
 }return out;
}
function clipStrokes(strokes,intervals=[]){
 if(!intervals.length)return strokes;
 const out=[],same=(a,b)=>a&&b&&Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9;
 for(const stroke of strokes){
  if(stroke.length===1){if(!isHelpX(stroke[0].x,intervals))out.push(stroke);continue;}
  let path=[];function flush(){if(path.length)out.push(path);path=[];}
  for(let j=1;j<stroke.length;j++){
   const pieces=openSegments(stroke[j-1],stroke[j],intervals);if(!pieces.length){flush();continue;}
   for(const [a,b] of pieces){if(!same(path[path.length-1],a)){flush();path=[a];}if(!same(path[path.length-1],b))path.push(b);}
  }flush();
 }return out;
}
function score(q,strokes,helpIntervals=[]){
 const help=[...new Set(helpIntervals)].filter(i=>Number.isInteger(i)&&i>=0&&i<8);
 let points=[],sum=0,visible=0,covered=0,range=graphRange(q);
 for(let x of sampleXs()){
  let target=evaluate(q,x);
  if(!Number.isFinite(target)||target<range.min-1e-8||target>range.max+1e-8){points.push({x,target,excluded:true});continue;}
  const assisted=isHelpX(x,help);
  visible++;let ys=assisted?[target]:intersections(strokes,x,.16*(range.max-range.min)/12),value=0;
  if(ys.length){covered++;value=ys.reduce((s,y)=>s+Math.max(0,1-Math.max(0,Math.abs(y-target)-.12)/.8),0)/ys.length;value/=Math.sqrt(ys.length);}
  sum+=value;points.push({x,target,ys,value,excluded:false,assisted});
 }
 const rawScore=visible?100*sum/visible:0,factor=.8**help.length;
 return {score:Math.round(rawScore*factor),rawScore,helpCount:help.length,factor,coverage:visible?Math.round(100*covered/visible):0,visible,covered,points};
}
function length(strokes,range={min:-6,max:6}){
 let result=0;for(let s of strokes)for(let i=1;i<s.length;i++)result+=Math.hypot((s[i].x-s[i-1].x)/(XMAX-XMIN)*600,(s[i].y-s[i-1].y)/(range.max-range.min)*500);return result;
}
function targetPaths(q,n=1200,from=XMIN,to=XMAX){
 let paths=[],path=[],range=graphRange(q);
 for(let i=0;i<=n;i++){
  let x=from+(to-from)*i/n,y=evaluate(q,x);
  const visible=Number.isFinite(y)&&y>=range.min-1e-8&&y<=range.max+1e-8;
  if(!visible||(path.length&&Math.abs(path[path.length-1].y-y)>(range.max-range.min)/4)){if(path.length>1)paths.push(path);path=[];}
  if(visible)path.push({x,y});
 }
 if(path.length>1)paths.push(path);return paths;
}
function helpPaths(q,intervals=[]){return intervals.flatMap(i=>{const b=helpBounds(i);return targetPaths(q,150,b.min,b.max);});}
function inkBudget(q){return Math.max(1300,length(targetPaths(q),graphRange(q))*1.75+400);}
function tooManyYs(strokes,range={min:-6,max:6}){
const unit=(range.max-range.min)/12;
// Exact x intersections on a narrow lattice; also test vertical segment x positions.
const n=512,bins=Array.from({length:n+1},()=>[]);
for(let s of strokes)for(let i=1;i<s.length;i++){const a=s[i-1],b=s[i],lo=Math.max(0,Math.ceil((Math.min(a.x,b.x)-XMIN)/(XMAX-XMIN)*n)),hi=Math.min(n,Math.floor((Math.max(a.x,b.x)-XMIN)/(XMAX-XMIN)*n));if(Math.abs(b.x-a.x)<.0001){const k=Math.round((a.x-XMIN)/(XMAX-XMIN)*n);if(k>=0&&k<=n){let steps=Math.max(1,Math.ceil(Math.abs(b.y-a.y)/(.2*unit)));for(let j=0;j<=steps;j++)bins[k].push(a.y+(b.y-a.y)*j/steps);}}else for(let k=lo;k<=hi;k++){let x=XMIN+k/n*(XMAX-XMIN);bins[k].push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}}
return bins.some(ys=>mergeYs(ys,.18*unit).length>6);
}
function createInkTracker(strokes=[],range={min:-6,max:6}){
 const n=512,span=XMAX-XMIN,unit=(range.max-range.min)/12;
 const bins=Array.from({length:n+1},()=>[]),over=Array(n+1).fill(false);
 let total=0,overCount=0;
 function refresh(k){const next=mergeYs(bins[k],.18*unit).length>6;if(next!==over[k]){overCount+=next?1:-1;over[k]=next;}}
 function addSegment(a,b,initializing=false){
  total+=Math.hypot((b.x-a.x)/span*600,(b.y-a.y)/(range.max-range.min)*500);
  const lo=Math.max(0,Math.ceil((Math.min(a.x,b.x)-XMIN)/span*n)),hi=Math.min(n,Math.floor((Math.max(a.x,b.x)-XMIN)/span*n));
  if(Math.abs(b.x-a.x)<.0001){
   const k=Math.round((a.x-XMIN)/span*n);
   if(k>=0&&k<=n){const steps=Math.max(1,Math.ceil(Math.abs(b.y-a.y)/(.2*unit)));for(let j=0;j<=steps;j++)bins[k].push(a.y+(b.y-a.y)*j/steps);if(!initializing)refresh(k);}
  }else for(let k=lo;k<=hi;k++){const x=XMIN+k/n*span;bins[k].push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));if(!initializing)refresh(k);}
 }
 for(const stroke of strokes)for(let i=1;i<stroke.length;i++)addSegment(stroke[i-1],stroke[i],true);
 bins.forEach((_,k)=>refresh(k));
 return {addSegment,get length(){return total;},get tooMany(){return overCount>0;}};
}
function eraseSweep(strokes,from,to,radius,range={min:-6,max:6}){
 const sx=600/(XMAX-XMIN),sy=500/(range.max-range.min),ax=from.x*sx,ay=from.y*sy,bx=to.x*sx,by=to.y*sy;
 const dx=bx-ax,dy=by-ay,len2=dx*dx+dy*dy,out=[];
 for(const stroke of strokes){let path=[];for(const p of stroke){const px=p.x*sx,py=p.y*sy,t=len2?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/len2)):0;
  if(Math.hypot(px-ax-t*dx,py-ay-t*dy)<=radius){if(path.length>1)out.push(path);path=[];}else path.push(p);
 }if(path.length>1)out.push(path);}return out;
}
function erase(strokes,center,radius,range={min:-6,max:6}){let out=[];for(let stroke of strokes){let path=[];for(let p of stroke){if(Math.hypot((p.x-center.x)/(XMAX-XMIN)*600,(p.y-center.y)/(range.max-range.min)*500)<=radius){if(path.length>1)out.push(path);path=[];}else path.push(p);}if(path.length>1)out.push(path);}return out;}
const api={PI,XMIN,XMAX,YMAX,transforms,defaults,timeDefaults,clone,normalizeSettings,graphRange,formula,evaluate,questionPool,signature,selectQuestion,validate,buildPlan,score,intersections,sampleXs,helpBounds,isHelpX,nextHelpInterval,openSegments,clipStrokes,helpPaths,length,targetPaths,inkBudget,tooManyYs,createInkTracker,erase,eraseSweep};root.TrigEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
