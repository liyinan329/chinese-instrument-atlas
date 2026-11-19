import {validateRuan,planRuan} from './ruan-techniques.mjs';
const t=(id,name,category,action,sound,use,caution,mark,kind='single',extra={})=>({id,name,category,action,sound,use,caution,mark,kind,...extra});
export const liuqinTechniques=[
 t('down','弹','右手','拇指与食指持拨片，以腕部带动向下触弦。','起音清楚，余音自然衰减。','适合清晰旋律、节奏重音和跳跃音型。','避免持续重压拨片；力度和入弦深度应配合音区。','可写下拨记号，首次注明“弹”。'),
 t('up','挑','右手','保持持拨手型，拨片反向通过琴弦。','与弹奏方向相反，音头的轻重可作调整。','与弹交替组织快速旋律及弱拍。','连续音型需核对拨向与过弦路线。','可写上拨记号，首次注明“挑”。'),
 t('alternate','弹挑','右手','拨片往返，每次触弦对应一个明确的节奏音。','具有清楚可数的连续颗粒。','用于快板、反复音和节奏性旋律。','需逐音写出时值；不与自由密度轮奏混用。','记出实际节奏，必要时加弹挑方向。','sequence'),
 t('double','双弹','右手','拨片向下通过两根参与弦，左手安排两个音。','两个音以极短先后形成双音。','用于旋律加厚、平行音程和和声重音。','须标在两个参与音上；检查分弦和未奏弦的制音。','双音和弦并加下拨记号。','chord',{count:2}),
 t('doubleUp','双挑','右手','拨片反向通过两根参与弦。','双音起音顺序与双弹相反。','用于双弹、双挑交替的音型。','两音必须占用不同弦，不能仅按音高排序决定拨向。','双音和弦并加上拨记号。','chord',{count:2,motion:'sweepUp'}),
 t('sweepDown','扫','右手','拨片顺向连续通过三根或四根参与弦。','起音集中而有先后，和声颗粒鲜明。','用于和弦重音、节奏层及段落推进。','先检查左手和弦；不参与的弦应避开或制音。','和弦旁标扫弦方向，必要时写弦序。','chord',{minCount:3}),
 t('sweepUp','拂','右手','拨片反向通过三根或四根参与弦。','扫弦顺序反转，可形成不同重音。','与扫交替，形成富于弹性的节奏。','拨向影响起音顺序；快速扫拂应结合速度试奏。','注明反向扫弦或文字“拂”。','chord',{minCount:3}),
 t('tremolo','轮奏','右手','拨片小幅、快速地往返弹挑，延续同一声线。','连续触弦形成延续感，仍有细密颗粒。','用于长音、旋律延展与力度变化。','柳琴使用拨片轮奏，不使用琵琶五指依次轮指。','震音斜线并注明“轮”；实值重复另写节奏。','tremolo'),
 t('doubleWheel','双轮','右手','拨片在两根参与弦上作连续往返触弦。','双音被连续延展，具有和声厚度。','用于双音长音及旋律增厚。','两音分弦和左手持续按弦需核对；不是两个独立声部。','双音和弦加轮奏标记，注明两根弦。','tremolo',{count:2,motion:'tremolo'}),
 t('longWheel','长轮','右手','在较长时值或乐句中持续控制拨片往返。','延续较长的声线，可组织渐强渐弱。','适合慢板旋律和跨音连接。','换音、换弦处须顾及左右手衔接，延音不等于无限保留余响。','注明“长轮”及起止范围，必要时加连线。','tremolo',{motion:'tremolo'}),
 t('sweepWheel','扫轮','右手','拨片在三根或四根参与弦间连续往返扫奏。','密集而饱满的和弦音响。','用于和声高潮和较强的节奏织体。','左手和弦及非和弦弦制音须先落实，不代替任意多声部持续。','和弦加轮奏标记，注明“扫轮”。','tremolo',{minCount:3,motion:'sweepDown'}),
 t('arpeggio','琶音','右手','按指定次序依次拨出各和弦音。','不同音依次进入，余响可以重叠。','适合伴奏织体、连接和声与音色展开。','明确方向与节奏；分解的可行性不能按同时和弦一概而论。','逐音写节奏，或琶音波线并注明方向。','sequence'),
 t('vibrato','揉弦','左手','按弦指围绕音高中心作受控的轻微往复。','使延音产生细小音高波动。','用于旋律延音的表情处理。','应使用按音；幅度与速度依乐句调整，不把揉弦写成固定半音。','文字“揉”或 vibr.，可注明开始时刻。','vibrato'),
 t('bend','推拉弦','左手','保持按弦并横向改变弦张力，形成升高后返回的效果。','音高向上偏移，起音不重新触发。','用于倚靠音高和局部表情。','柳琴弦短、张力与把位影响幅度；半音仅作试听参考。','写明目标音高或幅度，以及是否返回。','bend'),
 t('slideUp','上滑音','左手','先拨弦起音，再沿同弦移向较高音位。','有品乐器会带出经过品位的颗粒变化。','用于上行连接和旋律装饰。','起止音须在同一根弦，滑动时间应明确。','起止音之间加 gliss. 线。','gliss',{target:true,direction:1}),
 t('slideDown','下滑音','左手','按弦指沿同一根弦移向较低位置。','音高下行，余响随动作自然衰减。','用于下行连接、收束与装饰。','不能低于所用弦的空弦音；不得跨弦模拟连续滑音。','起止音间加下行滑线。','gliss',{target:true,direction:-1}),
 t('hammer','打音','左手','右手先起音，左手另一指落到同弦较高品位。','第二音由左手击弦形成较柔和的音头。','用于装饰音和同弦连奏。','预留可用手指，指定实际目标品位。','两音加连线，并注明“打”。','slur',{target:true,direction:1}),
 t('pullOff','带音','左手','按弦指离弦时轻微带弦，带出较低音或空弦。','后音通常较弱，带有左手取音特征。','用于下行连奏和装饰。','较低音若不是空弦，需提前按住该音位。','两音加连线，并注明“带”。','slur',{target:true,direction:-1}),
 t('trill','颤音','左手','起音后在主音与指定上方邻音之间反复打、带。','两个实际音高快速交替，区别于揉弦。','用于装饰性延音和局部张力。','须指定邻音；两音在同弦内安排，不省略变音记号。','主音上方写 tr，注明邻音及持续范围。','trill',{target:true,direction:1,motion:'trill'}),
 t('harmonic','自然泛音','泛音与音色','左手轻触当前空弦的泛音节点，拨弦后离开触点。','产生轻盈、透明的泛音实音。','用于音色对比、清淡织体与句尾。','本页使用实际发声音高；须核对弦序、节点和自然音分偏差。','实际音高附泛音记号，并注明弦与触点。','harmonic'),
 t('palmMute','闷音','泛音与音色','掌缘在琴码附近轻触弦，同时拨奏。','余响缩短，音头更短促。','用于轻巧节奏与断续织体。','与先发音再止住的制音区分，注意持拨片手型。','文字“闷音”，注明持续范围。'),
 t('stop','制音','泛音与音色','发音后主动触弦，终止不需要的余响。','正常音头之后迅速收音。','用于休止、清理和声及段落收束。','必要时单独标明收音时刻，不能只依靠休止符推断。','文字“止音”，说明所涉及琴弦。')
];
export const liuqinTechnique=id=>liuqinTechniques.find(t=>t.id===id)||liuqinTechniques[0];
export const liuqinSources=[{title:'香港康文署音乐事务处 · 柳琴必修教材',url:'https://www.lcsd.gov.hk/en/mo/common/doc/faq/faq_01_syb_0201.pdf'},{title:'香港中乐团 · 柳琴基础课程',url:'https://www.hkco.org/uploads/docs/568e1484b0e8e1.pdf'},{title:'王惠然谈柳琴 · 演奏与乐器改革',url:'https://www.huain.com/article/liuqin/2024/0320/2611.html'}];
export const validateLiuqin=(notes,id,c,shape,target)=>validateRuan(notes,id,c,shape,target,liuqinTechniques);
export function planLiuqin(notes,id='down',params={}){
 if(!notes.length)return [];
 const normal={doubleUp:'sweepUp',doubleWheel:'tremolo',longWheel:'tremolo',sweepWheel:'tremolo'}[id]||id;
 if(id==='trill'){const n=notes[0],duration=params.duration||2.4,speed=params.speed||10,count=Math.max(2,Math.floor(duration*speed));return Array.from({length:count},(_,i)=>({midi:i%2?params.target:n.midi,s:n.s??n.binding?.s,time:i/speed,duration:Math.min(.28,duration-i/speed),velocity:i? .43:.7,technique:id,pick:0}));}
 return planRuan(notes,normal,params,liuqinTechniques).map(e=>({...e,technique:id}));
}
