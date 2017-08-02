precision highp float;

//struct PointLight {
//  vec3 position;
//  vec3 color;
//  float distance;
//};
//
//uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
//uniform mat4 invMatrix;
uniform sampler2D textureMat;

varying mat4 vModelViewMatrix;
varying vec4 vPosition;
varying vec3 vNormal;
//varying vec4 vColor;
varying float gain;

void main() {

//    vec3 dx = dFdx(vPosition.xyz);
//    vec3 dy = dFdy(vPosition.xyz);
//    vec3 fnormal = normalize(cross(normalize(dx), normalize(dy)));

//    vec3 lightPos = pointLights[0].position;
//    vec3 lightDirection = normalize( vPosition.xyz - lightPos );

//    vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.0)).xyz;
//    float diffuse  = clamp(dot(fnormal, invLight), 0.8, 1.0);

//    gl_FragColor = vColor * vec4(vec3(diffuse), 1.0);

    vec3 e = normalize( vec3( vModelViewMatrix * vPosition ) );
    vec3 n = normalize( vNormal );
    vec3 r = reflect( e, n );
    float m = 2. * sqrt(
      pow( r.x, 2. ) +
      pow( r.y, 2. ) +
      pow( r.z + 1., 2. )
    );
    vec2 vN = r.xy / m + .5;
    vec3 base = texture2D( textureMat, vN ).rgb * vec3( 2.4,1.82,1.1);

//    gl_FragColor =  vec4(vNormal, 1.0);
    gl_FragColor =  vec4(base, 1.0);

}
