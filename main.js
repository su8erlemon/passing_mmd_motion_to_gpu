const threeApp = require('./lib/CreateThree');

const { camera, scene, renderer, controls } = threeApp();

const glsl = require('glslify');

let soundCloudTexture;
import {SoundCloud} from './lib/SoundCloud.js';
const soundCloud = new SoundCloud();
soundCloud.init("https://soundcloud.com/gradesofficial/king-chris-lake-remix",
    (menuElement, debugCanvas) => {

        document.getElementById("footer").appendChild( menuElement );

        soundCloudTexture = new THREE.DataTexture(soundCloud.getBytes(), 8, 8, THREE.RGBFormat );
        soundCloudTexture.needsUpdate = true;
        window.soundCloudTexture = soundCloudTexture;

        soundCloud.setPoint("low",32);
        soundCloud.setPoint("high",13);

        if( !soundCloud.getIsPlay())soundCloud.play();
        window.soundCloud = soundCloud;
    }
);

const mmdSaveToTextureFrag = glsl.file('./shader/mmdSaveToTexture.frag');
const mmdSaveToTextureVert = glsl.file('./shader/mmdSaveToTexture.vert');

const debugMMDFrag = glsl.file('./shader/debugMMD.frag');
const debugMMDVert = glsl.file('./shader/debugMMD.vert');

const particleFragmentShader = glsl.file('./shader/particleFragmentShader.frag');
const particleVertexShader = glsl.file('./shader/particleVertexShader.vert');

const bodyFragmentShader = glsl.file('./shader/bodyFragmentShader.frag');
const bodyVertexShader = glsl.file('./shader/bodyVertexShader.vert');

const computeShaderPosition     = glsl.file('./shader/computeShaderPosition.frag');
const computeShaderVelocity     = glsl.file('./shader/computeShaderVelocity.frag');
const computeShaderAcceleration = glsl.file('./shader/computeShaderAcceleration.frag');


//for debug
window.scene = scene;
window.THREE = THREE;


var light;

var isIdling=true;
var motionObj;
var playList = [];
var stopList = [];
window.playList = playList;
window.stopList = stopList;

var mesh;
var helper;
var clock = new THREE.Clock();

var WIDTH = 36*20;

var geometry;
var PARTICLES = WIDTH * WIDTH;

var gpuCompute;
var velocityVariable;
var positionVariable;
var accelerationVariable;

var positionUniforms;
var velocityUniforms;
var accelerationUniforms;

var particleUniforms;
var bodyUniforms;

var dtDance;


var gridHelper = new THREE.PolarGridHelper( 1, 1 );
scene.add( gridHelper );

// Create a different scene to hold our buffer objects
var bufferScene = new THREE.Scene();
// Create the texture that will store our result
var bufferTexture = new THREE.WebGLRenderTarget(
    128,
    128,
    {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter
    }
);
var bufferTexture2 = new THREE.WebGLRenderTarget(
    128,
    128,
    {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter
    }
);
var uniforms2;



var cameraLookAt = new THREE.Vector3(0,0.3,0);
var cameraLookAt2 = new THREE.Vector3(0,0.3,0);
var rl1 = 3.2,
    rl2 = 0;

init();


function init() {

    initComputeRenderer();
    initProtoplanets();

}

