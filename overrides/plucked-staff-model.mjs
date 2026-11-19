// Written pitch is kept separate from sounding MIDI, so clef changes never transpose.
export const LETTERS=['C','D','E','F','G','A','B'];
const NATURAL=[0,2,4,5,7,9,11];
let serial=0;
export function makeNote(step,alter=0,extra={}){
 if(!Number.isInteger(step)||step<7||step>56)throw new Error('当前记谱范围为 C1–C8。');
 if(![-1,0,1].includes(alter))throw new Error('请选择升号、降号或还原号。');
 const octave=Math.floor(step/7),letter=LETTERS[((step%7)+7)%7],midi=(octave+1)*12+NATURAL[step%7]+alter;
 return {...extra,id:extra.id||`score-${++serial}`,step,alter,letter,octave,midi};
}
export function spellMidi(midi,flat=false,extra={}){
 const map=flat?[[0,0],[1,-1],[1,0],[2,-1],[2,0],[3,0],[4,-1],[4,0],[5,-1],[5,0],[6,-1],[6,0]]:[[0,0],[0,1],[1,0],[1,1],[2,0],[3,0],[3,1],[4,0],[4,1],[5,0],[5,1],[6,0]];
 const [letter,alter]=map[((midi%12)+12)%12];return makeNote((Math.floor(midi/12)-1)*7+letter,alter,extra);
}
export function spellToken(token){const m=token.match(/^([A-Ga-g])([#b♯♭♮]?)([1-8])$/);if(!m)throw new Error('音高请写成 C4、F#3 或 Bb3。');return makeNote(Number(m[3])*7+LETTERS.indexOf(m[1].toUpperCase()),['#','♯'].includes(m[2])?1:['b','♭'].includes(m[2])?-1:0,{natural:m[2]==='♮'});}
export const noteToken=n=>`${n.letter}${n.alter===1?'#':n.alter===-1?'b':''}${n.octave}`;
export const scoreName=n=>`${n.letter}${n.alter===1?'♯':n.alter===-1?'♭':n.natural?'♮':''}${n.octave}`;
export const bottomStep=clef=>clef==='bass'?18:30; // G2 / E4
export const stepAtY=(y,bottom,clef,spacing=14)=>Math.max(7,Math.min(56,bottomStep(clef)+Math.round((bottom-y)/(spacing/2))));
export const yAtStep=(step,bottom,clef,spacing=14)=>bottom-(step-bottomStep(clef))*spacing/2;
export function editChord(notes,{type,note,id,binding,technique},maxNotes=4){
 let next=notes.map(n=>({...n}));
 if(type==='clear')return [];
 if(type==='remove')return next.filter(n=>n.id!==id);
 if(type==='technique'){if(typeof technique!=='string'||!technique)return next;return next.map(n=>{if(n.id!==id)return n;const ids=n.techniques||[];return {...n,techniques:ids.includes(technique)?ids.filter(t=>t!==technique):[...ids,technique]};});}
 if(type==='bind')return next.map(n=>n.id===id?{...n,binding}:n);
 const index=type==='collect'?next.findIndex(n=>n.binding?.s===binding.s):type==='replace'?next.findIndex(n=>n.id===id):-1;
 const duplicate=next.find((n,i)=>i!==index&&n.midi===note.midi);
 if(duplicate)throw new Error(`${scoreName(duplicate)} 已在和弦中，请选择其他音高。`);
 if(index<0&&next.length>=maxNotes)throw new Error(`最多输入 ${maxNotes} 个音；请先删除或修改已有音符。`);
 if(index>=0)next[index]={...next[index],...note,techniques:next[index].techniques||[],id:next[index].id,...(type==='collect'?{binding}:{binding:undefined})};else next.push({...note,...(type==='collect'?{binding}:{})});
 return next;
}
