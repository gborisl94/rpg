try{
(function(){
let LB=[];
function makeBolt(x1,y1,x2,y2){
 const pts=[{x:x1,y:y1}];
 for(let i=1;i<8;i++){ const t=i/8; pts.push({x:x1+(x2-x1)*t+(Math.random()-0.5)*16, y:y1+(y2-y1)*t+(Math.random()-0.5)*16}); }
 pts.push({x:x2,y:y2}); return pts;
}
function doLightning(x,y){
 try{
  if(expl<1) return;
  expl--; flash=0.3;
  let hits=E.filter(e=>!e.dead && dist({x,y},e)<110).slice(0,5);
  let bolts=[]; let prev={x:x,y:y-130};
  for(const e of hits){ hurt(e,28); bolts.push(makeBolt(prev.x,prev.y,e.x,e.y)); prev=e; }
  if(hits.length===0) bolts.push(makeBolt(x,y-130,x,y));
  LB.push({t:0, bolts, x,y});
  for(const e of E) if(!e.dead && dist({x,y},e)<110) hurt(e,10);
  text(x,y-18,'FOUDRE!','#7df9ff');
 }catch(e){ logErr('FOUDRE_DO',e); }
}
GameAPI.doLightning = doLightning;
GameAPI.drawFx = function(){
 try{
  for(const lb of LB){
   const k=1-lb.t/0.35; ctx.globalAlpha=k;
   for(const pts of lb.bolts){
    ctx.strokeStyle='#7df9ff'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y); ctx.stroke();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y); ctx.stroke();
   }
  }
  ctx.globalAlpha=1;
 }catch(e){ logErr('FOUDRE_DRAW',e); }
};
// update timer foudre
let _u = update;
update = function(dt){ _u(dt); for(const b of LB) b.t+=dt; LB=LB.filter(b=>b.t<0.35); };
console.log('foudre OK');
})();
}catch(e){ logErr('ABILITIES',e); }