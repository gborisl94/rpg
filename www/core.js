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
const JOYR={r:45,knob:20};
function joyRPos(){return {x:W-JOYR.r-20, y:H-JOYR.r-20};}
let fireId=null;
const FIRE={r:36};
function fireBtnPos(){return {x:W-JOYR.r-20, y:H-JOYR.r-20-JOYR.r-60};}
let boltId=null;
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
 P={x:W/2,y:H/2,hp:100,max:100,cd:0,shoot:0,anim:0,hit:0};
 E=[]; A=[]; D=[]; F=[]; T=[]; arrows=99; fish=0; expl=6; score=0; spawnT=1.2; regenT=0;
 over=false; overT=0; firing=false; tid=null; touch=null; flash=0; fireId=null; boltId=null;
 GameAPI._aimAng=0; aim={x:W/2+65,y:H/2};
 joy.active=false; joy.id=null; joy.dx=0; joy.dy=0;
 joyR.active=false; joyR.id=null; joyR.dx=0; joyR.dy=0;
}
function shoot(explosive){
 if(P.cd>0||over) return;
 if(explosive){if(expl<1) return; expl--;} else {if(arrows<1) return; arrows--;}
 const angle=GameAPI._aimAng;
 A.push({x:P.x,y:P.y-4,angle,speed:explosive?400:580,explosive,life:1.5});
 P.cd=explosive?0.5:0.18; P.shoot=0.12;
}
function text(x,y,s,c){T.push({x,y,s,c,t:1});}
function explode(x,y){F.push({x,y,t:0}); flash=0.15; for(const e of E) if(!e.dead && dist(e,{x,y})<AOE) hurt(e,35);}
function hurt(e,d){e.hp-=d; e.flash=0.1; if(e.hp>0||e.dead) return; e.dead=true; score+=10; const r=R(); if(r<0.35) D.push({x:e.x,y:e.y,k:'fish',t:12}); else if(r<0.6) D.push({x:e.x,y:e.y,k:'arrow',t:12});}
function spawn(){if(E.length>25) return; const s=(R()*4)|0, type=(R()*4)|0; const x=s<2?R()*W:(s==2?-24:W+24); const y=s<2?(s?H+24:-24):R()*H; E.push({x,y,type,hp:30,sp:42+type*4+R()*10+Math.min(score/60,30),anim:R()*6,flash:0,hit:0});}
function update(dt){
 if(over){overT+=dt; return;}
 if(joyR.active){const jr=Math.hypot(joyR.dx,joyR.dy); if(jr>0.15) GameAPI._aimAng=Math.atan2(joyR.dy,joyR.dx);}
 if(GameAPI._aimAng==null) GameAPI._aimAng=0;
 aim.x = P.x + Math.cos(GameAPI._aimAng)*65; aim.y = P.y + Math.sin(GameAPI._aimAng)*65;
 zoom+=(zoomTarget-zoom)*Math.min(1,dt*8);
 let mx=0,my=0,sp=140;
 if(keys.ArrowLeft||keys.q||keys.a) mx--; if(keys.ArrowRight||keys.d) mx++; if(keys.ArrowUp||keys.z||keys.w) my--; if(keys.ArrowDown||keys.s) my++;
 if(joy.active){const jl=Math.hypot(joy.dx,joy.dy); if(jl>0.15){mx=joy.dx/jl; my=joy.dy/jl; sp=110+Math.min(jl,1)*70;} else {mx=0; my=0;}} else if(touch && dist(touch,P)>30){mx=touch.x-P.x; my=touch.y-P.y; sp=110;}
 const l=Math.hypot(mx,my)||1; if(mx||my){P.x=Math.max(20,Math.min(W-20,P.x+mx/l*sp*dt)); P.y=Math.max(40,Math.min(H-26,P.y+my/l*sp*dt)); P.anim+=dt*10;}
 P.cd-=dt; P.shoot-=dt; P.hit-=dt; flash-=dt;
 if(firing) shoot(false);
 regenT+=dt; if(regenT>2.5 && P.hp<P.max){P.hp=Math.min(P.max,P.hp+1); if(regenT>3) regenT=0;}
 spawnT-=dt; if(spawnT<=0){spawn(); spawnT=Math.max(0.6,1.6-score/400);}
 for(const e of E){const d=Math.hypot(P.x-e.x,P.y-e.y)||1; e.x+=(P.x-e.x)/d*e.sp*dt; e.y+=(P.y-e.y)/d*e.sp*dt; e.anim+=dt*8; e.flash-=dt; e.hit-=dt; for(const o of E) if(o!==e){const q=dist(e,o); if(q<24&&q>0){e.x+=(e.x-o.x)/q*35*dt; e.y+=(e.y-o.y)/q*35*dt;}} if(d<24 && e.hit<=0 && P.hit<=0){P.hp-=5; P.hit=0.8; e.hit=0.6; if(P.hp<=0){P.hp=0; over=true; overT=0; firing=false;}}}
 for(const a of A){a.x+=Math.cos(a.angle)*a.speed*dt; a.y+=Math.sin(a.angle)*a.speed*dt; a.life-=dt; let hit=false; for(const e of E) if(!e.dead && dist(a,e)<22){if(a.explosive){ if(GameAPI.doLightning) GameAPI.doLightning(a.x,a.y); else explode(a.x,a.y);} else hurt(e,12); hit=true; break;} if(!hit && a.explosive && a.life<=0){if(GameAPI.doLightning) GameAPI.doLightning(a.x,a.y); else explode(a.x,a.y); hit=true;} if(hit||a.life<=0||a.x<-20||a.x>W+20||a.y<-20||a.y>H+20) a.dead=true;}
 for(const d of D){d.t-=dt; if(dist(d,P)<28){d.t=0; if(d.k=='fish'){fish++; P.hp=Math.min(P.max,P.hp+15); text(d.x,d.y-10,'+15 HP','#3cf');} else {arrows=Math.min(99,arrows+5); text(d.x,d.y-10,'+5 ARR','#ffe14d');}}}
 for(const f of F) f.t+=dt; for(const t of T){t.t-=dt; t.y-=24*dt;}
 E=E.filter(e=>!e.dead); A=A.filter(a=>!a.dead); D=D.filter(d=>d.t>0); F=F.filter(f=>f.t<0.4); T=T.filter(t=>t.t>0);
}
function shadow(x,y){ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x,y+22,16,5,0,0,7); ctx.fill();}
function bar(x,y,w,h,pct){ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(x,y,w,h); ctx.fillStyle=pct>0.5?'#2ecc40':pct>0.25?'#f1c40f':'#e74c3c'; ctx.fillRect(x,y,w*pct,h); ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);}
function drawPlayer(){
 const dir=Math.abs(GameAPI._aimAng)<0.785?0:Math.abs(GameAPI._aimAng)>2.356?2:GameAPI._aimAng>0?1:3;
 const bob=Math.sin(P.anim)*1.5; shadow(P.x,P.y); ctx.save(); ctx.translate(P.x,P.y+bob);
 if(P.hit>0 && ((Date.now()/80)|0)%2){ctx.globalAlpha=0.4;}
 if(ok(player)){const w=player.width/4; ctx.drawImage(player,dir*w,0,w,player.height,-24,-24,48,48);} else {ctx.fillStyle='#1de9b6'; ctx.beginPath(); ctx.arc(0,0,16,0,7); ctx.fill();}
 ctx.rotate(GameAPI._aimAng); ctx.lineCap='round'; ctx.lineWidth=2.5; ctx.strokeStyle='#ffb347'; ctx.beginPath(); ctx.arc(-2,0,20,-1.1,1.1); ctx.stroke(); ctx.lineWidth=1; ctx.strokeStyle='#fff'; ctx.beginPath(); ctx.moveTo(8,-18); ctx.lineTo(P.shoot>0?-6:8,0); ctx.lineTo(8,18); ctx.stroke(); ctx.restore();
}
function draw(now){
 ctx.globalAlpha=1; ctx.drawImage(bg,0,0); ctx.save(); const cx=W/2,cy=H/2; ctx.translate(cx,cy); ctx.scale(zoom,zoom); ctx.translate(-cx,-cy);
 ctx.font='bold 14px monospace'; ctx.textAlign='center';
 for(const d of D){const by=d.y+Math.sin(now/200+d.x)*3; if(d.t<3 && ((now/120)|0)%2) continue; if(d.k=='fish'){ctx.fillStyle='#3cf'; ctx.fillText('><> HP',d.x,by);} else {ctx.fillStyle='#ffe14d'; ctx.fillText('↑↑↑',d.x,by);}}
 const all=E.map(e=>({y:e.y,e})).concat([{y:P.y,p:1}]).sort((a,b)=>a.y-b.y);
 for(const o of all){if(o.p){if(!(P.hit>0 && ((now/80)|0)%2)) drawPlayer(); continue;} const e=o.e; shadow(e.x,e.y); ctx.globalAlpha=e.flash>0?0.5:1; if(ok(enemies)){const w=enemies.width/4; ctx.drawImage(enemies,e.type*w,0,w,enemies.height,e.x-20,e.y-20-Math.abs(Math.sin(e.anim))*2,40,40);} else {ctx.fillStyle=['#e63946','#2a6fdb','#f4c20d','#9b3fd1'][e.type]; ctx.beginPath(); ctx.arc(e.x,e.y,14,0,7); ctx.fill();} ctx.globalAlpha=1; bar(e.x-12,e.y-28,24,3,e.hp/30);}
 for(const a of A){ctx.save(); ctx.translate(a.x,a.y); ctx.rotate(a.angle); ctx.fillStyle=a.explosive?'#ff7b00':'#1de9b6'; ctx.fillRect(-12,-1,16,2); ctx.fillStyle=a.explosive?'#ff3cac':'#fff'; ctx.fillRect(4,-3,5,6); ctx.restore();}
 for(const f of F){const k=f.t/0.4; ctx.globalAlpha=1-k; ctx.fillStyle='#ff7b00'; ctx.beginPath(); ctx.arc(f.x,f.y,AOE*k,0,7); ctx.fill(); ctx.strokeStyle='#ffe14d'; ctx.lineWidth=2; ctx.stroke(); ctx.globalAlpha=1;}
 if(flash>0){ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(0,0,W,H);}
 if(GameAPI.drawCrosshair) GameAPI.drawCrosshair(aim.x,aim.y); if(GameAPI.drawFx) GameAPI.drawFx(); ctx.restore();
 ctx.font='bold 13px monospace'; ctx.textAlign='center';
 for(const t of T){ctx.globalAlpha=Math.min(1,t.t*2); ctx.fillStyle=t.c; ctx.fillText(t.s,t.x,t.y);} ctx.globalAlpha=1;
 {const jb=joyPos(); const show=joy.active; ctx.globalAlpha=show?0.85:0.35; ctx.beginPath(); ctx.arc(jb.x,jb.y,JOY.r,0,7); ctx.fillStyle='rgba(20,10,40,.4)'; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle='#1de9b6'; ctx.stroke(); const kx=jb.x+joy.dx*(JOY.r-JOY.knob); const ky=jb.y+joy.dy*(JOY.r-JOY.knob); ctx.beginPath(); ctx.arc(kx,ky,JOY.knob,0,7); ctx.fillStyle=show?'#1de9b6':'rgba(29,233,182,.6)'; ctx.fill(); ctx.globalAlpha=1;}
 {const jb=joyRPos(); const show=joyR.active; ctx.globalAlpha=show?0.85:0.35; ctx.beginPath(); ctx.arc(jb.x,jb.y,JOYR.r,0,7); ctx.fillStyle='rgba(20,10,40,.4)'; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle='#ff3cac'; ctx.stroke(); const kx=jb.x+joyR.dx*(JOYR.r-JOYR.knob); const ky=jb.y+joyR.dy*(JOYR.r-JOYR.knob); ctx.beginPath(); ctx.arc(kx,ky,JOYR.knob,0,7); ctx.fillStyle=show?'#ff3cac':'rgba(255,60,172,.6)'; ctx.fill(); ctx.globalAlpha=1;}
 {const fb=fireBtnPos(); ctx.globalAlpha=firing?0.95:0.45; ctx.beginPath(); ctx.arc(fb.x,fb.y,FIRE.r,0,7); ctx.fillStyle='rgba(255,123,0,.35)'; ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle='#ff7b00'; ctx.stroke(); ctx.fillStyle='#fff'; ctx.font='bold 18px monospace'; ctx.textAlign='center'; ctx.fillText('⚡',fb.x,fb.y+6); ctx.globalAlpha=1;}
 {const bb=boltBtnPos(); const can=expl>0; ctx.globalAlpha=can?0.9:0.3; ctx.beginPath(); ctx.arc(bb.x,bb.y,BOLT.r,0,7); ctx.fillStyle='rgba(125,249,255,.25)'; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle='#7df9ff'; ctx.stroke(); ctx.fillStyle='#7df9ff'; ctx.font='bold 20px monospace'; ctx.textAlign='center'; ctx.fillText('ϟ',bb.x,bb.y+6); ctx.globalAlpha=1;}
 for(const z of zoomBtns){ctx.fillStyle='rgba(20,10,40,.85)'; ctx.fillRect(z.x,z.y,z.w,z.h); ctx.strokeStyle='#1de9b6'; ctx.lineWidth=2; ctx.strokeRect(z.x,z.y,z.w,z.h); ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.font='bold 20px monospace'; ctx.fillText(z.t,z.x+z.w/2,z.y+z.h/2+6);}
 bar(10,10,160,10,P.hp/P.max); ctx.textAlign='left'; ctx.fillStyle='#fff'; ctx.font='bold 10px monospace'; ctx.fillText('HP '+P.hp,14,18);
 ctx.font='bold 12px monospace'; ctx.fillStyle='#3cf'; ctx.fillText('FISH '+fish,10,36); ctx.fillStyle='#ffe14d'; ctx.fillText('ARR '+arrows,70,36); ctx.fillStyle='#7df9ff'; ctx.fillText('FOUDRE '+expl,130,36);
 ctx.fillStyle='#ff3cac'; ctx.font='bold 14px monospace'; ctx.fillText('SCORE '+score,10,52);
 if(over){ctx.fillStyle='rgba(0,0,0,.75)'; ctx.fillRect(0,0,W,H); ctx.textAlign='center'; ctx.fillStyle='#ff3cac'; ctx.font='bold 32px monospace'; ctx.fillText('GAME OVER',W/2,H/2-10); ctx.fillStyle='#fff'; ctx.font='bold 16px monospace'; ctx.fillText('Score '+score,W/2,H/2+18); if(overT>0.6) ctx.fillText('Tap = rejouer',W/2,H/2+42);}
}
const xy=e=>{const r=canvas.getBoundingClientRect(); const sx=(e.clientX-r.left)*W/r.width; const sy=(e.clientY-r.top)*H/r.height; const wx=(sx-W/2)/zoom+W/2; const wy=(sy-H/2)/zoom+H/2; return {sx,sy,x:wx,y:wy};};
const pressZoom=p=>{for(const z of zoomBtns) if(p.sx>z.x&&p.sx<z.x+z.w&&p.sy>z.y&&p.sy<z.y+z.h){zoomTarget=Math.max(ZOOM_MIN,Math.min(ZOOM_MAX,zoomTarget+z.sign*0.15)); return true;} return false;};
const inJoy=p=>{const jb=joyPos(); return Math.hypot(p.sx-jb.x,p.sy-jb.y)<JOY.r*1.5;};
const inJoyR=p=>{const jb=joyRPos(); return Math.hypot(p.sx-jb.x,p.sy-jb.y)<JOYR.r*1.5;};
const inFire=p=>{const fb=fireBtnPos(); return Math.hypot(p.sx-fb.x,p.sy-fb.y)<FIRE.r*1.6;};
const inBolt=p=>{const bb=boltBtnPos(); return Math.hypot(p.sx-bb.x,p.sy-bb.y)<BOLT.r*1.6;};
const restart=()=>{if(over&&overT>0.6){reset(); return true;} return false;};
const key=e=>e.key.length>1?e.key:e.key.toLowerCase();
addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
 const k=key(e); keys[k]=true;
 if(k==' '&&!restart()) firing=true;
 if(k=='e') shoot(true);
 if(k=='f' && GameAPI.doLightning) GameAPI.doLightning(aim.x,aim.y);
 if(k=='+'||k=='=') zoomTarget=Math.min(ZOOM_MAX,zoomTarget+0.15);
 if(k=='-'||k=='_') zoomTarget=Math.max(ZOOM_MIN,zoomTarget-0.15);
 if(k=='ArrowLeft'||k=='ArrowRight'||k=='ArrowUp'||k=='ArrowDown'){const map={ArrowLeft:Math.PI,ArrowRight:0,ArrowUp:-Math.PI/2,ArrowDown:Math.PI/2}; if(map[e.key]!=null) GameAPI._aimAng=map[e.key];}
});
addEventListener('keyup',e=>{const k=key(e); keys[k]=false; if(k==' ') firing=false;});
canvas.addEventListener('mousemove',e=>{ if(!joy.active&&!joyR.active){ const p=xy(e); GameAPI._aimAng=Math.atan2(p.y-P.y,p.x-P.x);} });
canvas.addEventListener('mousedown',e=>{
 const p=xy(e); if(pressZoom(p)) return; if(inBolt(p) && GameAPI.doLightning){ GameAPI.doLightning(aim.x,aim.y); return; }
 if(restart()) return; if(inFire(p)){firing=true; fireId=0; return;} firing=true;
});
addEventListener('mouseup',()=>{firing=false; fireId=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault(); zoomTarget=Math.max(ZOOM_MIN,Math.min(ZOOM_MAX,zoomTarget+(e.deltaY<0?0.1:-0.1)));},{passive:false});
canvas.addEventListener('touchstart',e=>{
 e.preventDefault();
 for(const t of e.changedTouches){
  const p=xy(t);
  if(pressZoom(p)) continue;
  if(restart()) continue;
  if(!joy.active&&inJoy(p)){joy.active=true; joy.id=t.identifier; joy.dx=0; joy.dy=0; continue;}
  if(!joyR.active&&inJoyR(p)){joyR.active=true; joyR.id=t.identifier; joyR.dx=0; joyR.dy=0; continue;}
  if(inFire(p)){firing=true; fireId=t.identifier; continue;}
  if(inBolt(p)&&GameAPI.doLightning){GameAPI.doLightning(aim.x,aim.y); boltId=t.identifier; continue;}
  if(!joy.active){tid=t.identifier; touch=p;}
 }
},{passive:false});
canvas.addEventListener('touchmove',e=>{
 e.preventDefault();
 for(const t of e.touches){
  const p=xy(t);
  if(joy.active&&t.identifier===joy.id){const jb=joyPos(); let dx=p.sx-jb.x,dy=p.sy-jb.y; const len=Math.hypot(dx,dy); const max=JOY.r-JOY.knob; if(len>max){dx=dx/len*max; dy=dy/len*max;} joy.dx=dx/max; joy.dy=dy/max; continue;}
  if(joyR.active&&t.identifier===joyR.id){const jb=joyRPos(); let dx=p.sx-jb.x,dy=p.sy-jb.y; const len=Math.hypot(dx,dy); const max=JOYR.r-JOYR.knob; if(len>max){dx=dx/len*max; dy=dy/len*max;} joyR.dx=dx/max; joyR.dy=dy/max; continue;}
  if(t.identifier===tid){touch=p;}
 }
},{passive:false});
canvas.addEventListener('touchend',e=>{
 e.preventDefault();
 for(const t of e.changedTouches){
  if(joy.active&&t.identifier===joy.id){joy.active=false; joy.id=null; joy.dx=0; joy.dy=0;}
  if(joyR.active&&t.identifier===joyR.id){joyR.active=false; joyR.id=null; joyR.dx=0; joyR.dy=0;}
  if(t.identifier===fireId){firing=false; fireId=null;}
  if(t.identifier===boltId){boltId=null;}
  if(t.identifier===tid){tid=null; touch=null;}
 }
},{passive:false});
canvas.addEventListener('touchcancel',e=>{
 e.preventDefault();
 for(const t of e.changedTouches){
  if(joy.active&&t.identifier===joy.id){joy.active=false; joy.id=null; joy.dx=0; joy.dy=0;}
  if(joyR.active&&t.identifier===joyR.id){joyR.active=false; joyR.id=null; joyR.dx=0; joyR.dy=0;}
  if(t.identifier===fireId){firing=false; fireId=null;}
  if(t.identifier===boltId){boltId=null;}
  if(t.identifier===tid){tid=null; touch=null;}
 }
},{passive:false});
addEventListener('resize',fit);
fit(); reset();
(function loop(t){
 requestAnimationFrame(loop);
 const dt=Math.min(0.033,(t-last)/1000||0); last=t;
 try{ update(dt); }catch(e){ logErr('CORE_UPDATE',e); }
 try{ draw(t); }catch(e){ logErr('CORE_DRAW',e); }
})(0);