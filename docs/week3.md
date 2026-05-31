# TRON Legacy — Week 3 Documentation

## What Was Added This Week

This week covered all remaining advanced techniques, external asset integration, scene polish, and visual enhancements:

- **Exponential fog** in the fragment shader
- **Bloom post-processing** (multi-pass framebuffer pipeline)
- **Skybox / environment mapping** (cube map — partially working)
- **Procedural starfield** (three-layer animated shader)
- **External texture assets** (metal plate, asphalt)
- **OBJ model loading** (Tron identity disc)
- **Procedural window textures** on buildings
- **Neon edge lines** on buildings
- **Road with asphalt texture**
- **Building layout expansion** (32 buildings, varied heights)

---

## New Files This Week

```
src/helpers/
    Bloom.js              # FBO setup, ping-pong blur, fullscreen quad
    CubeMap.js            # Loads 6 cube face images into WebGL cube map
    TextureLoader.js      # Loads image files as WebGL textures
    WindowTexture.js      # Procedural building window texture generator
    OBJLoader.js          # Custom OBJ parser with Uint32 index support

shaders/
    post_vertex.glsl               # Shared fullscreen quad vertex shader
    bright_extract_fragment.glsl   # Luminance threshold — bloom pass 1
    blur_fragment.glsl             # 9-tap Gaussian blur — bloom pass 2
    composite_fragment.glsl        # Additive blend — bloom pass 3
    skybox_vertex.glsl             # Skybox vertex (strips translation)
    skybox_fragment.glsl           # Skybox fragment (samples cube map)
    starfield_vertex.glsl          # Fullscreen quad at z=0.999
    starfield_fragment.glsl        # Procedural 3-layer star field
```

---

## Fog

**File:** `shaders/fragment.glsl`

Added exponential fog at the end of `main()`. Blends fragment color toward a near-black teal background based on distance from camera.

```glsl
uniform vec3  uFogColor;
uniform float uFogDensity;

float dist    = length(uCameraPos - vFragPos);
float fogFact = exp(-uFogDensity * dist);
fogFact       = clamp(fogFact, 0.0, 1.0);
vec3 finalCol = mix(uFogColor, result, fogFact);
fragColor     = vec4(finalCol, 1.0);
```

**Uniforms set in `main.js`:**
```javascript
u3f(gl, prog, 'uFogColor',   0.0, 0.02, 0.03);
u1f(gl, prog, 'uFogDensity', 0.015);
```

**Effect:** Distant buildings and background geometry fade into the dark background naturally, adding depth and atmosphere consistent with the Tron digital world aesthetic.

---

## Bloom

Three-pass post-processing pipeline implemented across `Bloom.js` and three new fragment shaders.

### Architecture

```
Scene render → offscreen FBO
      ↓
Brightness extraction → pingFBO
      ↓
Gaussian blur (15 ping-pong passes) → pongFBO ↔ pingFBO
      ↓
Additive composite → screen
```

### `src/helpers/Bloom.js`

Creates three framebuffer objects:
- `scene` — full scene render target with depth renderbuffer
- `pingFBO` / `pongFBO` — blur ping-pong buffers

Also creates a fullscreen quad VAO reused across all post passes.

```javascript
export function createBloom(gl, width, height) { ... }
export function resizeBloom(gl, bloom, width, height) { ... }
```

### Pass 1 — Brightness Extraction (`bright_extract_fragment.glsl`)

Computes luminance per fragment and discards pixels below threshold:
```glsl
float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
if (brightness > uThreshold)
  fragColor = vec4(color, 1.0);
else
  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
```

Threshold set to `0.02` to catch neon emissive surfaces.

### Pass 2 — Gaussian Blur (`blur_fragment.glsl`)

9-tap Gaussian kernel applied alternately horizontal and vertical over 15 passes:
```glsl
float weight[5] = float[](0.227027, 0.194595, 0.121622, 0.054054, 0.016216);
```

### Pass 3 — Composite (`composite_fragment.glsl`)

Additively blends blurred bloom texture onto original scene:
```glsl
vec3 scene = texture(uScene, vTexCoord).rgb;
vec3 bloom = texture(uBloom, vTexCoord).rgb;
fragColor  = vec4(scene + bloom * uBloomStrength, 1.0);
```

Bloom strength set to `2.2`.

---

## Skybox / Environment Mapping

**Files:** `CubeMap.js`, `skybox_vertex.glsl`, `skybox_fragment.glsl`

### `src/helpers/CubeMap.js`

Loads 6 face images (`px.png`, `nx.png`, `py.png`, `ny.png`, `pz.png`, `nz.png`) from a base path and uploads to a WebGL cube map texture with `CLAMP_TO_EDGE` wrapping.

```javascript
export function loadCubeMap(gl, basePath) { ... }
```

### Skybox Vertex Shader

Removes translation from view matrix so skybox stays fixed as camera moves. Sets `z = w` so it always renders at maximum depth:
```glsl
mat4 viewNoTranslation = mat4(mat3(uView));
vec4 pos = uProjection * viewNoTranslation * vec4(aPosition, 1.0);
gl_Position = pos.xyww;
```

### Render Order

Skybox drawn first with `gl.depthMask(false)` so it never occludes scene geometry.

