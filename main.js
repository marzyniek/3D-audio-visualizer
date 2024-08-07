import * as THREE from 'three';
import "./style.css";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import vertexShader from './shaders/vertex2.glsl';
import fragmentShader from './shaders/fragment.glsl';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const fileInput = document.getElementById('audio-file-input');
const fileNameDisplay = document.getElementById('file-name');

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
analyserNode.analyser.smoothingTimeConstant = 0.8;
analyserNode.analyser.maxDecibels = 255;

function hexToVector3(val) {
  let col = new THREE.Vector3();
  col.x = parseInt(val.slice(1,3), 16) / 255.0
  col.y = parseInt(val.slice(3,5), 16) / 255.0 
  col.z = parseInt(val.slice(5,7), 16) / 255.0 

  return col;
}

const colorPickers = document.querySelectorAll('.color-picker');
colorPickers.forEach(picker => {
  picker.addEventListener('input', (event) => {  
    uniforms.u_color_a.value = hexToVector3(document.getElementById('colorPicker1').value);
    uniforms.u_color_b.value = hexToVector3(document.getElementById('colorPicker2').value);
  });
});

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
// init all particles
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

// Geometry

const uniforms = {
  u_avg_freq: { type: "f", value: 0.0 },
  u_max_avg_freq: { type: "f", value: 1.0 },
  u_data_array: { type: "float[32]", value: dataArray },
  u_base: { type: "vec3", value: new THREE.Vector3(0.0, 0.0, 0.0) },
  u_vert_count: { type: "int", value: 0 },
  u_color_a: { type: "vec3", value: new THREE.Vector3(1.0, 1.0, 1.0) },
  u_color_b: { type: "vec3", value: new THREE.Vector3(1.0, 1.0, 1.0) },
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

// Pause/Play
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
