precision highp float;

uniform mat4 invMatrix;

varying vec4 vPosition;


uniform samplerCube envMap;
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

}
