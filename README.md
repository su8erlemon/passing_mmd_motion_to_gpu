# passing_mmd_motion_to_gpu

This experiment uses MMD file format which is originally used to produced 3D character and dance motion data for the Vocaloid character Hatsune Miku.
Users can manipulate and control the dancer with the keyboard
I used a texture for passing MMD skinned mesh vertex data to the GPU. This method produces a developer high-performance calculation and expanding expression ideas with the MMD file.
You can check detail from the repository.


-----------------------
## Requirements
For development, you will need Node.js installed on your environment.
```
  $ node --version
  v6.4.0
```

## Installation 
```
  $ git clone git@github.com:su8erlemon/passing_mmd_motion_to_gpu.git
  $ cd passing_mmd_motion_to_gpu
  $ npm install
```

## Development
```
  $ cd passing_mmd_motion_to_gpu
  $ npm run start
```

## Build
```
  $ npm run build
```


## Further Reading
<https://github.com/mattdesl/budo> - a dev server for rapid prototyping

<http://qiita.com/ykido/items/55c7f17fb32216056705> - (Japanese)Threejs ShaderMaterial + SkinnedMesh
 
<http://qiita.com/uma6661/items/20accc9b5fb9845fc73a> - (Japanese)Understanding GPGPU