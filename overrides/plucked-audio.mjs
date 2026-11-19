import {RuanAudio} from './ruan-audio.mjs';
export const pluckedAudioIds=['sanxian','guzheng','guqin','yangqin'];
export function planPluckedAudio(c,notes,shape,{technique}={}){
 return notes.flatMap((n,i)=>{const p=shape.find(p=>p.midi===n.midi)||shape[i];if(!p)return[];const t=technique||n.techniques?.[0]||'',wheel=/轮|滚|摇/.test(t),arp=/琶|分解|刮|扫|滑抹/.test(t),muted=/止音|制音/.test(t);const base={midi:n.midi,s:p.s,fret:p.fret,velocity:.62,technique:muted?'palmMute':'down',duration:muted?.15:2.6};
 // A yangqin has two beaters: larger chord studies are staggered, never four simultaneous attacks.
 const offset=arp?i*.1:c.kind==='yangqin'&&notes.length>2?Math.floor(i/2)*.12:0;
 if(wheel)return Array.from({length:20},(_,k)=>({...base,time:offset+k*.1,duration:.16,velocity:k%2?.48:.62}));
 return[{...base,time:offset,vibrato:/揉|吟|猱|颤/.test(t)?.12:undefined,harmonic:p.harmonic||false}];
 });
}
export function mountPluckedAudio(el,{id,editor,getConfig,getResult,onPlayback}){
 if(!document.querySelector('[data-ruan-style]')){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./ruan.css',import.meta.url).href;link.dataset.ruanStyle='true';document.head.append(link);}
 const name=getConfig().name,audio=new RuanAudio({instrumentName:name,bankUrl:`./audio/${id}/bank.json`,soundLabel:name+'采样音色 · 技法为参数化参考'}),stage=el.querySelector('.plucked-stage-guide'),controls=document.createElement('div');controls.className='ruan-audio-panel';controls.innerHTML=`<div class="ruan-audio-controls"><button data-basic-audio="chord">试听谱面和弦</button><button data-basic-audio="stop">停止</button><button data-basic-audio="test">声音检测</button><label>音量 <input aria-label="${name}音量" type="range" min="0" max="100" value="75"></label></div><p class="ruan-source-badge">${name}采样音色 · 技法为参数化参考</p><p class="basic-audio-state" aria-live="polite">点击音位或谱音发声，也可试听谱面和弦。</p><details><summary>音色说明</summary><p>用户提供的Kong Audio K基础单音采样，按基准音高移调。轮奏、摇指、揉弦等由单音参数化演示，不代表各技法独立实录。样本音区以外经移调播放。</p></details>`;stage.after(controls);const status=controls.querySelector('.basic-audio-state');audio.onstate=t=>status.textContent=t;controls.querySelector('input').oninput=e=>audio.setVolume(Number(e.target.value)/100);audio.setVolume(.75);audio.preload().catch(()=>{});
 async function run(notes,shape,technique){try{const events=planPluckedAudio(getConfig(),notes,shape,{technique});if(!events.length)throw Error('请先输入可演奏的音符。');await audio.play(events,{onEvent:onPlayback,onEnd:()=>onPlayback?.(null)});}catch(e){status.textContent=e.message;}}
 function chord(technique){const result=getResult();if(result.level==='impossible'){status.textContent=result.reason;return;}run(editor.notes,result.shape,technique);}
 function note(n){const r=getResult(),p=r.shape.find(p=>p.midi===n.midi);if(p)run([n],[p]);else status.textContent='该谱音暂无可演奏音位，请检查定弦和分弦。';}
 function handler(e){const b=e.target.closest('button');if(!b)return;const key=b.dataset.basicAudio;if(key==='stop'){audio.stop();onPlayback?.(null);status.textContent='已停止';}if(key==='test')run([{midi:getConfig().tuning[0]||65}],[{midi:getConfig().tuning[0]||65,s:0,fret:0}]);if(key==='chord')chord();if(b.dataset.action==='audition-tech')chord(b.dataset.tech);}
 el.addEventListener('click',handler);
 return {playChord:chord,playNote:note,playPosition:p=>run([{midi:p.midi}],[p]),refresh(){const b=el.querySelector('[data-score-action="play"]');if(b){b.textContent='按谱中技法试听';b.disabled=!editor.notes.length||getResult().level==='impossible';b.removeAttribute('aria-disabled');b.onclick=null;}},dispose(){audio.dispose();el.removeEventListener('click',handler);controls.remove();}};
}
