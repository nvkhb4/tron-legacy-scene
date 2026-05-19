# TRON Legacy — Week 1 Documentation

## Project Overview

Basic features:
- **Phong lighting** (ambient + diffuse + specular + emissive neon glow)
- **Interactive fly camera** with WASD + mouse look
- **Distance attenuation** on point light
- **Clean modular architecture** with helper utilities in dedicated modules
- **No external dependencies** — pure JavaScript + WebGL2

---

## Project Structure

```
tron_legacy/
├── src/
│   ├── index.html           # Canvas & HUD container
│   ├── main.js              # Scene logic & render loop 
│   └── helpers/             # Modular utilities
│       ├── Math.js          # Matrix math (4×4, 3×3, projections)
│       ├── Camera.js        # FlyCamera class (WASD + mouse look)
│       ├── Geometry.js      # Mesh builders (box, grid, VAO factory)
│       ├── ShaderUtils.js   # Shader compilation pipeline
│       └── WebGLUtils.js    # Uniform setter helpers
├── shaders/
│   ├── vertex.glsl          # MVP transform + normal calculation
│   └── fragment.glsl        # Full Phong shading + neon emissive
└── docs/
    └── week1.md             # This file
```

---

## Helpers Breakdown

### `Math.js`
Pure matrix & vector math — no external libs.

**Exports:**
- `M.identity()` — Returns 4×4 identity matrix
- `M.multiply(a, b)` — Matrix multiplication
- `M.perspective(fovY, aspect, near, far)` — Projection matrix
- `M.lookAt(eye, center, up)` — View matrix
- `M.translation(x, y, z)` — Translation matrix
- `M.scale(x, y, z)` — Scale matrix
- `M.normalMatrix(model)` — Extract 3×3 for normal transforms

```javascript
import M from './helpers/Math.js';

const proj = M.perspective(Math.PI/3, width/height, 0.1, 200);
const view = M.lookAt([0,2,10], [0,0,0], [0,1,0]);
const mvp = M.multiply(proj, M.multiply(view, model));
```

---

### `Camera.js`
Fly camera with smooth WASD movement & mouse look.

**Class: `FlyCamera`**

Properties:
- `pos` — [x, y, z] position
- `yaw`, `pitch` — View angles in radians
- `speed` — Movement speed (units/sec)
- `sens` — Mouse sensitivity

Methods:
- `constructor()` — Initialize with defaults
- `attachMouseLook(canvas)` — Setup pointer lock & mouse events
- `update(dt)` — Update position from keyboard input
- `forward()` — Get forward direction vector
- `right()` — Get right direction vector
- `getViewMatrix()` — Return view matrix

```javascript
import { FlyCamera } from './helpers/Camera.js';

const camera = new FlyCamera();
camera.attachMouseLook(canvas);

// In render loop:
camera.update(deltaTime);
const view = camera.getViewMatrix();
```

**Controls:**
- **W / Arrow Up** — Move forward
- **S / Arrow Down** — Move backward
- **A / Arrow Left** — Strafe left
- **D / Arrow Right** — Strafe right
- **Mouse Drag** — Look around (click to lock pointer)

---

### `Geometry.js`
Mesh builders and VAO factory.

**Exports:**
- `buildBox(w, h, d)` — Returns geometry object with positions, normals, texCoords, indices
- `buildGrid(size, divisions)` — Flat XZ plane (implemented as thin box)
- `createMesh(gl, prog, geo)` — Create VAO from geometry, returns `{vao, count}`

```javascript
import { buildBox, buildGrid, createMesh } from './helpers/Geometry.js';

const boxGeo = buildBox(1, 1, 1);
const boxMesh = createMesh(gl, program, boxGeo);

gl.bindVertexArray(boxMesh.vao);
gl.drawElements(gl.TRIANGLES, boxMesh.count, gl.UNSIGNED_SHORT, 0);
```

**Geometry Object Format:**
```javascript
{
  positions: Float32Array,  // [x, y, z, x, y, z, ...]
  normals: Float32Array,    // [nx, ny, nz, ...]
  texCoords: Float32Array,  // [u, v, u, v, ...]
  indices: Uint16Array      // [0, 1, 2, ...]
}
```

---

### `ShaderUtils.js`
Shader compilation pipeline.

**Exports:**
- `loadText(url)` — Async fetch → `.text()`
- `compileShader(gl, src, type)` — Compile single shader (VERTEX_SHADER or FRAGMENT_SHADER)
- `createProgram(gl, vSrc, fSrc)` — Link vertex + fragment → program

```javascript
import { loadText, createProgram } from './helpers/ShaderUtils.js';

const vSrc = await loadText('../shaders/vertex.glsl');
const fSrc = await loadText('../shaders/fragment.glsl');
const program = createProgram(gl, vSrc, fSrc);
```

**Shader Paths:** Must be relative to HTML file. Since `index.html` is in `src/`, use:
- `../shaders/vertex.glsl`
- `../shaders/fragment.glsl`

---

### `WebGLUtils.js`
Uniform setter convenience functions.

**Exports:**
```javascript
u1f(gl, prog, name, value)           // uniform float
u3f(gl, prog, name, x, y, z)         // uniform 3-component vector
um4(gl, prog, name, mat4)            // uniform 4×4 matrix
um3(gl, prog, name, mat3)            // uniform 3×3 matrix
```

