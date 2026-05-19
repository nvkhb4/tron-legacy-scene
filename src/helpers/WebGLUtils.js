// WebGL uniform and state helpers

export function u1f(gl, prog, name, v) {
  gl.uniform1f(gl.getUniformLocation(prog, name), v);
}

export function u3f(gl, prog, name, x, y, z) {
  gl.uniform3f(gl.getUniformLocation(prog, name), x, y, z);
}

export function um4(gl, prog, name, m) {
  gl.uniformMatrix4fv(gl.getUniformLocation(prog, name), false, m);
}

export function um3(gl, prog, name, m) {
  gl.uniformMatrix3fv(gl.getUniformLocation(prog, name), false, m);
}
