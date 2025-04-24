// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

// global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablestoGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColor) {
    console.log("Failed to get the storage location of u_FragColor");
    return;
  }

  /* // Original comments
  //Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, "u_Size");
  if (!u_Size) {
    console.log("Failed to get the storage location of u_Size");
    return;
  } */

  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  if (!u_ModelMatrix) {
    console.log("Failed to get the storage location of u_ModelMatrix");
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalRotateMatrix",
  );
  if (!u_GlobalRotateMatrix) {
    console.log("Failed to get the storage location of u_GlobalRotateMatrix");
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

//Globals related to UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_globalAngle = 30;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnimation = false; // Original unused animation flags
let g_magentaAnimation = false; // Original unused animation flags
let g_legAngles = [0, 0, 0, 0]; // Indices: 0:FL, 1:BL, 2:FR, 3:BR (Matches HTML Slider IDs)
let g_stoutAngle = -12.5;
let g_tongueAngle = -12.5;

// --- Globals for Mouse Rotation ---
let g_globalAngleX = 0;
let g_globalAngleY = 0;
let g_isDragging = false;
let g_lastMouseX = -1;
let g_lastMouseY = -1;
const g_mouseSensitivity = 200;

// --- Globals for Hop Animation ---
let g_isHopping = false;
let g_hopStartTime = 0;
const g_hopDuration = 0.5;
const g_hopHeight = 0.3;
let g_verticalOffset = 0;

// --- START: Global for Walk Animation ---
let g_walkingAnimation = false; // Animation state flag
// --- END: Global for Walk Animation ---

function addActionsForHtmlUI() {
  // Size Slider Events
  document
    .getElementById("angleSlide")
    .addEventListener("mousemove", function () {
      g_globalAngle = this.value;
      renderScene();
    });

  // Limb Slider Events
  ["leg0Slide", "leg1Slide", "leg2Slide", "leg3Slide"].forEach((id, i) => {
    document.getElementById(id).addEventListener("input", function () {
      // --- Allow manual control only if walk animation is OFF ---
      if (!g_walkingAnimation) {
        g_legAngles[i] = this.value;
        renderScene();
      }
      // --- ---
    });
  });

  // Lower-stout slider (jaw movement)
  document.getElementById("stoutSlide").addEventListener("input", function () {
    g_stoutAngle = parseFloat(this.value);
    if (g_tongueAngle < g_stoutAngle) {
      g_tongueAngle = g_stoutAngle;
      document.getElementById("tongueSlide").value = g_tongueAngle;
    }
    renderScene();
  });

  // Tongue slider
  document.getElementById("tongueSlide").addEventListener("input", function () {
    let requested = parseFloat(this.value);
    if (requested < g_stoutAngle) {
      requested = g_stoutAngle;
      this.value = requested;
    }
    g_tongueAngle = requested;
    renderScene();
  });

  // --- START: Add Walk Button Listener ---
  document.getElementById("walkButton").onclick = function () {
    g_walkingAnimation = !g_walkingAnimation; // Toggle the flag
    // When turning off, legs keep their last animated position
  };
  // --- END: Add Walk Button Listener ---
}

// --- MOUSE EVENT HANDLERS (Unchanged from previous step) ---
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
  let [x, y] = convertCoordinatesEventToGL(ev);
  g_lastMouseX = x;
  g_lastMouseY = y;
  g_isDragging = true;
}
function handleMouseUp(ev) {
  if (ev.button !== 0) return;
  g_isDragging = false;
}
function handleMouseMove(ev) {
  if (!g_isDragging) return;
  let [x, y] = convertCoordinatesEventToGL(ev);
  let deltaX = x - g_lastMouseX;
  let deltaY = y - g_lastMouseY;
  g_globalAngleY += deltaX * g_mouseSensitivity;
  g_globalAngleX += deltaY * g_mouseSensitivity;
  g_lastMouseX = x;
  g_lastMouseY = y;
  // renderScene(); // Implicitly called by tick
}
function handleMouseLeave(ev) {
  g_isDragging = false;
}
// --- END MOUSE EVENT HANDLERS ---

