import {planTechnique,planAnnotated} from './score-audio.mjs';
import {PipaAudio} from './audio.mjs?v=3.0';

export class SamplePipaAudio extends PipaAudio {
 constructor(){super();this.manifest={samples:[],techniques:{},sources:[]};this.buffers=new Map();this.loading=new Map();this.stringVoices=new Map();this.generation=0;this.onSampleState=()=>{};this.onExcite=null;this.feedbackTimers=new Set();}
 async loadManifest(){if(!this.manifestPromise)this.manifestPromise=(async()=>{const r=await fetch('./recordings.json?v=6.0',{signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('真实音源目录读取失败，请重试。');this.manifest=await r.json();return this.manifest;})().catch(e=>{this.manifestPromise=null;throw e;});return this.manifestPromise;}
 async buffer(url){
  if(this.buffers.has(url))return this.buffers.get(url);
  if(!this.loading.has(url))this.loading.set(url,(async()=>{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error('录音下载失败，请检查网络后重试。');const buf=await this.ctx.decodeAudioData(await r.arrayBuffer());this.buffers.set(url,buf);return buf;})().finally(()=>this.loading.delete(url)));
  return this.loading.get(url);
 }
 nearest(midi,stringId){const same=stringId?this.manifest.samples.filter(s=>s.string===stringId):[];const pool=same.length?same:this.manifest.samples;return [...pool].sort((a,b)=>Math.abs(a.midi-midi)-Math.abs(b.midi-midi))[0];}
 async prepare(notes){const unlocked=this.ready();await Promise.all([unlocked,this.loadManifest()]);const samples=notes.map(n=>n?.wheel?this.wheelSample(n.midi):this.nearest(typeof n==='number'?n:n.midi,typeof n==='number'?undefined:n.s===undefined?undefined:4-n.s));if(samples.some(s=>!s))throw new Error('真实拨弦采样尚未载入。请稍后重试。');this.onstate('正在载入音色…');await Promise.all(samples.map(s=>this.buffer(s.url)));await this.ready();this.onstate('正在播放');return samples;}
 wheelSample(midi){return [...(this.manifest.wheelSustain?.samples||[])].sort((a,b)=>Math.abs(a.midi-midi)-Math.abs(b.midi-midi))[0];}
 sampled(midi,sample,{time=0,velocity=.75,stringIndex,s,wheel=false,duration:requestedDuration,slide=0,bend=0,vibrato=0,offset=0,fadeIn=.002,fadeOut=.035}={}){
  const ctx=this.ctx,buffer=this.buffers.get(sample.url);if(!buffer)return;
  if(stringIndex!==undefined){const old=this.stringVoices.get(stringIndex);if(old){old.gain.gain.cancelScheduledValues(ctx.currentTime);old.gain.gain.setValueAtTime(old.velocity,ctx.currentTime);old.gain.gain.linearRampToValueAtTime(0,ctx.currentTime+.025);try{old.src.stop(ctx.currentTime+.03);}catch{}}}
  const src=ctx.createBufferSource(),gain=ctx.createGain();src.buffer=buffer;src.playbackRate.value=(440*2**((midi-69)/12))/(sample.recordedFrequency||440*2**((sample.midi-69)/12));
  const duration=Math.min(requestedDuration||5,(buffer.duration-offset)/src.playbackRate.value),t=ctx.currentTime+.008+time;
  if(slide){src.playbackRate.setValueAtTime(src.playbackRate.value,t);src.playbackRate.exponentialRampToValueAtTime(src.playbackRate.value*2**(slide/12),t+duration*.7);}
  if(bend){src.detune.setValueAtTime(0,t);src.detune.linearRampToValueAtTime(bend*100,t+Math.min(.3,duration*.3));src.detune.linearRampToValueAtTime(0,t+duration*.8);}
  if(vibrato){const lfo=ctx.createOscillator(),depth=ctx.createGain();lfo.frequency.value=5.4;depth.gain.value=vibrato*100;lfo.connect(depth);depth.connect(src.detune);lfo.start(t);lfo.stop(t+duration);this.voices.add(lfo);lfo.onended=()=>{this.voices.delete(lfo);lfo.disconnect();depth.disconnect();};}
  gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(velocity,t+Math.min(fadeIn,duration/3));gain.gain.setValueAtTime(velocity,t+Math.max(.005,duration-Math.min(fadeOut,duration/3)));gain.gain.linearRampToValueAtTime(0,t+duration);
  src.connect(gain);gain.connect(this.master);src.start(t,offset);src.stop(t+duration+.01);this.voices.add(src);if(stringIndex!==undefined)this.stringVoices.set(stringIndex,{src,gain,velocity});src.onended=()=>{this.voices.delete(src);if(this.stringVoices.get(stringIndex)?.src===src)this.stringVoices.delete(stringIndex);src.disconnect();gain.disconnect();};
  if(typeof this.onExcite==='function'){const generation=this.generation,index=stringIndex??s;const trigger=(delay)=>{const timer=setTimeout(()=>{this.feedbackTimers.delete(timer);if(generation===this.generation&&Number.isInteger(index))this.onExcite({s:index,midi,velocity});},Math.max(0,(t-ctx.currentTime+delay)*1000));this.feedbackTimers.add(timer);};if(wheel){for(let elapsed=0;elapsed<duration;elapsed+=1/9)trigger(elapsed);}else trigger(0);}
  this.onSampleState(midi===sample.midi?'真实单音采样 · 音高校准':'真实采样 · 移调 '+(midi-sample.midi>0?'+':'')+(midi-sample.midi)+' 半音');
 }
 async playNote(midi,s){const generation=this.generation;const samples=await this.prepare([{midi,s}]);if(generation!==this.generation)return;this.sampled(midi,samples[0],{stringIndex:s});}
 async notes(notes,style='together'){
  this.stop();const generation=this.generation,samples=await this.prepare(notes);if(generation!==this.generation)return;
  notes.forEach((n,i)=>this.sampled(typeof n==='number'?n:n.midi,samples[i],{time:style==='arpeggio'?i*.2:style==='strum'?i*.025:0,velocity:.9/Math.sqrt(notes.length),stringIndex:typeof n==='number'?undefined:n.s}));
 }
 stop(){this.generation++;for(const timer of this.feedbackTimers)clearTimeout(timer);this.feedbackTimers.clear();super.stop();this.stringVoices.clear();}
 async recording(clip){
  this.stop();const generation=this.generation;await this.ready();const buffer=await this.buffer(clip.url);if(generation!==this.generation)return 0;
  const src=this.ctx.createBufferSource();src.buffer=buffer;src.connect(this.master);src.start();this.voices.add(src);src.onended=()=>{this.voices.delete(src);src.disconnect();};this.onSampleState('真实演奏片段 · 原速原调');return buffer.duration;
 }
 async scoreTechnique(notes,id){
  if(['wheel2','double','doubleTiao','fen','zhi'].includes(id)&&notes.length!==2)throw new Error('此技法的和弦试听需要两个音，请先调整谱面。');
  return this.playScoreEvents(planTechnique(notes,id));
 }
 async annotatedScore(notes){return this.playScoreEvents(planAnnotated(notes));}
 wheelVoice(event,sample){
  // Long wheels join continuous recorded gestures, rather than restarting a pluck on each finger.
  const buffer=this.buffers.get(sample.url),ratio=2**((event.m-sample.midi)/12),crossfade=.12;
  let elapsed=0,pass=0;
  while(elapsed<event.duration-.005){
   const offset=pass? .09:event.offset||0;
   const duration=Math.min(event.duration-elapsed,(buffer.duration-offset)/ratio);
   if(duration<=crossfade)break;
   this.sampled(event.m,sample,{...event,time:event.time+elapsed,offset,duration,fadeIn:pass?crossfade:.016,fadeOut:elapsed+duration>=event.duration-.005?.18:crossfade});
   elapsed+=duration-crossfade;pass++;
   if(elapsed+crossfade>=event.duration-.005)break;
  }
 }
 async playScoreEvents(events){
  this.stop();if(!events.length)return 0;
  const generation=this.generation,samples=await this.prepare(events.map(e=>({midi:e.m,s:e.s,wheel:e.wheel})));
  if(generation!==this.generation)return 0;
  events.forEach((e,i)=>e.wheel?this.wheelVoice(e,samples[i]):this.sampled(e.m,samples[i],e));
  this.onSampleState(events.some(e=>e.wheel)?'谱音轮奏 · 真实轮指纹理移调／叠合':'谱音技法试听 · 真实单音采样重奏，非技法实录');
  return Math.max(...events.map(e=>e.time+e.duration));
 }
 async sampleTechnique(type,midi=62,speed=6){
  if(['percussion','boardWheel','twist','scratch','harmonic','artificial'].includes(type))throw new Error('该效果需要专门音色采样，暂不能用普通单音采样重奏。');
  // Reuse only the gesture timing; the sound is from real recorded pipa notes.
  const unlocked=this.ready();
  const events=[],scheduler=new PipaAudio();scheduler.ready=async()=>{};scheduler.stop=()=>{};scheduler.pluck=(m,o={})=>events.push({m,...o});await scheduler.technique(type,midi,speed);await unlocked;
  this.stop();const generation=this.generation,samples=await this.prepare(events.map(e=>e.m));if(generation!==this.generation)return 0;
  events.forEach((e,i)=>this.sampled(e.m,samples[i],e));this.onSampleState('真实采样重奏 · 非该技法原始实录');return Math.max(...events.map(e=>(e.time||0)+(e.duration||1.5)));
 }
}