```javascript
import { u1f, u3f, um4, um3 } from './helpers/WebGLUtils.js';

u1f(gl, prog, 'uShininess', 64.0);
u3f(gl, prog, 'uLightColor', 0.0, 1.0, 0.85);
um4(gl, prog, 'uProjection', projMatrix);
um3(gl, prog, 'uNormalMatrix', normMatrix);
```

---

## Main Scene (`main.js`)

Focused on scene logic — no boilerplate.

**Imports all helpers:**
```javascript
import M from './helpers/Math.js';
import { FlyCamera } from './helpers/Camera.js';
import { buildBox, buildGrid, createMesh } from './helpers/Geometry.js';
import { loadText, createProgram } from './helpers/ShaderUtils.js';
import { u1f, u3f, um4, um3 } from './helpers/WebGLUtils.js';
```

**Scene Colors:**
```javascript
const TRON_CYAN  = [0.0, 1.0, 0.85];  // Neon cyan
const TRON_BLUE  = [0.1, 0.4, 1.0];  // Neon blue
const DARK_GREY  = [0.05, 0.05, 0.07];  // Background dark
```

**City Buildings:**
11 procedurally placed buildings arranged in a grid pattern.
Each defined as `[x, z, width, height, depth]`.

```javascript
const BUILDINGS = [
  [-8,  -8,  2, 6,  2],   // Building 1
  [-8,   8,  2, 10, 2],   // Building 2
  // ... 9 more ...
];
```

**Render Loop Flow:**
1. Update camera with delta time
2. Clear color & depth buffers
3. Set projection & view matrices
4. Draw ground plane with dark grey material
5. Draw each building with cyan ambient + neon emissive

---

## Shaders

### Vertex Shader (`vertex.glsl`)
Transforms vertices to world space, computes normals for lighting.

**Inputs (Attributes):**
- `aPosition` — Vertex position (3D)
- `aNormal` — Vertex normal (3D)
- `aTexCoord` — UV coordinate (2D)

**Uniforms:**
- `uModel` — Model transformation matrix
- `uView` — View (camera) matrix
- `uProjection` — Projection matrix
- `uNormalMatrix` — 3×3 normal transform

**Outputs (Varyings):**
- `vFragPos` — World position (for lighting)
- `vNormal` — Transformed normal
- `vTexCoord` — UV (reserved for future use)

---

### Fragment Shader (`fragment.glsl`)
Full **Phong lighting model** with distance attenuation & emissive glow.

**Uniforms:**
- **Material:**
  - `uAmbientColor` — Ambient surface color
  - `uDiffuseColor` — Diffuse surface color
  - `uSpecularColor` — Specular highlight color
  - `uShininess` — Specular exponent (32-128)
  - `uEmissiveStrength` — Neon glow intensity

- **Light (single point light):**
  - `uLightPos` — World position
  - `uLightColor` — Color RGB
  - `uLightConstant`, `uLightLinear`, `uLightQuadratic` — Attenuation coefficients

- **Global:**
  - `uCameraPos` — Camera world position

**Phong Equation:**
$$L = K_a I_a + (K_d (N \cdot L) + K_s (H \cdot N)^p) I_l \cdot \text{att} + K_e$$

Where:
- $K_a$ = ambient color
- $K_d$ = diffuse color
- $K_s$ = specular color
- $p$ = shininess
- $K_e$ = emissive (self-emitting neon)
- $\text{att}$ = distance attenuation

---

## How to Run

### Local Setup
1. Open `src/index.html` in a live server (e.g., VS Code Live Server extension)
   - Direct `file://` access will fail due to CORS on shader fetch
2. Browser console should show no 404 errors
3. Click canvas to enable mouse look

### Expected Output
- Dark near-black background (#000102)
- Cyan-tinted city buildings with subtle neon glow
- Dark ground plane
- HUD in top-left showing camera position
- Smooth camera movement & look around

---

## Performance Notes

- **No texture uploads** — All lighting done analytically
- **Single geometry** — Box mesh instance-rendered for all buildings
- **Single light source** — Easily expandable to multiple lights
- **No post-processing** — Pure forward rendering

Future optimizations:
- Instancing for buildings
- Deferred rendering for many lights
- Glow bloom post-process

---

## Extending the Project

### Add More Lights
Duplicate light uniforms (e.g., `uLightPos2`, `uLightColor2`) and update fragment shader to sum contributions.

### Add Materials System
Create a `Material` class in `helpers/`:
```javascript
class Material {
  constructor(ambient, diffuse, specular, shininess, emissive) {...}
}
```

### Add More Geometry
Add builders to `Geometry.js`:
```javascript
export function buildPyramid(base, height) {...}
export function buildSphere(radius, segments) {...}
```

### Add Animations
Update building transforms in render loop:
```javascript
const angle = Date.now() * 0.001;
const model = M.multiply(
  M.translation(x, y, z),
  M.rotationY(angle)  // Would need to add to Math.js
);
```

---

## File Summary

| File | LOC | Purpose |
|------|-----|---------|
| `main.js` | ~135 | Scene setup & render loop |
| `helpers/Math.js` | ~60 | Matrix utilities |
| `helpers/Camera.js` | ~75 | FlyCamera class |
| `helpers/Geometry.js` | ~70 | Mesh builders |
| `helpers/ShaderUtils.js` | ~25 | Shader pipeline |
| `helpers/WebGLUtils.js` | ~15 | Uniform setters |
| `vertex.glsl` | ~20 | MVP + normal transform |
| `fragment.glsl` | ~40 | Phong + attenuation |
| `index.html` | ~30 | Canvas & HUD |

**Total: ~470 LOC of pure, dependency-free WebGL2**

---