function main() {
  //Set up canvas and gl variables
  setupWebGL();
  //Set up actions for the HTML UI elements
  connectVariablestoGLSL();
  //Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Assign mouse handlers
  canvas.onmousedown = handleMouseDown;
  canvas.onmousemove = handleMouseMove;
  canvas.onmouseup = handleMouseUp;
  canvas.onmouseleave = handleMouseLeave;

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Start the animation loop
  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
  // Update global time
  g_seconds = performance.now() / 1000.0 - g_startTime;

  // Update standard animations (Original unused)
  // updateAnimationAngles(); // Keep commented if not used

  // Update Hop Animation Offset
  if (g_isHopping) {
    let hopTime = g_seconds - g_hopStartTime;
    if (hopTime >= g_hopDuration) {
      g_isHopping = false;
      g_verticalOffset = 0;
    } else {
      let progress = hopTime / g_hopDuration;
      g_verticalOffset = g_hopHeight * Math.sin(progress * Math.PI);
    }
  }

  // --- START: Update Walking Animation ---
  if (g_walkingAnimation) {
    // Leg slider range: min="-25" max="20"
    const minAngle = -25;
    const maxAngle = 20;
    const amplitude = (maxAngle - minAngle) / 2; // 22.5
    const midPoint = (maxAngle + minAngle) / 2; // -2.5
    const walkSpeed = 5; // Adjust for faster/slower walk

    // Front-Left (FL) and Back-Right (BR) move together
    let angleFL_BR = midPoint + amplitude * Math.sin(walkSpeed * g_seconds);
    g_legAngles[0] = angleFL_BR; // Index 0 = FL
    g_legAngles[3] = angleFL_BR; // Index 3 = BR

    // Front-Right (FR) and Back-Left (BL) move together, out of phase
    let angleFR_BL =
      midPoint + amplitude * Math.sin(walkSpeed * g_seconds + Math.PI); // Add PI for phase shift
    g_legAngles[2] = angleFR_BL; // Index 2 = FR
    g_legAngles[1] = angleFR_BL; // Index 1 = BL

    // Optional: Update slider positions visually to match animation
    document.getElementById("leg0Slide").value = g_legAngles[0];
    document.getElementById("leg1Slide").value = g_legAngles[1];
    document.getElementById("leg2Slide").value = g_legAngles[2];
    document.getElementById("leg3Slide").value = g_legAngles[3];
  }
  // --- END: Update Walking Animation ---

  // Draw everything
  renderScene();

  // Tell the browser to update again when it has time
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  // Original function - keep as is unless needed
  if (g_yellowAnimation) {
    g_yellowAngle = 45 * Math.sin(g_seconds);
  }
  if (g_magentaAnimation) {
    g_magentaAngle = 45 * Math.sin(3 * g_seconds);
  }
}

var g_shapesList = []; // Original variable

/* // Original commented variables
var g_points = [];
var g_colors = [];
var g_sizes = []; */

function click(ev) {
  // Original function
  let [x, y] = convertCoordinatesEventToGL(ev);
  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
    point.segments = g_selectedSegments;
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);
  renderScene();
}

function convertCoordinatesEventToGL(ev) {
  // Original function
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();
  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  return [x, y];
}

