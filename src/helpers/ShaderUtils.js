// ─── ShaderUtils.js ─────────────────────────────────────────────────────────
// Shader loading and compilation utilities
// ───────────────────────────────────────────────────────────────────────────

export async function loadText(url) {
  const r = await fetch(url);
  return r.text();
}

export function compileShader(gl, src, type) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s));
  return s;
}

export function createProgram(gl, vSrc, fSrc) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl, vSrc, gl.VERTEX_SHADER));
  gl.attachShader(prog, compileShader(gl, fSrc, gl.FRAGMENT_SHADER));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(prog));
  return prog;
}
