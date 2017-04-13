precision highp float;

struct PointLight {
  vec3 position;
  vec3 color;
  float distance;
};

uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
uniform mat4 invMatrix;

varying vec4 vPosition;
varying vec4 vColor;

void main() {

    vec3 dx = dFdx(vPosition.xyz);
    vec3 dy = dFdy(vPosition.xyz);
    vec3 fnormal = normalize(cross(normalize(dx), normalize(dy)));

    vec3 lightPos = pointLights[0].position;
    vec3 lightDirection = normalize( vPosition.xyz - lightPos );

    vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.0)).xyz;
    float diffuse  = clamp(dot(fnormal, invLight), 0.8, 1.0);

    gl_FragColor = vColor * vec4(vec3(diffuse), 1.0);

}