function initComputeRenderer() {

    gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, renderer );

    var dtPosition = gpuCompute.createTexture();
    var dtVelocity = gpuCompute.createTexture();
    var dtAcceleration = gpuCompute.createTexture();

    fillTextures( dtPosition, dtVelocity, dtAcceleration );

    velocityVariable     = gpuCompute.addVariable( "textureVelocity",     computeShaderVelocity,     dtVelocity     );
    positionVariable     = gpuCompute.addVariable( "texturePosition",     computeShaderPosition,     dtPosition     );
    accelerationVariable = gpuCompute.addVariable( "textureAcceleration", computeShaderAcceleration, dtAcceleration );

    gpuCompute.setVariableDependencies( velocityVariable,     [ positionVariable, velocityVariable, accelerationVariable ] );
    gpuCompute.setVariableDependencies( positionVariable,     [ positionVariable, velocityVariable, accelerationVariable ] );
    gpuCompute.setVariableDependencies( accelerationVariable, [ positionVariable, velocityVariable, accelerationVariable ] );

    positionUniforms     = positionVariable.material.uniforms;
    velocityUniforms     = velocityVariable.material.uniforms;
    accelerationUniforms = accelerationVariable.material.uniforms;

    positionVariable.material.uniforms.time = {
        value:0
    };

    velocityVariable.material.uniforms.time = {
        value:0
    };

    accelerationVariable.material.uniforms.time = {
        value:0
    };

    positionVariable.material.uniforms.texture1     = { type: "t", value: null };
    velocityVariable.material.uniforms.texture1     = { type: "t", value: null };
    velocityVariable.material.uniforms.amount   = { type: "f", value: null };
    accelerationVariable.material.uniforms.texture1 = { type: "t", value: null };
    accelerationVariable.material.uniforms.texture2 = { type: "t", value: null };

    gpuCompute.init();

}


