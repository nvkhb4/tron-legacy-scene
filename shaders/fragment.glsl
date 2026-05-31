#version 300 es
precision mediump float;

in vec3 vFragPos;
in vec3 vNormal;
in vec2 vTexCoord;

uniform vec3 uCameraPos;

// Material
uniform vec3  uAmbientColor;
uniform vec3  uDiffuseColor;
uniform vec3  uSpecularColor;
uniform float uShininess;
uniform float uEmissiveStrength;

// Texture
uniform sampler2D uDiffuseTex;
uniform bool      uUseTexture;
uniform float     uTexScale;

//fog
uniform vec3  uFogColor;
uniform float uFogDensity;

// Multiple point lights
#define NUM_LIGHTS 4

uniform vec3  uLightPos[NUM_LIGHTS];
uniform vec3  uLightColor[NUM_LIGHTS];
uniform float uLightConstant;
uniform float uLightLinear;
uniform float uLightQuadratic;

out vec4 fragColor;

vec3 calcPointLight(vec3 lightPos, vec3 lightColor, vec3 norm, vec3 viewDir, vec3 diffuseColor, vec3 specColor) {
  vec3  lightDir    = normalize(lightPos - vFragPos);
  vec3  halfDir     = normalize(lightDir + viewDir);
  float dist        = length(lightPos - vFragPos);
  float attenuation = 1.0 / (uLightConstant + uLightLinear * dist + uLightQuadratic * dist * dist);

  float diff    = max(dot(norm, lightDir), 0.0);
  vec3  diffuse = diff * diffuseColor * lightColor * attenuation;

  float spec    = pow(max(dot(norm, halfDir), 0.0), uShininess);
  vec3  specular = spec * specColor * lightColor * attenuation;

  return diffuse + specular;
}

void main() {
  vec3 norm    = normalize(vNormal);
  vec3 viewDir = normalize(uCameraPos - vFragPos);

  vec3 baseDiffuse = uDiffuseColor;
  vec3 baseAmbient = uAmbientColor;
  if (uUseTexture) {
    vec3 texColor = texture(uDiffuseTex, vTexCoord * uTexScale).rgb;
    baseDiffuse   = texColor * vec3(0.6, 1.0, 0.9);
    baseAmbient   = texColor * 0.4;
  }

  // Weak global ambient so nothing is pure black
  vec3 result = baseAmbient * 0.03;

  // Sum all light contributions
  for (int i = 0; i < NUM_LIGHTS; i++) {
    result += calcPointLight(uLightPos[i], uLightColor[i], norm, viewDir, baseDiffuse, uSpecularColor);
  }

  // Emissive
  result += uAmbientColor * uEmissiveStrength;

  // Exponential fog
  float dist    = length(uCameraPos - vFragPos);
  float fogFact = exp(-uFogDensity * dist);
  fogFact       = clamp(fogFact, 0.0, 1.0);
  vec3 finalCol = mix(uFogColor, result, fogFact);

  fragColor = vec4(finalCol, 1.0);
}