// world.js

// ⬇️ THESE IMPORTS ARE STILL REQUIRED ⬇️
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ────────────────────────────────────────────────────────────────────────────────
//  SCENE & CAMERA SETUP (UNCHANGED)
// ────────────────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 10, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;

document.body.appendChild(renderer.domElement);

// OrbitControls (unchanged)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 2, 0);
controls.zoomSpeed = 10.0;

// ────────────────────────────────────────────────────────────────────────────────
//  TEXTURED SKYBOX (UNCHANGED)
// ────────────────────────────────────────────────────────────────────────────────
const loaderCube = new THREE.CubeTextureLoader();
const skyboxTexture = loaderCube.load([
  "../lib/sky/Daylight Box_Right.bmp",
  "../lib/sky/Daylight Box_Left.bmp",
  "../lib/sky/Daylight Box_Top.bmp",
  "../lib/sky/Daylight Box_Bottom.bmp",
  "../lib/sky/Daylight Box_Front.bmp",
  "../lib/sky/Daylight Box_Back.bmp",
]);
scene.background = skyboxTexture;

// ────────────────────────────────────────────────────────────────────────────────
//  LIGHTS (UNCHANGED, MINUS FIREWORK SOUND SETUP)
// ────────────────────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.1);
dirLight.position.set(30, 50, 20);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

const fountainLight = new THREE.PointLight(0x66ccff, 3, 20);
fountainLight.position.set(0, 5, 0);
scene.add(fountainLight);

const spotLight = new THREE.SpotLight(
  0xff69b4,
  150.0,
  0,
  Math.PI / 7,
  0.25,
  1.0,
);
spotLight.position.set(-10, 15, -10);
spotLight.castShadow = true;
spotLight.shadow.mapSize.set(1024, 1024);
const spotLightTarget = new THREE.Object3D();
spotLightTarget.position.set(-10, 0.5, 10);
scene.add(spotLightTarget);
spotLight.target = spotLightTarget;
scene.add(spotLight);

// ────────────────────────────────────────────────────────────────────────────────
//  CELEBRATORY SOUND LOADING (NEW)
// ────────────────────────────────────────────────────────────────────────────────
const listener = new THREE.AudioListener();
camera.add(listener);

const fireworkSound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
console.log("AudioLoader created. Attempting to load firework_sound.mp3..."); // DEBUG

audioLoader.load(
  "../lib/firework_sound.mp3",
  (buffer) => {
    console.log(
      "AudioLoader: firework_sound.mp3 loaded successfully (buffer received).",
    ); // DEBUG
    fireworkSound.setBuffer(buffer);
    fireworkSound.setLoop(false);
    fireworkSound.setVolume(0.5); // Or 1.0 for testing
    console.log(
      "AudioLoader: Buffer set on fireworkSound. fireworkSound.buffer IS SET:",
      !!fireworkSound.buffer,
    ); // DEBUG
  },
  (xhr) => {
    // onProgress callback
    console.log(
      `AudioLoader: firework_sound.mp3 ${(xhr.loaded / xhr.total) * 100}% loaded`,
    ); // DEBUG - Optional but can be useful
  },
  (err) => {
    console.error("AudioLoader: Error loading firework_sound.mp3:", err); // DEBUG
    if (err.target && err.target.status) {
      console.error(
        `AudioLoader XHR error: Status ${err.target.status} - ${err.target.statusText}`,
      );
    }
  },
);

// ────────────────────────────────────────────────────────────────────────────────
//  FIREFLY PARTICLES (UNCHANGED)
// ────────────────────────────────────────────────────────────────────────────────
let fireflies;
const fireflyCount = 25;
const fireflyGeometry = new THREE.BufferGeometry();
const fireflyPositions = new Float32Array(fireflyCount * 3);
const fireflyVelocities = [];

for (let i = 0; i < fireflyCount; i++) {
  fireflyPositions[i * 3] = (Math.random() - 0.5) * 40;
  fireflyPositions[i * 3 + 1] = Math.random() * 10;
  fireflyPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;

  fireflyVelocities.push(
    (Math.random() - 0.5) * 0.02,
    Math.random() * 0.01 + 0.01,
    (Math.random() - 0.5) * 0.02,
  );
}
fireflyGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(fireflyPositions, 3),
);

