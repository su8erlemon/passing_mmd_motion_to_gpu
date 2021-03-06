#include <common>

uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
uniform sampler2D textureAcceleration;
uniform float cameraConstant;
uniform float density;

uniform float soundCloudLow;
uniform float soundCloudHigh;


varying vec4 vPosition;

uniform float radius;


uniform sampler2D texture1;
uniform sampler2D soundCloudTexture;

attribute float bodyIndex;
attribute vec3 bodyRotation;

const float frag = 1.0 / 128.0;
const float texShift = 0.5 * frag;

varying float vReflectionFactor;
varying vec4 vWorldPosition;
varying mat3 vModelMatrix;
varying vec3 vCameraPosition;


float magSq(vec3 vec) {
  return (vec.x*vec.x + vec.y*vec.y + vec.z*vec.z);
}

vec3 limit(vec3 vec, float max) {
  if (magSq(vec) > max*max) {
    vec = normalize(vec);
    vec *= max;
  }
  return vec;
}

float rand2(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {

    vec4 velTemp = texture2D( textureVelocity, uv );
    vec4 tmpPos = texture2D( texturePosition, uv );

    float index = tmpPos.w*50.0;//rand(tmpPos.xy)*12200.;
    float pu = fract(index * frag + texShift);
    float pv = floor(index * frag) * frag + texShift;
    vec3 tmpDan = texture2D( texture1, vec2(pu, pv)).rgb * 2.0 - 1.0;

    vec3 soundCloud = texture2D( soundCloudTexture, vec2(pu, pv)).rgb*2.0;
    float power = length(limit(0.5+soundCloud,2.0)) * soundCloudLow;


    // position is box's position. it has 6 faces
    vec3 newPosition = position;
//
    newPosition = mat3( modelMatrix ) * newPosition;
//
//    // rotatoin
    float aa = rand2(tmpPos.ww);
    velTemp = vec4(aa,aa*-power,aa*power*2.0,0.0);
    velTemp.z *= -1.;
    float xz = length( velTemp.xz );
    float xyz = 1.;
    float x = sqrt( 1. - velTemp.y * velTemp.y );
    float cosry = velTemp.x / xz * (1.0+aa);
    float sinry = velTemp.z / xz;
    float cosrz = x / xyz;
    float sinrz = velTemp.y / xyz;
    mat3 maty =  mat3(
      cosry, 0, -sinry,
      0    , 1.0, 0  ,
      sinry, 0, cosry
    );
    mat3 matz =  mat3(
      cosrz , sinrz, 0,
      -sinrz, cosrz, 0,
      0     , 0    , 1.0
    );
    mat3 scale =  mat3(
      power , 0, 0,
      0, power, 0,
      0     , 0  , power
    );

    newPosition = scale * maty * matz  * newPosition;


    power *= 0.01;
    tmpDan.x += rand(tmpPos.yx)*power - power*.5;
    tmpDan.y += rand(tmpPos.xz)*power - power*.5;
    tmpDan.z += rand(tmpPos.xz)*power - power*.5;


    newPosition += tmpDan;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );

    vPosition = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );;



    vec4 mvPosition = modelViewMatrix * vec4( vPosition.xyz, 1.0 );
    vec4 worldPosition = modelMatrix * vec4( vPosition.xyz, 1.0 );
    vWorldPosition = worldPosition;
    vModelMatrix = mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz );

    vCameraPosition = cameraPosition;

    vReflectionFactor = 1.0;


}