// BlockyAnimal.js — cleaned up unused variables and code

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
  uniform int u_whichTexture;
  void main() {

    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor; // Use color
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0); // Use UV debug
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV); // Use texture0
    } else {
      gl_FragColor = vec4(1, .2, .2, 1); // Error, put Redish
    }

  }`;

// WebGL context and shader variable locations
let canvas, gl;
let a_Position;
let a_UV;
let camera;
let u_FragColor, u_ModelMatrix, u_GlobalRotateMatrix;

// Animation and interaction state
let g_globalAngle = 30;
let g_globalAngleX = 0,
  g_globalAngleY = 0;
let g_isDragging = false;
let g_lastMouseX = -1,
  g_lastMouseY = -1;
const g_mouseSensitivity = 200;

let g_legAngles = [0, 0, 0, 0];
let g_headTiltAngle = 0;
let g_stoutAngle = -12.5;
let g_tongueAngle = -12.5;

let g_isHopping = false;
let g_hopStartTime = 0;
const g_hopDuration = 0.5;
const g_hopHeight = 0.3;
let g_verticalOffset = 0;

let g_walkingAnimation = false;
let g_startTime = performance.now() / 1000;
let g_seconds = 0;

// Initialize WebGL context
function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log("Failed to get WebGL context");
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

// Compile shaders and get locations
function connectVariablestoGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to initialize shaders.");
    return;
  }
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  a_UV = gl.getAttribLocation(gl.program, "a_UV");
  u_whichTexture = gl.getUniformLocation(gl.program, "u_whichTexture");
  u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_GlobalRotateMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalRotateMatrix",
  );
  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  gl.uniformMatrix4fv(u_ModelMatrix, false, new Matrix4().elements);
}

// Bind UI controls
function addActionsForHtmlUI() {
  document.getElementById("angleSlide").addEventListener("input", function () {
    g_globalAngle = this.value;
    renderScene();
  });

  ["leg0Slide", "leg1Slide", "leg2Slide", "leg3Slide"].forEach((id, i) => {
    document.getElementById(id).addEventListener("input", function () {
      if (!g_walkingAnimation) {
        g_legAngles[i] = this.value;
        renderScene();
      }
    });
  });

  document.getElementById("stoutSlide").addEventListener("input", function () {
    g_stoutAngle = parseFloat(this.value);
    if (g_tongueAngle < g_stoutAngle) {
      g_tongueAngle = g_stoutAngle;
      document.getElementById("tongueSlide").value = g_tongueAngle;
    }
    renderScene();
  });

  document.getElementById("tongueSlide").addEventListener("input", function () {
    let val = parseFloat(this.value);
    if (val < g_stoutAngle) {
      val = g_stoutAngle;
      this.value = val;
    }
    g_tongueAngle = val;
    renderScene();
  });

  document.getElementById("walkButton").onclick = function () {
    g_walkingAnimation = !g_walkingAnimation;
  };

  document
    .getElementById("headTiltSlide")
    .addEventListener("input", function () {
      g_headTiltAngle = this.value;
      renderScene();
    });
}

function initTextures() {
  var image = new Image(); // Create the image object
  if (!image) {
    console.log("Failed to create the image object");
    return false;
  }
  // Register the event handler to be called on loading an image
  image.onload = function () {
    sendImageToTEXTURE0(image);
  };

  // Tell the browser to load an image
  image.src = "../images/sky.jpg";

  return true;
}

function sendImageToTEXTURE0(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log("Failed to create the texture object");
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler0, 0);

  console.log("finished loadTexture");
}

// Mouse event handlers
function handleMouseDown(ev) {
  if (ev.button !== 0) return;
  if (ev.shiftKey) {
    if (!g_isHopping) {
      g_isHopping = true;
      g_hopStartTime = g_seconds;
      g_verticalOffset = 0;
    }
    return;
  }
  const [x, y] = convertCoordinatesEventToGL(ev);
  g_lastMouseX = x;
  g_lastMouseY = y;
  g_isDragging = true;
}
function handleMouseUp() {
  g_isDragging = false;
}
function handleMouseMove(ev) {
  if (!g_isDragging) return;
  const [x, y] = convertCoordinatesEventToGL(ev);
  g_globalAngleY += (x - g_lastMouseX) * g_mouseSensitivity;
  g_globalAngleX += (y - g_lastMouseY) * g_mouseSensitivity;
  g_lastMouseX = x;
  g_lastMouseY = y;
}
function handleMouseLeave() {
  g_isDragging = false;
}

// Coordinate conversion
function convertCoordinatesEventToGL(ev) {
  const rect = ev.target.getBoundingClientRect();
  const x = (ev.clientX - rect.left - canvas.width / 2) / (canvas.width / 2);
  const y = (canvas.height / 2 - (ev.clientY - rect.top)) / (canvas.height / 2);
  return [x, y];
}

// Main entry point
function main() {
  setupWebGL();
  connectVariablestoGLSL();
  addActionsForHtmlUI();

  // Instantiate camera after canvas ready
  camera = new Camera(canvas);

  canvas.onmousedown = handleMouseDown;
  canvas.onmousemove = handleMouseMove;
  canvas.onmouseup = handleMouseUp;
  canvas.onmouseleave = handleMouseLeave;
  document.onkeydown = keydown;

  initTextures();
  gl.clearColor(0, 0, 0, 1);
  requestAnimationFrame(tick);
}

// Animation loop
function tick() {
  g_seconds = performance.now() / 1000 - g_startTime;

  // Hop animation
  if (g_isHopping) {
    const elapsed = (g_seconds - g_hopStartTime) / g_hopDuration;
    if (elapsed >= 1) {
      g_isHopping = false;
      g_verticalOffset = 0;
    } else {
      g_verticalOffset = g_hopHeight * Math.sin(elapsed * Math.PI);
    }
  }

  // Walk animation
  if (g_walkingAnimation) {
    const minA = -25,
      maxA = 20;
    const mid = (maxA + minA) / 2,
      amp = (maxA - minA) / 2,
      speed = 5;
    const angle1 = mid + amp * Math.sin(speed * g_seconds);
    const angle2 = mid + amp * Math.sin(speed * g_seconds + Math.PI);
    g_legAngles[0] = angle1;
    g_legAngles[3] = angle1;
    g_legAngles[2] = angle2;
    g_legAngles[1] = angle2;
    ["leg0Slide", "leg1Slide", "leg2Slide", "leg3Slide"].forEach((id, i) => {
      document.getElementById(id).value = g_legAngles[i];
    });
  }

  renderScene();
  requestAnimationFrame(tick);
}

function keydown(ev) {
  switch (ev.keyCode) {
    case 68: // D  → strafe right
      camera.moveRight();
      break;
    case 65: // A  → strafe left
      camera.moveLeft();
      break;
    case 87: // W  → move forward
      camera.moveForward();
      break;
    case 83: // S  → move backward
      camera.moveBackward();
      break;
    case 37: // ← yaw left
      camera.yaw(5);
      break;
    case 39: // → yaw right
      camera.yaw(-5);
      break;
    case 38: // ↑  pitch up
      camera.pitch(5);
      break;
    case 40: // ↓  pitch down
      camera.pitch(-5);
      break;
  }
  renderScene();
  console.log(ev.keyCode);
}

var g_map = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
];

function drawMap() {
  var wall = new Cube();
  for (i = 0; i < 2; i++) {
    for (x = 0; x < 32; x++) {
      for (y = 0; y < 32; y++) {
        wall.color = [0.8, 1.0, 1.0, 1.0];
        wall.matrix.translate(0, -0.75, 0);
        wall.matrix.scale(0.4, 0.4, 0.4);
        wall.matrix.translate(x - 16, 0, y - 16);
        wall.render();
      }
    }
  }
}

// Render the scene
function renderScene() {
  var startTime = performance.now();

  // Upload camera matrices
  gl.uniformMatrix4fv(
    u_ProjectionMatrix,
    false,
    camera.projectionMatrix.elements,
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

  const rotMat = new Matrix4()
    .rotate(g_globalAngle, 0, 1, 0)
    .rotate(g_globalAngleY, 0, 1, 0)
    .rotate(g_globalAngleX, 1, 0, 0);
  const globalMat = new Matrix4()
    .translate(0, g_verticalOffset, 0)
    .multiply(rotMat);

  // Pass the matrix to u_ModelMatrix attribute
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw the map
  //drawMap();

  // Draw the floor
  var floor = new Cube();
  floor.color = [1.0, 0.0, 0.0, 1.0];
  floor.textureNum = 0;
  floor.matrix.translate(0, -0.75, 0.0);
  floor.matrix.scale(10, 0, 10);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.render();

  // Draw the sky
  var sky = new Cube();
  sky.color = [1.0, 0.0, 0.0, 1.0];
  sky.textureNum = 0;
  sky.matrix.scale(50, 50, 50);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();

  // — Drawing code below is identical to original —
  const brown = [0.76, 0.55, 0.34, 1.0];
  const lightBrown = [0.85, 0.7, 0.5, 1.0];
  const lighterBrown = [0.92, 0.8, 0.65, 1.0];

  // BODY
  let body = new Cube();
  body.color = brown;
  body.matrix = new Matrix4(this.matrix);
  body.matrix.setTranslate(-0.3, -0.2, 0.0);
  body.matrix.scale(0.9, 0.5, 0.6);
  body.render();

  // WOOL
  let wool = new Cube();
  wool.textureNum = 0;
  wool.matrix = new Matrix4(this.matrix);
  wool.matrix.setTranslate(-0.49, -0.25, -0.08);
  wool.matrix.scale(1.1, 0.6, 0.75);
  wool.render();

  // HEAD
  let head = new Cube();
  head.color = brown;
  head.matrix = new Matrix4(body.matrix);
  head.matrix.setTranslate(0.3, 0.3, 0.05);
  head.matrix.rotate(g_headTiltAngle, 0, 1, 0);
  head.matrix.scale(0.4, 0.35, 0.5);
  head.render();

  // FACE
  let face = new Cube();
  face.color = lighterBrown;
  face.matrix = new Matrix4(head.matrix);
  face.matrix.translate(0.99, 0, 0.95);
  face.matrix.rotate(90, 0, 1, 0);
  face.matrix.scale(0.9, 0.9, 0.02);
  face.render();

  // LEGS
  const legOffsets = [
    [+0.5, -0.15, +0.37],
    [-0.05, -0.15, +0.37],
    [+0.5, -0.15, -0.03],
    [-0.05, -0.15, -0.03],
  ];
  const legIndexMap = [2, 3, 0, 1];
  legOffsets.forEach((off, idx) => {
    const leg = new Cube();
    leg.color = lightBrown;
    leg.matrix = new Matrix4(body.matrix);
    leg.matrix.setTranslate(...off);
    leg.matrix.rotate(180, 0, 0, 1);
    leg.matrix.rotate(g_legAngles[legIndexMap[idx]], 0, 0, 1);
    leg.matrix.scale(0.25, 0.3, 0.25);
    leg.render();
  });

  // EARS
  [
    [0.2, +0.225, 0.84],
    [0.2, +0.225, -0.05],
  ].forEach((off) => {
    const ear = new Cube();
    ear.color = [1, 1, 1, 1];
    ear.matrix = new Matrix4(head.matrix);
    ear.matrix.translate(...off);
    ear.matrix.scale(0.4, 0.4, 0.2);
    ear.render();
  });

  // EYES
  [
    [0.75, 0.5, 0.6],
    [0.75, 0.5, 0.1],
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
    [1.1, 0.6, 0.7],
    [1.1, 0.6, 0.2],
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
  upperStout.matrix.translate(1, 0.2, 0.25);
  upperStout.matrix.scale(0.39, 0.28, 0.5);
  upperStout.render();

  // LOWER STOUT
  let lowerStout = new Cube();
  lowerStout.color = lightBrown;
  lowerStout.matrix = new Matrix4(head.matrix);
  lowerStout.matrix.translate(0.955, 0.12, 0.25);
  lowerStout.matrix.rotate(g_stoutAngle, 0, 0, 1);
  lowerStout.matrix.scale(0.415, 0.14, 0.5);
  lowerStout.render();

  // TONGUE
  const tonguePink = [0.96, 0.65, 0.7, 1];
  let tongue = new Cube();
  tongue.color = tonguePink;
  tongue.matrix = new Matrix4(head.matrix);
  tongue.matrix.translate(0.955, 0.25, 0.25);
  tongue.matrix.rotate(g_tongueAngle, 0, 0, 1);
  tongue.matrix.scale(0.425, 0.028, 0.5);
  tongue.render();

  var duration = performance.now() - startTime;
  sendTextToHTML(
    " ms: " +
      Math.floor(duration) +
      " fps: " +
      Math.floor(10000 / duration) / 10,
    "numdot",
  );
}

// Utility function to update FPS counter
function sendTextToHTML(text, htmlID) {
  const elm = document.getElementById(htmlID);
  if (elm) elm.innerHTML = text;
}
