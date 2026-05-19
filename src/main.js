import M from './helpers/Math.js';
import { FlyCamera } from './helpers/Camera.js';
import { buildBox, buildGrid, createMesh } from './helpers/Geometry.js';
import { loadText, createProgram } from './helpers/ShaderUtils.js';
import { u1f, u3f, um4, um3 } from './helpers/WebGLUtils.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
if (!gl) { alert('WebGL2 not supported in your browser.'); }

//canvas & viewport management 
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

//scene colors & constants 
const TRON_CYAN  = [0.0, 1.0, 0.85];
const TRON_BLUE  = [0.1, 0.4, 1.0];
const DARK_GREY  = [0.05, 0.05, 0.07];

//city buildings: (x, z, width, height, depth) 
const BUILDINGS = [
  [-8,  -8,  2, 6,  2],
  [-8,   8,  2, 10, 2],
  [ 8,  -8,  2, 8,  2],
  [ 8,   8,  2, 14, 2],
  [-4,  -12, 3, 5,  3],
  [ 4,  -12, 2, 9,  2],
  [-12,  0,  2, 12, 2],
  [ 12,  0,  2, 7,  2],
  [ 0,  -15, 4, 4,  4],
  [-6,   14, 2, 11, 2],
  [ 6,   14, 3, 6,  3],
];

//main initialization 
async function main() {
  //load & compile shaders
  const [vSrc, fSrc] = await Promise.all([
    loadText('../shaders/vertex.glsl'),
    loadText('../shaders/fragment.glsl')
  ]);
  const prog = createProgram(gl, vSrc, fSrc);

  //build meshes
  const boxGeo = buildBox(1, 1, 1);
  const boxMesh = createMesh(gl, prog, boxGeo);
  const planeGeo = buildGrid(60, 1);
  const planeMesh = createMesh(gl, prog, planeGeo);

  //setup
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.0, 0.01, 0.02, 1.0);  //near-black Tron background

  //initialize camera
  const camera = new FlyCamera();
  camera.attachMouseLook(canvas);

  //single neon point light
  const light = { pos: [0, 8, 0], color: TRON_CYAN };

  let last = 0;
  const posHUD = document.getElementById('pos');

  //render loop
  function draw(ts) {
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;

    camera.update(dt);
    resize();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(prog);

    //matrices
    const proj = M.perspective(Math.PI/3, canvas.width/canvas.height, 0.1, 200);
    const view = camera.getViewMatrix();

    um4(gl, prog, 'uProjection', proj);
    um4(gl, prog, 'uView', view);
    u3f(gl, prog, 'uCameraPos', ...camera.pos);

    //light uniforms
    u3f(gl, prog, 'uLightPos',   ...light.pos);
    u3f(gl, prog, 'uLightColor', ...light.color);
    u1f(gl, prog, 'uLightConstant',  1.0);
    u1f(gl, prog, 'uLightLinear',    0.07);
    u1f(gl, prog, 'uLightQuadratic', 0.017);

    //draw ground plane
    {
      const model = M.multiply(M.translation(0, -0.01, 0), M.identity());
      um4(gl, prog, 'uModel', model);
      um3(gl, prog, 'uNormalMatrix', M.normalMatrix(model));
      u3f(gl, prog, 'uAmbientColor',  ...DARK_GREY);
      u3f(gl, prog, 'uDiffuseColor',  0.03, 0.06, 0.06);
      u3f(gl, prog, 'uSpecularColor', 0.1, 0.3, 0.3);
      u1f(gl, prog, 'uShininess', 32.0);
      u1f(gl, prog, 'uEmissiveStrength', 0.0);
      gl.bindVertexArray(planeMesh.vao);
      gl.drawElements(gl.TRIANGLES, planeMesh.count, gl.UNSIGNED_SHORT, 0);
    }

    //draw buildings
    for (const [bx, bz, bw, bh, bd] of BUILDINGS) {
      const model = M.multiply(
        M.translation(bx, bh/2, bz),
        M.scale(bw, bh, bd)
      );
      um4(gl, prog, 'uModel', model);
      um3(gl, prog, 'uNormalMatrix', M.normalMatrix(model));
      u3f(gl, prog, 'uAmbientColor',  ...TRON_CYAN);
      u3f(gl, prog, 'uDiffuseColor',  0.02, 0.04, 0.05);
      u3f(gl, prog, 'uSpecularColor', 0.2, 0.8, 0.8);
      u1f(gl, prog, 'uShininess', 64.0);
      u1f(gl, prog, 'uEmissiveStrength', 0.08);
      gl.bindVertexArray(boxMesh.vao);
      gl.drawElements(gl.TRIANGLES, boxMesh.count, gl.UNSIGNED_SHORT, 0);
    }

    // HUD position display
    posHUD.textContent = `X:${camera.pos[0].toFixed(1)} Y:${camera.pos[1].toFixed(1)} Z:${camera.pos[2].toFixed(1)}`;

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

main().catch(console.error);
