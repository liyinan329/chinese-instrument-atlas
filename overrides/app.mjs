import {startResponsiveWorkspaces} from './responsive-workspace.mjs';
import {mountInstrumentAtlas} from './instrument-atlas.mjs?assets=bowed-audio';
import {ScoreTechniques} from './score-techniques.mjs?v=9.0';
import { STRINGS, noteName, frequency, fretName, midiAt, available, parseInput, solve } from './model.mjs?v=6.0';
import { SamplePipaAudio } from './sampler.mjs?v=6.0';
import { Pipa3D } from './pipa-3d.mjs?v=6.0';
import { techniques,sources } from './techniques.mjs?v=6.0';
import {StaffEditor} from './staff-editor.mjs?v=6.0';
import {spellMidi,spellToken,noteToken,scoreName} from './staff-model.mjs';
import {techniqueDetails} from './technique-details.mjs?v=6.0';
import {techniqueNotation,notationSources} from './technique-notation.mjs?v=6.0';
import {drawTechniqueNotation} from './notation-renderer.mjs?v=6.0';
import {techniqueBriefs} from './technique-briefs.mjs?v=6.0';
import {TechniqueMotion,motionMarkup} from './technique-motion.mjs?v=8.0';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const roman=['Ⅳ','Ⅲ','Ⅱ','Ⅰ'];
const state={mode:'listen',range:'all',flat:false,current:{s:3,fret:0},collected:new Map(),solutions:[],solutionIndex:0,technique:'wheel',category:'全部',profile:'chromatic',conservative:true,scale:650,reach:65,autoVoice:true};
const audio=new SamplePipaAudio();let toastTimer;let instrument=null,staff=null,motion=null,scoreTech=null;state.scoreFocus=false;state.focusMidi=57;state.held=[0,0,0,0];
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nn=m=>noteName(m,state.flat), opts=()=>({profile:state.profile,conservative:state.conservative,scale:state.scale,reach:state.reach,autoVoice:state.autoVoice});
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3200);}
const nativePlayer=$('#native-player');let lastPeak=0,lastSignal=0;
audio.onExcite=({s,midi,velocity})=>instrument?.pluck(s,{strength:velocity,fret:Math.max(0,midi-STRINGS[s].midi)});
audio.onstate=t=>{$('#audio-status').textContent=t;};
function soundPanel(open){$('#sound-panel').hidden=!open;$('#sound-help').setAttribute('aria-expanded',String(open));}
async function sound(action){
 nativePlayer.pause();
 $('#audio-error').textContent='';$('#audio-status').textContent='正在准备播放…';
 try{await action();}catch(e){const message=e.message||'声音播放失败，请再次点击。';$('#audio-error').textContent=message;$('#audio-status').textContent='播放未成功 · 打开声音检测';soundPanel(true);toast(message);}
}
function playNative(clip){
 audio.stop();nativePlayer.pause();nativePlayer.src=clip.url;nativePlayer.volume=audio.volume;nativePlayer.muted=false;
 try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}
 $('#native-caption').textContent=clip.title||'真实琵琶 A3 · 原速原调';
 $('#sound-kind').textContent='真实演奏录音 · 原生播放器';
 return nativePlayer.play().catch(()=>{throw new Error('浏览器未开始播放。请直接点击下方原生播放器的播放键。');});
}
nativePlayer.addEventListener('playing',()=>{$('#audio-status').textContent='真实录音正在播放';});
nativePlayer.addEventListener('timeupdate',()=>{if(!nativePlayer.paused)$('#audio-status').textContent='实录播放 '+nativePlayer.currentTime.toFixed(1)+' / '+(Number.isFinite(nativePlayer.duration)?nativePlayer.duration.toFixed(1):'…')+' 秒';});
nativePlayer.addEventListener('ended',()=>{$('#audio-status').textContent='实录播放完毕';});
nativePlayer.addEventListener('error',()=>{if(nativePlayer.getAttribute('src')){$('#audio-error').textContent='录音未能载入，请重新点击播放。';soundPanel(true);}});
setInterval(()=>{const level=audio.level();$('#output-meter').value=level;if(level>.0005){lastPeak=Math.max(lastPeak,level);lastSignal=Date.now();$('#output-level').textContent=(20*Math.log10(level)).toFixed(0)+' dBFS';$('#output-level').dataset.signal='detected';}else if(lastSignal&&Date.now()-lastSignal>500)$('#output-level').textContent='已输出 · 峰值 '+(20*Math.log10(lastPeak)).toFixed(0)+' dBFS';},70);

