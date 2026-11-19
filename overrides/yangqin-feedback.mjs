import * as T from './vendor/three.module.js';
export const yangqinPalette={panel:'#78553d',string:'#f4ebda',ring:'#76bdad',rest:'#428f80'};
export function makeYangqinMarker({current=true}={}){const m=new T.Mesh(new T.RingGeometry(.029,.035,64),new T.MeshBasicMaterial({color:current?yangqinPalette.ring:yangqinPalette.rest,transparent:true,opacity:current?.98:.72,side:T.DoubleSide,depthWrite:false}));m.renderOrder=9;m.castShadow=m.receiveShadow=false;return m;}
export class YangqinPressFeedback{
 constructor(model){this.model=model;this.mesh=makeYangqinMarker();this.mesh.visible=false;model.add(this.mesh);this.state='idle';}
 press(position,now=performance.now()/1000){this.mesh.position.copy(position);this.mesh.position.z+=.014;this.mesh.scale.setScalar(1);this.mesh.material.opacity=1;this.mesh.visible=true;this.start=now;this.state='pressed';}
 release(now=performance.now()/1000){if(this.state!=='pressed')return;this.from=this.mesh.scale.x;this.start=now;this.state='released';}
 cancel(){this.state='idle';this.mesh.visible=false;this.mesh.scale.setScalar(1);}
 step(now=performance.now()/1000,{reduced=false}={}){if(this.state==='idle')return;const age=Math.max(0,now-this.start);if(this.state==='pressed'){this.mesh.scale.setScalar(reduced?1:1+.22*(1-Math.exp(-age*28)));return;}if(age>.3||reduced){this.cancel();return;}this.mesh.scale.setScalar(1+(this.from-1)*Math.exp(-age*16)*Math.cos(age*18));this.mesh.material.opacity=Math.max(0,1-age/.3);}
 dispose(){this.cancel();this.model.remove(this.mesh);this.mesh.geometry.dispose();this.mesh.material.dispose();}
}
export function bindYangqinPress(element,{enabled,hit,feedback}){let down=null;
 const start=e=>{if(!enabled()||e.pointerType!=='touch'&&e.button!==0)return;if(down){feedback.cancel();down=null;return;}const p=hit(e);if(!p)return;down={id:e.pointerId,x:e.clientX,y:e.clientY};feedback.press(p);};
 const move=e=>{if(down&&down.id===e.pointerId&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5){feedback.cancel();down=null;}};
 const end=e=>{if(!down||down.id!==e.pointerId)return;if(e.type==='pointerup')feedback.release();else feedback.cancel();down=null;};
 element.addEventListener('pointerdown',start);element.addEventListener('pointermove',move);for(const type of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(type,end);
 return {dispose(){element.removeEventListener('pointerdown',start);element.removeEventListener('pointermove',move);for(const type of ['pointerup','pointercancel','lostpointercapture'])element.removeEventListener(type,end);feedback.dispose();}};
}
