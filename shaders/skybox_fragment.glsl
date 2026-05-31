#version 300 es
precision mediump float;

in vec3 vTexCoord;
uniform samplerCube uSkybox;

out vec4 fragColor;

void main() {
  fragColor = texture(uSkybox, vTexCoord);
}