import {mountRuanStudio} from './ruan-studio.mjs';
import {RuanAudio} from './ruan-audio.mjs';
import {liuqinTechniques,liuqinTechnique,liuqinSources} from './liuqin-techniques.mjs';
import {liuqinParams,liuqinPositions,liuqinScoreEvents} from './liuqin-score.mjs';
export const liuqinStudioProfile={id:'liuqin',name:'柳琴',techniques:liuqinTechniques,technique:liuqinTechnique,params:liuqinParams,positions:liuqinPositions,scoreEvents:liuqinScoreEvents,sources:liuqinSources,testMidi:74,defaultPitch:'G4',aliases:{'单弹':'down','挑奏':'up','弹挑':'alternate','轮奏':'tremolo','扫弦':'sweepDown','泛音':'harmonic','滑音':'slideUp','制音':'stop'},visibleSoundLabel:'柳琴采样音色 · 技法为参数化参考',referenceLabel:'柳琴单音采样移调，技法为参数化演示，非独立技法录音。',wheelExplanation:'柳琴轮奏由拨片快速弹挑形成，不套用琵琶五指轮指。',soundDescription:'当前试听使用用户提供的 Kong Audio K 柳琴7个单音采样，按测得基频移调。轮奏、扫拂及左手效果由单音采样参数化组织，不代表独立技法实录。可在技法窗口载入有权使用的单音或技法录音，并填写其实际音高；文件仅在本次浏览器会话使用，不上传。',createAudio:()=>new RuanAudio({instrumentName:'柳琴',bankUrl:'./audio/liuqin/bank.json',soundLabel:'柳琴采样音色 · 技法为参数化参考'})};
export const mountLiuqinStudio=(el,options)=>mountRuanStudio(el,{...options,profile:liuqinStudioProfile});