function initProtoplanets() {



    //=========================================================================
    // Create light
    //=========================================================================
    light = new THREE.PointLight(0xffffff,1.0,100,100);
    light.position.set(0,0.8,-2);
    scene.add(light);

    var light2 = new THREE.DirectionalLight( 0xFFFFFF );
    scene.add( light2 );



    //=========================================================================
    // Make particle mesh
    //=========================================================================
    var particleGeometry = new THREE.BufferGeometry();
    var particlePositions = new Float32Array( PARTICLES * 3 );

    var ww = 0.002;
    var hh = 0.002;
    var zz = 0.002;

    var BOX_ARRAY = [
        0.0, -1.0,-1.0,
        0.0, 1.0, 0.0,
        0.866025, -1.0, 0.5,

        0.866025, -1.0, 0.5,
        0.0, 1.0, 0.0,
        -0.866025, -1.0, 0.5,

        -0.866025, -1.0, 0.5,
        0.0, 1.0, 0.0,
        0.0, -1.0,-1.0,

        0.0, -1.0,-1.0,
        0.866025, -1.0, 0.5,
        -0.866025, -1.0, 0.5,
    ];

    var randomSize;
    var randomSizeH;
    for ( var i = 0; i < PARTICLES * 3; i+= 3 * 3 * 4 ) {
        randomSize = 0.1 + Math.random()*2.0;
        randomSizeH = 0.1 + Math.random()*2.0;

        for( var k = 0; k < 3*3*12; k+=3 ){
            particlePositions[i + k + 0] = BOX_ARRAY[k+0]*ww*randomSize*randomSize*randomSize;
            particlePositions[i + k + 1] = BOX_ARRAY[k+1]*hh*randomSizeH*randomSize*randomSizeH;
            particlePositions[i + k + 2] = BOX_ARRAY[k+2]*zz*randomSizeH*randomSizeH*randomSizeH;
        }

    }

    var particleUVs = new Float32Array( PARTICLES * 2 );
    var p = 0;
    for ( var j = 0; j < WIDTH; j++ ) {
        for ( var i = 0; i < WIDTH; i++ ) {
            particleUVs[ p++ ] = i / ( WIDTH - 1 );
            particleUVs[ p++ ] = j / ( WIDTH - 1 );
        }
    }

    var particleIndexs = new Float32Array( PARTICLES );
    for ( var i = 0; i < PARTICLES ; i++ ) {
        particleIndexs[i] = i;
    }

    particleGeometry.addAttribute( 'position', new THREE.BufferAttribute( particlePositions, 3 ) );
    particleGeometry.addAttribute( 'uv',       new THREE.BufferAttribute( particleUVs, 2 ) );
    particleGeometry.addAttribute( 'index2',   new THREE.BufferAttribute( particleIndexs, 1 ) );

    particleUniforms = THREE.UniformsUtils.merge([
        THREE.UniformsLib['lights'],
        {
            texture1: { type: "t", value: null },
            texturePosition:     { value: null },
            textureVelocity:     { value: null },
            textureAcceleration: { value: null },
            amount:              { type: "f",  value: 0 }, // single float
            cameraConstant: { value: getCameraConstant( camera ) },
            invMatrix: { value: new THREE.Matrix4() },
        },
    ]);

    // // ShaderMaterial
    var particleMaterial = new THREE.ShaderMaterial( {
        uniforms:       particleUniforms,
        vertexShader:   particleVertexShader,
        fragmentShader: particleFragmentShader,
        side:           THREE.DoubleSide,
        vertexColors: THREE.VertexColors,
        transparent: true,
        lights: true,
    } );

    particleMaterial.extensions.derivatives = true;
    particleMaterial.extensions.drawBuffers = true;

    var particles = new THREE.Mesh( particleGeometry, particleMaterial );
    particles.matrixAutoUpdate = false;
    particles.updateMatrix();
    scene.add( particles );

    var m = new THREE.Matrix4();
    m.copy( particles.matrixWorld );
    m.multiply( camera.matrixWorldInverse );
    var i = new THREE.Matrix4().getInverse( m );
    particleMaterial.uniforms.invMatrix.value = i;





    //=========================================================================
    // Make body mesh
    //=========================================================================
    const BODY_NUM = 36*251;
    var bodyGeometry = new THREE.BufferGeometry();
    var bodyPositions = new Float32Array( BODY_NUM * 3 );

    var ww = 0.04;

    var BOX_ARRAY = [
        0.0, -1.0,-1.0,
        0.0, 1.0, 0.0,
        0.866025, -1.0, 0.5,

        0.866025, -1.0, 0.5,
        0.0, 1.0, 0.0,
        -0.866025, -1.0, 0.5,

        -0.866025, -1.0, 0.5,
        0.0, 1.0, 0.0,
        0.0, -1.0,-1.0,

        0.0, -1.0,-1.0,
        0.866025, -1.0, 0.5,
        -0.866025, -1.0, 0.5,
    ];

    for ( var i = 0; i < BODY_NUM * 3; i+= 3 * 3 * 4 ) {
        for( var k = 0; k < 3*3*12; k+=3 ){
            bodyPositions[i + k + 0] = BOX_ARRAY[k+0]*ww;
            bodyPositions[i + k + 1] = BOX_ARRAY[k+1]*ww;
            bodyPositions[i + k + 2] = BOX_ARRAY[k+2]*ww;
        }
    }

    var bodyUVs = new Float32Array( BODY_NUM * 2 );
    var p = 0;
    for ( var j = 0; j < WIDTH; j++ ) {
        for ( var i = 0; i < WIDTH; i++ ) {
            bodyUVs[ p++ ] = i / ( WIDTH - 1 );
            bodyUVs[ p++ ] = j / ( WIDTH - 1 );
        }
    }

    var bodyRotation = new Float32Array( BODY_NUM * 3 );
    for ( var i = 0; i < BODY_NUM * 3; i+= 3 ) {
        bodyRotation[i+0] = Math.random()*2.0-1.0;
        bodyRotation[i+1] = Math.random()*2.0-1.0;
        bodyRotation[i+2] = Math.random()*2.0-1.0;
    }

    var bodyIndex = new Float32Array( BODY_NUM );
    for ( var i = 0; i < BODY_NUM ; i++ ) {
        bodyIndex[i] = i;
    }

    bodyGeometry.addAttribute( 'position', new THREE.BufferAttribute( bodyPositions, 3 ) );
    bodyGeometry.addAttribute( 'uv', new THREE.BufferAttribute( bodyUVs, 2 ) );
    bodyGeometry.addAttribute( 'bodyRotation', new THREE.BufferAttribute( bodyRotation, 3 ) );
    bodyGeometry.addAttribute( 'bodyIndex', new THREE.BufferAttribute( bodyIndex, 1 ) );



    // Make cube texture
    var path = './imgs/';
    var urls = [
        path + "pz.png",
        path + "pz.png",
        path + "pz.png",
        path + "pz.png",
        path + "pz.png",
        path + "pz.png",
    ];
    var textureCube = THREE.ImageUtils.loadTextureCube( urls );


    bodyUniforms = Object.assign(
        THREE.UniformsLib['lights'],
        {
            texture1:            { type: "t", value: null },
            soundCloudTexture:   { type: "t", value: null },
            soundCloudHigh : { type: "f", value: 0 }, // single float
            soundCloudLow : { type: "f",  value: 0 }, // single float
            envMap: {
                type: "t",
                value: textureCube
            },
            texturePosition:     { value: null },
            textureVelocity:     { value: null },
            textureAcceleration: { value: null },
            cameraConstant: { value: getCameraConstant( camera ) },
            invMatrix: { value: new THREE.Matrix4() },
        }
    );

    var bodyMaterial = new THREE.ShaderMaterial( {
        uniforms:       bodyUniforms,
        vertexShader:   bodyVertexShader,
        fragmentShader: bodyFragmentShader,
        side:           THREE.DoubleSide,
        vertexColors: THREE.VertexColors,
        transparent: true,
        lights: true,
    });

    bodyMaterial.extensions.derivatives = true;
    bodyMaterial.extensions.drawBuffers = true;


    var bodyMarticles = new THREE.Mesh( bodyGeometry, bodyMaterial );
    bodyMarticles.matrixAutoUpdate = false;
    bodyMarticles.updateMatrix();
    scene.add( bodyMarticles );

    var m = new THREE.Matrix4();
    m.copy( bodyMarticles.matrixWorld );
    m.multiply( camera.matrixWorldInverse );
    var i = new THREE.Matrix4().getInverse( m );
    bodyMaterial.uniforms.invMatrix.value = i;









    //=========================================================================
    // Loading
    //=========================================================================

    var sum  = function(arr) {
        var sum = 0;
        arr.forEach(function(elm) {
            sum += elm;
        });
        return sum;
    };

    var count = 0;
    var totalPer = [];
    var loadingElement = document.getElementById("loadingNum");
    var onProgress = function ( xhr ) {
        if ( xhr.lengthComputable ) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            totalPer[count] = percentComplete;
            if( Math.round(percentComplete, 2) == 100 )count++;
            console.log(sum(totalPer)*1/8)
            loadingElement.innerHTML = "Loading " + parseInt(sum(totalPer)*1/8) + " %";
        }
    };

    var onError = function ( xhr ) {

    };




    //=========================================================================
    // Load MMD model
    //=========================================================================

    var modelFile = 'models/mmd/model.pmx';
    helper = new THREE.MMDHelper();

    var loader = new THREE.MMDLoader();
    loader.loadModel( modelFile, function ( mmdMesh ) {

        //console.log(mmdMesh)

        var indexs = new Float32Array( mmdMesh.geometry.attributes.position.count );
        for ( var i = 0; i < mmdMesh.geometry.attributes.position.count; i++ ) {
            indexs[i] = i;
        }
        mmdMesh.geometry.addAttribute( 'index2', new THREE.BufferAttribute( indexs, 1 ) );

        var array = [];
        for ( var i = 0, il = mmdMesh.material.materials.length; i < il; i ++ ) {
            var m = new THREE.ShaderMaterial({
                vertexShader:   mmdSaveToTextureVert,
                fragmentShader: mmdSaveToTextureFrag,
                skinning:true,
                wireframe:true,
            });
            array.push( m );
        }

        var shaderMaterials = new THREE.MultiMaterial( array );
        mmdMesh.material = shaderMaterials;
        window.mmdMesh = mmdMesh;

        mesh = mmdMesh;
        mesh.scale.set(0.4,0.4,0.4);
        mesh.position.x = -1.4;

        bufferScene.add( mesh );

        helper.add( mesh );


        //debug ==================================================
        // uniforms2 = {
        //     texture1: { type: "t", value: null }
        // };
        //
        // var shaderMaterial = new THREE.ShaderMaterial({
        //     uniforms:uniforms2,
        //     fragmentShader: debugMMDFrag,
        //     vertexShader:   debugMMDVert,
        //     transparent: true,
        // });
        //
        // // var mat22 = new THREE.MeshBasicMaterial( { color: 0xffaa00} );
        // // var mat33 = new THREE.MeshPhongMaterial( { color: 0xdddddd, specular: 0x009900, shininess: 30, shading: THREE.SmoothShading, });
        //
        // // var box1 = new THREE.Points(mmdMesh.geometry, shaderMaterial)
        // var box1 = new THREE.Mesh(mmdMesh.geometry, shaderMaterial)
        // // var box1 = new THREE.Line(mmdMesh.geometry, shaderMaterial)
        // scene.add(box1);
        //debug ==================================================




        //=========================================================================
        // Load dance motion data
        //=========================================================================

        var vmdFiles = [
            {name: 'dance1', file: 'models/mmd/vmds/dance.vmd'},
            {name: 'dance2', file: 'models/mmd/vmds/dance2.vmd'},
            {name: 'dance3', file: 'models/mmd/vmds/northern_soul_spin_combo.vmd'},
            {name: 'dance4', file: 'models/mmd/vmds/northern_soul_floor_combo.vmd'},
            {name: 'dance5', file: 'models/mmd/vmds/mma_kick.vmd'},
            {name: 'dance6', file: 'models/mmd/vmds/breakdance_freezes.vmd'},
            {name: 'dance7', file: 'models/mmd/vmds/breakdance_footwork_1.vmd'},
        ];

        var vmdIndex = 0;
        var loadVmd = function () {
            var vmdFile = vmdFiles[vmdIndex].file;
            loader.loadVmd(vmdFile, function (vmd) {
                loader.createAnimation(mmdMesh, vmd, vmdFiles[vmdIndex].name);
                vmdIndex++;
                if (vmdIndex < vmdFiles.length) {

                    //Load next data

                    loadVmd();

                } else {

                    //All data is loaded

                    helper.setAnimation(mesh);

                    mesh.mixer.stopAllAction();

                    if( window.soundCloud )window.soundCloud.play();

                    motionObj = {};
                    for (var i = 0; i < mesh.geometry.animations.length; ++i) {
                        var clip = mesh.geometry.animations[i];
                        var action = mesh.mixer.clipAction(clip);
                        motionObj[mesh.geometry.animations[i].name] = action;
                        action.repetitions = 'Infinity';
                    }
                    window.motionObj = motionObj;

                    playList.push( motionObj.dance1 );
                    motionObj.dance1.play();

                    stopList.push( motionObj.dance2 );
                    stopList.push( motionObj.dance3 );
                    stopList.push( motionObj.dance4 );
                    stopList.push( motionObj.dance5 );
                    stopList.push( motionObj.dance6 );
                    stopList.push( motionObj.dance7 );

                    window.mmdMesh.mixer.timeScale = 1.14814814815;


                    //=========================================================================
                    // add keypress event
                    //=========================================================================

                    var isOpening = true;
                    var typeAnyElement = document.getElementById("typeAnyKey");

                    $(document).bind("touchstart", changeAnimationHandler);
                    $(document).keypress(changeAnimationHandler);

                    function changeAnimationHandler(e) {

                        if( isOpening ){
                            isOpening = false;
                            $(".op").addClass("hide")
                            $(".info").addClass("show")
                        }

                        TweenMax.killTweensOf(typeAnyElement);
                        TweenMax.to( typeAnyElement, 0.0, {scale:1.5} );
                        TweenMax.to( typeAnyElement, 0.3, {scale:1.0} );

                        if( e.which ){
                            switch (e.which){
                                case 115:
                                    playAnimation("dance2")
                                    break;

                                case 100:
                                    playAnimation("dance3")
                                    break;

                                case 102:
                                    playAnimation("dance4")
                                    break;

                                case 103:
                                    playAnimation("dance5")
                                    break;

                                case 104:
                                    playAnimation("dance6")
                                    break;

                                case 106:
                                    playAnimation("dance7")
                                    break;

                                default:
                                    playAnimation("dance" + parseInt(Math.random()*6+2));
                                    break;
                            }
                        }else{
                            playAnimation("dance" + parseInt(Math.random()*6+2));
                        }
                    };


                    var _wpLoadingElement = document.getElementById("wp-loading");
                    var hh = $(window).height()/2;
                    TweenMax.to( _wpLoadingElement, 0.5, {delay:0.5, height:0, y:hh,/*height:0, y:hh,*/ ease:Expo.easeInOut} );

                    animate();

                }
            }, onProgress, onError);
        };
        loadVmd();

    }, onProgress, onError );



}

