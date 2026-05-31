import M from './helpers/Math.js';
import { FlyCamera } from './helpers/Camera.js';
import { buildBox, buildGrid, createMesh } from './helpers/Geometry.js';
import { loadText, createProgram } from './helpers/ShaderUtils.js';
import { u1f, u3f, um4, um3 } from './helpers/WebGLUtils.js';
import { createGridTexture } from './helpers/GridTexture.js';
import { loadImageTexture } from './helpers/TextureLoader.js';
import { loadCubeMap } from './helpers/CubeMap.js';
import { createBloom, resizeBloom } from './helpers/Bloom.js';
import { createWindowTexture } from './helpers/WindowTexture.js';
import { loadOBJ } from './helpers/OBJLoader.js';
import { createMeshLarge } from './helpers/Geometry.js';

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
const bloom = createBloom(gl, canvas.width, canvas.height);

//scene colors & constants 
const TRON_CYAN  = [0.0, 1.0, 0.85];
const TRON_BLUE  = [0.1, 0.4, 1.0];
const DARK_GREY  = [0.05, 0.05, 0.07];

//city buildings: (x, z, width, height, depth) 
const BUILDINGS = [
  // ── Main corridor left (x = -10) ──
  [-5, -25, 10, 50, 5],
  [-5, -12, 8, 70, 4],
  [-5,   0, 9, 59, 5],
  [-5,  12, 10, 80, 4],
  [-5,  24, 20,  40, 4],

  // ── Main corridor right (x = +10) ──
  [ 5, -25, 9, 50, 5],
  [ 5, -12, 15, 82, 5],
  [ 5,   0, 8,  78, 4],
  [ 5,  12, 10, 46, 5],
  [ 5,  24, 9, 34, 4],

  // ── Second corridor left (x = -22) ──
  [-15, -20, 5, 58, 5],
  [-15,  -8, 4, 60, 4],
  [-15,   4, 6, 76, 5],
  [-15,  16, 5, 64, 4],

  // ── Second corridor right (x = +22) ──
  [ 15, -18, 5, 52, 5],
  [ 15,  -6, 4, 62, 4],
  [ 15,   6, 6, 70, 5],
  [ 15,  18, 5,  28, 4],

  // ── Far background left (x = -35) ──
  [-25, -15, 7, 45, 6],
  [-25,   5, 6, 60, 6],
  [-25,  20, 5, 48, 5],

  // ── Far background right (x = +35) ──
  [ 25, -10, 7, 40, 6],
  [ 25,   8, 6, 18, 6],
  [ 25,  22, 5, 32, 5],

  // ── Cross street — perpendicular buildings (z = -30) ──
  [ -5, -30, 4, 16, 4],
  [  5, -30, 4, 12, 4],
  [-15, -30, 5, 22, 5],
  [ 15, -30, 5, 18, 5],

  // ── Scattered mid-depth fillers ──
  [-28,  -2, 4, 10, 4],
  [ 28,   2, 4, 14, 4],
  [-16, -28, 3,  8, 3],
  [ 16, -22, 3, 12, 3],
];

