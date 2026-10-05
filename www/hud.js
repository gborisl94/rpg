try{
GameAPI.drawCrosshair = function(x,y){
 try{
  const a=Math.atan2(y-P.y, x-P.x);
  const radius=32;
  ctx.save(); ctx.translate(P.x,P.y); ctx.rotate(a);
  ctx.strokeStyle='rgba(29,233,182,.7)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(0,0,radius, -0.6,0.6); ctx.stroke();
  ctx.beginPath(); ctx.arc(0,0,radius, Math.PI-0.6,Math.PI+0.6); ctx.stroke();
  ctx.fillStyle='#1de9b6'; ctx.beginPath(); ctx.moveTo(radius+6,0); ctx.lineTo(radius-5,-4); ctx.lineTo(radius-5,4); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle='rgba(255,255,255,.45)'; ctx.fillRect(x-6,y-1,12,2); ctx.fillRect(x-1,y-6,2,12);
  ctx.strokeStyle='#7df9ff'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(x,y,10,0,7); ctx.stroke();
 }catch(e){ logErr('HUD',e); }
};
}catch(e){ logErr('HUD',e); }