### Status

Cube map face images load successfully (confirmed via console). Skybox renders black — under investigation. Likely cause: cube map face orientation mismatch from HDRI-to-CubeMap converter.

---

## Procedural Starfield

**Files:** `starfield_vertex.glsl`, `starfield_fragment.glsl`

Rendered as a fullscreen quad at `z = 0.999` (just behind all geometry) with depth test disabled. Three layers of stars computed analytically using a hash function:

```glsl
float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
```

- **Layer 1** — dense small stars, threshold `> 0.97`
- **Layer 2** — sparser brighter stars, threshold `> 0.96`
- **Layer 3** — rare bright cyan stars, threshold `> 0.98`

Stars twinkle via `sin(uTime * speed + seed)` per star. Reuses `bloom.quadVAO` — no new geometry needed.

---

## External Texture Loading

**File:** `src/helpers/TextureLoader.js`

Loads image files asynchronously and uploads to WebGL with mipmapping:

```javascript
export function loadImageTexture(gl, url) {
  return new Promise((resolve, reject) => { ... });
}
```

Uses a 1×1 placeholder pixel while image loads so rendering is not blocked.

**Textures added:**
- `metal_plate_02_diff_4k.jpg` — applied to building faces with cyan tint
- `asphalt_track_diff_4k.jpg` — applied to road surface

---

## Procedural Window Textures

**File:** `src/helpers/WindowTexture.js`

Generates building window textures at runtime using Canvas 2D. Each texture has a 6×10 grid of windows, randomly lit based on a seed value:

- Bright cyan windows (`#00ffcc`) — ~20% probability
- Mid blue windows (`#1a6aff`) — ~20% probability
- Dim teal windows (`#005544`) — ~25% probability
- Dark windows (`#020d0d`) — ~35% probability

Three textures generated with seeds 1, 2, 3 and cycled across buildings so each has a unique pattern. With bloom enabled, lit windows emit a visible neon glow.

---

## OBJ Model Loading

**File:** `src/helpers/OBJLoader.js`

Custom OBJ parser supporting:
- Vertex positions (`v`)
- Vertex normals (`vn`)
- Texture coordinates (`vt`)
- Face definitions with fan triangulation for quads and n-gons
- Vertex deduplication via cache key `pi/ti/ni`
- `Uint32Array` indices for large meshes exceeding 65535 vertices

**Asset loaded:** Tron Identity Disc (`torn legacy disk v2-0.obj`)

Placed floating above the corridor center, rotating on Y axis via `elapsed * 0.8`. Drawn with `gl.UNSIGNED_INT` since the model exceeds Uint16 index range.

Also added `createMeshLarge` to `Geometry.js` to handle `Uint32Array` index buffers.

---

## Building Enhancements

### Neon Edge Lines

Thin emissive boxes drawn along vertical corners and horizontal top/bottom edges of each building. Set to high emissive strength (`0.8`) so bloom produces a strong cyan halo — the signature Tron light-line look.

12 edge pieces per building: 4 vertical corners + 4 top edges + 4 bottom edges.

### Window Textures

Each building face shows a unique procedural window pattern. `uTexScale` set to `bh / bw` to compensate for building aspect ratio so windows don't stretch.

### Varied Heights

Building array expanded to 32 buildings across 4 depth layers (main corridor, second corridor, far background, cross street) with deliberately varied heights — short `6-10`, medium `18-30`, tall `40-80` — to produce a proper city skyline silhouette.

---

## Road

A flat box (`buildBox(10, 0.05, 300)`) centered in the corridor with the asphalt texture tiled along its length. Two thin emissive strips run along the road edges as glowing lane markers.

---

## External Assets

| Asset | Source | License |
|---|---|---|
| Asphalt Track diffuse texture | [Poly Haven](https://polyhaven.com/a/asphalt_track) | CC0 |
| Metal Plate 02 diffuse texture | [Poly Haven](https://polyhaven.com/a/metal_plate_02) | CC0 |
| Tron Identity Disc OBJ | [Sketchfab — Medeixo](https://sketchfab.com/3d-models/tron-disk-01775a4113c745d29bf284c9bf166215) | See model page |
| HDRI — Kloppenheim 02 Pure Sky | [Poly Haven](https://polyhaven.com/a/kloppenheim_02_puresky) | CC0 |

---

## Render Loop Structure (Final)

```
1. Bind offscreen FBO (bloom.scene)
2. Draw skybox (skyProg, depthMask false)
3. Draw starfield (starProg, depth test disabled)
4. Draw ground plane (prog, grid texture)
5. Draw road (prog, asphalt texture)
6. Draw buildings (prog, window textures)
7. Draw building neon edges (prog, emissive)
8. Draw Tron disc (prog, UNSIGNED_INT indices)
9. Brightness extraction → pingFBO
10. Gaussian blur × 15 ping-pong passes
11. Composite bloom → screen (null framebuffer)
```

---

## Known Issues

- Skybox cube map renders black despite faces loading successfully
- Building edge lines have Y-axis positioning sensitivity depending on building scale
- Road glowing edge strips partially obscured by building geometry at corridor boundaries

---

*Course: Computer Graphics — Spring 2026*