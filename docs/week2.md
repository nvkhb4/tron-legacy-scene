# TRON Legacy — Week 2 Documentation

## Project Overview (Updated)

Expanded from Week 1 with textured ground and dynamic multi-light system.

**New features:**
- **Grid textured ground plane** with procedural canvas-based grid generation
- **Multiple point lights** (4 lights) with per-light attenuation and color blending
- **Enhanced neon palette** — lighting sums cyan/blue/teal contributions
- **Mipmapped textures** with REPEAT wrapping and per-vertex texture scaling

---

## What's New in Week 2

### 1. Ground Plane with Grid Texture

**GridTexture.js** — New helper for procedural grid generation.

Instead of a plain dark material, the ground now features:
- Canvas-based grid pattern (white lines on dark background)
- Mipmapped WebGL texture for quality at all scales
- REPEAT wrapping for seamless tiling
- Uniform `uTexScale` controls grid density in shader

**Implementation in main.js:**
```javascript
// Ground mesh created once
const groundGeo = buildGrid(100, 100);
const groundMesh = createMesh(gl, program, groundGeo);

// Texture from GridTexture helper
import { GridTexture } from './helpers/GridTexture.js';
const gridTex = new GridTexture(512, 512, 32);  // 512x512 canvas, 32px grid
const gridWebGLTex = gridTex.uploadToWebGL(gl);
```

**In render loop:**
```javascript
// Bind ground texture
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, gridWebGLTex);
u1f(gl, prog, 'uTexScale', 8.0);  // Scale grid pattern

// Draw ground
gl.bindVertexArray(groundMesh.vao);
gl.drawElements(gl.TRIANGLES, groundMesh.count, gl.UNSIGNED_SHORT, 0);
```

---

### 2. Multiple Point Lights

**Previous setup (Week 1):** Single light with fixed uniforms.

**New setup (Week 2):** Array of 4 lights with indexed uniforms.

**Lights array in main.js:**
```javascript
const LIGHTS = [
  { pos: [10, 8, 10],    color: [0.0, 1.0, 0.85] },   // Cyan
  { pos: [-12, 7, 12],   color: [0.1, 0.4, 1.0] },    // Blue
  { pos: [0, 6, -15],    color: [0.0, 0.9, 0.5] },    // Green
  { pos: [-15, 5, -10],  color: [0.2, 0.8, 1.0] }     // Teal
];

const NUM_LIGHTS = 4;
```

**Uploading to shader:**
```javascript
for (let i = 0; i < NUM_LIGHTS; i++) {
  u3f(gl, prog, `uLightPos[${i}]`, 
    LIGHTS[i].pos[0], LIGHTS[i].pos[1], LIGHTS[i].pos[2]);
  u3f(gl, prog, `uLightColor[${i}]`, 
    LIGHTS[i].color[0], LIGHTS[i].color[1], LIGHTS[i].color[2]);
}

// Attenuation coefficients (same for all lights)
u1f(gl, prog, 'uLightConstant', 1.0);
u1f(gl, prog, 'uLightLinear', 0.22);
u1f(gl, prog, 'uLightQuadratic', 0.20);
```

---

### 3. Fragment Shader Updates

**New uniforms array:**
```glsl
#define NUM_LIGHTS 4

uniform vec3 uLightPos[NUM_LIGHTS];
uniform vec3 uLightColor[NUM_LIGHTS];
uniform float uLightConstant;
uniform float uLightLinear;
uniform float uLightQuadratic;
```

**Lighting loop in fragment shader:**
```glsl
vec3 totalLight = uAmbientColor * 0.2;  // Baseline ambient

for (int i = 0; i < NUM_LIGHTS; i++) {
  vec3 lightDir = normalize(uLightPos[i] - vFragPos);
  float distance = length(uLightPos[i] - vFragPos);
  
  // Attenuation
  float att = 1.0 / (uLightConstant + 
              uLightLinear * distance + 
              uLightQuadratic * distance * distance);
  
  // Diffuse
  float diff = max(dot(vNormal, lightDir), 0.0);
  vec3 diffuse = diff * uDiffuseColor * uLightColor[i] * att;
  
  // Specular
  vec3 viewDir = normalize(uCameraPos - vFragPos);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(vNormal, halfDir), 0.0), uShininess);
  vec3 specular = spec * uSpecularColor * uLightColor[i] * att;
  
  totalLight += diffuse + specular;
}

// Emissive neon glow (per-building)
totalLight += uAmbientColor * uEmissiveStrength;

gl_FragColor = vec4(totalLight, 1.0);
```

---

## New Helper: GridTexture.js

**Purpose:** Generate procedural grid textures as canvas, upload to WebGL with mipmaps.

**Class: `GridTexture`**

**Constructor:**
```javascript
constructor(width, height, gridSize)
```
- `width`, `height` — Canvas dimensions (e.g., 512)
- `gridSize` — Spacing between grid lines in pixels

**Methods:**
- `uploadToWebGL(gl)` — Render canvas to WebGL texture, enable mipmaps + REPEAT wrap
  - Generates `gl.generateMipmap()`
  - Sets `gl.TEXTURE_WRAP_S/T = gl.REPEAT`
  - Returns WebGL texture handle

**Example:**
```javascript
import { GridTexture } from './helpers/GridTexture.js';

const gridTex = new GridTexture(512, 512, 32);
const webglTex = gridTex.uploadToWebGL(gl);

// Later in render loop:
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, webglTex);
```

