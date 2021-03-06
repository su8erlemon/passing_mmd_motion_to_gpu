var OrbitControls = require('three-orbit-controls')(THREE);
module.exports = init;

function init() {

    var width, height;

    var isMobile = false
    if (navigator.userAgent.match(/iPad/i)) {
        isMobile = true;
    } else if(navigator.userAgent.match(/Android|webOS|iPhone|iPod|Blackberry/i) ) {
        isMobile = true;
    } else {
        // do desktop stuff
    }

    width = $(window).width() * (isMobile?1.0:1.2);
    height = $(window).height();

    // Scale for retina
    // const dpr = 0.5;//Math.min(1.5, window.devicePixelRatio);
    const dpr = Math.min(1.5, window.devicePixelRatio);

    const renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById("canvas"),
        antialias: true // default enabled
    });

    renderer.setClearColor(0x000000, 1.0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(dpr);

    const scene = new THREE.Scene();

    // camera = new THREE.OrthographicCamera( 1 / - 2, 1 / 2, 1 / 2, 1 / - 2, 1, 1000 )
    // camera.position.set(0, 0, -1)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.0001, 1000);
    camera.position.set(0, 1, -3);
    camera.lookAt(new THREE.Vector3());

    const controls = new OrbitControls(camera);

    window.addEventListener('resize', resize);

    return {
        renderer,
        scene,
        controls,
        camera
    }

    function resize() {

        width = $(window).width() * (isMobile?1.0:1.2);
        height = $(window).height();

        if (!renderer)return;

        renderer.setSize(width, height);
        renderer.setViewport(0, 0, width, height);

        camera.aspect = width/height;
        camera.updateProjectionMatrix();

    }
}

