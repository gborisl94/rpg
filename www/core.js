const canvas=document.getElementById('c'),ctx=canvas.getContext('2d');
const ld=s=>{const i=new Image();i.src=s+'?v='+Date.now();return i;};
const player=ld('player.png'),enemies=ld('enemies.png');
const ok=i=>i.complete&&i.naturalWidth>0;
const R=Math.random,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),AOE=80;
const WORLD_W=1600,WORLD_H=1200;
let W=640,H=360,cam={x:WORLD_W/2,y:WORLD_H/2};
let P,E,A,D,F,T,arrows