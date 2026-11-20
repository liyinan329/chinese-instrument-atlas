// Animate the instrument surface itself; no floating hit markers.
export class PercussionFeedback{
 constructor(){this.surfaces=new Map();this.active=new Map();}
 key(p){return p.uid+':'+p.index;}
 register(p,mesh,{drum=false,radius=1}={}){const k=this.key(p),entry={mesh,drum,radius,position:mesh.position.clone(),rotation:mesh.rotation.clone()};if(drum)entry.base=mesh.geometry.attributes.position.array.slice();const list=this.surfaces.get(k)||[];list.push(entry);this.surfaces.set(k,list);}
 press(p,now=performance.now()/1000){const k=this.key(p);this.active.set(k,{phase:'press',start:now});}
 release(p,now=performance.now()/1000){const k=this.key(p);this.active.set(k,{phase:'rebound',start:now});}
 cancel(p){const k=this.key(p);this.restore(k);this.active.delete(k);}
 restore(k){for(const s of this.surfaces.get(k)||[]){s.mesh.position.copy(s.position);s.mesh.rotation.copy(s.rotation);if(s.base){s.mesh.geometry.attributes.position.array.set(s.base);s.mesh.geometry.attributes.position.needsUpdate=true;s.mesh.geometry.computeVertexNormals();}}}
 step(now=performance.now()/1000,{reduced=false}={}){for(const [k,a]of this.active){const age=Math.max(0,now-a.start);if(reduced||a.phase==='rebound'&&age>.48){this.restore(k);this.active.delete(k);continue;}const displacement=a.phase==='press'?-.018*(1-Math.exp(-age*45)):-.018*Math.exp(-age*10)*Math.cos(age*38);for(const s of this.surfaces.get(k)||[]){if(s.drum){const attr=s.mesh.geometry.attributes.position;for(let i=0;i<attr.count;i++){const x=s.base[i*3],z=s.base[i*3+2],r=Math.hypot(x,z)/s.radius;attr.array[i*3+1]=s.base[i*3+1]+displacement*Math.max(0,1-r*r);}attr.needsUpdate=true;s.mesh.geometry.computeVertexNormals();}else{s.mesh.rotation.x=s.rotation.x+displacement*.8;s.mesh.position.z=s.position.z+displacement*.35;}}}}
 clear(){for(const k of this.active.keys())this.restore(k);this.active.clear();this.surfaces.clear();}
}
export function bindPercussionPress(element,{enabled,hit,feedback,onPrepare=()=>{},onRelease=()=>{}}){let down=null,blocked=false;const pointers=new Set();
 const cancel=()=>{if(down)feedback.cancel(down.p);down=null;};
 const start=e=>{if(!enabled()||e.pointerType!=='touch'&&e.button!==0)return;if(!pointers.size)blocked=false;pointers.add(e.pointerId);if(pointers.size>1){blocked=true;cancel();return;}const p=hit(e);if(!p)return;down={id:e.pointerId,x:e.clientX,y:e.clientY,p};feedback.press(p);onPrepare(p);};
 const move=e=>{if(down&&down.id===e.pointerId&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)cancel();};
 const end=e=>{if(down&&down.id===e.pointerId){const p=hit(e),same=p&&p.uid===down.p.uid&&p.index===down.p.index&&p.surface===down.p.surface;if(e.type==='pointerup'&&!blocked&&same){const chosen=down.p;down=null;feedback.release(chosen);onRelease(chosen);}else cancel();}pointers.delete(e.pointerId);if(!pointers.size)blocked=false;};
 element.addEventListener('pointerdown',start);element.addEventListener('pointermove',move);for(const t of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(t,end);
 return{cancel,dispose(){cancel();pointers.clear();element.removeEventListener('pointerdown',start);element.removeEventListener('pointermove',move);for(const t of ['pointerup','pointercancel','lostpointercapture'])element.removeEventListener(t,end);}};
}
