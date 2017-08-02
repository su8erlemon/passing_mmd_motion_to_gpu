// const THREE = require('three')

window.ASSETS = {};

const loadTexture = (url, label) => {
    return (comp)=>{
        let loader = new THREE.TextureLoader();
        loader.load(url, (texture) => {
            ASSETS[label] = texture;
            comp();
        });
    }
}

export const assetsInit = (callback) => {

    let compCount = 0;
    function comp(){
        compCount++;
        if( compCount >= loads.length ){
            callback();
        }
    }

    let loads = [];
    // loads.push(loadTexture("assets/imgs/texture/border1.png", "border1"));
    // loads.push(loadTexture("assets/imgs/texture/border2.png", "border2"));
    // loads.push(loadTexture("assets/imgs/texture/border4.png", "border4"));
    // loads.push(loadTexture("assets/imgs/texture/border12.png", "border12"));
    loads.push(loadTexture("imgs/matcap4.jpg", "matcap1"));
    // loads.push(loadTexture("assets/imgs/texture/matcap2.png", "matcap2"));
    // loads.push(loadTexture("assets/imgs/texture/matcap3.png", "matcap3"));
    // loads.push(loadTexture("assets/imgs/texture/matcap4.jpg", "matcap4"));
    // loads.push(loadTexture("assets/imgs/texture/ss1.jpg"    , "ss1"));

    loads.forEach((startFunc) => {
        startFunc(comp);
    });

}