//main initialization 
async function main() {
  //load & compile shaders
  ///const [vSrc, fSrc] = await Promise.all([
    ///loadText('../shaders/vertex.glsl'),
    ///loadText('../shaders/fragment.glsl')
  //]);```
  

  const [vSrc, fSrc, skyVSrc, skyFSrc, postVSrc, brightFSrc, blurFSrc, compositeFSrc, starVSrc, starFSrc] = await Promise.all([
    loadText('../shaders/vertex.glsl'),
    loadText('../shaders/fragment.glsl'),
    loadText('../shaders/skybox_vertex.glsl'),
    loadText('../shaders/skybox_fragment.glsl'),
    loadText('../shaders/post_vertex.glsl'),
    loadText('../shaders/bright_extract_fragment.glsl'),
    loadText('../shaders/blur_fragment.glsl'),
    loadText('../shaders/composite_fragment.glsl'),
    loadText('../shaders/starfield_vertex.glsl'),
    loadText('../shaders/starfield_fragment.glsl'),
  ]);
  const starProg = createProgram(gl, starVSrc, starFSrc);
  const prog = createProgram(gl, vSrc, fSrc);

  // Skybox shader
  //const [skyVSrc, skyFSrc] = await Promise.all([
    //loadText('../shaders/skybox_vertex.glsl'),
    //loadText('../shaders/skybox_fragment.glsl')
  //]);```
  const skyProg = createProgram(gl, skyVSrc, skyFSrc);

  // Cube map
  const cubeMap = await loadCubeMap(gl, '../textures');
  const testImg = new Image();
  testImg.onload = () => console.log('px loaded ok');
  testImg.onerror = () => console.error('px FAILED to load');
  testImg.src = '../textures/px.png';

  //```const [postVSrc, brightFSrc, blurFSrc, compositeFSrc] = await Promise.all([
  //loadText('../shaders/post_vertex.glsl'),
  //loadText('../shaders/bright_extract_fragment.glsl'),
  //loadText('../shaders/blur_fragment.glsl'),
  //loadText('../shaders/composite_fragment.glsl'),
  //]);```
  const brightProg    = createProgram(gl, postVSrc, brightFSrc);
  const blurProg      = createProgram(gl, postVSrc, blurFSrc);
  const compositeProg = createProgram(gl, postVSrc, compositeFSrc);

  //build meshes
  const boxGeo = buildBox(1, 1, 1);
  const boxMesh = createMesh(gl, prog, boxGeo);
  const planeGeo = buildGrid(120, 1);
  const planeMesh = createMesh(gl, prog, planeGeo);

  // Load Tron disc
  const discGeo  = await loadOBJ('../assets/obj/torn legacy disk v2-0.obj');
  const discMesh = createMeshLarge(gl, prog, discGeo);

  // Skybox is just a big cube drawn inside-out
  const skyGeo = buildBox(500,500, 500);
  const skyMesh = createMesh(gl, skyProg, skyGeo);

  //texture
  const gridTex = createGridTexture(gl, 512, 16);

  //load tex image
  const metalTex = await loadImageTexture(gl, '../textures/metal_plate_02_diff_4k.jpg');
  const winTex1 = createWindowTexture(gl, 1);
  const winTex2 = createWindowTexture(gl, 2);
  const winTex3 = createWindowTexture(gl, 3);
  const winTextures = [winTex1, winTex2, winTex3];

  //setup
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.0, 0.01, 0.02, 1.0);  //near-black Tron background

  //initialize camera
  const camera = new FlyCamera();
  camera.attachMouseLook(canvas);

  //single neon point light
  //const light = { pos: [0, 8, 0], color: TRON_CYAN };

  // Multiple neon point lights scattered around the city
  const LIGHTS = [
  { pos: [  0, 8,  10], color: [0.0, 1.0, 0.85] },
  { pos: [ -8, 6,   0], color: [0.3, 0.7, 1.0]  },
  { pos: [  8, 6, -10], color: [0.0, 1.0, 0.7]  },
  { pos: [  0, 8, -20], color: [0.2, 0.6, 1.0]  },
  ];

  let last = 0;
  let elapsed = 0;
  const posHUD = document.getElementById('pos');


  //render loop
  function draw(ts) {
  const dt = Math.min((ts - last) / 1000, 0.05);
  elapsed += dt;
  last = ts;
  camera.update(dt);

  // Resize FBOs if canvas changed
  const W = canvas.width, H = canvas.height;
  resize();
  if (canvas.width !== W || canvas.height !== H)
    resizeBloom(gl, bloom, canvas.width, canvas.height);

  const proj = M.perspective(Math.PI/3, canvas.width/canvas.height, 0.1, 200);
  const view = camera.getViewMatrix();

  // ── PASS 1: render scene to offscreen FBO ──────────────────────────────
  gl.bindFramebuffer(gl.FRAMEBUFFER, bloom.scene.fbo);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Skybox
  gl.depthMask(false);
  gl.disable(gl.CULL_FACE);
  gl.useProgram(skyProg);
  um4(gl, skyProg, 'uProjection', proj);
  um4(gl, skyProg, 'uView', view);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
  gl.uniform1i(gl.getUniformLocation(skyProg, 'uSkybox'), 0);
  gl.bindVertexArray(skyMesh.vao);
  gl.drawElements(gl.TRIANGLES, skyMesh.count, gl.UNSIGNED_SHORT, 0);
  gl.enable(gl.CULL_FACE);
  gl.depthMask(true);

  // Starfield — drawn after skybox, before scene
  gl.disable(gl.DEPTH_TEST);
  gl.useProgram(starProg);
  gl.uniform1f(gl.getUniformLocation(starProg, 'uTime'), elapsed);
  gl.bindVertexArray(bloom.quadVAO);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.enable(gl.DEPTH_TEST);

  // Main scene
  gl.useProgram(prog);
  um4(gl, prog, 'uProjection', proj);
  um4(gl, prog, 'uView', view);
  u3f(gl, prog, 'uCameraPos', ...camera.pos);
  u3f(gl, prog, 'uFogColor',   0.0, 0.02, 0.03);
  u1f(gl, prog, 'uFogDensity', 0.008);
  for (let i = 0; i < LIGHTS.length; i++) {
    gl.uniform3fv(gl.getUniformLocation(prog, `uLightPos[${i}]`),   LIGHTS[i].pos);
    gl.uniform3fv(gl.getUniformLocation(prog, `uLightColor[${i}]`), LIGHTS[i].color);
  }
  u1f(gl, prog, 'uLightConstant',  1.0);
  u1f(gl, prog, 'uLightLinear',    0.017);
  u1f(gl, prog, 'uLightQuadratic', 0.0008);

  // Ground
  {
    const model = M.multiply(M.translation(0, -0.01, 0), M.identity());
    um4(gl, prog, 'uModel', model);
    um3(gl, prog, 'uNormalMatrix', M.normalMatrix(model));
    u3f(gl, prog, 'uAmbientColor',  0.0, 0.8, 0.7);
    u3f(gl, prog, 'uDiffuseColor',  0.0, 0.0, 0.0);
    u3f(gl, prog, 'uSpecularColor', 0.3, 1.0, 0.9);
    u1f(gl, prog, 'uShininess', 64.0);
    u1f(gl, prog, 'uEmissiveStrength', 0.0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gridTex);
    gl.uniform1i(gl.getUniformLocation(prog, 'uDiffuseTex'), 0);
    gl.uniform1i(gl.getUniformLocation(prog, 'uUseTexture'), 1);
    u1f(gl, prog, 'uTexScale', 8.0);
    gl.bindVertexArray(planeMesh.vao);
    gl.drawElements(gl.TRIANGLES, planeMesh.count, gl.UNSIGNED_SHORT, 0);
    gl.uniform1i(gl.getUniformLocation(prog, 'uUseTexture'), 0);
  }

  // Buildings
  for (let idx = 0; idx < BUILDINGS.length; idx++) {
    const [bx, bz, bw, bh, bd] = BUILDINGS[idx];
    const model = M.multiply(
      M.translation(bx, bh/2 - bh/2, bz),
      M.scale(bw, bh, bd)
    );
    um4(gl, prog, 'uModel', model);
    um3(gl, prog, 'uNormalMatrix', M.normalMatrix(model));
    u3f(gl, prog, 'uAmbientColor',  ...TRON_CYAN);
    u3f(gl, prog, 'uDiffuseColor',  0.0, 0.15, 0.15);
    u3f(gl, prog, 'uSpecularColor', 0.3, 1.0, 0.9);
    u1f(gl, prog, 'uShininess', 64.0);
    u1f(gl, prog, 'uEmissiveStrength', 0.45);

    // Alternate between window textures per building
    const tex = winTextures[idx % winTextures.length];
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(prog, 'uDiffuseTex'), 0);
    gl.uniform1i(gl.getUniformLocation(prog, 'uUseTexture'), 1);
    u1f(gl, prog, 'uTexScale', bh / bw);  // 1x so windows don't tile weirdly (changed)

    gl.bindVertexArray(boxMesh.vao);
    gl.drawElements(gl.TRIANGLES, boxMesh.count, gl.UNSIGNED_SHORT, 0);
    gl.uniform1i(gl.getUniformLocation(prog, 'uUseTexture'), 0);
  }

  // Draw Tron disc — floating + rotating
  {
    const angle = elapsed * 0.8;  // rotation speed
    const model = M.multiply(
      M.translation(0, 270, -10),    // center corridor, above head height
      M.multiply(
        M.rotationY(angle),
        M.scale(0.05, 0.05, 0.05) // scale down — OBJ units vary, adjust if needed
      )
    );
    um4(gl, prog, 'uModel', model);
    um3(gl, prog, 'uNormalMatrix', M.normalMatrix(model));
    u3f(gl, prog, 'uAmbientColor',  0.0, 1.0, 0.85);
    u3f(gl, prog, 'uDiffuseColor',  0.0, 0.5, 0.8);
    u3f(gl, prog, 'uSpecularColor', 0.5, 1.0, 1.0);
    u1f(gl, prog, 'uShininess', 128.0);
    u1f(gl, prog, 'uEmissiveStrength', 0.6);
    gl.uniform1i(gl.getUniformLocation(prog, 'uUseTexture'), 0);
    gl.bindVertexArray(discMesh.vao);
    // Use UNSIGNED_INT since it's a large mesh
    gl.drawElements(gl.TRIANGLES, discMesh.count, gl.UNSIGNED_INT, 0);
  }

  // ── PASS 2: extract bright regions → pingFBO ──────────────────────────
  gl.bindFramebuffer(gl.FRAMEBUFFER, bloom.pingFBO.fbo);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(brightProg);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, bloom.scene.tex);
  gl.uniform1i(gl.getUniformLocation(brightProg, 'uScene'), 0);
  gl.uniform1f(gl.getUniformLocation(brightProg, 'uThreshold'), 0.02);
  gl.bindVertexArray(bloom.quadVAO);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // ── PASS 3: Gaussian blur — 6 ping-pong passes ────────────────────────
  let horizontal = true;
  let readFBO = bloom.pingFBO;
  let writeFBO = bloom.pongFBO;
  gl.useProgram(blurProg);

  for (let i = 0; i < 15; i++) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, writeFBO.fbo);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, readFBO.tex);
    gl.uniform1i(gl.getUniformLocation(blurProg, 'uImage'), 0);
    gl.uniform1i(gl.getUniformLocation(blurProg, 'uHorizontal'), horizontal ? 1 : 0);
    gl.bindVertexArray(bloom.quadVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    // Swap
    const tmp = readFBO; readFBO = writeFBO; writeFBO = tmp;
    horizontal = !horizontal;
  }

  // ── PASS 4: composite bloom onto scene → screen ───────────────────────
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(compositeProg);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, bloom.scene.tex);
  gl.uniform1i(gl.getUniformLocation(compositeProg, 'uScene'), 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, readFBO.tex);
  gl.uniform1i(gl.getUniformLocation(compositeProg, 'uBloom'), 1);
  gl.uniform1f(gl.getUniformLocation(compositeProg, 'uBloomStrength'), 2.0);
  gl.bindVertexArray(bloom.quadVAO);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  posHUD.textContent = `X:${camera.pos[0].toFixed(1)} Y:${camera.pos[1].toFixed(1)} Z:${camera.pos[2].toFixed(1)}`;
  requestAnimationFrame(draw);
}

  requestAnimationFrame(draw);
}

main().catch(console.error);
