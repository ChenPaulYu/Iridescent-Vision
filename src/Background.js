import * as THREE from 'three';

var Background = function (renderer, scene) {
    let ground, ambientLight, hemiLight
    let textureLoader = new THREE.TextureLoader()

    let bldgs  = [], debris = []
    let debrisIdealSet = []
        
    let asphaltTexture, bldgTexture
    let bldgColor = 0x242424, lightColor = 0x444444, skyColor = 0xaaaaaa,
        chunkSize = 200, chunksAtATime = 6, debrisPerChunk = 32, debrisMaxChunkAscend = 10, lgBldgSize = 12;

    const Debris = require('./background/debris').default;
    const Building = require('./background/building').default;

    this.scene = scene;

    this.speed = 0.5;
    this.fogDistance = 100;
    this.brightness  = 0.5  

    this.update = (camera, mesh, face) => {
        backgroundUpdate(camera, mesh, face)
    }
    
    this.disable = () => {
        this.scene.remove(ground);
        this.scene.remove(ambientLight);
        this.scene.remove(hemiLight);
        for (var i = 0; i < bldgs.length; i++) {
            this.scene.remove(bldgs[i].mesh)
        }

        for (var i = 0; i < debris.length; i++) {
            this.scene.remove(debris[i].mesh)
        }

    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function randomAngle() {
        return Math.floor(Math.random() * 360);
    }


    function cityGenerate(zMove) {
        var buildings = []

        for(var i = 0; i < 200;i++) {
            var x = Math.random() * 1000 - 500
            var y = Math.random() * 100 - 50
            var z = Math.random() * 100 - 50
            var d = Math.random() * 20  + 30
            buildings.push(new Building(x, y, z + zMove, lgBldgSize, d, lgBldgSize, bldgColor, bldgTexture))
        }
        return buildings

    }

    function debrisGenerate(zMove) {
        debrisIdealSet = []
        debris = []
        for (var d = 0; d < debrisPerChunk; ++d) {

            let halfChunk = chunkSize / 10,
                debrisParams = {
                    x: randomInt(-halfChunk, halfChunk),
                    y: randomInt(0, chunkSize * debrisMaxChunkAscend),
                    z: randomInt(-halfChunk, halfChunk)
                };
            debrisParams.size = Math.abs(debrisParams.x / halfChunk) * 10;
            debrisParams.height = debrisParams.size * randomInt(2, 3);

            debrisIdealSet.push({
                x: debrisParams.x,
                y: debrisParams.y,
                z: debrisParams.z,

                width: debrisParams.size,
                height: debrisParams.height,
                depth: debrisParams.size,

                rotX: randomAngle(),
                rotY: randomAngle(),
                rotZ: randomAngle()
            });
        }

        for (var fs of debrisIdealSet)
            debris.push(new Debris(
                fs.x,
                fs.y,
                fs.z + zMove,
                fs.width,
                fs.height,
                fs.depth,
                fs.rotX,
                fs.rotY,
                fs.rotZ,
                bldgColor,
                scene
            ));

        return debris
    }

    let lightGenerate = (lightColor, brightness) => {

        ambientLight = new THREE.AmbientLight(lightColor);
        this.scene.add(ambientLight);

        hemiLight = new THREE.HemisphereLight(lightColor, 0xffffff, brightness);
        hemiLight.position.set(0, 8, 0);
        this.scene.add(hemiLight);
    }

    let floorGenerate = (chunkSize, asphaltTexture, zMove) => {
        var groundGeo = new THREE.PlaneGeometry(chunkSize*5, chunkSize*5),
            groundMat = new THREE.MeshLambertMaterial({
                color: 0x969696,
                map: asphaltTexture
            });
        ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -0.5 * Math.PI;
        ground.position.set(0, 0, zMove);
        ground.receiveShadow = true;
        return ground
    }


    let backgroundGenerate = (chunkSize, chunksAtATime, asphaltTexture) => {
        for (var cz = 1; cz > -chunksAtATime; --cz) {
            var zMove = chunkSize * cz;

            // ground = floorGenerate(chunkSize, asphaltTexture, zMove)
            bldgs  = cityGenerate(zMove)
            // debris = debrisGenerate(zMove)

            for(var i =0;i < bldgs.length;i++) {
                this.scene.add(bldgs[i].mesh)
            }

            // for (var i = 0; i < debris.length; i++) {
            //     this.scene.add(debris[i].mesh)
            // }

            // this.scene.add(ground);

            
        }
    }

    let backgroundUpdate = (camera, mesh, face) => {
        let delta = this.speed;

        camera.position.y += delta;
        mesh.position.y   += delta;
        face.position.y   += delta;
        


        // for (var d of debris) {
        //     if (d.mesh.position.y >= chunkSize * debrisMaxChunkAscend)
        //         d.mesh.position.y += -chunkSize * debrisMaxChunkAscend;
        //     else
        //         d.mesh.position.y += this.speed;

        //     let angleToAdd = this.speed / chunkSize * (Math.PI * 2);
        //     d.mesh.rotation.x += d.mesh.rotation.x >= Math.PI * 2 ? -Math.PI * 2 : angleToAdd;
        //     d.mesh.rotation.y += d.mesh.rotation.y >= Math.PI * 2 ? -Math.PI * 2 : angleToAdd;
        //     d.mesh.rotation.z += d.mesh.rotation.z >= Math.PI * 2 ? -Math.PI * 2 : angleToAdd;
        // }
    }

    let initBackground = (renderer) => {
        asphaltTexture = textureLoader.load("https://i.ibb.co/hVK82BH/asphalt-texture.jpg");
        bldgTexture = textureLoader.load("https://i.ibb.co/ZGLhtGv/building-texture.jpg");

        renderer.setClearColor(new THREE.Color(skyColor));
        renderer.shadowMap.enabled = true;
        backgroundGenerate(chunkSize, chunksAtATime, asphaltTexture)
        lightGenerate(lightColor, this.brightness)
        this.scene.fog = new THREE.Fog(skyColor, 0  , this.dfogDistance);

    }

    initBackground(renderer, scene)

}

export { Background };