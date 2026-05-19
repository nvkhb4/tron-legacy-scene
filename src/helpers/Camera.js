// Fly camera with WASD + mouse look

import M from './Math.js';

export class FlyCamera {
  constructor() {
    this.pos = [0, 2, 10];
    this.yaw = -Math.PI / 2;   // looking toward -Z
    this.pitch = 0.0;
    this.speed = 8;
    this.sens = 0.002;
    
    this.keys = {};
    this.mouseDown = false;
    
    this.setupInputs();
  }
  
  setupInputs() {
    window.addEventListener('keydown', e => {
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', e => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }
  
  attachMouseLook(canvas) {
    canvas.addEventListener('mousedown', () => {
      this.mouseDown = true;
      canvas.requestPointerLock();
    });
    canvas.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
    document.addEventListener('mousemove', e => {
      if (!this.mouseDown && document.pointerLockElement !== canvas) return;
      this.yaw += e.movementX * this.sens;
      this.pitch -= e.movementY * this.sens;
      this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch));
    });
  }
  
  forward() {
    return [
      Math.cos(this.pitch) * Math.cos(this.yaw),
      Math.sin(this.pitch),
      Math.cos(this.pitch) * Math.sin(this.yaw)
    ];
  }
  
  right() {
    const f = this.forward();
    // cross(f, worldUp) where worldUp = [0,1,0]
    return [f[2], 0, -f[0]];
  }
  
  update(dt) {
    const f = this.forward();
    const r = this.right();
    const spd = this.speed * dt;
    
    if (this.keys['w'] || this.keys['arrowup']) {
      this.pos[0] += f[0]*spd; this.pos[1] += f[1]*spd; this.pos[2] += f[2]*spd;
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      this.pos[0] -= f[0]*spd; this.pos[1] -= f[1]*spd; this.pos[2] -= f[2]*spd;
    }
    if (this.keys['a'] || this.keys['arrowleft']) {
      this.pos[0] -= r[0]*spd; this.pos[2] -= r[2]*spd;
    }
    if (this.keys['d'] || this.keys['arrowright']) {
      this.pos[0] += r[0]*spd; this.pos[2] += r[2]*spd;
    }

    this.pos[1] = Math.max(0.5, this.pos[1]); //bug
  }
  
  getViewMatrix() {
    const f = this.forward();
    const target = [this.pos[0]+f[0], this.pos[1]+f[1], this.pos[2]+f[2]];
    return M.lookAt(this.pos, target, [0,1,0]);
  }
}
