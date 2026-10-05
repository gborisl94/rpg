// RPG v4.2 - HUD ROTATION CENTRE JOUEUR - STABLE
const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
const ld = s => { const i = new Image(); i.src = s + '?v=' + Date.now(); return i; };
const player = ld('player.png'), enemies = ld('enemies.png');
const ok = i => i.complete && i.naturalWidth > 0;
const R = Math.random, dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y), AOE = 80;

let W=640,H=360;
let P,E,A,D,F,T,arrows,fish,expl,score,spawnT,regenT,over,overT,firing,tid,touch,flash,last=0;
let keys={}, aim={x:0,y:0}, aimLocked=null, aimAngle=0;

let joy={active:false,id:null,dx:0,dy:0};
const JOY={r:55,knob:24};
function joyPos(){return {x:JOY.r+20, y:H-JOY.r-20};}
let joyR={active:false,id:null,dx:0,dy:0};
const JOYR={r:45,knob:20};
function joyRPos(){return {x:W-JOYR.r-20, y:H-JOYR.r-20};}
const FIRE={r:36};
function fireBtnPos(){return {x:W-JOYR.r-20, y:H-JOYR.r-20-JOYR.r-60};}

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
 over=false; overT=0; firing=false; tid=null; touch=null; flash=0; aimLocked=null; aimAngle=0;
 aim={x:W/2+60,y:H/2};
 joy.active=false; joy.id=null; joy.dx=0; joy.dy=0;
 joyR.active=false; joyR.id=null; joyR.dx=0; joyR.dy=0;
}
function shoot(explosive){
 if(P.cd>0||over) return;
 if(explosive){if(expl<1) return; expl--;} else {if(arrows<1) return; arrows--;}
 const spread = aimLocked?0.01:0.06;
 const angle = aimAngle + (R()-0.5)*spread;
 A.push({x:P.x,y:P.y-4,angle,speed:explosive?400:580,explosive,life:1.5});
 P.cd=explosive?0.5:0.11; P.shoot=0.12; P.recoil=0.10;
}
function text(x,y,s,c){T.push({x,y,s,c,t:1});}
function explode(x,y){
 F.push({x,y,t:0}); flash=0.15;
 for(const e of E) if(!e.dead && dist(e,{x,y})<AOE) hurt(e,35);
}
function hurt(e,d){
 e.hp-=d; e.flash=0.1;
 if(e.hp>0||e.dead) return;
 e.dead=true; score+=10; aimLocked=null;
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
 if(joyR.active){
  const jr=Math.hypot(joyR.dx,joyR.dy);
  if(jr>0.15){
   const rawAng = Math.atan2(joyR.dy,joyR.dx);
   aimAngle = rawAng; // angle HUD centre joueur
   const len=120;
   let raw={x:P.x+Math.cos(rawAng)*len, y:P.y+Math.sin(rawAng)*len};
   let best=null, bd=80;
   for(const e of E){ const d=dist(raw,e); if(d<bd){bd=d; best=e;} }
   if(best){ raw.x+=(best.x-raw.x)*0.3; raw.y+=(best.y-raw.y)*0.3; aimLocked=best; aimAngle=Math.atan2(raw.y-P.y, raw.x-P.x); } else aimLocked=null;
   aim=raw;
   if(jr>0.45) firing=true;
  }
 } else {
  if(aimLocked){
   aimAngle=Math.atan2(aimLocked.y-P.y, aimLocked.x-P.x);
   aim.x+=(aimLocked.x-aim.x)*dt*10;
   aim.y+=(aimLocked.y-aim.y)*dt*10;
   if(aimLocked.dead || dist(P,aimLocked)>320) aimLocked=null;
  } else {
   aimAngle=Math.atan2(aim.y-P.y, aim.x-P.x);
  }
 }
 let mx=0,my=0,sp=140;
 if(keys.ArrowLeft||keys.q||keys.a) mx--;
 if(keys.ArrowRight||keys.d) mx++;
 if(keys.ArrowUp||keys.z||keys.w) my--;
 if(keys.ArrowDown||keys.s) my++;
 if(joy.active){
  const jl=Math.hypot(joy.dx,