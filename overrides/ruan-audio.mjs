import {PipaAudio} from './audio.mjs';
// Self-contained plucked-string reference. No pipa samples, no claim of ruan recording.
export function ruanWave(midi,{sampleRate=32000,duration=2.8,pick=0,harmonic=false}={}){
 const f=440*2**((midi-69)/12),data=new Float32Array(Math.ceil(duration*sampleRate));
 let state=1979+midi*179+pick*97;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296-.5;};
 const harmonics=Math.min(32,Math.floor(sampleRate*.44/f));
 for(let k=1;k<=harmonics;k++){const level=Math.sin(Math.PI*k*(pick?.21:.17))/k**1.12*(harmonic&&k>4?.2:1),decay=1.25+k*.23;for(let i=0;i<data.length;i++){const t=i/sampleRate;data[i]+=level*Math.sin(2*Math.PI*f*k*t+.025*k)*Math.exp(-t*decay);}}
 let peak=.001;for(let i=0;i<data.length;i++){const t=i/sampleRate;data[i]=(data[i]+rand()*.08*Math.exp(-t*135))*Math.min(1,t/.0025);peak=Math.max(peak,Math.abs(data[i]));}for(let i=0;i<data.length;i++)data[i]=data[i]/peak*.7*Math.min(1,(data.length-i)/(sampleRate*.03));return data;
}
export class RuanAudio extends PipaAudio{
 constructor(){super();this.generation=0;this.cache=new Map();this.recordings=new Map();this.timers=new Set();}
 stop(){this.generation++;for(const t of this.timers)clearTimeout(t);this.timers.clear();super.stop();}
 async importRecording(id,file,midi){await this.ready();if(file.size>30*1024*1024)throw Error('单份录音请控制在30MB以内。');const buffer=await this.ctx.decodeAudioData(await file.arrayBuffer());if(buffer.duration<.05||buffer.duration>60)throw Error('请使用0.05至60秒的录音。');this.recordings.set(id,{buffer,midi,name:file.name});return buffer.duration;}
 removeRecording(id){this.recordings.delete(id);}
 bufferFor(e){const key=`${e.midi}:${e.pick||0}:${!!e.harmonic}`;if(!this.cache.has(key)){const wave=ruanWave(e.midi,{sampleRate:this.ctx.sampleRate,pick:e.pick,harmonic:e.harmonic}),b=this.ctx.createBuffer(1,wave.length,this.ctx.sampleRate);b.copyToChannel(wave,0);this.cache.set(key,b);}return this.cache.get(key);}
 async loadBase(){if(!this.basePromise)this.basePromise=(async()=>{const response=await fetch(new URL('./audio/ruan/zhongruan-d4.wav',import.meta.url));if(!response.ok)throw Error('中阮实录未载入，请刷新或重新打开离线包。');const buffer=await this.ctx.decodeAudioData(await response.arrayBuffer());this.base={buffer,midi:69+12*Math.log2(294.5/440)};})().catch(e=>{this.basePromise=null;throw e;});await this.basePromise;}
 async play(events,{technique='down',onEvent=()=>{}}={}){
  this.stop();const generation=this.generation;await this.ready();await this.loadBase();if(generation!==this.generation)return;
  const start=this.ctx.currentTime+.035,prior=new Map();let end=0;
  // Continuous recordings are played once per voice; mixed markings retain their own bank.
  const seen=new Set(),length=Math.max(0,...events.map(e=>e.time+e.duration));
  const scheduled=events.filter(e=>{if(!(this.recordings.has(e.technique||technique)&&(e.technique||technique)==='tremolo'))return true;const key=`${e.technique}:${e.s}:${e.midi}`;if(seen.has(key))return false;seen.add(key);return true;});
  for(const raw of scheduled){const id=raw.technique||technique,own=this.recordings.get(id),e=own&&id==='tremolo'?{...raw,time:0,duration:length}:raw;const src=this.ctx.createBufferSource(),gain=this.ctx.createGain(),time=start+Math.max(0,e.time);src.buffer=own?.buffer||this.base.buffer;const rate=2**((e.midi-(own||this.base).midi)/12);src.playbackRate.value=rate;const duration=Math.max(.04,Math.min(e.duration,src.buffer.duration/rate));
   if(e.slide){src.detune.setValueAtTime(0,time);for(let k=1;k<=12;k++)src.detune.linearRampToValueAtTime(e.slide*100*k/12,time+.12+(duration-.2)*k/12);}
   if(e.bend){src.detune.setValueAtTime(0,time);src.detune.linearRampToValueAtTime(e.bend*100,time+duration*.35);src.detune.linearRampToValueAtTime(0,time+duration*.8);}
   if(e.vibrato){const lfo=this.ctx.createOscillator(),depth=this.ctx.createGain();lfo.frequency.value=5;depth.gain.value=e.vibrato*100;lfo.connect(depth);depth.connect(src.detune);lfo.start(time);lfo.stop(time+duration);this.voices.add(lfo);lfo.onended=()=>{this.voices.delete(lfo);lfo.disconnect();depth.disconnect();};}
   gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(e.velocity,time+.003);gain.gain.setValueAtTime(e.velocity,time+Math.max(.004,duration-.045));gain.gain.linearRampToValueAtTime(0,time+duration);
   const old=prior.get(e.s);if(old&&time<old.end){old.gain.gain.cancelScheduledValues(time);old.gain.gain.setValueAtTime(old.velocity,time);old.gain.gain.linearRampToValueAtTime(0,time+.018);try{old.src.stop(time+.02);}catch{}}
   if(e.s!==undefined)prior.set(e.s,{src,gain,end:time+duration,velocity:e.velocity});src.connect(gain);gain.connect(this.master);src.start(time);src.stop(time+duration+.01);this.voices.add(src);src.onended=()=>{this.voices.delete(src);src.disconnect();gain.disconnect();};end=Math.max(end,e.time+duration);
   const timer=setTimeout(()=>{this.timers.delete(timer);if(generation===this.generation)onEvent(e);},Math.max(0,(time-this.ctx.currentTime)*1000));this.timers.add(timer);
  }
  const timer=setTimeout(()=>{this.timers.delete(timer);if(generation===this.generation)this.onstate('播放结束');},(end+.08)*1000);this.timers.add(timer);
  this.onstate(events.every(e=>this.recordings.has(e.technique||technique))?'本机载入的授权录音 · 按谱音移调':'中阮实录切片移调 · 技法为参数化演示');return end;
 }
}
