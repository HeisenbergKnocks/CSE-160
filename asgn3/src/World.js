// World.js

// Vertex shader program
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`;

// Fragment shader program
const FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform int u_whichTexture;
  void main() {

    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor; // Use color
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0); // Use UV debug
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV); // Use texture0
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV); // Use texture1
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV); // Use texture2
    } else if (u_whichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV); // Use texture3
    } else if (u_whichTexture == 4) {
      gl_FragColor = texture2D(u_Sampler4, v_UV); // Use texture4
    } else {
      gl_FragColor = vec4(1, .2, .2, 1); // Error, put Redish
    }
  }`;

// Canvas & WebGL context
let canvas, gl;

// Shader attribute locations
let a_Position, a_UV;

// Shader uniform locations
let u_FragColor;
let u_ModelMatrix, u_GlobalRotateMatrix;
let u_ViewMatrix, u_ProjectionMatrix;
let u_whichTexture;
let u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3, u_Sampler4;

let minimapCanvas, minimapCtx;

// Constants for tile types and map dimensions
const TILE_SKY = 0,
  TILE_AMETHYST = 1,
  TILE_BIRCH = 2,
  TILE_CHERRY_LEAVES = 3,
  TILE_ICE = 4;
const MAP_SIZE = 32;

// Application state for animations and input
const state = {
  angles: { global: 30, x: 0, y: 0 },
  mouse: { dragging: false, lastX: -1, lastY: -1, sensitivity: 200 },
  keys: {},
  timers: { lastFrame: performance.now(), start: performance.now() / 1000 },
  verticalOffset: 0,
};

/**
 * Initialize WebGL context and enable depth testing.
 */
function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.error("Failed to get WebGL context");
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

/**
 * Compile shaders and cache individual attribute/uniform locations.
 */
function connectShaders() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.error("Shader initialization failed");
    return;
  }
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  a_UV = gl.getAttribLocation(gl.program, "a_UV");

  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_GlobalRotateMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalRotateMatrix",
  );
  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  u_whichTexture = gl.getUniformLocation(gl.program, "u_whichTexture");

  u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
  u_Sampler1 = gl.getUniformLocation(gl.program, "u_Sampler1");
  u_Sampler2 = gl.getUniformLocation(gl.program, "u_Sampler2");
  u_Sampler3 = gl.getUniformLocation(gl.program, "u_Sampler3");
  u_Sampler4 = gl.getUniformLocation(gl.program, "u_Sampler4");

  // Initialize model matrix to identity
  identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

/**
 * Set up HTML UI event listeners for keyboard, mouse, and slider controls.
 */
function addUIControls() {
  // Angle slider feeds into camera yaw
  let lastSlider = 0;
  document.getElementById("angleSlide").addEventListener("input", (e) => {
    const delta = e.target.value - lastSlider;
    camera.yaw(delta);
    lastSlider = e.target.value;
    renderScene();
  });

  // Track key presses/releases
  ["keydown", "keyup"].forEach((evt) => {
    document.addEventListener(evt, (e) => {
      state.keys[e.code] = evt === "keydown";
    });
  });

  // Pointer-lock for mouse look
  canvas.addEventListener("click", () => canvas.requestPointerLock());
  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === canvas) {
      const lookSpeed = 0.1;
      camera.yaw(-e.movementX * lookSpeed);
      camera.pitch(-e.movementY * lookSpeed);
      renderScene();
    }
  });

  // single keydown listener for block F/G and camera Q/E
  document.addEventListener("keydown", (e) => {
    // --- place/remove blocks with F / G ---
    if (e.code === "KeyF" || e.code === "KeyG") {
      const target = getTargetColumn();
      if (!target) return;
      const column = g_worldGrid[target.z][target.x];
      if (e.code === "KeyF") {
        column.push(TILE_AMETHYST);
      } else if (e.code === "KeyG" && column.length) {
        column.pop();
      }
      renderScene();
    }

    /*
    // --- yaw camera with Q / E ---
    else if (e.code === "KeyQ") {
      camera.yaw(5); // turn left
      renderScene();
    } else if (e.code === "KeyE") {
      camera.yaw(-5); // turn right
      renderScene();
    } */
  });
}

/**
 * Load textures for all tile types, binding each to its sampler.
 */
