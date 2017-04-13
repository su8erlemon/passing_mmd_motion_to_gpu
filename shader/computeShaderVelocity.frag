// For PI declaration:
#include <common>

uniform float time;
uniform float amount;

void main() {

    vec2 uv = gl_FragCoord.xy / resolution.xy;

    float idParticle = uv.y * resolution.x + uv.x;

    vec4 tmpVel = texture2D( textureVelocity, uv );
    vec4 tmpPos = texture2D( texturePosition, uv );
    vec4 tmpAcc = texture2D( textureAcceleration, uv );

    vec3 vel = vec3(tmpVel.xyz);

    tmpPos.y<=0.0?(vel = vec3(vel.x*0.4,abs(vel.y)*0.4,vel.z*0.4)):vec3(0.0);
    (tmpPos.y<=0.001)?tmpVel.w += 1.0:tmpVel.w = 0.;

    vel += tmpAcc.xyz*(amount==0.?vec3(0.0,1.0,0.0):vec3(1.0,1.0,1.0));

    gl_FragColor = vec4( vel.xyz, tmpVel.w );
}