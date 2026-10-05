try{
GameAPI.drawCrosshair=function(x,y){
 try{
  ctx.save();ctx.translate(P.x,P.y);
  const pulse=Math.sin(Date.now()/180)*1.5;
  ctx.strokeStyle='rgba(29,233,182,.9)';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,0,34+pulse,0,7);ctx.stroke();
  ctx.rotate(GameAPI._aimAng);
  ctx.fillStyle='#1de9b6';ctx.beginPath();ctx.moveTo(44,0);ctx.lineTo(30,-6);ctx.lineTo(30,6);ctx.closePath();ctx.fill();
  ctx.restore();
  ctx.save();ctx.translate(x,y);
  ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,11,0,7);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(-9,-1,18,2);ctx.fillRect(-1,-9,2,18);
  ctx.fillStyle='#7df9ff';ctx.beginPath();ctx.arc(0,0,3,0,7);ctx.fill();
  ctx.restore();
 }catch(e){logErr('HUD',e);}
};
}catch(e){logErr('HUD',e);}