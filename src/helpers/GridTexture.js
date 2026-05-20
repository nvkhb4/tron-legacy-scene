// Generates a Tron-style grid texture on a canvas, uploads to WebGL

export function createGridTexture(gl, size = 512, divisions = 16) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Fill background — near black
  ctx.fillStyle = '#010a0a';
  ctx.fillRect(0, 0, size, size);

  // Draw grid lines
  const cellSize = size / divisions;
  ctx.strokeStyle = '#00ffcc';
  ctx.lineWidth = 1.2;
  ctx.shadowColor = '#00ffcc';
  ctx.shadowBlur = 6;

  for (let i = 0; i <= divisions; i++) {
    const p = i * cellSize;
    // horizontal
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
    // vertical
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
  }

  // Upload to WebGL
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  return tex;
}