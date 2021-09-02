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
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth/2, window.innerHeight);
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
    constructor() {
        super();
        this.attachShadow({mode: 'open'});//shadow root
        const wrapper = document.createElement('div');
        wrapper.className = 'wrapper';
        this.videoSource = document.createElement('video');
        this.videoSource.src = this.hasAttribute('src') ? this.getAttribute('src') : 'assets/overpass-clip.mp4';
        this.videoSource.setAttribute('controls', 'controls');
        this.radius = 500;
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.scene = new THREE.Scene();
        const geometry = new THREE.SphereGeometry(this.radius, 60, 40);
        geometry.scale(-1, 1, 1);
        const texture = new THREE.VideoTexture(this.videoSource);
        const material = new THREE.MeshBasicMaterial({map: texture});
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth/2, window.innerHeight/2);
        wrapper.appendChild(this.renderer.domElement);
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