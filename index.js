import * as THREE from './lib/three.module.js';
class Viewer360 extends HTMLElement {
    onPointerDownMouseX = 0; onPointerDownMouseY = 0;
	lon = 0;onPointerDownLon = 0;
	lat = 0;onPointerDownLat = 0;
	phi = 0;theta = 0;
    onPointerMove = (event) =>{
        if(event.isPrimary === false)return;
        this.lon = (this.onPointerDownMouseX - event.clientX)*0.1 + this.onPointerDownLon;
        this.lat = (event.clientY - this.onPointerDownMouseY)*0.1 + this.onPointerDownLat;
    }
    onPointerUp = (event) =>{
        if(event.isPrimary === false)return;
        document.removeEventListener('pointermove', this.onPointerMove);
        document.removeEventListener('pointerup', this.onPointerUp);
    }
    onPointerDown = (event) =>{
        if(event.isPrimary === false)return;
        this.onPointerDownMouseX = event.clientX;
        this.onPointerDownMouseY = event.clientY;
        this.onPointerDownLon = this.lon;
        this.onPointerDownLat = this.lat;
        document.addEventListener('pointermove', this.onPointerMove);
        document.addEventListener('pointerup', this.onPointerUp);
    }
    onDocumentMouseWheel = (event) =>{
        const fov = this.camera.fov + event.deltaY*0.05;
        this.camera.fov = THREE.MathUtils.clamp(fov, 10, 75);
        this.camera.updateProjectionMatrix();
    }
    onKeyDown = (event) =>{
        if(event.keyCode == 38){ //key up
            if(this.videoSource.currentTime <= this.videoSource.duration-0.1){
                this.videoSource.currentTime += 0.1;
            }else{
                this.videoSource.currentTime = this.videoSource.duration;
            }
        }else if(event.keyCode == 40){ //key down
            if(this.videoSource.currentTime >= 0.1){
                this.videoSource.currentTime -= 0.1;
            }else{
                this.videoSource.currentTime = 0;
            }
        }
    }
    onWindowResize = () =>{
        if(this.WHfixed)return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth/2, window.innerHeight/2);
    }
    update = () =>{
        this.lat = Math.max(-85, Math.min(85, this.lat));
        this.phi = THREE.MathUtils.degToRad(90-this.lat);
        this.theta = THREE.MathUtils.degToRad(this.lon);
        const x = this.radius*Math.sin(this.phi)*Math.cos(this.theta);
        const y = this.radius*Math.cos(this.phi);
        const z = this.radius*Math.sin(this.phi)*Math.sin(this.theta);
        this.camera.lookAt(x, y, z);
        this.renderer.render(this.scene, this.camera);
    }
    animate = () =>{
        requestAnimationFrame(this.animate);
        this.update();
    }
    play = () =>{
        this.videoSource.play();
    }
    pause = () =>{
        this.videoSource.pause();
    }
    get currentTime(){
        return this.videoSource.currentTime;
    }
    get duration(){
        return this.videoSource.duration;
    }
    get muted(){
        return this.videoSource.muted;
    }
    constructor() {
        super();
        this.attachShadow({mode: 'open'});//shadow root
        const wrapper = document.createElement('div');
        wrapper.className = 'wrapper';
        this.videoSource = document.createElement('video');
        this.videoSource.src = this.hasAttribute('src') ? this.getAttribute('src') : 'assets/overpass-clip.mp4';
        this.videoSource.setAttribute('controls', 'controls');
        if(this.hasAttribute('autoplay')){
            this.videoSource.setAttribute('autoplay', 'autoplay');
        }
        this.radius = 500;
        let near = this.hasAttribute('near') ? parseInt(this.getAttribute('near')) : 1;
        let far = this.hasAttribute('far') ? parseInt(this.getAttribute('far')) : 1000;
        this.width = this.hasAttribute('width') ? parseInt(this.getAttribute('width')) : window.innerWidth/2;
        this.height = this.hasAttribute('height') ? parseInt(this.getAttribute('height')) : window.innerHeight/2;
        this.WHfixed = this.hasAttribute('width') && this.hasAttribute('height'); 
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, near, far);
        this.scene = new THREE.Scene();
        const geometry = new THREE.SphereGeometry(this.radius, 60, 40);
        geometry.scale(-1, 1, 1);
        const texture = new THREE.VideoTexture(this.videoSource);
        const material = new THREE.MeshBasicMaterial({map: texture});
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);//waiting for test
        this.renderer.setSize(this.width, this.height);
        wrapper.appendChild(this.renderer.domElement);
        /*
        const controls = document.createElement('div');
        controls.id = 'controls';
        const progressBar = document.createElement('progress');
        progressBar.id = 'progress-bar';
        progressBar.setAttribute('min', '0');
        progressBar.setAttribute('max', '100');
        progressBar.setAttribute('value', '0');
        const playButton = document.createElement('button');
        playButton.id = 'btnPlay';
        playButton.className = 'play';
        const pauseButton = document.createElement('button');
        pauseButton.id = 'btnStop';
        pauseButton.className = 'stop';
        const volumeBar = document.createElement('input');
        volumeBar.type = 'range';
        volumeBar.setAttribute('min', '0');
        volumeBar.setAttribute('max', '1');
        volumeBar.setAttribute('step', '0.05');
        volumeBar.setAttribute('value', '1');
        const muteButton = document.createElement('div');
        muteButton.id = 'btnMute';
        muteButton.className = 'mute';
        const muteButton = document.createElement('div');
        muteButton.id = 'btnFullscreen';
        muteButton.className = 'fullscreen';
        */
        
         

        wrapper.style.touchAction = 'none';
        wrapper.addEventListener('pointerdown', this.onPointerDown);
        document.addEventListener('wheel', this.onDocumentMouseWheel);
        document.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('resize', this.onWindowResize);
        this.videoSource.currentTime = 0;
        const style = document.createElement('style');
        style.textContent = `video{
            display : none;
        }`;
        this.shadowRoot.append(style, wrapper);
        this.animate();
    }
}
customElements.define('viewer-360', Viewer360);