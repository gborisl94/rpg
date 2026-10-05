// RPG v4.4 - BASE SAUVEGARDE + FOUDRE SIMPLE - GARANTI SANS ECRAN BLEU
const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
const ld = s => { const i = new Image(); i.src = s + '?v=' + Date.now(); return i; };
const player = ld('player.png'), enemies = ld('enemies.png');
const ok = i => i.complete && i.naturalWidth > 0;
const R = Math.random, dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y), AOE = 80;

let W=640,H=360;
let P,E,A,D,F,T,L,arrows,fish,expl,score,spawnT,regenT,over,overT,firing,tid,touch,flash,last=0;
let keys={}, aim={x:0,y:0}, aimLocked=null, aimAngle=0;

let joy={active:false,id:null,dx:0,dy:0};
const JOY={r:55,knob:24};
function joyPos(){return {x:JOY.r+20, y:H-JOY.r-20};}
let joyR={active:false,id:null,dx:0,dy:0};
const JOYR={r:45,knob:20};
function joyRPos(){return {x:W-JOYR.r-20, y:H-JOYR.r-20};}
const FIRE={r:36};
function fireBtnPos(){return {x:W-JOYR.r-20, y:H-JOYR.r-20-JOYR.r-60};}
const BOLT={r:32};
function boltBtnPos(){return {x:W-JOYR.r-20-60, y:H-JOYR.r-20-JOYR.r-60};}

let zoom=1, zoomTarget=1;
const ZOOM_MIN=0.5, ZOOM_MAX=1.6;
const zoomBtns=[{t:'-',sign:-1},{t:'+',sign:+1}];
const bg=document.createElement('canvas');