function fillTextures( texturePosition, textureVelocity, textureAcceleration ) {

    var posArray   = texturePosition.image.data;
    var velArray   = textureVelocity.image.data;
    var accArray   = textureAcceleration.image.data;


    var count = 0;
    for ( var k = 0, kl = posArray.length; k < kl; k += 4*3*12 ) {
        count++;

        var w = count;

        for( var k2 = 0; k2 < 4*3*12; k2 += 4 ){
            posArray[ k + k2 + 0 ] = 0;
            posArray[ k + k2 + 1 ] = 0;
            posArray[ k + k2 + 2 ] = 0;
            posArray[ k + k2 + 3 ] = w;
        }

        w = Math.random();

        for( var k2 = 0; k2 < 4*3*12; k2 += 4 ){
            velArray[ k + k2+0 ] = 0;
            velArray[ k + k2+1 ] = 0;
            velArray[ k + k2+2 ] = 0;
            velArray[ k + k2+3 ] = w;
        }

        var accX = Math.random() * 0.01 - 0.005;
        var accY = -0.0001;//-0.0001 - Math.random()*0.001;
        var accZ = Math.random() * 0.01 - 0.005;

        for( var k2 = 0; k2 < 4*3*12; k2 += 4 ){
            accArray[ k + k2+0 ] = accX;
            accArray[ k + k2+1 ] = accY;
            accArray[ k + k2+2 ] = accZ;
            accArray[ k + k2+3 ] = 0.0;
        }

    }


}