let atlas=null;
function showView(view){atlas?.navigate('pipa/'+view);}
function applyAtlasRoute(view){
 const pipa=['explore','techniques','about'].includes(view);
 $$('.view').forEach(el=>el.hidden=el.id!==view+'-view');$('.intro').hidden=view!=='explore';
 document.body.classList.toggle('atlas-mode',!pipa);$('#pipa-nav').hidden=!pipa;$('#header-home').hidden=!pipa;$('#pipa-breadcrumb').hidden=!pipa;
 const titles={explore:'音位与和弦',techniques:'技法库',about:'模型与资料'};
 $('#pipa-location').textContent=titles[view]||'';document.title=pipa?'琵琶 · 国乐织音坊——中国民族乐器法交互学习平台':'国乐织音坊——中国民族乐器法交互学习平台';
 $$('.nav-button').forEach(el=>{const selected=el.dataset.view===view;el.classList.toggle('active',selected);if(selected)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 $('#footer-context').textContent=pipa?'琵琶乐器法 · 指法仍需试奏':'四类乐器板块已开放 · 打击乐自由组合';
 if(!pipa){stop();soundPanel(false);scoreTech?.open(false);}else if(view==='explore'){ensureInstrument();requestAnimationFrame(()=>instrument?.resize());}
 motion?.setVisible(view==='techniques');window.scrollTo({top:0});
}

function currentSolution(){return state.solutions[state.solutionIndex];}
function scoreSelected(){return staff?.notes.find(n=>n.id===staff.selectedId);}
function candidatesFor(midi){return STRINGS.flatMap((_,s)=>Array.from({length:31},(_,fret)=>({s,fret,midi:midiAt(s,fret,state.profile)})).filter(p=>p.midi===midi&&available(p.s,p.fret,state.conservative)));}
function renderBoard(){
 const chosen=currentSolution()?.shape||staff?.notes.filter(n=>n.binding).map(n=>({...n.binding,midi:n.midi}))||[];
 const positions=chosen.map(p=>({...p,current:state.current?.s===p.s&&state.current?.fret===p.fret}));
 if(state.scoreFocus){for(const p of candidatesFor(state.focusMidi))if(!positions.some(q=>q.s===p.s&&q.fret===p.fret))positions.push({...p,candidate:true});}
 if(state.current&&!positions.some(p=>p.s===state.current.s&&p.fret===state.current.fret))positions.push({...state.current,current:true});
 instrument?.update({profile:state.profile,conservative:state.conservative,flat:state.flat,positions,held:state.held});
}
function renderCurrent(){
 // Current pitch is shown on the staff and instrument tooltip.

}
const difficultyLabels={easy:'较容易演奏',normal:'可正常演奏',difficult:'较困难演奏',impossible:'无法演奏',empty:'待输入音符'};
function difficultyState(){
 if(!staff?.notes.length)return {level:'empty',reason:'在五线谱中加入音符后，显示当前和弦的演奏难度。'};
 const r=currentSolution();
 if(!r)return {level:'impossible',reason:state.analysisReason||'当前音高与指定弦位无法组成同时发声的常规实音和弦。'};
 const reasons=[];
 if(!r.fingers)reasons.push('全部为空弦，左手无需按弦');
 else if(r.span>state.reach)reasons.push(`按弦跨度 ${Math.round(r.span)} mm，超过 ${state.reach} mm 参考值`);
 else reasons.push(`按弦跨度 ${Math.round(r.span)} mm，使用 ${r.fingers} 指`);
 if(r.fingers===4)reasons.push('四指全部占用');
 if(r.highPosition)reasons.push('涉及高把位');
 return {level:r.difficulty,reason:reasons.join('；')+'。'};
}
function renderDifficulty(){
 const {level,reason}=difficultyState(),badge=$('#difficulty-badge');
 badge.textContent=difficultyLabels[level];badge.dataset.level=level;
 return `<div class="difficulty-explanation" data-level="${level}"><p>${escapeHtml(reason)}</p><small>${level==='impossible'?'按当前琴型、原音高和指定弦位判断；可尝试自动分弦或修改音符。':'按当前和弦弦位估算；速度、奏法和前后连接仍需试奏。'}</small></div>`;
}
function renderPositions(){
 const n=scoreSelected(),m=state.focusMidi,candidates=candidatesFor(m);
 $('#note-positions').innerHTML=renderDifficulty()+`<div class="position-heading"><b>${state.scoreFocus&&n?scoreName(n):nn(m)}</b><span>${state.scoreFocus?'对应弦位 · 可指定其中一处':'当前点奏 · 和弦保持不变'}</span></div><div class="position-options">${candidates.map(p=>`<button data-position-s="${p.s}" data-position-f="${p.fret}" class="${state.current?.s===p.s&&state.current?.fret===p.fret?'active':''}" aria-pressed="${state.current?.s===p.s&&state.current?.fret===p.fret}">${roman[p.s]}弦 · ${fretName(p.fret)}</button>`).join('')||'<span class="unavailable-note">此音不在当前琴型音域内，谱面已保留。</span>'}</div>`;
}
function focusScore(n,play=false){
 scoreTech?.refresh();
 if(!n)return;state.scoreFocus=true;state.focusMidi=n.midi;
 const assigned=currentSolution()?.shape.find(p=>p.midi===n.midi),candidates=candidatesFor(n.midi);
 state.current=(n.binding&&candidates.find(p=>p.s===n.binding.s&&p.fret===n.binding.fret))||assigned||candidates[0]||null;
 renderCurrent();renderPositions();renderBoard();if(play){if(state.current)instrument?.pluck(state.current.s);sound(()=>audio.playNote(n.midi,state.current?.s));}
}
function applySolution(){
 const shape=currentSolution()?.shape||[];state.held=[0,0,0,0];for(const p of shape)state.held[p.s]=p.fret;
 for(const n of staff?.notes||[])if(n.binding)state.held[n.binding.s]=n.binding.fret;
 staff?.setAssignments(shape);if(scoreSelected())focusScore(scoreSelected(),false);else{renderBoard();renderPositions();}
}
function writeScoreText(){$('#chord-input').value=staff.notes.length?'='+staff.notes.map(noteToken).join(' '):'';}
function analyzeStaff(){
 state.solutionIndex=0;state.solutions=[];state.total=0;state.parsed={kind:'notes',notes:staff.notes.map(n=>n.midi)};
 if(!staff.notes.length){state.held=[0,0,0,0];state.current={s:3,fret:0};state.focusMidi=57;renderCurrent();state.collected.clear();staff.setAssignments([]);$('#analysis-result').innerHTML='<p class="result-subtitle">在五线谱上加入 1–4 个音，自动分析分弦与指法。</p>';state.scoreFocus=false;renderBoard();renderPositions();return;}
 const result=solve(state.parsed,{...opts(),autoVoice:false,fixed:staff.notes.map(n=>n.binding||null)});state.solutions=result.solutions;state.total=result.total||0;state.analysisReason=result.reason;
 if(!result.solutions.length)$('#analysis-result').innerHTML=`<div class="analysis-empty"><b>无法演奏</b><p>${escapeHtml(result.reason)}</p><p>原始音高已保留。试听只代表音高组合；可修改谱音或点击“自动分弦”释放指定位置。</p></div>`;
 else renderResult();applySolution();
}
function scoreChanged(){writeScoreText();analyzeStaff();scoreTech?.refresh();}
function selectNote(s,fret,meta={}){
 state.held[s]=fret;state.current={s,fret};const midi=midiAt(s,fret,state.profile);state.focusMidi=midi;state.scoreFocus=false;renderCurrent();
 if(state.mode==='collect'&&!meta.pluck){
  const success=staff.collect(midi,{s,fret},state.flat);if(success)focusScore(scoreSelected(),false);
 }else{staff.setPreview(spellMidi(midi,state.flat));renderPositions();}
 renderBoard();nativePlayer.pause();sound(()=>audio.playNote(midi,s));
}
function analyze(){
 state.autoVoice=$('#auto-voice').checked;
 try{
  const parsed=parseInput($('#chord-input').value);if(parsed.notes.length>4)throw new Error('最多导入四个音，请删减后重试。当前谱面已保留。');
  if(new Set(parsed.notes).size!==parsed.notes.length)throw new Error('请使用不同音高组成和弦，当前谱面已保留。');
  const result=solve(parsed,opts());let notes;
  if(parsed.kind==='notes'){const tokens=$('#chord-input').value.trim().replace(/^=/,'').trim().split(/[\s,，;；、]+/).filter(Boolean);notes=tokens.map(spellToken);}
  else notes=(result.solutions[0]?.shape.map(p=>p.midi).sort((a,b)=>a-b)||parsed.notes).map(m=>spellMidi(m,state.flat));
  staff.setNotes(notes);analyzeStaff();staff.feedback(parsed.kind==='symbol'?'已导入和弦配音 · 后续谱面编辑保留实际音高':'已导入具体音高 · 自动分析分弦');
 }catch(e){toast(e.message);staff.feedback(e.message,true);}
}
function renderResult(){
 const r=currentSolution();if(!r)return;
 const label=difficultyLabels[r.difficulty];
 const reason=[];
 if(r.fingers===0)reason.push('全部为空弦，左手无需按弦。');
 if(r.span>state.reach)reason.push(`纵向跨度超过当前 ${state.reach} mm 参考阈值；建议试奏，或考虑转位。`);
 if(r.fingers===4)reason.push('四根弦都需按弦，左手四指全部占用。');
 if(r.sameFret)reason.push('有多个音同品；这里分配独立手指，横按可能性需另行确认。');
 if(r.highPosition)reason.push('涉及高把位，需检查琴型覆盖与手指挤压。');
 if(!r.adjacent)reason.push('包含跳弦；扫弦可能触及未选弦，宜明确选弦或制音。');
 if(!reason.length)reason.push('静态跨度较小；前后连接与右手奏法仍需试奏。');
 const actual=[...r.shape].sort((a,b)=>a.midi-b.midi).map(p=>nn(p.midi)).join(' · ');
 const auto=state.parsed?.kind==='symbol'&&state.autoVoice;
 const table=STRINGS.map((s,si)=>{const p=r.shape.find(p=>p.s===si);return `<tr><td>${roman[si]}弦</td><td>${p?nn(p.midi):'—'}</td><td>${p?fretName(p.fret):'不奏'}</td><td>${p?`<span class="finger-chip">${p.finger===0?'0 · 空弦':p.finger+' · '+['','食指','中指','无名指','小指'][p.finger]}</span>`:'—'}</td></tr>`;}).join('');
 $('#analysis-result').innerHTML=`<div class="result-card status-${r.level}"><div class="result-title"><span class="status-dot"></span><b>${label}</b></div><p class="result-subtitle">${auto?'自动配音':'保留原音高'} · ${actual}</p><div class="stats"><div class="stat"><b>${Math.round(r.span)}<small>mm</small></b><span>按弦纵向跨度</span></div><div class="stat"><b>${r.fingers}<small>指</small></b><span>按弦手指数</span></div><div class="stat"><b>${r.shape.length}<small>弦</small></b><span>使用弦数</span></div></div><div class="fingering-heading"><span>建议弦位 <span style="color:#a5ad98">/ 指序示意</span></span><div class="solution-switch"><button id="prev-shape" aria-label="上一种弦位" ${state.solutionIndex===0?'disabled':''}>‹</button><span>${state.solutionIndex+1} / ${state.solutions.length}${state.total>24?' 最优候选':''}</span><button id="next-shape" aria-label="下一种弦位" ${state.solutionIndex===state.solutions.length-1?'disabled':''}>›</button></div></div><details class="shape-details"><summary>查看此方案的弦位与指序</summary><table class="shape-table"><thead><tr><th>弦</th><th>实音</th><th>位置</th><th>左手</th></tr></thead><tbody>${table}</tbody></table></details><ul class="reason-list">${reason.map(t=>`<li>${t}</li>`).join('')}</ul></div>`;
}
function filters(){const cats=['全部','右手','左手','泛音与音色','特殊音响'];$('#tech-filters').innerHTML=cats.map(c=>`<button data-category="${c}" class="${state.category===c?'active':''}">${c}</button>`).join('');}
function clipsFor(t){return audio.manifest.techniques[t.id]||[];}
function exactClips(t){return clipsFor(t).filter(c=>c.match==='exact');}
function playableClips(t){return [...clipsFor(t)].sort((a,b)=>(a.match==='exact'?0:1)-(b.match==='exact'?0:1));}
function selectedClip(){const t=techniques.find(t=>t.id===state.technique);return playableClips(t)[Number($('#recording-select')?.value||0)];}
function clipMetadata(clip){
 const source=audio.manifest.sources.find(s=>s.id===(clip.sourceId||'pipaset'))||audio.manifest.sources[0];
 return `<p class="clip-match ${clip.match==='exact'?'':'related'}">${clip.match==='exact'?'真实演奏 · 已核对技法标签':'相关音色 / 谱注参考 · 手法未独立确认'}</p><details class="clip-source"><summary>录音来源与说明</summary><p>${escapeHtml(clip.note||clip.title||'')}</p><p class="clip-provenance">${escapeHtml(clip.originalLabel?'原标注：'+clip.originalLabel+' · ':'')}${escapeHtml(clip.evidence||'')}</p><div class="clip-credits"><a href="${clip.sourceUrl||source?.url}" target="_blank" rel="noopener">原始音源 ↗</a>${source?`<span>${escapeHtml(source.authors)}</span><a href="${source.licenseUrl}" target="_blank" rel="noopener">${escapeHtml(source.license)}</a>`:''}<span>裁切片段 · 原速原调</span></div></details>`;
}
function syncClipProgress(){const progress=$('#clip-progress'),status=$('#clip-status');if(!progress)return;const isCurrent=nativePlayer.getAttribute('src')===selectedClip()?.url;const duration=isCurrent&&Number.isFinite(nativePlayer.duration)?nativePlayer.duration:selectedClip()?.duration||0;progress.max=duration||1;progress.value=isCurrent?nativePlayer.currentTime:0;status.textContent=(isCurrent?nativePlayer.currentTime:0).toFixed(1)+' / '+duration.toFixed(1)+' 秒';}
nativePlayer.addEventListener('timeupdate',syncClipProgress);nativePlayer.addEventListener('loadedmetadata',syncClipProgress);nativePlayer.addEventListener('ended',syncClipProgress);
function renderTechniques(){
 const term=$('#tech-search').value.trim().toLowerCase();const list=techniques.filter(t=>{const d=techniqueDetails[t.id],n=techniqueNotation[t.id];return (state.category==='全部'||state.category===t.category)&&(!term||[t.name,t.description,d.hands,d.action,d.sound,d.use,d.caution,n.label,n.explanation].join(' ').toLowerCase().includes(term));});
 $('#tech-grid').innerHTML=list.length?list.map(t=>`<button class="tech-card ${t.id===state.technique?'active':''}" data-tech="${t.id}" aria-pressed="${t.id===state.technique}"><span class="tech-cat">${t.category} / 五线谱例</span><span class="card-arrow">↗</span><h3>${t.name}</h3><p>${t.description}</p><span class="recording-badge ${exactClips(t).length?'':clipsFor(t).length?'related':'missing'}">${exactClips(t).length?'已核对技法实录':clipsFor(t).length?'相关音响可试听':'真实音色待补充'}</span></button>`).join(''):'<p class="empty-tech">没有匹配的技法，试试其他名称、动作或音响关键词。</p>';
}
function renderTechDetail(){
 const t=techniques.find(t=>t.id===state.technique),d=techniqueDetails[t.id],n=techniqueNotation[t.id],b=techniqueBriefs[t.id],clips=playableClips(t);
 const audioSlot=clips.length?`<section class="real-audio-box"><b class="recording-title">LISTEN / 真实录音</b><select id="recording-select" aria-label="选择真实演奏片段">${clips.map((c,i)=>`<option value="${i}">${c.match==='exact'?'技法实录':'相关参考'} · ${escapeHtml(c.title||'片段 '+(i+1))}</option>`).join('')}</select><div class="clip-controls"><button class="primary-button" id="play-recording">▶ 播放录音</button><button id="stop-recording" aria-label="停止技法录音">■ 停止</button></div><div class="clip-progress-row"><progress id="clip-progress" value="0" max="${clips[0].duration||1}" aria-label="技法录音播放进度"></progress><output id="clip-status">0.0 / ${(clips[0].duration||0).toFixed(1)} 秒</output></div><div id="clip-description">${clipMetadata(clips[0])}</div></section>`:`<div class="audio-placeholder"><div class="audio-placeholder-head"><b>真实音色试听</b><button disabled>▷ 对应技法录音待补充</button></div><p>${escapeHtml(audio.manifest.gaps?.[t.id]||'尚未取得可使用、且明确标注此技法的录音。已保留独立试听位置。')}</p></div>`;
 const notation=`<section class="tech-notation"><div class="notation-heading"><b>读谱 / 五线谱标记</b><span>${escapeHtml(n.approach)}</span></div><div id="tech-notation-score"></div><p>${escapeHtml(n.explanation)}</p><small>记法示例，不是录音转写。</small></section>`;
 const motionHTML=motionMarkup(t.id);
 motion?.destroy();
 const facts=[['怎么弹',b.how],['听什么',b.sound],['留意',b.tip]];
 const refs=[...new Set([...d.sourceIds,...n.sourceIds])].map(id=>notationSources.find(s=>s.id===id)||sources.find(s=>s.id===id)).filter(Boolean);
 $('#tech-detail').innerHTML=`<div class="tech-detail-heading"><div><span class="index-label">${t.category} / PLAYING GUIDE</span><h2>${t.name}</h2></div><span class="hand-chip">${escapeHtml(t.hand)}</span></div><div class="tech-stage-layout"><div class="tech-gesture-column">${motionHTML}<dl class="tech-quick-facts">${facts.map(([title,copy])=>`<div><dt>${title}</dt><dd>${escapeHtml(copy)}</dd></div>`).join('')}</dl></div><div class="tech-media-column">${audioSlot}${notation}</div></div><details class="tech-references"><summary>记谱约定与参考资料</summary><p>${escapeHtml(n.locator||'')}</p>${refs.map(s=>`<a href="${s.url}" target="_blank" rel="noopener">${escapeHtml(s.title)} ↗</a>`).join('')}</details>`;
 motion=new TechniqueMotion($('#tech-detail .motion-player'),t.id,{visible:!$('#techniques-view').hidden});
 drawTechniqueNotation($('#tech-notation-score'),n,t.name);$('#tech-detail').scrollTop=0;syncClipProgress();
}
function stop(){audio.stop();nativePlayer.pause();motion?.pause();$('#audio-status').innerHTML='<i></i>已停止播放';}
function modelChange(){
 state.profile=$('#profile').value;state.conservative=$('#conservative').checked;state.scale=Number($('#scale-length').value);state.reach=Number($('#reach').value);$('#scale-output').textContent=state.scale+' mm';$('#reach-output').textContent=state.reach+' mm';
 state.collected.clear();state.held=state.held.map((f,s)=>available(s,f,state.conservative)?f:0);if(state.current&&!available(state.current.s,state.current.fret,state.conservative))state.current=null;analyzeStaff();renderCurrent();
 try{localStorage.setItem('pipa-atlas-settings',JSON.stringify({profile:state.profile,conservative:state.conservative,scale:state.scale,reach:state.reach}));}catch{}
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button,a.brand');if(!b)return;
 if(b.matches('a.brand')){e.preventDefault();atlas?.navigate('home');}
 if(b.dataset.view)showView(b.dataset.view);
 if(b.dataset.mode){state.mode=b.dataset.mode;$$('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));if(state.mode==='collect'){const shape=currentSolution()?.shape||[];staff.setNotes(staff.notes.map(n=>({...n,binding:n.binding||shape.find(p=>p.midi===n.midi)})),{selectedId:staff.selectedId});staff.feedback('收集模式 · 点琴弦写入谱面，同一弦会替换原音');}else staff.feedback('自由点奏 · 显示当前谱位，保留已编辑和弦');renderBoard();}
 if(b.dataset.s!==undefined)selectNote(Number(b.dataset.s),Number(b.dataset.f));
 if(b.dataset.positionS!==undefined){const p={s:Number(b.dataset.positionS),fret:Number(b.dataset.positionF)};if(state.scoreFocus&&scoreSelected())staff.assign(staff.selectedId,p);else selectNote(p.s,p.fret,{pluck:true});}
 if(b.id==='analyze')analyze();
 if(b.dataset.example){$('#chord-input').value=b.dataset.example;analyze();}
 if(b.id==='prev-shape'||b.id==='next-shape'){state.solutionIndex+=b.id==='prev-shape'?-1:1;renderResult();applySolution();}
 if(b.dataset.category){state.category=b.dataset.category;filters();renderTechniques();}
 if(b.dataset.tech){stop();state.technique=b.dataset.tech;renderTechniques();renderTechDetail();if(innerWidth<=900)$('#tech-detail').scrollIntoView({behavior:'smooth',block:'start'});}
 if(b.id==='play-recording'){
  const t=techniques.find(x=>x.id===state.technique),clip=selectedClip();
  if(clip)sound(async()=>{await playNative(clip);$('#audio-status').innerHTML='<i></i>'+(clip.match==='related'?'相关实录参考':'真实演奏：'+t.name);});
 }
 if(b.id==='stop-audio'||b.id==='stop-recording')stop();
 if(b.id==='sound-help')soundPanel($('#sound-panel').hidden);
 if(b.id==='close-sound')soundPanel(false);
 if(b.id==='recover-audio')sound(async()=>{nativePlayer.pause();audio.stop();if(audio.ctx){audio.ctx.onstatechange=null;audio.ctx.close().catch(()=>{});audio.ctx=null;}if(audio.volume===0){audio.setVolume(.75);$('#volume').value=75;}lastPeak=0;await audio.playNote(state.focusMidi,state.current?.s);});
 if(b.id==='test-native'){const clip=audio.nearest(57,1);if(clip)sound(()=>playNative({...clip,title:'A3 · 真实子弦空弦录音'}));}

 if(b.id==='reset-settings'){$('#profile').value='chromatic';$('#conservative').checked=true;$('#scale-length').value=650;$('#reach').value=65;modelChange();toast('已恢复默认琴型与估算参数');}
});
$('#flat-names').addEventListener('change',e=>{state.flat=e.target.checked;renderBoard();renderCurrent();if(currentSolution())renderResult();renderTechDetail();});
$('#volume').addEventListener('input',e=>{audio.setVolume(Number(e.target.value)/100);nativePlayer.volume=audio.volume;if(!audio.volume)$('#audio-status').textContent='音量为 0 · 已静音';});
$('#tech-search').addEventListener('input',renderTechniques);
document.addEventListener('input',e=>{if(e.target.id==='tech-rate')$('#rate-value').textContent=e.target.value+' 次/秒';});
$('#auto-voice').addEventListener('change',()=>{staff.feedback('和弦符号的配音设置已更新，下次导入时生效');});
$('#chord-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();analyze();}});
$('#chord-input').addEventListener('input',()=>{staff.feedback('文字尚未导入 · 点击“导入五线谱并分析”应用');});
['profile','conservative','scale-length','reach'].forEach(id=>$('#'+id).addEventListener('change',modelChange));
['scale-length','reach'].forEach(id=>$('#'+id).addEventListener('input',e=>$(id==='reach'?'#reach-output':'#scale-output').textContent=e.target.value+' mm'));
document.addEventListener('keydown',e=>{if(e.key==='Escape')stop();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
$('#source-links').innerHTML=sources.map(s=>`<a class="source-card" href="${s.url}" target="_blank" rel="noopener"><b>${s.title} ↗</b><p>${s.detail}</p></a>`).join('');
try{const saved=JSON.parse(localStorage.getItem('pipa-atlas-settings'));if(saved){$('#profile').value=['chromatic','historic'].includes(saved.profile)?saved.profile:'chromatic';$('#conservative').checked=saved.conservative!==false;$('#scale-length').value=Math.max(550,Math.min(750,Number(saved.scale)||650));$('#reach').value=Math.max(40,Math.min(100,Number(saved.reach)||65));state.profile=$('#profile').value;state.conservative=$('#conservative').checked;state.scale=Number($('#scale-length').value);state.reach=Number($('#reach').value);}}catch{}
$('#scale-output').textContent=state.scale+' mm';$('#reach-output').textContent=state.reach+' mm';
function scoreAudioNotes(){const shape=currentSolution()?.shape;return staff.notes.map(n=>({...n,s:n.binding?.s??shape?.find(p=>p.midi===n.midi)?.s}));}
function playScore(id,onlySelected=false){
 nativePlayer.pause();sound(async()=>{
  const notes=scoreAudioNotes().filter(n=>!onlySelected||n.id===staff.selectedId);if(!notes.length)return;
  if(id)await audio.scoreTechnique(notes,id);else await audio.annotatedScore(notes);
  if(!currentSolution())$('#sound-kind').textContent+=' · 未找到可用分弦，仅供音响参考';
 });
}
staff=new StaffEditor($('#staff-editor'),{onChange:scoreChanged,onSelect:focusScore,onMessage:toast,onPlay:()=>playScore()});
scoreTech=new ScoreTechniques($('#score-tech-window'),staff,{onPreview:(n,id,scope)=>playScore(id,scope==='note'),onLibrary:id=>{state.technique=id;showView('techniques');renderTechniques();renderTechDetail();}});
renderCurrent();analyze();scoreTech.refresh();filters();renderTechniques();renderTechDetail();

function hoverNote(hit){
 const tip=$('#note-tooltip');if(!hit){tip.hidden=true;return;}
 const midi=midiAt(hit.s,hit.fret,state.profile),rect=$('#instrument-stage').getBoundingClientRect();
 tip.innerHTML=`<strong>${nn(midi)}</strong>${roman[hit.s]}弦 · ${fretName(hit.fret)}${hit.pluck?' · 拨奏':''} · ${frequency(midi).toFixed(1)} Hz`;
 tip.hidden=false;tip.style.left=Math.max(8,Math.min(rect.width-190,hit.x-rect.left+18))+'px';tip.style.top=Math.max(50,Math.min(rect.height-80,hit.y-rect.top-60))+'px';
}
function ensureInstrument(){
 if(instrument)return;
 try{
 instrument=new Pipa3D($('#instrument-stage'),{onNote:selectNote,onHover:hoverNote,onStatus:t=>$('#stage-status').textContent=t});
 $('#stage-loading').hidden=true;renderBoard();
}catch(error){$('#stage-loading').innerHTML='<div class="webgl-error">三维显示未能启动。请使用支持 WebGL 2 的浏览器并开启硬件加速。<button onclick="location.reload()">重新载入</button></div>';$('#stage-status').textContent='3D 初始化失败';console.error(error);}
}
$$('[data-camera]').forEach(b=>b.addEventListener('click',()=>{instrument?.preset(b.dataset.camera);$$('[data-camera]').forEach(x=>x.classList.toggle('active',x===b));$('#auto-rotate').classList.remove('active');$('#auto-rotate').setAttribute('aria-pressed','false');}));
function gallery(name){
 if(!['warm','ink','paper'].includes(name))name='warm';instrument?.setGalleryTheme(name);$$('[data-gallery]').forEach(b=>{b.classList.toggle('active',b.dataset.gallery===name);b.setAttribute('aria-pressed',String(b.dataset.gallery===name));});$('#gallery-note').textContent={warm:'暖灰石墙 · 胡桃木 · 柔金光',ink:'墨蓝夜色 · 冷暖对照 · 更沉静',paper:'宣纸米白 · 淡墨山色 · 更明亮'}[name];try{localStorage.setItem('pipa-gallery-theme',name);}catch{}
}
$$('[data-gallery]').forEach(b=>b.addEventListener('click',()=>gallery(b.dataset.gallery)));try{gallery(localStorage.getItem('pipa-gallery-theme')||'warm');}catch{gallery('warm');}
$$('[data-interaction]').forEach(b=>b.addEventListener('click',()=>{instrument?.setMode(b.dataset.interaction);$$('[data-interaction]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});}));
$('#pan-up').addEventListener('click',()=>instrument?.pan(0,.8));$('#pan-down').addEventListener('click',()=>instrument?.pan(0,-.8));
$('#zoom-in').addEventListener('click',()=>instrument?.zoom(.8));$('#zoom-out').addEventListener('click',()=>instrument?.zoom(1.25));
$('#auto-rotate').addEventListener('click',e=>{if(!instrument)return;instrument.autorotate=!instrument.autorotate;e.currentTarget.classList.toggle('active',instrument.autorotate);e.currentTarget.setAttribute('aria-pressed',String(instrument.autorotate));});
$('#show-labels').addEventListener('change',e=>{if(!instrument)return;instrument.labels=e.target.checked;instrument.labelGroup.visible=instrument.labels;renderBoard();});
$('#stage-fullscreen').addEventListener('click',()=>{const expanded=$('#instrument-stage').classList.toggle('expanded');document.body.classList.toggle('instrument-expanded',expanded);$('#stage-fullscreen').setAttribute('aria-label',expanded?'退出全屏演奏':'全屏演奏');instrument?.resize();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#instrument-stage').classList.contains('expanded')){$('#instrument-stage').classList.remove('expanded');document.body.classList.remove('instrument-expanded');$('#stage-fullscreen').setAttribute('aria-label','全屏演奏');instrument?.resize();}});
audio.onSampleState=t=>{$('#sound-kind').textContent=t;};
audio.loadManifest().then(m=>{
 $('#sound-kind').textContent='真实琵琶采样已就绪';
 renderTechniques();renderTechDetail();renderCoverage();const first=audio.nearest(57,1);if(first)nativePlayer.src=first.url;
}).catch(error=>{$('#sound-kind').textContent=error.message;});

function renderCoverage(){
 const count=techniques.filter(t=>exactClips(t).length).length,related=techniques.filter(t=>!exactClips(t).length&&clipsFor(t).length).length;
 $('#recording-coverage').innerHTML=`<b>${techniques.length} 项动作动画与五线谱例</b><span>${count} 项已核对技法实录</span><span>${related} 项相关音响参考</span><span>${techniques.length-count-related} 项待补录音</span><small>相关参考仅帮助理解音色，不证明使用了该项具体指法；琴体采样点奏与技法实录分开管理。</small>`;
 const credits=audio.manifest.sources.map(s=>`<div class="attribution-box"><b>${escapeHtml(s.title)}</b><br>${escapeHtml(s.authors||'')}<br><a href="${s.url}" target="_blank" rel="noopener">原始音源</a> · <a href="${s.licenseUrl}" target="_blank" rel="noopener">${escapeHtml(s.license)}</a><br>${escapeHtml(s.changes||'')}<br>点奏音高由真实单音采样移调；技法库原片段保持原速原调。谱音轮指另外使用《南泥湾》轮指持续区间9.66–11.46秒，经逐半音移调、时长处理及首尾淡化制成纹理库；长轮交叉淡化连接。加工音源仍按 CC BY 4.0 提供，不能当作对应音高的独立实录。</div>`).join('');
 let section=$('#audio-credits');if(!section){section=document.createElement('section');section.id='audio-credits';section.className='sources-section';$('#about-view').append(section);}
 section.innerHTML='<span class="index-label">AUDIO CREDITS</span><h2>真实音频来源与许可</h2>'+credits;
}
document.addEventListener('change',e=>{if(e.target.id==='recording-select'){stop();const clip=selectedClip();$('#clip-description').innerHTML=clipMetadata(clip);syncClipProgress();}});

startResponsiveWorkspaces();
atlas=mountInstrumentAtlas(applyAtlasRoute);