function initTextures() {
  const sources = [
    "sky.jpg",
    "amethyst.png",
    "birch.png",
    "cherry_leaves.png",
    "ice.png",
  ];

  sources.forEach((fileName, unit) => {
    const img = new Image();
    img.onload = () => {
      // Flip Y, bind to texture unit “unit”, and set parameters
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

      // Point the correct sampler uniform at this texture unit
      switch (unit) {
        case 0:
          gl.uniform1i(u_Sampler0, unit);
          break;
        case 1:
          gl.uniform1i(u_Sampler1, unit);
          break;
        case 2:
          gl.uniform1i(u_Sampler2, unit);
          break;
        case 3:
          gl.uniform1i(u_Sampler3, unit);
          break;
        case 4:
          gl.uniform1i(u_Sampler4, unit);
          break;
      }
    };
    img.src = `../images/${fileName}`;
  });

  return true;
}

/**
 * Handle mouse down/up/move/leave events for click-drag rotations.
 */
function handleMouseDown(ev) {
  if (ev.button !== 0) return;
  const [x, y] = convertCoordinatesEventToGL(ev);
  state.mouse.dragging = true;
  state.mouse.lastX = x;
  state.mouse.lastY = y;
}
function handleMouseUp() {
  state.mouse.dragging = false;
}
function handleMouseMove(ev) {
  if (!state.mouse.dragging) return;
  const [x, y] = convertCoordinatesEventToGL(ev);
  state.angles.y += (x - state.mouse.lastX) * state.mouse.sensitivity;
  state.angles.x += (y - state.mouse.lastY) * state.mouse.sensitivity;
  state.mouse.lastX = x;
  state.mouse.lastY = y;
}
function handleMouseLeave() {
  state.mouse.dragging = false;
}

/**
 * Convert window mouse coordinates to WebGL clip-space [-1,1].
 */
function convertCoordinatesEventToGL(ev) {
  const rect = canvas.getBoundingClientRect();
  return [
    (ev.clientX - rect.left - canvas.width / 2) / (canvas.width / 2),
    (canvas.height / 2 - (ev.clientY - rect.top)) / (canvas.height / 2),
  ];
}

/**
 * Main entry point: initialize everything and start the animation loop.
 */
function main() {
  console.log("main loaded");
  setupWebGL();
  connectShaders();
  addUIControls();
  camera = new Camera(canvas, { speed: 0.3 });
  // Mouse listeners
  canvas.onmousedown = handleMouseDown;
  canvas.onmousemove = handleMouseMove;
  canvas.onmouseup = handleMouseUp;
  canvas.onmouseleave = handleMouseLeave;
  // Scroll to zoom
  canvas.addEventListener("wheel", handleMouseWheel, { passive: false });
  initTextures();
  minimapCanvas = document.getElementById("minimap");
  minimapCtx = minimapCanvas.getContext("2d");
  gl.clearColor(0, 0, 0, 1);
  requestAnimationFrame(tick);
}

/**
 * Zoom camera on mouse wheel scroll
 */
function handleMouseWheel(ev) {
  ev.preventDefault();
  camera.fov = Math.min(100, Math.max(20, camera.fov + ev.deltaY * 0.5));
  camera.updateProjectionMatrix();
  renderScene();
}

/**
 * Animation loop: update camera movement and redraw.
 */
function tick() {
  const now = performance.now();
  const dt = (now - state.timers.lastFrame) / 1000;
  state.timers.lastFrame = now;
  // Continuous WASDQE movement
  if (state.keys.KeyW) camera.moveForward(dt);
  if (state.keys.KeyS) camera.moveBackward(dt);
  if (state.keys.KeyA) camera.moveLeft(dt);
  if (state.keys.KeyD) camera.moveRight(dt);
  if (state.keys.KeyQ) camera.yaw(dt * 70);
  if (state.keys.KeyE) camera.yaw(-dt * 70);
  renderScene();
  requestAnimationFrame(tick);
}

// build a 32×32 grid
// after you’ve declared TILE_ICE, TILE_AMETHYST, MAP_SIZE…
// build a 32×32 grid from worldMap (all amethyst)