function getCameraConstant( camera ) {
    return window.innerHeight / ( Math.tan( THREE.Math.DEG2RAD * 0.5 * camera.fov ) / camera.zoom );
}



function playAnimation(name){

    isIdling = false;

    window.stopList = window.stopList.concat( window.playList.splice(0,window.playList.length) );
    window.stopList.forEach((value,index)=>{
        if( value._clip.name == name ){
            window.playList = window.stopList.splice(index,1);
            window.playList[0].time = 0;
            window.playList[0].play();
        }
    })

}
window.playAnimation = playAnimation;


function backToIdling(){
    window.stopList = window.stopList.concat( window.playList.splice(0,window.playList.length) );
    window.stopList.forEach((value,index)=>{
        if( value._clip.name == "dance1" ){
            window.playList = window.stopList.splice(index,1);
            window.playList[0].play();
        }
    })
}


function animate() {
    requestAnimationFrame( animate );
    soundCloud.update();

    rl1 += 0.003;
    if( rl1 > 6.28 )rl1 -= 6.28;

    rl2 += 0.01;
    if( rl2 > 6.28 )rl2 -= 6.28;

    camera.position.x = 2.5 * Math.cos(rl1);
    camera.position.y = 1.0 + Math.cos(rl2)*0.5;
    camera.position.z = 2.5 * Math.sin(rl1) + Math.sin(rl2)*0.5;

    light.position.x = camera.position.x;
    light.position.y = camera.position.y;
    light.position.z = camera.position.z;

    if( window.mmdMesh ){
        cameraLookAt2.x += (mmdMesh.skeleton.bones[0].position.x*0.00 - cameraLookAt2.x )/10.0;
        cameraLookAt2.y += (mmdMesh.skeleton.bones[0].position.y*0.00 - cameraLookAt2.y )/10.0;
        cameraLookAt2.z += (mmdMesh.skeleton.bones[0].position.z*0.01 - cameraLookAt2.z )/10.0;
    }
    cameraLookAt.set( cameraLookAt2.x, 0.4+cameraLookAt2.y, cameraLookAt2.z );
    camera.lookAt(cameraLookAt);

    if( motionObj ){

        window.playList.forEach((value) => {
            value.weight += ( 1 - value.weight ) / 10;
            // value.weight += 0.05;
            if (value.weight > 0.9999) value.weight = 1;
            if (value._clip.duration - 0.1 < value.time && isIdling == false ){
                isIdling = true;
                backToIdling();
            }
        });

        window.stopList.forEach((value) => {
            // console.log(value)
            value.weight += ( 0 - value.weight ) / 10;
            // value.weight -= 0.001;
            if( value.weight < 0.0001)value.weight = 0;
        });

    }

    render();
}

