# Tron Legacy — WebGL2 Scene

A real-time 3D interactive scene inspired by the digital world of *Tron: Legacy* (2010), built entirely from scratch using WebGL2 and vanilla JavaScript with no external rendering libraries.

---

## Overview

This project implements a flythrough of a cyberpunk city corridor rendered in real-time. The scene features neon-lit buildings, a glowing grid ground plane, a procedural starfield, a floating Tron identity disc, and a full post-processing bloom pipeline. All rendering is done in pure WebGL2 with custom GLSL shaders.

---

## How to Run

1. Clone or download the project
2. Serve with a local server (e.g. VS Code Live Server or `python -m http.server`)
3. Open `src/index.html` in your browser
4. Click canvas to enable mouse look

**Controls:**
- `W / S` — move forward / back
- `A / D` — strafe left / right
- `Mouse drag` — look around

---

## Project Structure

```
tron_legacy/
├── src/
│   ├── index.html
│   ├── main.js
│   └── helpers/
│       ├── Math.js
│       ├── Camera.js
│       ├── Geometry.js
│       ├── ShaderUtils.js
│       ├── WebGLUtils.js
│       ├── GridTexture.js
│       ├── TextureLoader.js
│       ├── WindowTexture.js
│       ├── CubeMap.js
│       ├── Bloom.js
│       └── OBJLoader.js
├── shaders/
│   ├── vertex.glsl
│   ├── fragment.glsl
│   ├── skybox_vertex.glsl
│   ├── skybox_fragment.glsl
│   ├── starfield_vertex.glsl
│   ├── starfield_fragment.glsl
│   ├── post_vertex.glsl
│   ├── bright_extract_fragment.glsl
│   ├── blur_fragment.glsl
│   └── composite_fragment.glsl
├── textures/
├── assets/
└── docs/
```

---

## Techniques Implemented

### Baseline

**Phong Lighting Model** — per-fragment ambient, diffuse, and specular components with an additional emissive term for neon self-illumination on building surfaces.

**Texture Mapping** — diffuse maps sampled in the fragment shader with configurable tiling via `uTexScale`. Applied to the ground plane, buildings, and road surface.

**Multiple Light Types** — four colored point lights distributed along the corridor, each with quadratic distance attenuation. Contributions summed in a loop over `uLightPos[4]` / `uLightColor[4]` uniform arrays.

**GLSL Shader Pipeline** — WebGL2 with `#version 300 es`. Modular shader loading via async fetch and runtime compilation.

**Transformations & Normals** — per-object model matrices composed from translation and scale. Normal matrix extracted from upper-left 3×3 of model matrix for correct lighting under non-uniform transforms.

---

### Advanced Techniques

**Bloom (Effort 4/5)** — multi-pass post-processing pipeline. Scene rendered to offscreen framebuffer, bright regions extracted via luminance threshold, Gaussian blur applied over 15 ping-pong passes, additively composited onto original scene.

**Exponential Fog (Effort 2/5)** — per-fragment depth fog computed from camera distance using `exp(-density * dist)`, blended toward a dark teal background color. Makes distant buildings fade naturally.

**Environment Mapping / Skybox (Effort 3/5)** — cube map loaded from 6 face images, rendered as a fixed background skybox using a stripped view matrix (translation removed). Stars rendered as a procedural overlay.

**Combined Effort Score: 9/10 ✅**

---

### Additional Features

- **Procedural grid texture** — generated via Canvas 2D API with glowing cyan lines and shadow blur, uploaded to WebGL with mipmapping and REPEAT wrapping
- **Procedural window textures** — randomly lit/dark windows generated per building using a seeded hash function, three variants for visual variety
- **Procedural starfield** — three-layer star system with per-star twinkle animation driven by `uTime`, rendered as a fullscreen quad
- **Neon building edge lines** — thin emissive geometry outlining building corners and rooftops, heavily bloomed for the Tron light-line aesthetic
- **OBJ model loading** — custom parser supporting positions, normals, UVs, and fan triangulation with Uint32 index support for large meshes
- **Fly camera** — smooth WASD + mouse look with pointer lock, pitch clamping, and ground collision

---

## External Assets

| Asset | Source | License |
|---|---|---|
| Asphalt Track diffuse texture | [Poly Haven](https://polyhaven.com/a/asphalt_track) | CC0 |
| Metal Plate 02 diffuse texture | [Poly Haven](https://polyhaven.com/a/metal_plate_02) | CC0 |
| Tron Identity Disc 3D model | [Sketchfab — Medeixo](https://sketchfab.com/3d-models/tron-disk-01775a4113c745d29bf284c9bf166215) | See model page |

All Poly Haven assets are released under CC0 and may be used freely without attribution. Attribution provided regardless.

---

## Implementation Notes

- No external rendering libraries — pure WebGL2 and vanilla JS
- All building and ground geometry is procedurally generated
- Window and grid textures are generated at runtime via Canvas 2D, no image files required
- Bloom pipeline uses framebuffer ping-pong for multi-pass Gaussian blur

---

## Known Issues

- Skybox cube map loads correctly but renders black — under investigation
- Building edge neon lines have positioning inconsistencies depending on building scale

---

*Course: Computer Graphics — Spring 2026*  
*Inspired by Tron: Legacy (2010), directed by Joseph Kosinski, Walt Disney Pictures*