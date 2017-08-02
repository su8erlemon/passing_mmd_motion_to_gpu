#include <common>

uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
uniform sampler2D textureAcceleration;
uniform float cameraConstant;
uniform float density;

varying vec4 vPosition;
varying vec4 vColor;

uniform float radius;
uniform float amount;
varying mat4 vModelViewMatrix;
varying vec3 vNormal;
varying float gain;

void main() {

    vec4 velTemp = texture2D( textureVelocity, uv );
    vec4 accTemp = texture2D( textureAcceleration, uv );
    vec4 posTemp = texture2D( texturePosition, uv );

    // pos is the position of each box
    vec3 pos = posTemp.xyz;

    // position is box's position. it has 6 faces
    vec3 newPosition = position * amount;

    newPosition = mat3( modelMatrix ) * newPosition;

    // rotatoin
    velTemp = posTemp;
    velTemp.z *= -1.;
    float xz = length( velTemp.xz );
    float xyz = 1.;
    float x = sqrt( 1. - velTemp.y * velTemp.y );
    float cosry = velTemp.x / xz;
    float sinry = velTemp.z / xz;
    float cosrz = x / xyz;
    float sinrz = velTemp.y / xyz;
    mat3 maty =  mat3(
      cosry, 0, -sinry,
      0    , 1, 0     ,
      sinry, 0, cosry
    );
    mat3 matz =  mat3(
      cosrz , sinrz, 0,
      -sinrz, cosrz, 0,
      0     , 0    , 1
    );

    newPosition = maty * matz * newPosition;

    newPosition += pos;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );


    vModelViewMatrix = modelViewMatrix;

    vPosition = gl_Position;
    vNormal = normalMatrix * normal;

//    gain = abs(length(velTemp.xyz));

//    float per = accTemp.w * 0.03;
    //vColor = vec4( 248.0/255.0, 240.0/255.0, 42.0/255.0, 1.0 );
//    vColor = vec4( gl_Position.zxy, 1.0 ) * (1.0-per) +
//            //vec4( 247.0/255.0, 240.0/255.0, 92.0/255.0, 1.0 ) * (1.0-per) +
////                 vec4( 52.0/255.0, 38.0/255.0, 91.0/255.0, 1.0 ) * (per);
//                vec4( 240.0/255.0, 240.0/255.0, 35.0/255.0, 1.0 ) * (per);


}