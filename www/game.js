const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

function fit() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
fit();
window.addEventListener('resize', fit);

// Test visuel simple : dessine un carré vert
function loop() {
  requestAnimationFrame(loop);
  ctx.fillStyle = '#0b1a3a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0f0';
  ctx.fillRect(100, 100, 200, 200);

  ctx.fillStyle = '#fff';
  ctx.font = '24px monospace';
  ctx.fillText('TEST OK — ' + canvas.width + 'x' + canvas.height, 100, 400);
}
loop();