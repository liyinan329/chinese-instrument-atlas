// Presentation-scale transverse response, not audio-rate physical simulation.
export function stringOffset(u,age,{amplitude=.012,strength=1,index=0}={}){
 if(u<=0||u>=1||age<0||age>1.15)return {x:0,z:0};
 const envelope=Math.exp(-age*6.8)*Math.min(1,age/.008),phase=2*Math.PI*(13+index*.7)*age;
 return {x:amplitude*strength*envelope*(Math.sin(Math.PI*u)*Math.sin(phase)+.17*Math.sin(2*Math.PI*u)*Math.sin(phase*2.03)),z:amplitude*strength*.24*envelope*Math.sin(Math.PI*u)*Math.cos(phase)};
}
export class StringFeedback{
 constructor(){this.strings=new Map();this.hits=new Map();}
 add(index,mesh,{bridge,nut,amplitude=.012}={}){const attr=mesh.geometry.attributes.position;this.strings.set(index,{mesh,attr,rest:Float32Array.from(attr.array),bridge,nut,amplitude,baseColor:mesh.material?.color?.clone(),dirty:false});}
 pluck(index,{strength=.75,stop,now=performance.now()/1000}={}){if(!this.strings.has(index))return;this.hits.set(index,{time:now,strength:Math.max(.15,Math.min(1,strength)),stop});}
 step(now=performance.now()/1000,{reduced=false}={}){if(reduced)this.hits.clear();let response=0;
 for(const [index,s]of this.strings){const hit=this.hits.get(index),age=hit?now-hit.time:Infinity;const active=hit&&age>=0&&age<=1.15;if(!active&&!s.dirty)continue;
 const end=Math.min(s.nut,Math.max(s.bridge+.001,hit?.stop??s.nut));
 for(let i=0;i<s.rest.length;i+=3){const u=(s.rest[i+1]-s.bridge)/(end-s.bridge),delta=active?stringOffset(u,age,{amplitude:s.amplitude,strength:hit.strength,index}):{x:0,z:0};s.attr.array[i]=s.rest[i]+delta.x;s.attr.array[i+2]=s.rest[i+2]+delta.z;}
 if(s.baseColor){s.mesh.material.color.copy(s.baseColor);if(active)s.mesh.material.color.lerp({r:.88,g:.7,b:.36},Math.exp(-age*5)*.65);}
 s.attr.needsUpdate=true;s.dirty=!!active;if(!active)this.hits.delete(index);else response+=Math.sin(age*110)*Math.exp(-age*15)*Math.min(1,age/.006)*hit.strength;
 }
 return Math.max(-1,Math.min(1,response))*.00038;
 }
 reset(){this.hits.clear();for(const s of this.strings.values()){if(s.dirty){s.attr.array.set(s.rest);if(s.baseColor)s.mesh.material.color.copy(s.baseColor);s.attr.needsUpdate=true;s.dirty=false;}}}
 clear(){this.reset();this.strings.clear();}
}
