// Original Tang-inspired baoxianghua and scrolling foliage, drawn as inlaid shell.
// Inspired by Shosoin 0000010076; an original design, not a historical reconstruction.
export function paintPipaOrnament(ctx,w,h){
 ctx.save();ctx.scale(w/1024,h/1536);ctx.translate(512,770);ctx.scale(.88,.93);ctx.translate(-512,-770);
 const gold='#bba16b',light='#e5d6a2',ink='#695439';
 const line=(color=gold,width=1.15)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';};
 const path=fn=>{ctx.beginPath();fn();};
 function shell(tone='ivory',extent=110){const g=ctx.createLinearGradient(-extent*.65,0,extent*.5,-extent);const colors=tone==='jade'?['#527e74','#99b5a0','#c4d2b8','#739a92']:tone==='rose'?['#a47863','#d0ae8b','#e1c8a0','#b98a73']:['#9fae9d','#e5dfbb','#f1ecd5','#a9c3b3'];colors.forEach((c,i)=>g.addColorStop(i/(colors.length-1),c));return g;}
 function finish(tone,r){ctx.fillStyle=shell(tone,r);ctx.fill();line(ink,2.2);ctx.stroke();line(light,.8);ctx.stroke();}
 function leaf(x,y,a,size,tone='jade',bend=1){ctx.save();ctx.translate(x,y);ctx.rotate(a);path(()=>{ctx.moveTo(0,0);ctx.bezierCurveTo(-size*.34,-size*.18,-size*.5,-size*.56,-size*.14,-size*.91);ctx.bezierCurveTo(-size*.04,-size*1.04,size*.16,-size*1.06,size*.21,-size*1.13);ctx.bezierCurveTo(size*.18,-size*.79,size*.40,-size*.62,size*.30,-size*.37);ctx.bezierCurveTo(size*.23,-size*.15,size*.08,-size*.05,0,0);});finish(tone,size);
 line('#6d897b',.85);path(()=>{ctx.moveTo(0,-2);ctx.bezierCurveTo(size*.05,-size*.35,-size*.06,-size*.70,size*.18,-size*1.08);});ctx.stroke();
 for(let j=1;j<=5;j++){const yy=-size*j*.14;for(const side of [-1,1]){path(()=>{ctx.moveTo(0,yy);ctx.quadraticCurveTo(side*size*.09,yy-size*.09,side*size*(.24-j*.022),yy-size*.16);});ctx.stroke();}}ctx.restore();}
 function petal(r,tone,phase=0){const r0=r*.21;path(()=>{ctx.moveTo(-r0*.35,-r0);ctx.bezierCurveTo(-r*.36,-r*.36,-r*.43,-r*.58,-r*.25,-r*.78);ctx.bezierCurveTo(-r*.31,-r*.88,-r*.16,-r*.97,-r*.10,-r*.91);ctx.quadraticCurveTo(-r*.05,-r*.99,0,-r*1.05);ctx.quadraticCurveTo(r*.05,-r*.99,r*.10,-r*.91);ctx.bezierCurveTo(r*.16,-r*.97,r*.31,-r*.88,r*.25,-r*.78);ctx.bezierCurveTo(r*.43,-r*.58,r*.36,-r*.36,r0*.35,-r0);ctx.closePath();});finish(tone,r);
 line(tone==='jade'?'#718e7b':'#ad9e76',.8);for(const k of [-2,-1,0,1,2]){path(()=>{ctx.moveTo(k*r*.018,-r*.24);ctx.bezierCurveTo(k*r*.045,-r*.44,k*r*.10,-r*.62,k*r*.075,-r*.83);});ctx.stroke();}
 line('#f2e8c3',.65);path(()=>{ctx.moveTo(-r*.20,-r*.76);ctx.bezierCurveTo(-r*.26,-r*.57,-r*.15,-r*.39,-r*.09,-r*.34);});ctx.stroke();}
 function flower(x,y,r){ctx.save();ctx.translate(x,y);
 for(let i=0;i<8;i++){ctx.save();ctx.rotate(i*Math.PI/4+Math.PI/8);petal(r,'ivory');ctx.restore();}
 for(let i=0;i<8;i++){ctx.save();ctx.rotate(i*Math.PI/4);petal(r*.70,i%2?'jade':'ivory');ctx.restore();}
 for(let i=0;i<8;i++){ctx.save();ctx.rotate(i*Math.PI/4+Math.PI/8);petal(r*.43,'rose');ctx.restore();}
 for(let i=0;i<16;i++){const a=i*Math.PI/8;line(light,.75);path(()=>{ctx.moveTo(Math.sin(a)*r*.08,-Math.cos(a)*r*.08);ctx.lineTo(Math.sin(a)*r*.24,-Math.cos(a)*r*.24);});ctx.stroke();ctx.beginPath();ctx.arc(Math.sin(a)*r*.25,-Math.cos(a)*r*.25,1.6,0,Math.PI*2);ctx.fillStyle=light;ctx.fill();}
 ctx.beginPath();ctx.arc(0,0,r*.105,0,Math.PI*2);ctx.fillStyle='#a56848';ctx.fill();line(light,1.4);ctx.stroke();ctx.beginPath();ctx.arc(-r*.025,-r*.025,r*.022,0,Math.PI*2);ctx.fillStyle='#e7cf8c';ctx.fill();ctx.restore();}
 // Fine paired stems, with curled terminals and individually veined leaves.
 for(const sign of [-1,1]){ctx.save();ctx.translate(512,0);ctx.scale(sign,1);
 const stem=()=>{ctx.moveTo(0,1240);ctx.bezierCurveTo(226,1160,283,995,213,830);ctx.bezierCurveTo(164,713,67,674,96,556);ctx.bezierCurveTo(130,416,157,339,44,281);ctx.bezierCurveTo(2,258,8,231,31,223);ctx.bezierCurveTo(65,212,78,250,55,256);};
 path(stem);line('#6a593c',3.2);ctx.stroke();path(stem);line(gold,1.6);ctx.stroke();
 for(const [x,y,a,size,tone]of [[185,1101,-.74,66,'ivory'],[246,1007,.53,70,'jade'],[240,920,-.67,58,'ivory'],[193,822,.73,59,'jade'],[128,727,-.72,56,'ivory'],[97,630,.65,48,'jade'],[115,527,-.76,49,'ivory'],[136,426,.69,43,'jade'],[111,349,-.68,34,'ivory']]){leaf(x,y,a,size,tone);leaf(x,y,a+1.22,size*.46,'jade');}
 for(const [x,y,scale]of [[219,1074,1],[180,793,.85],[109,569,.7],[98,357,.6]]){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);path(()=>{ctx.moveTo(0,0);ctx.bezierCurveTo(50,-4,70,-45,48,-67);ctx.bezierCurveTo(29,-87,6,-68,17,-53);ctx.bezierCurveTo(24,-44,38,-49,35,-58);});line(gold,1.15);ctx.stroke();leaf(48,-67,.35,25,'rose');ctx.restore();}
 ctx.restore();}
 flower(512,891,122);flower(512,483,62);flower(512,1195,34);
 // Small pendulous buds connect the rosettes without enclosing graphic circles.
 for(const [y,flip]of [[649,1],[1090,-1]]){ctx.save();ctx.translate(512,y);ctx.scale(1,flip);for(const side of [-1,1])leaf(side*3,0,side*.55,39,'jade');line(gold,1);path(()=>{ctx.moveTo(0,9);ctx.lineTo(0,-58);});ctx.stroke();flower(0,-66,16);ctx.restore();}
 ctx.restore();
}
