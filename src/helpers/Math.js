// Matrix and vector math utilities — no external libraries

const M = {
  identity: () => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]),
  
  multiply(a, b) {
    const out = new Float32Array(16);
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        for (let k = 0; k < 4; k++)
          out[r*4+c] += a[r*4+k] * b[k*4+c];
    return out;
  },
  
  perspective(fovY, aspect, near, far) {
    const f = 1 / Math.tan(fovY / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f/aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far+near)*nf, -1,
      0, 0, 2*far*near*nf, 0
    ]);
  },
  
  lookAt(eye, center, up) {
    let fx = center[0]-eye[0], fy = center[1]-eye[1], fz = center[2]-eye[2];
    let fl = Math.hypot(fx,fy,fz); fx/=fl; fy/=fl; fz/=fl;
    let rx = fy*up[2]-fz*up[1], ry = fz*up[0]-fx*up[2], rz = fx*up[1]-fy*up[0];
    let rl = Math.hypot(rx,ry,rz); rx/=rl; ry/=rl; rz/=rl;
    let ux = ry*fz-rz*fy, uy = rz*fx-rx*fz, uz = rx*fy-ry*fx;
    return new Float32Array([
      rx, ux, -fx, 0,
      ry, uy, -fy, 0,
      rz, uz, -fz, 0,
      -(rx*eye[0]+ry*eye[1]+rz*eye[2]),
      -(ux*eye[0]+uy*eye[1]+uz*eye[2]),
       (fx*eye[0]+fy*eye[1]+fz*eye[2]), 1
    ]);
  },
  
  translation(x, y, z) {
    const m = M.identity();
    m[12]=x; m[13]=y; m[14]=z;
    return m;
  },
  
  scale(x, y, z) {
    const m = M.identity();
    m[0]=x; m[5]=y; m[10]=z;
    return m;
  },
  
  normalMatrix(model) {
    // Upper-left 3x3 of model (works when no non-uniform scale)
    return new Float32Array([
      model[0], model[1], model[2],
      model[4], model[5], model[6],
      model[8], model[9], model[10]
    ]);
  },

  rotationY(angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return new Float32Array([
      c, 0, s, 0,
      0, 1, 0, 0,
    -s, 0, c, 0,
      0, 0, 0, 1
    ]);
  },
};

export default M;