// --- map generation: smooth hill ---
const worldMap = [];
for (let z = 0; z < MAP_SIZE; z++) {
  worldMap[z] = [];
  for (let x = 0; x < MAP_SIZE; x++) {
    const dx = x - MAP_SIZE / 2;
    const dz = z - MAP_SIZE / 2;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const maxDist = MAP_SIZE / 2;
    const raw = Math.floor((1 - dist / maxDist) * 5) + 1;
    const h = Math.max(1, raw);
    worldMap[z][x] = h;
  }
}

// build g_worldGrid from worldMap
const g_worldGrid = [];
for (let z = 0; z < MAP_SIZE; z++) {
  g_worldGrid[z] = [];
  for (let x = 0; x < MAP_SIZE; x++) {
    const h = worldMap[z][x];
    g_worldGrid[z][x] = new Array(h).fill(TILE_AMETHYST);
  }
}

function addTree(z0, x0, trunkH = 4) {
  // 1) trunk height ±1 (min 1)
  const deltaH = Math.floor(Math.random() * 3) - 1; // -1, 0 or +1
  const actualH = Math.max(1, trunkH + deltaH);

  // push the wood trunk
  for (let y = 0; y < actualH; y++) {
    g_worldGrid[z0][x0].push(TILE_BIRCH);
  }

  // 2) bottom canopy thickness (bushels): 1–3 layers of a 3×3 square
  const bushels = 1 + Math.floor(Math.random() * 3); // 1, 2 or 3
  for (let layer = 0; layer < bushels; layer++) {
    const y = actualH + 2 + layer;
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const z = z0 + dz,
          x = x0 + dx;
        if (z < 0 || z >= MAP_SIZE || x < 0 || x >= MAP_SIZE) continue;
        g_worldGrid[z][x][y] = TILE_CHERRY_LEAVES;
      }
    }
  }

  // 3) top canopy: same number of leaf‐blocks as bottom bushels
  for (let i = 0; i < bushels; i++) {
    g_worldGrid[z0][x0].push(TILE_CHERRY_LEAVES);
  }
}

// calls remain exactly the same:
addTree(8, 8, 5);
addTree(16, 16, 6);
addTree(24, 12, 4);
addTree(12, 24, 5);
addTree(5, 20, 4);

console.log("g_map", g_worldGrid);

function drawMap(blockSize = 1) {
  // Precompute half-dimensions to center the grid around the origin
  const halfWidth = (MAP_SIZE * blockSize) / 2;
  const halfDepth = (MAP_SIZE * blockSize) / 2;

  // Determine which column the user is pointing at (if any)
  const target = getTargetColumn();

  // Iterate over each grid cell by row (z) and column (x)
  for (let z = 0; z < MAP_SIZE; z++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const columnStack = g_worldGrid[z][x];

      // Render each block in the column stack
      columnStack.forEach((blockType, y) => {
        // Skip any undefined blocks (safety)
        if (blockType === undefined) return;

        // By default, use the block's texture
        let texture = blockType;

        // Highlight the top block of the targeted column
        if (
          target &&
          target.x === x &&
          target.z === z &&
          y === columnStack.length - 1
        ) {
          texture = TILE_ICE;
        }

        // Create a cube for this block and position it in world space
        const cube = new Cube();
        cube.textureNum = texture;
        cube.matrix
          .setIdentity()
          .translate(
            x * blockSize - halfWidth + blockSize / 2,
            y * blockSize - blockSize / 2,
            z * blockSize - halfDepth + blockSize / 2,
          )
          .scale(blockSize, blockSize, blockSize);

        // Draw the cube
        cube.render();
      });
    }
  }
}