function fit(){
 const k=640/Math.max(innerWidth,innerHeight,1);
 W=canvas.width=bg.width=Math.round(innerWidth*k)||640;
 H=canvas.height=bg.height=Math.round(innerHeight*k)||360;
 const b=bg.getContext('2d');
 const g=b.createLinearGradient(0,0,0,H); g.addColorStop(0,'#1a0a3a'); g.addColorStop(1,'#0a1a3a');
 b.fillStyle=g; b.fillRect(0,0,W,H);
 b.lineWidth=1;
 for(let x=0;x<=W;x+=48){b.strokeStyle='rgba(255,60,172,.12)'; b.beginPath(); b.moveTo(x,0); b.lineTo(x,H); b.stroke();}
 for(let y=0;y<=H;y+=48){b.strokeStyle='rgba(29,233,182,.10)'; b.beginPath(); b.moveTo(0,y); b.lineTo(W,y); b.stroke();}
 zoomBtns.forEach((z,i)=>{z.x=W/2-40+i*48; z.y=10; z.w=36; z.h=30;});
 if(P){P.x=Math.min(P.x,W-16); P.y=Math.min(P.y,H-30);}
}
function reset(){
 P={x:W/2,y:H/2,hp:100,max:100,cd:0,shoot:0,anim:0,hit:0,recoil:0};
 E=[]; A=[]; D=[]; F=[]; T=[]; L=[]; arrows=99; fish=0; expl=6; score=0; spawnT=1.2; regenT=0;
 over=false; overT=0; firing=false; tid=null; touch=null; flash=0; aimLocked=null; aimAngle=0;
 aim={x:W/2+60,y:H/2};
 joy.active=false; joy.id=null; joy.dx=0; joy.dy=0;
 joyR.active=false; joyR.id=null; joyR.dx=0; joyR.dy=0;
}
function shoot(explosive){
 if(P.cd>0||over) return;
 if(explosive){if(expl<1) return; expl--;} else {if(arrows<1) return; arrows--;}
 const angle=Math.atan2(aim.y-P.y,aim.x-P.x);
 A.push({x:P.x,y:P.y-4,angle,speed:explosive?400:580,explosive,life:1.5});
 P.cd=explosive?0.5:0.11; P.shoot=0.12; P.recoil=0.1;
}
function text(x,y,s,c){T.push({x,y,s,c,t:1});}
function explode(x,y){
 F.push({x,y,t:0}); flash=0.15;
 for(const e of E) if(!e.dead && dist(e,{x,y})<AOE) hurt(e,35);
}
function hurt(e,d){
 e.hp-=d; e.flash=0.1;
 if(e.hp>0||e.dead) return;
 e.dead=true; score+=10; if(aimLocked===e) aimLocked=null;
 const r=R();
 if(r<0.35) D.push({x:e.x,y:e.y,k:'fish',t:12});
 else if(r<0.6) D.push({x:e.x,y:e.y,k:'arrow',t:12});
}
// FOUDRE - 20 LIGNES SIMPLES
function makeBolt(x1,y1,x2,y2){
 const pts=[{x:x1,y:y1}];
 for(let i=1;i<8;i++){ const t=i/8; pts.push({x:x1+(x2-x1)*t+(R()-0.5)*16, y:y1+(y2-y1)*t+(R()-0.5)*16}); }
 pts.push({x:x2,y:y2}); return pts;
}
function doLightning(x,y){
 if(expl<1) return; expl--; flash=0.3;
 let hits=E.filter(e=>!e.dead && dist({x,y},e)<110).slice(0,5);
 let bolts=[]; let prev={x:x,y:y-130};
 for(const e of hits){ hurt(e,28); bolts.push(makeBolt(prev.x,prev.y,e.x,e.y)); prev=e; }
 if(hits.length===0) bolts.push(makeBolt(x,y-130,x,y));
 L.push({t:0, bolts, x,y});
 for(const e of E) if(!e.dead && dist({x,y},e)<110) hurt(e,10);
 text(x,y-18,'FOUDRE!','#7df9ff');
}
function spawn(){
 if(E.length>25) return;
 const s=(R()*4)|0, type=(R()*4)|0;
 const x=s<2?R()*W:(s==2?-24:W+24);
 const y=s<2?(s?H+24:-24):R()*H;
 E.push({x,y,type,hp:30,sp:42+type*4+R()*10+Math.min(score/60,30),anim:R()*6,flash:0,hit:0});
}
function update(dt){
 if(over){overT+=dt; return;}
 zoom+=(zoomTarget-zoom)*Math.min(1,dt*8);
 if(joyR.active){
  const jr=Math.hypot(joyR.dx,joyR.dy);
  if(jr>0.15){const ang=Math.atan2(joyR.dy,joyR.dx); aimAngle=ang; aim={x:P.x+Math.cos(ang)*120, y:P.y+Math.sin(ang)*120}; if(jr>0.45) firing=true;}
 }
 aimAngle=Math.atan2(aim.y-P.y, aim.x-P.x);
 let mx=0,my=0,sp=140;
 if(keys.ArrowLeft||keys.q||keys.a) mx--;
 if(keys.ArrowRight||keys.d) mx++;
 if(keys.ArrowUp||keys.z||keys.w) my--;
 if(keys.ArrowDown||keys.s) my++;
 if(joy.active){
  const jl=Math.hypot(joy.dx,joy.dy);
  if(jl>0.15){mx=joy.dx/jl; my=joy.dy/jl; sp=110+Math.min(jl,1)*70;} else {mx=0; my=0;}
 } else if(touch && dist(touch,P)>30){mx=touch.x-P.x; my=touch.y-P.y; sp=110;}
 const l=Math.hypot(mx,my)||1;
 if(mx||my){
  P.x=Math.max(20,Math.min(W-20,P.x+mx/l*sp*dt));
  P.y=Math.max(40,Math.min(H-26,P.y+my/l*sp*dt));
  P.anim+=dt*10;
 }
 P.cd-=dt; P.shoot-=dt; P.hit-=dt; P.recoil=Math.max(0,P.recoil-dt*8); flash-=dt;
 if(firing) shoot(false);
 regenT+=dt;
 if(regenT>2.5 && P.hp<P.max){P.hp=Math.min(P.max,P.hp+1); if(regenT>3) regenT=0;}
 spawnT-=dt;
 if(spawnT<=0){spawn(); spawnT=Math.max(0.6,1.6-score/400);}
 for(const e of E){
  const d=Math.hypot(P.x-e.x,P.y-e.y)||1;
  e.x+=(P.x-e.x)/d*e.sp*dt; e.y+=(P.y-e.y)/d*e.sp*dt;
  e.anim+=dt*8; e.flash-=dt; e.hit-=dt;
  for(const o of E) if(o!==e){const q=dist(e,o); if(q<24&&q>0){e.x+=(e.x-o.x)/q*35*dt; e.y+=(e.y-o.y)/q*35*dt;}}
  if(d<24 && e.hit<=0 && P.hit<=0){P.hp-=5; P.hit=0.8; e.hit=0.6; if(P.hp<=0){P.hp=0; over=true; overT=0; firing=false;}}
 }
 for(const a of A){
  a.x+=Math.cos(a.angle)*a.speed*dt; a.y+=Math.sin(a.angle)*a.speed*dt; a.life-=dt;
  let hit=false;
  for(const e of E) if(!e.dead && dist(a,e)<22){if(a.explosive) doLightning(a.x,a.y); else hurt(e,12); hit=true; break;}
  if(!hit && a.explosive && a.life<=0){doLightning(a.x,a.y); hit=true;}
  if(hit||a.life<=0||a.x<-20||a.x>W+20||a.y<-20||a.y>H+20) a.dead=true;
 }
 for(const d of D){d.t-=dt; if(dist(d,P)<28){d.t=0; if(d.k=='fish'){fish++; P.hp=Math.min(P.max,P.hp+15); text(d.x,d.y-10,'+15 HP','#3cf');} else {arrows=Math.min(99,arrows+5); text(d.x,d.y-10,'+5 ARR','#ffe14d');}}}
 for(const f of F) f.t+=dt;
 for(const t of T){t.t-=dt; t.y-=24*dt;}
 for(const b of L) b.t+=dt;
 E=E.filter(e=>!e.dead); A=A.filter(a=>!a.dead); D=D.filter(d=>d.t>0); F=F.filter(f=>f.t<0.4); T=T.filter(t=>t.t>0); L=L.filter(b=>b.t<0.35);
}
function shadow(x,y){ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x,y+22,16,5,0,0,7); ctx.fill();}
function bar(x,y,w,h,pct){
 ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(x,y,w,h);
 ctx.fillStyle=pct>0.5?'#2ecc40':pct>0.25?'#f1c40f':'#e74c3c'; ctx.fillRect(x,y,w*pct,h);
 ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
}
function drawPlayer(){
 const a=aimAngle;
 const dir=Math.abs(a)<0.785?0:Math.abs(a)>2.356?2:a>0?1:3;
 const bob=Math.sin(P.anim)*1.5 - P.recoil*5;
 shadow(P.x,P.y);
 ctx.save(); ctx.translate(P.x,P.y+bob);
 if(ok(player)){const w=player.width/4; ctx.drawImage(player,dir*w,0,w,player.height,-24,-24,48,48);}
 else {ctx.fillStyle='#1de9b6'; ctx.beginPath(); ctx.arc(0,0,16,0,7); ctx.fill();}
 ctx.rotate(a); ctx.lineCap='round'; ctx.lineWidth=2.5; ctx.strokeStyle='#ffb347';
 ctx.beginPath(); ctx.arc(-2,0,20,-1.1,1.1); ctx.stroke();
 ctx.lineWidth=1; ctx.strokeStyle='#fff'; ctx.beginPath(); ctx.moveTo(8,-18); ctx.lineTo(P.shoot>0?-6:8,0); ctx.lineTo(8,18); ctx.stroke();
 ctx.restore();
}
function draw(now){
 ctx.globalAlpha=1; ctx.drawImage(bg,0,0);
 ctx.save(); const cx=W/2,cy=H/2; ctx.translate(cx,cy); ctx.scale(zoom,zoom); ctx.translate(-cx,-cy);
 ctx.font='bold 14px monospace'; ctx.textAlign='center';
 for(const d of D){
  const by=d.y+Math.sin(now/200+d.x)*3;
  if(d.t<3 && ((now/120)|0)%2) continue;
  if(d.k=='fish'){ctx.fillStyle='#3cf'; ctx.fillText('><> HP',d.x,by);}
  else {ctx.fillStyle='#ffe14d'; ctx.fillText('↑↑↑',d.x,by);}
 }
 const all=E.map(e=>({y:e.y,e})).concat([{y:P.y,p:1}]).sort((a,b)=>a.y-b.y);
 for(const o of all){
  if(o.p){if(!(P.hit>0 && ((now/80)|0)%2)) drawPlayer(); continue;}
  const e=o.e; shadow(e.x,e.y); ctx.globalAlpha=e.flash>0?0.5:1;
  if(ok(enemies)){const w=enemies.width/4; ctx.drawImage(enemies,e.type*w,0,w,enemies.height,e.x-20,e.y-20-Math.abs(Math.sin(e.anim))*2,40,40);}
  else {ctx.fillStyle=['#e63946','#2a6fdb','#f4c20d','#9b3fd1'][e.type]; ctx.beginPath(); ctx.arc(e.x,e.y,14,0,7); ctx.fill();}
  ctx.globalAlpha=1; bar(e.x-12,e.y-28,24,3,e.hp/30);
 }
 for(const a of A){ctx.save(); ctx.translate(a.x,a.y); ctx.rotate(a.angle); ctx.fillStyle=a.explosive?'#7df9ff':'#1de9b6'; ctx.fillRect(-12,-1,16,2); ctx.fillStyle=a.explosive?'#fff':'#fff'; ctx.fillRect(4,-3,5,6); ctx.restore();}
 for(const f of F){const k=f.t/0.4; ctx.globalAlpha=1-k; ctx.fillStyle='#ff7b00'; ctx.beginPath(); ctx.arc(f.x,f.y,AOE*k,0,7); ctx.fill(); ctx.strokeStyle='#ffe14d'; ctx.lineWidth=2; ctx.stroke(); ctx.globalAlpha=1;}
 // FOUDRE VISUEL
 for(const lb of L){
  const k=1-lb.t/0.35;
  ctx.globalAlpha=k;
  for(const pts of lb.bolts){
   ctx.strokeStyle='#7df9ff'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y); ctx.stroke();
   ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y); ctx.stroke();
  }
  ctx.globalAlpha=1;
 }
 if(flash>0){ctx.fillStyle='rgba(180,240,255,.25)'; ctx.fillRect(0,0,W,H);}
 ctx.fillStyle='rgba(255,255,255,.4)'; ctx.fillRect(aim.x-5,aim.y-1,10,2); ctx.fillRect(aim.x-1,aim.y-5,2,10);
 ctx.restore();
 ctx.font='bold 13px monospace'; ctx.textAlign='center';
 for(const t of T){ctx.globalAlpha=Math.min(1,t.t*2); ctx.fillStyle=t.c; ctx.fillText(t.s,t.x,t.y);}
 ctx.globalAlpha=1;
 {const jb=joyPos(); const show=joy.active; ctx.globalAlpha=show?0.85:0.35; ctx.beginPath(); ctx.arc(jb.x,jb.y,JOY.r,0,7); ctx.fillStyle='rgba(20,10,40,.4)'; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle='#1de9b6'; ctx.stroke(); const kx=jb.x+joy.dx*(JOY.r-JOY.knob); const ky=jb.y+joy