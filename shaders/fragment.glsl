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

// NEW — texture toggle
uniform sampler2D uDiffuseTex;
uniform bool      uUseTexture;
uniform float     uTexScale;    // how many times to tile the grid

// Point light
uniform vec3  uLightPos;
uniform vec3  uLightColor;
uniform float uLightConstant;
uniform float uLightLinear;
uniform float uLightQuadratic;

out vec4 fragColor;

void main() {
  vec3 norm     = normalize(vNormal);
  vec3 lightDir = normalize(uLightPos - vFragPos);
  vec3 viewDir  = normalize(uCameraPos - vFragPos);
  vec3 halfDir  = normalize(lightDir + viewDir);

  float dist        = length(uLightPos - vFragPos);
  float attenuation = 1.0 / (uLightConstant + uLightLinear * dist + uLightQuadratic * dist * dist);

  // Sample texture or fall back to uDiffuseColor
  vec3 baseDiffuse = uDiffuseColor;
  vec3 baseAmbient = uAmbientColor;
  if (uUseTexture) {
    vec3 texColor = texture(uDiffuseTex, vTexCoord * uTexScale).rgb;
    baseDiffuse   = texColor;
    baseAmbient   = texColor * 0.4;  // ambient tinted by texture
  }

  vec3 ambient  = baseAmbient * uLightColor * 0.05;
  float diff    = max(dot(norm, lightDir), 0.0);
  vec3 diffuse  = diff * baseDiffuse * uLightColor * attenuation;
  float spec    = pow(max(dot(norm, halfDir), 0.0), uShininess);
  vec3 specular = spec * uSpecularColor * uLightColor * attenuation;

  vec3 emissive = uAmbientColor * uEmissiveStrength;

  vec3 result = ambient + diffuse + specular + emissive;
  fragColor   = vec4(result, 1.0);
}