const fireflyMaterial = new THREE.PointsMaterial({
  color: 0xffffaa,
  size: 0.2,
  blending: THREE.AdditiveBlending,
  transparent: true,
  opacity: 0.7,
  depthWrite: false,
});
fireflies = new THREE.Points(fireflyGeometry, fireflyMaterial);
scene.add(fireflies);

// ────────────────────────────────────────────────────────────────────────────────
//  GROUND PLANE (UNCHANGED)
// ────────────────────────────────────────────────────────────────────────────────
const groundTexture = new THREE.TextureLoader().load("../lib/grass.jpg");
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(25, 25);
groundTexture.anisotropy = 16;

const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMesh = new THREE.Mesh(groundGeo, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// ────────────────────────────────────────────────────────────────────────────────
//  TREE, BENCH, LAMP, STONE SETUP (UNCHANGED)
// ────────────────────────────────────────────────────────────────────────────────
function createTree(x, z) {
  const group = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 12);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(0, 2.5, 0);
  trunk.castShadow = true;
  group.add(trunk);

  const foliageGeo = new THREE.SphereGeometry(2.5, 16, 16);
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
  const foliage = new THREE.Mesh(foliageGeo, foliageMat);
  foliage.position.set(0, 6, 0);
  foliage.castShadow = true;
  group.add(foliage);

  group.position.set(x, 0, z);
  scene.add(group);
  return group;
}

const trees = [];
trees.push(createTree(-20, -20));
trees.push(createTree(20, -20));
trees.push(createTree(-20, 20));
trees.push(createTree(20, 20));
trees.push(createTree(0, 25));

function createBench(x, z, rotationY = 0) {
  const benchGeo = new THREE.BoxGeometry(4, 0.5, 1.5);
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const bench = new THREE.Mesh(benchGeo, benchMat);
  bench.position.set(x, 0.25, z);
  bench.rotation.y = rotationY;
  bench.castShadow = true;
  scene.add(bench);
  return bench;
}

const benches = [];
benches.push(createBench(-10, 10, Math.PI / 4));
benches.push(createBench(10, 10, -Math.PI / 4));
benches.push(createBench(0, -15, 0));

function createLamp(x, z) {
  const lampGroup = new THREE.Group();

  const poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(0, 4, 0);
  pole.castShadow = true;
  lampGroup.add(pole);

  const bulbGeo = new THREE.SphereGeometry(0.5, 12, 12);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffffaa,
    emissive: 0xffffaa,
    emissiveIntensity: 1.0,
  });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.set(0, 8.5, 0);
  bulb.castShadow = true;
  lampGroup.add(bulb);

  const lampLight = new THREE.PointLight(0xffeeaa, 7.0, 20, 2);
  lampLight.position.set(0, 8.5, 0);
  lampLight.castShadow = true;
  lampGroup.add(lampLight);

  lampGroup.position.set(x, 0, z);
  scene.add(lampGroup);
  return lampGroup;
}

const lamps = [];
lamps.push(createLamp(-15, 0));
lamps.push(createLamp(15, 0));
lamps.push(createLamp(0, -20));
lamps.push(createLamp(0, 20));

const decorativeStones = [];
const stoneGeo = new THREE.SphereGeometry(0.5, 8, 8);
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
for (let i = 0; i < 5; i++) {
  const stone = new THREE.Mesh(stoneGeo, stoneMat);
  const angle = (i / 5) * Math.PI * 2;
  const radius = 5 + Math.random() * 2;
  stone.position.set(Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius);
  stone.castShadow = true;
  scene.add(stone);
  decorativeStones.push(stone);
}

// ────────────────────────────────────────────────────────────────────────────────
//  FOUNTAIN (UNCHANGED)
// ────────────────────────────────────────────────────────────────────────────────
const fountainGroup = new THREE.Group();
const basinGeo = new THREE.CylinderGeometry(5, 5, 1.5, 32);
const basinMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
const basin = new THREE.Mesh(basinGeo, basinMat);
basin.position.set(0, 0.75, 0);
basin.receiveShadow = true;
fountainGroup.add(basin);