---

## Scene Updates in main.js

### Building Materials (Week 1 → Week 2)
Previously: Single ambient + emissive per building.

Now: Enhanced with multi-light contributions.
```javascript
// Per building (in loop)
const material = {
  ambient: TRON_CYAN,
  diffuse: TRON_CYAN,
  specular: [1.0, 1.0, 1.0],  // White specular
  shininess: 64.0,
  emissive: 0.3
};
```

### Ground Material
```javascript
const groundMaterial = {
  ambient: [0.05, 0.05, 0.07],     // Dark grey
  diffuse: [0.1, 0.1, 0.15],       // Slightly blue-tinted
  specular: [0.2, 0.3, 0.4],       // Subtle blue shine
  shininess: 16.0,
  emissive: 0.0
};
```

### Lighting in main.js (Week 2 specific)

12 buildings now (not 11 — update from Week 1 docs):
```javascript
const BUILDINGS = [
  [-8,  -8,  2, 6,  2],
  [-8,   0,  2, 7,  2],
  [-8,   8,  2, 10, 2],
  // ... more buildings ...
];
```

4-light setup:
```javascript
const LIGHTS = [
  { pos: [10, 8, 10],    color: [0.0, 1.0, 0.85] },   // Cyan
  { pos: [-12, 7, 12],   color: [0.1, 0.4, 1.0] },    // Blue
  { pos: [0, 6, -15],    color: [0.0, 0.9, 0.5] },    // Teal
  { pos: [-15, 5, -10],  color: [0.2, 0.8, 1.0] }     // Light blue
];
```

---

## Shaders (Week 1 → Week 2)

### Vertex Shader — No changes
Still computes world position, normals, and texture coordinates.

### Fragment Shader — Major expansion

**Old (Week 1):**
- Single light loop

**New (Week 2):**
- `#define NUM_LIGHTS 4` — Compile-time constant
- Uniform array: `uLightPos[NUM_LIGHTS]`, `uLightColor[NUM_LIGHTS]`
- Loop unrolling: `for (int i = 0; i < NUM_LIGHTS; i++)`
- Per-light attenuation calculation
- Accumulation of diffuse + specular from all lights

**New uniforms:**
```glsl
#define NUM_LIGHTS 4

// Arrays uploaded as uLightPos[0], uLightPos[1], etc.
uniform vec3 uLightPos[NUM_LIGHTS];
uniform vec3 uLightColor[NUM_LIGHTS];
uniform float uLightConstant;
uniform float uLightLinear;
uniform float uLightQuadratic;
```

---

## Performance & Visuals

### Grid Texture
- **Mipmaps:** Reduces aliasing at distance; GPU auto-selects LOD
- **REPEAT wrap:** Allows single 512×512 texture to cover large ground plane
- **Procedural generation:** Done once at startup, minimal memory overhead

### Multiple Lights
- **4 lights:** Fragment shader unrolls to 4 iterations (no dynamic branching)
- **Attenuation:** Prevents lights from affecting distant pixels excessively
- **Color blending:** Cyan + blue + green + teal mix creates vibrant neon atmosphere

### Visual Quality
- **Ground plane:** Grid pattern now visible and interactive with lighting
- **Building surfaces:** Multiple light contributions create depth and color variation
- **Neon glow:** Emissive component now blends with multi-light diffuse/specular

---

## Extended Features (Future Ideas)

### Add a 5th light
```javascript
// Add to LIGHTS array
{ pos: [0, 10, 0], color: [1.0, 0.0, 1.0] }  // Magenta overhead

// Update shader: #define NUM_LIGHTS 5
```

### Animated lights
```javascript
// In render loop:
const t = Date.now() * 0.001;
LIGHTS[0].pos[0] = 10 + Math.sin(t) * 5;
LIGHTS[0].pos[2] = 10 + Math.cos(t) * 5;

// Re-upload each frame:
u3f(gl, prog, `uLightPos[0]`, ...);
```

### Texture scrolling for animation
```javascript
const scrollU = (Date.now() * 0.01) % 1.0;
uTexScale = 8.0 + 2.0 * Math.sin(scrollU * Math.PI * 2);
```

### Soft shadows from grid
Post-process or shadow maps (deferred rendering path).

---

## File Summary (Week 2 Updates)

| File | Changes | Purpose |
|------|---------|---------|
| `main.js` | +LIGHTS array, loop over 4 lights, upload all uniforms | Scene setup & multi-light management |
| `helpers/GridTexture.js` | **NEW** | Procedural grid texture generation |
| `fragment.glsl` | +NUM_LIGHTS define, +light arrays, +loop | Multi-light Phong accumulation |
| `vertex.glsl` | None | Still unchanged |
| `helpers/Math.js` | None | Still unchanged |
| `helpers/Camera.js` | None | Still unchanged |
| `helpers/Geometry.js` | None | Still unchanged |
| `helpers/ShaderUtils.js` | None | Still unchanged |
| `helpers/WebGLUtils.js` | None | Still unchanged |
| `index.html` | None | Still unchanged |

**Additions: ~80 LOC (GridTexture.js) + ~50 LOC shader updates**

---

## Summary

Week 2 transforms the scene from a single-light utility into a full multi-light neon environment with textured ground. The grid texture adds visual grounding, while 4 separate lights create a vibrant, dimensionally complex lighting space. The modular structure allows easy addition of more lights or textures in future weeks.