function render() {

    helper.animate( clock.getDelta() );


    // Render onto our off-screen texture
    // draw mmd skinned mesh data to bufferTexture
    renderer.render(bufferScene, camera, bufferTexture);

    if( uniforms2 ){
        // pass to DebugMMD shader ?
        uniforms2.texture1.value = bufferTexture.texture;
    }

    gpuCompute.compute();

    velocityVariable.material.uniforms.time.value     += 1/60;
    positionVariable.material.uniforms.time.value     += 1/60;
    accelerationVariable.material.uniforms.time.value += 1/60;

    if( motionObj ){
        particleUniforms.amount.value                   = (1.0-motionObj.dance1.weight);
        velocityVariable.material.uniforms.amount.value = (1.0-motionObj.dance1.weight);
    }

    //pass mmd skineed mesh data to computeShaderVelocity shader to calculate particle velocity
    velocityVariable.material.uniforms.texture1.value = bufferTexture.texture;

    //pass mmd skineed mesh data to computeShaderVelocity shader to calculate particle position
    positionVariable.material.uniforms.texture1.value = bufferTexture.texture;

    accelerationVariable.material.uniforms.texture1.value = bufferTexture.texture;
    accelerationVariable.material.uniforms.texture2.value = bufferTexture2.texture;

    //pass mmd skineed mesh data to particle shader to calculate final particle position
    particleUniforms.texture1.value = bufferTexture.texture;
    bodyUniforms.texture1.value = bufferTexture.texture;


    if( soundCloudTexture ) {
        soundCloudTexture.image.data = soundCloud.getBytes();
        soundCloudTexture.needsUpdate = true;
        bodyUniforms.soundCloudTexture.value = soundCloudTexture;
        bodyUniforms.soundCloudHigh.value = 1.0;//soundCloud.getGain("high");
        bodyUniforms.soundCloudLow.value = 0.5+( Math.pow(soundCloud.getGain("low"), 3)*0.00000001);
    }


    /* getCurrentRenderTarget function would pass the previous position to myself, then calculating next position using the previous position */
    //pass calculated particle velocity to partticle shader
    particleUniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;

    //pass calculated particle position to partticle shader
    particleUniforms.textureVelocity.value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture;

    particleUniforms.textureAcceleration.value = gpuCompute.getCurrentRenderTarget( accelerationVariable ).texture;

    bodyUniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
    bodyUniforms.textureVelocity.value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture;
    bodyUniforms.textureAcceleration.value = gpuCompute.getCurrentRenderTarget( accelerationVariable ).texture;

    // renderer.setMode( _gl.POINTS );
    renderer.render( scene, camera );

    renderer.render(bufferScene, camera, bufferTexture2);
}


var changeAnimation = function (name, loop) {
    var clip, action;

    for (var i = 0; i < mesh.geometry.animations.length; ++i) {
        if (mesh.geometry.animations[i].name === name) {
            clip = mesh.geometry.animations[i];
            action = mesh.mixer.clipAction(clip);
        }
    }

    if (loop) {
        action.repetitions = 'Infinity';
    } else {
        action.repetitions = 0;
    }

    // mesh.mixer.stopAllAction();
    action.play();
};
window.changeAnimation = changeAnimation;

window.animationState = "dance1";

