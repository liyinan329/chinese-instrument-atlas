import {PipaAudio} from './audio.mjs';
export const ruanPitchRate=(midi,hz)=>440*2**((midi-69)/12)/hz;
export function chooseRuanSample(bank,midi,iteration=0){
 const nearest=Math.min(...bank.map(s=>Math.abs(midi-s.root_midi)));
 const pool=bank.filter(s=>Math.abs(midi-s.root_midi)<=nearest+.15);
 return pool[iteration%pool.length];
}
export function scheduleRuanRecordings(events,recordings,technique='down'){
 const groups=new Map(),scheduled=[];
 for(const e of events){const id=e.technique||technique;if(id!=='tremolo'||!recordings.has(id)){scheduled.push(e);continue;}const key=JSON.stringify([id,e.s,e.midi]);if(!groups.has(key))groups.set(key,{...e,time:0});const voice=groups.get(key);voice.duration=Math.max(voice.duration,e.time+e.duration);}
 return [...scheduled,...groups.values()].sort((a,b)=>a.time-b.time);
}
export class RuanAudio extends PipaAudio{
 constructor(){super();this.generation=0;this.recordings=new Map();this.timers=new Set();this.iteration=0;}
 stop(){this.generation++;for(const timer of this.timers)clearTimeout(timer);this.timers.clear();super.stop();}
 async importRecording(id,file,midi){await this.ready();if(file.size>30*1024*1024)throw Error('单份录音请控制在30MB以内。');const buffer=await this.ctx.decodeAudioData(await file.arrayBuffer());if(buffer.duration<.05||buffer.duration>60)throw Error('请使用0.05至60秒的录音。');this.recordings.set(id,{buffer,midi,name:file.name});return buffer.duration;}
 removeRecording(id){this.recordings.delete(id);}
 async loadBase(){if(!this.basePromise)this.basePromise=(async()=>{const response=await fetch(new URL('./audio/ruan/bank.json',import.meta.url));if(!response.ok)throw Error('中阮实录目录未载入，请刷新或重新打开离线包。');const meta=await response.json();this.bank=await Promise.all(meta.samples.map(async sample=>{const r=await fetch(new URL('./audio/ruan/'+sample.file,import.meta.url));if(!r.ok)throw Error('中阮实录未载入：'+sample.file);return {...sample,buffer:await this.ctx.decodeAudioData(await r.arrayBuffer())};}));})().catch(e=>{this.basePromise=null;throw e;});await this.basePromise;}
 async play(events,{technique='down',onEvent=()=>{},onEnd=()=>{}}={}){
  this.stop();const generation=this.generation;await this.ready();await this.loadBase();if(generation!==this.generation)return;
  const start=this.ctx.currentTime+.04,prior=new Map();let end=0;
  for(const e of scheduleRuanRecordings(events,this.recordings,technique)){
   const id=e.technique||technique,own=this.recordings.get(id),sample=own||chooseRuanSample(this.bank,e.midi,this.iteration++),src=this.ctx.createBufferSource(),gain=this.ctx.createGain(),time=start+Math.max(0,e.time),rate=own?2**((e.midi-own.midi)/12):ruanPitchRate(e.midi,sample.root_hz);
   src.buffer=sample.buffer;src.playbackRate.value=rate;const duration=Math.max(.015,Math.min(e.duration,src.buffer.duration/rate));
   if(e.slide){src.detune.setValueAtTime(0,time);const begins=duration*.12,span=duration*.7;for(let k=1;k<=12;k++)src.detune.linearRampToValueAtTime(e.slide*100*k/12,time+begins+span*k/12);}
   if(e.bend){src.detune.setValueAtTime(0,time);src.detune.linearRampToValueAtTime(e.bend*100,time+duration*.35);src.detune.linearRampToValueAtTime(0,time+duration*.8);}
   if(e.vibrato){const lfo=this.ctx.createOscillator(),depth=this.ctx.createGain();lfo.frequency.value=5;depth.gain.setValueAtTime(0,time);depth.gain.linearRampToValueAtTime(e.vibrato*100,time+duration*.3);lfo.connect(depth);depth.connect(src.detune);lfo.start(time);lfo.stop(time+duration);this.voices.add(lfo);lfo.onended=()=>{this.voices.delete(lfo);lfo.disconnect();depth.disconnect();};}
   gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(e.velocity,time+.002);gain.gain.setValueAtTime(e.velocity,time+Math.max(.003,duration-.03));gain.gain.linearRampToValueAtTime(0,time+duration);
   const old=prior.get(e.s);if(old&&time<old.end){if(old.gain.gain.cancelAndHoldAtTime)old.gain.gain.cancelAndHoldAtTime(time);else{old.gain.gain.cancelScheduledValues(time);old.gain.gain.setValueAtTime(old.velocity,time);}old.gain.gain.linearRampToValueAtTime(0,time+.012);try{old.src.stop(time+.015);}catch{}}
   if(e.s!==undefined)prior.set(e.s,{src,gain,end:time+duration,velocity:e.velocity});src.connect(gain);gain.connect(this.master);src.start(time);src.stop(time+duration+.005);this.voices.add(src);src.onended=()=>{this.voices.delete(src);src.disconnect();gain.disconnect();};end=Math.max(end,Math.max(0,e.time)+duration);
   const timer=setTimeout(()=>{this.timers.delete(timer);if(generation===this.generation)onEvent(e);},Math.max(0,(time-this.ctx.currentTime)*1000));this.timers.add(timer);
  }
  const timer=setTimeout(()=>{this.timers.delete(timer);if(generation===this.generation){this.onstate('播放结束');onEnd();}},(end+.09)*1000);this.timers.add(timer);
  this.onstate(events.every(e=>this.recordings.has(e.technique||technique))?'本机载入的授权录音 · 按谱音移调':'中阮分音区实录移调 · 技法为参数化参考');return end;
 }
 dispose(){this.stop();this.recordings.clear();this.bank=[];if(this.ctx&&this.ctx.state!=='closed')this.ctx.close();}
}
