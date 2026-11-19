import {techniques as scoreTechniques} from './techniques.mjs';
import {makeNote,spellMidi,scoreName,noteToken,bottomStep,stepAtY,yAtStep,editChord} from './plucked-staff-model.mjs';
const NS='http://www.w3.org/2000/svg';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class PluckedStaffEditor{
 constructor(el,{onChange=()=>{},onSelect=()=>{},onMessage=()=>{},onPlay=()=>{},maxNotes=4,techniqueLabel=key=>scoreTechniques.find(t=>t.id===key)?.name||key}={}){
  Object.assign(this,{el,onChange,onSelect,onMessage,onPlay,techniqueLabel});this.maxNotes=maxNotes;this.notes=[];this.selectedId=null;this.clef='treble';this.alter=0;this.preview=null;this.assignments=[];
  el.innerHTML=`<div class="score-toolbar"><label>谱号 <select id="staff-clef" aria-label="五线谱谱号"><option value="treble">高音谱号</option><option value="bass">低音谱号</option></select></label><span class="whole-only"><svg viewBox="0 0 20 12" width="17" height="11" aria-hidden="true"><ellipse cx="10" cy="6" rx="7" ry="3.5" fill="none" stroke="currentColor" stroke-width="2.5"/></svg> 全音符 <b id="score-count">0 / 4</b></span></div><div class="score-tools"><div class="accidental-tools" aria-label="临时变音记号"><button data-accidental="-1" aria-label="降号" aria-pressed="false">♭</button><button data-accidental="0" aria-label="还原号" aria-pressed="true">♮</button><button data-accidental="1" aria-label="升号" aria-pressed="false">♯</button></div><div class="score-edit-tools"><button data-shift="7" title="所选音升高八度" aria-label="升高八度">＋8度</button><button data-shift="-7" title="所选音降低八度" aria-label="降低八度">−8度</button><button data-score-action="delete" aria-label="删除所选音符">删除</button></div></div><div class="staff-surface" id="staff-surface" tabindex="0" role="group" aria-label="五线谱编辑区：点击线间加音，拖动音符改音高。方向键移动，Delete 删除。"><div class="staff-engraving"></div><div class="score-hover" aria-hidden="true"></div></div><div class="score-note-list" id="score-note-list" aria-label="和弦音符"></div><p class="score-feedback" id="score-feedback" role="status">点击谱面加音 · 拖动改音高 · 按乐器限制输入和弦</p><div class="score-actions"><button data-score-action="play">▶ 按谱中技法试听</button><button data-score-action="clear">清空</button><button data-score-action="unpin">自动分弦</button></div><p class="score-guide">谱面显示实际音高，中央 C = C4。绿色为和弦，朱红为选中或当前点奏。</p>`;
  this.surface=el.querySelector('.staff-surface');this.engraving=el.querySelector('.staff-engraving');this.bind();this.render();
 }
 setNotes(notes,{selectedId=notes.at(-1)?.id,notify=false}={}){if(notes.length>this.maxNotes)throw new Error(`最多输入 ${this.maxNotes} 个音。`);this.notes=notes.map(n=>({...n}));this.selectedId=selectedId;this.preview=null;this.render();if(notify)this.onChange(this.notes,'set');}
 setAssignments(a){this.assignments=a;this.renderList();}
 setPreview(note){this.preview=note;this.render();this.feedback(note?`当前点奏 ${scoreName(note)} · 原和弦保留`:'点击谱面加音 · 拖动改音高 · 按乐器限制输入和弦');}
 feedback(message,error=false){const el=this.el.querySelector('#score-feedback');el.textContent=message;el.classList.toggle('warning',error);}
 choose(id,play=true){this.selectedId=id;this.preview=null;const n=this.notes.find(n=>n.id===id);if(!n)return;this.alter=n.alter;this.render();this.feedback(`已选 ${scoreName(n)} · 拖动或用 ↑ ↓ 调整，Delete 删除`);this.onSelect(n,play);}
 commit(action){try{this.notes=editChord(this.notes,action,this.maxNotes);if(action.type==='remove')this.selectedId=this.notes.at(-1)?.id||null;else if(action.type==='clear')this.selectedId=null;else if(action.type==='add'||action.type==='collect')this.selectedId=(action.type==='collect'?this.notes.find(n=>n.binding?.s===action.binding.s):this.notes.at(-1))?.id;this.preview=null;this.feedback(this.notes.length?'已更新和弦，音位与指法同步分析':'点击谱面加音 · 拖动改音高 · 按乐器限制输入和弦');this.render();this.onChange(this.notes,action.type);return true;}catch(e){this.feedback(e.message,true);this.onMessage(e.message);return false;}}
 collect(midi,binding,flat=false){return this.commit({type:'collect',note:spellMidi(midi,flat),binding});}
 assign(id,binding){return this.commit({type:'bind',id,binding});}
 bind(){
  this.el.addEventListener('change',e=>{if(e.target.id==='staff-clef'){this.clef=e.target.value;this.render();this.feedback('已切换谱号 · 所有实际音高保持不变');}});
  this.el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
   if(b.dataset.scoreNote){this.choose(b.dataset.scoreNote);return;}
   if(b.dataset.accidental!==undefined){this.alter=Number(b.dataset.accidental);const n=this.notes.find(n=>n.id===this.selectedId);if(n)this.commit({type:'replace',id:n.id,note:makeNote(n.step,this.alter,{...n,natural:this.alter===0})});else this.render();}
   if(b.dataset.shift){const n=this.notes.find(n=>n.id===this.selectedId);if(n){try{this.commit({type:'replace',id:n.id,note:makeNote(n.step+Number(b.dataset.shift),n.alter,n)});}catch(err){this.feedback(err.message,true);}}}
   if(b.dataset.scoreAction==='delete')this.commit({type:'remove',id:this.selectedId});
   if(b.dataset.scoreAction==='clear')this.commit({type:'clear'});
   if(b.dataset.scoreAction==='play')this.onPlay();
   if(b.dataset.scoreAction==='unpin'){this.notes=this.notes.map(n=>({...n,binding:undefined}));this.onChange(this.notes,'unpin');this.render();this.feedback('已释放指定弦位，重新寻找完整和弦的分弦方案');}
  });
  this.surface.addEventListener('pointerdown',e=>{if(e.button!==0)return;const p=this.point(e),target=e.target.closest('[data-note-hit]');this.surface.focus({preventScroll:true});
   if(target){const id=target.dataset.noteHit;this.choose(id);this.drag={id,y:e.clientY,layout:{...this.layout},moved:false};this.surface.setPointerCapture(e.pointerId);e.preventDefault();return;}
   if(p.x<85||p.x>405)return;const step=stepAtY(p.y,this.layout.bottom,this.clef);const existing=this.notes.find(n=>n.step===step&&n.alter===this.alter);if(existing){this.choose(existing.id);return;}
   if(this.commit({type:'add',note:makeNote(step,this.alter)})){const n=this.notes.find(n=>n.id===this.selectedId);this.onSelect(n,true);}
  });
  this.surface.addEventListener('pointermove',e=>{const p=this.point(e);if(this.drag){if(Math.abs(e.clientY-this.drag.y)<3&&!this.drag.moved)return;this.drag.moved=true;const n=this.notes.find(n=>n.id===this.drag.id);if(!n)return;const step=stepAtY(p.y,this.drag.layout.bottom,this.clef);if(step!==n.step)this.commit({type:'replace',id:n.id,note:makeNote(step,n.alter,n)});return;}this.showHover(p);});
  const release=()=>{if(this.drag){this.drag=null;this.render();}};this.surface.addEventListener('pointerup',release);this.surface.addEventListener('pointercancel',release);this.surface.addEventListener('lostpointercapture',release);this.surface.addEventListener('pointerleave',()=>{this.el.querySelector('.score-hover').innerHTML='';});
  this.surface.addEventListener('keydown',e=>{const n=this.notes.find(n=>n.id===this.selectedId);if(['Delete','Backspace'].includes(e.key)){e.preventDefault();this.commit({type:'remove',id:this.selectedId});}else if(['ArrowUp','ArrowDown'].includes(e.key)&&n){e.preventDefault();try{this.commit({type:'replace',id:n.id,note:makeNote(n.step+(e.key==='ArrowUp'?1:-1)*(e.shiftKey?7:1),n.alter,n)});}catch(err){this.feedback(err.message,true);}}else if(e.key===' '||e.key==='Enter'){e.preventDefault();this.onPlay();}else if(['ArrowLeft','ArrowRight'].includes(e.key)&&this.notes.length){e.preventDefault();const index=Math.max(0,this.notes.findIndex(n=>n.id===this.selectedId));this.choose(this.notes[(index+(e.key==='ArrowRight'?1:this.notes.length-1))%this.notes.length].id,false);}});
 }
 point(e){const r=this.engraving.querySelector('svg').getBoundingClientRect();return{x:(e.clientX-r.left)*420/r.width,y:(e.clientY-r.top)*this.layout.height/r.height};}
 showHover(p){const el=this.el.querySelector('.score-hover');if(p.x<85||p.x>405){el.innerHTML='';return;}const step=stepAtY(p.y,this.layout.bottom,this.clef),y=yAtStep(step,this.layout.bottom,this.clef),note=makeNote(step,this.alter);el.innerHTML=`<svg viewBox="0 0 420 ${this.layout.height}"><ellipse cx="260" cy="${y}" rx="11" ry="6" fill="none" stroke="#a98657" stroke-width="2" stroke-dasharray="2 2"/><text x="292" y="${y+4}" font-size="12" fill="#967749">${scoreName(note)}</text></svg>`;}
 renderList(){
  this.el.querySelector('#score-count').textContent=`${this.notes.length} / ${this.maxNotes}`;
  this.el.querySelector('#score-note-list').innerHTML=this.notes.length?this.notes.map(n=>{const p=n.binding||this.assignments.find(p=>p.midi===n.midi);return `<button data-score-note="${n.id}" class="score-note-chip ${n.id===this.selectedId?'active':''}" aria-pressed="${n.id===this.selectedId}"><b>${scoreName(n)}</b><span>${p?(p.s+1)+'弦'+(n.binding?' · 已指定':''):'待分弦'}</span>${n.techniques?.length?`<small>${n.techniques.map(id=>this.techniqueLabel(id)).join(' · ')}</small>`:''}</button>`;}).join(''):'<span class="score-empty">谱中暂无音符</span>';
  this.el.querySelector('[data-score-action="delete"]').disabled=!this.selectedId;
  this.el.querySelector('[data-score-action="play"]').disabled=!this.notes.length;
  this.el.querySelectorAll('[data-shift]').forEach(b=>b.disabled=!this.selectedId);
  this.el.querySelectorAll('[data-accidental]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.accidental)===this.alter);b.setAttribute('aria-pressed',String(Number(b.dataset.accidental)===this.alter));});
 }
 render(){
  const V=window.Vex.Flow;const all=[...this.notes,...(this.preview?[this.preview]:[])];let bottom=174;const topNote=Math.min(45,...all.map(n=>yAtStep(n.step,bottom,this.clef)));if(topNote<30)bottom+=30-topNote;
  const maxY=Math.max(226,...all.map(n=>yAtStep(n.step,bottom,this.clef)));this.layout=this.drag?.layout||{bottom,height:Math.max(260,maxY+32)};
  const {height}=this.layout;bottom=this.layout.bottom;this.engraving.innerHTML='';this.el.querySelector('.score-hover').innerHTML='';
  const renderer=new V.Renderer(this.engraving,V.Renderer.Backends.SVG);renderer.resize(420,height);const ctx=renderer.getContext();ctx.setFillStyle('#384d3d').setStrokeStyle('#69735f');
  const stave=new V.Stave(16,bottom-112,386,{spacing_between_lines_px:14});stave.setBegBarType(V.Barline.type.NONE);stave.setEndBarType(V.Barline.type.NONE);stave.addClef(this.clef);stave.setContext(ctx).draw();
  const sorted=[...this.notes].sort((a,b)=>a.step-b.step||a.alter-b.alter);this.hitRects=[];
  const drawChord=(notes,x,color,interactive=false)=>{if(!notes.length)return;const chord=new V.StaveNote({clef:this.clef,keys:notes.map(n=>`${n.letter.toLowerCase()}${n.alter===1?'#':n.alter===-1?'b':''}/${n.octave}`),duration:'w'});chord.setStave(stave).setContext(ctx);notes.forEach((n,i)=>{if(n.alter||n.natural)chord.addModifier(new V.Accidental(n.alter===1?'#':n.alter===-1?'b':'n'),i);chord.setKeyStyle(i,{fillStyle:color||(n.id===this.selectedId?'#a64f38':'#385c47'),strokeStyle:color||(n.id===this.selectedId?'#a64f38':'#385c47')});});
   const voice=new V.Voice({num_beats:4,beat_value:4}).addTickables([chord]);new V.Formatter().joinVoices([voice]).format([voice],220);chord.getTickContext().setX(x-stave.getNoteStartX());chord.draw();
   if(interactive)chord.noteHeads.forEach((h,i)=>{const box=h.getBoundingBox();this.hitRects.push({id:notes[i].id,x:box.getX(),y:chord.getYs()[i]-9,width:box.getW(),height:18,note:notes[i]});});
  };
  drawChord(sorted,242,null,true);
  if(this.preview){drawChord([this.preview],142,'#b9573c');}
  const svg=this.engraving.querySelector('svg');svg.setAttribute('viewBox',`0 0 420 ${height}`);svg.removeAttribute('width');svg.removeAttribute('height');svg.style.width='100%';svg.style.height='auto';svg.setAttribute('aria-label',`${this.clef==='treble'?'高音':'低音'}谱号，全音符和弦：${this.notes.map(scoreName).join('、')||'空白'}`);
  if(this.preview){const label=document.createElementNS(NS,'text');label.setAttribute('x','142');label.setAttribute('y',height-13);label.setAttribute('text-anchor','middle');label.setAttribute('font-size','10');label.setAttribute('fill','#b9573c');label.textContent='点奏 '+scoreName(this.preview);svg.append(label);}
  for(const h of this.hitRects){const rect=document.createElementNS(NS,'rect');for(const [k,v]of Object.entries({x:h.x-6,y:h.y,width:h.width+12,height:h.height,fill:'transparent',stroke:'none','data-note-hit':h.id,'data-midi':h.note.midi,'aria-label':scoreName(h.note)}))rect.setAttribute(k,v);svg.append(rect);}
  const annotated=this.hitRects.filter(h=>h.note.techniques?.length).sort((a,b)=>a.y-b.y);let lastLabel=-99;
  for(const h of annotated){const y=Math.max(h.y+10,lastLabel+19);lastLabel=y;const color=h.id===this.selectedId?'#a64f38':'#92764e';const group=document.createElementNS(NS,'g');group.setAttribute('class','score-annotation');group.setAttribute('pointer-events','none');
   const path=document.createElementNS(NS,'path');path.setAttribute('d',`M ${h.x+h.width+4} ${h.y+9} L 282 ${y} H 294`);path.setAttribute('stroke',color);group.append(path);
   const text=document.createElementNS(NS,'text');text.setAttribute('x','298');text.setAttribute('y',y+3);text.setAttribute('fill',color);text.setAttribute('font-size','10');const display=h.note.techniques.slice(0,2);text.textContent=display.map(id=>this.techniqueLabel(id)).join(' · ')+(h.note.techniques.length>2?' ＋'+(h.note.techniques.length-2):'');group.append(text);svg.append(group);
  }
  if(!this.notes.length&&!this.preview){const t=document.createElementNS(NS,'text');t.setAttribute('x','242');t.setAttribute('y',bottom+68);t.setAttribute('text-anchor','middle');t.setAttribute('fill','#aaa18a');t.setAttribute('font-size','12');t.textContent='点击线或间，写下第一个音';svg.append(t);}
  this.renderList();
 }
}
