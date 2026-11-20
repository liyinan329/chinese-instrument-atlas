// Original decorative compositions; these are not historical instrument reconstructions.
export function paintPluckedOrnament(g,kind,w,h){
 g.scale(w/1000,h/1000);g.lineCap='round';g.lineJoin='round';
 const gold='#cbb27c',jade='#80aaa1',ivory='#e7ddbd';
 const path=(draw,color=gold,width=2)=>{g.beginPath();draw(g);g.strokeStyle=color;g.lineWidth=width;g.stroke();};
 const leaf=(x,y,a,s=1)=>{g.save();g.translate(x,y);g.rotate(a);g.scale(s,s);g.beginPath();g.moveTo(0,0);g.bezierCurveTo(-20,-35,-13,-67,0,-88);g.bezierCurveTo(17,-65,24,-30,0,0);g.fillStyle=jade;g.globalAlpha=.62;g.fill();g.globalAlpha=1;path(c=>{c.moveTo(0,-3);c.lineTo(0,-75);},ivory,1);g.restore();};
 if(kind==='ruan'){
 // Round medallion: eight folded petals, nested tracery and detached cloud curls.
 g.translate(500,500);for(let i=0;i<8;i++){g.save();g.rotate(i*Math.PI/4);path(c=>{c.moveTo(0,55);c.bezierCurveTo(-95,95,-110,195,0,265);c.bezierCurveTo(110,195,95,95,0,55);},gold,2.8);path(c=>{c.moveTo(0,85);c.bezierCurveTo(-60,130,-65,185,0,232);c.bezierCurveTo(65,185,60,130,0,85);},jade,1.8);leaf(0,-285,Math.PI,.48);path(c=>{c.moveTo(-45,315);c.bezierCurveTo(-115,345,-50,395,0,362);c.bezierCurveTo(50,395,115,345,45,315);},gold,1.8);g.restore();}path(c=>c.arc(0,0,42,0,Math.PI*2),ivory,2);for(let i=0;i<16;i++){const a=i*Math.PI/8;path(c=>{c.moveTo(Math.cos(a)*12,Math.sin(a)*12);c.lineTo(Math.cos(a)*30,Math.sin(a)*30);},gold,1.2);}
 }else if(kind==='liuqin'){
 // Slender willow sprigs: asymmetric branches follow the small pear-shaped bowl.
 path(c=>{c.moveTo(470,860);c.bezierCurveTo(290,620,650,440,490,145);},gold,3);
 for(const [x,y,a,s]of [[443,770,-.9,1],[455,674,.8,.9],[499,585,-.65,.85],[530,490,.85,.8],[538,388,-.7,.7],[526,290,.7,.6]]){leaf(x,y,a,s);path(c=>{c.moveTo(x,y);c.quadraticCurveTo(x-65,y+15,x-100,y-55);},gold,1.4);}
 path(c=>{c.moveTo(420,840);c.bezierCurveTo(230,780,265,610,340,550);},jade,1.8);leaf(330,575,-.6,.65);
 }else if(kind==='sanxian'){
 // Angular fretwork band, reserved for the wooden frame, never the skin.
 for(let y=80;y<940;y+=140)path(c=>{c.moveTo(270,y+80);c.lineTo(270,y);c.lineTo(650,y);c.lineTo(650,y+55);c.lineTo(390,y+55);c.lineTo(390,y+105);c.lineTo(740,y+105);},gold,5);
 }else if(kind==='zheng'){
 // Layered cloud ribbons, composed vertically for the end boards.
 for(let j=0;j<5;j++){const y=160+j*160;path(c=>{c.moveTo(150,y+55);c.bezierCurveTo(330,y+90,290,y-75,470,y-40);c.bezierCurveTo(610,y-120,740,y-20,680,y+30);c.bezierCurveTo(630,y+70,555,y+10,610,y-10);c.bezierCurveTo(450,y-15,490,y+95,810,y+50);},j%2?jade:gold,3);}
 }else if(kind==='qin'){
 // Quiet running-water engraving for the tail, with ample untouched lacquer.
 for(let j=0;j<4;j++)path(c=>{const y=320+j*90;c.moveTo(110,y);c.bezierCurveTo(340,y-90,560,y+100,880,y-5);},j===1?jade:gold,2);
 }else if(kind==='yangqin'){g.translate(1000,0);g.rotate(Math.PI/2);
 // Linked lozenges and small blossoms, distinct from all floral bowl patterns.
 for(let y=100;y<=900;y+=160){path(c=>{c.moveTo(500,y-65);c.lineTo(690,y);c.lineTo(500,y+65);c.lineTo(310,y);c.closePath();},gold,3);for(let i=0;i<4;i++){g.save();g.translate(500,y);g.rotate(i*Math.PI/2);path(c=>{c.moveTo(0,0);c.bezierCurveTo(-35,-25,-25,-55,0,-47);c.bezierCurveTo(25,-55,35,-25,0,0);},jade,2);g.restore();}}
 }
}
