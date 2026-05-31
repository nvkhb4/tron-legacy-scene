#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomStrength;

out vec4 fragColor;

void main() {
  vec3 scene = texture(uScene, vTexCoord).rgb;
  vec3 bloom = texture(uBloom, vTexCoord).rgb;
  fragColor  = vec4(scene + bloom * uBloomStrength, 1.0);
}