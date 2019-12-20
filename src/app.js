import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import maskPath from './models/mask.gltf';
import headPath from './models/Taj.gltf';
import { MouseLight } from './MouseLight';
import { GlassSkin } from './GlassSkin';
import { SoftVolume } from './SoftVolume';
import { Background } from './Background'
import { HeadMove } from './HeadMove'
import {Activity} from './Activity'
import * as dat from 'dat.gui';
import { Gravity } from './Gravity'
import { SoundHandler } from './SoundHandler';
import {TextLayer} from './TextLayer';
import domeImage from './images/gradient.jpeg'

var camera, scene, renderer;

var mesh, face; //model mesh
var mouseLight, glassSkin; // use for transparent effect
var softVolume; // use for softvolume effect

var background, gravity, headmove, activity;
var controls;
var directionalLight;

// var raycaster = new THREE.Raycaster(), INTERSECTED;
// var mouse = new THREE.Vector2();
// var eventType, sphere;
var loadingAnimateTimer;
var soundHandler;
var textLayer;

var manager = new THREE.LoadingManager();
var managerLoad = 0;
var soundLoad = 0;
var totalLoad = 16;

init();
animate();

function initSound() {
    soundHandler = new SoundHandler(soundOnProgress);
    //call soundHandler.play() when click?
    soundHandler.schedule(() => {
        //soundHandler.consoleNow();
        //console.log('start');
        soundHandler.playBG();
        softVolume.enable();
        background.enable();
        //soundHandler.consoleNow();
        soft2Gravity();
    }, 0, 0);
    
    let soft2Gravity = () => {
        soundHandler.scheduleToneTime(()=>{
            //soundHandler.consoleNow();
            //console.log('yo!');
            //soundHandler.consoleNow();
            var count = 0
            //flash();
            var interval = setInterval(() => {
                flash();
                count += 1
                if (count > 10) { clearInterval(interval) }
            }, 100);

            if (softVolume) {
                softVolume.disable();
                softVolume.dispose();
                softVolume = undefined;
            }
            //gravity = new Gravity(scene, mesh, soundHandler);
            gravity.enable()
            background.direction = 'up'
            bumpFlash();
        }, 29.5);
    }
    let soft2Gravity2 = () => {
        soundHandler.schedule(()=>{
            var count = 0
            var interval = setInterval(() => {
                flash()
                count += 1
                if (count > 5) { clearInterval(interval) }
            }, 200);

            if (softVolume) {
                softVolume.disable();
                softVolume.dispose();
                softVolume = undefined;
            }
            //gravity = new Gravity(scene, mesh, soundHandler);
            gravity.enable()
            background.direction = 'up'
            bumpFlash();
        }, 0, 30);
    }
    //soundHandler.schedule(() => {
        //soundHandler.consoleNow();
        //alert();
        // var count = 0
        // var interval = setInterval(() => {
        //     flash()
        //     count += 1
        //     if (count > 10) { clearInterval(interval) }
        // }, 100);

        // if (softVolume) {
        //     softVolume.disable();
        //     softVolume.dispose();
        //     softVolume = undefined;
        // }
        // //gravity = new Gravity(scene, mesh, soundHandler);
        // gravity.enable()
        // background.direction = 'up'
        // bumpFlash();
    //}, 0, 29);

   // return;
    
    let bumpFlash = () => {
        soundHandler.schedule(() => {
            var count = 0
            var interval = setInterval(() => {
                flash()
                count += 1
                if (count > 5) {clearInterval(interval)}
            }, 200);
            speedupBg();
        //}, 0, 48.5)
        }, 0, 45);
    }

    let speedupBg = () => {
        soundHandler.schedule(() => {
            if (background) {
                background.speedup = true
            }
            
        //}, 1, 6)
        }, 1, 4);
        gravity2Glass();
    }
    
    let gravity2Glass = () => {
        soundHandler.schedule(() => {
            //renderer.setClearColor('#000000');
            gravity.disable()
            gravity = null
            testTransparent(600);
            headmove = new HeadMove(renderer, camera, scene, face, mesh, controls)
            headmove.enable(camera, face, mesh)
        //}, 1, 10);
        }, 1, 8);
        shakeHead();
    }
    
    let shakeHead = () =>{
        soundHandler.schedule(() => {
            if (mouseLight) mouseLight.disable();
    
            headmove.changeMode('shake', camera, face, mesh)
            // console.log('seperate mask and head?');
        }, 1, 38.5);
        headFlake();
    }
    
    let headFlake = () => {
        soundHandler.schedule(() => {
            headmove.changeMode('flake', camera, face, mesh)
        }, 1, 53.5);
        headUp();
    }

    let headUp = () => {
        soundHandler.schedule(() => {
            headmove.changeMode('up', camera, face, mesh)
        }, 2, 0);
        rotateHead();
        shakeHead2();
    }

    let shakeHead2 = () => {
        soundHandler.schedule(() => {
            headmove.changeMode('shake', camera, face, mesh)
        }, 2, 4.5);
        rotateHead();
    }

    let rotateHead = () => {
        soundHandler.schedule(() => {
            headmove.changeMode('rotate', camera, face, mesh)
        }, 2, 7);
        showActivity();
    }

    let showActivity = () => {
        soundHandler.schedule(() => {
            directionalLight.intensity = 1
            if (headmove) {
                headmove.disable()
                headmove = undefined
            }
            activity = new Activity(camera, scene, controls)
            activity.enable();
            //textLayer.addMoreSpan('MORE');
        }, 2, 9);
    }    

    
}

