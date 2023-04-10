import './main.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import fragment from './shaders/fragment.glsl.js';
import vertex from './shaders/vertex.glsl.js';
import texture from './images/1/end.jpg';
import texture1 from './images/2/start.jpg';
import GUI from 'lil-gui';
import gsap from 'gsap';

export default class Sketch {
  constructor() {
    this.scene = new THREE.Scene();
    this.container = document.getElementById('container');
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.useLegacyLights = true;
    // this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      5000
    );
    this.camera.position.set(0, 0, 1500);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.time = 0;
    this.video = document.getElementById('video');

    this.addPost();
    this.addMesh();
    this.setupResize();
    this.resize();
    this.settings();
    this.videoAnimations();
    this.render();
  }

  videoAnimations() {
    this.video.play();
    const timeline = gsap.timeline();
    let duration = 2;

    this.video.addEventListener('ended', () => {
      timeline.to(this.video, {
        duration: 0.1,
        opacity: 0,
      });
      // Distortion begins
      timeline.to(
        this.material.uniforms.uDistortion,
        {
          duration: duration,
          value: 3,
          ease: 'power2.inOut',
        },
        'start'
      );
      // Bloom pass begins
      timeline.to(
        this.bloomPass,
        {
          duration: duration,
          strength: 5,
          ease: 'power2.in',
        },
        'start'
      );
      timeline.to(
        this.material.uniforms.uProgress,
        {
          duration: 1,
          value: 1,
          delay: 1.5,
          ease: 'power2.inOut',
        },
        'start'
      );
      // Distortion ends
      timeline.to(
        this.material.uniforms.uDistortion,
        {
          duration: duration,
          value: 0,
          ease: 'power2.inOut',
        },
        'end'
      );
      // Bloom pass end
      timeline.to(
        this.bloomPass,
        {
          duration: duration,
          strength: 0,
          ease: 'power2.out',
          onComplete: () => {
            this.video.currentTime = 0;
            this.video.play();
            gsap.to(this.video, {
              duration: 0.1,
              opacity: 1,
            });
            this.video.addEventListener('ended', () => {
              timeline.restart();
            });
          },
        },
        'end'
      );
    });
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    // image cover
    this.imageAspect = 853 / 1280;
    let a1;
    let a2;
    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = this.height / this.width / this.imageAspect;
    }

    this.material.uniforms.uResolution.value.x = this.width;
    this.material.uniforms.uResolution.value.y = this.height;
    this.material.uniforms.uResolution.value.z = a1;
    this.material.uniforms.uResolution.value.w = a2;

    // // optional - cover with quad
    // const distance = this.camera.position.z;
    // const height = 1;
    // this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * distance));

    // // if (w/h > 1)
    // if (this.width / this.height > 1) {
    //   this.plane.scale.x = this.camera.aspect;
    // } else {
    //   this.plane.scale.y = 1 / this.camera.aspect;
    // }

    this.camera.updateProjectionMatrix();
  }

  addPost() {
    this.renderScene = new RenderPass(this.scene, this.camera);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      1.5,
      0.4,
      0.85
    );
    this.bloomPass.threshold = this.settings.bloomThreshold;
    this.bloomPass.strength = this.settings.bloomStrength;
    this.bloomPass.radius = this.settings.bloomRadius;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderScene);
    this.composer.addPass(this.bloomPass);
  }

  addMesh() {
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable',
      },
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector4() },
        uTexture: { value: new THREE.TextureLoader().load(texture) },
        uTexture1: { value: new THREE.TextureLoader().load(texture1) },
        uDistortion: { value: 0 },
        uProgress: { value: 0 },
      },
      fragmentShader: fragment,
      vertexShader: vertex,
      side: THREE.DoubleSide,
      // wireframe: true,
    });
    this.geometry = new THREE.PlaneGeometry(480 * 1.74, 820 * 1.74, 480, 820); // Aspect ratio of the videos

    this.plane = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  settings() {
    this.settings = {
      distortion: 0,
      bloomThreshold: 0,
      bloomStrength: 0,
      bloomRadius: 0,
    };
    this.gui = new GUI();
    this.gui.add(this.settings, 'distortion', 0, 3, 0.01);
    this.gui.add(this.settings, 'bloomStrength', 0, 10, 0.01);
  }

  render() {
    this.time += 0.05;
    this.material.uniforms.uTime.value = this.time;
    // this.material.uniforms.uDistortion.value = this.settings.distortion;
    // this.bloomPass.strength = this.settings.bloomStrength;

    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch();
