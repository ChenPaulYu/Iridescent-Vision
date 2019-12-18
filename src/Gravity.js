import * as THREE from 'three';
import * as OIMO from 'oimo';
import {Vec3} from 'oimo/src/math/Vec3';
import ballCollide from './sounds/ball_collide.mp3';
import ballFly from './sounds/ball_fly.mp3';
import ballRoll from './sounds/ball_roll.mp3';


var Gravity = function (scene, mesh, soundHandler) {

    const COL = 0;
    const FLY = 1;
    const ROLL = 2;

    let world;
    let bodys = [];
    let centerBody;
    let size = 200;
    let player;
    let ballMeshes = [];
    //let collidePlayer, flyPlayer;
    //let playerLoad = 0;

    this.uuid = []

    this.applyN = true;
    this.scene  = scene;
    this.enabled = false;
    this.center = new THREE.Vector3(0, 0, 0);
    this.all = false
    this.mesh = mesh
    this.soundReady;
    this.soundHandler = soundHandler;


    let rand = (low, high) => low + Math.random() * (high - low);
    let randInt = (low, high) => low + Math.floor(Math.random() * (high - low + 1));
    
    let init = () => {
        initSound();

        world = initWorld()
        centerBody = add2World({ type: 'sphere', geometry: new THREE.SphereBufferGeometry(1, 32, 24), size: [10, 30, 8], pos: [0, 0, 0], density: 1 }, true);
        
        //console.log('init!!!');
    };

    // let checkLoadReady = () => {
    //     playerLoad ++;
    //     if (playerLoad == 2) {
    //         console.log('gravity sound ready!');
    //         if (this.soundReady) this.soundReady();
    //     }
    // }

    let initSound = () => {
        player = soundHandler.loadPlayer([ballCollide, ballFly, ballRoll]);
    }
    
    let initWorld = () => {
        return new OIMO.World({
                timestep: 1 / 60,
                iterations: 8,
                broadphase: 2, // 1: brute force, 2: sweep & prune, 3: volume tree
                worldscale: 1,
                random: true,
                gravity: [0, 0, 0],
            });
    }

    let createParticle = (width) => {
        let particle = {
            move: true,
            density: 1,
            pos: [
                rand(10, 100) * (randInt(0, 1) ? -1 : 1),
                rand(10, 500) * (randInt(0, 1) ? -1 : 1),
                rand(10, 100) * (randInt(0, 1) ? -1 : 1),
            ],
            rot: [
                randInt(0, 360),
                randInt(0, 360),
                randInt(0, 360),
            ]
        };
        particle.type = 'sphere';
        particle.size = [width];
        return particle
    }

    let add2World = (o, noMesh) => {

        if (world) {
            var b = world.add(o);
            //bodys.push(b);
        }

        let s;
        if (o.geometry) {
            s = o.geometry;
        } else {
            s = new THREE.SphereGeometry(1, 32, 32);
        }

        let MeshMaterial = new THREE.MeshStandardMaterial({
            color: 0xffe6e6,
            side: THREE.DoubleSide,
            alphaTest: 0.7,
        });

        if (!noMesh) {
            let meshtemp = new THREE.Mesh(s, MeshMaterial);
            this.scene.add(meshtemp);
            meshtemp.position.set(b.pos[0], b.pos[1], b.pos[2]);
            s.scale(o.size[0], o.size[1], o.size[2]);
            if (world) b.connectMesh(meshtemp);
            ballMeshes.push(meshtemp);
        }

        if (world) return b;

    }

    let postLoop = (pos) => {
        
        var force, m;
        var r = 3;
        let applyN = this.applyN
        //let center = this.center
        let center = new Vec3(pos.x, pos.y, pos.z);
        let all    = this.all

        bodys.forEach(function (b, id) {
            
            //console.log(b.userData.contact);

            if (b.type === 1) {
                contact(b);
                m = b.mesh;
                force = center.clone().sub(m.position).normalize().multiplyScalar(10);
                if (applyN && (Math.floor(Math.random() * 4) || all)) {
                    if (!all) force = force.negate().multiplyScalar(Math.random() * 50);
                    else force = force.negate().multiplyScalar(Math.random() * 70);
                } 
                b.applyImpulse(center, force);

            } else {
                b.setPosition(center);
            }

        });
        if (this.applyN) this.applyN = false;
        if (this.all) this.all = false
    }

    let contact = (b) => {

        var c = world.getContact( centerBody, b);
        //if (!(b.userData)) b.userData = {contact: false};
        if( c ){ 
            //b.userData.contact = true;
            if( !c.close ) {
                if (player[COL].state == 'stopped' && player[COL].loaded)
                    player[COL].start();
            } else {
                if (player[ROLL].state == 'stopped' && player[ROLL].loaded)
                    player[ROLL].start();
            }
        } 
    
    }    

    
    let changeTexture = () => {
        var textureLoader = new THREE.TextureLoader();
        var texture = textureLoader.load("https://raw.githubusercontent.com/aatishb/drape/master/textures/patterns/circuit_pattern.png");

        let MeshMaterial = new THREE.MeshStandardMaterial({
            color: 0xebaf09,
            emissive: 0xc325e,
            map: texture,
            side: THREE.DoubleSide,
            roughness: 0.32,
            metalness: 0.28

        });
        //specular: 0x441833,

        this.mesh.material = MeshMaterial;

    }


    this.enable = () => {
        this.enabled = true;
        addListener();
        //TODO: change to enable!
        for (var i = 0; i < size; i++) {
            bodys.push(add2World(createParticle(rand(0.5, 1))));
        }

        changeTexture();
        for (var child of this.scene.children) {
            this.uuid.push(child.uuid)
        }

        world.play();
    }


    this.disable = () => {
        this.enabled = false;
        removeListener();
        world.stop();

        for (var i = this.scene.children.length - 1; i >= 0; i--) {
            let obj = this.scene.children[i]
            if (!this.uuid.includes(obj.uuid)) {
                clearObject(obj, this.scene)
            }

        }
    }

    function clearObject(obj, scene) {
        scene.remove(obj);
        if (obj.geometry) {
            obj.geometry.dispose()
        }
        if (obj.material) {
            Object.keys(obj.material).forEach(prop => {
                if (!obj.material[prop])
                    return
                if (typeof obj.material[prop].dispose === 'function')
                    obj.material[prop].dispose()
            })
            obj.material.dispose()
        }
    }

    this.update = (pos) => {
        if (!this.enabled) return;
        postLoop(pos)
    }

    let applyForce = () => {
        this.applyN = true
        this.all    = false 
        if (player[FLY].loaded)
            player[FLY].start();
    }
    
    let applyAllForce = () => {
        this.applyN = true
        this.all    = true 
        if (player[FLY].loaded)
            player[FLY].start();
    }

    let addListener = () => {
        document.addEventListener('click'   , applyForce, false);
        document.addEventListener('dblclick', applyAllForce, false)
    }    

    let removeListener = () => {
        document.removeEventListener('click'   , applyForce, false);
        document.removeEventListener('dblclick', applyAllForce, false)
    }

    init()
}

export { Gravity }