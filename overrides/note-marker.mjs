import * as T from './vendor/three.module.js';
// A small, flat inlay rather than a raised ring obscuring the fretboard.
export function makeNoteMarker({size=.018,current=true,candidate=false}={}){
 const shape=new T.Shape();shape.moveTo(0,size*1.3);shape.lineTo(size*.72,0);shape.lineTo(0,-size*1.3);shape.lineTo(-size*.72,0);shape.closePath();
 const material=new T.MeshBasicMaterial({color:current?'#dfc58a':candidate?'#aab9ac':'#b39a66',transparent:true,opacity:current?.96:candidate?.42:.62,depthTest:true,depthWrite:false,side:T.DoubleSide});
 const mesh=new T.Mesh(new T.ShapeGeometry(shape),material);mesh.renderOrder=8;mesh.castShadow=false;mesh.receiveShadow=false;mesh.userData.noteMarker=true;return mesh;
}
