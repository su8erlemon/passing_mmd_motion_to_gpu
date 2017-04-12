precision highp float;

//struct PointLight {
//  vec3 position;
//  vec3 color;
//  float distance;
//};

//uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
uniform mat4 invMatrix;

varying vec4 vPosition;
//varying vec4 vColor;
//varying vec2 vUv;



uniform samplerCube envMap;
//varying vec3 vReflect;
varying float vReflectionFactor;

varying vec4 vWorldPosition;
varying mat3 vModelMatrix;
varying vec3 vCameraPosition;



void main() {

    //vReflect;
    vReflectionFactor;

    vec3 dx = dFdx(vPosition.xyz);
    vec3 dy = dFdy(vPosition.xyz);
    vec3 fnormal = normalize(cross(normalize(dx), normalize(dy)));

    vec3 worldNormal = normalize( vModelMatrix * fnormal );
    vec3 I = vWorldPosition.xyz - vCameraPosition;

    vec3 vReflect = reflect( I, worldNormal );


    vec4 envColor = textureCube( envMap, vec3( -vReflect.x, vReflect.yz ) );
    gl_FragColor = vec4(mix(vec3(1.,1.,0.), envColor.xyz, vec3(clamp( vReflectionFactor, 0.0, 0.95 ))), 1.0);


  /*
    vec3 dx = dFdx(vPosition.xyz);
    vec3 dy = dFdy(vPosition.xyz);
    vec3 fnormal = normalize(cross(normalize(dx), normalize(dy)));

    vec3 lightPos = pointLights[0].position;
    vec3 lightDirection = normalize( vPosition - lightPos );

    vec3 invLight = normalize(invMatrix * vec4(lightDirection, 0.0)).xyz;
    float diffuse  = clamp(dot(fnormal, invLight), .5, 1.0);

    vUv;
    vColor;
    vPosition;

//    gl_FragColor = vColor;
    gl_FragColor = vColor * vec4(vec3(diffuse), 1.0);
*/
}
