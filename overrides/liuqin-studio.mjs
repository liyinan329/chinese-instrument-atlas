import {mountRuanStudio} from './ruan-studio.mjs';
import {RuanAudio} from './ruan-audio.mjs';
import {liuqinTechniques,liuqinTechnique,liuqinSources} from './liuqin-techniques.mjs';
import {liuqinParams,liuqinPositions,liuqinScoreEvents} from './liuqin-score.mjs';
export const liuqinStudioProfile={id:'liuqin',name:'柳琴',techniques:liuqinTechniques,technique:liuqinTechnique,params:liuqinParams,positions:liuqinPositions,scoreEvents:liuqinScoreEvents,sources:liuqinSources,testMidi:74,defaultPitch:'G4',aliases:{'单弹':'down','挑奏':'up','弹挑':'alternate','轮奏':'tremolo','扫弦':'sweepDown','泛音':'harmonic','滑音':'slideUp','制音':'stop'},visibleSoundLabel:'柳琴拨弦合成参考 · 非真实采样',referenceLabel:'柳琴拨弦合成参考，非真实柳琴或独立技法录音。',wheelExplanation:'柳琴轮奏由拨片快速弹挑形成，不套用琵琶五指轮指。',soundDescription:'当前试听为本项目生成的柳琴拨弦合成参考，使用4个参考音区、8份起音波形，非真实柳琴采样；没有借用琵琶、中阮或商业音源录音。谱音、轮奏、扫拂及左手技法用于交互参考。可在技法窗口载入有权使用的单音或技法录音，并填写其实际音高；文件仅在本次浏览器会话使用，不上传。',createAudio:()=>new RuanAudio({instrumentName:'柳琴',bankUrl:'./audio/liuqin/bank.json',soundLabel:'柳琴拨弦合成参考 · 非真实采样'})};
export const mountLiuqinStudio=(el,options)=>mountRuanStudio(el,{...options,profile:liuqinStudioProfile});