const colGeo = new THREE.CylinderGeometry(1, 1, 3, 16);
const colMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
const column = new THREE.Mesh(colGeo, colMat);
column.position.set(0, 2.25, 0);
column.castShadow = true;
fountainGroup.add(column);

const waterGeo = new THREE.SphereGeometry(1, 16, 16);
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x3399ff,
  transparent: true,
  opacity: 0.8,
});
const water = new THREE.Mesh(waterGeo, waterMat);
water.position.set(0, 3.75, 0);
water.castShadow = true;
fountainGroup.add(water);

fountainGroup.position.set(0, 0, 0);
scene.add(fountainGroup);

// ────────────────────────────────────────────────────────────────────────────────
//  GLTF MODEL LOADING (UNCHANGED)
// ────────────────────────────────────────────────────────────────────────────────
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  "../lib/tree.glb",
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(2, 2, 2);
    model.position.set(-5, 0, 5);
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(model);
  },
  undefined,
  (error) => {
    console.error("Error loading GLTF model:", error);
  },
);

// ────────────────────────────────────────────────────────────────────────────────
//  FIREWORK CLASS / ACTIVE ARRAY (NEW)
// ────────────────────────────────────────────────────────────────────────────────
class Firework {
  constructor(position, scene) {
    this.group = new THREE.Group();
    this.sparks = [];
    const sparkCount = 50;
    const origin = position.clone();
    const colorChoices = [0xff0051, 0x00ff66, 0x0055ff, 0xffff00, 0xff7700];

    for (let i = 0; i < sparkCount; i++) {
      const sparkGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const color =
        colorChoices[Math.floor(Math.random() * colorChoices.length)];
      const sparkMat = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 1.0,
        emissive: color,
        emissiveIntensity: 0.8,
      });
      const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
      sparkMesh.position.copy(origin);
      sparkMesh.castShadow = false;
      this.group.add(sparkMesh);

      const speed = 5 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const vx = speed * Math.sin(phi) * Math.cos(theta);
      const vy = speed * Math.cos(phi);
      const vz = speed * Math.sin(phi) * Math.sin(theta);

      const lifetime = 1.5 + Math.random() * 0.5;
      this.sparks.push({
        mesh: sparkMesh,
        velocity: new THREE.Vector3(vx, vy, vz),
        age: 0,
        lifetime,
      });
    }

    scene.add(this.group);
  }

  update(delta) {
    const gravity = new THREE.Vector3(0, -9.8, 0);
    let allDead = true;

    this.sparks.forEach((sparkObj) => {
      const { mesh, velocity } = sparkObj;
      sparkObj.age += delta;
      const t = sparkObj.age / sparkObj.lifetime;

      if (t >= 1.0) {
        mesh.visible = false;
        return;
      } else {
        allDead = false;
      }

      const vDelta = gravity.clone().multiplyScalar(delta);
      velocity.add(vDelta);

      const displacement = velocity.clone().multiplyScalar(delta);
      mesh.position.add(displacement);

      const fade = 1 - t;
      mesh.scale.setScalar(fade);
      mesh.material.opacity = fade;
    });

    return allDead;
  }

  dispose(scene) {
    this.sparks.forEach((sparkObj) => {
      sparkObj.mesh.geometry.dispose();
      sparkObj.mesh.material.dispose();
      this.group.remove(sparkObj.mesh);
    });
    scene.remove(this.group);
  }
}

const activeFireworks = [];

