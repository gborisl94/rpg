// ... garde tout pareil que avant jusqu'à touchstart
canvas.addEventListener('touchstart',e=>{
 e.preventDefault();
 for(const t of e.changedTouches){
  const p=xy(t);
  if(pressZoom(p)) continue;
  if(inBolt(p) && GameAPI.doLightning){ GameAPI.doLightning(aim.x,aim.y); continue; }
  if(restart()) continue;
  if(!joy.active&&inJoy(p)){joy.active=true; joy.id=t.identifier; joy.dx=0; joy.dy=0; continue;}
  if(!joyR.active&&inJoyR(p)){joyR.active=true; joyR.id=t.identifier; joyR.dx=0; joyR.dy=0; continue;}
  if(inFire(p)){firing=true; continue;}
  tid=t.identifier; touch=p; firing=true;
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