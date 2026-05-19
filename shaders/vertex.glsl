#version 300 es
precision mediump float;

in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat3 uNormalMatrix;

out vec3 vFragPos;
out vec3 vNormal;
out vec2 vTexCoord;

void main() {
  vec4 worldPos = uModel * vec4(aPosition, 1.0);
  vFragPos    = worldPos.xyz;
  vNormal     = normalize(uNormalMatrix * aNormal);
  vTexCoord   = aTexCoord;
  gl_Position = uProjection * uView * worldPos;
}