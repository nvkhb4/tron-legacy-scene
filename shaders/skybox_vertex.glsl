#version 300 es
precision mediump float;

in vec3 aPosition;
out vec3 vTexCoord;

uniform mat4 uProjection;
uniform mat4 uView;

void main() {
  vTexCoord = aPosition;
  // Remove translation from view matrix — skybox stays fixed
  mat4 viewNoTranslation = mat4(mat3(uView));
  vec4 pos = uProjection * viewNoTranslation * vec4(aPosition, 1.0);
  // Set z = w so skybox always renders at max depth
  gl_Position = pos.xyww;
}