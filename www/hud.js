try{
GameAPI.drawCrosshair = function(x,y){
 try{
  // On force le viseur à rester à 65px autour du joueur
  const ang = Math.atan2(y - P.y, x - P.x);
  const distLock = 65; // distance fixe autour du perso
  const vx = P.x + Math.cos(ang) * distLock;
  const vy = P.y + Math.sin(ang) * distLock;

  // 1. CERCLE AUTOUR DU JOUEUR
  ctx.save();
  ctx.translate(P.x, P.y);
  const pulse = Math.sin(Date.now()/180)*1.5;
  ctx.strokeStyle='rgba(29,233,182,0.9)';
  ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,32+pulse,0,7); ctx.stroke();
  ctx.rotate(ang);
  ctx.fillStyle='#1de9b6';
  ctx.beginPath(); ctx.moveTo(38,0); ctx.lineTo(28,-5); ctx.lineTo(28,5); ctx.closePath(); ctx.fill();
  ctx.restore();

  // 2. VISEUR LOCKÉ AUTOUR DU PERSO (plus libre en bas à droite)
  ctx.save();
  ctx.translate(vx, vy);
  ctx.strokeStyle='#fff'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(0,0,10,0,7); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.9)';
  ctx.fillRect(-8,-1,16,2); ctx.fillRect(-1,-8,2,16);
  ctx.fillStyle='#7df9ff'; ctx.beginPath(); ctx.arc(0,0,2,0,7); ctx.fill();
  ctx.restore();

  // On écrase aim pour que les flèches partent du viseur locké
  aim.x = vx; aim.y = vy;

 }catch(e){ logErr('HUD',e); }
};
console.log('HUD v3 OK - viseur lock autour perso');
}catch(e){ logErr('HUD',e); }