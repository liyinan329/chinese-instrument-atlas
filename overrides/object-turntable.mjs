import {Box3,Vector3,Quaternion,Euler} from './vendor/three.module.js';
// Rotate an exhibited object about its own centre. Never modify the camera or gallery.
export class ObjectTurntable{
 constructor(object,{onChange=()=>{},maxTilt=.55}={}){this.object=object;this.onChange=onChange;this.maxTilt=maxTilt;this.ready=false;this.yaw=0;this.pitch=0;this.preset=new Quaternion();}
 capture(){const o=this.object;o.updateWorldMatrix(true,true);const bounds=new Box3().setFromObject(o),world=bounds.isEmpty()?o.getWorldPosition(new Vector3()):bounds.getCenter(new Vector3());this.localCenter=o.worldToLocal(world.clone());this.parentCenter=o.parent?o.parent.worldToLocal(world.clone()):world.clone();this.basePosition=o.position.clone();this.baseQuaternion=o.quaternion.clone();this.yaw=0;this.pitch=0;this.preset.identity();this.ready=true;}
 forget(){this.ready=false;this.yaw=this.pitch=0;this.preset.identity();}
 apply(){if(!this.ready)this.capture();const o=this.object,delta=new Quaternion().setFromEuler(new Euler(this.pitch,this.yaw,0,'YXZ'));o.quaternion.copy(delta).multiply(this.baseQuaternion).multiply(this.preset);const arm=this.localCenter.clone().multiply(o.scale).applyQuaternion(o.quaternion);o.position.copy(this.parentCenter).sub(arm);o.updateMatrixWorld(true);this.onChange();}
 rotate(yaw,pitch=0){if(!Number.isFinite(yaw)||!Number.isFinite(pitch))return;if(!this.ready)this.capture();this.yaw+=yaw;this.pitch=Math.max(-this.maxTilt,Math.min(this.maxTilt,this.pitch+pitch));this.apply();}
 view(name='front'){if(!this.ready)this.capture();this.yaw=this.pitch=0;this.preset.setFromAxisAngle(new Vector3(0,1,0),name==='back'?Math.PI:name==='side'?-Math.PI/2:0);this.apply();}
 reset(){if(!this.ready){this.capture();return;}this.yaw=this.pitch=0;this.preset.identity();this.object.position.copy(this.basePosition);this.object.quaternion.copy(this.baseQuaternion);this.object.updateMatrixWorld(true);this.onChange();}
}
export function objectDragDelta(dx,dy){return {yaw:Math.max(-.3,Math.min(.3,dx*.005)),pitch:Math.max(-.15,Math.min(.15,dy*.003))};}
export function bindObjectTurntable(element,turntable,{controls,onClick=()=>{},onStart=()=>{}}={}){
 controls.enableRotate=false;controls.autoRotate=false;controls.mouseButtons.LEFT=null;controls.touches.ONE=null;
 const pointers=new Map();let down=null,blocked=false;
 const start=e=>{if(e.pointerType!=='touch'&&e.button!==0)return;if(!pointers.size)blocked=false;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>1){blocked=true;down=null;return;}down={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};onStart();element.setPointerCapture?.(e.pointerId);};
 const move=e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(blocked||pointers.size!==1||!down||down.id!==e.pointerId)return;if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)down.moved=true;if(!down.moved)return;const delta=objectDragDelta(e.clientX-down.lastX,e.clientY-down.lastY);turntable.rotate(delta.yaw,delta.pitch);down.lastX=e.clientX;down.lastY=e.clientY;};
 const end=e=>{const click=e.type==='pointerup'&&!blocked&&down&&down.id===e.pointerId&&!down.moved;pointers.delete(e.pointerId);down=null;if(!pointers.size)blocked=false;if(click)onClick(e);};
 element.addEventListener('pointerdown',start,{capture:true});element.addEventListener('pointermove',move,{capture:true});for(const type of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(type,end,{capture:true});
 return {get dragging(){return pointers.size>0;},dispose(){element.removeEventListener('pointerdown',start,{capture:true});element.removeEventListener('pointermove',move,{capture:true});for(const type of ['pointerup','pointercancel','lostpointercapture'])element.removeEventListener(type,end,{capture:true});pointers.clear();down=null;}};
}
