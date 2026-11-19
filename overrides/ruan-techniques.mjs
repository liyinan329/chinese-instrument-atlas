// Zhongruan definitions deliberately do not reuse pipa finger-wheel terminology.
const t=(id,name,category,action,sound,use,caution,mark,kind='single',extra={})=>({id,name,category,action,sound,use,caution,mark,kind,...extra});
export const ruanTechniques=[
 t('down','弹','右手','拇指与食指持拨片，拨片向下通过琴弦，腕部自然回位。','音头清楚，随后自然衰减。','用于旋律、节奏及独立音头。','避免把每个音都理解为持续长音；长时值需另选轮奏。','音符上方写“弹”或下拨记号，首次说明方向。'),
 t('up','挑','右手','保持持拨手型，拨片反向通过琴弦，动作来自灵活的腕部。','与弹方向相反，可形成轻重差别。','与弹交替安排连续音型。','快速换弦时须检查拨片路线与节奏重音。','上拨记号或文字“挑”。'),
 t('alternate','弹挑','右手','拨片按弹、挑的顺序往返触弦，每次触弦对应一个明确的起音。','颗粒连续，起音数量可数。','用于有节奏的反复音与快速音型。','需逐音记出节奏；与自由密度的轮奏区分。','写出各次触弦节奏，必要时注明弹挑方向。','sequence'),
 t('tremolo','轮奏','右手','持拨手型保持稳定，腕部带动拨片小幅交替触弦，形成连续声线。','密集起音延续声音，可作渐强渐弱。','用于长音、歌唱性旋律和持续声部。','中阮通常为拨片往返轮奏，不套用琵琶五指轮指。','用震音斜线并注明“轮奏”；实值节奏应明确写出。','tremolo'),
 t('double','双音','右手','拨片通过两根参与弦，配合左手同时安排两个实音。','两个音近乎同时起音，允许自然的细小先后。','用于和声、平行音程和旋律加厚。','必须分别落在两根弦上；跳弦与其他弦的制音需核对。','记为双音和弦，必要时标弦号与拨向。','chord',{count:2}),
 t('sweepDown','扫弦','右手','拨片顺向通过参与和弦的琴弦，各弦起音依次发生。','音头集中、有方向性的和声音响。','用于重音、节奏及和声推进。','四弦不等于任意四音都能按出；非和弦弦须避开或制音。','和弦旁标扫弦方向，首次说明参与弦。','chord',{minCount:2}),
 t('sweepUp','拂弦','右手','拨片反向经过参与弦，与扫弦形成相反的过弦方向。','与扫弦的起音顺序相反。','用于扫拂交替与节奏变化。','先确定分弦，不能仅按谱面音高排序来代替实际过弦。','和弦旁标反向扫弦方向或文字“拂”。','chord',{minCount:2}),
 t('arpeggio','分解和弦','右手','按指定次序逐弦起音，其他音是否保留余响由左手和制音安排决定。','各音依次进入，余响可以重叠。','用于伴奏织体与和声展开。','分解顺序与节奏需写清；静态和弦难度不等同整段分解速度。','逐音记出节奏，或用琶音波线注明方向。','sequence'),
 t('vibrato','揉弦','左手','按弦指保持音高中心，在品位附近作受控的微小往复动作。','音高轻微波动，音头不反复重奏。','用于旋律延音及音色修饰。','宽度、速度依乐句与演奏者调整，不机械规定为半音。','文字“揉弦”或 vibr.，需要时说明起揉时刻。','vibrato'),
 t('bend','推拉弦','左手','在保持按弦的同时横向改变弦张力，形成音高偏移并可返回。','音高受控升高后返回或停留。','用于倚靠音高和特殊表情。','幅度受弦、把位与手型限制；本页半音幅度仅为参考。','写出目标音或幅度，注明推、拉及返回方式。','bend'),
 t('slideUp','上滑音','左手','先起音，再将按弦指沿同一根弦移向较高位置。','音高向上移动，有品乐器会带有经过品位的颗粒。','用于连接或装饰性上行。','须明确起止音及滑动时间；不能跨弦作连续滑音。','起止音间加 gliss. 线。','gliss',{target:true,direction:1}),
 t('slideDown','下滑音','左手','先起音，再沿同一根弦移动至较低音位。','音高下行，余音随移动逐渐衰减。','用于收束和下行连接。','目标不能低于所用空弦；左手路线与把位须核对。','起止音间加下行 gliss. 线。','gliss',{target:true,direction:-1}),
 t('hammer','打音','左手','右手先起音，左手另一指落在同弦较高音位，产生新的音头。','第二音较柔和，带有左手击弦起音。','用于连奏与装饰音。','需保留可用手指和实际目标品位，不按钢琴方式任意连奏。','两音加连线，注明“打”。','slur',{target:true,direction:1}),
 t('pullOff','带音','左手','按弦指离弦时作轻微带弦动作，使同弦较低音位或空弦发声。','第二音由左手带出，通常比首音弱。','用于下行连奏与装饰。','较低音若非空弦，应提前按住；实际指序须确认。','两音加连线，注明“带”。','slur',{target:true,direction:-1}),
 t('harmonic','自然泛音','泛音与音色','左手轻触空弦泛音节点，拨弦后及时离开轻触点。','声音轻盈，泛音实音高于空弦。','用于透明音色及音区对比。','此处按实际发声音高记谱，只提供当前定弦的常用自然泛音。','写实际音高，附泛音记号及弦号、触点。','harmonic'),
 t('palmMute','闷音','泛音与音色','掌缘靠近琴码轻触弦，拨弦时保持接触，限制余响。','音头短促，余音较少。','用于轻巧节奏及音色对比。','与起音后立即止住声音的制音区分。','文字“闷音”或 palm mute，说明持续范围。'),
 t('stop','制音','泛音与音色','起音后用手指或掌缘接触弦，主动终止余响。','正常起音后按指定时刻收音。','用于休止、段落收束和清理和声。','休止符不总能说明具体制音时间，必要时单独注明。','文字“止音”或终止余音记号。')
];
export const ruanTechnique=id=>ruanTechniques.find(t=>t.id===id)||ruanTechniques[0];
export const ruanSources=[{title:'济南大学音乐学院《音教器乐》教学大纲（中阮）',url:'https://music.ujn.edu.cn/info/1093/2238.htm'},{title:'香港康文署音乐事务处中阮必修教材',url:'https://www.lcsd.gov.hk/en/mo/common/doc/faq/faq_01_syb_0204.pdf'}];
export function naturalHarmonics(c){return c.tuning.flatMap((m,s)=>[2,3,4,5,6,8].map(h=>({s,h,midi:m+Math.round(12*Math.log2(h)),touch:Math.round(c.scale/h),cents:1200*Math.log2(h)-100*Math.round(12*Math.log2(h))})));}
export function validateRuan(notes,id,c,shape=[],target){
 const t=ruanTechnique(id);if(!notes.length)throw Error('请先在谱面输入音符。');
 if(t.count&&notes.length!==t.count)throw Error(`${t.name}需要选择${t.count}个参与音；可用“试听所选音”听普通奏法。`);
 if(t.minCount&&notes.length<t.minCount)throw Error(`${t.name}至少需要两个参与音。`);
 if(t.target){if(notes.length!==1)throw Error('滑音、打音与带音请先选一个音，再指定目标音。');const n=notes[0],p=n.binding||shape.find(p=>p.midi===n.midi);if(!Number.isInteger(target))throw Error('请填写目标实际音高，例如 D4。');if((target-n.midi)*t.direction<=0)throw Error(t.direction>0?'目标音应高于起音。':'目标音应低于起音。');if(!p||target<c.tuning[p.s]||target>c.tuning[p.s]+c.frets)throw Error('起止音不能安排在同一根弦的有效品位内。');}
 if(id==='harmonic')for(const n of notes){const p=n.binding;const matches=naturalHarmonics(c).filter(h=>h.midi===n.midi&&(!p||h.s===p.s));if(!matches.length)throw Error('此音不是当前定弦的常用自然泛音实音；请改音高或取消固定弦位。');}
 return true;
}
export function planRuan(notes,id='down',{speed=10,duration=2.4,target}={}){
 const t=ruanTechnique(id),ordered=[...notes].sort((a,b)=>(a.s??a.binding?.s??0)-(b.s??b.binding?.s??0)||a.midi-b.midi),events=[];
 const emit=(n,time=0,extra={})=>events.push({midi:n.midi,s:n.s??n.binding?.s,time,duration,velocity:.72/Math.sqrt(notes.length),technique:id,...extra});
 if(['tremolo','alternate'].includes(id)){const count=id==='alternate'?8:Math.floor(duration*speed);for(let k=0;k<count;k++)for(const n of ordered)emit(n,Math.max(0,k/speed+(k%3-1)*.0017),{duration:Math.min(.65,duration),velocity:(.6+.07*Math.sin(k*1.73))/Math.sqrt(notes.length),pick:k%2});}
 else if(['sweepDown','sweepUp','double','arpeggio'].includes(id)){let list=id==='sweepUp'?[...ordered].reverse():ordered;list.forEach((n,i)=>emit(n,i*(id==='arpeggio'?.18:.026)));}
 else for(const n of ordered){emit(n,0,{harmonic:id==='harmonic',vibrato:id==='vibrato'?.16:0,bend:id==='bend'?.7:0,duration:id==='palmMute'?.14:id==='stop'?.35:duration});if(t.target){if(['hammer','pullOff'].includes(id))emit({...n,midi:target},.35,{velocity:.43,duration:duration-.35});else events[events.length-1].slide=target-n.midi;}}
 return events;
}
