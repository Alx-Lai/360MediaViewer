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
    updateProgressBar = () => {
        let percent = Math.floor(100*this.videoSource.currentTime/this.videoSource.duration);
        this.progressBar.value = percent;
    }
    seek = (e) =>{
        let percent = e.clientX / this.progressBar.offsetWidth;
        this.videoSource.currentTime = Math.floor(percent * this.videoSource.duration);
        e.target.value = Math.floor(percent*100);
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
        
        const controls = document.createElement('div');
        controls.id = 'controls';
        const progressBar = document.createElement('progress');
        this.progressBar = progressBar;
        progressBar.id = 'progress-bar';
        progressBar.setAttribute('min', '0');
        progressBar.setAttribute('max', '100');
        progressBar.setAttribute('value', '0');
        const playButton = document.createElement('button');
        playButton.id = 'btnPlay';
        playButton.className = 'play';
        playButton.onclick = () => {
            if(this.videoSource.paused || this.videoSource.ended){
                playButton.className = 'pause';
                this.play();
            }else{
                playButton.className = 'play';
                this.pause();
            }
        }
        const StopButton = document.createElement('button');
        StopButton.id = 'btnStop';
        StopButton.className = 'stop';
        StopButton.onclick = () => {
            this.pause();
            this.videoSource.currentTime = 0;
        }
        const muteButton = document.createElement('button');
        muteButton.id = 'btnMute';
        muteButton.className = 'mute';
        muteButton.onclick = () => {
            if(this.videoSource.muted) {
                muteButton.className = 'mute';
                this.videoSource.muted = false;
            }else{
                muteButton.className = 'unmute';
                this.videoSource.muted = true;
            }
        }
        const volumeBar = document.createElement('input');
        volumeBar.type = 'range';
        volumeBar.setAttribute('min', '0');
        volumeBar.setAttribute('max', '1');
        volumeBar.setAttribute('step', '0.05');
        volumeBar.setAttribute('value', '1');
        volumeBar.addEventListener('change', (e) => {
            this.videoSource.volume = e.target.value;
        }, false);
        /*const fullScreenButton = document.createElement('button');
        fullScreenButton.id = 'btnFullscreen';
        fullScreenButton.className = 'fullscreen';*/
        
        this.videoSource.addEventListener('play', ()=>{
            playButton.className='pause';
        }, false);
        this.videoSource.addEventListener('pause', ()=>{
            playButton.className='play';
        }, false);
        this.videoSource.addEventListener('volumechange', ()=>{
            if(this.videoSource.muted){
                muteButton.className = 'unmute';
            }else{
                muteButton.className = 'mute';
            }
        }, false);
        this.videoSource.addEventListener('timeupdate', this.updateProgressBar, false);
        progressBar.addEventListener('click', this.seek);
        /*fullScreenButton.addEventListener('click', ()=>{
            
        })*/
        

        wrapper.style.touchAction = 'none';
        wrapper.addEventListener('pointerdown', this.onPointerDown);
        document.addEventListener('wheel', this.onDocumentMouseWheel);
        document.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('resize', this.onWindowResize);
        this.videoSource.currentTime = 0;
        const style = document.createElement('style');
        style.textContent = `
        video{
            display : none;
        }
        #controls {
            position: absolute; 
            width: 100%;
        }
        button {
            width: 25px;
            height: 25px;
            cursor: pointer;
            background-color: transparent;
            background-size: cover;
            background-position: center center;
        }
        .play{
            background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOkAAADoCAMAAAA9tTN0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAPUExURQAAAAAAAAAAAAAAAAAAAE8O540AAAAEdFJOUwBAgL+jVN0MAAAACXBIWXMAADLAAAAywAEoZFrbAAAECElEQVR4XuXcSXIbQQxEUdrW/c9sSkrLHHqoAQVkZv8V2UMBL0I7KXT7/ft2kT4+rmL9uHcN66f0GtZv6RWsgN5zt4L5lbcVSORsBfEnXyuAD7lawXvK0wrcS45W0N7yswK2kZsVrM28rEDtZWSFaD8bKzxHmVihOc7CCstZBlZIzpO3wtGSuBWKtqStMLQmbIWgPVkr9u9J1Irt+5K0YvfeBK3YvD85K/YeScyKrceSsmLn0YSs2Hg8GSv2nUnEim3nkrBi19kErNh0Pnor9oyI3IotY6K2YseoiK3YMC5aK/aLjNSK7WKjtGK36Ait2Cw+Oiv2WhGZFVuticqKnVZFZMVG66KxYp+VkVixzdoorNhldQRWbLK+civ2yKjYii1yKrVih6wKrdggrzIr5mdWZMX03EqsmJ1dgRWT80u3Ym5FyVZMrSnViplVJVoxsa40K+ZVlmTFtNpSrJhVXYIVk+pbbsUchhZbMYWjpVbMYGmhFRN4WmbF+UwtsuJ0rpZYcTZbC6w4ma9wK85lLNiKUzkLteJM1gKtOJG3MCvOYy7IitO4C7HiLPYCrDiJv2krzlFo0opTNJqy4gyVJqw4QadhK95XatCKt7UasuJdtQaseFOvbiveU6zTirc067LiHdU6rHhDt2Yrnleu0YqntWuy4ln1Gqx4Ur9TK55z6OSfBuIpjw6teMalAyue8GnXivtO7Vhx16tNK+65tWHFHb/erLju2IsVVz17suKaaw9WXPHtx4rvzsGKb959WfHZvbsVn9z78+sa0rvzEj+9X84LSOG0l/44zaUPTmvpk9NY+uK0lb45TaUbTkvpptNQuuO0k+46zaQHTivpodNIeuK0kZ46TaQNTgtpk9NA2uiUlzY7xaUdTmlpl1NY2umUlXY7RaUDTknpkFNQOuiUkw47xaQTTinplFNIOumUkU47RaQBTglpiFNAGuSkl4Y5yaWBTmppqJNYGuyklYY7SaULnJTSJU5C6SInnfTxj6yDwwSOFjqppEudRNLFThrpcieJNMFJIU1xEkiTnOXSNGexNNFZKk11FkqTnWXSdGeRtMBZIi1xFkiLnOnSMmeytNCZKi11JkqLnWnScmeSlMCZIqVwJkhJnMulNM7FUiLnUimVc6GUzLlKuuzXSBNhtdAYnSuknM54KaszWsrrjJUyOyOl3M44KbszSsrvjJEqOCOkGs55qYpzVqrjnJMqOWekWs5xqZpzVKrnHJMqOkekms5+qaqzV6rr7JMqO3uk2s52qbqzVarvbJM6OFukHs5zqYvzTOrjPJY6OY+kXs59qZtzT+rn3JY6Orekns53qavzVerrfJY6Ox+l3s7/UnfnP6m/81t6Been9BrO2+0iztvtL0WzpmDKxgcnAAAAAElFTkSuQmCC');
        }
        .pause{
            background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOkAAADpCAMAAAD26eDRAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURQAAAAAAAKVnuc8AAAABdFJOUwBA5thmAAAACXBIWXMAADLAAAAywAEoZFrbAAADJUlEQVR4Xu3RwQ0AIAzDQNh/aR54AsvP3ABWo54bOjW6iS1VuK9DN7GlCvd16Ca2VOG+Dt3Elirc16Gb2FKF+zp0E1uqcF+HbmJLFe7r0E1sqcJ9HbqJLVW4r0M3saUK93XoJrZU4b4O3cSWKtzXoZvYUoX7OnQTW6pwX4duYksV7uvQTWypwn0duoktVbivQzexpQr3degmtlThvg7dxJYq3Nehm9hShfs6dBNbqnBfh25iSxXu69BNbKnCfR26iS1VuK9DN7GlCvd16Ca2VOG+Dt3Elirc16Gb2FKF+zp0E1uqcF+HbmJLFe7r0E1sqcJ9HbqJLVW4r0M3saUK93XoJrZU4b4O3cSWKtzXoZvYUoX7OnQTW6pwX4duYksV7uvQTWypwn0duoktVbivQzexpQr3degmtlThvg7dxJYq3Nehm9hShfs6dBNbqnBfh25iSxXu69BNbKnCfR26iS1VuK9DN7GlCvd16Ca2VOG+Dt3Elirc16Gb2FKF+zp0E1uqcF+HbmJLFe7r0E1sqcJ9HbqJLVW4r0M3saUK93XoJrZU4b4O3cSWKtzXoZvYUoX7OnQTW6pwX4duYksV7uvQTWypwn0duoktVbivQzexpQr3degmtlThvg7dxJYq3Nehm9hShfs6dBNbqvxHhOgmtlT5jwjRTWypwn0duoktVbivQzexpQr3degmtlThvg7dxJYq3Nehm9hShfs6dBNbqnBfh25iSxXu69BNbKnCfR26iS1VuK9DN7GlCvd16Ca2VOG+Dt3Elirc16Gb2FKF+zp0E1uqcF+HbmJLFe7r0E1sqcJ9HbqJLVW4r0M3saUK93XoJrZU4b4O3cSWKtzXoZvYUoX7OnQTW6pwX4duYksV7uvQTWypwn0duoktVbivQzexpQr3degmtlThvg7dxJYq3Nehm9hShfs6dBNbqnBfh25iSxXu69BNbKnCfR26iS1VuK9DN7GlCvd16Ca2VOG+Dt3Elirc16Gb2FKF+zp0E1uqcF+HbmJLFe7r0E1sqcJ9HbqJLVW4r0M3saUK93XoJrZU4b4O3cSWKtzXoRu49wExYopZuKFi9QAAAABJRU5ErkJggg==')
        }
        .stop{
            background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOkAAADpCAMAAAD26eDRAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURQAAAAAAAKVnuc8AAAABdFJOU/4a4wd9AAAACXBIWXMAADLAAAAywAEoZFrbAAABA0lEQVR4Xu3PAQEAMAzDoM6/6fvIwQG7T8w0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0x7THtMe0xzTn9gAO+tMpxAhNLgAAAABJRU5ErkJggg==");    
        }
        .mute{
            background-image: url("data:image/png;base64,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");
        }
        .unmute{
            background-image: url("data:image/png;base64,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");
        }
        `;
        controls.appendChild(progressBar);
        controls.appendChild(playButton);
        controls.appendChild(StopButton);
        controls.appendChild(muteButton);
        controls.appendChild(volumeBar);
        //controls.appendChild(fullScreenButton);
        wrapper.appendChild(controls);
        this.shadowRoot.append(style, wrapper);
        this.animate();
    }
}
customElements.define('viewer-360', Viewer360);