// ────────────────────────────────────────────────────────────────────────────────
//  (A) Define a simple Rocket class
// ────────────────────────────────────────────────────────────────────────────────
class Rocket {
  constructor(startPos, targetY, scene) {
    // Create a tiny “rocket” sphere
    const geo = new THREE.SphereGeometry(0.2, 8, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(startPos);
    scene.add(this.mesh);

    this.targetY = targetY; // where to explode
    this.speed = 15; // units/sec upward
    this.alive = true;
    this.scene = scene;
  }

  update(delta) {
    if (!this.alive) return false;

    this.mesh.position.y += this.speed * delta;

    if (this.mesh.position.y >= this.targetY) {
      const explosionPos = this.mesh.position.clone();
      const fw = new Firework(explosionPos, this.scene);

      // --- DEBUG BLOCK FOR SOUND ---
      console.log(
        "Rocket.update: Rocket reached targetY. Attempting to play sound.",
      ); // DEBUG
      console.log(
        "Rocket.update: fireworkSound.buffer IS SET:",
        !!fireworkSound.buffer,
      ); // DEBUG << CORRECTED
      console.log(
        "Rocket.update: fireworkSound.isPlaying (before play):",
        fireworkSound.isPlaying,
      ); // DEBUG
      console.log(
        "Rocket.update: listener.context.state:",
        listener.context.state,
      ); // DEBUG

      activeFireworks.push(fw);

      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.alive = false;
      return true;
    }
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────────
//  (B) Maintain any active rockets, just like fireworks
// ────────────────────────────────────────────────────────────────────────────────
const activeRockets = [];

window.addEventListener("keydown", (event) => {
  if (event.key === "f" || event.key === "F") {
    console.log("'F' key pressed. Checking AudioContext state..."); // DEBUG
    if (listener.context.state === "suspended") {
      console.log("AudioContext is suspended. Attempting to resume..."); // DEBUG
      listener.context
        .resume()
        .then(() => {
          console.log("AudioContext resumed successfully!"); // DEBUG
          launchRandomRocket();
        })
        .catch((err) => {
          console.error("Failed to resume AudioContext:", err); // DEBUG
        });
    } else {
      console.log(
        "AudioContext state:",
        listener.context.state,
        "- not suspended. Proceeding to launch rocket.",
      ); // DEBUG
      launchRandomRocket();
    }
  }
});

// helper function to pick a random height and push a new Rocket
function launchRandomRocket() {
  // 1) Always start the little rocket at the fountain’s top:
  const startPos = new THREE.Vector3(0, 5, 0); // Or adjust if the fountain's visual origin is slightly different

  // 2) Choose a random explosion height between 15 and 40:
  const minY = 15;
  const maxY = 40;
  const peakY = minY + Math.random() * (maxY - minY);

  // 3) Launch a Rocket that will ascend to peakY, then spawn Firework there
  const rocket = new Rocket(startPos, peakY, scene);
  activeRockets.push(rocket);

  if (fireworkSound.buffer) {
    // If the sound is already playing from a previous quick launch, stop it and restart.
    if (fireworkSound.isPlaying) {
      fireworkSound.stop();
    }
    fireworkSound.play();
  } else {
    console.warn(
      "launchRandomRocket: Firework sound buffer NOT set, cannot play sound.",
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────────
//  ANIMATION LOOP (UPDATED TO INCLUDE FIREWORKS)
// ────────────────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const t = clock.getElapsedTime();

  // Animate fountain water
  water.position.y = 3.75 + Math.sin(t * 2) * 0.5;

  // 1) Update rockets; if done, remove from array
  for (let i = activeRockets.length - 1; i >= 0; i--) {
    const r = activeRockets[i];
    const finished = r.update(delta);
    if (finished) {
      activeRockets.splice(i, 1);
    }
  }

  // 2) Update fireworks (same as before)
  for (let i = activeFireworks.length - 1; i >= 0; i--) {
    const fw = activeFireworks[i];
    const isDone = fw.update(delta);
    if (isDone) {
      fw.dispose(scene);
      activeFireworks.splice(i, 1);
    }
  }

  // Animate fireflies (unchanged)
  const positions = fireflies.geometry.attributes.position.array;
  for (let i = 0; i < fireflyCount; i++) {
    positions[i * 3] += fireflyVelocities[i * 3];
    positions[i * 3 + 1] += fireflyVelocities[i * 3 + 1];
    positions[i * 3 + 2] += fireflyVelocities[i * 3 + 2];

    if (positions[i * 3 + 1] > 12) {
      positions[i * 3 + 1] = Math.random() * 2;
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    if (Math.abs(positions[i * 3]) > 25) fireflyVelocities[i * 3] *= -1;
    if (Math.abs(positions[i * 3 + 2]) > 25) fireflyVelocities[i * 3 + 2] *= -1;
  }
  fireflies.geometry.attributes.position.needsUpdate = true;

  // Render
  controls.update();
  renderer.render(scene, camera);
}

animate();

// ────────────────────────────────────────────────────────────────────────────────
//  RESIZE HANDLER (UNCHANGED)
// ────────────────────────────────────────────────────────────────────────────────
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
