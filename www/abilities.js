// v105 - ne crash plus si update n'existe pas encore
(function(){
let LB=[];
window.LB = LB;
function makeBolt(x1,y1,x2,y2){
 const pts=[{x:x1,y:y1}];
 for(let i=1;i<8;i++){const t=i/8;pts.push({x:x1+(x2-x1)*t+(Math.random()-0.5)*16,y:y1+(y2-y1)*t+(Math.random()-0.5)*16});}
 pts.push({x:x2,y:y2});return pts;
}
window.doLightning = function(x,y){
  if(typeof expl==='undefined'||expl<1) return;
  expl--; flash=0.3;
  let hits=E.filter(e=>!e.dead&&dist({x,y},e)<110).slice(0,5);
  let bolts=[]; let prev={x:x,y:y-130};
  for(const e of hits){hurt(e,28);bolts.push(makeBolt(prev.x,prev.y,e.x,e.y)); prev=e;}
  if(hits.length===0) bolts.push(makeBolt(x,y-130,x,y));
  LB.push({t:0,bolts});
  text(x,y-18,'FOUDRE!','#7df9ff');
};
GameAPI.doLightning = window.doLightning;
GameAPI.drawFx = function(){
  for(const lb of LB){
   const k=1-lb.t/0.35; ctx.globalAlpha=k;
   for(const pts of lb.bolts){
    ctx.strokeStyle='#7df9ff';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.stroke();
    ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.stroke();
   }
  }ctx.globalAlpha=1;
};

// HOOK SÉCURISÉ - attend que update existe
let hooked=false;
function tryHook(){
 if(hooked) return;
 if(typeof window.update==='undefined' || typeof update==='undefined'){ setTimeout(tryHook,50); return; }
 hooked=true;
 const _orig = window.update;
 window.update = function(dt){
   _orig(dt);
   for(const b of LB) b.t+=dt;
   window.LB = LB = LB.filter(b=>b.t<0.35);
 };
 console.log('ABILITIES hook OK');
}
tryHook();
})();