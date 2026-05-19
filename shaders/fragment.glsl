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
uniform float uEmissiveStrength;   // >0 for glowing neon edges

// Point light (one for now, expand later)
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

  // Attenuation
  float dist        = length(uLightPos - vFragPos);
  float attenuation = 1.0 / (uLightConstant + uLightLinear * dist + uLightQuadratic * dist * dist);

  // Phong components
  vec3 ambient  = uAmbientColor * uLightColor * 0.05;
  float diff    = max(dot(norm, lightDir), 0.0);
  vec3 diffuse  = diff * uDiffuseColor * uLightColor * attenuation;
  float spec    = pow(max(dot(norm, halfDir), 0.0), uShininess);
  vec3 specular = spec * uSpecularColor * uLightColor * attenuation;

  // Emissive — neon glow surfaces emit their own color
  vec3 emissive = uAmbientColor * uEmissiveStrength;

  vec3 result = ambient + diffuse + specular + emissive;
  fragColor   = vec4(result, 1.0);
}