function getTargetColumn() {
  // Half the map size to recenter world coordinates
  const halfMap = MAP_SIZE / 2;
  const maxDistance = 20; // Maximum ray length to march
  const stepSize = 0.05; // Ray marching increment for precision

  // Extract camera position and direction
  const [camX, camY, camZ] = camera.eye.elements;
  const { x: dirX, y: dirY, z: dirZ } = camera.getWorldDirection();

  let prevColX = -1,
    prevColZ = -1;

  // March along the ray in small increments
  for (let distance = 0; distance < maxDistance; distance += stepSize) {
    // Compute world-space point at this distance
    const worldX = camX + dirX * distance;
    const worldY = camY + dirY * distance;
    const worldZ = camZ + dirZ * distance;

    // Convert to discrete grid indices
    const colX = Math.floor(worldX + halfMap);
    const colZ = Math.floor(worldZ + halfMap);

    // Skip if outside the map bounds or same column as last tested
    if (
      colX < 0 ||
      colX >= MAP_SIZE ||
      colZ < 0 ||
      colZ >= MAP_SIZE ||
      (colX === prevColX && colZ === prevColZ)
    )
      continue;

    prevColX = colX;
    prevColZ = colZ;

    // Get stack height for this column
    const column = g_worldGrid[colZ][colX];
    const stackHeight = column.length;

    // Check if the ray's height intersects the column's height
    if (worldY >= 0 && worldY <= stackHeight) {
      return { x: colX, z: colZ };
    }
  }

  // No column intersection found
  return null;
}

// Render the scene
function renderScene() {
  // Record frame start time for performance metrics
  const frameStart = performance.now();

  // 1) Upload camera-driven projection and view matrices to GLSL
  gl.uniformMatrix4fv(
    u_ProjectionMatrix,
    false,
    camera.projectionMatrix.elements,
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

  // 2) Apply global vertical offset without rotating the world
  const worldMatrix = new Matrix4().translate(0, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, worldMatrix.elements);

  // 3) Clear buffers and draw the terrain grid
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawMap(1.0);

  // 4) Draw a large sky cube behind the scene
  const sky = new Cube();
  sky.color = [1.0, 0.0, 0.0, 1.0];
  sky.textureNum = TILE_SKY;
  sky.matrix.setIdentity().scale(50, 50, 50);
  sky.render();

  // 5) Position and draw the animal model
  const animalStart = new Matrix4()
    .setIdentity()
    .translate(-14.5, 0.4, 0)
    .scale(1, 1, 1);
  drawAnimal(animalStart);

  // 6) Highlight the top block of the targeted column, if any
  const target = getTargetColumn();
  if (target) {
    const { x, z } = target;
    const y = g_worldGrid[z][x].length - 1;
    const halfMap = MAP_SIZE / 2;

    const highlight = new Cube();
    highlight.textureNum = -2; // default to no texture
    highlight.color = [1, 1, 1, 0.2]; // white with 20% opacity
    highlight.matrix
      .setIdentity()
      .translate(x - halfMap + 0.5, y - 0.5, z - halfMap + 0.5)
      .scale(1.05, 1.05, 1.05);

    // Draw highlight overlay by disabling depth test and enabling blending
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    highlight.render();
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
  }

  // after all your 3D draws…
  drawMiniMap(minimapCtx);

  // 7) Calculate and display frame time and FPS in the HUD
  const frameTime = performance.now() - frameStart;
  const fps = Math.floor(10000 / frameTime) / 10;
  sendTextToHTML(`${Math.floor(frameTime)} ms: ${fps} fps`, "numdot");
}

// Utility function to update FPS counter
function sendTextToHTML(text, htmlID) {
  const elm = document.getElementById(htmlID);
  if (elm) elm.innerHTML = text;
}

function drawMiniMap(ctx) {
  const size = ctx.canvas.width; // assume square
  const cell = (size / MAP_SIZE) | 0; // integer cell size
  ctx.clearRect(0, 0, size, size);

  for (let z = 0; z < MAP_SIZE; z++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      // height = number of blocks in column
      const h = g_worldGrid[z][x].length;
      // map height → shade (1–6 → 40–255)
      const shade = 40 + Math.floor((h / 6) * 215);
      ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
      ctx.fillRect(x * cell, z * cell, cell, cell);
    }
  }

  // Optional: mark camera position
  const half = MAP_SIZE / 2;
  const px = ((camera.eye.elements[0] + half) / MAP_SIZE) * size;
  const pz = ((camera.eye.elements[2] + half) / MAP_SIZE) * size;
  ctx.fillStyle = "red";
  ctx.fillRect(px - cell / 2, pz - cell / 2, cell, cell);
}

