// Generates a building window texture procedurally
// Dark building face with randomly lit cyan/dark windows

export function createWindowTexture(gl, seed = 1) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Dark building base
  ctx.fillStyle = '#010a0a';
  ctx.fillRect(0, 0, size, size);

  // Window grid config
  const cols = 6;
  const rows = 10;
  const padX = 30;
  const padY = 30;
  const gapX = 12;
  const gapY = 10;
  const winW = (size - padX * 2 - gapX * (cols - 1)) / cols;
  const winH = (size - padY * 2 - gapY * (rows - 1)) / rows;

  // Seeded random
  function rand(n) {
    const x = Math.sin(n * seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = padX + c * (winW + gapX);
      const y = padY + r * (winH + gapY);
      const rng = rand(r * cols + c);

      if (rng > 0.35) {
        // Lit window
        if (rng > 0.8) {
          // Bright cyan
          ctx.fillStyle = '#00ffcc';
          ctx.shadowColor = '#00ffcc';
          ctx.shadowBlur = 12;
        } else if (rng > 0.6) {
          // Mid blue
          ctx.fillStyle = '#1a6aff';
          ctx.shadowColor = '#1a6aff';
          ctx.shadowBlur = 8;
        } else {
          // Dim teal
          ctx.fillStyle = '#005544';
          ctx.shadowColor = '#00ffaa';
          ctx.shadowBlur = 4;
        }
      } else {
        // Dark window
        ctx.fillStyle = '#020d0d';
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(x, y, winW, winH);
    }
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