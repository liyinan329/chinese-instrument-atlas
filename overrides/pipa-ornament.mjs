// Original Tang-inspired botanical ornament; not a facsimile of an historical instrument.
// References: Shosoin treasure 0000010076 (baoxianghua on the bowl),
// Palace Museum collection/ceramic/226778.html (Sui/Tang baoxianghua vocabulary).
export function paintPipaOrnament(ctx,w,h){
 ctx.save();ctx.scale(w/1024,h/1536);const gold='#d9ba76',ivory='#e8e4c7',jade='#80b6a3',red='#bf6752';
 const stroke=(color,width=3)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';};
 const leaf=(x,y,angle,size,color)=>{ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-size*.55,-size*.4,-size*.4,-size*.85,0,-size);ctx.bezierCurveTo(size*.4,-size*.85,size*.55,-size*.4,0,0);ctx.fillStyle=color;ctx.fill();stroke(gold,1.5);ctx.stroke();ctx.restore();};
 const flower=(x,y,r)=>{ctx.save();ctx.translate(x,y);for(let layer=0;layer<2;layer++)for(let i=0;i<8;i++){ctx.save();ctx.rotate(i*Math.PI/4+(layer?Math.PI/8:0));const rr=r*(layer?.65:1);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-rr*.6,-rr*.45,-rr*.36,-rr*.86,0,-rr);ctx.bezierCurveTo(rr*.36,-rr*.86,rr*.6,-rr*.45,0,0);ctx.fillStyle=layer?jade:ivory;ctx.fill();stroke(gold,2);ctx.stroke();ctx.restore();}ctx.beginPath();ctx.arc(0,0,r*.22,0,Math.PI*2);ctx.fillStyle=red;ctx.fill();stroke(gold,3);ctx.stroke();for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ctx.beginPath();ctx.arc(Math.cos(a)*r*.30,Math.sin(a)*r*.30,2.5,0,Math.PI*2);ctx.fillStyle=gold;ctx.fill();}ctx.restore();};
 // Bilateral scrolling stems follow the narrowing pear-shaped bowl.
 for(const sign of [-1,1]){ctx.save();ctx.translate(512,0);ctx.scale(sign,1);stroke(gold,4);ctx.beginPath();ctx.moveTo(0,1190);ctx.bezierCurveTo(250,1130,290,850,180,750);ctx.bezierCurveTo(100,670,80,580,125,470);ctx.bezierCurveTo(170,370,75,280,0,240);ctx.stroke();for(const [x,y,a,size,c]of [[200,1020,-.8,92,jade],[249,910,.6,75,ivory],[155,763,-.8,76,jade],[104,586,.6,62,ivory],[119,453,-.8,53,jade],[61,318,.7,42,ivory]])leaf(x,y,a,size,c);ctx.restore();}
 flower(512,900,138);flower(512,492,73);flower(512,1180,51);
 stroke(gold,2);for(const [y,r]of [[900,184],[492,103]]){ctx.beginPath();ctx.arc(512,y,r,0,Math.PI*2);ctx.stroke();for(let i=0;i<40;i++){const a=i/40*Math.PI*2;ctx.beginPath();ctx.arc(512+Math.cos(a)*(r+8),y+Math.sin(a)*(r+8),1.7,0,Math.PI*2);ctx.fillStyle=gold;ctx.fill();}}
 ctx.restore();
}
