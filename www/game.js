// RPG v5 - VISEUR MITRAILLETTE + JOY DROIT = AIM
const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
const ld = s => { const i = new Image(); i.src = s + '?v=' + Date.now(); return i; };
const player = ld('player.png'), enemies = ld('enemies.png');
const ok = i => i.complete && i.naturalWidth > 0;
const R = Math.random, dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y), AOE = 80;

let W=640,H=360;
let P,E,A,D,F,T,arrows,fish,expl,score,spawnT,regenT,over,overT,firing,tid,touch,flash,last=0;
let keys={}, aim={x:0,y:0};

let joy={active:false,id:null,dx:0,dy:0};
const JOY={r:55,knob:24};
function joyPos(){return {x:JOY.r+20, y:H-JOY.r-20};}
let joyR={active:false,id:null,dx:0,dy:0};
const JOYR={r:48,knob:22};
function joyRPos(){return {x:W-JOYR.r-20, y:H-JOYR.r-20};}
const FIRE={r:34};
function fireBtnPos(){return {x:W-JOYR.r-20, y:H-JOYR.r-20-JOYR.r-62};}

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
 E=[]; A=[]; D=[]; F=[]; T=[];
 arrows=99; fish=0; expl=3; score=0; spawnT=1.2; regenT=0;
 over=false; overT=0; firing=false; tid=null; touch=null; flash=0;
 aim={x:W/2+80,y:H/2};
 joy.active=false; joy.id=null; joy.dx=0; joy.dy=0;
 joyR.active=false; joyR.id=null; joyR.dx=0; joyR.dy=0;
}
function shoot(explosive){
 if(P.cd>0||over) return;
 if(explosive){if(expl<1) return; expl--;} else {if(arrows<1) return; arrows--;}
 const spread = joyR.active ? 0.08 : 0.02;
 const angle = Math.atan2(aim.y-P.y, aim.x-P.x) + (R()-0.5)*spread;
 A.push({x:P.x,y:P.y-4,angle,speed:explosive?420:620,explosive,life:1.5});
 P.cd=explosive?0.5:0.10; // cadence mitraillette
 P.shoot=0.12; P.recoil=0.08;
}
function text(x,y,s,c){T.push({x,y,s,c,t:1});}
function explode(x,y){
 F.push({x,y,t:0}); flash=0.15;
 for(const e of E) if(!e.dead && dist(e,{x,y})<AOE) hurt(e,35);
}
function hurt(e,d){
 e.hp-=d; e.flash=0.1;
 if(e.hp>0||e.dead) return;
 e.dead=true; score+=10;
 const r=R();
 if(r<0.35) D.push({x:e.x,y:e.y,k:'fish',t:12});
 else if(r<0.6) D.push({x:e.x,y:e.y,k:'arrow',t:12});
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
 P.recoil=Math.max(0,P.recoil-dt*8);
 // JOY DROIT = VISEUR
 if(joyR.active){
  const jr=Math.hypot(joyR.dx,joyR.dy);
  if(jr>0.18){
   const len=90 + jr*90; // plus tu pousses, plus le viseur est loin
   aim={x:P.x+(joyR.dx/jr)*len, y:P.y+(joyR.dy/jr)*len};
   if(jr>0.5) firing=true; // auto-tir si stick poussé à fond
  }
 } else {
  // si joystick droit relâché, viseur suit la dernière direction mais ne tire plus auto
  if(firing && tid===null && !keys[' ']) {
   // on garde le tir seulement si bouton ⚡ ou espace
  }
 }
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
 P.cd-=dt; P.shoot-=dt; P.hit-=dt; flash-=dt;
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
  for(const e of E) if(!e.dead && dist(a,e)<22){if(a.explosive) explode(a.x,a.y); else hurt(e,12); hit=true; break;}
  if(!hit && a.explosive && a.life<=0){explode(a.x,a.y); hit=true;}
  if(hit||a.life<=0||a.x<-20||a.x>W+20||a.y<-20||a.y>H+20) a.dead=true;
 }
 for(const d of D){d.t-=dt; if(dist(d,P)<28){d.t=0; if(d.k=='fish'){fish++; P.hp=Math.min(P.max,P.hp+15); text(d.x,d.y-10,'+15 HP','#3cf');} else {arrows=Math.min(99,arrows+5); text(d.x,d.y-10,'+5 ARR','#ffe14d');}}}
 for(const f of F) f.t+=dt;
 for(const t of T){t.t-=dt; t.y-=24*dt;}
 E=E.filter(e=>!e.dead); A=A.filter(a=>!a.dead); D=D.filter(d=>d.t>0); F=F.filter(f=>f.t<0.4); T=T.filter(t=>t.t>0);
}
function shadow(x,y){ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x,y+22,16,5,0,0,7); ctx.fill();}
function bar(x,y,w,h,pct){
 ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(x,y,w,h);
 ctx.fillStyle=pct>0.5?'#2ecc40':pct>0.25?'#f1c40f':'#e74c3c'; ctx.fillRect(x,y,w*pct,h);
 ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
}
function drawPlayer(){
 const a=Math.atan2(aim.y-P.y,aim.x-P.x);
 const dir=Math.abs(a)<0.785?0:Math.abs(a)>2.356?2:a>0?1:3;
 const bob=Math.sin(P.anim)*1.5 - P.recoil*6;
 shadow(P.x,P.y);
 ctx.save(); ctx.translate(P.x,P.y+bob);
 if(ok(player)){const w=player.width/4; ctx.drawImage(player,dir*w,0,w,player.height,-24,-24,48,48);}
 else {ctx.fillStyle='#1de9b6'; ctx.beginPath(); ctx.arc(0,0,16,0,7); ctx.fill();}
 ctx.rotate(a); ctx.lineCap='round'; ctx.lineWidth=2.5; ctx.strokeStyle='#ffb347';
 ctx.beginPath(); ctx.arc(-2,0,20,-1.1,1.1); ctx.stroke();
 ctx.lineWidth=1; ctx.strokeStyle='#fff'; ctx.beginPath(); ctx.moveTo(8,-18); ctx.lineTo(P.shoot>0?-6:8,0); ctx.lineTo(8,18); ctx.stroke();
 ctx.restore();
}
function drawCrosshair(x,y){
 const jr = joyR.active ? Math.hypot(joyR.dx,joyR.dy) : 0;
 const spread = 8 + jr*14 + P.recoil*30;
 // laser mitraillette
 ctx.save();
 ctx.globalAlpha=0.25;
 ctx.strokeStyle='#ff3cac'; ctx.lineWidth=1;
 ctx.setLineDash([6,6]);
 ctx.beginPath(); ctx.moveTo(P.x,P.y); ctx.lineTo(x,y); ctx.stroke();
 ctx.setLineDash([]);
 ctx.globalAlpha=1;
 // cercle externe
 ctx.strokeStyle= jr>0.5 ? '#ff3c3c' : '#1de9b6';
 ctx.lineWidth=1.5;
 ctx.beginPath(); ctx.arc(x,y,12+spread*0.3,0,7); ctx.stroke();
 // croix mitraillette
 ctx.strokeStyle='rgba(255,255,255,.9)';
 ctx.lineWidth=2;
 ctx.beginPath();
 ctx.moveTo(x-spread-8,y); ctx.lineTo(x-spread,y);
 ctx.moveTo(x+spread,y); ctx.lineTo(x+spread+8,y);
 ctx.moveTo(x,y-spread-8); ctx.lineTo(x,y-spread);
 ctx.moveTo(x,y+spread); ctx.lineTo(x,y+spread+8);
 ctx.stroke();
 // point central
 ctx.fillStyle= jr>0.5 ? '#ff3c3c' : '#fff';
 ctx.beginPath(); ctx.arc(x,y,2.5,0,7); ctx.fill();
 // viseur verrouillage ennemi proche
 let closest=null, cd=999;
 for(const e of E){const d=dist({x,y},e); if(d<cd && d<60){cd=d; closest=e;}}
 if(closest){
  ctx.strokeStyle='#ff3c3c'; ctx.lineWidth=1.5;
  ctx.strokeRect(closest.x-16,closest.y-20,32,32);
  ctx.fillStyle='#ff3c3c'; ctx.font='bold 8px monospace'; ctx.textAlign='center';
  ctx.fillText('LOCK',closest.x,closest.y-24);
 }
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
 for(const a of A){ctx.save(); ctx.translate(a.x,a.y); ctx.rotate(a.angle); ctx.fillStyle=a.explosive?'#ff7b00':'#1de9b6'; ctx.fillRect(-12,-1,16,2); ctx.fillStyle=a.explosive?'#ff3cac':'#fff'; ctx.fillRect(4,-3,5,6); ctx.restore();}
 for(const f of F){const k=f.t/0.4; ctx.globalAlpha=1-k; ctx.fillStyle='#ff7b00'; ctx.beginPath(); ctx.arc(f.x,f.y,AOE*k,0,7); ctx.fill(); ctx.strokeStyle='#ffe14d'; ctx.lineWidth=2; ctx.stroke(); ctx.globalAlpha=1;}
 if(flash>0){ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(0,0,W,H);}
 drawCrosshair(aim.x,aim.y);
 ctx.restore();

 ctx.font='bold 13px monospace'; ctx.textAlign='center';
 for(const t of T){ctx.globalAlpha=Math.min(1,t.t*2); ctx.fillStyle=t.c; ctx.fillText(t.s,t.x,t.y);}
 ctx.globalAlpha=1;

 {const jb=joyPos(); const show=joy.active; ctx.globalAlpha=show?0.85:0.35; ctx.beginPath(); ctx.arc(jb.x,jb.y,JOY.r,0,7); ctx.fillStyle='rgba(20,10,40,.4)'; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle='#1de9b6'; ctx.stroke(); const kx=jb.x+joy.dx*(JOY.r-JOY.knob); const ky=jb.y+joy.dy*(JOY.r-JOY.knob); ctx.beginPath(); ctx.arc(kx,ky,JOY.knob,0,7); ctx.fillStyle=show?'#1de9b6':'rgba(29,233,182,.6)'; ctx.fill(); ctx.globalAlpha=1; ctx.fillStyle='#1de9b6'; ctx.font='bold 9px monospace'; ctx.textAlign='