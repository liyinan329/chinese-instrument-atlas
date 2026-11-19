import {positions} from './plucked-data.mjs';
import {naturalHarmonics,ruanTechnique,validateRuan,planRuan} from './ruan-techniques.mjs';
export const ruanString=s=>['IV','III','II','I'][s]||String(s+1);
export function ruanParams(n,id=n.techniques?.[0]||'down'){
 const t=ruanTechnique(id),saved=n.techniques?.[0]===id?n.techniqueParams||{}:{};
 return {speed:10,duration:2.4,...(t.target?{target:n.midi+(t.direction||1)*2}:{}),...saved};
}
export function ruanPositions(c,n){
 const id=n.techniques?.[0]||'down',t=ruanTechnique(id),params=ruanParams(n,id);
 let ps=id==='harmonic'?naturalHarmonics(c).map(h=>({...h,fret:Math.round(12*Math.log2(h.h)),x:1-1/h.h,y:h.s/3,harmonic:true,label:`${ruanString(h.s)}弦 · ${h.h}次泛音 · 距琴码约${h.touch} mm`})):
 positions(c).map(p=>({...p,label:`${ruanString(p.s)}弦 · ${p.fret?p.fret+'品':'空弦'}`}));
 return ps.filter(p=>p.midi===n.midi&&(!['vibrato','bend'].includes(id)||p.fret>0)&&(!t.target||params.target>=c.tuning[p.s]&&params.target<=c.tuning[p.s]+c.frets));
}
export function analyzeRuan(c,notes){
 const fail=reason=>({level:'impossible',reason,shape:[]});
 if(!notes.length)return {level:'empty',reason:'输入音符后分析当前音位与演奏安排。',shape:[]};
 if(notes.length>4)return fail('中阮常规同时发声最多使用四根弦，请减少和弦音。');
 const options=notes.map(n=>ruanPositions(c,n).filter(p=>!n.binding||p.s===n.binding.s&&p.fret===n.binding.fret));
 if(options.some(a=>!a.length))return fail('所写音高、技法或指定弦位不能对应。泛音需核对自然节点，揉弦和推拉弦需使用按音；滑音起止音须在同一根弦上。');
 let best=null;
 function visit(i,shape,used){if(i===notes.length){const stopped=shape.filter(p=>!p.harmonic&&p.fret>0),xs=stopped.map(p=>c.scale*p.x),span=xs.length?Math.max(...xs)-Math.min(...xs):0,cost=span+shape.reduce((sum,p)=>sum+(p.harmonic?0:p.fret),0);if(!best||cost<best.cost)best={shape,span,cost};return;}for(const p of options[i])if(!used.has(p.s))visit(i+1,[...shape,p],new Set([...used,p.s]));}
 visit(0,[],new Set());if(!best)return fail('这些音或技法需要占用同一根弦，无法按当前和弦同时演奏。请改分弦或分解演奏。');
 const resolved=notes.map((n,i)=>({...n,s:best.shape[i].s,binding:best.shape[i]})),groups=new Map();
 for(const n of resolved){const id=n.techniques?.[0]||'down',params=ruanParams(n),key=JSON.stringify([id,params]);if(!groups.has(key))groups.set(key,{id,params,notes:[]});groups.get(key).notes.push(n);}
 try{for(const g of groups.values())validateRuan(g.notes,g.id,c,best.shape,g.params.target);}catch(e){return fail(e.message);}
 const stopped=best.shape.filter(p=>!p.harmonic&&p.fret>0),difficult=best.span>c.reach||stopped.length===4||stopped.some(p=>p.fret>=17),normal=notes.length>2||stopped.some(p=>p.fret>=10)||best.shape.some(p=>p.harmonic);
 return {...best,level:difficult?'difficult':normal?'normal':'easy',reason:`已按所选技法安排${best.shape.length}根弦，按音纵向跨度约${Math.round(best.span)} mm。`};
}
export function ruanScoreEvents(c,notes){
 const result=analyzeRuan(c,notes);if(result.level==='impossible'||result.level==='empty')throw Error(result.reason);
 const resolved=notes.map((n,i)=>({...n,s:result.shape[i].s,binding:result.shape[i]})),groups=new Map();
 for(const n of resolved){const id=n.techniques?.[0]||'down',params=ruanParams(n),key=JSON.stringify([id,params]);if(!groups.has(key))groups.set(key,{id,params,notes:[]});groups.get(key).notes.push(n);}
 return {result,events:[...groups.values()].flatMap(g=>planRuan(g.notes,g.id,g.params)).sort((a,b)=>a.time-b.time)};
}
