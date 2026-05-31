#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform float uTime;

out vec4 fragColor;

// Simple hash function
float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = vTexCoord;
  vec3 color = vec3(0.0, 0.01, 0.02); // near-black base

  // Layer 1 — dense small stars
  vec2 grid1 = floor(uv * 200.0);
  float star1 = hash(grid1);
  if (star1 > 0.97) {
    vec2 local = fract(uv * 200.0) - 0.5;
    float dist = length(local);
    float glow = smoothstep(0.3, 0.0, dist);
    float twinkle = 0.7 + 0.3 * sin(uTime * 2.0 + star1 * 100.0);
    color += vec3(0.6, 0.9, 1.0) * glow * twinkle * star1;
  }

  // Layer 2 — sparser brighter stars
  vec2 grid2 = floor(uv * 80.0);
  float star2 = hash(grid2 + vec2(43.2, 75.1));
  if (star2 > 0.96) {
    vec2 local = fract(uv * 80.0) - 0.5;
    float dist = length(local);
    float glow = smoothstep(0.4, 0.0, dist);
    float twinkle = 0.6 + 0.4 * sin(uTime * 1.3 + star2 * 200.0);
    color += vec3(0.4, 0.7, 1.0) * glow * twinkle * 1.5;
  }

  // Layer 3 — rare bright cyan stars (very Tron)
  vec2 grid3 = floor(uv * 30.0);
  float star3 = hash(grid3 + vec2(12.9, 91.3));
  if (star3 > 0.98) {
    vec2 local = fract(uv * 30.0) - 0.5;
    float dist = length(local);
    float glow = smoothstep(0.5, 0.0, dist);
    color += vec3(0.0, 1.0, 0.85) * glow * 2.0;
  }

  fragColor = vec4(color, 1.0);
}