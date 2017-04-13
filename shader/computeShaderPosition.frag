uniform float time;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

uniform sampler2D texture1;

const float frag = 1.0 / 128.0;
const float texShift = 0.5 * frag;

void main() {

  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec4 tmpPos = texture2D( texturePosition, uv );
  vec4 tmpVel = texture2D( textureVelocity, uv );
  vec4 tmpAcc = texture2D( textureAcceleration, uv );

  float idParticle = uv.y * resolution.x + uv.x;

  // getting skkinned mesh position
  float index = tmpPos.w;
  float pu = fract(index * frag + texShift);
  float pv = floor(index * frag) * frag + texShift;
  vec3 tmpDan = texture2D( texture1, vec2(pu, pv)).rgb * 2.0 - 1.0;


  vec4 pos = tmpPos;
  vec3 vel = tmpVel.xyz;

  pos.xyz += vel.xyz;


  (pos.y<=0.001)?(pos = vec4(pos.x, 0. ,pos.z, pos.w )):vec4(0.0);
  (tmpVel.w>10.)?(pos = vec4(tmpDan.x,tmpDan.y + rand(tmpDan.xy)*0.03,tmpDan.z, pos.w )):vec4(0.0);


  // pos.w is the index of the skkinned
  gl_FragColor = vec4( pos );

}