import * as THREE from 'three';
import "./style.css";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import vertexShader from './shaders/vertex2.glsl';
import fragmentShader from './shaders/fragment.glsl';
import { sampler } from 'three/examples/jsm/nodes/Nodes.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

let shapeVertices = new Array(32);
for (let i = 0; i < shapeVertices.length; i++) {
  shapeVertices[i] = new THREE.Vector3();
}

const soundThresholdMult = 0.5;
let vertCount = 0;
const zeroVector = new THREE.Vector3();

function generateFibonacciSpherePoints(n) {
  const points = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < n; i++) {
    const theta = 2 * Math.PI * i / goldenRatio;
    const phi = Math.acos(1 - 2 * (i + 0.5) / n);
    const x = Math.cos(theta) * Math.sin(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(phi);

    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

function updateShapeVertices(dataArray) {
  let count = 0;
  for (const value of dataArray) {
    if (value > soundThresholdMult * dataArray[0]) {
      count++;
    }
  }
  const len = shapeVertices.length;
  vertCount = count;
  shapeVertices = generateFibonacciSpherePoints(count);
  console.log(shapeVertices);
  for (let i = 0; i < len - count; i++) {
    shapeVertices[count + i] = zeroVector;
  }
}

const fileInput = document.getElementById('audio-file-input');
const fileNameDisplay = document.getElementById('file-name');

fileInput.addEventListener('change', function() {
  if (fileInput.files.length > 0) {
    fileNameDisplay.textContent = fileInput.files[0].name;
  } else {
    fileNameDisplay.textContent = 'No file chosen';
  }
});

document.querySelectorAll('.slider').forEach(slider => {
  const currentSpan = document.getElementById(`current${slider.id.slice(-1)}`);
  
  slider.addEventListener('input', () => {
    currentSpan.textContent = `${slider.value}`;
    updateInputUniforms();
  });
});

function updateInputUniforms() {
  uniforms.u_min_amp.value = document.getElementById("myRange1").value;
  uniforms.u_max_amp.value = document.getElementById("myRange2").value;
  uniforms.u_amp_power.value = document.getElementById("myRange3").value;
  uniforms.u_power.value = document.getElementById("myRange4").value;
}

document.body.appendChild(fileInput);

const listener = new THREE.AudioListener();
const audio = new THREE.Audio(listener);

fileInput.addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
  audio.stop();
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const arrayBuffer = e.target.result;
      listener.context.decodeAudioData(arrayBuffer, function(buffer) {
        audio.setBuffer(buffer);
        audio.play();
      });
    };
    reader.readAsArrayBuffer(file);
  }
}

const analyserNode = new THREE.AudioAnalyser(audio, 2048);
const dataArray = new Uint8Array(analyserNode.getFrequencyData());
const avgDataArray = new Uint8Array(8);
analyserNode.analyser.smoothingTimeConstant = 0.8;
analyserNode.analyser.maxDecibels = 255;

const radius = 1.0;

class Particle {
  constructor(position) {
    this.pos = position;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.base = new THREE.Vector3(0, 0, 0);
    this.friction = 0.95;
  }
  
  update() {
    const dir = new THREE.Vector3();
    dir.subVectors(this.base, this.pos);
    const dist = this.pos.distanceTo(this.base);
    if (dist >= radius) {
      this.velocity.add(dir.multiplyScalar(dist * 0.0005));
    } else {
      this.velocity.sub(dir.multiplyScalar(dist * 0.0005));
    }
    this.velocity.multiplyScalar(this.friction);
    const randomForce = new THREE.Vector3(
      THREE.MathUtils.randFloat(-0.001, 0.001),
      THREE.MathUtils.randFloat(-0.001, 0.001),
      THREE.MathUtils.randFloat(-0.001, 0.001)
    );
    if (uniforms.u_avg_freq.value !== 0) {
      randomForce.multiplyScalar(uniforms.u_avg_freq.value / 2.0);
    }
    
    this.velocity.add(randomForce);
    this.pos.add(this.velocity);
  }

  applyForce(source, magnitude) {
    const dir = new THREE.Vector3();
    dir.subVectors(this.pos, source);
    this.velocity.add(dir.multiplyScalar(magnitude));
  }
}
var vertices = [];
const particles = []; 
const partCount = 35;
for (let z = -partCount; z < partCount; z += 2) {
  for (let y = -partCount; y < partCount; y += 2) {
    for (let x = -partCount; x < partCount; x += 2) {
      vertices.push(x, y, z);
      const p = new Particle(new THREE.Vector3(x, y, z));
      particles.push(p);
    }
  }
}

const uniforms = {
  u_avg_freq: { type: "f", value: 0.0 },
  u_max_avg_freq: { type: "f", value: 1.0 },
  u_data_array: { type: "float[32]", value: dataArray },
  u_base: { type: "vec3", value: new THREE.Vector3(0.0, 0.0, 0.0) },
  u_vert_count: { type: "int", value: 0 },
  u_color_a: { type: "vec3", value: new THREE.Vector3(0.69, 0.86, 0.26) },
  u_color_b: { type: "vec3", value: new THREE.Vector3(0.86, 0.15, 0.39) },
  u_min_amp: { type: "f", value: document.getElementById("myRange1").value },
  u_max_amp: { type: "f", value: document.getElementById("myRange2").value },
  u_amp_power: { type: "f", value: document.getElementById("myRange3").value },
  u_power: { type: "f", value: document.getElementById("myRange4").value },
};

const geometry = new THREE.BufferGeometry();
const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: vertexShader,
  fragmentShader: fragmentShader
});

geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
const points = new THREE.Points(geometry, material);
scene.add(points);

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Light
const light = new THREE.PointLight(0xffffff, 100, 100);
light.position.set(0, 10, 10);
scene.add(light);

// Camera
const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height);
camera.position.z = 10;
scene.add(camera);
camera.add(listener);

// Renderer
const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, depthBuffer: true });

renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);

// Resize
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

window.addEventListener("keydown", onDocumentKeyDown, false);

function onDocumentKeyDown(event) {
  const keyCode = event.which;
  if (keyCode == 32) {
    if (audio.isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }
}

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Loop
let max_avg_freq = 1.0;
let loop_count = 0;

const loop = () => {
  loop_count += 1;
  if (analyserNode) {
    analyserNode.analyser.getByteFrequencyData(dataArray);

    const avg_freq = analyserNode.getAverageFrequency();
    uniforms.u_avg_freq.value = avg_freq;
    if (loop_count >= 1024) {
      max_avg_freq = 1.0;
    }
    if (avg_freq > max_avg_freq) {
      max_avg_freq = avg_freq;
      uniforms.u_max_avg_freq.value = max_avg_freq;
    }
    uniforms.u_data_array.value = dataArray;
  }
  vertices = [];
  particles.forEach(particle => {
    particle.update();
    vertices.push(particle.pos.x, particle.pos.y, particle.pos.z);
  });
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);
}

loop();
