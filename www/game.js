// RPG v6 - AIM LOCK MITRAILLETTE
const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
const ld = s => { const i = new Image(); i.src = s + '?v=' + Date.now(); return i; };
const player = ld('player.png'), enemies = ld('enemies.png');
const ok = i => i.complete && i.naturalWidth > 0;
const R = Math.random, dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y), AOE = 80;

let W=640,H=360;
let P,E,A,D,F,T,arrows,fish,expl,score,spawnT,regenT,over,overT,firing,tid,touch,flash,last=0;
let keys={}, aim={x:0,y:0}, aimLocked=null;

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
 zoomBtns.forEach