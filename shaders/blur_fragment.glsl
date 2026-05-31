#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uImage;
uniform bool uHorizontal;

out vec4 fragColor;

// 9-tap Gaussian weights
float weight[5] = float[](0.227027, 0.194595, 0.121622, 0.054054, 0.016216);

void main() {
  vec2 texOffset = 1.0 / vec2(textureSize(uImage, 0));
  vec3 result = texture(uImage, vTexCoord).rgb * weight[0];

  if (uHorizontal) {
    for (int i = 1; i < 5; i++) {
      result += texture(uImage, vTexCoord + vec2(texOffset.x * float(i), 0.0)).rgb * weight[i];
      result += texture(uImage, vTexCoord - vec2(texOffset.x * float(i), 0.0)).rgb * weight[i];
    }
  } else {
    for (int i = 1; i < 5; i++) {
      result += texture(uImage, vTexCoord + vec2(0.0, texOffset.y * float(i))).rgb * weight[i];
      result += texture(uImage, vTexCoord - vec2(0.0, texOffset.y * float(i))).rgb * weight[i];
    }
  }
  fragColor = vec4(result, 1.0);
}