function init() {
    let width = window.innerWidth
    let height = window.innerHeight
    intDocument();
    
    

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(0, 10, 40);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor('#FFFFFF');

    controls = new OrbitControls(camera, renderer.domElement)
    controls.enable = false;
    //testBackground();
    background = new Background(renderer, scene);

    initSound();
    textLayer = new TextLayer(()=>{soundHandler.start();});

    handleManager();
    initLight();
    
    initModel();



    document.body.appendChild(renderer.domElement);
    //testEvent();
}



function intDocument () {
    document.querySelector('body').style.margin = "0px"; 
}



function initLight() {
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(-1, -0.4, 1);
    scene.add(directionalLight);
    scene.add(new THREE.DirectionalLight(0xffffff, 0.5));
}


function initModel() {
    let loader = new GLTFLoader(manager);

    loader.load(maskPath, gltf => {
        let model = gltf.scene
        model.traverse(child => {
            if (child.isMesh) {
                child.geometry.rotateY(1.7);
                child.geometry.scale(0.1, 0.1, 0.1)
                child.geometry.translate(0, -30, 0)
                child.geometry.computeVertexNormals();
                mesh = child;
                mesh.name = 'mask'
                scene.add(mesh);
                initMode();
            }
        })
    });

    loader.load(headPath, gltf => {
        face = gltf.scene;
        face.position.set(2, 0, -15);
        face.scale.set(0.08, 0.08, 0.08);
        face.rotation.set(0, Math.PI, 0);
        face.name = 'face'
        scene.add(face);
    });

}

function initMode() {
    mouseLight = new MouseLight(scene, camera, soundHandler);
    gravity = new Gravity(scene, mesh, soundHandler);
    softVolume = new SoftVolume(scene, mesh, true, soundHandler);
    //softVolume.enable();
    //gravity.enable();
}


function animate() {
    requestAnimationFrame(animate);
    if (softVolume) softVolume.update(camera);
    if (glassSkin) glassSkin.update(renderer, camera);
    if (mouseLight) mouseLight.update(mesh);
    if (background) background.update(camera, mesh, face);
    if (gravity) gravity.update(mesh.position)
    if (headmove) headmove.update(camera, face, controls, directionalLight)
    if (activity) activity.update(camera)

    renderer.render(scene, camera);
    //handleLoading();

}


function animateValue(start, end, duration) {
    var range = end - start;
    if (range == 0) return;
    var increment = 2;
    var current = start+increment;
    current = Math.min(current, end);
    textLayer.changeText(current+'%');
    var stepTime = Math.abs(Math.floor(duration / range));
    loadingAnimateTimer = setInterval(function() {
        current += increment;
        current = Math.min(current, end);
        textLayer.changeText(current.toFixed(0)+'%');
        if (current == end) {
            loadFinish();
            clearInterval(loadingAnimateTimer);
        }
    }, stepTime);
}

function loadFinish() {
    if (soundLoad + managerLoad !== totalLoad) return;
    console.log('load finish!');
    textLayer.addButton('CLICK TO START');
}

function handleLoading() {
    let load = 100*(soundLoad+managerLoad)/totalLoad;
    console.log('load:', soundLoad, managerLoad);
    clearInterval(loadingAnimateTimer);
    animateValue(parseInt(textLayer.nowInnerHtml().slice(0,-1)), load, 800);
}

function soundOnProgress(l) {
    soundLoad = l;
    handleLoading();
}

function handleManager() {

    manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
        managerLoad = itemsLoaded;
        handleLoading();
        //console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };
    
    manager.onError = function ( url ) {
        console.log( 'There was an error loading ' + url );
    };
}