function renderScene() {
  var startTime = performance.now();

  // --- Apply Global Transformation (Rotation + Hop Translation) --- (Unchanged)
  var rotMat = new Matrix4();
  rotMat.rotate(g_globalAngle, 0, 1, 0);
  rotMat.rotate(g_globalAngleY, 0, 1, 0);
  rotMat.rotate(g_globalAngleX, 1, 0, 0);
  var globalMat = new Matrix4();
  globalMat.translate(0, g_verticalOffset, 0);
  globalMat.multiply(rotMat);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalMat.elements);
  // --- ---

  // Clear the canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // --- START: ALL original drawing code below is UNTOUCHED ---
  const brown = [0.76, 0.55, 0.34, 1.0];
  const lightBrown = [0.85, 0.7, 0.5, 1.0];
  const lighterBrown = [0.92, 0.8, 0.65, 1.0];

  // ——— BODY ———
  var body = new Cube();
  body.color = brown;
  body.matrix = new Matrix4(this.matrix);
  body.matrix.setTranslate(-0.3, -0.2, 0.0);
  body.matrix.scale(0.9, 0.5, 0.6);
  body.render();

  // ——— WOOL ———
  var wool = new Cube();
  wool.matrix = new Matrix4(this.matrix);
  wool.matrix.setTranslate(-0.49, -0.25, -0.08);
  wool.matrix.scale(1.1, 0.6, 0.75);
  wool.render();

  // ——— HEAD ———
  var head = new Cube();
  head.color = brown;
  head.matrix = new Matrix4(body.matrix);
  head.matrix.setTranslate(0.3, 0.3, 0.05);
  head.matrix.scale(0.4, 0.35, 0.5);
  head.render();

  // ——— FACE ———
  var face = new Cube();
  face.color = lighterBrown;
  face.matrix = new Matrix4(head.matrix);
  face.matrix.setTranslate(0.69, 0.3, 0.51);
  face.matrix.rotate(90, 0, 1, 0);
  face.matrix.scale(0.42, 0.3, 0.02);
  face.render();

  // ——— LEGS ———
  // Indices in g_legAngles: 0:FL, 1:BL, 2:FR, 3:BR
  // Offsets order: FR, BR, FL, BL
  const legOffsets = [
    [+0.5, -0.15, +0.37], // FR -> maps to g_legAngles[2]
    [-0.05, -0.15, +0.37], // BR -> maps to g_legAngles[3]
    [+0.5, -0.15, -0.03], // FL -> maps to g_legAngles[0]
    [-0.05, -0.15, -0.03], // BL -> maps to g_legAngles[1]
  ];
  // Map offset index to the correct g_legAngles index
  const legIndexMap = [2, 3, 0, 1];

  legOffsets.forEach(([x, y, z], idx) => {
    const leg = new Cube();
    leg.color = lightBrown;
    leg.matrix = new Matrix4(body.matrix);
    leg.matrix.setTranslate(x, y, z);
    leg.matrix.rotate(180, 0, 0, 1);
    // Use the mapped index to get the correct angle from g_legAngles
    leg.matrix.rotate(g_legAngles[legIndexMap[idx]], 0, 0, 1);
    leg.matrix.scale(0.25, 0.3, 0.25);
    leg.render();
  });

  // ——— EARS ———
  const earOffsets = [
    [0.2, +0.225, 0.84],
    [0.2, +0.225, -0.05],
  ];
  const white = [1.0, 1.0, 1.0, 1.0];
  for (let off of earOffsets) {
    const ear = new Cube();
    ear.color = white;
    ear.matrix = new Matrix4(head.matrix);
    ear.matrix.translate(off[0], off[1], off[2]);
    ear.matrix.scale(0.4, 0.4, 0.2);
    ear.render();
  }

  // ——— EYES ———
  const eyeOffsets = [
    [0.75, 0.5, 0.6],
    [0.75, 0.5, 0.1],
  ];
  for (let off of eyeOffsets) {
    const eye = new Cube();
    eye.color = [1, 1, 1, 1];
    eye.matrix = new Matrix4(head.matrix);
    eye.matrix.translate(off[0], off[1], off[2]);
    eye.matrix.scale(0.3, 0.3, 0.3);
    eye.render();
  }

  // ——— PUPILS ———
  const black = [0.0, 0.0, 0.0, 1.0];
  const purple = [0.6, 0.2, 0.8, 1.0];
  const pupilOffsets = [
    [1.1, 0.6, 0.75],
    [1.1, 0.6, 0.25],
  ];
  pupilOffsets.forEach(([x, y, z]) => {
    const p = new Cylinder();
    p.color = black;
    p.matrix = new Matrix4(head.matrix);
    p.matrix.translate(x, y, z);
    p.matrix.rotate(-90, 0, 1, 0);
    p.matrix.scale(0.125, 0.125, 0.125);
    p.render();
  });

  // UPPER STOUT
  head = new Cube(); // Original re-assignment
  head.color = lightBrown;
  head.matrix = new Matrix4(head.matrix); // Original self-reference
  head.matrix.setTranslate(0.65, 0.375, 0.175);
  head.matrix.scale(0.2, 0.1, 0.25);
  head.render();

  // ——— LOWER STOUT ———
  const lowerStout = new Cube();
  lowerStout.color = lightBrown;
  lowerStout.matrix = new Matrix4(head.matrix); // Original relation
  lowerStout.matrix.setTranslate(0.65, 0.34, 0.175);
  lowerStout.matrix.rotate(g_stoutAngle, 0, 0, 1);
  lowerStout.matrix.scale(0.2, 0.05, 0.25);
  lowerStout.render();

  // ——— TONGUE ———
  const tonguePink = [0.96, 0.65, 0.7, 1.0];
  const tongue = new Cube();
  tongue.color = tonguePink;
  tongue.matrix = new Matrix4(head.matrix); // Original relation
  tongue.matrix.setTranslate(0.65, 0.39, 0.175);
  tongue.matrix.rotate(g_tongueAngle, 0, 0, 1);
  tongue.matrix.scale(0.2, 0.01, 0.25);
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

function sendTextToHTML(text, htmlID) {
  // Original function
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