function drawAnimal(startMatrix) {
  // — Drawing code below is identical to original —
  const brown = [0.76, 0.55, 0.34, 1.0];
  const lightBrown = [0.85, 0.7, 0.5, 1.0];
  const lighterBrown = [0.92, 0.8, 0.65, 1.0];
  const white = [1.0, 1.0, 1.0, 1.0];

  // BODY
  let body = new Cube();
  body.color = brown;
  body.matrix = new Matrix4(startMatrix);
  body.matrix.translate(0.2, 0, 0);
  body.matrix.scale(0.9, 0.5, 0.6);
  body.render();

  // WOOL
  let wool = new Cube();
  wool.color = white;
  wool.matrix = new Matrix4(startMatrix);
  wool.matrix.translate(0.15, 0, 0);
  wool.matrix.scale(1.1, 0.6, 0.75);
  wool.render();

  // HEAD
  let head = new Cube();
  head.color = brown;
  head.matrix = new Matrix4(body.matrix);
  head.matrix.translate(0.6, 0.65, -0.0);
  head.matrix.rotate(0, 0, 1, 0);
  head.matrix.scale(0.4, 0.85, 0.9);
  head.render();

  // FACE
  let face = new Cube();
  face.color = lighterBrown;
  face.matrix = new Matrix4(head.matrix);
  face.matrix.translate(0.5, 0, 0);
  face.matrix.rotate(90, 0, 1, 0);
  face.matrix.scale(0.9, 0.9, 0.02);
  face.render();

  // LEGS
  const legOffsets = [
    [+0.2, -0.55, +0.27],
    [-0.35, -0.55, +0.27],
    [+0.2, -0.55, -0.3],
    [-0.35, -0.55, -0.3],
  ];
  const legIndexMap = [2, 3, 0, 1];
  legOffsets.forEach((off, idx) => {
    const leg = new Cube();
    leg.color = lightBrown;
    leg.matrix = new Matrix4(body.matrix);
    leg.matrix.translate(...off);
    leg.matrix.rotate(180, 0, 0, 1);
    leg.matrix.scale(0.25, 0.8, 0.25);
    leg.render();
  });

  // EARS
  [
    [0.2, +0.225, 0.45],
    [0.2, +0.225, -0.45],
  ].forEach((off) => {
    const ear = new Cube();
    ear.color = [1, 1, 1, 1];
    ear.matrix = new Matrix4(head.matrix);
    ear.matrix.translate(...off);
    ear.matrix.scale(0.2, 0.2, 0.2);
    ear.render();
  });

  // EYES
  [
    [0.4, 0.25, 0.25],
    [0.4, 0.25, -0.25],
  ].forEach((off) => {
    const eye = new Cube();
    eye.color = [1, 1, 1, 1];
    eye.matrix = new Matrix4(head.matrix);
    eye.matrix.translate(...off);
    eye.matrix.scale(0.3, 0.3, 0.3);
    eye.render();
  });

  // PUPILS
  const pupilOffsets = [
    [0.5, 0.2, 0.25],
    [0.5, 0.2, -0.25],
  ];
  pupilOffsets.forEach((off) => {
    const p = new Cube();
    p.color = [0, 0, 0, 1];
    p.matrix = new Matrix4(head.matrix);
    p.matrix.translate(...off);
    p.matrix.rotate(-90, 0, 1, 0);
    p.matrix.scale(0.125, 0.125, 0.125);
    p.render();
  });

  // UPPER STOUT
  let upperStout = new Cube();
  upperStout.color = lightBrown;
  upperStout.matrix = new Matrix4(head.matrix);
  upperStout.matrix.translate(0.7, -0.04, 0);
  upperStout.matrix.scale(0.39, 0.28, 0.5);
  upperStout.render();

  // LOWER STOUT
  let lowerStout = new Cube();
  lowerStout.color = lightBrown;
  lowerStout.matrix = new Matrix4(head.matrix);
  lowerStout.matrix.translate(0.65, -0.25, 0);
  lowerStout.matrix.rotate(-45, 0, 0, 1);
  lowerStout.matrix.scale(0.415, 0.14, 0.5);
  lowerStout.render();

  // TONGUE
  const tonguePink = [0.96, 0.65, 0.7, 1];
  let tongue = new Cube();
  tongue.color = tonguePink;
  tongue.matrix = new Matrix4(head.matrix);
  tongue.matrix.translate(0.65, -0.15, 0);
  tongue.matrix.rotate(-45, 0, 0, 1);
  tongue.matrix.scale(0.425, 0.028, 0.5);
  tongue.render();
}