function testEvent() {
    window.addEventListener('keydown', function (e) {
        var keyID = e.code;
        if (keyID === 'KeyA') {
            console.log('now mesh:', mesh);
            if (background) {
                background.disable()
                background = null
            }
            console.log('after disable bg mesh:', mesh);
            if (softVolume) softVolume.disable();
            console.log('after disable soft mesh:', mesh);
            if (gravity) {
                gravity.disable()
                gravity = null
            }
            console.log('after disable gravity mesh:', mesh);
            
            testTransparent();
            e.preventDefault();
        }
        if (keyID == 'KeyB') {
            if (gravity) {
                gravity.disable()
                gravity = null
            }
            if (mouseLight) mouseLight.disable();
            if (gSkin) glassSkin.disable();
            testSoft();
            e.preventDefault();
        }
        if (keyID == 'KeyC') {
            testOrigin();
            if (gravity) {
                gravity.disable()
                gravity = null
            }
            e.preventDefault();
        }
        if (keyID == 'KeyD') {
            if (mouseLight) mouseLight.disable();
            if (glassSkin) glassSkin.disable();
            if (gravity) {
                gravity.disable()
                gravity = null
            }
            testBackground();
            e.preventDefault();
        }
        if (keyID == 'KeyE') {
            camera.position.x += 1;
            mesh.position.z -= 1;
            e.preventDefault();
        }

        if (keyID == 'KeyF') {
            if (mouseLight) mouseLight.disable();
            if (glassSkin) glassSkin.disable();
            if (softVolume) softVolume.disable();
            if (!gravity) {
                gravity = new Gravity(scene, mesh, soundHandler);
                gravity.enable()
            } else {
                gravity.disable()
                gravity = undefined
            }
            e.preventDefault();
        }
        if (keyID == 'KeyG') {

            if (gravity) {
                gravity.applyN = true
            }
            e.preventDefault();
        }


        if (keyID == 'KeyO') {
            if (background) {
                background.speedup = true
            }
        }


        if (keyID == 'KeyI') {
            if (background) backgroundFlash('#343161')
            else backgroundFlash('#457552')
        }

        if (keyID == 'KeyQ') {
            headmove = new HeadMove(renderer, camera, scene, face, mesh, controls)
            headmove.enable(camera, face, mesh)
        }
        if (keyID == 'KeyW') {
            headmove.changeMode('shake', camera, face, mesh)
        }

        if (keyID == 'KeyE') {
            headmove.changeMode('flake', camera, face, mesh)
        }
        if (keyID == 'KeyR') {
            headmove.changeMode('up', camera, face, mesh)
        }
        if (keyID == 'KeyT') {
            headmove.changeMode('rotate', camera, face, mesh)
        }

        if (keyID == 'KeyU') {
            if (headmove) {
                headmove.disable()
                headmove = undefined
            }
            activity = new Activity(camera, scene, controls)
            activity.enable()
        }


    }, false);

}



function testBackground() {
    controls.enabled = false;

    if (!background) {
        background = new Background(renderer, scene);
        background.enable()
    }
    else {
        background.disable()
        background = undefined
    }
}

function testOrigin() {
    controls.enabled = true;
    directionalLight.intensity = 0.5;
    if (mouseLight) mouseLight.disable();
    if (glassSkin) glassSkin.disable();
    if (softVolume) softVolume.disable();
}

function testTransparent(time) {
    
    if (background) {
        background.disable('#000000')
        background = undefined
    }
    directionalLight.intensity = 0;
    // if (softVolume) softVolume.disable();
    //directionalLight.intensity = 1;

    //console.log(mesh, face);

    if (!glassSkin)
        glassSkin = new GlassSkin(scene, mesh);
    glassSkin.enable();

    setTimeout(()=>{
        if (!mouseLight)
            mouseLight = new MouseLight(scene, camera, soundHandler);
        mouseLight.enable();

        const loader = new THREE.TextureLoader();
        const bgTexture = loader.load(domeImage);
        scene.background = bgTexture;
        
    }, time)
    
    
    
}

function testSoft() {
    controls.enabled = false;
    directionalLight.intensity = 0.5;
    if (!softVolume) {
        softVolume = new SoftVolume(scene, mesh, true, soundHandler);
        // let gui = new dat.GUI();
        // softVolume.setGUI(gui);
    }
    softVolume.enable();
}


function flash () {
    if (background) backgroundFlash('#343161')
    else backgroundFlash('#457552')
}


function backgroundFlash(color) {
    face.visible = false
    mesh.visible = false
    if (Math.floor(Math.random() * 2)) {
        renderer.setClearColor('#17202A');
    } else {
        renderer.setClearColor('#FFFFFF');
    }

    
    setTimeout(() => {
        
        renderer.setClearColor(color);
        face.visible = true
        mesh.visible = true
    }, 100);
}

window.onresize = function () {
    let w = window.innerWidth;
    let h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}