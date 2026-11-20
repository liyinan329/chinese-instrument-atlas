import {paintPipaOrnament} from './pipa-ornament.mjs?assets=fine-shell';
import {makeNoteMarker} from './note-marker.mjs';
import {ObjectTurntable,objectDragDelta} from './object-turntable.mjs';
import {StringFeedback} from './string-feedback.mjs';
import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {available,fretName,midiAt,noteName,offsetAt} from './model.mjs';

// All geometry is authored for this app. Coordinates model a continuous-semitone
// 6-xiang/24-pin instrument, not a scan of a particular maker's instrument.
export const NUT_Y=3.64, BRIDGE_Y=-3.34, SCALE=NUT_Y-BRIDGE_Y;
export const fretY=(f,profile='chromatic')=>NUT_Y-SCALE*(1-2**(-offsetAt(f,profile)/12));
export const stringX=(s,y)=>{const t=(NUT_Y-y)/SCALE;return (s-1.5)*(.145+t*.15);};
export function nearestFret(y,profile='chromatic'){
 if(y>NUT_Y-.1)return 0;
 let best=0,d=Infinity;for(let f=1;f<=30;f++){const dist=Math.abs(y-fretY(f,profile));if(dist<d){d=dist;best=f;}}return best;
}

export class Pipa3D{
 constructor(container,{onNote,onHover,onStatus}={}){
  this.el=container;this.onNote=onNote||(()=>{});this.onHover=onHover||(()=>{});this.onStatus=onStatus||(()=>{});
  this.profile='chromatic';this.conservative=true;this.flat=false;this.held=[0,0,0,0];this.interaction='play';this.labels=true;this.autorotate=false;
  this.clock=new THREE.Clock();this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.lastHit='';this.isDown=false;this.stringMeshes=[];this.stringFeedback=new StringFeedback();this.feedbackRoll=0;this.positions=[];
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#34312e');this.scene.fog=new THREE.Fog('#34312e',30,65);
  this.camera=new THREE.PerspectiveCamera(34,1,.1,100);this.camera.position.set(0,.65,19.7);
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.renderer.domElement.setAttribute('aria-label','可旋转的3D琵琶：点击琴弦演奏，拖动空白处只转动琴身，滚轮上下浏览；选择旋转模式查看背面。方向键选择弦品，空格发声。');this.renderer.domElement.tabIndex=0;
  this.el.prepend(this.renderer.domElement);this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.onStatus('3D显示暂时中断，请刷新页面。');});
  this.model=new THREE.Group();this.model.rotation.y=-.08;this.scene.add(this.model);
  this.hitObjects=[];this.buildMaterials();this.buildInstrument();this.buildLighting();
  this.markerGroup=new THREE.Group();this.model.add(this.markerGroup);this.hoverMarker=this.makeMarker(.075,0xa6482f);this.hoverMarker.visible=false;this.model.add(this.hoverMarker);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,.25,0);this.controls.enableDamping=true;this.controls.dampingFactor=.1;this.controls.minDistance=4;this.controls.maxDistance=23;this.controls.maxPolarAngle=Math.PI*.94;this.controls.minPolarAngle=Math.PI*.06;this.controls.enablePan=true;this.controls.enableRotate=false;this.controls.enableZoom=false;this.controls.screenSpacePanning=true;this.controls.mouseButtons.LEFT=THREE.MOUSE.PAN;this.controls.touches.ONE=THREE.TOUCH.PAN;this.controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
  this.turntable=new ObjectTurntable(this.model,{onChange:()=>{this.feedbackRoll=0;}});this.turntable.capture();this.bindEvents();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.el);this.resize();this.animate();
  this.onStatus('3D 琵琶已就绪');
 }
 woodTexture(dark=false){
  const c=document.createElement('canvas');c.width=256;c.height=1024;const ctx=c.getContext('2d');ctx.fillStyle=dark?'#62331f':'#cbb58e';ctx.fillRect(0,0,256,1024);
  let seed=42;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<650;i++){const x=random()*256;ctx.beginPath();ctx.moveTo(x,0);for(let y=0;y<=1024;y+=20)ctx.lineTo(x+Math.sin(y/140+i)*(.2+random()*1.6),y);ctx.strokeStyle=dark?`rgba(30,12,3,${.025+random()*.12})`:`rgba(101,66,28,${.018+random()*.10})`;ctx.lineWidth=.2+random()*.9;ctx.stroke();}
  if(dark){for(let j=0;j<75;j++){ctx.beginPath();for(let y=0;y<=1024;y+=6){const x=j*3.6+Math.sin(y/170+j*.12)*8+Math.sin(y/70)*2;ctx.lineTo(x,y);}ctx.strokeStyle='rgba(25,10,2,.12)';ctx.lineWidth=.6;ctx.stroke();}}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
 }
 buildMaterials(){
  this.frontMat=new THREE.MeshStandardMaterial({map:this.woodTexture(),roughness:.76,metalness:0,color:0xf4e6cb});
  const rosewood=this.woodTexture(true);
  this.darkMat=new THREE.MeshStandardMaterial({map:rosewood,bumpMap:rosewood,bumpScale:.012,roughness:.46,metalness:0,color:0xb9a18c});
  this.ebonyMat=new THREE.MeshStandardMaterial({map:rosewood,bumpMap:rosewood,bumpScale:.009,color:0x645446,roughness:.42});
  this.edgeMat=new THREE.MeshStandardMaterial({color:0x553620,roughness:.35});
  this.boneMat=new THREE.MeshStandardMaterial({color:0xe7d0a0,roughness:.39});
  this.fretMat=new THREE.MeshStandardMaterial({color:0xbba173,roughness:.6});
  this.stringMat=new THREE.MeshStandardMaterial({color:0xf1f4f2,metalness:.42,roughness:.32,emissive:0x61706e,emissiveIntensity:.16});
  this.goldMat=new THREE.MeshStandardMaterial({color:0xb28c49,roughness:.36,metalness:.7});
  this.hitMat=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
 }
 mesh(geo,mat,x=0,y=0,z=0,parent=this.model){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 bevelBox(w,h,d,b=.025){const s=new THREE.Shape(),x=w/2-b,y=h/2-b;s.moveTo(-x,-y);s.lineTo(x,-y);s.lineTo(x,y);s.lineTo(-x,y);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.01,d-2*b),steps:1,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:4,curveSegments:12});g.translate(0,0,-d/2+b);return g;}
 cylinderBetween(a,b,r,mat,parent=this.model){const delta=new THREE.Vector3().subVectors(b,a);const mesh=this.mesh(new THREE.CylinderGeometry(r,r,delta.length(),10),mat,0,0,0,parent);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;}
 buildInstrument(){
  // Modern silhouette: overall height / maximum body width ≈ 1 / .31.
  const shape=new THREE.Shape();shape.moveTo(-.34,1.48);
  shape.bezierCurveTo(-.44,.4,-.97,-.88,-1.40,-2.05);
  shape.bezierCurveTo(-1.75,-3.16,-1.57,-4.24,0,-4.25);
  shape.bezierCurveTo(1.57,-4.24,1.75,-3.16,1.40,-2.05);
  shape.bezierCurveTo(.97,-.88,.44,.4,.34,1.48);shape.closePath();
  const faceGeo=new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelThickness:.025,bevelSize:.028,bevelSegments:3,steps:1,curveSegments:64});
  const pos=faceGeo.attributes.position,uv=faceGeo.attributes.uv;for(let i=0;i<pos.count;i++)uv.setXY(i,(pos.getX(i)+1.7)/3.4,(pos.getY(i)+4.3)/5.8);
  const face=this.mesh(faceGeo,this.frontMat,0,0,-.02);this.hitObjects.push(face);
  const outline=shape.getPoints(100),count=outline.length,rings=28,verts=[],uvs=[],indices=[];
  for(let j=0;j<=rings;j++){const r=.00001+j/rings;for(let i=0;i<count;i++){const p=outline[i];verts.push(p.x*r,-1.6+(p.y+1.6)*r,-.05-.56*Math.sqrt(Math.max(0,1-r*r)));uvs.push(.5+p.x*r/3.5,(-1.6+(p.y+1.6)*r+4.3)/5.8);}}
  for(let j=0;j<rings;j++)for(let i=0;i<count-1;i++){const a=j*count+i,b=a+count;indices.push(a,b,a+1,b,b+1,a+1);}
  const bowlGeo=new THREE.BufferGeometry();bowlGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));bowlGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));bowlGeo.setIndex(indices);bowlGeo.computeVertexNormals();
  const bowlMat=this.darkMat.clone();bowlMat.side=THREE.DoubleSide;this.backMaterial=bowlMat;this.backWoodMap=bowlMat.map;this.setBackOrnament(true);const bowl=this.mesh(bowlGeo,bowlMat);this.hitObjects.push(bowl);bowl.receiveShadow=false;
  const rimCurve=new THREE.CatmullRomCurve3(outline.map(p=>new THREE.Vector3(p.x,p.y,.018)),true);this.mesh(new THREE.TubeGeometry(rimCurve,400,.045,8,true),this.darkMat);
  const fineRim=new THREE.CatmullRomCurve3(outline.map(p=>new THREE.Vector3(p.x*.982,-1.6+(p.y+1.6)*.986,.048)),true);this.mesh(new THREE.TubeGeometry(fineRim,400,.009,5,true),this.boneMat);
  const neckShape=new THREE.Shape();neckShape.moveTo(-.34,1.43);neckShape.bezierCurveTo(-.25,2.2,-.24,3.1,-.24,3.83);neckShape.lineTo(.24,3.83);neckShape.bezierCurveTo(.24,3.1,.25,2.2,.34,1.43);neckShape.closePath();
  const neck=this.mesh(new THREE.ExtrudeGeometry(neckShape,{depth:.23,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:3}),this.darkMat,0,0,-.18);this.hitObjects.push(neck);
  // Bevelled peg box, turned wooden pegs and fine winding detail.
  const head=new THREE.Group();head.position.set(0,3.68,-.02);head.rotation.x=-.18;this.model.add(head);
  for(const side of [-1,1]){
   this.mesh(this.bevelBox(.14,1.14,.28,.025),this.darkMat,side*.25,.47,-.02,head);
   this.mesh(this.bevelBox(.015,1.03,.014,.004),this.boneMat,side*.25,.47,.13,head);
  }
  this.mesh(this.bevelBox(.57,.13,.28,.025),this.darkMat,0,-.07,-.02,head);
  this.mesh(this.bevelBox(.57,.12,.28,.025),this.darkMat,0,1.02,-.02,head);
  for(let i=0;i<4;i++){
   const side=i%2===0?-1:1,y=.10+i*.225;
   this.cylinderBetween(new THREE.Vector3(-.32,y,-.04),new THREE.Vector3(.32,y,-.04),.036,this.ebonyMat,head);
   const profile=[[.038,0],[.041,.07],[.067,.10],[.075,.14],[.061,.18],[.066,.23],[.096,.42],[.133,.71],[.143,.77],[.139,.81],[.111,.85],[.065,.87],[0,.875]].map(([r,h])=>new THREE.Vector2(r,h));
   const geo=new THREE.LatheGeometry(profile,48),pos=geo.attributes.position;
   for(let j=0;j<pos.count;j++){const x=pos.getX(j),z=pos.getZ(j),h=pos.getY(j);if(h>.23&&h<.81){const k=1+.045*Math.cos(Math.atan2(z,x)*12);pos.setXYZ(j,x*k,h,z*k);}}geo.computeVertexNormals();
   const peg=this.mesh(geo,this.ebonyMat,side*.30,y,-.04,head);peg.rotation.z=-side*Math.PI/2;
   for(const offset of [.13,.77]){const ring=this.mesh(new THREE.TorusGeometry(offset<.2?.075:.145,.007,6,40),this.darkMat,side*(.30+offset),y,-.04,head);ring.rotation.y=Math.PI/2;}
   const windingX=-.12+i*.08;
   for(let j=0;j<5;j++){const ring=this.mesh(new THREE.TorusGeometry(.038,.004,5,20),this.stringMat,windingX+j*.009,y,-.04,head);ring.rotation.y=Math.PI/2;ring.castShadow=false;}
   this.cylinderBetween(new THREE.Vector3((i-1.5)*.145,-.045,.19),new THREE.Vector3(windingX+.02,y,.005),.0048,this.stringMat,head);
  }
  const crown=new THREE.Group();crown.position.set(0,1.17,-.12);crown.rotation.x=-.27;head.add(crown);
  const disc=this.mesh(new THREE.CylinderGeometry(.355,.34,.10,80),this.ebonyMat,0,0,0,crown);disc.rotation.x=Math.PI/2;
  this.mesh(new THREE.TorusGeometry(.329,.013,8,80),this.darkMat,0,0,.056,crown);
  this.mesh(new THREE.TorusGeometry(.307,.006,6,80),this.boneMat,0,0,.061,crown);
  // Fine original relief: carved petals and narrow vein grooves, not inflated spheres.
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,petal=new THREE.Shape();petal.moveTo(0,.04);petal.bezierCurveTo(-.065,.10,-.076,.20,0,.275);petal.bezierCurveTo(.076,.20,.065,.10,0,.04);
   const m=this.mesh(new THREE.ExtrudeGeometry(petal,{depth:.015,bevelEnabled:true,bevelSize:.009,bevelThickness:.008,bevelSegments:3,curveSegments:20}),this.darkMat,0,0,.060,crown);m.rotation.z=a;
   const vein=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.08,.09),new THREE.Vector3(.008,.16,.088),new THREE.Vector3(0,.24,.082)]);const v=this.mesh(new THREE.TubeGeometry(vein,16,.003,4,false),this.ebonyMat,0,0,0,crown);v.rotation.z=a;
  }
  const heart=this.mesh(new THREE.SphereGeometry(.043,24,12),this.boneMat,0,0,.086,crown);heart.scale.z=.40;
  this.mesh(new THREE.BoxGeometry(.54,.07,.18),this.boneMat,0,NUT_Y,.14);
  const bridgeShape=new THREE.Shape();bridgeShape.moveTo(-.61,-.08);bridgeShape.bezierCurveTo(-.70,-.32,.70,-.32,.61,-.08);bridgeShape.lineTo(.53,.16);bridgeShape.lineTo(-.53,.16);bridgeShape.closePath();
  this.mesh(new THREE.ExtrudeGeometry(bridgeShape,{depth:.15,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:3}),this.darkMat,0,BRIDGE_Y-.13,.05);
  this.mesh(new THREE.BoxGeometry(.98,.045,.055),this.boneMat,0,BRIDGE_Y,.27);
  this.fretGroup=new THREE.Group();this.model.add(this.fretGroup);this.pickGroup=new THREE.Group();this.model.add(this.pickGroup);this.labelGroup=new THREE.Group();this.model.add(this.labelGroup);this.rebuildFrets();
  for(let s=0;s<4;s++){
   const points=[];for(let i=0;i<=96;i++){const y=BRIDGE_Y+(NUT_Y-BRIDGE_Y)*i/96;points.push(new THREE.Vector3(stringX(s,y),y,.295));}
   // Slightly enlarged display radii keep all four strings readable at the full-instrument view.
   const curve=new THREE.CatmullRomCurve3(points);const m=this.mesh(new THREE.TubeGeometry(curve,96,.0145-s*.0018,10,false),this.stringMat);this.stringMeshes.push(m);m.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);this.stringFeedback?.add(s,m,{bridge:BRIDGE_Y,nut:NUT_Y,amplitude:.017});
   // String tails below bridge and decorated anchor pin.
   this.cylinderBetween(new THREE.Vector3(stringX(s,BRIDGE_Y),BRIDGE_Y,.295),new THREE.Vector3(stringX(s,BRIDGE_Y),BRIDGE_Y-.25,.23),.0145-s*.0018,this.stringMat);
   this.mesh(new THREE.SphereGeometry(.027,10,8),this.goldMat,stringX(s,BRIDGE_Y),BRIDGE_Y-.25,.24);
  }
 }
 label(text,color='#675e46'){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d');ctx.font='500 28px -apple-system, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,128,32);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:true}));sprite.scale.set(.68,.17,1);return sprite;
 }
 clearGroup(group){for(const c of [...group.children]){c.geometry?.dispose();if(c.isSprite){c.material.map?.dispose();c.material.dispose();}else if(group===this.markerGroup)c.material?.dispose();group.remove(c);}}
 rebuildFrets(){
  this.clearGroup(this.fretGroup);this.clearGroup(this.pickGroup);this.clearGroup(this.labelGroup);
  for(let f=1;f<=30;f++){
   const y=fretY(f,this.profile),first=this.conservative?(f>24?2:f>21?1:0):0;const width=f<=6?.54+(6-f)*.007:f<=16?.76+(f-7)*.055:1.255-(f-16)*.032;const x1=-width/2,x2=width/2;
   const fret=this.mesh(new THREE.BoxGeometry(x2-x1,f<=6?.055:.033,f<=6?.20:.10),f<=6?this.boneMat:this.fretMat,(x1+x2)/2,y,f<=6?.17:.21,this.fretGroup);
   fret.castShadow=false;
   if([1,6,7,12,18,24,30].includes(f)){const label=this.label(fretName(f));label.position.set(x2+.4,y,.12);this.labelGroup.add(label);}
  }
  for(let s=0;s<4;s++){
   for(let f=0;f<=30;f++){
    if(!available(s,f,this.conservative))continue;
    const y=f===0?NUT_Y+.09:fretY(f,this.profile),top=f<=1?fretY(0):.5*(fretY(f-1,this.profile)+y),bottom=f===30?y-.05:.5*(y+fretY(f+1,this.profile));
    const hit=this.mesh(new THREE.BoxGeometry(.15+(NUT_Y-y)/SCALE*.14,f===0?.25:Math.max(.055,top-bottom),.06),this.hitMat,stringX(s,y),f===0?y:(top+bottom)/2,.32,this.pickGroup);hit.userData={s,fret:f,pluck:false};hit.castShadow=hit.receiveShadow=false;
   }
   const lower=fretY(30,this.profile)-.08,y=(lower+BRIDGE_Y+.18)/2;
   const hit=this.mesh(new THREE.BoxGeometry(.28,lower-BRIDGE_Y-.18,.07),this.hitMat,stringX(s,y),y,.34,this.pickGroup);hit.userData={s,pluck:true};hit.castShadow=hit.receiveShadow=false;
   const label=this.label(['Ⅳ A2','Ⅲ D3','Ⅱ E3','Ⅰ A3'][s]);label.scale.set(.48,.12,1);label.position.set(stringX(s,BRIDGE_Y)*1.5,BRIDGE_Y-.48,.22);this.labelGroup.add(label);
  }
  this.labelGroup.visible=this.labels;
 }
 stoneTexture(){
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),data=ctx.createImageData(256,256);let seed=81;
  for(let i=0;i<data.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const n=seed/4294967296;data.data[i]=188+n*18;data.data[i+1]=183+n*18;data.data[i+2]=174+n*18;data.data[i+3]=255;}ctx.putImageData(data,0,0);
  ctx.strokeStyle='#ddd6ca27';ctx.lineWidth=.7;for(let i=0;i<12;i++){ctx.beginPath();for(let x=0;x<=256;x+=4)ctx.lineTo(x,20*i+Math.sin(x/40+i)*9);ctx.stroke();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
 }
 landscapeTexture(p){
  const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d');
  const grad=ctx.createRadialGradient(480,350,20,512,512,650);grad.addColorStop(0,p.silk);grad.addColorStop(1,p.edge);ctx.fillStyle=grad;ctx.fillRect(0,0,1024,1024);
  for(let layer=0;layer<5;layer++){ctx.beginPath();ctx.moveTo(0,1024);for(let x=0;x<=1024;x+=3){const y=660+layer*57-Math.sin(x/(145-layer*17)+layer)*86-Math.sin(x/(68+layer*8)+layer*.7)*31;ctx.lineTo(x,y);}ctx.lineTo(1024,1024);ctx.fillStyle=p.hills[layer];ctx.fill();}
  ctx.fillStyle='#eed499';ctx.beginPath();ctx.arc(690,260,55,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e8ce9370';ctx.lineWidth=2;ctx.beginPath();ctx.arc(690,260,69,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#ffffff0b';ctx.lineWidth=.5;for(let y=0;y<1024;y+=3){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
 }
 setBackOrnament(enabled=true){
  if(!this.backMaterial)return;if(enabled&&!this.backOrnamentMap){const c=document.createElement('canvas');c.width=2048;c.height=3072;const ctx=c.getContext('2d');ctx.drawImage(this.backWoodMap.image,0,0,c.width,c.height);paintPipaOrnament(ctx,c.width,c.height);this.backOrnamentMap=new THREE.CanvasTexture(c);this.backOrnamentMap.colorSpace=THREE.SRGBColorSpace;this.backOrnamentMap.anisotropy=4;}this.backMaterial.map=enabled?this.backOrnamentMap:this.backWoodMap;this.backMaterial.needsUpdate=true;this.backOrnament=enabled;
 }
 setGalleryTheme(name='warm'){
  const palettes={dunhuang:{bg:'#123f50',wall:'#287488',floor:'#244d56',silk:'#74ad9d',edge:'#215f74',hills:['#77b8a2','#409b99','#287b8d','#bf7651','#a05c42']},warm:{bg:'#34312e',wall:'#8e8579',floor:'#494139',silk:'#d6c8ad',edge:'#8d8270',hills:['#b5a792','#a19380','#8b7c6b','#706257','#554c45']},ink:{bg:'#202631',wall:'#536074',floor:'#333b49',silk:'#c4c7cc',edge:'#68758a',hills:['#a2abb9','#8c98aa','#748196','#5b6b82','#41516b']},paper:{bg:'#b0a596',wall:'#d4cabc',floor:'#9b8e7d',silk:'#eee3ce',edge:'#baab94',hills:['#d1c4af','#c0af99','#ad9982','#927c67','#786652']}};
  const p=palettes[name]||palettes.warm;this.galleryTheme=palettes[name]?name:'warm';this.scene.background.set(p.bg);this.scene.fog.color.set(p.bg);this.wallMat.color.set(p.wall);this.floorMat.color.set(p.floor);const old=this.landscapeMat.map;this.landscapeMat.map=this.landscapeTexture(p);this.landscapeMat.needsUpdate=true;old?.dispose();this.el.dataset.gallery=this.galleryTheme;
 }
 buildLighting(){
  this.scene.add(new THREE.HemisphereLight(0xfff3e3,0x356775,1.45));
  const key=new THREE.SpotLight(0xffefcf,235,35,.49,.9,1.45);key.position.set(-4,9,6);key.target.position.set(0,.2,0);key.castShadow=true;key.shadow.mapSize.set(4096,4096);key.shadow.normalBias=.04;key.shadow.radius=5;key.shadow.blurSamples=8;key.shadow.bias=-.00008;this.scene.add(key,key.target);
  const fill=new THREE.DirectionalLight(0xb9e8e5,1.55);fill.position.set(5,3,8);this.scene.add(fill);
  const rim=new THREE.DirectionalLight(0xffd291,2.05);rim.position.set(2,5,-3);this.scene.add(rim);
  const stone=this.stoneTexture();this.wallMat=new THREE.MeshStandardMaterial({map:stone,bumpMap:stone,bumpScale:.025,roughness:.96});
  this.mesh(new THREE.PlaneGeometry(70,40),this.wallMat,0,6,-5,this.scene);
  this.floorMat=new THREE.MeshStandardMaterial({map:stone,roughness:.82,metalness:0});const floor=this.mesh(new THREE.PlaneGeometry(90,90),this.floorMat,0,-5.25,0,this.scene);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
  this.landscapeMat=new THREE.MeshStandardMaterial({roughness:1,emissive:0x35302b,emissiveIntensity:.08});
  const moon=this.mesh(new THREE.CircleGeometry(5.05,160),this.landscapeMat,0,1,-4.91,this.scene);moon.castShadow=moon.receiveShadow=false;
  const frame=new THREE.MeshStandardMaterial({color:0xa38c66,metalness:.55,roughness:.44});
  this.mesh(new THREE.TorusGeometry(5.12,.045,12,160),frame,0,1,-4.87,this.scene);
  this.mesh(new THREE.TorusGeometry(5.19,.012,8,160),this.ebonyMat,0,1,-4.9,this.scene);
  const timber=new THREE.MeshStandardMaterial({color:0x332a23,map:this.woodTexture(true),roughness:.57});
  for(const side of [-1,1]){for(let i=0;i<8;i++)this.mesh(new THREE.BoxGeometry(.075,15,.11),timber,side*(5.7+i*.55),1,-4.7,this.scene);for(let i=0;i<6;i++)this.mesh(new THREE.BoxGeometry(4.3,.055,.13),timber,side*7.6,-4.5+i*2.2,-4.63,this.scene);}
  const walnutMap=this.woodTexture(true),walnut=new THREE.MeshStandardMaterial({map:walnutMap,bumpMap:walnutMap,bumpScale:.012,color:0xc0a68e,roughness:.48});
  const insetStone=new THREE.MeshStandardMaterial({map:stone,bumpMap:stone,bumpScale:.009,color:0x615b52,roughness:.82});
  this.mesh(this.bevelBox(4.78,.69,2.56,.035),walnut,0,-4.82,-.15,this.scene);
  this.mesh(this.bevelBox(5.00,.13,2.76,.035),walnut,0,-4.385,-.15,this.scene);
  this.mesh(this.bevelBox(4.84,.025,2.60,.008),insetStone,0,-4.312,-.15,this.scene);
  this.mesh(this.bevelBox(4.91,.017,2.67,.005),frame,0,-4.438,-.15,this.scene);
  this.mesh(this.bevelBox(4.45,.09,2.30,.025),this.ebonyMat,0,-5.195,-.15,this.scene);
  // Recessed front panel, corner join lines and inset brass nameplate.
  this.mesh(this.bevelBox(4.36,.42,.025,.009),this.ebonyMat,0,-4.81,1.137,this.scene);
  this.mesh(this.bevelBox(4.22,.34,.018,.006),insetStone,0,-4.81,1.153,this.scene);
  for(const side of [-1,1])this.mesh(this.bevelBox(.012,.63,.008,.003),this.ebonyMat,side*2.23,-4.82,1.137,this.scene);
  this.mesh(this.bevelBox(1.53,.35,.027,.01),frame,0,-4.8,1.176,this.scene);
  const plaque=document.createElement('canvas');plaque.width=1024;plaque.height=256;const pc=plaque.getContext('2d');pc.fillStyle='#534737';pc.fillRect(0,0,1024,256);pc.strokeStyle='#b29a7033';for(let y=0;y<256;y+=3){pc.beginPath();pc.moveTo(0,y);pc.lineTo(1024,y);pc.stroke();}pc.fillStyle='#ead8b2';pc.textAlign='center';pc.font='42px serif';pc.fillText('琵 琶  /  P I P A',512,110);pc.font='23px sans-serif';pc.fillStyle='#c5b597';pc.fillText('四弦 · 六相二十四品',512,170);const pt=new THREE.CanvasTexture(plaque);pt.colorSpace=THREE.SRGBColorSpace;
  this.mesh(new THREE.PlaneGeometry(1.46,.29),new THREE.MeshStandardMaterial({map:pt,roughness:.52,metalness:.18}),0,-4.8,1.193,this.scene);
  for(const x of [-.69,.69])for(const y of [-4.92,-4.68]){const rivet=this.mesh(new THREE.SphereGeometry(.009,12,8),frame,x,y,1.197,this.scene);rivet.scale.z=.3;}
  this.setGalleryTheme('dunhuang');
 }
 makeMarker(radius=.07,color=0xa6482f){return makeNoteMarker({size:radius*.34,current:color===0xa6482f,candidate:color===0xc5a15f});}
 update({profile=this.profile,conservative=this.conservative,flat=this.flat,positions=this.positions,held=this.held}={}){
  const rebuild=profile!==this.profile||conservative!==this.conservative;this.profile=profile;this.conservative=conservative;this.flat=flat;this.positions=positions;this.held=[...held];if(rebuild)this.rebuildFrets();
  this.clearGroup(this.markerGroup);for(const p of positions){if(!available(p.s,p.fret,this.conservative))continue;const y=p.fret===0?NUT_Y+.09:fretY(p.fret,this.profile);const marker=this.makeMarker(.072,p.current?0xa6482f:p.candidate?0xc5a15f:0x4d815c);marker.position.set(stringX(p.s,y),y,.36);this.markerGroup.add(marker);if(this.labels){const label=this.label(`${noteName(midiAt(p.s,p.fret,this.profile),this.flat)}${p.finger?' · '+p.finger:''}`,p.current?'#b79859':p.candidate?'#8f9e91':'#8b7c58');label.position.set(stringX(p.s,y)+(p.s<2?-.32:.32),y+.10,.4);label.scale.set(.62,.155,1);this.markerGroup.add(label);}}
 }
 pick(e){
  const rect=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);
  const forward=new THREE.Vector3(0,0,1).transformDirection(this.model.matrixWorld);if(forward.dot(this.ray.ray.direction)>-.15)return null;
  const hits=this.ray.intersectObjects([...this.pickGroup.children,...this.hitObjects],false);const hit=hits.find(h=>h.object.userData.s!==undefined||this.hitObjects.includes(h.object));
  if(!hit||hit.object.userData.s===undefined)return null;const data=hit.object.userData;return {...data,fret:data.pluck?this.held[data.s]:data.fret,point:hit.point};
 }
 fire(hit){const key=`${hit.s}:${hit.fret}`;if(this.lastHit===key)return;this.lastHit=key;if(!hit.pluck)this.held[hit.s]=hit.fret;this.pluck(hit.s);this.onNote(hit.s,hit.fret,{pluck:hit.pluck});}
 bindEvents(){
  const canvas=this.renderer.domElement;let down=null;
  canvas.addEventListener('pointerdown',e=>{
   if(e.button!==0)return;canvas.focus({preventScroll:true});
   const hit=this.interaction==='play'?this.pick(e):null;
   down={x:e.clientX,y:e.clientY,playing:!!hit,orbit:this.interaction!=='pan'&&!hit};
   this.controls.enabled=!hit&&!down.orbit;this.isDown=!!hit;this.lastHit='';
   if(hit||down.orbit){canvas.setPointerCapture(e.pointerId);e.preventDefault();if(hit)this.fire(hit);}
  },true);
  canvas.addEventListener('pointermove',e=>{
   if(down?.orbit){const delta=objectDragDelta(e.clientX-down.x,e.clientY-down.y);this.turntable.rotate(delta.yaw,delta.pitch);down.x=e.clientX;down.y=e.clientY;this.autorotate=false;return;}
   const hit=this.interaction==='play'?this.pick(e):null;canvas.style.cursor=hit?'crosshair':down?'grabbing':'grab';this.hoverMarker.visible=!!hit;
   if(hit){const y=hit.fret===0?NUT_Y+.09:fretY(hit.fret,this.profile);this.hoverMarker.position.set(stringX(hit.s,y),y,.37);this.onHover({s:hit.s,fret:hit.fret,pluck:hit.pluck,x:e.clientX,y:e.clientY});if(this.isDown&&down?.playing)this.fire(hit);}else{this.onHover(null);if(this.isDown)this.lastHit='';}
  });
  const release=()=>{this.isDown=false;this.lastHit='';this.controls.enabled=true;down=null;};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);canvas.addEventListener('pointerleave',()=>{this.hoverMarker.visible=false;this.onHover(null);});
  canvas.addEventListener('wheel',e=>{e.preventDefault();if(e.ctrlKey||e.metaKey)this.zoom(Math.exp(e.deltaY*.002));else this.pan(0,-e.deltaY*.008);},{passive:false});
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(e.key))return;e.preventDefault();if(e.shiftKey){this.pan(e.key==='ArrowLeft'?-.4:e.key==='ArrowRight'?.4:0,e.key==='ArrowUp'?.4:e.key==='ArrowDown'?-.4:0);return;}const cur=this.positions.find(p=>p.current)||{s:3,fret:0};let {s,fret}=cur;if(e.key==='ArrowLeft')s=Math.max(0,s-1);if(e.key==='ArrowRight')s=Math.min(3,s+1);if(e.key==='ArrowUp')fret=Math.max(0,fret-1);if(e.key==='ArrowDown')fret=Math.min(this.conservative?[21,24,30,30][s]:30,fret+1);if(available(s,fret,this.conservative)){this.held[s]=fret;this.pluck(s);this.onNote(s,fret,{keyboard:true});}});
 }
 setMode(mode){this.interaction=mode;this.hoverMarker.visible=false;this.onHover(null);this.onStatus(mode==='orbit'?'旋转 · 左右转动琴身，上下调整俯仰':mode==='pan'?'移动 · 拖动任意位置，上下滚动浏览':'演奏 · 点弦发声，拖动空白处只转动琴身');}
 pan(x,y){const t=this.controls.target,ny=THREE.MathUtils.clamp(t.y+y,-4.3,5.2),nx=THREE.MathUtils.clamp(t.x+x,-3.5,3.5);this.camera.position.x+=nx-t.x;this.camera.position.y+=ny-t.y;t.x=nx;t.y=ny;this.controls.update();}
 pluck(s,{strength=.75,fret=this.held[s]}={}){this.stringFeedback.pluck(s,{strength,stop:fretY(fret||0,this.profile)});}
 preset(view){
  this.autorotate=false;this.stringFeedback.reset();this.feedbackRoll=0;this.turntable.reset();this.camera.position.set(0,.65,19.7);this.controls.target.set(0,.25,0);
  if(view==='back')this.turntable.view('back');
  if(view==='side')this.turntable.view('side');
  if(view==='neck'){this.camera.position.set(0,2.9,6.8);this.controls.target.set(0,2.9,.12);}
  if(view==='frets'){this.camera.position.set(0,-1.2,7.5);this.controls.target.set(0,-1.2,.12);}
  if(view==='head'){this.camera.position.set(0,4.12,5.4);this.controls.target.set(0,4.12,0);}
  if(view==='plinth'){this.camera.position.set(1.6,-2.7,8);this.controls.target.set(0,-4.18,0);}
  this.controls.update();
 }
 zoom(factor){const v=this.camera.position.clone().sub(this.controls.target);v.multiplyScalar(factor);v.clampLength(4,23);this.camera.position.copy(this.controls.target).add(v);this.controls.update();}
 resize(){const w=this.el.clientWidth,h=this.el.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);}
 animate(){
  this.frame=requestAnimationFrame(()=>this.animate());if(this.el.getClientRects().length===0)return;const t=this.clock.getElapsedTime();this.controls.update();if(this.autorotate&&!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)this.turntable.rotate(.002); 
  const front=new THREE.Vector3(0,0,1).transformDirection(this.model.matrixWorld).dot(this.camera.position.clone().sub(this.model.position).normalize())>.15;
  this.markerGroup.visible=front;this.labelGroup.visible=this.labels&&front;if(!front)this.hoverMarker.visible=false;
  const roll=this.stringFeedback.step(performance.now()/1000,{reduced:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches});this.model.rotation.z+=roll-this.feedbackRoll;this.feedbackRoll=roll;
  this.renderer.render(this.scene,this.camera);
 }
 destroy(){this.backOrnamentMap?.dispose();this.stringFeedback.clear();cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.controls.dispose();this.scene.traverse(o=>{o.geometry?.dispose();});this.renderer.dispose();}
}
