const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const ruanPhases=id=>({trill:['起音','打带','交替','收束'],vibrato:['按弦','起音','揉弦','收束'],bend:['按弦','起音','推拉','返回'],slideUp:['起音','移指','到音','收束'],slideDown:['起音','移指','到音','收束'],hammer:['起音','抬指','打音','保持'],pullOff:['预按','起音','带弦','保持'],harmonic:['轻触','拨弦','离弦','余音'],palmMute:['掌缘靠码','触弦','保持闷音','收束'],stop:['起音','余音','制音','静止']}[id]||['靠近','触弦','离弦','回位']);
export function ruanMotionFrame(id,t,{fret=5,targetFret=7,s=1,harmonic=2}={}){
 t=clamp(t,0,1);const phase=Math.min(3,Math.floor(t*4));let position=fret,offset=0,contact=true,second=false;
 if(id==='slideUp'||id==='slideDown')position=fret+(targetFret-fret)*smooth((t-.2)/.3);
 if(id==='trill')position=Math.floor(t*8)%2?targetFret:fret;
 if(id==='vibrato')offset=Math.sin(t*Math.PI*8)*smooth((t-.2)/.2)*2;
 if(id==='bend')offset=Math.sin(Math.PI*smooth((t-.2)/.7))*12;
 if(id==='hammer'){second=t>=.45;contact=t<.25||t>=.45;if(second)position=targetFret;}
 if(id==='pullOff'){second=t>=.5;position=second?targetFret:fret;contact=true;}
 if(id==='harmonic')contact=t<.5;
 const ratio=id==='harmonic'?1-1/harmonic:1-2**(-position/12);
 return {phase,position,ratio,offset,contact,second,s:clamp(s,0,3),vibrating:t>.25&&!(id==='stop'&&t>.5)};
}
